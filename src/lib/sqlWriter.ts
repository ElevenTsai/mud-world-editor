/**
 * SQL Writer: serializes WorldData objects back to PostgreSQL INSERT statements
 * that match the format of the seed SQL files.
 */
import type {
  WorldData,
  Scene,
  NpcTemplate,
  ItemTemplate,
  SceneEntityRef,
} from '../types/map';

// ---- Area prefix → filename mapping (from shared config) ----

import { getAreaInfo, getAreaPrefix as _getAreaPrefix } from '../utils/areaConfig';

function getAreaPrefix(id: string): string {
  return _getAreaPrefix(id);
}

function getFileName(prefix: string): string {
  return getAreaInfo(prefix).fileName;
}

function getAreaLabel(prefix: string): string {
  const info = getAreaInfo(prefix);
  return `${info.label} (${prefix}_)`;
}

// ---- SQL value formatting ----

function sqlStr(value: string | undefined | null): string {
  if (value == null) return 'NULL';
  return "'" + value.replace(/'/g, "''") + "'";
}

function sqlBool(value: boolean | undefined | null): string {
  if (value == null) return 'NULL';
  return value ? 'true' : 'false';
}

function sqlNum(value: number | undefined | null): string {
  if (value == null) return 'NULL';
  return String(value);
}

function sqlArray(arr: string[] | undefined | null): string {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]";
  const items = arr.map(s => "'" + s.replace(/'/g, "''") + "'").join(',');
  return `ARRAY[${items}]::text[]`;
}

function sqlJson(value: unknown): string {
  if (value == null) return 'NULL';
  const json = JSON.stringify(value);
  return "'" + json.replace(/'/g, "''") + "'::jsonb";
}

// ---- Table writers ----

function writeNpcInserts(npcs: NpcTemplate[]): string {
  if (npcs.length === 0) return '';
  const header = 'INSERT INTO npc_templates (id, name, description, tags, visible, level, realm, hp, max_hp, mp, max_mp, attack, defense, speed, ai, dialogue, "drop") VALUES';
  const rows = npcs.map(n => {
    const dropStr = n.drop && n.drop.length > 0 ? sqlStr(n.drop[0]) : sqlStr('{}');
    return `  (${sqlStr(n.id)}, ${sqlStr(n.name)}, ${sqlStr(n.description)}, ${sqlArray(n.tags)}, ${sqlBool(n.visible)}, ${sqlNum(n.level)}, ${sqlStr(n.realm)}, ${sqlNum(n.hp)}, ${sqlNum(n.max_hp)}, ${sqlNum(n.mp)}, ${sqlNum(n.max_mp)}, ${sqlNum(n.attack)}, ${sqlNum(n.defense)}, ${sqlNum(n.speed)}, ${sqlStr(n.ai)}, ${sqlStr(n.dialogue)}, ${dropStr})`;
  });
  return header + '\n' + rows.join(',\n') + ';\n';
}

function writeItemInserts(items: ItemTemplate[]): string {
  if (items.length === 0) return '';
  const header = 'INSERT INTO item_templates (id, name, description, tags, icon, visible, rarity, stackable, max_stack, value, weight, usable, effect, equip_slot, bonuses) VALUES';
  const rows = items.map(item => {
    return `  (${sqlStr(item.id)}, ${sqlStr(item.name)}, ${sqlStr(item.description)}, ${sqlArray(item.tags)}, ${sqlStr(item.icon)}, ${sqlBool(item.visible)}, ${sqlStr(item.rarity)}, ${sqlBool(item.stackable)}, ${sqlNum(item.max_stack)}, ${sqlNum(item.value)}, ${sqlNum(item.weight)}, ${sqlBool(item.usable)}, ${sqlJson(item.effect)}, ${sqlStr(item.equip_slot as string | undefined)}, ${sqlJson(item.bonuses)})`;
  });
  return header + '\n' + rows.join(',\n') + ';\n';
}

function writeSceneInserts(scenes: Scene[]): string {
  if (scenes.length === 0) return '';
  const header = 'INSERT INTO scenes (id, name, description, safe_zone, environment, level_min, level_max, exits) VALUES';
  const rows = scenes.map(s => {
    const exitsJson = sqlStr(JSON.stringify(s.exits));
    return `  (${sqlStr(s.id)}, ${sqlStr(s.name)}, ${sqlStr(s.description)}, ${sqlBool(s.safe_zone)}, ${sqlStr(s.environment)}, ${sqlNum(s.level_range?.[0])}, ${sqlNum(s.level_range?.[1])}, ${exitsJson})`;
  });
  return header + '\n' + rows.join(',\n') + ';\n';
}

function writeSceneEntityInserts(scenes: Scene[]): string {
  const allEntities: { sceneId: string; entity: SceneEntityRef }[] = [];
  for (const scene of scenes) {
    for (const entity of scene.entities) {
      allEntities.push({ sceneId: scene.id, entity });
    }
  }
  if (allEntities.length === 0) return '';

  const header = 'INSERT INTO scene_entities (scene_id, template_id, entity_type, quantity, tags, visible) VALUES';
  const rows = allEntities.map(({ sceneId, entity }) => {
    return `  (${sqlStr(sceneId)}, ${sqlStr(entity.template_id)}, ${sqlStr(entity.type)}, ${sqlNum(entity.quantity)}, ${sqlArray(entity.tags)}, ${sqlBool(entity.visible)})`;
  });
  return header + '\n' + rows.join(',\n') + ';\n';
}

// ---- Public API ----

/**
 * Group WorldData by area prefix and generate SQL file contents.
 * Also accepts preserved sections (quests, comments) per file to re-include.
 */
export function worldDataToSqlFiles(
  data: WorldData,
  preservedSections?: Record<string, string>,
): Record<string, string> {
  // Group scenes by area prefix
  const scenesByArea = new Map<string, Scene[]>();
  for (const scene of Object.values(data.scenes)) {
    const prefix = getAreaPrefix(scene.id);
    const list = scenesByArea.get(prefix) ?? [];
    list.push(scene);
    scenesByArea.set(prefix, list);
  }

  // Collect all area prefixes (from scenes, npcs, items)
  const allPrefixes = new Set<string>();
  for (const scene of Object.values(data.scenes)) allPrefixes.add(getAreaPrefix(scene.id));

  // Group NPCs by the area they belong to (based on scene entities)
  const npcAreaMap = new Map<string, Set<string>>();
  for (const scene of Object.values(data.scenes)) {
    const prefix = getAreaPrefix(scene.id);
    for (const entity of scene.entities) {
      if (entity.type === 'npc') {
        if (!npcAreaMap.has(entity.template_id)) npcAreaMap.set(entity.template_id, new Set());
        npcAreaMap.get(entity.template_id)!.add(prefix);
      }
    }
  }

  // Group Items by the area they belong to (based on scene entities)
  const itemAreaMap = new Map<string, Set<string>>();
  for (const scene of Object.values(data.scenes)) {
    const prefix = getAreaPrefix(scene.id);
    for (const entity of scene.entities) {
      if (entity.type === 'item') {
        if (!itemAreaMap.has(entity.template_id)) itemAreaMap.set(entity.template_id, new Set());
        itemAreaMap.get(entity.template_id)!.add(prefix);
      }
    }
  }

  // For NPCs/items not referenced by any scene entity, use their own ID prefix
  for (const npc of Object.values(data.npcs)) {
    if (!npcAreaMap.has(npc.id)) {
      npcAreaMap.set(npc.id, new Set([getAreaPrefix(npc.id)]));
    }
  }
  for (const item of Object.values(data.items)) {
    if (!itemAreaMap.has(item.id)) {
      itemAreaMap.set(item.id, new Set([getAreaPrefix(item.id)]));
    }
  }

  // Assign each NPC to its primary area (first one alphabetically)
  const npcsByArea = new Map<string, NpcTemplate[]>();
  for (const [npcId, areas] of npcAreaMap) {
    const npc = data.npcs[npcId];
    if (!npc) continue;
    const primaryArea = [...areas].sort()[0];
    const list = npcsByArea.get(primaryArea) ?? [];
    list.push(npc);
    npcsByArea.set(primaryArea, list);
    allPrefixes.add(primaryArea);
  }

  const itemsByArea = new Map<string, ItemTemplate[]>();
  for (const [itemId, areas] of itemAreaMap) {
    const item = data.items[itemId];
    if (!item) continue;
    const primaryArea = [...areas].sort()[0];
    const list = itemsByArea.get(primaryArea) ?? [];
    list.push(item);
    itemsByArea.set(primaryArea, list);
    allPrefixes.add(primaryArea);
  }

  // Generate SQL for each area
  const files: Record<string, string> = {};

  for (const prefix of [...allPrefixes].sort()) {
    const fileName = getFileName(prefix);
    const scenes = scenesByArea.get(prefix) ?? [];
    const npcs = npcsByArea.get(prefix) ?? [];
    const items = itemsByArea.get(prefix) ?? [];

    const sections: string[] = [];
    sections.push(`-- Seed data: ${getAreaLabel(prefix)}`);

    if (npcs.length > 0) {
      sections.push('');
      sections.push('-- NPC Templates');
      sections.push(writeNpcInserts(npcs));
    }

    if (items.length > 0) {
      sections.push('');
      sections.push('-- Item Templates');
      sections.push(writeItemInserts(items));
    }

    if (scenes.length > 0) {
      sections.push('');
      sections.push('-- Scenes');
      sections.push(writeSceneInserts(scenes));

      const entitiesInsert = writeSceneEntityInserts(scenes);
      if (entitiesInsert) {
        sections.push('');
        sections.push('-- Scene Entities');
        sections.push(entitiesInsert);
      }
    }

    // Append preserved sections (quests, etc.)
    const preserved = preservedSections?.[fileName];
    if (preserved) {
      // Filter out empty lines and section headers we already wrote
      const cleaned = preserved
        .replace(/^-- Seed data:.*$/gm, '')
        .replace(/^-- NPC Templates\s*$/gm, '')
        .replace(/^-- Item Templates\s*$/gm, '')
        .replace(/^-- Scenes\s*$/gm, '')
        .replace(/^-- Scene Entities\s*$/gm, '')
        .trim();
      if (cleaned) {
        sections.push('');
        sections.push(cleaned);
      }
    }

    files[fileName] = sections.join('\n') + '\n';
  }

  return files;
}
