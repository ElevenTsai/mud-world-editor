-- Seed data: 云栖城 (yx_)

-- NPC Templates
INSERT INTO npc_templates (id, name, description, tags, visible, level, realm, hp, max_hp, mp, max_mp, attack, defense, speed, ai, dialogue, "drop") VALUES
  ('mob_cliff_hawk', '悬崖猎鹰妖', '盘旋在云栖城崖壁外侧的猛禽妖怪，体形硕大，羽毛如锋刃，俯冲时能掀起狂风。', ARRAY['怪物','妖族']::text[], true, 11, '见界二境', 450, 450, 60, 60, 28, 14, 16, 'aggressive', '嗖！（羽毛如箭矢，从你头顶掠过）', '{"items": [{"chance": 0.35, "item_id": "item_hawk_feather", "quantity": 1}]}'),
  ('mob_cloud_sprite', '云雾游魂', '在云舟修葺台缭绕的迷失幽魂，依附云雾而生，受灵气紊乱影响越发活跃。', ARRAY['怪物','鬼族']::text[], true, 7, '闻道七境', 280, 280, 80, 80, 18, 8, 10, 'aggressive', '嗬——（它散成一片白雾，随即重聚）', '{"items": [{"chance": 0.4, "item_id": "item_float_lingshi", "quantity": 1}]}'),
  ('mob_void_drifter', '虚空飘魂', '通玄门广场边缘的失控游魂，受法阵紊乱而困在此处无法传送，徘徊中渐趋危险。', ARRAY['怪物','鬼族']::text[], true, 16, '见界五境', 800, 800, 300, 300, 40, 20, 12, 'aggressive', '我……要……过……去……（它伸出无形的手，眼神茫然而危险）', '{"items": [{"chance": 0.25, "item_id": "item_void_crystal", "quantity": 1}]}'),
  ('npc_apprentice_wu', '学徒小伍', '祝师傅的徒弟，十七八岁，勤快好学，但有时冒冒失失，偶尔会打翻朱砂。', ARRAY['可交互']::text[], true, 5, '闻道五境', 280, 280, 80, 80, 6, 4, 12, 'passive', '啊！对不起！不小心弄洒朱砂了！师父别生气……', '{}'),
  ('npc_delivery_boy_ajiu', '送菜的少年阿韭', '陶翁的孙子，每天背着竹篓往城中各酒楼送菜，熟悉云栖城的每一条捷径。', ARRAY['可交互']::text[], true, 3, '闻道三境', 180, 180, 50, 50, 3, 2, 13, 'passive', '让开让开！给望霄楼送菜，误了时辰要罚钱的！', '{}'),
  ('npc_dock_dispatcher_ding', '泊舟调度使丁娘子', '三十多岁的干练妇人，执掌整个烟舟坊的泊位调度，手拿一面彩旗，嗓音清亮。是云栖城中实权人物之一。', ARRAY['可交互','调度使']::text[], true, 18, '见界七境', 1500, 1500, 600, 600, 25, 20, 14, 'passive', '泊位紧张——你们的云舟靠三号位，快！', '{}'),
  ('npc_farmer_tao', '种菜老农陶翁', '六十多岁，一辈子在崖壁上种菜，练就了一身攀崖的好本领。菜畦里的菜长得格外水灵，他说是云雾滋养的缘故。', ARRAY['可交互','渔民']::text[], true, 6, '闻道六境', 400, 400, 120, 120, 7, 8, 4, 'passive', '云雾养人也养菜。这崖边种的菜，城里各家餐馆都来争。', '{}'),
  ('npc_gate_guardian_lu', '守门修士陆清玄', '三十余岁，筑基期修士，受宗门派遣驻守通玄门。神情淡漠，但对职责一丝不苟。是城中修为最高的人。', ARRAY['可交互','修士','筑基']::text[], true, 30, '筑基三境', 3000, 3000, 3000, 3000, 60, 45, 16, 'passive', '通玄门今日关闭。持通玄令者方可申请开启。', '{}'),
  ('npc_gate_officer_liang', '城门校尉梁宽', '负责朝元门通航秩序的武官，手执令旗站在门洞一侧的平台上。凡入城云舟均需经他目检。', ARRAY['可交互','武官']::text[], true, 15, '见界四境', 900, 900, 300, 300, 30, 25, 10, 'passive', '入城需登记。你是随孟舸的船队来的？', '{}'),
  ('npc_junk_merchant_luo', '杂货商罗胖子', '什么都卖的商人，货物从针头线脑到旧法器碎片无所不包。爱吹牛，消息灵通。', ARRAY['可交互','商人']::text[], true, 10, '见界一境', 650, 650, 200, 200, 8, 10, 6, 'passive', '要什么？符纸、旧法器、云栖特产——我罗某人什么都有！', '{}'),
  ('npc_lamp_boy_mingzhu', '司灯童子明烛', '十二三岁，霍准的徒弟，负责爬上台顶点亮或更换灯笼。手脚极灵活，眼神清亮。', ARRAY['可交互']::text[], true, 5, '闻道五境', 300, 300, 80, 80, 4, 3, 15, 'passive', '我要爬上去换灯！等我一下！', '{}'),
  ('npc_market_chief_jin', '市头老金', '管理市集秩序的老者，负责处理纠纷和收取摊位费。手里一根长竹竿，用来勾住滑过头顶的货篮。', ARRAY['可交互']::text[], true, 8, '闻道八境', 550, 550, 150, 150, 10, 8, 6, 'passive', '秩序！都规矩点！丢了货找我登记，别堵着索道！', '{}'),
  ('npc_master_craftsman_zhu', '大匠作祝师傅', '云栖城最好的云舟工匠，五十来岁，手掌粗糙如树皮。负责云舟修葺台的日常运作，对浮空法阵了如指掌。', ARRAY['可交互','商人','工匠']::text[], true, 22, '见界九境', 2000, 2000, 800, 800, 35, 30, 6, 'passive', '你的云舟出了问题？说说症状，浮空法阵的事我最清楚。', '{}'),
  ('npc_menghe_guide_agui', '孟舸的伙计阿桂', '跟随孟舸做生意的少年，对云栖城熟门熟路，可充当临时向导。', ARRAY['可交互','向导']::text[], true, 6, '闻道六境', 380, 380, 100, 100, 8, 5, 12, 'passive', '跟我来！云栖城分上下好几层，我最熟悉了。', '{}'),
  ('npc_navigator_huo', '引航使霍准', '五十来岁，面色严峻，负责观测气象与江面状况，决定航标信号。常年穿着一件防风斗篷。', ARRAY['可交互','引航使']::text[], true, 20, '见界九境', 1800, 1800, 1200, 1200, 30, 22, 12, 'passive', '现在是缓行信号。风向不对，云舟减速。', '{}'),
  ('npc_painter_wenyu', '观景的年轻画师文屿', '二十出头，支着画板在顶楼画云海，画技不俗。寡言少语，但画中常有别人看不见的东西。', ARRAY['可交互']::text[], true, 8, '闻道八境', 500, 500, 700, 700, 5, 4, 8, 'passive', '……（他专注地画着，云海中隐约有什么你看不见的东西。）', '{}'),
  ('npc_porter_chief_lao_ma', '货运脚夫头老马', '管理着坊内百来号脚夫，肩膀上搭着一条白汗巾。为人豪爽，知道城里所有的货运捷径。', ARRAY['可交互']::text[], true, 10, '见界一境', 700, 700, 150, 150, 18, 12, 8, 'passive', '要抬货？找我。城里没有我老马不知道的捷径。', '{}'),
  ('npc_storyteller_liu', '说书人柳三变', '每日午后在望霄楼二楼说书，讲的是云栖城古今掌故，尤其爱讲镇潮阁老龙的故事。听众极多。', ARRAY['可交互','说书人']::text[], true, 12, '见界一境', 800, 800, 1000, 1000, 6, 8, 7, 'passive', '各位看官，今日说的是——镇潮阁下那头沉睡的老龙！', '{}'),
  ('npc_talisman_granny', '卖护身符的阿婆', '七十来岁，满脸皱纹，卖自己画的黄纸符。别人都当她是骗钱，但有人说那些符上确有微弱的灵气。', ARRAY['可交互']::text[], true, 15, '见界四境', 1000, 1000, 1200, 1200, 5, 10, 3, 'passive', '买一张护身符吧——五文钱。有用没用……看缘分。', '{}'),
  ('npc_talisman_master_suo', '法阵铭文师素娥', '三十来岁的女修，擅长在云舟底部铭刻浮空符文。性格清冷，但手法极稳，能感知灵气波动。', ARRAY['可交互','修士']::text[], true, 15, '见界四境', 1000, 1000, 1500, 1500, 15, 12, 10, 'passive', '……（她抬起头，目光沉静）灵气有些乱。你身上带着远方的波动。', '{}'),
  ('npc_tea_master_wen', '茶博士温老先生', '望霄楼的掌柜兼主泡，须发皆白，对茶道极有研究。手中一把紫砂壶养得温润如玉。', ARRAY['可交互','商人','茶博士']::text[], true, 18, '见界七境', 1400, 1400, 1800, 1800, 8, 15, 5, 'passive', '云雾茶配云栖泉……二十年前亲眼见通玄门开启，那才是真正的奇景。', '{}'),
  ('npc_tea_vendor_qinger', '卖云雾茶的小贩青儿', '十五六岁的姑娘，提篮叫卖云栖城特产的云雾茶，声音甜脆。', ARRAY['可交互','商人']::text[], true, 3, '闻道三境', 150, 150, 60, 60, 3, 2, 10, 'passive', '云雾茶嘞——喝了神清气爽！', '{}'),
  ('npc_traveler_mysterious', '待传送的旅人', '一名风尘仆仆的旅人，从江州腹地深处而来，等候传送前往下一片土地。', ARRAY['可交互']::text[], true, 8, '闻道八境', 500, 500, 200, 200, 5, 4, 8, 'passive', '我从江州腹地深处来……若有机会，你该往更深处走走，那里有更古老的秘密。', '{}');

-- Item Templates
INSERT INTO item_templates (id, name, description, tags, icon, visible, rarity, stackable, max_stack, value, weight, usable, effect, equip_slot, bonuses) VALUES
  ('item_cliff_vegetable', '崖间青蔬', '云栖城崖壁梯田上种出的时蔬，云雾滋养，格外鲜嫩。', ARRAY['食物','消耗品']::text[], '🥬', true, 'common', true, 20, 5, 0.20, true, '{"type": "restore_hp", "value": 40}', NULL, NULL),
  ('item_cloud_mist_tea', '云雾茶', '云栖城特产，以山泉与云雾共酿，入口甘冽，能提振精神。', ARRAY['食物','消耗品']::text[], '🍵', true, 'common', true, 30, 12, 0.05, true, '{"type": "restore_mp", "value": 25}', NULL, NULL),
  ('item_cloud_sea_painting', '云海画卷', '年轻画师文屿所绘的云海长卷，画中似隐有旁人看不见的景象。', ARRAY['奇物','收藏']::text[], '🖼️', true, 'rare', false, 1, 150, 0.10, false, NULL, NULL, NULL),
  ('item_float_lingshi', '浮空灵石', '嵌入云舟底部浮空法阵的灵石，散发着淡蓝色的光芒。', ARRAY['材料']::text[], '🌟', true, 'uncommon', true, 20, 40, 0.08, false, NULL, NULL, NULL),
  ('item_float_mist_essence', '云雾精华', '从云栖城浓雾中提炼的精华，质地如流动的薄纱。', ARRAY['材料']::text[], '💨', true, 'uncommon', true, 20, 35, 0.02, false, NULL, NULL, NULL),
  ('item_hawk_feather', '猎鹰妖羽', '悬崖猎鹰妖脱落的羽毛，坚硬如刀，边缘锋利。', ARRAY['材料']::text[], '🪶', true, 'uncommon', true, 20, 28, 0.05, false, NULL, NULL, NULL),
  ('item_navigation_lantern', '引路灯笼', '云栖城引航台使用的大型灯笼，三色互换，指引云舟进出。', ARRAY['道具']::text[], '🏮', true, 'uncommon', true, 5, 20, 0.30, false, NULL, NULL, NULL),
  ('item_talisman_zhusha', '法阵朱砂', '云舟修葺台使用的高纯度朱砂，用于铭刻浮空符文。', ARRAY['材料']::text[], '🔴', true, 'uncommon', true, 20, 25, 0.05, false, NULL, NULL, NULL),
  ('item_tongyuan_token', '通玄令', '守门修士陆清玄颁发的通行令牌，持令可申请开启通玄门。', ARRAY['道具','关键物品']::text[], '🔑', true, 'rare', false, 1, 0, 0.01, false, NULL, NULL, NULL),
  ('item_void_crystal', '虚空晶石', '虚空飘魂消散后凝结的晶石，内部隐有旋转的暗色能量。', ARRAY['材料']::text[], '💠', true, 'rare', true, 10, 80, 0.15, false, NULL, NULL, NULL),
  ('item_yunxi_talisman', '云栖护符', '云栖城阿婆亲绘的护身符，经过特殊法术加持，能小幅增强防御与灵气感知。', ARRAY['装备','饰品']::text[], '🧿', true, 'uncommon', false, 1, 30, 0.10, false, NULL, 'accessory', '{"defense": 8, "spirit": 3}');

-- Scenes
INSERT INTO scenes (id, name, description, safe_zone, environment, level_min, level_max, exits) VALUES
  ('yx_chaoyuan_gate', '朝元门', '一座巨大的天然石门洞，开在峡谷崖壁之上，高逾二十丈。门洞内壁被云舟船底磨得光滑，风从门洞中呼啸而过，带着云气翻涌。门下就是翻腾的江水，云舟可直接穿门驶入。守门的武官执枪肃立，对着驶来的每一艘云舟挨个登记。', true, 'sky', 5, 15, '{"west": "jz_east_dock", "east": "yx_yanzhoufang", "north": "yx_yinhang_tai", "south": "yx_yunzhou_repair"}'),
  ('yx_yanzhoufang', '烟舟坊', '云栖城最繁忙的空中街区。巨大的崖壁凹陷被开凿成泊舟港，上下三层，每层都停靠着大小不一的云舟。舟夫们吆喝着装卸货物，货运竹筐顺着索道滑向崖壁各层。云气在坊间缭绕，恍如置身烟海。丁娘子的铜牌声一响，整片坊区立刻井然有序。', true, 'sky', 5, 15, '{"west": "yx_chaoyuan_gate", "east": "yx_qingshu_fang", "north": "yx_wangxiao_lou", "south": "yx_shiji"}'),
  ('yx_yinhang_tai', '引航台', '建于崖壁最高处的一座圆形石台，台上立着一根高达十丈的青铜柱，柱顶悬挂三盏巨大的灯笼——红、黄、绿三色，分别表示禁行、缓行、通行。台下石室中有一整套齿轮机关，连接着灯笼的升降。霍准驻台，目光远眺，方圆十里内的云舟动向尽在掌握。', true, 'sky', 5, 15, '{"south": "yx_chaoyuan_gate", "east": "yx_wangxiao_lou"}'),
  ('yx_wangxiao_lou', '望霄楼', '云栖城最高的楼阁，倚崖而建，飞檐如翼，每层回廊都悬着风铃，随风叮当作响。登上顶层，可见云海翻腾，远处的通玄门隐隐发光。楼下几层是茶楼，供人观景品茗，说书人柳三变的声音从某个角落传来，讲的总是那头沉睡的老龙。', true, 'sky', 5, 15, '{"west": "yx_yinhang_tai", "south": "yx_yanzhoufang"}'),
  ('yx_qingshu_fang', '青蔬坊', '利用崖壁外挑的多层木石平台开辟的菜园。一层层梯田般的菜畦里种着青菜、萝卜和香料，有竹管引来山泉灌溉。老农在崖边锄地，脚下就是万丈深渊，他却面色如常。崖风吹过，绿叶哗哗作响，偶尔一片菜叶飞起，消失在云雾之中。', true, 'mountain', 5, 12, '{"west": "yx_yanzhoufang", "south": "yx_tongyuan_gate"}'),
  ('yx_yunzhou_repair', '云舟修葺台', '悬空而建的大型工坊，从崖壁上伸出粗大的木梁，上面铺着厚厚的木板。两三艘云舟停靠在架上，工匠们正在检修船底的浮空法阵。空气中弥漫着桐油和朱砂的气味，偶尔有白色的云雾从缝隙中渗入，凝聚成形，令工匠们不得不时刻警惕。', true, 'sky', 8, 18, '{"north": "yx_chaoyuan_gate", "east": "yx_shiji"}'),
  ('yx_shiji', '市集', '利用高空悬索网在崖台之间转运货物的奇异集市。粗大的绳索编织成网，上面挂着大大小小的竹篮、木箱，顺着索道滑向不同崖台。商贩们就在索网节点处的平台上摆摊，卖什么的都有。市头老金的竹竿一敲，整个市集立刻安静半分。', true, 'sky', 5, 15, '{"west": "yx_yunzhou_repair", "north": "yx_yanzhoufang", "east": "yx_tongyuan_gate"}'),
  ('yx_tongyuan_gate', '通玄门', '云栖城的尽头，一座巨大的石门矗立在崖壁尽头。门框上刻满繁复的符文，门内是一片旋转的淡蓝色光幕——跨洲传送法阵。门前石砌广场宽阔，供往来修士和旅人休整等候。近日法阵隐有异动，守门修士面色凝重，广场上多了几道不明的游魂踪迹。', false, 'sky', 10, 25, '{"west": "yx_shiji", "north": "yx_qingshu_fang"}');

-- Scene Entities
INSERT INTO scene_entities (scene_id, template_id, entity_type, quantity, tags, visible) VALUES
  ('yx_chaoyuan_gate', 'npc_gate_officer_liang', 'npc', 1, ARRAY[]::text[], true),
  ('yx_chaoyuan_gate', 'npc_menghe_guide_agui', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yanzhoufang', 'npc_dock_dispatcher_ding', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yanzhoufang', 'npc_porter_chief_lao_ma', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yanzhoufang', 'npc_tea_vendor_qinger', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yanzhoufang', 'item_cloud_mist_tea', 'item', 5, ARRAY[]::text[], true),
  ('yx_yinhang_tai', 'npc_navigator_huo', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yinhang_tai', 'npc_lamp_boy_mingzhu', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yinhang_tai', 'item_navigation_lantern', 'item', 1, ARRAY[]::text[], true),
  ('yx_wangxiao_lou', 'npc_tea_master_wen', 'npc', 1, ARRAY[]::text[], true),
  ('yx_wangxiao_lou', 'npc_storyteller_liu', 'npc', 1, ARRAY[]::text[], true),
  ('yx_wangxiao_lou', 'npc_painter_wenyu', 'npc', 1, ARRAY[]::text[], true),
  ('yx_wangxiao_lou', 'item_cloud_sea_painting', 'item', 1, ARRAY['装饰']::text[], true),
  ('yx_qingshu_fang', 'npc_farmer_tao', 'npc', 1, ARRAY[]::text[], true),
  ('yx_qingshu_fang', 'npc_delivery_boy_ajiu', 'npc', 1, ARRAY[]::text[], true),
  ('yx_qingshu_fang', 'mob_cliff_hawk', 'npc', 1, ARRAY['怪物']::text[], true),
  ('yx_qingshu_fang', 'item_cliff_vegetable', 'item', 5, ARRAY[]::text[], true),
  ('yx_yunzhou_repair', 'npc_master_craftsman_zhu', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yunzhou_repair', 'npc_talisman_master_suo', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yunzhou_repair', 'npc_apprentice_wu', 'npc', 1, ARRAY[]::text[], true),
  ('yx_yunzhou_repair', 'mob_cloud_sprite', 'npc', 1, ARRAY['怪物']::text[], true),
  ('yx_yunzhou_repair', 'item_talisman_zhusha', 'item', 3, ARRAY[]::text[], true),
  ('yx_shiji', 'npc_market_chief_jin', 'npc', 1, ARRAY[]::text[], true),
  ('yx_shiji', 'npc_junk_merchant_luo', 'npc', 1, ARRAY[]::text[], true),
  ('yx_shiji', 'npc_talisman_granny', 'npc', 1, ARRAY[]::text[], true),
  ('yx_shiji', 'item_float_mist_essence', 'item', 1, ARRAY[]::text[], true),
  ('yx_tongyuan_gate', 'npc_gate_guardian_lu', 'npc', 1, ARRAY[]::text[], true),
  ('yx_tongyuan_gate', 'npc_traveler_mysterious', 'npc', 1, ARRAY[]::text[], true),
  ('yx_tongyuan_gate', 'mob_void_drifter', 'npc', 1, ARRAY['怪物']::text[], true);

-- Quests
INSERT INTO quests (id, name, description, quest_type, sort_order, steps, rewards) VALUES
  ('quest_yunxi_arrival', '初入云栖', '你随孟舸的云舟抵达云栖城，伙计阿桂说城中最高处的通玄门附近隐约有异动，建议你先在城中各处走走，摸清地形。', 'guide', 2, '[{"step":1,"type":"talk_to_npc","target":"npc_menghe_guide_agui","description":"与阿桂对话","hint":"在朝元门找孟舸的伙计阿桂"},{"step":2,"type":"go_to_scene","target":"yx_yinhang_tai","description":"前往引航台","hint":"沿栈道北行，找到引航台"},{"step":3,"type":"talk_to_npc","target":"npc_navigator_huo","description":"与引航使霍准交谈","hint":"询问霍准城中近来的情况"},{"step":4,"type":"go_to_scene","target":"yx_wangxiao_lou","description":"前往望霄楼","hint":"找到俯瞰云海的望霄楼"},{"step":5,"type":"go_to_scene","target":"yx_tongyuan_gate","description":"前往通玄门广场","hint":"抵达云栖城尽头，见到守门修士"},{"step":6,"type":"talk_to_npc","target":"npc_gate_guardian_lu","description":"与守门修士陆清玄对话","hint":"了解通玄门的异常情况"}]'::jsonb, '{"exp": 150, "items": [{"item_id": "item_float_lingshi", "quantity": 3}]}'::jsonb);
