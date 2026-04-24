-- Seed data: 江州鱼埠 (jz_)

-- NPC Templates
INSERT INTO npc_templates (id, name, description, tags, visible, level, realm, hp, max_hp, mp, max_mp, attack, defense, speed, ai, dialogue, "drop") VALUES
  ('mob_river_ghost', '江中游魂', '在镇潮阁周围江面飘荡的幽魂，因执念未消而困于此处，感知到入侵者便会出手。', ARRAY['怪物','鬼族']::text[], true, 4, '闻道四境', 160, 160, 40, 40, 16, 6, 9, 'aggressive', '……还……不……走……', '{"items": [{"chance": 0.35, "item_id": "item_ghost_wisp", "quantity": 1}]}'),
  ('mob_sewer_beast', '暗渠异化生物', '在鱼埠暗渠中变异的生物，身形扭曲，眼睛发着幽光，爪子坚硬如铁。', ARRAY['怪物']::text[], true, 2, '闻道二境', 80, 80, 10, 10, 12, 4, 8, 'aggressive', '——（低沉的嘶叫，爪子划过石壁）', '{"items": [{"chance": 0.3, "item_id": "item_sewer_shard", "quantity": 1}]}'),
  ('npc_afu_waiter', '跑堂的阿福', '十六七岁，腿脚麻利，记性极好，能一口气报出二十道菜名。梦想是攒够钱去云栖城见见世面。', ARRAY['可交互']::text[], true, 2, '闻道二境', 120, 120, 40, 40, 2, 2, 14, 'passive', '来了来了！要点什么？江团、鲤鱼、鱼丸汤、清炒河虾——（一口气报出二十个菜名）', '{}'),
  ('npc_ali_fishing_girl', '小渔娘阿鲤', '十五六岁的姑娘，扎着红头绳，帮父亲卖鱼。性格活泼，对师徒二人充满好奇。', ARRAY['可交互']::text[], true, 2, '闻道二境', 120, 120, 40, 40, 3, 2, 12, 'passive', '你们是新来的？江鱼最好吃的部位是鱼腩——不要告诉我爹我说了！', '{}'),
  ('npc_ashan_laborer', '拉桶的苦力阿山', '三十来岁，肌肉结实，光着膀子，汗水混着江水。沉默寡言，但干活极卖力。', ARRAY['可交互']::text[], true, 4, '闻道四境', 280, 280, 60, 60, 8, 6, 7, 'passive', '（沉默地继续拉桶，只是对你点了点头）', '{}'),
  ('npc_ashou_elder', '祭拜的老渔民阿寿', '每年清明前来镇潮阁上香的老渔民，他熟知阁内布局与禁忌，是难得的引路人。', ARRAY['可交互','渔民']::text[], true, 5, '闻道五境', 300, 300, 80, 80, 5, 4, 4, 'passive', '老朽每年清明都来上香。阁内三层皆可登，但三层钟楼……轻易别惊动那口钟。', '{}'),
  ('npc_awang_apprentice', '学徒阿旺', '十五岁，跟着葛师傅学手艺，毛手毛脚经常被骂。对师父徒弟的关系格外有感触。', ARRAY['可交互']::text[], true, 2, '闻道二境', 110, 110, 35, 35, 3, 2, 9, 'passive', '唉，师父又骂我了……你也是师父带来的徒弟吗？不容易的……', '{}'),
  ('npc_chen_fisherman', '陈老鱼头', '渔户营里最年长的老渔民，满脸风霜，嗓门洪亮。知道江州鱼埠所有掌故。', ARRAY['可交互','渔民']::text[], true, 4, '闻道四境', 250, 250, 80, 80, 6, 5, 4, 'passive', '这片江我走了五十年。水里的事，你问我就对了。', '{}'),
  ('npc_ding_guard', '押运官丁锐', '负责将官仓鱼货运往内陆的武官，腰悬长刀，神色严肃。近日为江道不通畅而烦恼。', ARRAY['可交互','武官']::text[], true, 10, '见界一境', 650, 650, 200, 200, 18, 14, 9, 'passive', '江道不通，上头催得紧。鱼货压着出不去，这差事没法干了。', '{}'),
  ('npc_ge_master', '葛师傅', '分拣厂的头儿，一把刮鳞刀用了二十年，刀刃薄如纸。为人沉默寡言，但手艺极精。', ARRAY['可交互','工匠']::text[], true, 8, '闻道八境', 500, 500, 100, 100, 12, 9, 5, 'passive', '刮鱼鳞这门手艺，学三年才算入门。你手上那把刀——拿错了。', '{}'),
  ('npc_hong_ancestor_spirit', '残魂·洪氏先祖', '初代守钟人洪氏留下的一缕残识，因执念未消而困守镇潮阁三层。若隐若现，沉默而哀伤。', ARRAY['可交互','鬼族','隐藏']::text[], true, 15, '见界四境', 1200, 1200, 800, 800, 20, 15, 10, 'passive', '……是后辈？那执念……还未消……（虚影颤抖，若隐若现）', '{}'),
  ('npc_hong_regular', '常客洪大爷', '白发苍苍的老者，每日午时必来栖浪酒家，一壶酒一碟鱼，坐在临窗位置看江。有人说他年轻时是镇潮阁的守钟人。', ARRAY['可交互']::text[], true, 12, '见界一境', 800, 800, 500, 500, 8, 12, 4, 'passive', '……（注视着江面，轻声）那阁，我年轻时也去过。钟声一响，什么妖邪都安分了。', '{}'),
  ('npc_lao_fan_manager', '递运廊管事老范', '负责调度整个递运廊的木桶流转，手里一面小红旗，嘴里叼着哨子。脾气急躁，但把廊内秩序管得井井有条。', ARRAY['可交互']::text[], true, 7, '闻道七境', 430, 430, 120, 120, 9, 7, 8, 'passive', '（吹哨子）十三号桶跑偏了！阿山快去！——你别挡道，在这廊里站着等着被桶撞。', '{}'),
  ('npc_lao_qin_guard', '看仓人老秦', '六十多岁，孤身一人守着蓄鱼仓。养了一条大黑狗，对陌生人很警觉。年轻时曾是江上最好的捕鱼人。', ARRAY['可交互','渔民']::text[], true, 6, '闻道六境', 400, 400, 100, 100, 9, 8, 4, 'passive', '大黑，别叫！……这位，蓄鱼仓非公务人员请止步。有何贵干？', '{}'),
  ('npc_lao_wu_accountant', '账房先生老吴', '林万舟的心腹，永远在打算盘，眼神锐利。对数字极为敏感，进出账目从不出错。', ARRAY['可交互']::text[], true, 8, '闻道八境', 480, 480, 180, 180, 5, 7, 5, 'passive', '（噼里啪啦打算盘，头也不抬）进出账目一清二楚——你有什么事？', '{}'),
  ('npc_lin_guildmaster', '会首林万舟', '商会的主事人，四十来岁，精明强干，穿着绸缎长衫，手指上戴着碧玉扳指。控制着江州大半的鱼货贸易。', ARRAY['可交互','商人']::text[], true, 12, '见界一境', 750, 750, 250, 250, 15, 12, 8, 'passive', '做生意嘛，要的就是信息。你们从哪来，往哪去，说来听听。', '{}'),
  ('npc_lu_bo', '老匠人鲁伯', '修船的手艺传了三代，江州鱼埠没有他没修过的船。爱抽旱烟，说话慢悠悠的。', ARRAY['可交互','工匠']::text[], true, 8, '闻道八境', 480, 480, 120, 120, 11, 9, 4, 'passive', '……（叼着旱烟，慢悠悠地说）这船我修过。上次来是三年前……钉子松了。', '{}'),
  ('npc_menghe_merchant', '来自云栖城的商人孟舸', '专门来鱼埠采购干货的云栖城商人，有一艘自己的云舟。近期被困在鱼埠，因为江道难行、云舟又不敢飞太低。', ARRAY['可交互','商人']::text[], true, 10, '见界一境', 620, 620, 220, 220, 10, 9, 8, 'passive', '云舟困在这里好几天了……不是我不想飞，江道灵气乱着呢，飞低了危险。', '{}'),
  ('npc_shuanzi_apprentice', '小徒弟栓子', '十二三岁，跟着鲁伯学艺。手里总拿着一把小刨子，干活认真得可爱。', ARRAY['可交互']::text[], true, 2, '闻道二境', 100, 100, 30, 30, 3, 2, 10, 'passive', '（认真地刨着木料，舌头微微伸出来）师父说，做工不认真就是不尊重木头。', '{}'),
  ('npc_shuisheng', '少年渔夫水生', '十七八岁，黝黑精壮，刚跟着父亲出完早潮回来。满心向往能去更远的地方闯荡。', ARRAY['可交互','渔民']::text[], true, 3, '闻道三境', 200, 200, 60, 60, 6, 4, 11, 'passive', '我早晚要出去闯闯！江外面有那么多地方……你们是从哪来的？', '{}'),
  ('npc_sun_laoliu', '补网的孙老六', '五十来岁，腿有点跛，说是年轻时被大鱼拖下水伤了筋骨。一边补网一边哼着渔歌。', ARRAY['可交互','渔民']::text[], true, 5, '闻道五境', 310, 310, 80, 80, 8, 6, 4, 'passive', '（哼着渔歌，头也不抬）这网要补结实才行，不然大鱼一撞就散架了……', '{}'),
  ('npc_tao_scribe', '书吏陶先生', '江州官仓的主簿，年过半百，永远在打瞌睡，但账目一丝不苟。案头有一壶永远喝不完的浓茶。', ARRAY['可交互','官员']::text[], true, 6, '闻道六境', 350, 350, 150, 150, 4, 5, 3, 'passive', '嗯……啊？哦，渔税账目请在这里……（打了个哈欠，继续翻账簿）', '{}'),
  ('npc_wang_official', '收鱼的小吏王典', '江州官仓派驻蓄鱼仓的书吏，负责登记每日入仓的鱼获数量，总是抱怨这里腥味太重。', ARRAY['可交互','官员']::text[], true, 4, '闻道四境', 220, 220, 70, 70, 4, 4, 6, 'passive', '今日入仓五百二十三斤……这腥味，再待一年我非得辞官不可。', '{}'),
  ('npc_wu_fishball', '挑担卖鱼丸的吴婶', '热气腾腾的鱼丸汤是鱼市一绝，渔民们收工后都爱来一碗。为人热情，是鱼市的一道风景。', ARRAY['可交互','商人']::text[], true, 3, '闻道三境', 160, 160, 50, 50, 3, 3, 7, 'passive', '来碗鱼丸汤！热乎的，三文钱，暖到心里去！', '{}'),
  ('npc_yu_innkeeper', '掌柜余半城', '据说年轻时在京城御膳房待过，后来回到江州开了栖浪酒家。圆脸善目，做菜极讲究。', ARRAY['可交互','商人']::text[], true, 9, '见界一境', 560, 560, 200, 200, 7, 8, 5, 'passive', '清蒸江团刚上桌，要不要来一份？——老厨子的手艺，城里找不出第二家。', '{}'),
  ('npc_zhao_boatmaster', '赵船主', '拥有三条渔船的富户，爱吹嘘自己见过江中水妖，三丈长、鱼头蛇身。', ARRAY['可交互','船主']::text[], true, 6, '闻道六境', 380, 380, 100, 100, 10, 8, 6, 'passive', '我见过江中水妖！三丈长，鱼头蛇身——你们不信我？', '{}'),
  ('npc_zheng_shopkeeper', '郑记鱼行的郑掌柜', '精明的鱼贩子，能一眼看出鱼的成色和斤两。手里永远捏着一把算盘。', ARRAY['可交互','商人']::text[], true, 5, '闻道五境', 300, 300, 80, 80, 5, 5, 6, 'passive', '这条鱼不够新鲜，你看这眼睛——要买就买好的，我这里绝不卖隔夜货。', '{}'),
  ('npc_zhou_market_broker', '巡市的鱼牙子老周', '官府指定的市场中间人，负责评等定价、代收鱼税，话不多但公平。', ARRAY['可交互']::text[], true, 7, '闻道七境', 420, 420, 120, 120, 8, 7, 7, 'passive', '今日三等鱼，市价八文。要卖？要买？我这本账，少一两都不行。', '{}');

-- Item Templates
INSERT INTO item_templates (id, name, description, tags, icon, visible, rarity, stackable, max_stack, value, weight, usable, effect, equip_slot, bonuses) VALUES
  ('item_boat_permit', '乘舟凭证', '赴镇潮阁所需的通行凭证，盖有海港商会的印章。', ARRAY['道具','关键物品']::text[], '📜', true, 'rare', false, 1, 0, 0.01, false, NULL, NULL, NULL),
  ('item_bronze_bell_hammer', '铜钟木槌', '沉甸甸的硬木槌子，用于敲击镇潮阁的青铜大钟。', ARRAY['道具','关键物品']::text[], '🔔', true, 'rare', false, 1, 50, 0.50, true, '{"type": "ring_bell", "value": 1}', NULL, NULL),
  ('item_clear_incense', '一缕清香', '在镇潮阁神龛前点燃香烛后凝聚而成的清香，能平息残魂的初始警惕。', ARRAY['消耗品','关键物品']::text[], '💫', true, 'rare', true, 1, 0, 0.01, true, '{"type": "pacify_spirit", "value": 1}', NULL, NULL),
  ('item_fish_balls_soup', '鱼丸汤', '栖浪酒家的热乎鱼丸汤，鲜美回甘，令人精神一振。', ARRAY['食物','消耗品']::text[], '🍲', true, 'common', true, 10, 8, 0.30, true, '{"type": "restore_hp", "value": 60}', NULL, NULL),
  ('item_fishing_hook', '鱼钩', '削磨精良的铁制鱼钩，用作暗器也出奇制胜。', ARRAY['装备','武器']::text[], '🎣', true, 'common', false, 1, 12, 0.10, false, NULL, 'weapon', '{"attack": 2}'),
  ('item_fishing_net', '旧渔网', '编织细密的旧渔网，网线有些磨损，但仍可凑合使用。', ARRAY['材料']::text[], '🕸️', true, 'common', true, 5, 6, 1.00, false, NULL, NULL, NULL),
  ('item_fresh_fish', '鲜鱼', '刚从清江打捞上来的新鲜活鱼，银鳞闪闪，眼睛透亮。', ARRAY['食物','消耗品']::text[], '🐟', true, 'common', true, 20, 4, 0.50, true, '{"type": "restore_hp", "value": 30}', NULL, NULL),
  ('item_ghost_wisp', '游魂残念', '江中游魂消散后留下的残念碎片，隐约散发着幽冷的光。', ARRAY['材料']::text[], '👻', true, 'uncommon', true, 10, 20, 0.02, false, NULL, NULL, NULL),
  ('item_incense_stick', '香烛', '祭祀用的细长香烛，在水神神龛前点燃可获得神明庇佑。', ARRAY['消耗品','关键物品']::text[], '🕯️', true, 'uncommon', true, 5, 10, 0.05, true, '{"type": "use_at_shrine", "value": 1}', NULL, NULL),
  ('item_sewer_shard', '暗渠碎骨片', '暗渠异化生物身上脱落的骨质碎片，散发着异样的腥气。', ARRAY['材料']::text[], '🦴', true, 'uncommon', true, 10, 15, 0.10, false, NULL, NULL, NULL);

-- Scenes
INSERT INTO scenes (id, name, description, safe_zone, environment, level_min, level_max, exits) VALUES
  ('jz_fishing_village', '渔户营', '沿江一片高脚竹棚，渔网晾在竹架上随风轻摆，空气里弥漫着咸腥的江水味。光脚的孩子在木栈道上追逐，老渔妇坐在门槛上织补渔网。', true, 'river', 1, 8, '{"west": "jz_fish_market", "east": "jz_east_dock", "south": "jz_fish_warehouse"}'),
  ('jz_east_dock', '渔户营东侧码头', '江边的简陋木栈台，几根粗木桩深插江底，系着两三艘渔船。浪头拍打木桩，水花四溅。江心处，玄章镇潮阁的轮廓在晨雾中若隐若现。', true, 'river', 1, 5, '{"west": "jz_fishing_village", "north": "jz_tower_floor1", "east": "yx_chaoyuan_gate"}'),
  ('jz_fish_market', '江州鱼市', '天未亮就喧闹起来的集市，青石板地面永远湿漉漉的。竹筐里冰块上码着银鳞闪闪的鲜鱼，鱼贩子扯着嗓子吆喝，买主蹲在筐前挑挑拣拣。', true, 'river', 1, 8, '{"north": "jz_harbor_guild", "east": "jz_fishing_village", "south": "jz_qilang_inn_f1"}'),
  ('jz_processing_factory', '清鳞分拣厂', '沿码头一字排开的长条形工棚，数十个石台上铺着竹篾垫子。工人们手起刀落，鱼鳞飞溅，血水顺着石槽流入江中。空气里的腥味浓得化不开。', true, 'river', 1, 6, '{"north": "jz_qilang_inn_f1", "east": "jz_official_granary", "south": "jz_fish_corridor"}'),
  ('jz_fish_warehouse', '蓄鱼仓', '石砌的大池子引入活江水，池水幽绿，隐约可见大鱼的黑影缓缓游动。仓壁上有刻度，记录着不同季节的水位。墙角有暗渠闸门，直通大江。', true, 'river', 1, 6, '{"west": "jz_qilang_inn_f1", "north": "jz_fishing_village", "east": "jz_fishing_house", "south": "jz_official_granary"}'),
  ('jz_fishing_house', '捕鱼房', '渔民的公用棚屋，墙上钉满挂渔网的木楔子，墙角堆着竹篓、鱼叉和浮漂。正对门的墙上挂着一排木牌，写着历代在此捕鱼遇难的船主姓名。', true, 'river', 1, 6, '{"west": "jz_fish_warehouse", "south": "jz_repair_workshop"}'),
  ('jz_official_granary', '江州官仓', '青砖灰瓦的官家库房，门口立着"渔税重地，闲人免进"的石碑。门廊下坐着一个打瞌睡的老书吏，面前的木桌上摊着厚厚的鱼鳞册。', true, 'river', 1, 8, '{"west": "jz_processing_factory", "north": "jz_fish_warehouse", "east": "jz_repair_workshop"}'),
  ('jz_repair_workshop', '修辑坊', '弥漫着桐油与木屑气味的手艺铺子。一艘半成新的渔船倒扣在木架上，船底正在上油灰。刨花卷了一地，墙角麻丝堆成小山。', true, 'river', 1, 8, '{"north": "jz_fishing_house", "west": "jz_official_granary"}'),
  ('jz_fish_corridor', '活鱼递运廊', '一条架在江面上的有盖长廊，木柱深深打入江底。廊道里并排铺着两道竹轨，装满鲜鱼的木桶沿着竹轨滑动，由人拉着送往岸上的车马码头。水声哗哗，江风穿廊而过。', true, 'river', 1, 6, '{"north": "jz_processing_factory"}'),
  ('jz_qilang_inn_f1', '栖浪酒家·一层', '推门而入，酒香菜香扑面而来。大堂摆着十来张方桌，坐满了早起的渔民和船工。柜台后挂着一面酒旗，上书"清蒸江团"四字。灶头蒸汽腾腾，一口大铁锅里翻滚着鱼骨浓汤。', true, 'river', 1, 8, '{"north": "jz_fish_market", "east": "jz_fish_warehouse", "south": "jz_processing_factory", "up": "jz_qilang_inn_f2"}'),
  ('jz_qilang_inn_f2', '栖浪酒家·二层', '沿吱呀作响的木梯而上，二楼安静了许多。几间雅间用竹帘隔开，窗外可见江面船帆点点。一间雅间内有人低声密谈，空气中残留着一缕好茶的清香。', true, 'river', 1, 8, '{"down": "jz_qilang_inn_f1", "up": "jz_qilang_inn_f3"}'),
  ('jz_qilang_inn_f3', '栖浪酒家·三层', '掌柜的私室兼账房。窗前一张大书案，摞着厚厚的账本。墙上挂着一幅褪色的渔港旧画。角落的博古架上摆着几只旧瓷瓶，看着不起眼，但识货的人知道件件是好东西。', true, 'river', 1, 8, '{"down": "jz_qilang_inn_f2"}'),
  ('jz_harbor_guild', '海港商会', '青砖院落，门楣上悬着"海港商会"的匾额，笔力遒劲。院内账房先生噼里啪啦打着算盘，各地的商贾在此喝茶谈生意，说着南腔北调的话。', true, 'river', 1, 8, '{"south": "jz_fish_market"}'),
  ('jz_tower_floor1', '玄章镇潮阁·一层', '青石铺地的阁楼一层，正中供奉水神塑像，两侧各有一排香案。阁内陈设简朴而整洁，仿佛有人定期打扫，却看不见人影。角落里摆着一张旧木桌，台面上刻满细密的水纹。', true, 'river', 2, 8, '{"up": "jz_tower_floor2", "south": "jz_east_dock"}'),
  ('jz_tower_floor2', '玄章镇潮阁·二层', '阁楼二层，四面开有木格窗，可见浩渺江面。木架上陈列着历代守钟人的遗物——一顶斗笠、一双草鞋、一卷褪色的抄经。空气比一层冷了许多，有种说不清的肃静。', true, 'river', 2, 8, '{"down": "jz_tower_floor1", "up": "jz_tower_floor3"}'),
  ('jz_tower_floor3', '玄章镇潮阁·三层', '阁顶钟楼，一口青铜古钟悬于正中，钟身布满水纹和古篆文字。钟体周围空气微微震颤，偶尔无风而响，令人毛骨悚然。钟旁地面有一道浅浅的凹痕，像是某件重物坠落时留下的。', false, 'river', 3, 10, '{"down": "jz_tower_floor2"}');

-- Scene Entities
INSERT INTO scene_entities (scene_id, template_id, entity_type, quantity, tags, visible) VALUES
  ('jz_fishing_village', 'npc_chen_fisherman', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fishing_village', 'npc_ali_fishing_girl', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fishing_village', 'npc_zhao_boatmaster', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_market', 'npc_zheng_shopkeeper', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_market', 'npc_zhou_market_broker', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_market', 'npc_wu_fishball', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_market', 'item_fresh_fish', 'item', 5, ARRAY[]::text[], true),
  ('jz_processing_factory', 'npc_ge_master', 'npc', 1, ARRAY[]::text[], true),
  ('jz_processing_factory', 'npc_awang_apprentice', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_warehouse', 'npc_lao_qin_guard', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_warehouse', 'npc_wang_official', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_warehouse', 'mob_sewer_beast', 'npc', 1, ARRAY['怪物']::text[], true),
  ('jz_fishing_house', 'npc_sun_laoliu', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fishing_house', 'npc_shuisheng', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fishing_house', 'item_fishing_hook', 'item', 1, ARRAY[]::text[], true),
  ('jz_fishing_house', 'item_fishing_net', 'item', 2, ARRAY[]::text[], true),
  ('jz_official_granary', 'npc_tao_scribe', 'npc', 1, ARRAY[]::text[], true),
  ('jz_official_granary', 'npc_ding_guard', 'npc', 1, ARRAY[]::text[], true),
  ('jz_repair_workshop', 'npc_lu_bo', 'npc', 1, ARRAY[]::text[], true),
  ('jz_repair_workshop', 'npc_shuanzi_apprentice', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_corridor', 'npc_ashan_laborer', 'npc', 1, ARRAY[]::text[], true),
  ('jz_fish_corridor', 'npc_lao_fan_manager', 'npc', 1, ARRAY[]::text[], true),
  ('jz_qilang_inn_f1', 'npc_afu_waiter', 'npc', 1, ARRAY[]::text[], true),
  ('jz_qilang_inn_f1', 'npc_hong_regular', 'npc', 1, ARRAY[]::text[], true),
  ('jz_qilang_inn_f1', 'item_fish_balls_soup', 'item', 3, ARRAY[]::text[], true),
  ('jz_qilang_inn_f3', 'npc_yu_innkeeper', 'npc', 1, ARRAY[]::text[], true),
  ('jz_harbor_guild', 'npc_lin_guildmaster', 'npc', 1, ARRAY[]::text[], true),
  ('jz_harbor_guild', 'npc_lao_wu_accountant', 'npc', 1, ARRAY[]::text[], true),
  ('jz_harbor_guild', 'npc_menghe_merchant', 'npc', 1, ARRAY[]::text[], true),
  ('jz_harbor_guild', 'item_boat_permit', 'item', 1, ARRAY[]::text[], true),
  ('jz_tower_floor1', 'npc_ashou_elder', 'npc', 1, ARRAY[]::text[], true),
  ('jz_tower_floor1', 'item_incense_stick', 'item', 3, ARRAY[]::text[], true),
  ('jz_tower_floor2', 'mob_river_ghost', 'npc', 1, ARRAY['怪物']::text[], true),
  ('jz_tower_floor3', 'npc_hong_ancestor_spirit', 'npc', 1, ARRAY['隐藏']::text[], false),
  ('jz_tower_floor3', 'item_bronze_bell_hammer', 'item', 1, ARRAY[]::text[], true);

-- Quests
INSERT INTO quests (id, name, description, quest_type, sort_order, steps, rewards) VALUES
  ('quest_jz_fishing_village_intro', '鱼埠初临', '你与师父踏上江州鱼埠的木栈道，陈老鱼头热情地向你介绍这片渔港。打听一番之后，你得知镇潮阁的钟声最近失常，江道也变得危机四伏。', 'guide', 1, '[{"step":1,"type":"talk_to_npc","target":"npc_chen_fisherman","description":"与陈老鱼头对话","hint":"在渔户营找到陈老鱼头，了解鱼埠的近况"},{"step":2,"type":"go_to_scene","target":"jz_harbor_guild","description":"前往海港商会","hint":"找到商会，了解云舟停航的原因"},{"step":3,"type":"talk_to_npc","target":"npc_menghe_merchant","description":"与云栖城商人孟舸交谈","hint":"了解为何云舟不敢起飞"},{"step":4,"type":"go_to_scene","target":"jz_tower_floor1","description":"前往玄章镇潮阁","hint":"乘舟前往江心镇潮阁，探查钟声异常"},{"step":5,"type":"talk_to_npc","target":"npc_ashou_elder","description":"与阿寿交谈","hint":"在阁一层见到祭拜的老渔民阿寿，了解镇潮阁的历史"}]'::jsonb, '{"exp": 80, "items": [{"item_id": "item_incense_stick", "quantity": 1}]}'::jsonb);
