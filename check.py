import tweepy
import config
import glob
import json
import is_blocked
import time
from retry import retry


def list_split(n: int, list):
    return [list[i:i+n] for i in range(0, len(list), n)]


@retry(delay=60)
def lookup_users(ids):
    return is_blocked.is_blocked(ids)


# 認証
auth = tweepy.OAuthHandler(config.ck, config.cs)
auth.set_access_token(config.tk, config.ts)
api = tweepy.API(auth)

data = {}

for path in glob.glob("friends/*.data.json"):
    with open(path) as f:
        for user in json.loads(f.read()):
            if user in data:
                data[user] += 1
            else:
                data[user] = 1

ids_list = [x[0]
            for x in sorted(data.items(), key=lambda x: x[1], reverse=True)]

file = open("block", 'a')

for ids in list_split(100, ids_list):
    time.sleep(2)
    for user in lookup_users(ids):
        try:
            sn = user.screen_name
            blocked_by = user._json["blocked_by"]
            if blocked_by:
                print(f"block:{sn}")
                file.write(f"{sn}\n")
        except Exception as e:
            print(f"error:{sn}")
            print(e)
            time.sleep(60)
    file.flush()
