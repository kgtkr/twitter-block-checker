import * as fs from "fs";
import * as array from "fp-ts/lib/Array";
import * as Twit from "twit";
import { cons } from "fp-ts/lib/ReadonlyNonEmptyArray";

export type Job =
  | { type: "fetchAuthUserId" }
  | {
      type: "fetchFollows";
      cursor: string;
    }
  | {
      type: "fetchFollowsFollows";
      user: string;
      cursor: string;
    }
  | { type: "endFetchFollowsFollows" }
  | {
      type: "checkBlocked";
      users: string[];
    }
  | { type: "endCheckBlocked" };

export type State = {
  jobs: Job[];

  // 認証ユーザーのID
  authUserId: string;

  // フォローの一覧
  follows: Set<string>;

  // フォローのフォロー
  followsFollows: Map<string, Set<string>>;

  // ブロックされていないユーザー
  nonBlockedUsers: Set<string>;

  // ブロックされているユーザー
  blockedUsers: Map<string, { id: string; sn: string; name: string }>;
};

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export async function progress(twit: Twit, state: State): Promise<void> {
  const job = state.jobs.shift();
  if (job === undefined) {
    throw new Error("jobs is empty");
  }
  console.log(`run job:${job.type}`);
  switch (job.type) {
    case "fetchAuthUserId": {
      const res = await twit.get("account/verify_credentials");
      const data = res.data as any;
      const id: string = data.id_str;

      state.authUserId = id;
      state.jobs.push({
        type: "fetchFollows",
        cursor: "-1"
      });
      return;
    }
    case "fetchFollows": {
      await sleep(60 * 1000);
      const res = await twit.get("friends/ids", ({
        user_id: state.authUserId,
        cursor: job.cursor,
        stringify_ids: "true",
        count: "5000"
      } as any) as Twit.Params);
      const data = res.data as any;
      const nextCursor: string = data.next_cursor_str;
      const ids: string[] = data.ids;
      ids.forEach(id => state.follows.add(id));

      if (nextCursor !== "0") {
        state.jobs.unshift({
          type: "fetchFollows",
          cursor: nextCursor
        });
      } else {
        Array.from(state.follows).map(id => {
          state.jobs.push({
            type: "fetchFollowsFollows",
            user: id,
            cursor: "-1"
          });
        });
      }

      state.jobs.push({
        type: "endFetchFollowsFollows"
      });
      return;
    }
    case "fetchFollowsFollows": {
      await sleep(60 * 1000);
      try {
        const res = await twit.get("friends/ids", ({
          user_id: job.user,
          cursor: job.cursor,
          stringify_ids: "true",
          count: "5000"
        } as any) as Twit.Params);
        const data = res.data as any;
        const nextCursor: string = data.next_cursor_str;
        const ids: string[] = data.ids;

        let userFollows_ = state.followsFollows.get(job.user);
        if (userFollows_ === undefined) {
          userFollows_ = new Set();
          state.followsFollows.set(job.user, userFollows_);
        }
        const userFollows = userFollows_;
        ids.forEach(id => {
          userFollows.add(id);
        });

        if (nextCursor !== "0") {
          state.jobs.unshift({
            type: "fetchFollowsFollows",
            user: job.user,
            cursor: nextCursor
          });
        }
        return;
      } catch (e) {
        if (typeof e === "object" && e !== null && e.statusCode === 404) {
          console.log(`${job.user} is not found`);
          return;
        } else {
          throw e;
        }
      }
    }
    case "endFetchFollowsFollows": {
      const users = new Set<string>();
      Array.from(state.followsFollows).forEach(([_, xs]) => {
        Array.from(xs).forEach(x => {
          users.add(x);
        });
      });

      array
        .chunksOf(100)(Array.from(users))
        .forEach(chunks => {
          state.jobs.push({
            type: "checkBlocked",
            users: chunks
          });
        });

      state.jobs.push({
        type: "endCheckBlocked"
      });
      return;
    }
    case "checkBlocked": {
      console.log(
        `残りのjob:${state.jobs.length} ブロられ合計:${state.blockedUsers.size} ブロられてない合計:${state.nonBlockedUsers.size}`
      );
      await sleep(1 * 1000);
      const res = await twit.get("users/lookup", ({
        user_id: job.users.join(","),
        include_blocked_by: "true"
      } as any) as Twit.Params);
      const users: {
        id_str: string;
        name: string;
        screen_name: string;
        blocked_by: boolean | undefined;
      }[] = res.data as any;
      users.forEach(user => {
        if (user.blocked_by) {
          console.log(
            `blocked:${user.name}(${user.id_str}@${user.screen_name})`
          );
          state.blockedUsers.set(user.id_str, {
            id: user.id_str,
            sn: user.screen_name,
            name: user.name
          });
        } else {
          state.nonBlockedUsers.add(user.id_str);
        }
      });
      return;
    }
    case "endCheckBlocked": {
      console.log("result start");
      Array.from(state.blockedUsers).forEach(([_, user]) => {
        console.log(`${user.name}(${user.id}@${user.sn})`);
      });
      console.log("result end");
    }
  }
}

export type SaveData = {
  jobs: Job[];
  authUserId: string;
  follows: string[];
  followsFollows: [string, string[]][];
  nonBlockedUsers: string[];
  blockedUsers: [string, { id: string; sn: string; name: string }][];
};

function toSaveData(state: State): SaveData {
  return {
    jobs: state.jobs,
    authUserId: state.authUserId,
    follows: Array.from(state.follows),
    followsFollows: Array.from(state.followsFollows).map(([k, v]) => [
      k,
      Array.from(v)
    ]),
    nonBlockedUsers: Array.from(state.nonBlockedUsers),
    blockedUsers: Array.from(state.blockedUsers)
  };
}

function fromSaveData(data: SaveData): State {
  return {
    jobs: data.jobs,
    authUserId: data.authUserId,
    follows: new Set(data.follows),
    followsFollows: new Map(
      data.followsFollows.map(([k, v]) => [k, new Set(v)])
    ),
    nonBlockedUsers: new Set(data.nonBlockedUsers),
    blockedUsers: new Map(data.blockedUsers)
  };
}

export function loadState(): State {
  try {
    return fromSaveData(
      JSON.parse(fs.readFileSync("data.json", { encoding: "utf8" }))
    );
  } catch {
    return {
      jobs: [{ type: "fetchAuthUserId" }],
      authUserId: "",
      follows: new Set(),
      followsFollows: new Map(),
      nonBlockedUsers: new Set(),
      blockedUsers: new Map()
    };
  }
}

export function saveState(state: State) {
  fs.writeFileSync("data.json", JSON.stringify(toSaveData(state)));
}
