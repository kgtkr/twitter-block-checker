import tweepy
import config
import glob
import json
import is_blocked


def list_split(n: int, list):
    return [list[i:i+n] for i in range(0, len(list), n)]


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

ids_list = []

for user in data.keys():
    if data[user] >= 5:
        ids_list.append(user)

file = open("block", 'a')

for ids in list_split(100, ids_list):
    for user in api.lookup_users(user_ids=ids):
        sn = user.screen_name
        print(f"check:{sn}")
        if is_blocked.is_blocked(sn):
            print(sn)
            file.write(f"block:{sn}")
