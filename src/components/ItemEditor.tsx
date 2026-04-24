import { useState } from 'react';
import type { ItemTemplate, ItemRarity, EquipSlot } from '../types/map';

interface ItemEditorProps {
  items: Record<string, ItemTemplate>;
  onUpdateItems: (items: Record<string, ItemTemplate>) => void;
  onClose: () => void;
}

export function ItemEditor({ items, onUpdateItems, onClose }: ItemEditorProps) {
  const [editingItem, setEditingItem] = useState<ItemTemplate | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const itemList = Object.values(items);

  const handleSelect = (item: ItemTemplate) => {
    setEditingItem(structuredClone(item));
    setIsNew(false);
  };

  const handleNew = () => {
    setEditingItem({
      id: '',
      name: '',
      description: '',
      rarity: 'common',
      stackable: false,
    });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.id.trim()) {
      alert('请输入物品 ID');
      return;
    }
    if (!editingItem.name.trim()) {
      alert('请输入物品名称');
      return;
    }
    setSaving(true);
    try {
      onUpdateItems({ ...items, [editingItem.id]: editingItem });
      setIsNew(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    if (!confirm(`确定删除物品「${editingItem.name}」？`)) return;
    setSaving(true);
    try {
      const updated = { ...items };
      delete updated[editingItem.id];
      onUpdateItems(updated);
      setEditingItem(null);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (patch: Partial<ItemTemplate>) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, ...patch });
  };

  return (
    <div className="scene-editor">
      <div className="scene-editor-header">
        <h3>物品模板管理</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="scene-editor-body">
        <div className="template-list-header">
          <span className="template-count">{itemList.length} 个模板</span>
          <button className="add-entity-btn" onClick={handleNew}>+ 新建</button>
        </div>

        <div className="template-list">
          {itemList.map((item) => (
            <div
              key={item.id}
              className={`template-item ${editingItem?.id === item.id && !isNew ? 'active' : ''}`}
              onClick={() => handleSelect(item)}
            >
              <span className="template-item-name">{item.name}</span>
              <span className="template-item-id">{item.id}</span>
            </div>
          ))}
          {itemList.length === 0 && (
            <div className="empty-hint">暂无物品模板</div>
          )}
        </div>

        {editingItem && (
          <div className="template-form">
            <div className="field-group">
              <label>物品 ID</label>
              <input
                type="text"
                value={editingItem.id}
                onChange={(e) => updateField({ id: e.target.value })}
                readOnly={!isNew}
                className={!isNew ? 'readonly' : ''}
              />
            </div>

            <div className="field-group">
              <label>名称</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => updateField({ name: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label>描述</label>
              <textarea
                value={editingItem.description}
                onChange={(e) => updateField({ description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="field-row">
              <div className="field-group half">
                <label>图标 (Emoji)</label>
                <input
                  type="text"
                  value={editingItem.icon ?? ''}
                  onChange={(e) => updateField({ icon: e.target.value || undefined })}
                />
              </div>
              <div className="field-group half">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingItem.visible !== false}
                    onChange={(e) => updateField({ visible: e.target.checked })}
                  />
                  <span>可见</span>
                </label>
              </div>
            </div>

            <div className="field-group">
              <label>标签（逗号分隔）</label>
              <input
                type="text"
                value={(editingItem.tags ?? []).join(', ')}
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

            <div className="field-group">
              <label>稀有度</label>
              <select
                value={editingItem.rarity ?? 'common'}
                onChange={(e) => updateField({ rarity: e.target.value as ItemRarity })}
              >
                <option value="common">普通 (common)</option>
                <option value="uncommon">罕见 (uncommon)</option>
                <option value="rare">稀有 (rare)</option>
                <option value="epic">史诗 (epic)</option>
                <option value="legendary">传说 (legendary)</option>
              </select>
            </div>

            <div className="field-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editingItem.stackable ?? false}
                  onChange={(e) => updateField({ stackable: e.target.checked })}
                />
                <span>可堆叠</span>
              </label>
            </div>

            {editingItem.stackable && (
              <div className="field-group">
                <label>最大堆叠数</label>
                <input
                  type="number"
                  value={editingItem.max_stack ?? ''}
                  onChange={(e) =>
                    updateField({ max_stack: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
            )}

            <div className="field-row">
              <div className="field-group half">
                <label>价值</label>
                <input
                  type="number"
                  value={editingItem.value ?? ''}
                  onChange={(e) =>
                    updateField({ value: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="field-group half">
                <label>重量</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.weight ?? ''}
                  onChange={(e) =>
                    updateField({ weight: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                />
              </div>
            </div>

            <div className="field-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editingItem.usable ?? false}
                  onChange={(e) => updateField({ usable: e.target.checked })}
                />
                <span>可使用</span>
              </label>
            </div>

            {editingItem.usable && (
              <>
                <div className="field-group">
                  <label>效果类型</label>
                  <input
                    type="text"
                    value={editingItem.effect?.type ?? ''}
                    onChange={(e) =>
                      updateField({
                        effect: { ...editingItem.effect, type: e.target.value, value: editingItem.effect?.value },
                      })
                    }
                  />
                </div>
                <div className="field-group">
                  <label>效果数值</label>
                  <input
                    type="number"
                    value={editingItem.effect?.value ?? ''}
                    onChange={(e) =>
                      updateField({
                        effect: {
                          type: editingItem.effect?.type ?? '',
                          value: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                  />
                </div>
              </>
            )}

            <div className="field-group">
              <label>装备槽位</label>
              <select
                value={editingItem.equip_slot ?? ''}
                onChange={(e) => updateField({ equip_slot: (e.target.value as EquipSlot) || null })}
              >
                <option value="">不可穿戴</option>
                <option value="weapon">武器 (weapon)</option>
                <option value="helmet">头盔 (helmet)</option>
                <option value="chest">胸甲 (chest)</option>
                <option value="legs">腿甲 (legs)</option>
                <option value="boots">靴子 (boots)</option>
                <option value="ring">戒指 (ring)</option>
                <option value="necklace">项链 (necklace)</option>
                <option value="accessory">饰品 (accessory)</option>
              </select>
            </div>

            {editingItem.equip_slot && (
              <div className="field-group">
                <label>装备加成 (JSON，如 {`{"attack":10}`})</label>
                <input
                  type="text"
                  value={editingItem.bonuses ? JSON.stringify(editingItem.bonuses) : ''}
                  onChange={(e) => {
                    try {
                      const val = e.target.value.trim();
                      updateField({ bonuses: val ? JSON.parse(val) : null });
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                />
              </div>
            )}

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
