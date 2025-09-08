## DiscordJS 画像専用チャンネル Bot (Bun)

### 使い方
1. `.env` に以下を設定（Bunは自動で読み込みます）
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID`（Guild即時登録を使う場合）

2. 起動

```bash
bun install
bun run dev
```

### コマンド
- `/imageonly enabled:true channel:#general` 画像専用に設定
- `/imageonly enabled:false channel:#general` 解除

channel を省略した場合は実行したチャンネルが対象。

### 動作仕様（画像専用チャンネル）
- テキストのみ: 削除し一時通知
- 画像以外の添付: 削除し一時通知
- 画像 + テキスト: テキストは除去し、画像のみ再投稿
- 画像のみ: 許可

### データ保存
`data/image-only.json` にギルドごとのチャンネルIDを保存します。


