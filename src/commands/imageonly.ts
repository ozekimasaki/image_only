import {
  ChatInputCommandInteraction,
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import {
  addImageOnlyChannel,
  removeImageOnlyChannel,
  getImageOnlyChannelsForGuild,
} from '../utils/store';

export const imageOnlyCommand = {
  data: new SlashCommandBuilder()
    .setName('imageonly')
    .setDescription('指定したチャンネルを画像専用に設定/解除します')
    .addBooleanOption((opt) =>
      opt
        .setName('enabled')
        .setDescription('true で画像専用化、false で解除')
        .setRequired(true)
    )
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('対象のチャンネル（省略時は実行中チャンネル）')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts([InteractionContextType.Guild]),

  async execute(interaction: ChatInputCommandInteraction) {
    const enabled = interaction.options.getBoolean('enabled')!;
    const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel | null;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: 'テキストチャンネルで実行してください。', flags: MessageFlags.Ephemeral });
      return;
    }

    if (!interaction.guildId) {
      await interaction.reply({ content: 'ギルド内でのみ使用可能です。', flags: MessageFlags.Ephemeral });
      return;
    }

    // 追加の安全策: 実行時にも管理者権限を確認
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'このコマンドはサーバー管理者のみが実行できます。', flags: MessageFlags.Ephemeral });
      return;
    }

    if (enabled) {
      addImageOnlyChannel(interaction.guildId, channel.id);
      await interaction.reply({ content: `#${channel.name} を画像専用に設定しました。`, flags: MessageFlags.Ephemeral });
    } else {
      removeImageOnlyChannel(interaction.guildId, channel.id);
      await interaction.reply({ content: `#${channel.name} の画像専用を解除しました。`, flags: MessageFlags.Ephemeral });
    }

    const list = getImageOnlyChannelsForGuild(interaction.guildId);
    const tags = list.map((id) => (id === channel.id ? `**#${channel.name}**` : `<#${id}>`)).join(', ') || 'なし';
    await interaction.followUp({ content: `現在の画像専用チャンネル: ${tags}`, flags: MessageFlags.Ephemeral });
  },
};


