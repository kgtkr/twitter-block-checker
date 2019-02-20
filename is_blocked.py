import tweepy
import config
from tweepy.binder import bind_api
from tweepy.utils import list_to_csv
import config


def is_blocked(ids):
    auth = tweepy.OAuthHandler(config.ck, config.cs)
    auth.set_access_token(config.tk, config.ts)
    api = tweepy.API(auth)

    return bind_api(
        api=api,
        path='/users/lookup.json',
        payload_type='user', payload_list=True,
        method='POST',
        allowed_param=['user_id', 'screen_name',
                       'include_entities', 'include_blocked_by']
    )(post_data={"include_blocked_by": "true", "user_id": ids})
