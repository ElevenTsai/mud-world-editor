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

import { getAreaInfo, getAreaPrefix as _getAreaPrefix, AREA_CONFIG } from '../utils/areaConfig';

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

/** Reverse mapping: filename → prefix */
function getFileNameToPrefix(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [prefix, info] of Object.entries(AREA_CONFIG)) {
    map[info.fileName] = prefix;
  }
  return map;
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
 * originalFileMap maps entity IDs to their original source filename.
 */
export function worldDataToSqlFiles(
  data: WorldData,
  preservedSections?: Record<string, string>,
  originalFileMap?: Record<string, string>,
): Record<string, string> {
  // Group scenes by area prefix
  const scenesByFile = new Map<string, Scene[]>();
  for (const scene of Object.values(data.scenes)) {
    const prefix = getAreaPrefix(scene.id);
    const fileName = getFileName(prefix);
    const list = scenesByFile.get(fileName) ?? [];
    list.push(scene);
    scenesByFile.set(fileName, list);
  }

  // Collect all filenames
  const allFileNames = new Set<string>();
  for (const fileName of scenesByFile.keys()) allFileNames.add(fileName);

  // Group NPCs by file: use original file mapping if available, else fall back to scene-entity references
  const npcsByFile = new Map<string, NpcTemplate[]>();
  for (const npc of Object.values(data.npcs)) {
    let fileName = originalFileMap?.[npc.id];
    if (!fileName) {
      // Fallback: find which scene area references this NPC
      let targetPrefix: string | undefined;
      for (const scene of Object.values(data.scenes)) {
        if (scene.entities.some(e => e.type === 'npc' && e.template_id === npc.id)) {
          targetPrefix = getAreaPrefix(scene.id);
          break;
        }
      }
      fileName = getFileName(targetPrefix ?? getAreaPrefix(npc.id));
    }
    const list = npcsByFile.get(fileName) ?? [];
    list.push(npc);
    npcsByFile.set(fileName, list);
    allFileNames.add(fileName);
  }

  // Group items by file: same logic
  const itemsByFile = new Map<string, ItemTemplate[]>();
  for (const item of Object.values(data.items)) {
    let fileName = originalFileMap?.[item.id];
    if (!fileName) {
      let targetPrefix: string | undefined;
      for (const scene of Object.values(data.scenes)) {
        if (scene.entities.some(e => e.type === 'item' && e.template_id === item.id)) {
          targetPrefix = getAreaPrefix(scene.id);
          break;
        }
      }
      fileName = getFileName(targetPrefix ?? getAreaPrefix(item.id));
    }
    const list = itemsByFile.get(fileName) ?? [];
    list.push(item);
    itemsByFile.set(fileName, list);
    allFileNames.add(fileName);
  }

  // Generate SQL for each file
  const files: Record<string, string> = {};

  for (const fileName of [...allFileNames].sort()) {
    // Derive prefix from fileName for the header label
    const fileToPrefix = getFileNameToPrefix();
    const prefix = fileToPrefix[fileName]
      ?? fileName.replace(/^seed_/, '').replace(/\.sql$/, '');
    const scenes = scenesByFile.get(fileName) ?? [];
    const npcs = npcsByFile.get(fileName) ?? [];
    const items = itemsByFile.get(fileName) ?? [];

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
