# -*- coding: utf-8 -*-
"""
勉強おたすけボット (Study Buddy Bot)

Gemini API を使った Discord ボット。
スラッシュコマンドで「クイズ出題」「用語のやさしい解説」「翻訳」ができる。

必要な環境変数 (.env に書く):
  DISCORD_TOKEN  ... Discord Developer Portal で取得したボットのトークン
  GEMINI_API_KEY ... Google AI Studio で取得した Gemini API キー
  GUILD_ID       ... (任意) テスト用サーバーのID。指定するとコマンドが即時反映される
"""

import asyncio
import os

import discord
from discord import app_commands
from dotenv import load_dotenv
from google import genai

load_dotenv()

DISCORD_TOKEN = os.environ["DISCORD_TOKEN"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
GUILD_ID = os.environ.get("GUILD_ID")  # 任意

MODEL = "gemini-2.5-flash"

gemini = genai.Client(api_key=GEMINI_API_KEY)

intents = discord.Intents.default()
client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)


def ask_gemini(prompt: str) -> str:
    """Gemini にプロンプトを投げて、テキストを返す(同期処理)。"""
    response = gemini.models.generate_content(model=MODEL, contents=prompt)
    text = (response.text or "").strip()
    if not text:
        return "うまく生成できませんでした。もう一度試してみてください。"
    # Discord のメッセージは 2000 文字までなので余裕をもって切り詰める
    return text[:1900]


async def ask_gemini_async(prompt: str) -> str:
    """Gemini 呼び出しは時間がかかるので、別スレッドで実行してボットを止めない。"""
    return await asyncio.to_thread(ask_gemini, prompt)


# ---------------------------------------------------------------- /quiz
@tree.command(name="quiz", description="お題を指定すると Gemini が3択クイズを出題します")
@app_commands.describe(topic="クイズのお題(例: 宇宙、日本史、プログラミング)")
async def quiz(interaction: discord.Interaction, topic: str):
    # Gemini の応答には数秒かかるので、先に「考え中...」の状態にする
    await interaction.response.defer()

    prompt = f"""あなたはクイズ番組の出題者です。
「{topic}」に関する面白い3択クイズを1問だけ日本語で作ってください。

次のフォーマットを必ず守ってください:

**Q. (問題文)**
🇦 (選択肢A)
🇧 (選択肢B)
🇨 (選択肢C)

正解と解説: ||(正解の記号と、2文程度の解説)||

注意: 「正解と解説」の行は必ず || と || で囲んでください(Discordのネタバレ防止機能です)。
それ以外の文章は出力しないでください。"""

    text = await ask_gemini_async(prompt)
    await interaction.followup.send(f"🧠 **お題: {topic}**\n\n{text}")


# ---------------------------------------------------------------- /explain
@tree.command(name="explain", description="難しい用語を Gemini が小学生にもわかるように説明します")
@app_commands.describe(word="説明してほしい用語(例: ブラックホール、再帰関数)")
async def explain(interaction: discord.Interaction, word: str):
    await interaction.response.defer()

    prompt = f"""「{word}」という言葉を、小学生にもわかるように日本語でやさしく説明してください。
・身近なものに例えること
・3〜5文程度で簡潔にまとめること
・最後に「もっと知りたい人向け」として、少しだけ詳しい補足を1文つけること"""

    text = await ask_gemini_async(prompt)
    await interaction.followup.send(f"📖 **{word} とは?**\n\n{text}")


# ---------------------------------------------------------------- /translate
@tree.command(name="translate", description="日本語⇔英語を自動判定して Gemini が翻訳します")
@app_commands.describe(text="翻訳したい文章(日本語でも英語でもOK)")
async def translate(interaction: discord.Interaction, text: str):
    await interaction.response.defer()

    prompt = f"""次の文章を翻訳してください。
・日本語なら自然な英語に、英語なら自然な日本語に翻訳すること
・訳文だけでなく、使われている重要な単語や表現のミニ解説を1〜2個つけること

フォーマット:
**訳文:** (翻訳結果)
**ワンポイント:** (単語・表現の解説)

文章: {text}"""

    result = await ask_gemini_async(prompt)
    await interaction.followup.send(f"🌐 **原文:** {text}\n\n{result}")


# ---------------------------------------------------------------- 起動処理
@client.event
async def on_ready():
    if GUILD_ID:
        # テスト用サーバーを指定すると、スラッシュコマンドが即時に使えるようになる
        guild = discord.Object(id=int(GUILD_ID))
        tree.copy_global_to(guild=guild)
        await tree.sync(guild=guild)
    else:
        # グローバル登録(反映まで最大1時間ほどかかることがある)
        await tree.sync()
    print(f"ログインしました: {client.user}")


if __name__ == "__main__":
    client.run(DISCORD_TOKEN)
