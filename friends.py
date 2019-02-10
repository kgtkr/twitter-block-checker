import tweepy
import config

# 認証
auth = tweepy.OAuthHandler(config.ck, config.cs)
auth.set_access_token(config.tk, config.ts)
api = tweepy.API(auth)
