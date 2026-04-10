export interface SceneEntityRef {
  template_id: string;
  type: 'npc' | 'item';
  quantity?: number;
  visible?: boolean;
  tags?: string[];
}

export interface NpcTemplate {
  id: string;
  name: string;
  type: 'npc';
  description: string;
  tags?: string[];
  visible?: boolean;
  level?: number;
  realm?: string;
  hp?: number;
  max_hp?: number;
  mp?: number;
  max_mp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  ai?: string;
  dialogue?: string;
  drop?: string[];
}

export interface ItemTemplate {
  id: string;
  name: string;
  type: 'item';
  description: string;
  tags?: string[];
  visible?: boolean;
  rarity?: string;
  stackable?: boolean;
  max_stack?: number;
  value?: number;
  weight?: number;
  usable?: boolean;
  effect?: { type: string; value?: number };
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  safe_zone: boolean;
  environment: string;
  level_range?: [number, number];
  exits: {
    north?: string;
    south?: string;
    east?: string;
    west?: string;
  };
  entities: SceneEntityRef[];
}

export interface WorldData {
  scenes: Record<string, Scene>;
  npcs: Record<string, NpcTemplate>;
  items: Record<string, ItemTemplate>;
}

export type Direction = 'north' | 'south' | 'east' | 'west';
