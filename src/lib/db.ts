import { supabase } from './supabase';
import type { WorldData, Scene, NpcTemplate, ItemTemplate, SceneEntityRef } from '../types/map';

// ---- DB row types (matching actual Supabase schema) ----

interface DbScene {
  id: string;
  name: string;
  description: string;
  environment: string;
  safe_zone: boolean;
  exits: Record<string, string>;
  level_min: number | null;
  level_max: number | null;
}

interface DbSceneEntity {
  id?: number;
  scene_id: string;
  template_id: string;
  entity_type: 'npc' | 'item';
  quantity: number | null;
  visible: boolean | null;
  tags: string[] | null;
}

interface DbNpcTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[] | null;
  visible: boolean | null;
  level: number | null;
  realm: string | null;
  hp: number | null;
  max_hp: number | null;
  mp: number | null;
  max_mp: number | null;
  attack: number | null;
  defense: number | null;
  speed: number | null;
  ai: string | null;
  dialogue: string | null;
  drop: string[] | null;
}

interface DbItemTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[] | null;
  icon: string | null;
  visible: boolean | null;
  rarity: string | null;
  stackable: boolean | null;
  max_stack: number | null;
  value: number | null;
  weight: number | null;
  usable: boolean | null;
  effect: { type: string; value?: number } | null;
  equip_slot: string | null;
  bonuses: Record<string, number> | null;
}

// ---- Converters ----

function dbSceneToScene(row: DbScene, entities: DbSceneEntity[]): Scene {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    environment: row.environment as Scene['environment'],
    safe_zone: row.safe_zone,
    exits: row.exits ?? {},
    level_range:
      row.level_min != null && row.level_max != null
        ? [row.level_min, row.level_max]
        : undefined,
    entities: entities.map((e): SceneEntityRef => ({
      template_id: e.template_id,
      type: e.entity_type,
      quantity: e.quantity ?? undefined,
      visible: e.visible ?? undefined,
      tags: e.tags ?? undefined,
    })),
  };
}

function sceneToDbRow(scene: Scene): DbScene {
  return {
    id: scene.id,
    name: scene.name,
    description: scene.description,
    environment: scene.environment,
    safe_zone: scene.safe_zone,
    exits: scene.exits,
    level_min: scene.level_range?.[0] ?? null,
    level_max: scene.level_range?.[1] ?? null,
  };
}

function sceneEntitiesToDbRows(
  sceneId: string,
  entities: SceneEntityRef[],
): Omit<DbSceneEntity, 'id'>[] {
  return entities.map((e) => ({
    scene_id: sceneId,
    template_id: e.template_id,
    entity_type: e.type,
    quantity: e.quantity ?? null,
    visible: e.visible ?? null,
    tags: e.tags ?? null,
  }));
}

function dbNpcToNpc(row: DbNpcTemplate): NpcTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tags: row.tags ?? undefined,
    visible: row.visible ?? undefined,
    level: row.level ?? undefined,
    realm: row.realm ?? undefined,
    hp: row.hp ?? undefined,
    max_hp: row.max_hp ?? undefined,
    mp: row.mp ?? undefined,
    max_mp: row.max_mp ?? undefined,
    attack: row.attack ?? undefined,
    defense: row.defense ?? undefined,
    speed: row.speed ?? undefined,
    ai: (row.ai as NpcTemplate['ai']) ?? undefined,
    dialogue: row.dialogue ?? undefined,
    drop: row.drop ?? undefined,
  };
}

function npcToDbRow(npc: NpcTemplate): DbNpcTemplate {
  return {
    id: npc.id,
    name: npc.name,
    description: npc.description,
    tags: npc.tags ?? null,
    visible: npc.visible ?? null,
    level: npc.level ?? null,
    realm: npc.realm ?? null,
    hp: npc.hp ?? null,
    max_hp: npc.max_hp ?? null,
    mp: npc.mp ?? null,
    max_mp: npc.max_mp ?? null,
    attack: npc.attack ?? null,
    defense: npc.defense ?? null,
    speed: npc.speed ?? null,
    ai: npc.ai ?? null,
    dialogue: npc.dialogue ?? null,
    drop: npc.drop ?? null,
  };
}

function dbItemToItem(row: DbItemTemplate): ItemTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tags: row.tags ?? undefined,
    icon: row.icon ?? undefined,
    visible: row.visible ?? undefined,
    rarity: (row.rarity as ItemTemplate['rarity']) ?? undefined,
    stackable: row.stackable ?? undefined,
    max_stack: row.max_stack ?? undefined,
    value: row.value ?? undefined,
    weight: row.weight ?? undefined,
    usable: row.usable ?? undefined,
    effect: row.effect ?? undefined,
    equip_slot: (row.equip_slot as ItemTemplate['equip_slot']) ?? undefined,
    bonuses: row.bonuses ?? undefined,
  };
}

function itemToDbRow(item: ItemTemplate): DbItemTemplate {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    tags: item.tags ?? null,
    icon: item.icon ?? null,
    visible: item.visible ?? null,
    rarity: item.rarity ?? null,
    stackable: item.stackable ?? null,
    max_stack: item.max_stack ?? null,
    value: item.value ?? null,
    weight: item.weight ?? null,
    usable: item.usable ?? null,
    effect: item.effect ?? null,
    equip_slot: item.equip_slot ?? null,
    bonuses: item.bonuses ?? null,
  };
}

// ---- Read ----

export async function loadWorld(): Promise<WorldData> {
  const [scenesRes, entitiesRes, npcsRes, itemsRes] = await Promise.all([
    supabase.from('scenes').select('*'),
    supabase.from('scene_entities').select('*'),
    supabase.from('npc_templates').select('*'),
    supabase.from('item_templates').select('*'),
  ]);

  if (scenesRes.error) throw scenesRes.error;
  if (entitiesRes.error) throw entitiesRes.error;
  if (npcsRes.error) throw npcsRes.error;
  if (itemsRes.error) throw itemsRes.error;

  // Group entities by scene_id
  const entityMap = new Map<string, DbSceneEntity[]>();
  for (const e of entitiesRes.data as DbSceneEntity[]) {
    const list = entityMap.get(e.scene_id) ?? [];
    list.push(e);
    entityMap.set(e.scene_id, list);
  }

  const scenes: Record<string, Scene> = {};
  for (const row of scenesRes.data as DbScene[]) {
    scenes[row.id] = dbSceneToScene(row, entityMap.get(row.id) ?? []);
  }

  const npcs: Record<string, NpcTemplate> = {};
  for (const row of npcsRes.data as DbNpcTemplate[]) {
    npcs[row.id] = dbNpcToNpc(row);
  }

  const items: Record<string, ItemTemplate> = {};
  for (const row of itemsRes.data as DbItemTemplate[]) {
    items[row.id] = dbItemToItem(row);
  }

  return { scenes, npcs, items };
}

// ---- Scene CRUD ----

export async function upsertScene(scene: Scene): Promise<void> {
  const dbRow = sceneToDbRow(scene);
  const entities = sceneEntitiesToDbRows(scene.id, scene.entities);

  const { error: sceneErr } = await supabase
    .from('scenes')
    .upsert(dbRow, { onConflict: 'id' });
  if (sceneErr) throw sceneErr;

  const { error: delErr } = await supabase
    .from('scene_entities')
    .delete()
    .eq('scene_id', scene.id);
  if (delErr) throw delErr;

  if (entities.length > 0) {
    const { error: insErr } = await supabase
      .from('scene_entities')
      .insert(entities);
    if (insErr) throw insErr;
  }
}

export async function deleteScene(sceneId: string): Promise<void> {
  const { error } = await supabase.from('scenes').delete().eq('id', sceneId);
  if (error) throw error;
}

// ---- NPC CRUD ----

export async function upsertNpc(npc: NpcTemplate): Promise<void> {
  const { error } = await supabase
    .from('npc_templates')
    .upsert(npcToDbRow(npc), { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteNpc(npcId: string): Promise<void> {
  const { error } = await supabase.from('npc_templates').delete().eq('id', npcId);
  if (error) throw error;
}

// ---- Item CRUD ----

export async function upsertItem(item: ItemTemplate): Promise<void> {
  const { error } = await supabase
    .from('item_templates')
    .upsert(itemToDbRow(item), { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('item_templates').delete().eq('id', itemId);
  if (error) throw error;
}

// ---- Bulk save ----

export async function saveWorld(worldData: WorldData): Promise<void> {
  const [existingScenesRes, existingNpcsRes, existingItemsRes] = await Promise.all([
    supabase.from('scenes').select('id'),
    supabase.from('npc_templates').select('id'),
    supabase.from('item_templates').select('id'),
  ]);

  const existingSceneIds = new Set(
    (existingScenesRes.data ?? []).map((r: { id: string }) => r.id),
  );
  const existingNpcIds = new Set(
    (existingNpcsRes.data ?? []).map((r: { id: string }) => r.id),
  );
  const existingItemIds = new Set(
    (existingItemsRes.data ?? []).map((r: { id: string }) => r.id),
  );

  const currentSceneIds = new Set(Object.keys(worldData.scenes));
  const currentNpcIds = new Set(Object.keys(worldData.npcs));
  const currentItemIds = new Set(Object.keys(worldData.items));

  // Delete removed entries
  const scenesToDel = [...existingSceneIds].filter((id) => !currentSceneIds.has(id));
  const npcsToDel = [...existingNpcIds].filter((id) => !currentNpcIds.has(id));
  const itemsToDel = [...existingItemIds].filter((id) => !currentItemIds.has(id));

  await Promise.all([
    ...scenesToDel.map((id) => deleteScene(id)),
    ...npcsToDel.map((id) => deleteNpc(id)),
    ...itemsToDel.map((id) => deleteItem(id)),
  ]);

  // Upsert all current data
  await Promise.all([
    ...Object.values(worldData.scenes).map((s) => upsertScene(s)),
    ...Object.values(worldData.npcs).map((n) => upsertNpc(n)),
    ...Object.values(worldData.items).map((i) => upsertItem(i)),
  ]);
}
