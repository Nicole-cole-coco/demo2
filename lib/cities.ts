import type { TravelPlan } from "./deepseek";

export type CityProfile = {
  city: string;
  province: string;
  region: "华北" | "华东" | "华南" | "西南" | "西北" | "东北";
  image: string;
  hook: string;
  idealDays: string;
  dailyBudget: string;
  tags: string[];
  foods: string[];
  sights: string[];
  transit: string;
};

export const CITY_PROFILES: CityProfile[] = [
  {
    city: "杭州", province: "浙江", region: "华东", image: "/cities/hangzhou.jpg",
    hook: "湖山、茶园与江南日常", idealDays: "3–5 天", dailyBudget: "¥450–850 / 人",
    tags: ["山水", "人文", "慢旅行"], foods: ["片儿川", "龙井虾仁", "葱包桧"],
    sights: ["西湖", "灵隐飞来峰", "京杭大运河"], transit: "地铁 + 公交，西湖沿线步行与骑行更顺路",
  },
  {
    city: "北京", province: "北京", region: "华北", image: "/cities/beijing.jpg",
    hook: "皇城轴线与胡同烟火", idealDays: "4–6 天", dailyBudget: "¥550–1,000 / 人",
    tags: ["古都", "博物馆", "建筑"], foods: ["铜锅涮肉", "炸酱面", "北京烤鸭"],
    sights: ["故宫", "天坛", "慕田峪长城"], transit: "地铁覆盖主城区，长城等远郊景点单独安排一日",
  },
  {
    city: "上海", province: "上海", region: "华东", image: "/cities/shanghai.jpg",
    hook: "百年街区与摩登天际线", idealDays: "3–5 天", dailyBudget: "¥650–1,200 / 人",
    tags: ["城市", "建筑", "夜景"], foods: ["生煎馒头", "排骨年糕", "本帮红烧肉"],
    sights: ["外滩", "武康路街区", "上海博物馆"], transit: "地铁为主，按浦西与浦东分区避免跨江折返",
  },
  {
    city: "成都", province: "四川", region: "西南", image: "/cities/chengdu.jpg",
    hook: "熊猫、茶馆与川味江湖", idealDays: "4–6 天", dailyBudget: "¥400–750 / 人",
    tags: ["美食", "休闲", "亲子"], foods: ["成都火锅", "担担面", "钵钵鸡"],
    sights: ["成都大熊猫繁育研究基地", "杜甫草堂", "武侯祠"], transit: "地铁串联城区，熊猫基地尽量早到并留半天",
  },
  {
    city: "重庆", province: "重庆", region: "西南", image: "/cities/chongqing.jpg",
    hook: "立体山城与热辣夜色", idealDays: "3–5 天", dailyBudget: "¥380–720 / 人",
    tags: ["美食", "夜景", "城市探索"], foods: ["重庆火锅", "重庆小面", "酸辣粉"],
    sights: ["洪崖洞", "李子坝", "山城巷"], transit: "轨道交通优先，按上半城与下半城安排减少爬坡",
  },
  {
    city: "西安", province: "陕西", region: "西北", image: "/cities/xian.jpg",
    hook: "城墙内外的盛唐余韵", idealDays: "4–5 天", dailyBudget: "¥420–800 / 人",
    tags: ["历史", "遗址", "美食"], foods: ["肉夹馍", "羊肉泡馍", "凉皮"],
    sights: ["秦始皇帝陵博物院", "西安城墙", "陕西历史博物馆"], transit: "城区地铁方便，兵马俑单独规划东线半日或一日",
  },
  {
    city: "桂林", province: "广西", region: "华南", image: "/cities/guilin.jpg",
    hook: "喀斯特山水与漓江渔火", idealDays: "4–6 天", dailyBudget: "¥420–820 / 人",
    tags: ["山水", "摄影", "轻户外"], foods: ["桂林米粉", "阳朔啤酒鱼", "恭城油茶"],
    sights: ["漓江", "遇龙河", "龙脊梯田"], transit: "桂林与阳朔分段住宿，山水景点用专线或包车更省时",
  },
  {
    city: "苏州", province: "江苏", region: "华东", image: "/cities/suzhou.jpg",
    hook: "园林、古巷与水城清韵", idealDays: "3–4 天", dailyBudget: "¥450–850 / 人",
    tags: ["园林", "古镇", "慢旅行"], foods: ["苏式汤面", "松鼠鳜鱼", "苏式生煎"],
    sights: ["拙政园", "平江路", "虎丘"], transit: "古城内步行与公交优先，园林按片区组合",
  },
  {
    city: "广州", province: "广东", region: "华南", image: "/cities/guangzhou.jpg",
    hook: "早茶、骑楼与珠江晚风", idealDays: "3–5 天", dailyBudget: "¥480–900 / 人",
    tags: ["美食", "岭南", "城市"], foods: ["广式早茶", "烧鹅", "云吞面"],
    sights: ["陈家祠", "永庆坊", "广州塔与珠江"], transit: "地铁覆盖成熟，老城街区适合步行串联",
  },
  {
    city: "大理", province: "云南", region: "西南", image: "/cities/dali.jpg",
    hook: "苍山洱海与白族村落", idealDays: "4–6 天", dailyBudget: "¥450–900 / 人",
    tags: ["自然", "骑行", "村落"], foods: ["乳扇", "喜洲粑粑", "白族酸辣鱼"],
    sights: ["洱海生态廊道", "喜洲古镇", "苍山"], transit: "环洱海分东西线，不建议一天强行绕湖一圈",
  },
  {
    city: "泉州", province: "福建", region: "华南", image: "/cities/quanzhou.jpg",
    hook: "海丝古城与多元信仰", idealDays: "3–4 天", dailyBudget: "¥350–680 / 人",
    tags: ["世遗", "古城", "小吃"], foods: ["面线糊", "姜母鸭", "土笋冻"],
    sights: ["开元寺", "西街", "洛阳桥"], transit: "古城公交 + 步行，洛阳桥等外围景点单独成线",
  },
  {
    city: "拉萨", province: "西藏", region: "西南", image: "/cities/lhasa.jpg",
    hook: "高原日光与藏地人文", idealDays: "4–6 天", dailyBudget: "¥650–1,200 / 人",
    tags: ["人文", "高原", "摄影"], foods: ["藏面", "甜茶", "糌粑"],
    sights: ["布达拉宫", "大昭寺", "色拉寺"], transit: "抵达首日低强度适应海拔，预约与身体状况优先",
  },
  {
    city: "青岛", province: "山东", region: "华北", image: "/cities/qingdao.jpg",
    hook: "红瓦海岸与崂山清风", idealDays: "3–5 天", dailyBudget: "¥450–850 / 人",
    tags: ["海滨", "建筑", "美食"], foods: ["鲅鱼水饺", "辣炒蛤蜊", "锅贴"],
    sights: ["八大关", "栈桥", "崂山"], transit: "老城步行，崂山按独立一日线规划",
  },
  {
    city: "南京", province: "江苏", region: "华东", image: "/cities/nanjing.jpg",
    hook: "六朝遗韵与梧桐街道", idealDays: "3–5 天", dailyBudget: "¥450–850 / 人",
    tags: ["历史", "博物馆", "城市漫游"], foods: ["鸭血粉丝汤", "盐水鸭", "鸡鸣汤包"],
    sights: ["中山陵", "南京博物院", "明城墙"], transit: "地铁覆盖主景区，钟山风景区集中安排半日以上",
  },
];

export const DEMO_PLAN: TravelPlan = {
  title: "杭州｜湖山、茶香与城市日常",
  subtitle: "4 天 · 舒展节奏 · 美食与人文优先",
  destination: "杭州",
  heroSummary: "把西湖、灵隐、运河和茶村分成四条顺路动线，每天只保留一个主区域，用片儿川、杭帮菜和茶点把城市味道嵌进路线，而不是另列一张网红清单。",
  bestFor: ["第一次到杭州", "喜欢人文与慢行", "希望控制折返"],
  estimatedDailyBudget: "¥560–760 / 人",
  estimatedTotalBudget: "¥2,240–3,040 / 人",
  transportSummary: "地铁 + 公交 + 步行，山间段短途打车",
  matchReason: "西湖放在第一天建立城市印象；灵隐与茶村合并减少跨区；运河安排为低强度日；最后一天用九溪收尾并给返程留缓冲。",
  highlights: [
    { name: "西湖西线慢行", type: "山水", why: "避开只逛湖滨的单一视角，从孤山、曲院风荷到杨公堤看更完整的湖山层次。", duration: "半日" },
    { name: "灵隐飞来峰", type: "人文", why: "石刻、寺院与山林密度高，适合与梅灵路茶村组成同方向路线。", duration: "3–4 小时" },
    { name: "京杭大运河", type: "城市", why: "补足杭州不止西湖的一面，从小河直街看到运河生活与工业遗存。", duration: "半日" },
    { name: "九溪与龙井村", type: "自然", why: "以低难度山林步行收尾，路线可根据天气与体力随时缩短。", duration: "半日" },
  ],
  foods: [
    { name: "片儿川", category: "面食", suggestion: "早餐或简餐", budget: "¥18–35", note: "先尝笋片、雪菜与肉片的本地组合，不必追逐单一名店。" },
    { name: "龙井虾仁", category: "杭帮菜", suggestion: "正餐共享", budget: "¥80–160", note: "适合两人以上点餐，与时蔬、东坡肉等分食更合理。" },
    { name: "葱包桧", category: "街头小吃", suggestion: "下午加餐", budget: "¥8–18", note: "在老街区作为轻食体验，不替代正餐。" },
    { name: "定胜糕", category: "传统糕点", suggestion: "伴手礼", budget: "¥10–30", note: "现吃少量即可，留意保质期和糖度。" },
  ],
  transportPlan: [
    { scene: "城区跨区", choice: "地铁优先", detail: "湖滨、运河与火车站之间用地铁，时间更稳定。" },
    { scene: "西湖周边", choice: "步行 + 公交", detail: "按湖岸分段游览，避免同一天绕湖一整圈。" },
    { scene: "灵隐与茶村", choice: "公交进山 + 短途打车", detail: "高峰期预留候车时间，不把山间拥堵时间排得过紧。" },
  ],
  budgetBreakdown: [
    { category: "住宿", amount: "¥1,000–1,400", percent: 43 },
    { category: "餐饮", amount: "¥520–720", percent: 23 },
    { category: "市内交通", amount: "¥180–280", percent: 9 },
    { category: "门票与体验", amount: "¥240–360", percent: 12 },
    { category: "机动预算", amount: "¥300", percent: 13 },
  ],
  verificationNote: "门票、预约、开放时间、交通管制与天气均可能变化；示例仅展示规划方法，出发前需通过官方渠道复核。",
  days: [
    {
      label: "DAY 01", date: "10月23日 · 周五", theme: "西湖初见 · 湖岸与人文", note: "从北山街进入西湖，沿同一岸线移动，傍晚保留自由时间。",
      stops: [
        { time: "08:00", title: "断桥与白堤", meta: "湖畔 · 1小时20分", detail: "清晨沿白堤步行，先建立西湖空间感。", tone: "blue" },
        { time: "10:00", title: "孤山与浙江省博物馆", meta: "人文 · 1小时40分", detail: "园林与室内参观组合，具体展馆开放安排需出发前核验。", tone: "lavender", source: "出发前核验" },
        { time: "12:20", title: "片儿川与杭帮小菜", meta: "午餐 · ¥45–80", detail: "选择顺路餐馆，不为单一热门店跨区。", tone: "clay" },
        { time: "15:00", title: "曲院风荷至杨公堤", meta: "散步 · 1小时30分", detail: "根据体力决定步行长度，保留坐船或喝茶的弹性。", tone: "sage" },
      ],
    },
    {
      label: "DAY 02", date: "10月24日 · 周六", theme: "灵隐山色 · 石刻与茶村", note: "上午集中灵隐片区，下午沿梅灵路移动，不返回市区后再次进山。",
      stops: [
        { time: "07:40", title: "灵隐飞来峰", meta: "石刻 · 1小时40分", detail: "早点进入片区，把山林步道安排在客流高峰前。", tone: "sage", source: "出发前核验" },
        { time: "10:00", title: "灵隐寺", meta: "寺院 · 1小时20分", detail: "预约、票务与开放时间以出发前官方信息为准。", tone: "lavender", source: "出发前核验" },
        { time: "12:30", title: "梅灵路午餐", meta: "午餐 · ¥60–100", detail: "以茶香简餐衔接下午动线。", tone: "clay" },
        { time: "14:30", title: "梅家坞茶村", meta: "茶村 · 1小时30分", detail: "重点体验茶园环境，不设置强制购物。", tone: "sage" },
      ],
    },
    {
      label: "DAY 03", date: "10月25日 · 周日", theme: "运河日常 · 街巷与博物馆", note: "安排为低强度日，从小河直街一路走向拱宸桥。",
      stops: [
        { time: "09:00", title: "小河直街", meta: "历史街区 · 1小时20分", detail: "观察临水民居与当代小店共存的城市尺度。", tone: "blue" },
        { time: "11:00", title: "桥西历史文化街区", meta: "街区 · 1小时", detail: "把手工艺展馆与街区散步合并。", tone: "clay" },
        { time: "13:30", title: "中国京杭大运河博物馆", meta: "博物馆 · 1小时30分", detail: "预约与展厅开放信息需提前核验。", tone: "lavender", source: "出发前核验" },
        { time: "16:00", title: "拱宸桥与运河畔", meta: "散步 · 1小时", detail: "是否继续乘船或看夜景根据体力决定。", tone: "blue" },
      ],
    },
    {
      label: "DAY 04", date: "10月26日 · 周一", theme: "九溪收尾 · 龙井山色", note: "最后一天只走一条山间路线，为取行李和返程保留缓冲。",
      stops: [
        { time: "09:00", title: "九溪烟树", meta: "轻徒步 · 1小时30分", detail: "按天气与路况决定步行长度，湿滑时缩短路线。", tone: "sage" },
        { time: "11:10", title: "龙井村", meta: "茶村 · 1小时10分", detail: "短暂停留看茶园与村落，不安排强制消费。", tone: "clay" },
        { time: "13:40", title: "返回酒店取行李", meta: "交通 · 预留缓冲", detail: "不再临时加入跨区景点。", tone: "blue" },
      ],
    },
  ],
};
