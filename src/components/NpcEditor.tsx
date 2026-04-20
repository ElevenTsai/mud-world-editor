import { useState } from 'react';
import type { NpcTemplate, AiBehavior } from '../types/map';
import { upsertNpc, deleteNpc } from '../lib/db';

interface NpcEditorProps {
  npcs: Record<string, NpcTemplate>;
  onUpdateNpcs: (npcs: Record<string, NpcTemplate>) => void;
  onClose: () => void;
}

export function NpcEditor({ npcs, onUpdateNpcs, onClose }: NpcEditorProps) {
  const [editingNpc, setEditingNpc] = useState<NpcTemplate | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const npcList = Object.values(npcs);

  const handleSelect = (npc: NpcTemplate) => {
    setEditingNpc(structuredClone(npc));
    setIsNew(false);
  };

  const handleNew = () => {
    setEditingNpc({
      id: '',
      name: '',
      description: '',
      ai: 'passive',
    });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editingNpc || !editingNpc.id.trim()) {
      alert('请输入 NPC ID');
      return;
    }
    if (!editingNpc.name.trim()) {
      alert('请输入 NPC 名称');
      return;
    }
    setSaving(true);
    try {
      await upsertNpc(editingNpc);
      onUpdateNpcs({ ...npcs, [editingNpc.id]: editingNpc });
      setIsNew(false);
    } catch (err) {
      alert(`保存失败: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingNpc) return;
    if (!confirm(`确定删除 NPC「${editingNpc.name}」？`)) return;
    setSaving(true);
    try {
      await deleteNpc(editingNpc.id);
      const updated = { ...npcs };
      delete updated[editingNpc.id];
      onUpdateNpcs(updated);
      setEditingNpc(null);
    } catch (err) {
      alert(`删除失败: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (patch: Partial<NpcTemplate>) => {
    if (!editingNpc) return;
    setEditingNpc({ ...editingNpc, ...patch });
  };

  return (
    <div className="scene-editor">
      <div className="scene-editor-header">
        <h3>NPC 模板管理</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="scene-editor-body">
        <div className="template-list-header">
          <span className="template-count">{npcList.length} 个模板</span>
          <button className="add-entity-btn" onClick={handleNew}>+ 新建</button>
        </div>

        <div className="template-list">
          {npcList.map((npc) => (
            <div
              key={npc.id}
              className={`template-item ${editingNpc?.id === npc.id && !isNew ? 'active' : ''}`}
              onClick={() => handleSelect(npc)}
            >
              <span className="template-item-name">{npc.name}</span>
              <span className="template-item-id">{npc.id}</span>
            </div>
          ))}
          {npcList.length === 0 && (
            <div className="empty-hint">暂无 NPC 模板</div>
          )}
        </div>

        {editingNpc && (
          <div className="template-form">
            <div className="field-group">
              <label>NPC ID</label>
              <input
                type="text"
                value={editingNpc.id}
                onChange={(e) => updateField({ id: e.target.value })}
                readOnly={!isNew}
                className={!isNew ? 'readonly' : ''}
              />
            </div>

            <div className="field-group">
              <label>名称</label>
              <input
                type="text"
                value={editingNpc.name}
                onChange={(e) => updateField({ name: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label>描述</label>
              <textarea
                value={editingNpc.description}
                onChange={(e) => updateField({ description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="field-group">
              <label>标签（逗号分隔）</label>
              <input
                type="text"
                value={(editingNpc.tags ?? []).join(', ')}
                onChange={(e) =>
                  updateField({
                    tags: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div className="field-row">
              <div className="field-group half">
                <label>等级</label>
                <input
                  type="number"
                  value={editingNpc.level ?? ''}
                  onChange={(e) =>
                    updateField({ level: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="field-group half">
                <label>境界</label>
                <input
                  type="text"
                  value={editingNpc.realm ?? ''}
                  onChange={(e) => updateField({ realm: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field-group half">
                <label>HP</label>
                <input
                  type="number"
                  value={editingNpc.hp ?? ''}
                  onChange={(e) =>
                    updateField({ hp: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="field-group half">
                <label>最大 HP</label>
                <input
                  type="number"
                  value={editingNpc.max_hp ?? ''}
                  onChange={(e) =>
                    updateField({ max_hp: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field-group half">
                <label>MP</label>
                <input
                  type="number"
                  value={editingNpc.mp ?? ''}
                  onChange={(e) =>
                    updateField({ mp: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="field-group half">
                <label>最大 MP</label>
                <input
                  type="number"
                  value={editingNpc.max_mp ?? ''}
                  onChange={(e) =>
                    updateField({ max_mp: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field-group third">
                <label>攻击</label>
                <input
                  type="number"
                  value={editingNpc.attack ?? ''}
                  onChange={(e) =>
                    updateField({ attack: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="field-group third">
                <label>防御</label>
                <input
                  type="number"
                  value={editingNpc.defense ?? ''}
                  onChange={(e) =>
                    updateField({ defense: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="field-group third">
                <label>速度</label>
                <input
                  type="number"
                  value={editingNpc.speed ?? ''}
                  onChange={(e) =>
                    updateField({ speed: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
            </div>

            <div className="field-group">
              <label>AI 行为</label>
              <select
                value={editingNpc.ai ?? 'passive'}
                onChange={(e) => updateField({ ai: e.target.value as AiBehavior })}
              >
                <option value="passive">被动 (passive)</option>
                <option value="aggressive">攻击性 (aggressive)</option>
              </select>
            </div>

            <div className="field-group">
              <label>对话</label>
              <textarea
                value={editingNpc.dialogue ?? ''}
                onChange={(e) => updateField({ dialogue: e.target.value || undefined })}
                rows={2}
              />
            </div>

            <div className="field-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editingNpc.visible !== false}
                  onChange={(e) => updateField({ visible: e.target.checked })}
                />
                <span>可见</span>
              </label>
            </div>

            <div className="field-group">
              <label>掉落（逗号分隔）</label>
              <input
                type="text"
                value={(editingNpc.drop ?? []).join(', ')}
                onChange={(e) =>
                  updateField({
                    drop: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div className="template-actions">
              <button
                className="toolbar-btn primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '⏳ 保存中...' : '💾 保存到数据库'}
              </button>
              {!isNew && (
                <button
                  className="delete-scene-btn"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  🗑 删除此模板
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
