# MUD 世界编辑器

一个基于可视化节点图的 MUD（多用户地下城）世界编辑工具，支持场景创建、连接与数据导出。

## 技术栈

- **React 19** + **TypeScript**
- **Vite** 构建工具
- **[@xyflow/react](https://reactflow.dev/)** 可视化节点流图引擎
- **[Supabase](https://supabase.com/)** 数据库（PostgreSQL）

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

> **注意**：NPC 和物品模板支持在编辑器中直接新建、编辑和删除，变更可独立保存到数据库。

### 📋 NPC 模板管理
点击工具栏「📋 NPC 模板」打开 NPC 模板面板：
- 查看所有 NPC 模板列表
- 新建 NPC 模板，设置 ID、名称、描述、等级、境界、战斗属性、AI 行为、对话等
- 编辑已有模板并保存到数据库
- 删除不需要的模板

### 📦 物品模板管理
点击工具栏「📦 物品模板」打开物品模板面板：
- 查看所有物品模板列表
- 新建物品模板，设置 ID、名称、描述、稀有度、堆叠、价值、使用效果等
- 编辑已有模板并保存到数据库
- 删除不需要的模板

### 🔗 双向连接
- 从场景 A 的某个方向拖线到场景 B 时，自动创建双向出口（如 A→东→B 和 B→西→A）
- 仅在目标场景的反方向空闲时创建反向连接
- 删除任一方向的出口时，双方的出口和连线均同步删除

### 📥 数据加载
- 项目启动时自动从 Supabase 数据库加载场景、NPC 模板和物品模板
- 加载后以 BFS 广度优先算法根据出口方向自动排列节点位置
- 不可达的孤立场景自动排列在画布下方
- 数据库连接失败时回退到内置默认数据

### 💾 保存到数据库
- 点击「💾 保存到数据库」将全部场景、NPC 模板、物品模板同步到 Supabase
- 自动对比数据库中已有数据与当前编辑器状态，删除多余条目，upsert 当前数据
- NPC / 物品模板也可在各自面板中独立保存

## 数据架构

编辑器数据存储在 Supabase（PostgreSQL）数据库的四张表中：

| 表名 | 说明 |
|------|------|
| `scenes` | 场景定义：id, name, description, environment, safe_zone, exits(jsonb), level_min/max |
| `scene_entities` | 场景实体引用：scene_id, template_id, entity_type, quantity, visible, tags |
| `npc_templates` | NPC 模板：id, name, description, tags, level, realm, hp/mp/attack/defense/speed, ai, dialogue, drop |
| `item_templates` | 物品模板：id, name, description, tags, rarity, stackable, max_stack, value, weight, usable, effect(jsonb) |

> `data/` 目录中的 JSON 文件保留作为备份/种子数据参考。

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

### NPC 模板（npc_templates 表）

```json
{
  "id": "npc_jiandong",
  "name": "剑童",
  "description": "一个背着木剑的小童，眼神清澈。",
  "tags": ["可交互"],
  "level": 1,
  "realm": "炼气期",
  "hp": 50,
  "mp": 10,
  "attack": 4, "defense": 2, "speed": 8,
  "ai": "passive",
  "dialogue": "小道友，你也是来修炼的吗？",
  "drop": []
}
```

#### NpcTemplate 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | `string` | ✅ | NPC 模板唯一标识 |
| `name` | `string` | ✅ | 显示名称 |
| `description` | `string` | ✅ | 外观描述 |
| `tags` | `string[]` | ❌ | 标签，如 `["可交互", "商人", "敌对"]` |
| `level` | `number` | ❌ | 等级 |
| `realm` | `string` | ❌ | 境界（如：炼气期 / 筑基期 / 金丹期） |
| `hp` | `number` | ❌ | 生命值 |
| `mp` | `number` | ❌ | 法力值 |
| `attack` | `number` | ❌ | 攻击力 |
| `defense` | `number` | ❌ | 防御力 |
| `speed` | `number` | ❌ | 速度 |
| `ai` | `string` | ❌ | 行为模式：`passive`（被动）/ `aggressive`（主动攻击） |
| `dialogue` | `string` | ❌ | 默认对话文本 |
| `drop` | `string[]` | ❌ | 击杀后掉落的物品模板 ID 列表 |

---

### 物品模板（item_templates 表）

```json
{
  "id": "item_huiqi_dan",
  "name": "回气丹",
  "description": "一颗散发着药香的丹药，服用后可恢复一定量的法力。",
  "tags": ["丹药", "消耗品"],
  "rarity": "uncommon",
  "stackable": true,
  "max_stack": 20,
  "value": 30,
  "weight": 0.05,
  "usable": true,
  "effect": { "type": "restore_mp", "value": 20 }
}
```

#### ItemTemplate 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | `string` | ✅ | 物品模板唯一标识 |
| `name` | `string` | ✅ | 显示名称 |
| `description` | `string` | ✅ | 物品描述 |
| `tags` | `string[]` | ❌ | 标签，如 `["材料", "丹药", "消耗品"]` |
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

# 复制环境变量模板并配置 Supabase 连接信息
cp .env.local.example .env.local
# 编辑 .env.local，填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

# 启动开发服务器
npm run dev

# 构建生产包
npm run build

# 预览构建结果
npm run preview
```

### Supabase 本地开发连接

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<见 supabase status 输出>
```

## 项目结构

```
src/
├── lib/
│   ├── supabase.ts          # Supabase 客户端初始化
│   └── db.ts                # 数据访问层（CRUD + 批量保存）
├── types/
│   └── map.ts               # Scene / NpcTemplate / ItemTemplate / WorldData 类型定义
├── utils/
│   ├── mapConverter.ts       # Scene ↔ React Flow 节点/边 互转工具
│   └── defaultScenes.ts     # 内置示例场景（数据库加载失败时使用）
├── components/
│   ├── SceneNode.tsx         # 节点卡片组件
│   ├── SceneEditor.tsx       # 场景编辑面板（出口 / 实体引用管理）
│   ├── NpcEditor.tsx         # NPC 模板管理面板（新建 / 编辑 / 删除）
│   ├── ItemEditor.tsx        # 物品模板管理面板（新建 / 编辑 / 删除）
│   └── Toolbar.tsx           # 顶部工具栏（添加场景 / 模板管理 / 保存到数据库）
├── App.tsx                   # 主应用，状态管理与事件协调
└── App.css                   # 全局样式
data/                          # 备份/种子 JSON 数据
.env.local.example             # 环境变量模板
```

## 使用说明

1. **添加场景**：点击工具栏「+ 添加场景」，新节点随机出现在画布中央附近
2. **编辑场景**：点击任意节点，在右侧面板修改名称、描述、环境类型等属性
3. **连接场景**：从节点边缘的方向连接点拖拽到另一个节点，松开即创建双向出口
4. **删除连线**：在右侧编辑面板的「出口连接」区域点击「删除」，双方出口同步移除
5. **管理实体**：在右侧面板的「实体引用」区域，通过下拉框选择 NPC 或物品模板
6. **管理 NPC 模板**：点击工具栏「📋 NPC 模板」，可新建、编辑、删除 NPC 模板并保存到数据库
7. **管理物品模板**：点击工具栏「📦 物品模板」，可新建、编辑、删除物品模板并保存到数据库
8. **保存全部数据**：点击「💾 保存到数据库」将场景、NPC 和物品数据全部同步到 Supabase
