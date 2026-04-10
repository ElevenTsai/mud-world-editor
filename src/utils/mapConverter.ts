import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { Scene, Direction } from '../types/map';

const DIRECTION_OFFSETS: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -180 },
  south: { x: 0, y: 180 },
  east: { x: 260, y: 0 },
  west: { x: -260, y: 0 },
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

const DIRECTION_LABELS: Record<Direction, string> = {
  north: '北',
  south: '南',
  east: '东',
  west: '西',
};

const ALL_DIRECTIONS: Direction[] = ['north', 'south', 'east', 'west'];

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

  const positions: Record<string, { x: number; y: number }> = {};
  const visited = new Set<string>();
  const queue: string[] = [sceneIds[0]];
  positions[sceneIds[0]] = { x: 400, y: 360 };
  visited.add(sceneIds[0]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const scene = scenes[currentId];
    const pos = positions[currentId];

    for (const [dir, targetId] of Object.entries(scene.exits)) {
      if (targetId && !visited.has(targetId) && scenes[targetId]) {
        const offset = DIRECTION_OFFSETS[dir as Direction];
        positions[targetId] = { x: pos.x + offset.x, y: pos.y + offset.y };
        visited.add(targetId);
        queue.push(targetId);
      }
    }
  }

  // Place any unreachable scenes below
  let offsetX = 0;
  for (const id of sceneIds) {
    if (!visited.has(id)) {
      positions[id] = { x: offsetX, y: 700 };
      offsetX += 300;
    }
  }

  const nodes: Node[] = sceneIds.map((id) => ({
    id,
    type: 'sceneNode',
    position: positions[id],
    data: { scene: structuredClone(scenes[id]) },
    width: 180,
    height: 100,
  }));

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

  for (const node of nodes) {
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
  for (const node of nodes) {
    const scene = node.data.scene as Scene;
    if (Object.keys(scenes[node.id].exits).length === 0 && Object.keys(scene.exits).length > 0) {
      scenes[node.id].exits = structuredClone(scene.exits);
    }
  }

  return scenes;
}

export { DIRECTION_LABELS, OPPOSITE_DIRECTION };
