export type EnvironmentType =
  | 'mountain' | 'forest' | 'city' | 'cave' | 'desert'
  | 'swamp' | 'river' | 'plain' | 'ruins' | 'dungeon' | 'sky';

export type AiBehavior = 'passive' | 'aggressive';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EntityKind = 'npc' | 'item';

export type EquipSlot =
  | 'weapon' | 'helmet' | 'chest' | 'legs' | 'boots'
  | 'ring' | 'necklace' | 'accessory';

export interface SceneEntityRef {
  template_id: string;
  type: EntityKind;
  quantity?: number;
  visible?: boolean;
  tags?: string[];
}

export interface NpcTemplate {
  id: string;
  name: string;
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
  ai?: AiBehavior;
  dialogue?: string;
  drop?: string[];
}

export interface ItemTemplate {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  icon?: string;
  visible?: boolean;
  rarity?: ItemRarity;
  stackable?: boolean;
  max_stack?: number;
  value?: number;
  weight?: number;
  usable?: boolean;
  effect?: { type: string; value?: number };
  equip_slot?: EquipSlot | null;
  bonuses?: Record<string, number> | null;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  safe_zone: boolean;
  environment: EnvironmentType;
  level_range?: [number, number];
  exits: {
    north?: string;
    south?: string;
    east?: string;
    west?: string;
    up?: string;
    down?: string;
  };
  entities: SceneEntityRef[];
}

export interface WorldData {
  scenes: Record<string, Scene>;
  npcs: Record<string, NpcTemplate>;
  items: Record<string, ItemTemplate>;
}

export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';
