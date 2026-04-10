# MUD 世界编辑器

一个基于可视化节点图的 MUD（多用户地下城）世界编辑工具，支持场景创建、连接与数据导出。

## 技术栈

- **React 19** + **TypeScript**
- **Vite** 构建工具
- **[@xyflow/react](https://reactflow.dev/)** 可视化节点流图引擎

## 功能特性

### 🗺️ 可视化世界编辑
- 每个**场景**以节点卡片呈现，显示场景名、ID 以及实体统计（NPC / 物品数量）
- 节点四个方向（北 / 南 / 东 / 西）各有连接点，拖拽即可创建**双向**出口
- 支持网格对齐（20×20），内置缩略图（MiniMap）与缩放控件
- 同一方向不允许重复连出，不允许自身连接自身

### ✏️ 场景属性编辑
点击节点后，右侧弹出场景编辑面板，可编辑：
- 场景 ID、场景名称、场景描述
- 环境类型（下拉选择：山地 / 森林 / 城镇 / 洞穴 / 荒漠 / 沼泽 / 河流 / 平原 / 遗迹 / 地牢）
- 安全区开关
- 出口连接列表，支持查看和删除（删除时自动同步双向出口）
- 实体引用列表（NPC / 物品），通过下拉框选择模板，支持添加与删除
- 删除整个场景（同时移除关联连线）

> **注意**：编辑器仅修改 `scenes.json` 相关字段，NPC 和物品的模板属性（如 HP、攻击力等）不可在编辑器中修改。

### 🔗 双向连接
- 从场景 A 的某个方向拖线到场景 B 时，自动创建双向出口（如 A→东→B 和 B→西→A）
- 仅在目标场景的反方向空闲时创建反向连接
- 删除任一方向的出口时，双方的出口和连线均同步删除

### 📥 数据加载
- 项目启动时自动从 `data/` 目录加载 `scenes.json`、`npcs.json`、`items.json`
- 加载后以 BFS 广度优先算法根据出口方向自动排列节点位置
- 不可达的孤立场景自动排列在画布下方
- 加载失败时回退到内置默认数据

### 💾 保存到本地
- 点击「💾 保存到本地」，仅将 `scenes.json` 写入 `data/` 目录
- NPC 模板（`npcs.json`）和物品模板（`items.json`）不会被修改
- 通过 Vite 开发服务器的 API 端点实现，仅在开发模式下可用

## 数据架构

世界数据采用三层分离设计，存放于 `data/` 目录：

```
data/
├── scenes.json   # 地图层：场景结构与实体引用
├── npcs.json     # 模板层：NPC 完整定义
└── items.json    # 模板层：物品完整定义
```

| 层级 | 文件 | 说明 |
|------|------|------|
| **Scene 场景层** | `scenes.json` | 描述地图拓扑、出口、环境属性；`entities` 中只存 `template_id` 引用，不重复数据 |
| **Template 模板层** | `npcs.json` / `items.json` | 定义 NPC 和物品的完整属性，作为"原型"供场景复用 |
| **Entity 实体池** | 由引擎在运行时按模板实例化 | 运行时根据 `template_id` 克隆模板并附加实例差异（如 `quantity`） |

## 数据结构

### scenes.json

顶层结构为 `Record<string, Scene>`，键为场景 ID，值为场景对象。完整示例：

```json
{
  "outer_square": {
    "id": "outer_square",
    "name": "青云峰·外门广场",
    "description": "这里是青云峰的外门广场，云雾缭绕，几名外门弟子正在此处切磋。",
    "safe_zone": true,
    "environment": "mountain",
    "level_range": [1, 5],
    "exits": {
      "east": "mountain_path",
      "north": "herb_garden"
    },
    "entities": [
      { "template_id": "npc_jiandong", "type": "npc", "visible": true },
      { "template_id": "item_lingshi_fragment", "type": "item", "quantity": 3, "visible": true }
    ]
  }
}
```

#### Scene 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | `string` | ✅ | 场景唯一标识符，必须与顶层键名保持一致 |
| `name` | `string` | ✅ | 场景的显示名称 |
| `description` | `string` | ✅ | 场景的文字描述，进入场景时展示给玩家 |
| `safe_zone` | `boolean` | ✅ | 是否为安全区（`true` 表示不可战斗） |
| `environment` | `string` | ✅ | 环境类型：`mountain` / `forest` / `city` / `cave` / `desert` / `swamp` / `river` / `plain` / `ruins` / `dungeon` |
| `level_range` | `[number, number]` | ❌ | 推荐等级范围，如 `[1, 5]` |
| `exits` | `object` | ✅ | 出口映射，键为方向（`north`/`south`/`east`/`west`），值为目标场景 ID；未设置的方向可省略 |
| `entities` | `array` | ✅ | 场景内的实体引用列表，可为空数组 `[]` |

#### entities 实体引用字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `template_id` | `string` | ✅ | 指向 `npcs.json` 或 `items.json` 中的模板 ID |
| `type` | `string` | ✅ | 实体类型：`"npc"` 或 `"item"` |
| `quantity` | `number` | ❌ | 实例数量（仅物品），默认 `1` |
| `visible` | `boolean` | ❌ | 是否可见（用于隐藏物品 / 暗门），默认 `true` |
| `tags` | `string[]` | ❌ | 实例级标签，覆盖或追加模板标签 |

---

### npcs.json

顶层结构为 `Record<string, NpcTemplate>`，示例：

```json
{
  "npc_jiandong": {
    "id": "npc_jiandong",
    "name": "剑童",
    "type": "npc",
    "description": "一个背着木剑的小童，眼神清澈。",
    "tags": ["可交互"],
    "visible": true,
    "level": 1,
    "realm": "炼气期",
    "hp": 50, "max_hp": 50,
    "mp": 10, "max_mp": 10,
    "attack": 4, "defense": 2, "speed": 8,
    "ai": "passive",
    "dialogue": "小道友，你也是来修炼的吗？",
    "drop": []
  }
}
```

#### NpcTemplate 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | `string` | ✅ | NPC 模板唯一标识，与键名保持一致 |
| `name` | `string` | ✅ | 显示名称 |
| `type` | `string` | ✅ | 固定为 `"npc"` |
| `description` | `string` | ✅ | 外观描述 |
| `tags` | `string[]` | ❌ | 标签，如 `["可交互", "商人", "敌对"]` |
| `visible` | `boolean` | ❌ | 默认是否可见，默认 `true` |
| `level` | `number` | ❌ | 等级 |
| `realm` | `string` | ❌ | 境界（如：炼气期 / 筑基期 / 金丹期） |
| `hp` | `number` | ❌ | 当前生命值 |
| `max_hp` | `number` | ❌ | 最大生命值 |
| `mp` | `number` | ❌ | 当前法力值 |
| `max_mp` | `number` | ❌ | 最大法力值 |
| `attack` | `number` | ❌ | 攻击力 |
| `defense` | `number` | ❌ | 防御力 |
| `speed` | `number` | ❌ | 速度 |
| `ai` | `string` | ❌ | 行为模式：`passive`（被动）/ `aggressive`（主动攻击） |
| `dialogue` | `string` | ❌ | 默认对话文本 |
| `drop` | `string[]` | ❌ | 击杀后掉落的物品模板 ID 列表 |

---

### items.json

顶层结构为 `Record<string, ItemTemplate>`，示例：

```json
{
  "item_huiqi_dan": {
    "id": "item_huiqi_dan",
    "name": "回气丹",
    "type": "item",
    "description": "一颗散发着药香的丹药，服用后可恢复一定量的法力。",
    "tags": ["丹药", "消耗品"],
    "visible": true,
    "rarity": "uncommon",
    "stackable": true,
    "max_stack": 20,
    "value": 30,
    "weight": 0.05,
    "usable": true,
    "effect": { "type": "restore_mp", "value": 20 }
  }
}
```

#### ItemTemplate 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | `string` | ✅ | 物品模板唯一标识，与键名保持一致 |
| `name` | `string` | ✅ | 显示名称 |
| `type` | `string` | ✅ | 固定为 `"item"` |
| `description` | `string` | ✅ | 物品描述 |
| `tags` | `string[]` | ❌ | 标签，如 `["材料", "丹药", "消耗品"]` |
| `visible` | `boolean` | ❌ | 默认是否可见，默认 `true` |
| `rarity` | `string` | ❌ | 稀有度：`common` / `uncommon` / `rare` / `epic` / `legendary`，默认 `common` |
| `stackable` | `boolean` | ❌ | 是否可堆叠，默认 `true` |
| `max_stack` | `number` | ❌ | 最大堆叠数量，默认 `99` |
| `value` | `number` | ❌ | 交易价值（金币） |
| `weight` | `number` | ❌ | 单件重量（用于背包负重系统） |
| `usable` | `boolean` | ❌ | 是否可主动使用，默认 `false` |
| `effect` | `object` | ❌ | 使用效果（仅 `usable: true` 时生效） |

#### effect 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `type` | `string` | ✅ | 效果类型，如 `restore_hp` / `restore_mp` / `buff` |
| `value` | `number` | ❌ | 效果数值，如恢复量 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产包
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
data/
├── scenes.json             # 地图层：场景与实体引用
├── npcs.json               # 模板层：NPC 定义
└── items.json              # 模板层：物品定义
src/
├── types/
│   └── map.ts              # Scene / SceneEntityRef / Direction / WorldData 类型定义
├── utils/
│   ├── mapConverter.ts     # Scene ↔ React Flow 节点/边 互转工具
│   └── defaultScenes.ts    # 内置示例场景（青云峰，加载失败时使用）
├── components/
│   ├── SceneNode.tsx       # 节点卡片组件
│   ├── SceneEditor.tsx     # 右侧场景编辑面板（出口 / 实体引用管理）
│   └── Toolbar.tsx         # 顶部工具栏（添加场景 / 保存到本地）
├── App.tsx                 # 主应用，状态管理与事件协调
└── App.css                 # 全局样式
```

## Vite 开发服务器 API

在开发模式下，Vite 插件提供以下 API 端点：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/load-world` | GET | 读取 `data/` 下的三个 JSON 文件，返回完整世界数据 |
| `/api/save-world` | POST | 接收 `{ scenes }` 并写入 `data/scenes.json`（不修改 npcs/items） |

## 使用说明

1. **添加场景**：点击工具栏「+ 添加场景」，新节点随机出现在画布中央附近
2. **编辑场景**：点击任意节点，在右侧面板修改名称、描述、环境类型等属性
3. **连接场景**：从节点边缘的方向连接点拖拽到另一个节点，松开即创建双向出口
4. **删除连线**：在右侧编辑面板的「出口连接」区域点击「删除」，双方出口同步移除
5. **管理实体**：在右侧面板的「实体引用」区域，通过下拉框选择 NPC 或物品模板
6. **保存数据**：点击「💾 保存到本地」将场景数据写入 `data/scenes.json`
