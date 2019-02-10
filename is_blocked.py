import urllib.request
import json
import config


def is_blocked(screen_name: str)->bool:
    headers = {"content-type": "application/json",
               "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
               "x-csrf-token": config.ct0,
               "cookie": f'auth_token={config.auth_token};ct0={config.ct0};'
               }
    obj = {"variables": json.dumps(
        {"screen_name": screen_name, "withHighlightedLabel": True}), "queryId": "tuUVSRXkII44Y4J7rhbw_g"}

    request = urllib.request.Request(
        "https://api.twitter.com/graphql/tuUVSRXkII44Y4J7rhbw_g", data=json.dumps(obj).encode("utf-8"), method="POST", headers=headers)
    with urllib.request.urlopen(request) as response:
        response_body = response.read().decode("utf-8")
        return json.loads(response_body)["data"]["user"]["legacy"]["blocked_by"]
