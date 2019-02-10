from dotenv import load_dotenv
import os

load_dotenv(".env")

# 環境変数取得
ck = os.environ["ck"]
cs = os.environ["cs"]
tk = os.environ["tk"]
ts = os.environ["ts"]

auth_token = os.environ["auth_token"]
ct0 = os.environ["ct0"]
