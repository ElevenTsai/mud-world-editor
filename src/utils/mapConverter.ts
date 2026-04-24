import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { Scene, Direction } from '../types/map';
import { getAreaPrefix, getAreaInfo } from './areaConfig';

const DIRECTION_OFFSETS: Record<string, { x: number; y: number }> = {
  north: { x: 0, y: -180 },
  south: { x: 0, y: 180 },
  east: { x: 260, y: 0 },
  west: { x: -260, y: 0 },
  up: { x: 0, y: -180 },
  down: { x: 0, y: 180 },
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
  up: 'down',
  down: 'up',
};

const DIRECTION_LABELS: Record<Direction, string> = {
  north: '北',
  south: '南',
  east: '东',
  west: '西',
  up: '上',
  down: '下',
};

function getAreaLabel(prefix: string): string {
  return getAreaInfo(prefix).label;
}

const ALL_DIRECTIONS: Direction[] = ['north', 'south', 'east', 'west', 'up', 'down'];

/** Extract direction from an edge, using sourceHandle first then falling back to edge ID. */
function edgeDirection(edge: Edge): Direction | undefined {
  if (edge.sourceHandle) {
    const d = edge.sourceHandle.replace('-source', '') as Direction;
    if (ALL_DIRECTIONS.includes(d)) return d;
  }
  // Fallback: parse from edge ID format `${source}-${dir}-${target}`
  return ALL_DIRECTIONS.find((d) => edge.id.includes(`-${d}-`));
}

/**
 * Convert a Record<string, Scene> (mapStore format) to React Flow nodes + edges.
 * Positions are auto-calculated via BFS using exit directions.
 */
export function scenesToFlow(scenes: Record<string, Scene>): {
  nodes: Node[];
  edges: Edge[];
} {
  const sceneIds = Object.keys(scenes);
  if (sceneIds.length === 0) return { nodes: [], edges: [] };

  // Group scenes by area prefix
  const areaSceneIds = new Map<string, string[]>();
  for (const id of sceneIds) {
    const prefix = getAreaPrefix(id);
    const list = areaSceneIds.get(prefix) ?? [];
    list.push(id);
    areaSceneIds.set(prefix, list);
  }

  const positions: Record<string, { x: number; y: number }> = {};

  const posKey = (x: number, y: number) => `${x},${y}`;

  // Layout each area independently with BFS (only intra-area exits)
  for (const [prefix, ids] of areaSceneIds) {
    const visited = new Set<string>();
    const occupiedPositions = new Set<string>();

    const findFreePosition = (idealX: number, idealY: number): { x: number; y: number } => {
      if (!occupiedPositions.has(posKey(idealX, idealY))) {
        return { x: idealX, y: idealY };
      }
      const stepX = DIRECTION_OFFSETS.east.x;
      const stepY = DIRECTION_OFFSETS.south.y;
      for (let ring = 1; ring <= 10; ring++) {
        for (let dx = -ring; dx <= ring; dx++) {
          for (let dy = -ring; dy <= ring; dy++) {
            if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
            const cx = idealX + dx * stepX;
            const cy = idealY + dy * stepY;
            if (!occupiedPositions.has(posKey(cx, cy))) {
              return { x: cx, y: cy };
            }
          }
        }
      }
      return { x: idealX + Math.random() * 100, y: idealY + Math.random() * 100 };
    };

    const placeNode = (id: string, x: number, y: number) => {
      const free = findFreePosition(x, y);
      positions[id] = free;
      occupiedPositions.add(posKey(free.x, free.y));
    };

    // Start BFS from first scene in this area
    placeNode(ids[0], 0, 0);
    visited.add(ids[0]);
    const queue: string[] = [ids[0]];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const scene = scenes[currentId];
      const pos = positions[currentId];

      for (const [dir, targetId] of Object.entries(scene.exits)) {
        // Only follow intra-area exits for layout
        if (targetId && !visited.has(targetId) && scenes[targetId] && getAreaPrefix(targetId) === prefix) {
          const offset = DIRECTION_OFFSETS[dir as Direction];
          if (offset) {
            placeNode(targetId, pos.x + offset.x, pos.y + offset.y);
            visited.add(targetId);
            queue.push(targetId);
          }
        }
      }
    }

    // Place unreachable scenes in this area
    let unreachableX = 0;
    for (const id of ids) {
      if (!visited.has(id)) {
        placeNode(id, unreachableX, 700);
        unreachableX += 300;
      }
    }
  }

  // Offset areas so they don't overlap, with a gap between them
  const AREA_GAP = 200;
  const NODE_W = 180;
  const NODE_H = 100;
  let currentOffsetX = 0;

  for (const [, ids] of [...areaSceneIds].sort((a, b) => a[0].localeCompare(b[0]))) {
    // Find bounding box for this area (relative positions from BFS)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of ids) {
      const pos = positions[id];
      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x + NODE_W > maxX) maxX = pos.x + NODE_W;
      if (pos.y + NODE_H > maxY) maxY = pos.y + NODE_H;
    }

    // Shift all positions: normalize to origin + apply offset
    const shiftX = currentOffsetX - minX;
    const shiftY = -minY;
    for (const id of ids) {
      positions[id].x += shiftX;
      positions[id].y += shiftY;
    }

    currentOffsetX += (maxX - minX) + AREA_GAP;
  }

  // Compute bounding boxes and create nodes
  const PADDING = 40;
  const HEADER = 36;

  const nodes: Node[] = [];

  // Create group nodes for each area
  for (const [prefix, ids] of areaSceneIds) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of ids) {
      const pos = positions[id];
      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x + NODE_W > maxX) maxX = pos.x + NODE_W;
      if (pos.y + NODE_H > maxY) maxY = pos.y + NODE_H;
    }

    const groupX = minX - PADDING;
    const groupY = minY - PADDING - HEADER;
    const groupW = maxX - minX + PADDING * 2;
    const groupH = maxY - minY + PADDING * 2 + HEADER;

    nodes.push({
      id: `area-${prefix}`,
      type: 'areaGroup',
      position: { x: groupX, y: groupY },
      data: { label: getAreaLabel(prefix) },
      style: {
        width: groupW,
        height: groupH,
        border: '2px dashed rgba(212, 165, 116, 0.5)',
        borderRadius: 12,
        background: 'rgba(45, 45, 68, 0.3)',
        padding: 0,
      },
    });

    // Add scene nodes as children of the group
    for (const id of ids) {
      const pos = positions[id];
      nodes.push({
        id,
        type: 'sceneNode',
        position: { x: pos.x - groupX, y: pos.y - groupY },
        parentId: `area-${prefix}`,
        extent: 'parent' as const,
        data: { scene: structuredClone(scenes[id]) },
        width: NODE_W,
        height: NODE_H,
      });
    }
  }

  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  for (const scene of Object.values(scenes)) {
    for (const [dir, targetId] of Object.entries(scene.exits)) {
      if (targetId && scenes[targetId]) {
        const edgeId = `${scene.id}-${dir}-${targetId}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: scene.id,
            target: targetId,
            sourceHandle: `${dir}-source`,
            targetHandle: `${OPPOSITE_DIRECTION[dir as Direction]}-target`,
            markerStart: { type: MarkerType.ArrowClosed, color: '#d4a574' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#d4a574' },
            style: { stroke: '#d4a574', strokeWidth: 2 },
          });
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Convert React Flow nodes + edges back to Record<string, Scene> for export.
 */
export function flowToScenes(
  nodes: Node[],
  edges: Edge[],
): Record<string, Scene> {
  const scenes: Record<string, Scene> = {};
  const sceneNodes = nodes.filter(n => n.type !== 'areaGroup');

  for (const node of sceneNodes) {
    const scene = node.data.scene as Scene;
    // Start with exits stored in node data (written by onConnect/onEdgesChange).
    // Exits from edges below will override/supplement these.
    scenes[node.id] = {
      ...structuredClone(scene),
      id: node.id,
    };
    // Reset exits so they're rebuilt from edges (source of truth).
    scenes[node.id].exits = {};
  }

  for (const edge of edges) {
    const dir = edgeDirection(edge);
    if (scenes[edge.source] && dir) {
      scenes[edge.source].exits[dir] = edge.target;
    }
  }

  // Fallback: if an edge was not processed (edge.source not in scenes),
  // use exits already stored in node data.
  for (const node of sceneNodes) {
    const scene = node.data.scene as Scene;
    if (Object.keys(scenes[node.id].exits).length === 0 && Object.keys(scene.exits).length > 0) {
      scenes[node.id].exits = structuredClone(scene.exits);
    }
  }

  return scenes;
}

export { DIRECTION_LABELS, OPPOSITE_DIRECTION };
