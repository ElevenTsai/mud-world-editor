import { useState } from 'react';
import type { WorldData } from '../types/map';
import { saveWorld } from '../lib/db';

interface ToolbarProps {
  onAddScene: () => void;
  onExport: () => WorldData;
  onShowNpcs: () => void;
  onShowItems: () => void;
}

export function Toolbar({ onAddScene, onExport, onShowNpcs, onShowItems }: ToolbarProps) {
  const [saving, setSaving] = useState(false);

  const handleSaveToDb = async () => {
    setSaving(true);
    try {
      const worldData = onExport();
      await saveWorld(worldData);
      alert('已保存到数据库');
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
          <button className="toolbar-btn" onClick={onAddScene}>
            + 添加场景
          </button>
          <button className="toolbar-btn" onClick={onShowNpcs}>
            📋 NPC 模板
          </button>
          <button className="toolbar-btn" onClick={onShowItems}>
            📦 物品模板
          </button>
          <button
            className="toolbar-btn primary"
            onClick={handleSaveToDb}
            disabled={saving}
            title="保存全部数据到 Supabase 数据库"
          >
            {saving ? '⏳ 保存中...' : '💾 保存到数据库'}
          </button>
        </div>
      </div>
    </>
  );
}
