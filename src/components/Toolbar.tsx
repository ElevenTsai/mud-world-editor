import type { WorldData } from '../types/map';

interface ToolbarProps {
  onAddScene: () => void;
  onExport: () => WorldData;
}

export function Toolbar({ onAddScene, onExport }: ToolbarProps) {
  const handleSaveLocal = async () => {
    try {
      const worldData = onExport();
      const res = await fetch('/api/save-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: worldData.scenes }),
      });
      const json = await res.json() as { ok: boolean; error?: string };
      if (json.ok) {
        alert('已保存到 data/scenes.json');
      } else {
        alert(`保存失败: ${json.error ?? '未知错误'}`);
      }
    } catch (err) {
      alert(`保存失败: ${(err as Error).message}`);
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
          <button
            className="toolbar-btn primary"
            onClick={handleSaveLocal}
            title="保存场景数据到项目 data/scenes.json（仅开发模式可用）"
          >
            💾 保存到本地
          </button>
        </div>
      </div>
    </>
  );
}
