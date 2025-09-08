type GuildId = string;
type ChannelId = string;

type StoreShape = {
  guildIdToChannelIds: Record<GuildId, ChannelId[]>;
};

const DATA_DIR = 'data';
const DATA_PATH = `${DATA_DIR}/image-only.json`;

function getInitialStore(): StoreShape {
  return { guildIdToChannelIds: {} };
}

export async function ensureDataFileExists(): Promise<void> {
  try {
    await Bun.mkdir(DATA_DIR, { recursive: true });
  } catch {}
  const exists = await Bun.file(DATA_PATH).exists();
  if (!exists) {
    await Bun.write(DATA_PATH, JSON.stringify(getInitialStore(), null, 2));
  }
}

async function readStore(): Promise<StoreShape> {
  try {
    const file = Bun.file(DATA_PATH);
    const text = await file.text();
    const parsed = JSON.parse(text) as StoreShape;
    return {
      guildIdToChannelIds: parsed.guildIdToChannelIds ?? {},
    };
  } catch {
    return getInitialStore();
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await Bun.write(DATA_PATH, JSON.stringify(store, null, 2));
}

let inMemory: StoreShape | null = null;

export async function loadStore(): Promise<void> {
  await ensureDataFileExists();
  inMemory = await readStore();
}

export function isImageOnlyChannel(guildId: GuildId | null, channelId: ChannelId): boolean {
  if (!guildId) return false;
  if (!inMemory) return false;
  const list = inMemory.guildIdToChannelIds[guildId] ?? [];
  return list.includes(channelId);
}

export async function addImageOnlyChannel(guildId: GuildId, channelId: ChannelId): Promise<void> {
  if (!inMemory) await loadStore();
  if (!inMemory) return;
  const list = new Set(inMemory.guildIdToChannelIds[guildId] ?? []);
  list.add(channelId);
  inMemory.guildIdToChannelIds[guildId] = [...list];
  await writeStore(inMemory);
}

export async function removeImageOnlyChannel(guildId: GuildId, channelId: ChannelId): Promise<void> {
  if (!inMemory) await loadStore();
  if (!inMemory) return;
  const list = new Set(inMemory.guildIdToChannelIds[guildId] ?? []);
  list.delete(channelId);
  inMemory.guildIdToChannelIds[guildId] = [...list];
  await writeStore(inMemory);
}

export function getImageOnlyChannelsForGuild(guildId: GuildId): ChannelId[] {
  if (!inMemory) return [];
  return inMemory.guildIdToChannelIds[guildId] ?? [];
}


