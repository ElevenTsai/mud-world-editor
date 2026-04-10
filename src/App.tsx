import { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SceneNode } from './components/SceneNode';
import { SceneEditor } from './components/SceneEditor';
import { Toolbar } from './components/Toolbar';
import {
  scenesToFlow,
  flowToScenes,
  OPPOSITE_DIRECTION,
} from './utils/mapConverter';
import { DEFAULT_WORLD } from './utils/defaultScenes';
import type { Scene, Direction, NpcTemplate, ItemTemplate, WorldData } from './types/map';
import './App.css';

const nodeTypes = { sceneNode: SceneNode };

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([] as Edge[]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [npcs, setNpcs] = useState<Record<string, NpcTemplate>>({});
  const [items, setItems] = useState<Record<string, ItemTemplate>>({});
  const [loading, setLoading] = useState(true);
  const idCounter = useRef(1);

  // Load world data from data/ on startup
  useEffect(() => {
    fetch('/api/load-world')
      .then((res) => res.json())
      .then((data: WorldData) => {
        const flow = scenesToFlow(data.scenes);
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setNpcs(data.npcs);
        setItems(data.items);
      })
      .catch(() => {
        // Fallback to built-in default data
        const flow = scenesToFlow(DEFAULT_WORLD.scenes);
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setNpcs(DEFAULT_WORLD.npcs);
        setItems(DEFAULT_WORLD.items);
      })
      .finally(() => setLoading(false));
  }, [setNodes, setEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  // Wrap onEdgesChange to sync exits in node data when edges are removed.
  const onEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChangeBase>[0]) => {
      onEdgesChangeBase(changes);
      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length === 0) return;
      setEdges((currentEdges) => {
        setNodes((nds) =>
          nds.map((n) => {
            const scene = n.data.scene as Scene;
            const rebuilt: Partial<Record<Direction, string>> = {};
            for (const e of currentEdges) {
              if (e.source !== n.id) continue;
              const d = e.sourceHandle?.replace('-source', '') as Direction | undefined;
              if (d && (['north', 'south', 'east', 'west'] as Direction[]).includes(d)) {
                rebuilt[d] = e.target;
              }
            }
            if (JSON.stringify(scene.exits) === JSON.stringify(rebuilt)) return n;
            return { ...n, data: { ...n.data, scene: { ...scene, exits: rebuilt } } };
          }),
        );
        return currentEdges;
      });
    },
    [onEdgesChangeBase, setEdges, setNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (
        !connection.source ||
        !connection.target ||
        !connection.sourceHandle
      )
        return;

      if (connection.source === connection.target) return;

      const dir = connection.sourceHandle.replace('-source', '') as Direction;
      const reverseDir = OPPOSITE_DIRECTION[dir];

      setEdges((eds) => {
        let result = eds;

        // Forward edge: source → target
        if (!eds.some((e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle)) {
          result = addEdge(
            {
              id: `${connection.source}-${dir}-${connection.target}`,
              source: connection.source!,
              target: connection.target!,
              sourceHandle: connection.sourceHandle,
              targetHandle: connection.targetHandle,
              markerStart: { type: MarkerType.ArrowClosed, color: '#d4a574' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#d4a574' },
              style: { stroke: '#d4a574', strokeWidth: 2 },
            },
            result,
          );
        }

        // Reverse edge: target → source (only if the opposite direction is free)
        const reverseHandle = `${reverseDir}-source`;
        if (!result.some((e) => e.source === connection.target && e.sourceHandle === reverseHandle)) {
          result = addEdge(
            {
              id: `${connection.target}-${reverseDir}-${connection.source}`,
              source: connection.target!,
              target: connection.source!,
              sourceHandle: reverseHandle,
              targetHandle: `${dir}-target`,
              markerStart: { type: MarkerType.ArrowClosed, color: '#d4a574' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#d4a574' },
              style: { stroke: '#d4a574', strokeWidth: 2 },
            },
            result,
          );
        }

        return result;
      });

      // Update exits in node data for both source and target
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === connection.source) {
            const scene = n.data.scene as Scene;
            return {
              ...n,
              data: {
                ...n.data,
                scene: { ...scene, exits: { ...scene.exits, [dir]: connection.target } },
              },
            };
          }
          if (n.id === connection.target) {
            const scene = n.data.scene as Scene;
            if (!scene.exits[reverseDir]) {
              return {
                ...n,
                data: {
                  ...n.data,
                  scene: { ...scene, exits: { ...scene.exits, [reverseDir]: connection.source } },
                },
              };
            }
          }
          return n;
        }),
      );
    },
    [setEdges, setNodes],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId((prev) => {
      if (prev !== node.id) setEditorKey((k) => k + 1);
      return node.id;
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const addScene = useCallback(() => {
    const id = `scene_${idCounter.current++}`;
    const newNode: Node = {
      id,
      type: 'sceneNode',
      position: {
        x: Math.round((Math.random() * 400 + 200) / 20) * 20,
        y: Math.round((Math.random() * 400 + 200) / 20) * 20,
      },
      width: 180,
      height: 100,
      data: {
        scene: {
          id,
          name: '新场景',
          description: '请输入场景描述...',
          safe_zone: true,
          environment: 'mountain',
          exits: {},
          entities: [],
        } satisfies Scene,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const updateScene = useCallback(
    (sceneId: string, updatedScene: Scene) => {
      const newId = updatedScene.id.trim();
      const idChanged = newId && newId !== sceneId;

      setNodes((nds) => {
        if (idChanged && nds.some((n) => n.id === newId)) return nds; // ID conflict, skip
        return nds.map((n) =>
          n.id === sceneId
            ? { ...n, id: idChanged ? newId : n.id, data: { ...n.data, scene: updatedScene } }
            : n,
        );
      });

      if (idChanged) {
        setEdges((eds) =>
          eds.map((e) => {
            const src = e.source === sceneId ? newId : e.source;
            const tgt = e.target === sceneId ? newId : e.target;
            const dir = e.sourceHandle?.replace('-source', '') ?? '';
            return { ...e, id: `${src}-${dir}-${tgt}`, source: src, target: tgt };
          }),
        );
        setSelectedNodeId(newId);
      }
    },
    [setNodes, setEdges],
  );

  const deleteScene = useCallback(
    (sceneId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== sceneId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== sceneId && e.target !== sceneId),
      );
      setSelectedNodeId(null);
    },
    [setNodes, setEdges],
  );

  const deleteExit = useCallback(
    (sceneId: string, direction: Direction) => {
      const reverseDir = OPPOSITE_DIRECTION[direction];

      setNodes((nds) => {
        // Find the target scene to also remove its reverse exit
        const sourceNode = nds.find((n) => n.id === sceneId);
        const targetId = sourceNode
          ? (sourceNode.data.scene as Scene).exits[direction]
          : undefined;

        return nds.map((n) => {
          if (n.id === sceneId) {
            const scene = n.data.scene as Scene;
            const newExits = { ...scene.exits };
            delete newExits[direction];
            return { ...n, data: { ...n.data, scene: { ...scene, exits: newExits } } };
          }
          // Remove the reverse exit on the target scene
          if (targetId && n.id === targetId) {
            const scene = n.data.scene as Scene;
            if (scene.exits[reverseDir] === sceneId) {
              const newExits = { ...scene.exits };
              delete newExits[reverseDir];
              return { ...n, data: { ...n.data, scene: { ...scene, exits: newExits } } };
            }
          }
          return n;
        });
      });

      // Remove both the forward edge and the reverse edge
      setEdges((eds) =>
        eds.filter((e) => {
          // Forward: sceneId → target via direction
          if (e.source === sceneId && e.sourceHandle === `${direction}-source`) return false;
          // Reverse: target → sceneId via reverseDir
          if (e.target === sceneId && e.sourceHandle === `${reverseDir}-source`) return false;
          return true;
        }),
      );

      // Force SceneEditor remount so local state reflects the change
      setEditorKey((k) => k + 1);
    },
    [setNodes, setEdges],
  );

  const handleExport = useCallback((): WorldData => {
    return {
      scenes: flowToScenes(nodes, edges),
      npcs,
      items,
    };
  }, [nodes, edges, npcs, items]);

  if (loading) {
    return (
      <div className="editor-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#d4a574', fontSize: 18 }}>加载世界数据…</span>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <Toolbar
        onAddScene={addScene}
        onExport={handleExport}
      />
      <div className="editor-main">
        <div className="flow-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#d4a574', strokeWidth: 2 },
              markerStart: { type: MarkerType.ArrowClosed, color: '#d4a574' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#d4a574' },
            }}
          >
            <Controls />
            <MiniMap
              nodeColor="#d4a574"
              nodeStrokeColor="#8b7355"
              maskColor="rgba(0, 0, 0, 0.6)"
              style={{ width: 180, height: 130 }}
              pannable
              zoomable
            />
            <Background
              variant={BackgroundVariant.Lines}
              gap={20}
              color="#2d2d44"
            />
          </ReactFlow>
        </div>
        {selectedNode && (
          <SceneEditor
            key={editorKey}
            scene={selectedNode.data.scene as Scene}
            npcs={npcs}
            items={items}
            onUpdate={(scene) => updateScene(selectedNode.id, scene)}
            onDeleteExit={(dir) => deleteExit(selectedNode.id, dir)}
            onDelete={() => deleteScene(selectedNode.id)}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
