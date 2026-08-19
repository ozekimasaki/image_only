# AGENTS.md

このリポジトリで作業するコーディングエージェント向けのガイドです。Discord の指定チャンネルを「画像専用」にする Bot で、ランタイムは [Bun](https://bun.sh/)、言語は TypeScript です。

## プロジェクト構成 / エントリポイント

- エントリポイント: `src/index.ts`
  - Bun 環境変数（`DISCORD_TOKEN` / `DISCORD_CLIENT_ID` / `DISCORD_GUILD_ID`）を読み込み、`discord.js` の `Client` を初期化
  - 起動時に `ensureDataFileExists()` と `loadStore()` を実行し、`Bun.env.DISCORD_TOKEN` が無ければエラー終了
  - `ClientReady` で、`clientId` と `guildId` が両方揃っている場合のみ REST 経由で Guild スラッシュコマンドを登録
  - `InteractionCreate` でスラッシュコマンドを処理し、`MessageCreate` で画像専用チャンネルの自動整形を実行
- コマンド定義: `src/commands/imageonly.ts`
  - `SlashCommandBuilder` による `/imageonly` の定義（`enabled: boolean` 必須、`channel: GuildText` 任意）
  - 実行は管理者権限（`PermissionFlagsBits.Administrator`）を前提とし、実行時にも権限を再確認
- 永続化ユーティリティ: `src/utils/store.ts`
  - `data/image-only.json`（`StoreShape = { guildIdToChannelIds: Record<GuildId, ChannelId[]> }`）を読み書き
  - インメモリキャッシュ `inMemory` を保持し、`add`/`remove` 時にファイルへ書き込み
- 設定ファイル: `package.json`（スクリプト・依存）、`tsconfig.json`（TypeScript 設定）、`.env.sample`（環境変数サンプル）
- 生成データ: `data/`（起動時に自動生成、`.gitignore` で除外）

## セットアップ

```bash
bun install
```

環境変数は `.env` に設定します（Bun が自動読み込み）。`.env.sample` をコピーして利用してください。`.env` および `data/` は `.gitignore` により除外されているためコミットしないでください。

## ビルド / 実行 / テスト / Lint / 型チェック

実在するコマンドのみを以下に示します。

- 実行（開発、ホットリロード）: `bun run dev`
- 実行（通常）: `bun run start`
- 実行（`deploy:guild`。`start` と同一の `bun run src/index.ts`）: `bun run deploy:guild`
- 型チェック: `bunx tsc --noEmit`（`tsconfig.json` を使用）
- ビルド: 専用のビルドスクリプトはなし（Bun が TypeScript を直接実行）
- テスト: テストフレームワーク・テストファイルは未整備（`test` スクリプトなし）
- Lint / フォーマット: ESLint / Prettier / Biome などの設定は未導入

注意: 現時点で `bunx tsc --noEmit` は `src/utils/store.ts` の `Bun.mkdir` 参照に関する既知の型エラーを報告します。コードを変更した際は、少なくとも新たな型エラーを増やしていないことを確認してください。

## コーディング規約

- 言語は TypeScript。`tsconfig.json` は `strict: true`、`module: ESNext`、`moduleResolution: Bundler`、`target: ES2021`
- モジュールは ESM（`package.json` の `"type": "module"`）
- インデントは 2 スペース、文字列はシングルクォート、行末セミコロンありの既存スタイルに合わせる
- Bun のランタイム API（`Bun.env` / `Bun.file` / `Bun.write` など）を使用しており、`discord.js` は v14 系
- ユーザー向けメッセージ・ログ・コメントは日本語で記述されている（既存に合わせる）
- 例外は握りつぶさず、`src/index.ts` の `safeDelete` / `sendTempNotice` のように失敗が許容される箇所のみ意図的に無視する

## 注意点

- `MessageContent` は特権インテントのため、Discord Developer Portal 側で有効化が必要
- Bot には対象チャンネルでのメッセージ管理（削除）・メッセージ送信権限が必要
- スラッシュコマンドは Guild スコープ登録（`clientId` と `guildId` が必要）で即時反映される。両方が無い場合は登録されない
- 設定は `data/image-only.json` に保存され、この JSON を削除すると全ギルドの設定が失われる
- 変更は最小限かつ対象範囲に限定する。テストや Lint が未整備のため、少なくとも型チェック（`bunx tsc --noEmit`）と手動起動での動作確認を行うこと
