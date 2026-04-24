/** Area (map) metadata shared across modules */

export interface AreaInfo {
  prefix: string;
  label: string;
  fileName: string;
}

export const AREA_CONFIG: Record<string, AreaInfo> = {
  jz: { prefix: 'jz', label: '江州鱼埠', fileName: 'seed_jiangzhou_yubu.sql' },
  yx: { prefix: 'yx', label: '云栖城', fileName: 'seed_yunqi_cheng.sql' },
};

/** Register a new area at runtime (persisted via SQL save) */
export function registerArea(info: AreaInfo): void {
  AREA_CONFIG[info.prefix] = info;
}

export function getAreaPrefix(id: string): string {
  const idx = id.indexOf('_');
  return idx > 0 ? id.substring(0, idx) : 'unknown';
}

export function getAreaInfo(prefix: string): AreaInfo {
  return AREA_CONFIG[prefix] ?? {
    prefix,
    label: prefix,
    fileName: `seed_${prefix}.sql`,
  };
}
