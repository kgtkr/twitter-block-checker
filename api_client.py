import os
import tweepy


def get_api_client() -> tweepy.API:
    ck = os.environ["ck"]
    cs = os.environ["cs"]
    tk = os.environ["tk"]
    ts = os.environ["ts"]

    auth = tweepy.OAuthHandler(ck, cs)
    auth.set_access_token(tk, ts)
    return tweepy.API(auth)
