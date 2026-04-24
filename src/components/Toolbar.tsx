import { useState, useRef, useEffect, useCallback } from 'react';
import type { WorldData } from '../types/map';
import { AREA_CONFIG, type AreaInfo } from '../utils/areaConfig';
import { saveWorld } from '../lib/db';

interface ToolbarProps {
  onAddScene: (areaPrefix: string) => void;
  onAddArea: (info: AreaInfo) => void;
  onExport: () => WorldData;
  onShowNpcs: () => void;
  onShowItems: () => void;
}

export function Toolbar({ onAddScene, onAddArea, onExport, onShowNpcs, onShowItems }: ToolbarProps) {
  const [saving, setSaving] = useState(false);
  const [showAreaMenu, setShowAreaMenu] = useState(false);
  const [showAddAreaDialog, setShowAddAreaDialog] = useState(false);
  const [newAreaPrefix, setNewAreaPrefix] = useState('');
  const [newAreaLabel, setNewAreaLabel] = useState('');
  const [newAreaFileName, setNewAreaFileName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const areas: AreaInfo[] = Object.values(AREA_CONFIG);

  // Close menu on outside click
  useEffect(() => {
    if (!showAreaMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAreaMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAreaMenu]);

  // Auto-generate filename from prefix
  useEffect(() => {
    if (newAreaPrefix) {
      setNewAreaFileName(`seed_${newAreaPrefix}.sql`);
    }
  }, [newAreaPrefix]);

  const handleAddScene = useCallback((prefix: string) => {
    onAddScene(prefix);
    setShowAreaMenu(false);
  }, [onAddScene]);

  const handleAddArea = useCallback(() => {
    const prefix = newAreaPrefix.trim().toLowerCase();
    const label = newAreaLabel.trim();
    if (!prefix || !label) return;
    if (AREA_CONFIG[prefix]) {
      alert(`前缀 "${prefix}" 已存在`);
      return;
    }
    onAddArea({
      prefix,
      label,
      fileName: newAreaFileName.trim() || `seed_${prefix}.sql`,
    });
    setNewAreaPrefix('');
    setNewAreaLabel('');
    setNewAreaFileName('');
    setShowAddAreaDialog(false);
  }, [newAreaPrefix, newAreaLabel, newAreaFileName, onAddArea]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const worldData = onExport();
      await saveWorld(worldData);
      alert('已保存到 SQL 文件');
    } catch (err) {
      alert(`保存失败: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-title">◆ MUD 世界编辑器</span>
        </div>
        <div className="toolbar-right">
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              className="toolbar-btn"
              onClick={() => setShowAreaMenu((v) => !v)}
            >
              + 添加场景
            </button>
            {showAreaMenu && (
              <div className="toolbar-dropdown">
                {areas.map((area) => (
                  <button
                    key={area.prefix}
                    className="toolbar-dropdown-item"
                    onClick={() => handleAddScene(area.prefix)}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="toolbar-btn"
            onClick={() => setShowAddAreaDialog(true)}
          >
            + 添加地图
          </button>
          <button className="toolbar-btn" onClick={onShowNpcs}>
            📋 NPC 模板
          </button>
          <button className="toolbar-btn" onClick={onShowItems}>
            📦 物品模板
          </button>
          <button
            className="toolbar-btn primary"
            onClick={handleSave}
            disabled={saving}
            title="保存全部数据到 data/ 目录下的 SQL 文件"
          >
            {saving ? '⏳ 保存中...' : '💾 保存到文件'}
          </button>
        </div>
      </div>

      {showAddAreaDialog && (
        <div className="modal-overlay" onClick={() => setShowAddAreaDialog(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">添加新地图</h3>
            <div className="field-group">
              <label>地图前缀（英文缩写，用于场景ID前缀）</label>
              <input
                type="text"
                value={newAreaPrefix}
                onChange={(e) => setNewAreaPrefix(e.target.value.replace(/[^a-z0-9]/gi, '').toLowerCase())}
                placeholder="例如: sz"
                autoFocus
              />
            </div>
            <div className="field-group">
              <label>地图名称</label>
              <input
                type="text"
                value={newAreaLabel}
                onChange={(e) => setNewAreaLabel(e.target.value)}
                placeholder="例如: 苏州城"
              />
            </div>
            <div className="field-group">
              <label>SQL 文件名</label>
              <input
                type="text"
                value={newAreaFileName}
                onChange={(e) => setNewAreaFileName(e.target.value)}
                placeholder={`seed_${newAreaPrefix || 'xxx'}.sql`}
              />
            </div>
            <div className="modal-actions">
              <button className="toolbar-btn" onClick={() => setShowAddAreaDialog(false)}>
                取消
              </button>
              <button
                className="toolbar-btn primary"
                onClick={handleAddArea}
                disabled={!newAreaPrefix.trim() || !newAreaLabel.trim()}
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
