export type ConclusionType = "官方事实" | "多来源共同建议" | "旅行者常见反馈" | "存在争议" | "编辑整理";

export type GuideSource = {
  id: string;
  title: string;
  siteName: string;
  url: string;
  category: string;
  official: boolean;
  checkedAt: string;
};

export type PracticalGuideCard = {
  title: string;
  audience: string;
  duration: string;
  advice: string;
  pitfall: string;
  alternative: string;
  conclusion: ConclusionType;
};

export type ItineraryNode = {
  time: string;
  title: string;
  meta: string;
  detail: string;
  connection: string;
  pitfall?: string;
  alternative?: string;
  sourceId?: string;
  factLabel?: string;
};

export type EditorialDay = {
  label: string;
  title: string;
  area: string;
  summary: string;
  reason: string;
  remove: string;
  nodes: ItineraryNode[];
};

export type EditorialRestaurant = {
  name: string;
  identity: string;
  why: string;
  order: string[];
  avoid: string;
  plannedFor: string;
  area: string;
  queue: string;
  alternative: string;
  checkedAt: string;
  sourceId: string;
  price?: string;
  priceSourceId?: string;
};

export type EditorialCityGuide = {
  slug: string;
  city: string;
  province: string;
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  intro: string;
  fit: string;
  stayAdvice: string;
  defaultDays: number;
  routeOptions: Array<{ days: number; label: string; summary: string; dayIndexes: number[] }>;
  guideTypes: string[];
  guideTypeNotes: Record<string, string>;
  themes: PracticalGuideCard[];
  days: EditorialDay[];
  restaurants: EditorialRestaurant[];
  foods: Array<{ name: string; order: string; when: string; note: string }>;
  decisions: Array<{ name: string; verdict: "值得去" | "可以放弃" | "看情况"; why: string; alternative: string }>;
  situations: Array<{ title: string; advice: string }>;
  checklist: string[];
  sources: GuideSource[];
  editedAt: string;
};

export const EDITORIAL_GUIDE_TYPES = [
  "第一次经典路线",
  "本地吃喝路线",
  "城市漫游路线",
  "拍照建筑路线",
  "博物馆路线",
  "周末两日路线",
  "松弛休息路线",
  "亲子路线",
  "雨天备用路线",
] as const;

export const TRAVEL_INTERESTS = [
  "第一次必去",
  "地道美食",
  "标志性餐厅",
  "少排队",
  "少折返",
  "城市漫游",
  "建筑摄影",
  "博物馆",
  "自然风景",
  "夜生活",
  "松弛休息",
  "小众体验",
] as const;

const CHECKED_AT = "2026-08-09T00:00:00+08:00";

const commonTypeNotes: Record<string, string> = {
  "第一次经典路线": "保留城市最有辨识度的部分，但不为了‘全打卡’跨区折返。",
  "本地吃喝路线": "把代表菜放进当天片区，优先老字号与长期经营的地方经典，不追短期网红店。",
  "城市漫游路线": "减少大景点数量，把时间留给连续街区、公共空间和城市日常。",
  "拍照建筑路线": "优先早晚光线与建筑外部空间，正午安排室内或用餐。",
  "博物馆路线": "每天最多安排一座主要博物馆，并为预约失败准备同片区替代。",
  "周末两日路线": "只保留两条最有代表性的片区线，不把远郊和市区硬塞在同一天。",
  "松弛休息路线": "每天保留午后或傍晚休息段，夜间活动默认可取消。",
  "亲子路线": "减少连续步行和排队，把需要早到的项目放在第一段。",
  "雨天备用路线": "优先有完整室内体验的博物馆、展馆与餐饮片区，缩短露天步行。",
};

const hangzhouSources: GuideSource[] = [
  { id: "hz-lingyin", title: "灵隐飞来峰景区预约公告", siteName: "杭州西湖风景名胜区", url: "https://westlake.hangzhou.gov.cn/art/2023/4/21/art_1229569795_59026147.html", category: "预约与参观", official: true, checkedAt: CHECKED_AT },
  { id: "hz-louwailou", title: "楼外楼｜中华老字号品牌详情", siteName: "商务部老字号数字博物馆", url: "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/ad535822bfbf41cfaa6c35d4a7b66bf3", category: "餐厅与美食", official: true, checkedAt: CHECKED_AT },
  { id: "hz-zhiweiguan", title: "知味观·味庄（西湖）餐厅条目", siteName: "米其林指南", url: "https://guide.michelin.com/sg/zh_CN/zhe-jiang/hangzhou_1027184/restaurant/zhi-wei-guan-%E2%80%A2-wei-zhuang", category: "餐厅与美食", official: false, checkedAt: CHECKED_AT },
  { id: "hz-kuiyuanguan", title: "奎元馆（解放路）餐厅条目", siteName: "米其林指南", url: "https://guide.michelin.com/en/zhe-jiang/hangzhou_1027184/restaurant/kui-yuan-guan-jiefang-road", category: "餐厅与美食", official: false, checkedAt: CHECKED_AT },
];

const chengduSources: GuideSource[] = [
  { id: "cd-panda", title: "成都大熊猫繁育研究基地票务服务", siteName: "成都大熊猫繁育研究基地", url: "https://www.panda.org.cn/cn/service/ticket/", category: "预约与参观", official: true, checkedAt: CHECKED_AT },
  { id: "cd-wuhou", title: "成都武侯祠博物馆预约参观", siteName: "成都武侯祠博物馆", url: "https://www.wuhouci.net.cn/", category: "预约与参观", official: true, checkedAt: CHECKED_AT },
  { id: "cd-chenmapo", title: "陈麻婆｜中华老字号品牌详情", siteName: "商务部老字号数字博物馆", url: "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/f7ab3a6e7ea0426d8fd104fc7c93df79", category: "餐厅与美食", official: true, checkedAt: CHECKED_AT },
  { id: "cd-longchaoshou", title: "龙抄手｜中华老字号品牌详情", siteName: "商务部老字号数字博物馆", url: "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/8236b3b91b554e27b8120caa19bd4f47", category: "餐厅与美食", official: true, checkedAt: CHECKED_AT },
  { id: "cd-zhong", title: "钟水饺｜中华老字号品牌详情", siteName: "商务部老字号数字博物馆", url: "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/8cf137a439d24c3a8ed22112e6243665", category: "餐厅与美食", official: true, checkedAt: CHECKED_AT },
];

const beijingSources: GuideSource[] = [
  { id: "bj-palace", title: "故宫博物院在线订票与参观说明", siteName: "故宫博物院", url: "https://www.dpm.org.cn/subject_booking/index.html", category: "预约与参观", official: true, checkedAt: CHECKED_AT },
  { id: "bj-palace-visit", title: "故宫博物院参观导览", siteName: "故宫博物院", url: "https://www.dpm.org.cn/Visit.html", category: "参观动线", official: true, checkedAt: CHECKED_AT },
  { id: "bj-quanjude", title: "全聚德｜中华老字号品牌详情", siteName: "商务部老字号数字博物馆", url: "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/0b69defa424d4c7696e81cd138ee5bd7", category: "餐厅与美食", official: true, checkedAt: CHECKED_AT },
  { id: "bj-donglaishun", title: "东来顺｜中华老字号品牌详情", siteName: "商务部老字号数字博物馆", url: "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/254137a0044545189d9c1a44b30ed75c", category: "餐厅与美食", official: true, checkedAt: CHECKED_AT },
  { id: "bj-huguosi", title: "首个非遗版春节老字号非遗菜专题", siteName: "商务部老字号数字博物馆", url: "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/articledeail/2757", category: "餐厅与美食", official: true, checkedAt: CHECKED_AT },
];

const hangzhou: EditorialCityGuide = {
  slug: "hangzhou", city: "杭州", province: "浙江", image: "/cities/hangzhou.jpg", imageAlt: "杭州西湖、群山与湖岸城市景观",
  eyebrow: "LAKE · TEA · CITY LIFE", title: "杭州不是环一圈西湖，而是把湖山、茶村和城市日常分开走。",
  intro: "第一次来最容易犯的错，是把西湖当成一个需要一天走完的景点。更省力的方式，是把北山街、灵隐山线、运河和南宋老城拆成四个片区，每天只解决一个主题。",
  fit: "适合愿意慢走、重视人文与吃饭质量的人。若只想拍几个地标，安排两天即可；想把茶村、运河和老城都走到，四天更舒服。",
  stayAdvice: "住宿建议：这份路线以凤起路—龙翔桥一带为据点，第一天可步行接入西湖北线，第二天方便进出灵隐，后两天用公共交通去运河和吴山；不需要中途换酒店。",
  defaultDays: 4,
  routeOptions: [
    { days: 2, label: "两日精简", summary: "北山街—孤山 + 灵隐—梅灵，舍弃运河与南宋老城。", dayIndexes: [0, 1] },
    { days: 3, label: "三日经典", summary: "西湖北线、灵隐山线、南宋老城；运河留给下次。", dayIndexes: [0, 1, 3] },
    { days: 4, label: "四日完整", summary: "湖、山、运河、老城各一天，强度最均衡。", dayIndexes: [0, 1, 2, 3] },
  ],
  guideTypes: [...EDITORIAL_GUIDE_TYPES], guideTypeNotes: commonTypeNotes,
  themes: [
    { title: "第一次去杭州，四天怎么安排", audience: "第一次到访、想看经典也想吃好", duration: "4天", advice: "把西湖、灵隐、运河和南宋老城拆成四条线。", pitfall: "不要把九溪、灵隐和湖滨塞进同一天。", alternative: "只有三天就删除运河日。", conclusion: "编辑整理" },
    { title: "西湖不绕圈的正确走法", audience: "不想暴走的人", duration: "半天", advice: "上午从北山街进，走白堤和孤山；傍晚再回湖滨。", pitfall: "断桥不是终点，真正值得走的是白堤与孤山。", alternative: "下雨时缩短湖岸，改去同片区室内展馆。", conclusion: "多来源共同建议" },
    { title: "杭州值得专程吃的四样东西", audience: "第一次了解杭帮味道", duration: "分散到4餐", advice: "片儿川、东坡肉、龙井虾仁和葱包桧分别放进老城、西湖与运河日。", pitfall: "甜口浓汁菜不要一次点太多。", alternative: "具体店排队时，保留菜名，换同片区长期经营餐厅。", conclusion: "编辑整理" },
    { title: "灵隐到底值不值得占半天", audience: "对宗教艺术、山林感兴趣的人", duration: "3—4小时", advice: "先看飞来峰造像，再在寺院中二选一。", pitfall: "连续刷多座寺院会消耗体力，也挤压茶村时间。", alternative: "约不到或客流过大时改走中国茶叶博物馆与龙井村。", conclusion: "存在争议" },
    { title: "周末人最多的地方与替代方案", audience: "周末与节假日出行", duration: "出发前5分钟读完", advice: "湖滨、灵隐和河坊街最容易拥挤，早到或换片区比排队更有效。", pitfall: "不要临时把所有热门点都挪到清晨。", alternative: "用运河、小河直街或南宋御街替代纯打卡。", conclusion: "旅行者常见反馈" },
    { title: "杭州下雨天还能去哪里", audience: "遇到连续降雨", duration: "1天备用", advice: "用博物馆、南宋遗址与杭帮菜正餐组成室内线。", pitfall: "雨天不建议强行走梅家坞长距离户外段。", alternative: "保留灵隐飞来峰短线，其余换室内。", conclusion: "编辑整理" },
  ],
  days: [
    { label: "DAY 01", title: "北山街与湖滨，不急着环完整个西湖", area: "北山街—白堤—孤山—湖滨", summary: "上午沿西湖北线慢走，午餐留在孤山，傍晚回湖滨。", reason: "四个节点在连续湖岸上，不用为了餐厅或夜景横穿城市。", remove: "如果当天较累，取消湖滨夜间散步。", nodes: [
      { time: "09:00", title: "北山街—断桥—白堤—孤山", meta: "湖岸步行 · 约2.5小时", detail: "从北山街进入，过断桥后继续走白堤与孤山。上午光线更柔和，也避开最晒的南线。", connection: "全段步行，不在断桥原路返回。", pitfall: "不要为了拍断桥在人流中停太久。" },
      { time: "12:00", title: "楼外楼午餐", meta: "DAY 01 的城市代表餐", detail: "两人建议从东坡肉、龙井虾仁、西湖莼菜汤里选两道，再配时蔬；不建议名菜全点。", connection: "餐厅就在孤山路线内，不需要另跑一趟。", alternative: "排队过长就保留杭帮菜主题，换湖滨同类餐厅。", sourceId: "hz-louwailou", factLabel: "中华老字号" },
      { time: "14:00", title: "孤山馆区或同片区室内展馆", meta: "室内休整 · 约1.5小时", detail: "把正午最晒的时段留给室内，是否开放以出发前官方公告为准。", connection: "继续留在孤山，不跨区追博物馆。", alternative: "临时闭馆就改为孤山周边短走与咖啡休息。" },
      { time: "17:30", title: "湖滨晚餐与夜间散步", meta: "晚餐 + 可选夜景", detail: "晚餐选片儿川或简洁杭帮小吃，夜景只走湖滨一小段。", connection: "孤山返回湖滨可用短程公交或打车。", alternative: "步行量已够就直接回酒店。" },
    ] },
    { label: "DAY 02", title: "灵隐与梅灵，山线一天只进出一次", area: "灵隐—梅灵—杨公堤", summary: "开园后先看飞来峰，午后顺着山线去茶村，傍晚从西湖西侧返程。", reason: "全日沿西湖西侧同一方向移动，避免进山、回城、再进山。", remove: "下雨或客流过大时取消茶村散步。", nodes: [
      { time: "08:00", title: "灵隐飞来峰", meta: "造像与山林 · 约2小时", detail: "先看飞来峰造像，再决定是否进入寺院；预约与入园规则出发前复核。", connection: "到达后全程步行。", pitfall: "不要连续安排三四座寺院。", sourceId: "hz-lingyin", factLabel: "预约规则见官方说明" },
      { time: "10:15", title: "灵隐寺或永福寺二选一", meta: "寺院体验 · 约1.5小时", detail: "选一处慢看，把体力留给下午茶村。", connection: "与飞来峰同片区。", alternative: "不想进寺就提前去茶村。" },
      { time: "12:30", title: "梅灵路茶香午餐", meta: "山线午餐", detail: "选清淡杭帮菜、时蔬或茶香菜；不为未经核验的网红店排长队。", connection: "继续向梅灵方向移动。" },
      { time: "14:30", title: "梅家坞茶村", meta: "茶园与村落 · 约1.5小时", detail: "重点看茶园与村落，不接受强制购物。", connection: "傍晚从西湖西侧直接返程。", alternative: "雨天缩短户外，改去中国茶叶博物馆。" },
      { time: "18:00", title: "知味观·味庄晚餐", meta: "DAY 02 的正式杭帮菜", detail: "从山线返回后在西湖西侧吃正餐，不再跨到城东。", connection: "结束后直接回酒店。", alternative: "热门时段排队过长，就换杨公堤同片区传统杭帮菜。", sourceId: "hz-zhiweiguan", factLabel: "餐厅资料已核验" },
    ] },
    { label: "DAY 03", title: "运河日常，给双脚一个低强度日", area: "小河直街—桥西—拱宸桥", summary: "从南向北沿运河缓慢推进，把街区、室内展馆和晚餐留在同一片区。", reason: "连续两天湖山后换到运河，空间和节奏都有变化。", remove: "室内展馆停留过久时取消运河夜景。", nodes: [
      { time: "09:30", title: "小河直街", meta: "历史街区 · 约1小时", detail: "看临水民居与当代小店怎样共存，不把它当成密集购物街。", connection: "之后沿运河方向去桥西。" },
      { time: "11:15", title: "桥西历史文化街区", meta: "街区漫游 · 约1小时", detail: "手工艺展馆与街区散步一起完成。", connection: "午餐仍留在运河片区。" },
      { time: "12:30", title: "运河边杭味午餐", meta: "杭帮小菜 + 葱包桧加餐", detail: "选择长期经营的同片区餐馆，不为一条热门笔记改线。", connection: "饭后步行去室内展馆。" },
      { time: "14:30", title: "运河主题博物馆或工艺展馆", meta: "室内体验 · 约1.5小时", detail: "当天开放安排出发前确认；临时闭馆就把时间留给桥西。", connection: "傍晚向拱宸桥收尾。", alternative: "雨天可延长室内停留。" },
      { time: "17:30", title: "拱宸桥与晚餐", meta: "傍晚散步 + 晚餐", detail: "夜景只作为可选，不另外乘车追打卡点。", connection: "结束后从拱宸桥一带直接返程。" },
    ] },
    { label: "DAY 04", title: "南宋临安与杭州面，最后一天留在老城", area: "德寿宫—南宋御街—解放路", summary: "用半天理解南宋临安，再用一碗杭州面收尾。", reason: "老城节点相邻，也方便随时结束行程、取行李返程。", remove: "返程较早时取消胡雪岩故居周边散步。", nodes: [
      { time: "09:00", title: "南宋德寿宫遗址博物馆", meta: "遗址博物馆 · 约1.5小时", detail: "预约成功再进入；没有名额就不要现场久等。", connection: "之后沿老城轴线步行。", alternative: "改走南宋御街与鼓楼。" },
      { time: "10:45", title: "南宋御街—鼓楼", meta: "老城步行 · 约1.5小时", detail: "重点看街巷关系，不把河坊街购物当成主要任务。", connection: "向解放路方向吃午餐。" },
      { time: "12:30", title: "奎元馆午餐", meta: "DAY 04 的杭州面", detail: "片儿川适合清爽收尾；想吃更丰盛可选虾爆鳝面。", connection: "午餐后可直接回酒店取行李。", alternative: "排队过长就吃同片区长期经营的杭州面馆。", sourceId: "hz-kuiyuanguan", factLabel: "餐厅资料已核验" },
      { time: "14:00", title: "胡雪岩故居周边或咖啡休息", meta: "可选 · 约1小时", detail: "只在返程时间充足时加入，不临时购买跨区项目。", connection: "预留取行李和进站时间。" },
    ] },
  ],
  restaurants: [
    { name: "楼外楼（孤山路）", identity: "中华老字号", why: "餐厅本身就是西湖饮食史的一部分，且与第一天孤山路线重合。", order: ["东坡肉", "龙井虾仁", "西湖莼菜汤"], avoid: "两个人不要同时点多道甜口浓汁菜。", plannedFor: "DAY 01 午餐", area: "孤山", queue: "值得把它当成一次城市饮食体验，但不值得为长队破坏下午行程。", alternative: "湖滨同片区传统杭帮菜", checkedAt: CHECKED_AT, sourceId: "hz-louwailou" },
    { name: "知味观·味庄（杨公堤）", identity: "地方经典品牌", why: "适合放在灵隐山线返程后，不用为了正式杭帮菜横穿城市。", order: ["杭帮点心", "龙井虾仁", "东坡肉"], avoid: "不要把点心、小吃和多道正菜一次点齐。", plannedFor: "DAY 02 晚餐", area: "杨公堤", queue: "提前确认高峰等位；超过可接受时间就换同片区。", alternative: "杨公堤附近传统杭帮菜", checkedAt: CHECKED_AT, sourceId: "hz-zhiweiguan" },
    { name: "奎元馆（解放路）", identity: "中华老字号", why: "杭州面食最清晰的一站，与第四天南宋老城路线相邻。", order: ["片儿川", "虾爆鳝面", "猪肝面"], avoid: "两个人不必各点一份大份浇头面再加小吃。", plannedFor: "DAY 04 午餐", area: "解放路", queue: "适合快吃快走，不值得在返程日前排很久。", alternative: "解放路同片区杭州面馆", checkedAt: CHECKED_AT, sourceId: "hz-kuiyuanguan" },
  ],
  foods: [
    { name: "片儿川", order: "雪菜、笋片和肉片是核心，想更丰富再加浇头。", when: "DAY 04 午餐", note: "它是一顿正经的杭州面，不只是打卡小吃。" },
    { name: "东坡肉", order: "两人点一份共享，再配时蔬和清口汤。", when: "DAY 01 或 DAY 02 正餐", note: "不要与多道甜口浓汁菜叠加。" },
    { name: "龙井虾仁", order: "适合多人共享，不必把价格高低等同于茶香浓淡。", when: "正式杭帮菜餐", note: "更看重餐厅稳定性和虾仁火候。" },
    { name: "葱包桧", order: "现压现烤，少量加餐即可。", when: "DAY 03 运河街区", note: "不要把它替代午餐。" },
  ],
  decisions: [
    { name: "北山街—白堤—孤山", verdict: "值得去", why: "比单拍断桥更能理解西湖的人文层次。", alternative: "雨天缩成北山街短线。" },
    { name: "灵隐飞来峰", verdict: "值得去", why: "造像、寺院与山林共同构成杭州最独特的半日体验。", alternative: "客流过大时改中国茶叶博物馆。" },
    { name: "一天环完整个西湖", verdict: "可以放弃", why: "体力消耗大，且正午体验明显下降。", alternative: "拆成北线与西线两个半天。" },
    { name: "河坊街长时间购物", verdict: "看情况", why: "适合顺路经过，不值得挤占南宋老城的主体时间。", alternative: "把时间留给南宋御街与鼓楼。" },
  ],
  situations: [
    { title: "连续下雨", advice: "保留南宋老城与室内展馆，缩短茶村和湖岸长距离步行。" },
    { title: "周末大客流", advice: "灵隐开园后先去；湖滨只留傍晚；排队过长时先换片区，不在入口消耗半天。" },
    { title: "只有两天", advice: "保留西湖北线与灵隐山线，运河和南宋老城二选一。" },
  ],
  checklist: ["确认灵隐飞来峰实名预约与入园规则", "确认计划内博物馆当天开放安排", "节假日提前购买往返车票", "出发前一天查看天气，决定是否缩短茶村与湖岸步行", "为三家热门餐厅各准备一个同片区替代"],
  sources: hangzhouSources, editedAt: CHECKED_AT,
};

const chengdu: EditorialCityGuide = {
  slug: "chengdu", city: "成都", province: "四川", image: "/cities/chengdu.jpg", imageAlt: "成都大熊猫与竹林城市代表景观",
  eyebrow: "PANDA · TEA HOUSE · SICHUAN FLAVOUR", title: "成都的舒服，不是把景点排松，而是把吃饭、茶馆和城市节奏排对。",
  intro: "熊猫基地要早，博物馆要留足时间，茶馆不能只塞半小时。成都四天最顺的方式，是把北郊熊猫、少城日常、青羊人文和武侯南城分开。",
  fit: "适合重视吃饭、愿意在公园和街区停留的人。若对熊猫兴趣不大，可以把北郊半日换成金沙或成都博物馆；真正想吃好，别把每顿都安排成火锅。",
  stayAdvice: "住宿建议：住在天府广场—骡马市一带，去少城、春熙路、青羊和武侯几个方向都相对均衡；熊猫基地单独早出，不为一晚夜生活中途换酒店。",
  defaultDays: 4,
  routeOptions: [
    { days: 2, label: "两日精简", summary: "熊猫基地 + 少城茶馆；武侯与青羊人文二选一。", dayIndexes: [1, 0] },
    { days: 3, label: "三日经典", summary: "熊猫、少城、青羊三条线，保留一顿正式川菜。", dayIndexes: [1, 0, 2] },
    { days: 4, label: "四日完整", summary: "北郊、少城、青羊、武侯南城各一天。", dayIndexes: [0, 1, 2, 3] },
  ],
  guideTypes: [...EDITORIAL_GUIDE_TYPES], guideTypeNotes: commonTypeNotes,
  themes: [
    { title: "第一次去成都，四天怎么不只剩吃", audience: "第一次到访", duration: "4天", advice: "熊猫、茶馆、博物馆与川菜各有完整时段。", pitfall: "不要把宽窄巷子当成半天主景点。", alternative: "人多时走少城支路与人民公园。", conclusion: "编辑整理" },
    { title: "熊猫基地为什么一定要早去", audience: "熊猫优先、亲子游客", duration: "半天", advice: "把它放在开园后的第一段，下午回城休息。", pitfall: "不要相信付费‘快速入园’。", alternative: "没约到就改金沙或成都博物馆。", conclusion: "官方事实" },
    { title: "成都值得专程吃的，不只是火锅", audience: "美食优先", duration: "分散到4天", advice: "麻婆豆腐、抄手、水饺、卤味与火锅轮换。", pitfall: "连续两顿重辣会让后面的体验迅速下降。", alternative: "用甜水面、钟水饺和家常川菜替代一顿火锅。", conclusion: "编辑整理" },
    { title: "宽窄巷子到底要留多久", audience: "第一次去但不想挤", duration: "45—90分钟", advice: "把它当少城散步的一段，而不是一天主题。", pitfall: "主街最拥挤时，不必每条巷子都走。", alternative: "改走泡桐树街、小通巷与人民公园周边。", conclusion: "旅行者常见反馈" },
    { title: "成都下雨天怎么改", audience: "阴雨天出行", duration: "1天备用", advice: "成都博物馆、金沙与老字号正餐组成室内线。", pitfall: "不要在大雨天强行安排长距离公园漫步。", alternative: "把茶馆停留延长到完整下午。", conclusion: "编辑整理" },
    { title: "只有两天，哪些可以直接放弃", audience: "周末短途", duration: "2天", advice: "保留熊猫与少城，青羊人文和武侯南城二选一。", pitfall: "不要再加都江堰或青城山。", alternative: "把周边留给第二次单独旅行。", conclusion: "编辑整理" },
  ],
  days: [
    { label: "DAY 01", title: "少城与人民公园，先学会成都的慢", area: "人民公园—少城—宽窄巷子", summary: "第一天不赶远路，用茶馆、老街和成都小吃建立城市节奏。", reason: "节点彼此相邻，也适合抵达日随时缩短。", remove: "如果到达较晚，取消宽窄巷子主街。", nodes: [
      { time: "10:00", title: "人民公园与鹤鸣茶社周边", meta: "城市日常 · 预留2小时", detail: "找位置喝茶、看本地日常，不把茶馆变成十分钟拍照点。", connection: "之后步行进入少城街区。", pitfall: "采耳等体验先问清项目与价格。" },
      { time: "12:30", title: "钟水饺或龙抄手午餐", meta: "DAY 01 的成都小吃", detail: "红油水饺、抄手、甜水面选两三样共享，不必点完整小吃套餐。", connection: "继续留在少城附近。", alternative: "排队长就选另一家有长期经营记录的成都小吃。", sourceId: "cd-zhong", factLabel: "中华老字号" },
      { time: "14:30", title: "少城支路—宽窄巷子", meta: "街区漫游 · 约2小时", detail: "先走泡桐树街等支路，再把宽窄巷子作为顺路收尾。", connection: "全段步行。", pitfall: "不要把所有时间耗在主街纪念品店。" },
      { time: "18:00", title: "少城附近家常川菜", meta: "晚餐 · 控制辣度", detail: "第一晚选回锅肉、宫保鸡丁、时蔬等家常菜，给后面火锅和麻婆豆腐留空间。", connection: "餐后直接回酒店。" },
    ] },
    { label: "DAY 02", title: "熊猫要早，下午回城不要再硬塞景点", area: "熊猫基地—春熙路", summary: "早到熊猫基地，午后回城吃饭和休息，晚上再决定是否散步。", reason: "熊猫活动与客流都更适合早段；返城后不再去另一个远郊。", remove: "体力不足时取消春熙路夜间散步。", nodes: [
      { time: "开园后", title: "成都大熊猫繁育研究基地", meta: "北郊半日 · 预留3—4小时", detail: "按官方渠道实名预约，先看重点场馆，再根据体力决定是否坐观光车。", connection: "当天最早一段直接进园。", pitfall: "不要购买任何非官方‘快速入园’服务。", sourceId: "cd-panda", factLabel: "官方预约规则" },
      { time: "12:30", title: "基地附近简餐或返城再吃", meta: "午餐 · 不为网红店绕路", detail: "若园内客流大，先完成参观再吃；不要为了小吃折回景区深处。", connection: "午后回到市中心。" },
      { time: "15:00", title: "酒店休息或春熙路短走", meta: "缓冲 · 约2小时", detail: "熊猫基地步行量不小，下午先休息，再决定是否逛街。", connection: "晚餐留在市中心。", alternative: "下雨时直接改成都博物馆，但先确认预约。" },
      { time: "18:30", title: "陈麻婆豆腐晚餐", meta: "DAY 02 的代表川菜", detail: "麻婆豆腐配一道清淡时蔬和一份汤，两个人不要再叠加多道重油重辣菜。", connection: "选离酒店或返程动线近的正规门店。", alternative: "排队过长就改同片区经典川菜，保留麻婆豆腐这道菜。", sourceId: "cd-chenmapo", factLabel: "中华老字号" },
    ] },
    { label: "DAY 03", title: "草堂、浣花溪与青羊，一天只走成都西侧", area: "杜甫草堂—浣花溪—青羊", summary: "上午看人文，午后在公园和茶馆之间降速。", reason: "三个节点在成都西侧，适合连续步行与短程交通。", remove: "如果草堂停留较久，取消青羊片区夜间散步。", nodes: [
      { time: "09:00", title: "杜甫草堂", meta: "人文园林 · 约2.5小时", detail: "不要只拍茅屋，留意园林、诗史与浣花溪环境。", connection: "之后步行进入浣花溪。" },
      { time: "12:00", title: "青羊片区川味午餐", meta: "家常川菜或小吃", detail: "今天不安排火锅，把正餐留给蒜泥白肉、凉粉或清淡川菜组合。", connection: "午后继续在西侧活动。" },
      { time: "14:00", title: "浣花溪公园与四川博物院二选一", meta: "户外 / 室内 · 约2小时", detail: "天气好走公园，下雨就进室内；不要为了两个都完成而压缩。", connection: "傍晚向青羊方向移动。", alternative: "根据天气现场二选一。" },
      { time: "17:30", title: "青羊片区晚餐与早休息", meta: "低强度晚间", detail: "第三天主动收早，为第四天武侯线留体力。", connection: "短程交通回酒店。" },
    ] },
    { label: "DAY 04", title: "武侯与玉林，把三国和当代成都接起来", area: "武侯祠—锦里外侧—玉林", summary: "上午集中看三国文化，下午避开最拥挤的商业街段，晚上到玉林吃饭。", reason: "由武侯向南移动，不回头去春熙路。", remove: "返程较早时取消玉林夜间散步。", nodes: [
      { time: "09:00", title: "成都武侯祠博物馆", meta: "三国文化 · 约2.5小时", detail: "先完成预约，再把主要时间留给文物区；不必在锦里重复停留很久。", connection: "从武侯片区开始。", sourceId: "cd-wuhou", factLabel: "官方预约入口" },
      { time: "12:00", title: "龙抄手或盘飧市风味午餐", meta: "DAY 04 的老字号小吃", detail: "抄手、粉蒸牛肉或卤味选一条主线，避免小吃一口气点太多。", connection: "午后继续向南。", alternative: "按当天营业与排队选择同类老字号。", sourceId: "cd-longchaoshou", factLabel: "中华老字号" },
      { time: "14:00", title: "锦里外侧短走或咖啡休息", meta: "可选 · 约1小时", detail: "锦里只顺路看，不把商业街当下午主体。", connection: "之后去玉林。", pitfall: "节假日主街拥挤时直接跳过。" },
      { time: "17:30", title: "玉林片区晚餐", meta: "火锅或串串的最后一晚", detail: "如果选火锅，少点同质化荤菜，搭配蔬菜和主食；不追跨区网红店。", connection: "餐后只做街区短走。", alternative: "不能吃辣就改清汤锅或家常川菜。" },
    ] },
  ],
  restaurants: [
    { name: "陈麻婆豆腐", identity: "中华老字号", why: "麻婆豆腐不是配角，而是理解川菜麻、辣、烫、香的一道标准菜。", order: ["麻婆豆腐", "清炒时蔬", "清口汤"], avoid: "不要再同时点多道重油重辣菜。", plannedFor: "DAY 02 晚餐", area: "市中心返程动线", queue: "值得吃这道菜，不必执着某一家门店排很久。", alternative: "同片区正规川菜馆点麻婆豆腐", checkedAt: CHECKED_AT, sourceId: "cd-chenmapo" },
    { name: "龙抄手", identity: "中华老字号", why: "能在一餐里理解成都小吃的汤、馅和红油变化。", order: ["红油抄手", "清汤抄手", "甜水面"], avoid: "不要为了尝全套点过量小吃宴。", plannedFor: "DAY 01 或 DAY 04 午餐", area: "市中心或武侯返程片区", queue: "适合快吃，不值得在行程中等很久。", alternative: "钟水饺或同片区长期经营小吃店", checkedAt: CHECKED_AT, sourceId: "cd-longchaoshou" },
    { name: "钟水饺", identity: "中华老字号", why: "红油水饺的甜辣与蒜香很能代表成都小吃的复合味。", order: ["红油水饺", "清汤水饺", "甜水面"], avoid: "不要把它当北方饺子正餐的份量。", plannedFor: "DAY 01 午餐", area: "少城周边", queue: "排队过长时与龙抄手互为替代。", alternative: "龙抄手", checkedAt: CHECKED_AT, sourceId: "cd-zhong" },
  ],
  foods: [
    { name: "麻婆豆腐", order: "两人共享一份，配时蔬和米饭。", when: "DAY 02 晚餐", note: "重点是麻、辣、烫与豆腐口感，不是单纯追求辣。" },
    { name: "红油抄手", order: "与清汤抄手二选一或共享。", when: "DAY 01 午餐", note: "适合作为小吃组合的一部分。" },
    { name: "钟水饺", order: "红油水饺配甜水面，不必再加一整套小吃。", when: "少城日", note: "成都水饺不等同于北方饺子。" },
    { name: "火锅", order: "少点同质化荤菜，准备清汤或鸳鸯锅。", when: "DAY 04 晚餐", note: "连续两顿火锅会明显降低后续体验。" },
  ],
  decisions: [
    { name: "熊猫基地", verdict: "值得去", why: "对第一次到成都、亲子或动物爱好者有很高辨识度。", alternative: "兴趣不大就换金沙或成都博物馆。" },
    { name: "人民公园完整茶馆时间", verdict: "值得去", why: "比短暂打卡更能理解成都的日常节奏。", alternative: "人多时走公园边缘和少城支路。" },
    { name: "宽窄巷子半日", verdict: "可以放弃", why: "主街商业化强，作为少城路线的一小段更合适。", alternative: "泡桐树街、小通巷。" },
    { name: "连续两晚火锅", verdict: "可以放弃", why: "味型重复且容易影响第二天状态。", alternative: "家常川菜 + 一晚火锅。" },
  ],
  situations: [
    { title: "熊猫基地约不到", advice: "不要购买非官方名额；把半天换成金沙或成都博物馆。" },
    { title: "连续下雨", advice: "博物馆 + 老字号正餐 + 完整茶馆时间，缩短公园和街区步行。" },
    { title: "完全不能吃辣", advice: "提前说明辣度，优先清汤抄手、蒸菜、甜水面与清淡家常菜；火锅不是必选。" },
  ],
  checklist: ["通过官方渠道预约熊猫基地", "确认武侯祠与计划内博物馆预约", "为熊猫基地准备早出交通", "向餐厅明确辣度与饮食禁忌", "为火锅和老字号准备同片区替代"],
  sources: chengduSources, editedAt: CHECKED_AT,
};

const beijing: EditorialCityGuide = {
  slug: "beijing", city: "北京", province: "北京", image: "/cities/beijing.jpg", imageAlt: "北京故宫红墙与传统宫殿建筑",
  eyebrow: "CENTRAL AXIS · MUSEUMS · HUTONG", title: "北京不是景点越多越值，而是每一天只走一条历史轴线。",
  intro: "北京最累的不是走路，而是预约、安检、远距离换片区叠在一起。五天路线应把故宫中轴、天坛前门、什刹海胡同、海淀皇家园林和长城远郊彻底分开。",
  fit: "适合第一次来、重视历史建筑与博物馆的人。北京需要接受‘一天只完成一个大主题’；如果只有三天，故宫、天坛前门和长城已经足够。",
  stayAdvice: "住宿建议：住在前门—崇文门或东单一带，前两天可接入中轴与天坛，后面去海淀和远郊也不必更换酒店；不要只因一晚胡同体验拖着行李换住处。",
  defaultDays: 5,
  routeOptions: [
    { days: 3, label: "三日核心", summary: "故宫中轴、天坛前门、长城远郊。", dayIndexes: [0, 1, 4] },
    { days: 4, label: "四日经典", summary: "在三日核心上加入什刹海胡同。", dayIndexes: [0, 1, 2, 4] },
    { days: 5, label: "五日完整", summary: "再加入海淀皇家园林，节奏最合理。", dayIndexes: [0, 1, 2, 3, 4] },
  ],
  guideTypes: [...EDITORIAL_GUIDE_TYPES], guideTypeNotes: commonTypeNotes,
  themes: [
    { title: "第一次去北京，五天怎么不每天暴走", audience: "第一次到访", duration: "5天", advice: "一条中轴、一个胡同片区、一个远郊主题分别成日。", pitfall: "不要把故宫、天坛和颐和园塞在一天。", alternative: "只有三天就删除海淀与胡同细线。", conclusion: "编辑整理" },
    { title: "故宫到底要留多久", audience: "历史建筑与博物馆爱好者", duration: "4—6小时", advice: "预约成功后把它当全天主体，景山只作为体力允许时的收尾。", pitfall: "不要在午门前临时找所谓代购票。", alternative: "约不到就改国家博物馆或中轴建筑线。", conclusion: "官方事实" },
    { title: "北京中轴线怎么分两天", audience: "建筑摄影、第一次去", duration: "2天", advice: "故宫中轴一天；天坛—前门—大栅栏另一天。", pitfall: "把南北两段一天走完会牺牲室内参观。", alternative: "时间少就只保留一段。", conclusion: "编辑整理" },
    { title: "北京烤鸭值得排队吗", audience: "第一次吃北京菜", duration: "一顿晚餐", advice: "值得吃一次，但把餐厅放进前门或和平门路线，不跨城。", pitfall: "两个人不需要点整套全鸭席。", alternative: "排队过长就换同品牌其他正规门店或便宜坊等长期品牌。", conclusion: "存在争议" },
    { title: "长城选哪一天", audience: "第一次去长城", duration: "1天", advice: "单独留一天，前后都不再加大型景点。", pitfall: "不要返城后再硬塞夜游中轴。", alternative: "天气差时把长城换成海淀室内与园林线。", conclusion: "多来源共同建议" },
    { title: "北京下雨或大风怎么改", audience: "天气不稳定", duration: "1天备用", advice: "把故宫以外的大型室内馆和老字号餐饮作为替代。", pitfall: "大风或雷雨时不要强行远郊。", alternative: "长城与皇家园林互换日期。", conclusion: "编辑整理" },
  ],
  days: [
    { label: "DAY 01", title: "天坛与前门，先走北京中轴南段", area: "天坛—前门—大栅栏", summary: "上午天坛，午餐前门，下午大栅栏与中轴街区，晚餐安排烤鸭。", reason: "全日沿中轴南段向北推进，不跨去故宫或海淀。", remove: "到达较晚时取消大栅栏支路。", nodes: [
      { time: "08:30", title: "天坛公园", meta: "皇家祭祀建筑 · 约3小时", detail: "从主要建筑与空间轴线理解天坛，不只拍祈年殿。", connection: "之后向前门方向移动。", pitfall: "不要在正午长时间停留于无遮挡广场。" },
      { time: "12:00", title: "前门京味午餐", meta: "炸酱面或北京小吃", detail: "第一顿先吃简单京味，不急着把烤鸭、涮肉和小吃一次完成。", connection: "午后继续步行大栅栏。" },
      { time: "14:00", title: "前门—大栅栏—杨梅竹斜街", meta: "中轴街区 · 约2.5小时", detail: "把商业主街和支路一起看，别只停在纪念品店。", connection: "晚餐仍留在前门片区。" },
      { time: "17:30", title: "全聚德烤鸭晚餐", meta: "DAY 01 的城市代表餐", detail: "两人先确认鸭量，再配一份蔬菜或清口菜；不建议直接点全鸭席。", connection: "餐厅与当天中轴路线重合。", alternative: "排队过长就换同品牌其他正规门店或同片区老字号。", sourceId: "bj-quanjude", factLabel: "中华老字号" },
    ] },
    { label: "DAY 02", title: "故宫只做一件大事，景山是可选收尾", area: "天安门—故宫—景山", summary: "预约成功后把故宫作为全天主体，中午不安排跨区正餐。", reason: "安检、步行和展厅停留都需要余量；增加第二个大景点只会赶。", remove: "体力不足时取消景山。", nodes: [
      { time: "预约时段前", title: "到达午门并完成入院准备", meta: "实名预约 · 提前留足安检时间", detail: "只使用故宫官方渠道预约购票，不购买所谓第三方代抢。", connection: "按午门进入的官方参观方向前进。", sourceId: "bj-palace", factLabel: "官方预约规则" },
      { time: "上午—下午", title: "故宫博物院", meta: "宫殿与展览 · 4—6小时", detail: "主轴之外选择一到两个专题区域，不追求把所有宫院一次走完。", connection: "院内简餐或自带合规补给，避免中途出院找餐厅。", pitfall: "预约、开放区域和展览安排以官方当天信息为准。", sourceId: "bj-palace-visit", factLabel: "官方参观导览" },
      { time: "16:30", title: "景山公园或直接回酒店", meta: "可选俯瞰 · 约1小时", detail: "只有天气和体力都合适时再上景山。", connection: "从故宫北侧顺路衔接。", alternative: "下雨、大风或很累时直接取消。" },
      { time: "18:30", title: "王府井或东单附近晚餐", meta: "同片区晚餐", detail: "选择京味家常菜或简单面食，不再为名店跨区。", connection: "晚饭后早休息。" },
    ] },
    { label: "DAY 03", title: "什刹海与胡同，不把胡同当表演项目", area: "钟鼓楼—什刹海—护国寺", summary: "从钟鼓楼向什刹海与护国寺方向慢走，给胡同生活留时间。", reason: "这一天节点密度低，适合在故宫日后恢复体力。", remove: "不想逛商业街时取消烟袋斜街。", nodes: [
      { time: "09:30", title: "钟鼓楼周边与胡同支路", meta: "城市漫游 · 约2小时", detail: "观察街巷与院落尺度，不追逐‘最美胡同’清单。", connection: "之后向什刹海步行。" },
      { time: "12:00", title: "护国寺小吃午餐", meta: "DAY 03 的京味小吃", detail: "豌豆黄、驴打滚、面茶等少量共享，另加一份主食；不要一次买满整桌甜点。", connection: "午后留在西城。", alternative: "排队长就换同片区长期经营小吃店。", sourceId: "bj-huguosi", factLabel: "老字号非遗小吃资料" },
      { time: "14:00", title: "什刹海—恭王府外部街区二选一", meta: "湖区 / 场馆 · 约2小时", detail: "根据预约和客流只选一个主体，避免在胡同里赶场。", connection: "傍晚向后海或地安门收尾。" },
      { time: "18:00", title: "东来顺涮羊肉", meta: "DAY 03 的代表晚餐", detail: "先点一轮羊肉、白菜豆腐和主食，再决定是否加菜。", connection: "选择返程顺路的正规门店。", alternative: "排队过长就换同片区传统铜锅涮肉。", sourceId: "bj-donglaishun", factLabel: "中华老字号" },
    ] },
    { label: "DAY 04", title: "颐和园与海淀，皇家园林不要赶", area: "颐和园—海淀", summary: "上午进入颐和园，下午只保留一个同方向的补充项目。", reason: "园林范围大，正午需要休息；不再跨回东城。", remove: "体力不足时取消下午补充项目。", nodes: [
      { time: "09:00", title: "颐和园", meta: "皇家园林 · 约4小时", detail: "先定一条主线，不追求环湖和所有建筑一次完成。", connection: "午餐留在海淀片区。", pitfall: "大风、暴晒或雨雪时缩短临湖段。" },
      { time: "13:30", title: "海淀片区午餐与休息", meta: "午餐 + 缓冲", detail: "正午先坐下休息，不把午餐压缩成赶路。", connection: "下午只选一个补充项目。" },
      { time: "15:30", title: "圆明园短线或高校周边二选一", meta: "可选 · 约2小时", detail: "根据体力和开放条件选择，不与颐和园拼成暴走。", connection: "晚餐仍留在海淀或回酒店附近。", alternative: "下雨时改室内博物馆。" },
      { time: "18:30", title: "简单晚餐", meta: "恢复体力", detail: "第二天要去远郊，不安排夜游和重餐。", connection: "早回酒店。" },
    ] },
    { label: "DAY 05", title: "长城单独一天，回来后不再加大型景点", area: "北京远郊长城", summary: "把交通、登城和返程全部算进一天，只保留返城后的简单晚餐。", reason: "远郊交通与天气不确定性高，单独成日最稳妥。", remove: "天气明显不适合时整天替换，不勉强出发。", nodes: [
      { time: "早晨", title: "前往长城景区", meta: "远郊交通 · 提前核验", detail: "选择官方或正规交通方式，出发前核对天气、开放和返程班次。", connection: "不要在途中增加其他远郊景点。" },
      { time: "上午—下午", title: "长城主线", meta: "户外活动 · 建议预留大半天", detail: "根据体力选一段完成，不以爬完更多敌楼为目标。", connection: "园区内按官方指引行动。", pitfall: "雷雨、大风、冰雪等条件下不强行登城。" },
      { time: "返城后", title: "酒店附近晚餐", meta: "简单京味或家常菜", detail: "返城时间可能波动，不预订必须准时到达的热门餐厅。", connection: "当天到此结束。", alternative: "天气差时与 DAY 04 海淀线互换。" },
    ] },
  ],
  restaurants: [
    { name: "全聚德", identity: "中华老字号", why: "挂炉烤鸭是北京饮食最有辨识度的体验之一，适合放在前门中轴日。", order: ["挂炉烤鸭", "一份时蔬", "清口凉菜"], avoid: "两个人不要直接点全鸭席与多道鸭部位菜。", plannedFor: "DAY 01 晚餐", area: "前门", queue: "值得吃一次，但不值得为单店排队破坏当日路线。", alternative: "同品牌其他正规门店或同片区长期老字号烤鸭", checkedAt: CHECKED_AT, sourceId: "bj-quanjude" },
    { name: "东来顺", identity: "中华老字号", why: "铜锅涮羊肉能代表北京清真餐饮与北方火锅传统。", order: ["羊肉", "白菜豆腐", "烧饼或面条"], avoid: "第一轮不要点过多同类肉盘。", plannedFor: "DAY 03 晚餐", area: "西城返程动线", queue: "排队严重时，保留铜锅涮肉主题即可。", alternative: "同片区传统铜锅涮肉", checkedAt: CHECKED_AT, sourceId: "bj-donglaishun" },
    { name: "护国寺小吃", identity: "北京老字号小吃代表", why: "适合一次理解多种京味点心，但更适合午餐加小吃，不是甜点自助。", order: ["面茶", "豌豆黄", "驴打滚", "一份主食"], avoid: "不要把所有甜口点心各买一份。", plannedFor: "DAY 03 午餐", area: "护国寺", queue: "适合顺路吃，不值得跨城。", alternative: "同片区长期经营京味小吃", checkedAt: CHECKED_AT, sourceId: "bj-huguosi" },
  ],
  foods: [
    { name: "北京烤鸭", order: "两人先确认鸭量，搭配时蔬和清口凉菜。", when: "DAY 01 晚餐", note: "吃一次即可，不需要再安排第二家比较。" },
    { name: "铜锅涮肉", order: "先少量羊肉、白菜豆腐和主食，再追加。", when: "DAY 03 晚餐", note: "麻酱调料与炭火锅是体验核心。" },
    { name: "炸酱面", order: "作为前门或故宫日的简单午餐。", when: "DAY 01 或 DAY 02", note: "更适合解决顺路正餐，不必为名店跨区。" },
    { name: "京味小吃", order: "甜咸混搭，少量共享。", when: "DAY 03 午餐", note: "面茶、豌豆黄、驴打滚不必一次吃全。" },
  ],
  decisions: [
    { name: "故宫全天", verdict: "值得去", why: "第一次到北京最值得完整留时的核心体验。", alternative: "约不到就改国家博物馆或中轴建筑线。" },
    { name: "天坛—前门中轴南段", verdict: "值得去", why: "建筑、街区和京味饮食可以顺路完成。", alternative: "时间少就删大栅栏支路。" },
    { name: "一天完成故宫 + 颐和园", verdict: "可以放弃", why: "跨区、安检和步行让体验变成赶场。", alternative: "拆成两天。" },
    { name: "长城后继续夜游", verdict: "可以放弃", why: "返城时间与体力不稳定。", alternative: "酒店附近晚餐。" },
  ],
  situations: [
    { title: "故宫预约失败", advice: "不要找非官方代购；用国家博物馆、景山与中轴街区替代。" },
    { title: "远郊天气差", advice: "长城与海淀日互换；大风、雷雨或冰雪条件下不勉强登城。" },
    { title: "节假日", advice: "每天只保留一个必须预约的大项目，餐厅都准备同片区替代。" },
  ],
  checklist: ["通过故宫官方渠道完成实名预约", "核对天安门区域及计划内场馆预约要求", "出发前查看长城景区天气与开放信息", "节假日提前购买往返车票", "为烤鸭与涮肉餐厅准备同片区替代"],
  sources: beijingSources, editedAt: CHECKED_AT,
};

export const EDITORIAL_CITY_GUIDES: EditorialCityGuide[] = [hangzhou, chengdu, beijing];

export function getEditorialCityGuide(slug: string) {
  return EDITORIAL_CITY_GUIDES.find((guide) => guide.slug === slug);
}

export function getSource(guide: EditorialCityGuide, sourceId?: string) {
  if (!sourceId) return undefined;
  return guide.sources.find((source) => source.id === sourceId);
}
