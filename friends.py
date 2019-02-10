import tweepy
import config
import time
import json

# 認証
auth = tweepy.OAuthHandler(config.ck, config.cs)
auth.set_access_token(config.tk, config.ts)
api = tweepy.API(auth)

friends_ids = list(tweepy.Cursor(api.friends_ids, user_id=api.me().id).items())

for id in friends_ids:
    retry = True
    while retry:
        retry = False
        time.sleep(40)
        try:
            s = json.dumps(
                list(tweepy.Cursor(api.friends_ids, user_id=id).items()))
            with open(f"friends/{id}.data.json", mode='w') as f:
                f.write(s)
        except tweepy.error.RateLimitError:
            print("rate limit")
            retry = True
            time.sleep(60)
        except Exception as e:
            print(e)
