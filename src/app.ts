import { loadState, progress, saveState, sleep } from "./lib";
import Twit from "twit";
import { config } from "dotenv";

config();

async function main() {
  const state = loadState();
  const twit: Twit = new Twit({
    consumer_key: process.env["CK"]!,
    consumer_secret: process.env["CS"]!,
    access_token: process.env["TK"]!,
    access_token_secret: process.env["TS"]!,
    timeout_ms: 60 * 1000,
    strictSSL: true
  });
  while (state.jobs.length !== 0) {
    await progress(twit, state);
    saveState(state);
  }
  console.log("end");
}

(async () => {
  let loop = true;
  while (loop) {
    try {
      await main();
      loop = false;
    } catch (e) {
      console.log(e);
      await sleep(15 * 60 * 1000);
    }
  }
})();
