import { useState, useCallback } from 'react';
import type { Scene, SceneEntityRef, Direction, NpcTemplate, ItemTemplate, EnvironmentType } from '../types/map';
import { DIRECTION_LABELS } from '../utils/mapConverter';

interface SceneEditorProps {
  scene: Scene;
  npcs: Record<string, NpcTemplate>;
  items: Record<string, ItemTemplate>;
  onUpdate: (scene: Scene) => void;
  onDeleteExit: (direction: Direction) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function SceneEditor({
  scene,
  npcs,
  items,
  onUpdate,
  onDeleteExit,
  onDelete,
  onClose,
}: SceneEditorProps) {
  const [local, setLocal] = useState<Scene>(() => structuredClone(scene));

  const update = useCallback(
    (partial: Partial<Scene>) => {
      const updated = { ...local, ...partial };
      setLocal(updated);
      onUpdate(updated);
    },
    [local, onUpdate],
  );

  const addEntity = useCallback(() => {
    const newRef: SceneEntityRef = {
      template_id: '',
      type: 'npc',
      visible: true,
    };
    update({ entities: [...local.entities, newRef] });
  }, [local.entities, update]);

  const updateEntityRef = useCallback(
    (index: number, patch: Partial<SceneEntityRef>) => {
      const entities = [...local.entities];
      entities[index] = { ...entities[index], ...patch };
      update({ entities });
    },
    [local.entities, update],
  );

  const removeEntity = useCallback(
    (index: number) => {
      update({ entities: local.entities.filter((_, i) => i !== index) });
    },
    [local.entities, update],
  );

  const resolveTemplateNameById = (type: SceneEntityRef['type'], templateId: string): string => {
    if (type === 'npc') {
      return npcs[templateId]?.name ?? '';
    }
    return items[templateId]?.name ?? '';
  };

  const templateOptions = (type: SceneEntityRef['type']): string[] => {
    if (type === 'item') return Object.keys(items);
    return Object.keys(npcs);
  };

  return (
    <div className="scene-editor">
      <div className="scene-editor-header">
        <h3>编辑场景</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="scene-editor-body">
        <div className="field-group">
          <label>场景 ID</label>
          <input
            type="text"
            value={local.id}
            onChange={(e) => update({ id: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>场景名称</label>
          <input
            type="text"
            value={local.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>场景描述</label>
          <textarea
            value={local.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="field-group">
          <label>环境类型</label>
          <select
            value={local.environment}
            onChange={(e) => update({ environment: e.target.value as EnvironmentType })}
          >
            <option value="mountain">山地 (mountain)</option>
            <option value="forest">森林 (forest)</option>
            <option value="city">城镇 (city)</option>
            <option value="cave">洞穴 (cave)</option>
            <option value="desert">荒漠 (desert)</option>
            <option value="swamp">沼泽 (swamp)</option>
            <option value="river">河流 (river)</option>
            <option value="plain">平原 (plain)</option>
            <option value="ruins">遗迹 (ruins)</option>
            <option value="dungeon">地牢 (dungeon)</option>
          </select>
        </div>

        <div className="field-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={local.safe_zone}
              onChange={(e) => update({ safe_zone: e.target.checked })}
            />
            <span>安全区</span>
          </label>
        </div>

        <div className="field-group">
          <label>出口连接</label>
          {Object.keys(scene.exits).length === 0 ? (
            <div className="empty-hint">暂无出口</div>
          ) : (
            Object.entries(scene.exits).map(([dir, targetId]) =>
              targetId ? (
                <div key={dir} className="exit-card">
                  <span className="exit-dir">{DIRECTION_LABELS[dir as Direction]}</span>
                  <span className="exit-target">→ {targetId}</span>
                  <button
                    className="remove-entity-btn"
                    onClick={() => onDeleteExit(dir as Direction)}
                  >
                    删除
                  </button>
                </div>
              ) : null,
            )
          )}
        </div>

        <div className="field-group">
          <div className="entities-header">
            <label>实体引用</label>
            <button className="add-entity-btn" onClick={addEntity}>
              + 添加
            </button>
          </div>

          {local.entities.length === 0 && (
            <div className="empty-hint">暂无实体</div>
          )}

          {local.entities.map((ref, index) => {
            return (
              <div key={index} className="entity-card">
                <div className="entity-card-header">
                  <select
                    value={ref.type}
                    onChange={(e) =>
                      updateEntityRef(index, { type: e.target.value as SceneEntityRef['type'], template_id: '' })
                    }
                  >
                    <option value="npc">NPC</option>
                    <option value="item">物品</option>
                  </select>
                  <button
                    className="remove-entity-btn"
                    onClick={() => removeEntity(index)}
                  >
                    删除
                  </button>
                </div>

                <div className="entity-template-row">
                  <select
                    value={ref.template_id}
                    onChange={(e) => updateEntityRef(index, { template_id: e.target.value })}
                  >
                    <option value="">-- 选择模板 --</option>
                    {templateOptions(ref.type).map((id) => (
                      <option key={id} value={id}>
                        {id}{resolveTemplateNameById(ref.type, id) ? ` (${resolveTemplateNameById(ref.type, id)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {ref.type === 'item' && (
                  <input
                    type="number"
                    placeholder="数量"
                    min={1}
                    value={ref.quantity ?? 1}
                    onChange={(e) =>
                      updateEntityRef(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                  />
                )}

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={ref.visible !== false}
                    onChange={(e) => updateEntityRef(index, { visible: e.target.checked })}
                  />
                  <span>可见性</span>
                </label>
              </div>
            );
          })}
        </div>

        <button className="delete-scene-btn" onClick={onDelete}>
          🗑 删除此场景
        </button>
      </div>
    </div>
  );
}
