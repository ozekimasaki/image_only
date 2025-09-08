import {
  AttachmentBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  type TextChannel,
} from 'discord.js';
import { imageOnlyCommand } from './commands/imageonly';
import { ensureDataFileExists, getImageOnlyChannelsForGuild, isImageOnlyChannel, loadStore } from './utils/store';

// Ensure data file + load in-memory store at startup
await ensureDataFileExists();
await loadStore();

const token = Bun.env.DISCORD_TOKEN ?? '';
const clientId = Bun.env.DISCORD_CLIENT_ID ?? '';
const guildId = Bun.env.DISCORD_GUILD_ID ?? '';

if (!token) {
  console.error('環境変数 DISCORD_TOKEN が設定されていません。');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`ログイン完了: ${c.user.tag}`);

  // Optional: Guild スコープでコマンド登録（即時反映）
  if (clientId && guildId) {
    try {
      const rest = new REST({ version: '10' }).setToken(token);
      const commandsBody = [imageOnlyCommand.data.toJSON()];
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsBody,
      });
      console.log('Guildスラッシュコマンドを登録しました。');
    } catch (err) {
      console.error('コマンド登録に失敗しました:', err);
    }
  } else {
    console.warn('DISCORD_CLIENT_ID または DISCORD_GUILD_ID が未設定のため、コマンド登録をスキップします。');
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === imageOnlyCommand.data.name) {
    await imageOnlyCommand.execute(interaction);
    return;
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    // 自分/他Botのメッセージは無視
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    // 対象ギルドの画像専用チャンネルかを判定
    if (!isImageOnlyChannel(message.guildId, message.channelId)) return;

    const hasText = Boolean(message.content?.trim());
    const attachments = [...message.attachments.values()];

    // 画像のみ抽出
    const imageAttachments = attachments.filter((a) => {
      const ct = a.contentType ?? '';
      if (ct.startsWith('image/')) return true;
      const name = (a.name ?? '').toLowerCase();
      return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.webp');
    });

    // テキストのみ → 削除
    if (!attachments.length) {
      await safeDelete(message);
      await sendTempNotice(message.channel as TextChannel, 'このチャンネルは画像専用です。テキストのみのメッセージは削除されます。');
      return;
    }

    // 添付はあるが、画像が1つも無い → 削除
    if (attachments.length > 0 && imageAttachments.length === 0) {
      await safeDelete(message);
      await sendTempNotice(message.channel as TextChannel, '画像以外のファイルは許可されていません。');
      return;
    }

    // 画像 + テキスト → テキストを除去して画像だけ再投稿
    if (hasText && imageAttachments.length > 0) {
      const files = imageAttachments.map((a) => ({ attachment: a.url, name: a.name ?? 'image' }));
      await (message.channel as TextChannel).send({ files });
      await safeDelete(message);
      return;
    }

    // 画像のみ → そのまま許可
  } catch (err) {
    console.error('messageCreate処理でエラー:', err);
  }
});

await client.login(token);

async function safeDelete(message: any): Promise<void> {
  try {
    await message.delete();
  } catch (e) {
    // 権限不足など
  }
}

async function sendTempNotice(channel: TextChannel, content: string): Promise<void> {
  try {
    const msg = await channel.send({ content });
    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 5000);
  } catch {}
}


