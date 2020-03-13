import tweepy
from tweepy.binder import bind_api
from typing import List


def lookup_users_with_blocked_by(api: tweepy.API, ids: List[str]):
    return bind_api(
        api=api,
        path='/users/lookup.json',
        payload_type='user', payload_list=True,
        method='POST',
        allowed_param=['user_id', 'screen_name',
                       'include_entities', 'include_blocked_by']
    )(post_data={"include_blocked_by": "true", "user_id": ids})
