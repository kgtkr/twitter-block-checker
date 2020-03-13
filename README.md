# block-checker
「界隈」のアカウントのうち誰からブロックされているかを調べるツールです。
このアプリでの「界隈」とは自分がフォローしているユーザーがフォローしているユーザーです。

## Usage
```sh
$ cp .env.sample .env
$ vim .env
$ npm i
$ npm run build
$ npm start # nohup npm start &
```

もしプロセスが落ちてもデータは永続化されているので再度`npm start`することで続きから処理されます。
`.env`を編集して別のアカウントで調べたい場合や、前回のチェックから時間が経ったので再度調べたい場合は`data.json`を削除する必要があります。
