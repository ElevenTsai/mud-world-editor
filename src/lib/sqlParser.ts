/**
 * SQL Parser: converts PostgreSQL INSERT statements from seed SQL files
 * into typed WorldData objects.
 */
import type {
  WorldData,
  Scene,
  NpcTemplate,
  ItemTemplate,
  SceneEntityRef,
  EnvironmentType,
  AiBehavior,
  ItemRarity,
  EquipSlot,
} from '../types/map';

// ---- Low-level SQL value parsing ----

/** Parse a SQL string literal (single-quoted, with '' escaping) */
function parseSqlString(raw: string): string {
  // Remove surrounding quotes and unescape ''
  if (raw === 'NULL') return '';
  const inner = raw.slice(1, -1);
  return inner.replace(/''/g, "'");
}

/** Parse ARRAY[...]::text[] → string[] */
function parseSqlArray(raw: string): string[] {
  if (raw === 'NULL') return [];
  const match = raw.match(/^ARRAY\[(.*?)\]::text\[\]$/s);
  if (!match) return [];
  const inner = match[1].trim();
  if (!inner) return [];
  const items: string[] = [];
  // Extract quoted strings
  const re = /'((?:[^']|'')*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    items.push(m[1].replace(/''/g, "'"));
  }
  return items;
}

/** Parse a JSON/JSONB SQL literal → object or null */
function parseSqlJson<T>(raw: string): T | null {
  if (raw === 'NULL') return null;
  // Remove ::jsonb suffix
  let s = raw.replace(/::jsonb$/i, '');
  // It might be wrapped in single quotes
  if (s.startsWith("'") && s.endsWith("'")) {
    s = s.slice(1, -1).replace(/''/g, "'");
  }
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/** Parse a SQL boolean */
function parseSqlBool(raw: string): boolean {
  return raw.toLowerCase() === 'true';
}

/** Parse a SQL number or NULL */
function parseSqlNumber(raw: string): number | null {
  if (raw === 'NULL') return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

/** Parse nullable string */
function parseSqlNullableString(raw: string): string | null {
  if (raw === 'NULL') return null;
  return parseSqlString(raw);
}

/** Parse nullable bool */
function parseSqlNullableBool(raw: string): boolean | null {
  if (raw === 'NULL') return null;
  return parseSqlBool(raw);
}

// ---- Row extraction ----

/**
 * Extract column-value tuples from INSERT statements.
 * Returns { columns, rows } where each row is an array of raw SQL value strings.
 */
function extractInserts(sql: string, tableName: string): { columns: string[]; rows: string[][] } {
  // Match INSERT INTO <table> (columns) VALUES ...
  // Need to handle multi-line with possible quoted column names
  const pattern = new RegExp(
    `INSERT\\s+INTO\\s+${tableName}\\s*\\(([^)]+)\\)\\s*VALUES\\s*`,
    'gi',
  );

  const result: { columns: string[]; rows: string[][] } = { columns: [], rows: [] };

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sql)) !== null) {
    const colStr = match[1];
    const columns = colStr.split(',').map(c => c.trim().replace(/"/g, ''));
    result.columns = columns;

    // Parse rows starting after VALUES keyword
    const startIdx = match.index + match[0].length;
    const rows = parseValueRows(sql, startIdx);
    result.rows.push(...rows);
  }

  return result;
}

/**
 * Parse parenthesized value rows from SQL text starting at given position.
 * Handles nested parentheses, quoted strings, and ARRAY[...] syntax.
 */
function parseValueRows(sql: string, startIdx: number): string[][] {
  const rows: string[][] = [];
  let i = startIdx;
  const len = sql.length;

  while (i < len) {
    // Skip whitespace and commas between rows
    while (i < len && /[\s,]/.test(sql[i])) i++;

    if (i >= len || sql[i] === ';') break;
    if (sql[i] !== '(') break;

    // Parse one row: find matching closing paren
    const values = parseOneRow(sql, i);
    if (values) {
      rows.push(values.values);
      i = values.endIdx + 1;
    } else {
      break;
    }
  }

  return rows;
}

/**
 * Parse a single parenthesized row starting at position i (where sql[i] === '(').
 * Returns the parsed values and the index of the closing ')'.
 */
function parseOneRow(sql: string, start: number): { values: string[]; endIdx: number } | null {
  if (sql[start] !== '(') return null;

  const values: string[] = [];
  let i = start + 1;
  const len = sql.length;
  let current = '';
  let depth = 0; // for nested parens/brackets

  while (i < len) {
    const ch = sql[i];

    if (depth === 0 && (ch === ',' || ch === ')')) {
      values.push(current.trim());
      current = '';
      if (ch === ')') {
        return { values, endIdx: i };
      }
      i++;
      continue;
    }

    // Handle single-quoted strings
    if (ch === "'") {
      let j = i + 1;
      let str = "'";
      while (j < len) {
        if (sql[j] === "'" && j + 1 < len && sql[j + 1] === "'") {
          str += "''";
          j += 2;
        } else if (sql[j] === "'") {
          str += "'";
          j++;
          break;
        } else {
          str += sql[j];
          j++;
        }
      }
      current += str;
      i = j;
      continue;
    }

    // Track brackets for ARRAY[...] and nested expressions
    if (ch === '[' || ch === '(') {
      depth++;
    } else if (ch === ']' || (ch === ')' && depth > 0)) {
      depth--;
    }

    // Handle ::jsonb or other casts after a quote block
    current += ch;
    i++;
  }

  return null;
}

// ---- High-level parsers ----

function parseScenes(sql: string): Record<string, Scene> {
  const { columns, rows } = extractInserts(sql, 'scenes');
  if (rows.length === 0) return {};

  const scenes: Record<string, Scene> = {};
  const colIdx = (name: string) => columns.indexOf(name);

  for (const row of rows) {
    const id = parseSqlString(row[colIdx('id')]);
    const exits = parseSqlJson<Record<string, string>>(row[colIdx('exits')]) ?? {};
    const levelMin = parseSqlNumber(row[colIdx('level_min')]);
    const levelMax = parseSqlNumber(row[colIdx('level_max')]);

    scenes[id] = {
      id,
      name: parseSqlString(row[colIdx('name')]),
      description: parseSqlString(row[colIdx('description')]),
      safe_zone: parseSqlBool(row[colIdx('safe_zone')]),
      environment: parseSqlString(row[colIdx('environment')]) as EnvironmentType,
      exits,
      entities: [], // populated later from scene_entities
      ...(levelMin != null && levelMax != null
        ? { level_range: [levelMin, levelMax] as [number, number] }
        : {}),
    };
  }

  return scenes;
}

function parseSceneEntities(sql: string): Map<string, SceneEntityRef[]> {
  const { columns, rows } = extractInserts(sql, 'scene_entities');
  const map = new Map<string, SceneEntityRef[]>();

  const colIdx = (name: string) => columns.indexOf(name);

  for (const row of rows) {
    const sceneId = parseSqlString(row[colIdx('scene_id')]);
    const entity: SceneEntityRef = {
      template_id: parseSqlString(row[colIdx('template_id')]),
      type: parseSqlString(row[colIdx('entity_type')]) as 'npc' | 'item',
      quantity: parseSqlNumber(row[colIdx('quantity')]) ?? undefined,
      tags: parseSqlArray(row[colIdx('tags')]) || undefined,
      visible: parseSqlNullableBool(row[colIdx('visible')]) ?? undefined,
    };
    // Clean up empty arrays
    if (entity.tags && entity.tags.length === 0) entity.tags = undefined;

    const list = map.get(sceneId) ?? [];
    list.push(entity);
    map.set(sceneId, list);
  }

  return map;
}

function parseNpcs(sql: string): Record<string, NpcTemplate> {
  const { columns, rows } = extractInserts(sql, 'npc_templates');
  if (rows.length === 0) return {};

  const npcs: Record<string, NpcTemplate> = {};
  const colIdx = (name: string) => columns.indexOf(name);

  for (const row of rows) {
    const id = parseSqlString(row[colIdx('id')]);
    const dropRaw = row[colIdx('drop')];
    const dropVal = parseSqlNullableString(dropRaw);

    npcs[id] = {
      id,
      name: parseSqlString(row[colIdx('name')]),
      description: parseSqlString(row[colIdx('description')]),
      tags: parseSqlArray(row[colIdx('tags')]) || undefined,
      visible: parseSqlNullableBool(row[colIdx('visible')]) ?? undefined,
      level: parseSqlNumber(row[colIdx('level')]) ?? undefined,
      realm: parseSqlNullableString(row[colIdx('realm')]) ?? undefined,
      hp: parseSqlNumber(row[colIdx('hp')]) ?? undefined,
      max_hp: parseSqlNumber(row[colIdx('max_hp')]) ?? undefined,
      mp: parseSqlNumber(row[colIdx('mp')]) ?? undefined,
      max_mp: parseSqlNumber(row[colIdx('max_mp')]) ?? undefined,
      attack: parseSqlNumber(row[colIdx('attack')]) ?? undefined,
      defense: parseSqlNumber(row[colIdx('defense')]) ?? undefined,
      speed: parseSqlNumber(row[colIdx('speed')]) ?? undefined,
      ai: (parseSqlNullableString(row[colIdx('ai')]) as AiBehavior) ?? undefined,
      dialogue: parseSqlNullableString(row[colIdx('dialogue')]) ?? undefined,
      drop: dropVal ? [dropVal] : undefined,
    };
    // Clean up empty tags
    if (npcs[id].tags && npcs[id].tags!.length === 0) npcs[id].tags = undefined;
  }

  return npcs;
}

function parseItems(sql: string): Record<string, ItemTemplate> {
  const { columns, rows } = extractInserts(sql, 'item_templates');
  if (rows.length === 0) return {};

  const items: Record<string, ItemTemplate> = {};
  const colIdx = (name: string) => columns.indexOf(name);

  for (const row of rows) {
    const id = parseSqlString(row[colIdx('id')]);

    items[id] = {
      id,
      name: parseSqlString(row[colIdx('name')]),
      description: parseSqlString(row[colIdx('description')]),
      tags: parseSqlArray(row[colIdx('tags')]) || undefined,
      icon: parseSqlNullableString(row[colIdx('icon')]) ?? undefined,
      visible: parseSqlNullableBool(row[colIdx('visible')]) ?? undefined,
      rarity: (parseSqlNullableString(row[colIdx('rarity')]) as ItemRarity) ?? undefined,
      stackable: parseSqlNullableBool(row[colIdx('stackable')]) ?? undefined,
      max_stack: parseSqlNumber(row[colIdx('max_stack')]) ?? undefined,
      value: parseSqlNumber(row[colIdx('value')]) ?? undefined,
      weight: parseSqlNumber(row[colIdx('weight')]) ?? undefined,
      usable: parseSqlNullableBool(row[colIdx('usable')]) ?? undefined,
      effect: parseSqlJson<{ type: string; value?: number }>(row[colIdx('effect')]) ?? undefined,
      equip_slot: (parseSqlNullableString(row[colIdx('equip_slot')]) as EquipSlot | null) ?? undefined,
      bonuses: parseSqlJson<Record<string, number>>(row[colIdx('bonuses')]),
    };
    // Clean up
    if (items[id].tags && items[id].tags!.length === 0) items[id].tags = undefined;
    if (items[id].effect === null) items[id].effect = undefined;
    if (items[id].bonuses === null) items[id].bonuses = undefined;
    if (items[id].equip_slot === undefined) items[id].equip_slot = undefined;
  }

  return items;
}

// ---- Public API ----

/**
 * Parse one or more SQL file contents into a WorldData object.
 * Pass multiple SQL strings (one per file) to merge them.
 */
export function parseSqlFiles(sqlContents: string[]): WorldData {
  const allScenes: Record<string, Scene> = {};
  const allNpcs: Record<string, NpcTemplate> = {};
  const allItems: Record<string, ItemTemplate> = {};

  for (const sql of sqlContents) {
    // Parse scenes
    const scenes = parseScenes(sql);
    Object.assign(allScenes, scenes);

    // Parse entities and attach to scenes
    const entityMap = parseSceneEntities(sql);
    for (const [sceneId, entities] of entityMap) {
      if (allScenes[sceneId]) {
        allScenes[sceneId].entities = entities;
      }
    }

    // Parse NPCs and items
    Object.assign(allNpcs, parseNpcs(sql));
    Object.assign(allItems, parseItems(sql));
  }

  return { scenes: allScenes, npcs: allNpcs, items: allItems };
}

/**
 * Extract non-parsed sections (comments, quests, etc.) from SQL files
 * so they can be preserved on write-back.
 */
export function extractPreservedSections(sql: string): string {
  const lines = sql.split('\n');
  const preserved: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if this is an INSERT INTO one of our managed tables
    if (/^\s*INSERT\s+INTO\s+(scenes|scene_entities|npc_templates|item_templates)\s/i.test(line)) {
      // Skip until we find the terminating semicolon
      while (i < lines.length && !lines[i].trimEnd().endsWith(';')) {
        i++;
      }
      i++; // skip the line with ;
      continue;
    }

    preserved.push(line);
    i++;
  }

  return preserved.join('\n').trim();
}

/**
 * Extract all NPC and item IDs from a SQL file (for tracking file membership).
 */
export function extractEntityIds(sql: string): string[] {
  const ids: string[] = [];

  for (const table of ['npc_templates', 'item_templates'] as const) {
    const { columns, rows } = extractInserts(sql, table);
    if (rows.length === 0) continue;
    const idIdx = columns.indexOf('id');
    if (idIdx < 0) continue;
    for (const row of rows) {
      ids.push(parseSqlString(row[idIdx]));
    }
  }

  return ids;
}
