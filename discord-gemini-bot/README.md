# 勉強おたすけボット (Study Buddy Bot)

Gemini API を使った Discord ボットです。
スラッシュコマンドで、勉強に役立つ3つの機能が使えます。

## 実装した機能

| コマンド | 機能 |
|---|---|
| `/quiz お題` | 指定したお題(例: 宇宙、日本史)について、Gemini が **3択クイズ** を1問出題します。正解と解説は Discord のネタバレ機能 `\|\|…\|\|` で隠されるので、タップするまで答えが見えません。 |
| `/explain 用語` | 難しい用語(例: ブラックホール、再帰関数)を、Gemini が **小学生にもわかるように** 身近な例えを使って説明します。 |
| `/translate 文章` | 日本語なら英語に、英語なら日本語に **自動判定で翻訳** します。さらに重要な単語・表現のワンポイント解説つきです。 |

### 工夫した点

- **クイズの答えをネタバレタグで隠す**: プロンプトで Gemini に「正解は `||…||` で囲む」ように指示し、Discord 上でクイズとして遊べるようにした
- **応答の遅延対策**: Gemini の応答には数秒かかるため、`defer()` で先に「考え中」状態にしてタイムアウトを防止。API 呼び出しは別スレッド (`asyncio.to_thread`) で実行してボットが固まらないようにした
- **2000文字制限対策**: Discord のメッセージ上限を超えないよう応答を切り詰めている
- **プロンプトで出力フォーマットを固定**: 毎回同じ形式(絵文字の選択肢、訳文+ワンポイントなど)で返ってくるように指示している

## セットアップ手順

### 1. Discord ボットの作成

1. [Discord Developer Portal](https://discord.com/developers/applications) で「New Application」
2. 左メニュー **Bot** → 「Reset Token」でトークンを取得(あとで `.env` に書く)
3. 左メニュー **OAuth2 → URL Generator** で
   - SCOPES: `bot` と `applications.commands` にチェック
   - BOT PERMISSIONS: `Send Messages` にチェック
4. 生成された URL を開いて、自分のサーバーにボットを招待

### 2. Gemini API キーの取得

[Google AI Studio](https://aistudio.google.com/apikey) で API キーを作成。

### 3. 実行

```bash
cd discord-gemini-bot
pip install -r requirements.txt

cp .env.example .env
# .env を開いて DISCORD_TOKEN と GEMINI_API_KEY を書き込む
# GUILD_ID にテスト用サーバーのIDを書くとコマンドが即時反映される

python bot.py
```

`ログインしました: ○○○` と表示されたら起動成功。
Discord で `/quiz`、`/explain`、`/translate` を試してみてください。

> **注意**: `.env`(トークンとAPIキー)は絶対に Git にコミットしないこと。
> このリポジトリの `.gitignore` で除外済みです。
