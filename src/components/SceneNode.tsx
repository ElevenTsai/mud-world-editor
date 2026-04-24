import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Scene } from '../types/map';

function SceneNodeComponent({ data, selected }: NodeProps) {
  const scene = data.scene as Scene;
  const npcCount = scene.entities.filter((e) => e.type === 'npc').length;
  const itemRefs = scene.entities.filter((e) => e.type === 'item');
  const itemTotalQty = itemRefs.reduce((sum, e) => sum + (e.quantity ?? 1), 0);

  return (
    <div className={`scene-node ${selected ? 'selected' : ''}`}>
      {/* North */}
      <Handle type="source" position={Position.Top} id="north-source" style={{ left: '40%' }} />
      <Handle type="target" position={Position.Top} id="north-target" style={{ left: '40%' }} />
      {/* Up */}
      <Handle type="source" position={Position.Top} id="up-source" style={{ left: '60%' }} />
      <Handle type="target" position={Position.Top} id="up-target" style={{ left: '60%' }} />
      {/* South */}
      <Handle type="source" position={Position.Bottom} id="south-source" style={{ left: '40%' }} />
      <Handle type="target" position={Position.Bottom} id="south-target" style={{ left: '40%' }} />
      {/* Down */}
      <Handle type="source" position={Position.Bottom} id="down-source" style={{ left: '60%' }} />
      <Handle type="target" position={Position.Bottom} id="down-target" style={{ left: '60%' }} />
      {/* West */}
      <Handle type="source" position={Position.Left} id="west-source" style={{ top: '50%' }} />
      <Handle type="target" position={Position.Left} id="west-target" style={{ top: '50%' }} />
      {/* East */}
      <Handle type="source" position={Position.Right} id="east-source" style={{ top: '50%' }} />
      <Handle type="target" position={Position.Right} id="east-target" style={{ top: '50%' }} />

      <div className="scene-node-header">
        <span className="scene-node-icon">◆</span>
        <span className="scene-node-name">{scene.name}</span>
        <span className="scene-node-icon">◆</span>
      </div>

      <div className="scene-node-id">{scene.id}</div>

      {(npcCount > 0 || itemRefs.length > 0) && (
        <div className="scene-node-entities">
          {npcCount > 0 && (
            <span className="entity-badge npc">NPC ×{npcCount}</span>
          )}
          {itemRefs.length > 0 && (
            <span className="entity-badge item">物品 ×{itemTotalQty}</span>
          )}
        </div>
      )}

      <div className="direction-labels">
        <span className="dir-label dir-north">北</span>
        <span className="dir-label dir-south">南</span>
        <span className="dir-label dir-west">西</span>
        <span className="dir-label dir-east">东</span>
      </div>
    </div>
  );
}

export const SceneNode = memo(SceneNodeComponent);
