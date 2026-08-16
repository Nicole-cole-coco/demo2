import type { TravelPlan, TravelRequest } from "./deepseek";
import { assertCityKnowledgeCoverage, getCityKnowledge } from "./city-knowledge";
import type { TravelSource } from "./travel-data";

export type CitySeason = "全年适合" | "春季" | "夏季" | "秋季" | "冬季";

export type CityProfile = {
  city: string;
  province: string;
  region: "华北" | "华东" | "华中" | "华南" | "西南" | "西北" | "东北" | "港澳台";
  image: string;
  aliases?: string[];
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
    city: "泉州", province: "福建", region: "华东", image: "/cities/quanzhou.jpg",
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
    city: "青岛", province: "山东", region: "华东", image: "/cities/qingdao.jpg",
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
  {
    city: "天津", province: "天津", region: "华北", image: "/cities/tianjin.webp", aliases: ["天津市", "tianjin"],
    hook: "海河、洋楼与津味曲艺", idealDays: "2–4 天", dailyBudget: "¥380–720 / 人",
    tags: ["建筑", "曲艺", "美食"], foods: ["煎饼馃子", "锅巴菜", "熟梨糕"],
    sights: ["五大道", "天津之眼", "古文化街"], transit: "地铁串联主城区，海河两岸适合步行与夜间游览",
  },
  {
    city: "大同", province: "山西", region: "华北", image: "/cities/datong.webp", aliases: ["大同市", "datong"],
    hook: "北魏石窟与古建之城", idealDays: "2–4 天", dailyBudget: "¥350–680 / 人",
    tags: ["石窟", "古建", "历史"], foods: ["刀削面", "百花烧麦", "浑源凉粉"],
    sights: ["云冈石窟", "华严寺", "大同古城墙"], transit: "古城内步行，云冈石窟与悬空寺需分别安排城外交通",
  },
  {
    city: "沈阳", province: "辽宁", region: "东北", image: "/cities/shenyang.webp", aliases: ["沈阳市", "shenyang", "奉天"],
    hook: "盛京旧城与东北烟火", idealDays: "2–4 天", dailyBudget: "¥380–720 / 人",
    tags: ["宫殿", "工业", "美食"], foods: ["老边饺子", "鸡架", "锅包肉"],
    sights: ["沈阳故宫", "张学良旧居", "中国工业博物馆"], transit: "地铁覆盖主要城区，盛京历史片区适合集中步行",
  },
  {
    city: "大连", province: "辽宁", region: "东北", image: "/cities/dalian.webp", aliases: ["大连市", "dalian"],
    hook: "滨海公路与港城广场", idealDays: "3–5 天", dailyBudget: "¥480–900 / 人",
    tags: ["海滨", "建筑", "亲子"], foods: ["海菜包子", "焖子", "海鲜烧烤"],
    sights: ["星海广场", "滨海路", "中山广场"], transit: "地铁与公交串联城区，滨海路景点间距较大宜分段打车",
  },
  {
    city: "哈尔滨", province: "黑龙江", region: "东北", image: "/cities/harbin.webp", aliases: ["哈尔滨市", "harbin", "冰城"],
    hook: "冰雪、欧陆建筑与北国风味", idealDays: "3–5 天", dailyBudget: "¥450–950 / 人",
    tags: ["冰雪", "建筑", "冬季"], foods: ["锅包肉", "红肠", "铁锅炖"],
    sights: ["圣索菲亚教堂", "中央大街", "冰雪大世界"], transit: "地铁与公交为主，冬季户外段需缩短并预留保暖休息",
  },
  {
    city: "厦门", province: "福建", region: "华东", image: "/cities/xiamen.webp", aliases: ["厦门市", "xiamen", "鹭岛"],
    hook: "海岛、骑楼与闽南生活", idealDays: "3–5 天", dailyBudget: "¥480–900 / 人",
    tags: ["海滨", "建筑", "慢旅行"], foods: ["沙茶面", "海蛎煎", "土笋冻"],
    sights: ["鼓浪屿", "环岛路", "沙坡尾"], transit: "岛内公交地铁方便，鼓浪屿船票与码头需提前核对",
  },
  {
    city: "武汉", province: "湖北", region: "华中", image: "/cities/wuhan.webp", aliases: ["武汉市", "wuhan", "江城"],
    hook: "两江交汇与市井过早", idealDays: "3–5 天", dailyBudget: "¥380–760 / 人",
    tags: ["江景", "人文", "美食"], foods: ["热干面", "三鲜豆皮", "排骨藕汤"],
    sights: ["湖北省博物馆", "东湖", "黄鹤楼"], transit: "地铁跨江效率高，武昌与汉口分日安排减少往返",
  },
  {
    city: "长沙", province: "湖南", region: "华中", image: "/cities/changsha.webp", aliases: ["长沙市", "changsha", "星城"],
    hook: "湘味、江洲与年轻夜生活", idealDays: "3–4 天", dailyBudget: "¥380–760 / 人",
    tags: ["美食", "夜景", "人文"], foods: ["长沙米粉", "臭豆腐", "口味虾"],
    sights: ["湖南博物院", "岳麓山", "橘子洲"], transit: "地铁覆盖主景区，橘子洲与岳麓山可组合成湘江西岸路线",
  },
  {
    city: "洛阳", province: "河南", region: "华中", image: "/cities/luoyang.webp", aliases: ["洛阳市", "luoyang", "神都"],
    hook: "石窟、古都与牡丹花城", idealDays: "3–5 天", dailyBudget: "¥380–750 / 人",
    tags: ["古都", "石窟", "博物馆"], foods: ["洛阳水席", "牛肉汤", "浆面条"],
    sights: ["龙门石窟", "洛阳博物馆", "白马寺"], transit: "龙门与市区分区安排，白马寺单独留出东线交通时间",
  },
  {
    city: "张家界", province: "湖南", region: "华中", image: "/cities/zhangjiajie.webp", aliases: ["张家界市", "zhangjiajie"],
    hook: "石英峰林与峡谷云雾", idealDays: "4–6 天", dailyBudget: "¥500–980 / 人",
    tags: ["峰林", "徒步", "摄影"], foods: ["三下锅", "土家腊肉", "莓茶"],
    sights: ["武陵源", "天门山", "金鞭溪"], transit: "景区跨度大，武陵源与天门山不可硬塞同日，优先景区专线",
  },
  {
    city: "深圳", province: "广东", region: "华南", image: "/cities/shenzhen.webp", aliases: ["深圳市", "shenzhen", "鹏城"],
    hook: "现代天际线与山海公园", idealDays: "3–5 天", dailyBudget: "¥550–1,000 / 人",
    tags: ["城市", "海岸", "亲子"], foods: ["光明乳鸽", "沙井蚝", "客家酿豆腐"],
    sights: ["深圳湾公园", "大鹏所城", "莲花山公园"], transit: "地铁覆盖核心区，大鹏半岛距离远需独立安排一日",
  },
  {
    city: "三亚", province: "海南", region: "华南", image: "/cities/sanya.webp", aliases: ["三亚市", "sanya"],
    hook: "热带海湾与岛屿假日", idealDays: "4–6 天", dailyBudget: "¥650–1,400 / 人",
    tags: ["海滨", "度假", "亲子"], foods: ["海南粉", "清补凉", "糟粕醋海鲜"],
    sights: ["亚龙湾", "蜈支洲岛", "天涯海角"], transit: "海湾间距离较远，按住宿湾区分日并控制打车成本",
  },
  {
    city: "昆明", province: "云南", region: "西南", image: "/cities/kunming.webp", aliases: ["昆明市", "kunming", "春城"],
    hook: "高原春城与滇池花景", idealDays: "3–5 天", dailyBudget: "¥400–780 / 人",
    tags: ["湖泊", "花卉", "美食"], foods: ["过桥米线", "汽锅鸡", "鲜花饼"],
    sights: ["滇池海埂", "云南省博物馆", "翠湖"], transit: "地铁覆盖城区，滇池南北岸跨度大宜择一片区游览",
  },
  {
    city: "丽江", province: "云南", region: "西南", image: "/cities/lijiang.webp", aliases: ["丽江市", "lijiang"],
    hook: "雪山、古城与纳西文化", idealDays: "4–6 天", dailyBudget: "¥480–950 / 人",
    tags: ["雪山", "古城", "民族文化"], foods: ["鸡豆凉粉", "腊排骨", "纳西烤肉"],
    sights: ["玉龙雪山", "丽江古城", "白沙古镇"], transit: "古城步行，雪山需预约交通；高海拔活动避免排在抵达首日",
  },
  {
    city: "兰州", province: "甘肃", region: "西北", image: "/cities/lanzhou.webp", aliases: ["兰州市", "lanzhou", "金城"],
    hook: "黄河穿城与西北面食", idealDays: "2–4 天", dailyBudget: "¥350–680 / 人",
    tags: ["黄河", "面食", "城市漫游"], foods: ["兰州牛肉面", "灰豆子", "甜醅子"],
    sights: ["中山桥", "甘肃省博物馆", "白塔山"], transit: "地铁与公交串联河谷城区，黄河两岸可步行分段游览",
  },
  {
    city: "敦煌", province: "甘肃", region: "西北", image: "/cities/dunhuang.webp", aliases: ["敦煌市", "dunhuang"],
    hook: "石窟壁画与大漠星空", idealDays: "3–5 天", dailyBudget: "¥550–1,000 / 人",
    tags: ["石窟", "沙漠", "丝路"], foods: ["驴肉黄面", "胡羊焖饼", "杏皮水"],
    sights: ["莫高窟", "鸣沙山月牙泉", "阳关"], transit: "景点分散，莫高窟预约优先；西线宜拼车或包车并避免夜间疲劳驾驶",
  },
  {
    city: "乌鲁木齐", province: "新疆", region: "西北", image: "/cities/urumqi.webp", aliases: ["乌鲁木齐市", "urumqi", "乌市"],
    hook: "天山门户与多民族风味", idealDays: "3–5 天", dailyBudget: "¥480–900 / 人",
    tags: ["边疆", "博物馆", "美食"], foods: ["抓饭", "烤包子", "大盘鸡"],
    sights: ["新疆维吾尔自治区博物馆", "红山公园", "天山天池"], transit: "城区公交地铁为主，天池为独立一日线并关注天气和道路信息",
  },
  {
    city: "宁波", province: "浙江", region: "华东", image: "/cities/ningbo.webp", aliases: ["宁波市", "ningbo", "甬城", "甬"],
    hook: "港城、藏书楼与海鲜风味", idealDays: "2–3 天", dailyBudget: "¥420–720 / 人",
    tags: ["港城", "人文", "海鲜"], foods: ["宁波汤圆", "雪菜大黄鱼", "红膏炝蟹"],
    sights: ["天一阁·月湖", "宁波博物院", "老外滩"], transit: "城区以地铁和公交串联，古城人文片区适合步行，远郊古镇另留半天",
  },
  {
    city: "绍兴", province: "浙江", region: "华东", image: "/cities/shaoxing.webp", aliases: ["绍兴市", "shaoxing", "会稽", "越城"],
    hook: "古越水城、名士故里与黄酒", idealDays: "2–3 天", dailyBudget: "¥380–650 / 人",
    tags: ["古城", "水乡", "人文"], foods: ["绍兴醉鸡", "霉干菜焖肉", "黄酒奶茶"],
    sights: ["鲁迅故里", "沈园", "东湖"], transit: "古城核心适合步行与公交，东湖和柯岩等外围景点分开安排",
  },
  {
    city: "福州", province: "福建", region: "华东", image: "/cities/fuzhou.webp", aliases: ["福州市", "fuzhou", "榕城", "三山"],
    hook: "坊巷古厝、闽都文化与温泉", idealDays: "3–4 天", dailyBudget: "¥420–720 / 人",
    tags: ["古厝", "非遗", "美食"], foods: ["佛跳墙", "鱼丸", "肉燕"],
    sights: ["三坊七巷", "烟台山", "福建博物院"], transit: "地铁和公交覆盖主城区，三坊七巷与烟台山分片漫步，山海远郊单列一日",
  },
  {
    city: "济南", province: "山东", region: "华东", image: "/cities/jinan.webp", aliases: ["济南市", "jinan", "泉城"],
    hook: "泉水街巷与齐鲁人文", idealDays: "2–3 天", dailyBudget: "¥380–680 / 人",
    tags: ["泉水", "古城", "人文"], foods: ["把子肉", "甜沫", "油旋"],
    sights: ["趵突泉", "大明湖", "山东博物馆"], transit: "泉城核心景点集中，适合公交与步行；省博所在东部新城另安排半日",
  },
  {
    city: "贵阳", province: "贵州", region: "西南", image: "/cities/guiyang.webp", aliases: ["贵阳市", "guiyang", "筑城", "林城"],
    hook: "清凉山城、黔味与喀斯特", idealDays: "3–4 天", dailyBudget: "¥380–680 / 人",
    tags: ["避暑", "山城", "美食"], foods: ["肠旺面", "丝娃娃", "酸汤鱼"],
    sights: ["甲秀楼", "贵州省博物馆", "青岩古镇"], transit: "地铁与公交连接城区，青岩等外围目的地独立安排半天或一天",
  },
  {
    city: "香港", province: "香港", region: "港澳台", image: "/cities/hongkong.webp", aliases: ["香港特别行政区", "hong kong", "hongkong", "hk"],
    hook: "维港天际线与山海街巷", idealDays: "3–5 天", dailyBudget: "HK$750–1,500 / 人",
    tags: ["天际线", "街区", "山海"], foods: ["港式点心", "云吞面", "菠萝油"],
    sights: ["维多利亚港", "太平山顶", "西九龙文化区"], transit: "港铁、电车与渡轮组合高效，跨境证件和支付方式需提前确认",
  },
  {
    city: "澳门", province: "澳门", region: "港澳台", image: "/cities/macau.jpg", aliases: ["澳门特别行政区", "macao", "macau"],
    hook: "世遗街巷与中西味道", idealDays: "2–3 天", dailyBudget: "MOP 650–1,200 / 人",
    tags: ["世遗", "街区", "美食"], foods: ["葡挞", "猪扒包", "水蟹粥"],
    sights: ["大三巴牌坊", "澳门博物馆", "路环村"], transit: "半岛景点适合步行，跨岛可用公共巴士；口岸与酒店接驳需核验",
  },
  {
    city: "台北", province: "台湾", region: "港澳台", image: "/cities/taipei.webp", aliases: ["台北市", "taipei"],
    hook: "博物馆、山城与夜市日常", idealDays: "4–6 天", dailyBudget: "NT$1,800–3,800 / 人",
    tags: ["人文", "夜市", "城市"], foods: ["牛肉面", "卤肉饭", "胡椒饼"],
    sights: ["台北故宫博物院", "大稻埕", "象山"], transit: "捷运与公交覆盖成熟，外围山城和温泉可独立安排一日",
  },
  {
    city: "高雄", province: "台湾", region: "港澳台", image: "/cities/kaohsiung.webp", aliases: ["高雄市", "kaohsiung"],
    hook: "港湾、轻轨与南方日光", idealDays: "3–5 天", dailyBudget: "NT$1,600–3,300 / 人",
    tags: ["港湾", "艺术", "海滨"], foods: ["鸭肉饭", "海产粥", "木瓜牛奶"],
    sights: ["驳二艺术特区", "旗津", "莲池潭"], transit: "捷运与轻轨串联港区，旗津轮渡受天气影响需当天确认",
  },
  {
    city: "太原", province: "山西", region: "华北", image: "/cities/taiyuan.jpg", aliases: ["太原市", "taiyuan", "并州", "龙城"],
    hook: "晋祠古建、汾河与晋菜", idealDays: "2–4 天", dailyBudget: "¥380–680 / 人", tags: ["古建", "博物馆", "面食"],
    foods: ["刀削面", "头脑", "过油肉"], sights: ["晋祠博物馆", "山西博物院", "汾河公园"], transit: "市区地铁公交为主，晋祠与天龙山按南线单独安排",
  },
  {
    city: "承德", province: "河北", region: "华北", image: "/cities/chengde.jpg", aliases: ["承德市", "chengde", "热河"],
    hook: "皇家园林与外八庙", idealDays: "2–4 天", dailyBudget: "¥400–720 / 人", tags: ["园林", "古建", "避暑"],
    foods: ["羊汤", "荞面饸饹", "御土荷叶鸡"], sights: ["避暑山庄", "普宁寺", "普陀宗乘之庙"], transit: "老城步行与公交结合，外八庙分散需按片区安排",
  },
  {
    city: "长春", province: "吉林", region: "东北", image: "/cities/changchun.jpg", aliases: ["长春市", "changchun", "春城"],
    hook: "近代建筑、电影与汽车城", idealDays: "2–4 天", dailyBudget: "¥380–680 / 人", tags: ["历史", "电影", "工业"],
    foods: ["锅包肉", "雪衣豆沙", "熏肉大饼"], sights: ["伪满皇宫博物院", "长影旧址博物馆", "净月潭"], transit: "轨道交通连接主要城区，净月潭和文博区单独分日",
  },
  {
    city: "扬州", province: "江苏", region: "华东", image: "/cities/yangzhou.jpg", aliases: ["扬州市", "yangzhou", "广陵"],
    hook: "园林、运河与淮扬早茶", idealDays: "2–4 天", dailyBudget: "¥420–760 / 人", tags: ["园林", "运河", "美食"],
    foods: ["扬州早茶", "狮子头", "大煮干丝"], sights: ["瘦西湖", "个园", "中国大运河博物馆"], transit: "古城公交与步行为主，瘦西湖和运河三湾分片安排",
  },
  {
    city: "无锡", province: "江苏", region: "华东", image: "/cities/wuxi.jpg", aliases: ["无锡市", "wuxi", "梁溪"],
    hook: "太湖、古运河与工商文化", idealDays: "2–4 天", dailyBudget: "¥420–760 / 人", tags: ["湖泊", "园林", "美食"],
    foods: ["无锡小笼", "酱排骨", "太湖三白"], sights: ["鼋头渚", "惠山古镇", "清名桥"], transit: "地铁公交覆盖城区，鼋头渚等太湖景区按独立半日安排",
  },
  {
    city: "黄山", province: "安徽", region: "华东", image: "/cities/huangshan.jpg", aliases: ["黄山市", "huangshan", "徽州"],
    hook: "奇松云海与徽州古村", idealDays: "4–6 天", dailyBudget: "¥520–980 / 人", tags: ["山岳", "古村", "摄影"],
    foods: ["臭鳜鱼", "毛豆腐", "一品锅"], sights: ["黄山风景区", "宏村", "徽州古城"], transit: "黄山北站、屯溪、汤口与黟县方向不同，按住宿分段安排",
  },
  {
    city: "开封", province: "河南", region: "华中", image: "/cities/kaifeng.jpg", aliases: ["开封市", "kaifeng", "汴京", "东京"],
    hook: "北宋遗址与市井小吃", idealDays: "2–4 天", dailyBudget: "¥350–620 / 人", tags: ["宋史", "古建", "美食"],
    foods: ["灌汤包", "桶子鸡", "鲤鱼焙面"], sights: ["开封博物馆", "龙亭", "铁塔"], transit: "老城景点以公交步行为主，高铁北站进城需预留接驳",
  },
  {
    city: "景德镇", province: "江西", region: "华东", image: "/cities/jingdezhen.jpg", aliases: ["景德镇市", "jingdezhen", "瓷都"],
    hook: "御窑、瓷厂与手作山谷", idealDays: "2–4 天", dailyBudget: "¥380–700 / 人", tags: ["陶瓷", "工业遗产", "手作"],
    foods: ["冷粉", "饺子粑", "碱水粑"], sights: ["御窑博物院", "中国陶瓷博物馆", "陶溪川"], transit: "市区打车公交为主，瑶里与高岭属于远郊一日线",
  },
  {
    city: "珠海", province: "广东", region: "华南", image: "/cities/zhuhai.jpg", aliases: ["珠海市", "zhuhai"],
    hook: "海岸、岛屿与慢节奏湾区", idealDays: "2–4 天", dailyBudget: "¥480–900 / 人", tags: ["海滨", "海岛", "亲子"],
    foods: ["横琴生蚝", "白蕉海鲈", "海鲜粥"], sights: ["情侣路", "唐家湾古镇", "东澳岛"], transit: "公交和打车串联香洲，海岛船班受天气影响需核对",
  },
  {
    city: "南宁", province: "广西", region: "华南", image: "/cities/nanning.jpg", aliases: ["南宁市", "nanning", "绿城", "邕城"],
    hook: "壮乡文化、绿城与米粉", idealDays: "2–4 天", dailyBudget: "¥350–650 / 人", tags: ["民族文化", "绿城", "美食"],
    foods: ["老友粉", "卷筒粉", "柠檬鸭"], sights: ["广西民族博物馆", "青秀山", "三街两巷"], transit: "地铁连接主城区，青秀山与扬美古镇按片区分日",
  },
];

assertCityKnowledgeCoverage(CITY_PROFILES);

const LEGACY_ALIASES: Record<string, string[]> = {
  杭州: ["杭州市", "hangzhou", "临安"], 北京: ["北京市", "beijing", "北平"],
  上海: ["上海市", "shanghai", "沪"], 成都: ["成都市", "chengdu", "蓉城"],
  重庆: ["重庆市", "chongqing", "山城"], 西安: ["西安市", "xian", "xi'an", "长安"],
  桂林: ["桂林市", "guilin"], 苏州: ["苏州市", "suzhou", "姑苏"],
  广州: ["广州市", "guangzhou", "羊城"], 大理: ["大理市", "大理白族自治州", "dali"],
  泉州: ["泉州市", "quanzhou", "刺桐"], 拉萨: ["拉萨市", "lhasa"],
  青岛: ["青岛市", "qingdao", "岛城"], 南京: ["南京市", "nanjing", "金陵"],
};

function normalizeCityName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ");
}

export function citySearchTerms(profile: CityProfile) {
  return [profile.city, `${profile.city}市`, profile.province, ...(profile.aliases ?? []), ...(LEGACY_ALIASES[profile.city] ?? [])];
}

export function findCityProfile(value: string) {
  const query = normalizeCityName(value);
  if (!query) return undefined;
  return CITY_PROFILES.find((profile) => [profile.city, `${profile.city}市`, ...(profile.aliases ?? []), ...(LEGACY_ALIASES[profile.city] ?? [])]
    .some((term) => normalizeCityName(term) === query || normalizeCityName(term).includes(query) || query.includes(normalizeCityName(term))));
}

const DEMO_DATA_QUERIED_AT = "2026-08-08T00:00:00+08:00";

const HANGZHOU_SOURCES: Record<"lingyin" | "louwailou" | "zhiweiguan" | "kuiyuanguan", TravelSource> = {
  lingyin: {
    title: "杭州灵隐飞来峰景区预约游览须知",
    url: "https://travel.hangzhou.com.cn/lyzx/content/2025-11/19/content_9127067.html",
    siteName: "杭州网旅行频道",
    snippet: "自2025年12月1日起，灵隐飞来峰景区实行免票、实名预约、分时游览。",
    category: "预约与通知", queriedAt: DEMO_DATA_QUERIED_AT, official: false, confidence: "高", priceType: "联网搜索参考价",
  },
  louwailou: {
    title: "楼外楼｜中华老字号品牌详情",
    url: "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/ad535822bfbf41cfaa6c35d4a7b66bf3",
    siteName: "商务部老字号数字博物馆",
    snippet: "楼外楼创立于1848年，传统菜肴包括西湖醋鱼、东坡肉、叫化童鸡与龙井虾仁。",
    category: "餐厅与美食", queriedAt: DEMO_DATA_QUERIED_AT, official: true, confidence: "高", priceType: "非价格信息",
  },
  zhiweiguan: {
    title: "知味观·味庄（西湖）餐厅条目",
    url: "https://guide.michelin.com/sg/zh_CN/zhe-jiang/hangzhou_1027184/restaurant/zhi-wei-guan-%E2%80%A2-wei-zhuang",
    siteName: "米其林指南",
    snippet: "位于西湖区杨公堤，菜单包含杭州经典名菜与创新菜式。",
    category: "餐厅与美食", queriedAt: DEMO_DATA_QUERIED_AT, official: false, confidence: "中", priceType: "非价格信息",
  },
  kuiyuanguan: {
    title: "奎元馆（解放路）餐厅条目",
    url: "https://guide.michelin.com/en/zhe-jiang/hangzhou_1027184/restaurant/kui-yuan-guan-jiefang-road",
    siteName: "米其林指南",
    snippet: "解放路店以杭州面食著称，片儿川、虾爆鳝面等适合安排为市区简餐。",
    category: "餐厅与美食", queriedAt: DEMO_DATA_QUERIED_AT, official: false, confidence: "中", priceType: "非价格信息",
  },
};

const HANGZHOU_DEMO_PLAN: TravelPlan = {
  title: "杭州｜湖山、茶香与城市日常",
  subtitle: "4 天 · 舒展节奏 · 美食与人文优先",
  destination: "杭州",
  heroSummary: "把西湖、灵隐、运河和茶村分成四条顺路动线，每天只保留一个主区域，用片儿川、杭帮菜和茶点把城市味道嵌进路线，而不是另列一张网红清单。",
  bestFor: ["第一次到杭州", "喜欢人文与慢行", "希望控制折返"],
  estimatedDailyBudget: "人均每日参考 ¥450–650",
  estimatedTotalBudget: "四日参考 ¥1,800–2,600",
  transportSummary: "地铁与公交进出片区，片区内步行，灵隐段短程打车",
  matchReason: "第一天先用北山街与孤山建立西湖印象；第二天只走灵隐—梅灵山线；第三天转到运河看城市日常；第四天把南宋遗迹、老街与面馆放在同一片区，不为打卡反复横穿杭州。",
  lodgingAdvice: "住宿建议：这份四日方案以凤起路—龙翔桥一带为据点，第一天步行接入西湖北线，第二天便于进出灵隐，第三、四天可用公共交通衔接运河和吴山；全程不需要换酒店。",
  highlights: [
    { name: "北山街—孤山", type: "西湖人文", why: "这里把湖面、白堤、近代建筑与孤山文脉连在同一条步行线上，比匆忙绕完整个西湖更能看清杭州的层次。", duration: "3—4小时", area: "西湖北线", bestTime: "工作日上午", pitfall: "不要把断桥当成终点；过桥后继续走白堤与孤山，才是这段路线的主体。" },
    { name: "灵隐飞来峰", type: "佛教造像", why: "杭州最具代表性的佛教文化与石窟造像体验，不只是单纯进寺烧香；山林、造像与寺院适合一次完成。", duration: "3—4小时", area: "西湖西侧", bestTime: "工作日开园后", pitfall: "节假日上午入口排队明显，法喜寺与其他寺院不必全部连刷，留出梅灵路茶村时间。", ticketReference: "免费", ticketSource: HANGZHOU_SOURCES.lingyin, ticketCheckedAt: DEMO_DATA_QUERIED_AT, bookingNote: "实名预约、分时游览", bookingSource: HANGZHOU_SOURCES.lingyin, bookingCheckedAt: DEMO_DATA_QUERIED_AT, priceType: "联网搜索参考价" },
    { name: "小河直街—拱宸桥", type: "运河街区", why: "能看到杭州不靠西湖的一面：临水民居、桥西工业遗存与运河生活在一条缓慢的城市步行线上。", duration: "3—4小时", area: "运河—桥西", bestTime: "下午到傍晚", pitfall: "不要把河坊街式商业期待套在这里；重点是街巷尺度和运河沿岸，而不是密集购物。" },
    { name: "德寿宫—南宋御街", type: "南宋城市史", why: "从遗址展示到御街与鼓楼，适合用半天理解南宋临安的城市轴线，也能自然接上解放路的杭州面馆。", duration: "3—4小时", area: "上城—吴山", bestTime: "工作日上午", pitfall: "先确认德寿宫当日预约；约不到时直接把时间留给胡雪岩故居周边与南宋御街，不必跨区补景点。" },
  ],
  foods: [
    { name: "片儿川", category: "杭州面食", suggestion: "第四天午餐或早餐", budget: "¥25–45", note: "雪菜、笋片和肉片是核心；想更有层次可加虾爆鳝，但不必把一碗面排成跨区打卡。" },
    { name: "龙井虾仁", category: "杭帮菜", suggestion: "第一或第二天正餐共享", budget: "单菜约¥90–160", note: "更适合两人以上分食，配一份时蔬和家常菜比单点多道名菜更稳妥。" },
    { name: "葱包桧", category: "街头小吃", suggestion: "第三天运河街区加餐", budget: "¥8–18", note: "把它当作小份加餐，不代替正餐；现压现烤的口感更好。" },
    { name: "定胜糕与猫耳朵", category: "传统点心", suggestion: "第一天湖滨或第四天吴山", budget: "¥15–35", note: "少量尝味即可，伴手礼注意保质期；猫耳朵是面点，不是零食。" },
  ],
  restaurants: [
    { name: "楼外楼（孤山路）", why: "餐厅本身就是西湖饮食史的一部分，位置与第一天孤山路线完全重合，适合把经典杭帮菜安排进景点动线，而不是另跑一趟。", signatureDishes: ["东坡肉", "龙井虾仁", "西湖莼菜汤"], budget: "约¥160–260 / 人", area: "孤山", plannedFor: "DAY 01 午餐", classicStatus: "中华老字号", checkedAt: DEMO_DATA_QUERIED_AT, source: HANGZHOU_SOURCES.louwailou },
    { name: "知味观·味庄（杨公堤）", why: "在西湖西侧集中呈现杭州经典菜，适合作为灵隐返程后的正式晚餐；比从山里回城后再横穿市区更顺路。", signatureDishes: ["杭帮点心", "龙井虾仁", "东坡肉"], budget: "约¥100–180 / 人", area: "杨公堤", plannedFor: "DAY 02 晚餐", classicStatus: "地方经典品牌", checkedAt: DEMO_DATA_QUERIED_AT, source: HANGZHOU_SOURCES.zhiweiguan },
    { name: "奎元馆（解放路）", why: "杭州面食最清晰的一站，解放路店又与第四天南宋御街片区相邻，用一碗面完成在地午餐，不会为老字号单独绕路。", signatureDishes: ["虾爆鳝面", "片儿川", "猪肝面"], budget: "约¥35–70 / 人", area: "解放路", plannedFor: "DAY 04 午餐", classicStatus: "中华老字号", checkedAt: DEMO_DATA_QUERIED_AT, source: HANGZHOU_SOURCES.kuiyuanguan },
  ],
  staySuggestions: [
    { area: "湖滨—武林", why: "适合第一次到访和地铁出行，前往西湖、运河与火车站较方便。" },
    { area: "运河沿线", why: "更安静，适合慢旅行；前往西湖需预留跨片区交通。" },
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
      label: "DAY 01", date: "10月23日 · 周五", theme: "北山街与湖滨，不急着环完整个西湖", note: "从西湖北线开始，沿白堤进入孤山，傍晚回到湖滨；一天只走同一片湖岸。", area: "北山街—孤山—湖滨", transportAdvice: "上午以步行为主；孤山到湖滨可选短程公交或打车，不安排跨城移动。", dailyBudget: "约¥220–360 / 人，不含住宿",
      costItems: [{ label: "早餐", amount: "¥15–25" }, { label: "午餐", amount: "¥160–260" }, { label: "晚餐", amount: "¥50–90" }, { label: "市内交通", amount: "¥10–25" }, { label: "当日合计", amount: "约¥220–360，不含住宿" }],
      arrangementReason: "北山街、白堤、孤山和湖滨在一条连续湖岸上；把楼外楼放在孤山午餐，既有代表性，也不需要为名店折返。",
      optionalToDrop: "如果当天较累，取消湖滨夜间散步，直接回酒店休息。",
      stops: [
        { time: "09:00", title: "断桥—白堤—孤山", meta: "湖岸步行 · 约2.5小时", detail: "从北山街进入西湖，过断桥后继续走白堤与孤山；上午光线和步行体验更好。", tone: "blue" },
        { time: "12:00", title: "楼外楼午餐", meta: "中华老字号 · 约¥160–260/人", detail: "两人以上共享东坡肉、龙井虾仁与时蔬即可，不必为了“名菜全套”点得过量。", tone: "clay" },
        { time: "14:00", title: "浙江省博物馆孤山馆区", meta: "博物馆 · 约1.5小时", detail: "与上午路线处于同一区域；出发前只需确认当天展厅与开放安排。", tone: "lavender" },
        { time: "17:30", title: "湖滨步行街与晚餐", meta: "城市散步 · 约¥50–90/人", detail: "短程返回湖滨，晚餐可选片儿川、猫耳朵或简洁杭帮小吃，不再安排另一家远距离名店。", tone: "sage" },
        { time: "晚上", title: "西湖夜间散步", meta: "可选 · 30—60分钟", detail: "只走湖滨一小段；如果白天步行量已足够，直接取消。", tone: "blue" },
      ],
    },
    {
      label: "DAY 02", date: "10月24日 · 周六", theme: "灵隐与梅灵，山线一天只进出一次", note: "早到灵隐看飞来峰造像，午后沿梅灵方向体验茶村，傍晚从西湖西侧返程。", area: "灵隐—梅灵—杨公堤", transportAdvice: "进山建议公交或打车；灵隐到梅灵为同方向衔接，返程后不再进入湖滨核心区。", dailyBudget: "约¥230–380 / 人，不含住宿",
      costItems: [{ label: "早餐", amount: "¥15–25" }, { label: "午餐", amount: "¥60–100" }, { label: "晚餐", amount: "¥100–180" }, { label: "市内交通", amount: "¥35–70" }, { label: "当日合计", amount: "约¥230–380，不含住宿" }],
      arrangementReason: "灵隐、梅灵路和杨公堤都在西湖西侧，按山线顺序向外移动，避免上午进山、午后回城、傍晚再次折返。",
      optionalToDrop: "如果遇到大客流或下雨，取消茶村散步，只保留灵隐与西湖西侧晚餐。",
      stops: [
        { time: "08:00", title: "灵隐飞来峰", meta: "石刻与山林 · 约2小时", detail: "先看飞来峰造像，再决定是否进入寺院；预约名额和分时时段应在出发前确认。", tone: "sage" },
        { time: "10:15", title: "灵隐寺或永福寺二选一", meta: "寺院 · 约1.5小时", detail: "不连续安排多座寺院；选一处慢看，把体力留给下午茶村。", tone: "lavender" },
        { time: "12:30", title: "梅灵路茶香午餐", meta: "山线午餐 · 约¥60–100/人", detail: "以清淡杭帮菜、时蔬或茶香菜为主；具体店铺当天看营业情况，不推荐未经核验的网红店。", tone: "clay" },
        { time: "14:30", title: "梅家坞茶村", meta: "茶村散步 · 约1.5小时", detail: "重点看茶园与村落，不接受强制购物；雨天缩短户外停留。", tone: "sage" },
        { time: "18:00", title: "知味观·味庄晚餐", meta: "地方经典 · 约¥100–180/人", detail: "从山线返回后在西湖西侧吃正式杭帮菜，避免再跨到城东；热门时段提前电话确认。", tone: "clay" },
      ],
    },
    {
      label: "DAY 03", date: "10月25日 · 周日", theme: "运河日常，给双脚一个低强度日", note: "从小河直街向桥西、拱宸桥缓慢移动，街区、博物馆与晚餐都留在运河沿线。", area: "小河直街—桥西—拱宸桥", transportAdvice: "到达片区后主要步行；傍晚从拱宸桥一带直接返程，不回头走完整条河岸。", dailyBudget: "约¥150–260 / 人，不含住宿",
      costItems: [{ label: "早餐", amount: "¥15–25" }, { label: "午餐", amount: "¥45–75" }, { label: "晚餐", amount: "¥70–120" }, { label: "市内交通", amount: "¥15–35" }, { label: "当日合计", amount: "约¥150–260，不含住宿" }],
      arrangementReason: "连续两天西湖后把第三天放到运河，空间和内容都有变化；路线由南向北推进，全天强度较低。",
      optionalToDrop: "如果博物馆停留较久，取消傍晚运河夜景，不压缩晚餐。",
      stops: [
        { time: "09:00", title: "小河直街", meta: "历史街区 · 1小时20分", detail: "观察临水民居与当代小店共存的城市尺度。", tone: "blue" },
        { time: "11:00", title: "桥西历史文化街区", meta: "街区 · 1小时", detail: "把手工艺展馆与街区散步合并。", tone: "clay" },
        { time: "12:15", title: "运河边杭味午餐", meta: "午餐 · 约¥45–75/人", detail: "选择同片区杭帮小菜，葱包桧可作为加餐；不为单一热门店离开运河。", tone: "clay" },
        { time: "14:00", title: "杭州京杭大运河博物馆", meta: "博物馆 · 约1.5小时", detail: "出发前确认当天展厅与开放安排；如临时闭馆，把时间留给桥西街区。", tone: "lavender" },
        { time: "17:00", title: "拱宸桥与运河晚餐", meta: "傍晚散步 · 约¥70–120/人", detail: "在拱宸桥附近完成晚餐；夜景只作为可选，不另外乘车追打卡点。", tone: "blue" },
      ],
    },
    {
      label: "DAY 04", date: "10月26日 · 周一", theme: "南宋临安与杭州面，收在同一座老城里", note: "最后一天留在上城老城，从德寿宫到南宋御街，再到解放路吃面，为取行李和返程保留缓冲。", area: "德寿宫—南宋御街—解放路", transportAdvice: "片区内步行可达；午餐后直接回酒店取行李，不再加入远郊或跨江景点。", dailyBudget: "约¥120–210 / 人，不含住宿",
      costItems: [{ label: "早餐", amount: "¥15–25" }, { label: "午餐", amount: "¥35–70" }, { label: "晚餐/返程简餐", amount: "¥40–70" }, { label: "市内交通", amount: "¥15–35" }, { label: "当日合计", amount: "约¥120–210，不含住宿" }],
      arrangementReason: "返程日不安排九溪或远郊；南宋遗迹、老街与解放路面馆相邻，既补足杭州历史，也能随时结束行程。",
      optionalToDrop: "如果返程较早，取消胡雪岩故居周边散步，午餐后直接取行李。",
      stops: [
        { time: "09:00", title: "南宋德寿宫遗址博物馆", meta: "遗址博物馆 · 约1.5小时", detail: "预约成功再进入；如果没有名额，不在现场久等，直接转南宋御街。", tone: "lavender" },
        { time: "10:45", title: "南宋御街—鼓楼", meta: "老城步行 · 约1.5小时", detail: "沿城市轴线向南走，重点看街巷关系，不把河坊街购物当成核心任务。", tone: "blue" },
        { time: "12:30", title: "奎元馆午餐", meta: "中华老字号 · 约¥35–70/人", detail: "片儿川适合清爽收尾，想吃更丰盛可选虾爆鳝面；高峰排队时改吃同片区杭州面。", tone: "clay" },
        { time: "14:00", title: "胡雪岩故居周边或咖啡休息", meta: "可选 · 约1小时", detail: "只在返程时间充足时加入，不购买新的跨区门票。", tone: "sage" },
        { time: "15:30", title: "返回酒店取行李与返程简餐", meta: "晚餐或返程简餐 · ¥40–70", detail: "按车次在酒店或车站附近吃一顿简餐，给交通和安检留足余量，不再临时增加景点。", tone: "blue" },
      ],
    },
  ],
  preDepartureChecklist: ["完成灵隐飞来峰实名预约并确认分时时段", "核对德寿宫与计划内博物馆的预约、闭馆安排", "节假日提前购买往返车票，铁路行程以12306为准", "出发前一天查看杭州天气，雨天缩短茶村与湖岸步行", "对楼外楼、知味观等热门正餐准备同片区替代方案"],
  liveData: {
    searchedAt: DEMO_DATA_QUERIED_AT,
    searchStatus: "partial",
    searchProvider: "curated",
    cacheStatus: "cache",
    queryCount: 0,
    sources: Object.values(HANGZHOU_SOURCES),
    warnings: [],
  },
};

function chineseDate(iso: string, offset: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日 · ${weekdays[date.getUTCDay()]}`;
}

/**
 * 无密钥时也按所选城市生成可浏览的基础方案；所有动态事实均明确标记为待核验。
 * 这不是实时攻略，也不会用另一座城市的资料进行填充。
 */
export function createCityDemoPlan(input: TravelRequest): TravelPlan | null {
  const profile = findCityProfile(input.destination);
  if (!profile) return null;
  const knowledge = getCityKnowledge(profile);
  const requestedDays = Math.min(Math.max(input.days, 2), 8);
  if (profile.city === "杭州" && requestedDays === 4) {
    return {
      ...HANGZHOU_DEMO_PLAN,
      subtitle: `4 天 · ${input.pace}节奏 · ${input.interests.slice(0, 2).join("与") || "湖山与人文"}`,
      days: HANGZHOU_DEMO_PLAN.days.map((day, index) => ({ ...day, date: chineseDate(input.startDate, index) })),
    };
  }
  const dailySpend = input.budget === "经济" ? "约¥150–260 / 人，不含住宿" : input.budget === "舒适" ? "约¥320–520 / 人，不含住宿" : "约¥220–380 / 人，不含住宿";
  const tones = ["sage", "clay", "lavender", "blue"] as const;
  const days = Array.from({ length: requestedDays }, (_, index) => {
    const poi = knowledge.pois[index % knowledge.pois.length];
    const lunch = knowledge.foods[index % knowledge.foods.length];
    const dinner = knowledge.foods[(index + 1) % knowledge.foods.length];
    const stops = [
      { time: "上午", title: poi.name, meta: `${profile.tags[index % profile.tags.length]} · ${poi.suggestedDuration}`, detail: `从${poi.name}理解${profile.city}的城市气质；营业与预约信息请在出发前通过官方渠道确认。`, tone: tones[0], source: `城市资料 · 整理于 ${knowledge.queriedAt}` },
      { time: "午餐", title: `${lunch.name}午餐`, meta: `当地美食 · ${lunch.budget}`, detail: `在${poi.area}附近安排${lunch.name}，不为单一热门店跨区。`, tone: tones[1], source: "城市资料 · 具体店铺请按当日营业情况选择" },
      { time: "下午", title: `${poi.area}在地漫游`, meta: "街区或自然体验 · 建议预留半天", detail: `下午继续停留在${poi.area}，按体力选择街区、公共空间或同片区展馆，避免跨区折返。`, tone: tones[2], source: "区域动线建议 · 非精确导航" },
      { time: "晚餐", title: `${dinner.name}晚餐`, meta: `当地美食 · ${dinner.budget}`, detail: `用${dinner.name}结束当日主线，餐馆营业与排队情况当天确认。`, tone: tones[3], source: "餐饮参考预算 · 以实际菜单为准" },
    ];
    if (input.pace !== "松弛") stops.push({
      time: "晚上", title: `${poi.area}可选夜间散步`, meta: "可选体验 · 不增加跨区移动",
      detail: "只在体力、天气与返程条件允许时加入；夜间公共交通与场所开放状态出发前核验。",
      tone: tones[0], source: "可选安排 · 出发前核验",
    });
    return {
      label: `DAY ${String(index + 1).padStart(2, "0")}`,
      date: chineseDate(input.startDate, index),
      theme: `${poi.area} · ${profile.tags[index % profile.tags.length]}体验`,
      note: `当天只安排${poi.area}一个主要片区；营业与收费信息请在出发前通过官方渠道确认。`,
      area: poi.area,
      transportAdvice: "同片区优先步行；较远节点使用短程公交、地铁或打车。没有可信来源时不显示精确距离、分钟数、线路号或站名。",
      dailyBudget: dailySpend,
      costItems: [
        { label: "早餐", amount: "¥15–30" },
        { label: "午餐", amount: lunch.budget },
        { label: "晚餐", amount: dinner.budget },
        { label: "市内交通", amount: "¥15–45" },
        { label: "当日合计", amount: dailySpend },
      ],
      arrangementReason: `${poi.name}、午晚餐与下午漫游都围绕${poi.area}安排，避免为了单一打卡点跨区折返。`,
      optionalToDrop: `如果体力或天气不理想，取消晚间散步，保留${poi.name}与两顿正餐。`,
      stops,
    };
  });

  const highlights: TravelPlan["highlights"] = knowledge.pois.map((poi, index) => ({
    name: poi.name,
    type: profile.tags[index % profile.tags.length],
    area: poi.area,
    why: `${poi.name}是${profile.city}${profile.hook}的重要切面，适合与${poi.area}体验顺路组合。`,
    duration: poi.suggestedDuration,
    bestTime: "工作日上午或客流较低时段",
    pitfall: `当天只安排${poi.area}及相邻区域，不为额外打卡点跨区往返。`,
  }));
  highlights.push({
    name: `${profile.city}在地饮食体验`, type: "美食",
    why: `${profile.foods.join("、")}能补足景点之外的地域味道，并可自然嵌入每日路线。`,
    duration: "建议预留一餐", area: knowledge.stayAreas[0],
    bestTime: "午餐或晚餐正餐时段",
    pitfall: "优先选当日主片区内的正规餐馆，不为短期网红店改变整天动线。",
  });

  return {
    title: `${profile.city}｜${profile.hook}`,
    subtitle: `${requestedDays} 天 · ${input.pace}节奏 · ${input.interests.slice(0, 2).join("与") || "城市精华"}`,
    destination: profile.city,
    heroSummary: `这是一份随${profile.city}动态生成的基础方案：围绕${profile.sights.join("、")}组织片区路线，并把${profile.foods.join("、")}安排进正餐。营业、收费与预约信息请在出发前通过官方渠道确认。`,
    bestFor: [`第一次到${profile.city}`, ...profile.tags.slice(0, 2)],
    estimatedDailyBudget: profile.dailyBudget,
    estimatedTotalBudget: `${profile.dailyBudget} × ${requestedDays} 天（不含动态门票及往返大交通）`,
    transportSummary: profile.transit,
    matchReason: `根据${input.pace}节奏、${input.budget}预算与${input.transport}偏好，按代表景点片区分日，避免明显跨区折返。`,
    highlights,
    foods: knowledge.foods.map((food) => ({ name: food.name, category: "城市代表美食", suggestion: food.meal, budget: food.budget, note: `优先选择当天主片区内的正规餐馆体验${food.name}，不为单一店铺跨区；预算为常规用餐参考。` })),
    staySuggestions: knowledge.stayAreas.map((area, index) => ({
      area,
      why: index === 0 ? `适合第一次到${profile.city}，便于衔接主要片区。` : index === 1 ? "适合公共交通和餐饮选择，兼顾晚间返程。" : "适合希望降低跨区频率或衔接车站的行程。",
    })),
    transportPlan: [
      { scene: "市区主线路", choice: input.transport, detail: profile.transit },
      { scene: "相邻景点", choice: "区域动线建议", detail: "按片区分组，同片区优先步行或短程公交；页面动线用于行程取舍，实际路线请以出发时的地图导航为准。" },
      { scene: "机场与火车站", choice: "以官方交通渠道复核", detail: knowledge.arrivalAccess },
    ],
    budgetBreakdown: [
      { category: "住宿", amount: "约占全程预算 48%", percent: 48 },
      { category: "餐饮", amount: "约占全程预算 27%", percent: 27 },
      { category: "市内交通", amount: "约占全程预算 14%", percent: 14 },
      { category: "机动预算", amount: "约占全程预算 11%", percent: 11 },
    ],
    days,
    preDepartureChecklist: ["核对计划内博物馆或场馆的预约安排", "出发前一天查看天气并调整户外活动", "节假日提前购买往返车票", "为热门餐厅准备同片区替代方案"],
    verificationNote: "营业时间和收费信息可能调整，出发前建议通过景区官方渠道确认。",
    liveData: {
      searchedAt: DEMO_DATA_QUERIED_AT, searchStatus: "off", searchProvider: "未配置",
      cacheStatus: "off", queryCount: 0, sources: [],
      warnings: ["联网搜索 API 尚未配置", "动态信息均为出发前待核验状态"],
    },
  };
}

export const DEMO_PLAN = HANGZHOU_DEMO_PLAN;
