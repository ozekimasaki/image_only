# DiscordJS 画像専用チャンネル Bot (Bun)

指定した Discord チャンネルを「画像専用」にする Bot です。画像以外の投稿（テキストのみ・画像以外の添付）を自動的に削除し、画像とテキストが混在した投稿からはテキストを取り除いて画像のみを再投稿します。ランタイムには [Bun](https://bun.sh/) を使用します。

## 主な機能

- `/imageonly` スラッシュコマンドでチャンネルごとに画像専用化を設定/解除
- 画像専用チャンネルでの投稿を監視し、ルールに沿って自動整形
  - テキストのみ: 削除して一時通知（約5秒後に通知も自動削除）
  - 画像以外の添付のみ: 削除して一時通知
  - 画像 + テキスト: テキストを除去し、画像のみを再投稿
  - 画像のみ: そのまま許可
- 設定内容はギルドごとに JSON ファイルへ永続化
- コマンドはサーバー管理者権限を持つメンバーのみ実行可能

## 要件

- [Bun](https://bun.sh/)（`package.json` の `dev`/`start` スクリプトは `bun` を前提）
- Discord Bot アプリケーションと Bot トークン
- Bot に必要な Gateway Intents: `Guilds`、`GuildMessages`、`MessageContent`
  - `MessageContent` は特権インテントのため、Discord Developer Portal で有効化が必要
- 投稿を削除・再投稿するためのチャンネル権限（メッセージ管理・メッセージ送信）

## インストール

```bash
bun install
```

## 設定

`.env` に以下を設定します（Bun は `.env` を自動で読み込みます）。`.env.sample` を参考にしてください。

- `DISCORD_TOKEN`: Bot トークン（必須）
- `DISCORD_CLIENT_ID`: アプリケーションのクライアント ID（Guild コマンド登録に使用）
- `DISCORD_GUILD_ID`: コマンドを即時登録したいギルドの ID（Guild スコープ登録に使用）

`DISCORD_TOKEN` が未設定の場合、起動時にエラー終了します。`DISCORD_CLIENT_ID` と `DISCORD_GUILD_ID` の両方が設定されている場合のみ、起動時に Guild スコープでスラッシュコマンドを登録します（即時反映）。どちらかが欠けている場合はコマンド登録をスキップします。

## 使い方

```bash
bun run dev
```

Bot が起動しコマンドが登録されたら、Discord 上で以下のように実行します。

- `/imageonly enabled:true channel:#general` — 指定チャンネルを画像専用に設定
- `/imageonly enabled:false channel:#general` — 指定チャンネルの画像専用を解除

`channel` を省略した場合は、コマンドを実行したチャンネルが対象になります。コマンドはギルド内でのみ使用でき、対象はテキストチャンネルである必要があります。

## 開発コマンド

| コマンド | 説明 |
| --- | --- |
| `bun install` | 依存関係のインストール |
| `bun run dev` | ホットリロード付きで Bot を起動（`bun run --hot src/index.ts`） |
| `bun run start` | Bot を起動（`bun run src/index.ts`） |
| `bun run deploy:guild` | Bot を起動（`bun run src/index.ts`。`start` と同じエントリポイント） |
| `bunx tsc --noEmit` | 型チェック（`tsconfig.json` を使用） |

テストや Lint 用のスクリプト・設定は現時点では用意されていません。

## 構成

```
.
├── src/
│   ├── index.ts              # エントリポイント。クライアント初期化・イベント処理・コマンド登録・自動整形ロジック
│   ├── commands/
│   │   └── imageonly.ts       # /imageonly スラッシュコマンドの定義と実行
│   └── utils/
│       └── store.ts           # 設定の読み書き（data/image-only.json への永続化）
├── .env.sample                # 環境変数のサンプル
├── package.json               # スクリプト・依存関係
├── tsconfig.json              # TypeScript 設定
└── LICENSE                    # MIT ライセンス
```

## データ保存

画像専用チャンネルの設定はギルドごとに `data/image-only.json` に保存されます。ファイルとディレクトリは起動時に存在しなければ自動作成され、`data/` は `.gitignore` によりバージョン管理から除外されています。

## ライセンス

MIT License. 詳細は [LICENSE](./LICENSE) を参照してください。
