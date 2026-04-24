import type { Scene } from '../types/map';
import { getAreaPrefix, getAreaInfo } from '../utils/areaConfig';

interface AreaEditorProps {
  areaPrefix: string;
  scenes: Record<string, Scene>;
  onClose: () => void;
}

export function AreaEditor({ areaPrefix, scenes, onClose }: AreaEditorProps) {
  const info = getAreaInfo(areaPrefix);

  const areaScenes = Object.values(scenes).filter(
    (s) => getAreaPrefix(s.id) === areaPrefix,
  );

  const npcIds = new Set<string>();
  const itemIds = new Set<string>();
  for (const scene of areaScenes) {
    for (const entity of scene.entities) {
      if (entity.type === 'npc') npcIds.add(entity.template_id);
      else if (entity.type === 'item') itemIds.add(entity.template_id);
    }
  }

  return (
    <div className="scene-editor">
      <div className="scene-editor-header">
        <h3>🗺️ 地图属性</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="scene-editor-body">
        <div className="field-group">
          <label>地图名称</label>
          <input type="text" value={info.label} readOnly />
        </div>

        <div className="field-group">
          <label>场景 ID 前缀</label>
          <input type="text" value={`${info.prefix}_`} readOnly />
        </div>

        <div className="field-group">
          <label>对应 SQL 文件</label>
          <input type="text" value={`data/${info.fileName}`} readOnly />
        </div>

        <div className="field-group">
          <label>统计</label>
          <div className="exit-list">
            <div className="exit-item">
              <span className="exit-dir">场景</span>
              <span className="exit-target">{areaScenes.length} 个</span>
            </div>
            <div className="exit-item">
              <span className="exit-dir">NPC</span>
              <span className="exit-target">{npcIds.size} 种</span>
            </div>
            <div className="exit-item">
              <span className="exit-dir">物品</span>
              <span className="exit-target">{itemIds.size} 种</span>
            </div>
          </div>
        </div>

        <div className="field-group">
          <label>场景列表</label>
          <div className="exit-list" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {areaScenes.map((scene) => (
              <div key={scene.id} className="exit-item">
                <span className="exit-dir">{scene.name}</span>
                <span className="exit-target">{scene.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
