import type { TravelPlan, TravelRequest } from "./deepseek";
import { assertCityKnowledgeCoverage, getCityKnowledge } from "./city-knowledge";

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

const LEGACY_HANGZHOU_PLAN: TravelPlan = {
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
    { name: "西湖西线慢行", type: "山水", why: "避开只逛湖滨的单一视角，从孤山、曲院风荷到杨公堤看更完整的湖山层次。", duration: "半日", ticketReference: "开放景区；游船等项目另计，待核验", openingHours: "开放时段待出发前核验", bookingNote: "节假日客流和游船班次需核验", priceType: "出发前待核验" },
    { name: "灵隐飞来峰", type: "人文", why: "石刻、寺院与山林密度高，适合与梅灵路茶村组成同方向路线。", duration: "3–4 小时", ticketReference: "门票与寺院香花券待核验", openingHours: "开放时间待核验", bookingNote: "以景区官方预约页面为准", priceType: "出发前待核验" },
    { name: "京杭大运河", type: "城市", why: "补足杭州不止西湖的一面，从小河直街看到运河生活与工业遗存。", duration: "半日", ticketReference: "街区开放；展馆及游船价格待核验", openingHours: "街区全天可达，展馆时段待核验", bookingNote: "博物馆预约政策出发前核验", priceType: "出发前待核验" },
    { name: "九溪与龙井村", type: "自然", why: "以低难度山林步行收尾，路线可根据天气与体力随时缩短。", duration: "半日", ticketReference: "公共步道通常无需门票，具体以现场为准", openingHours: "天气与步道路况待核验", bookingNote: "雨天缩短路线，不购买来源不明体验", priceType: "出发前待核验" },
  ],
  foods: [
    { name: "片儿川", category: "面食", suggestion: "早餐或简餐", budget: "¥18–35", note: "先尝笋片、雪菜与肉片的本地组合，不必追逐单一名店。" },
    { name: "龙井虾仁", category: "杭帮菜", suggestion: "正餐共享", budget: "¥80–160", note: "适合两人以上点餐，与时蔬、东坡肉等分食更合理。" },
    { name: "葱包桧", category: "街头小吃", suggestion: "下午加餐", budget: "¥8–18", note: "在老街区作为轻食体验，不替代正餐。" },
    { name: "定胜糕", category: "传统糕点", suggestion: "伴手礼", budget: "¥10–30", note: "现吃少量即可，留意保质期和糖度。" },
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
      label: "DAY 01", date: "10月23日 · 周五", theme: "西湖初见 · 湖岸与人文", note: "从北山街进入西湖，沿同一岸线移动，傍晚保留自由时间。", area: "西湖沿线", transportAdvice: "湖岸节点多为步行可达，较远段使用短程公交或打车。", dailyBudget: "¥520–720 / 人",
      stops: [
        { time: "08:00", title: "断桥与白堤", meta: "湖畔 · 1小时20分", detail: "清晨沿白堤步行，先建立西湖空间感。", tone: "blue" },
        { time: "10:00", title: "孤山与浙江省博物馆", meta: "人文 · 1小时40分", detail: "园林与室内参观组合，具体展馆开放安排需出发前核验。", tone: "lavender", source: "出发前核验" },
        { time: "12:20", title: "片儿川与杭帮小菜", meta: "午餐 · ¥45–80", detail: "选择顺路餐馆，不为单一热门店跨区。", tone: "clay" },
        { time: "15:00", title: "曲院风荷至杨公堤", meta: "散步 · 1小时30分", detail: "根据体力决定步行长度，保留坐船或喝茶的弹性。", tone: "sage" },
      ],
    },
    {
      label: "DAY 02", date: "10月24日 · 周六", theme: "灵隐山色 · 石刻与茶村", note: "上午集中灵隐片区，下午沿梅灵路移动，不返回市区后再次进山。", area: "灵隐—梅灵片区", transportAdvice: "进山建议公交或打车，片区内按体力步行，预留半天。", dailyBudget: "¥560–780 / 人",
      stops: [
        { time: "07:40", title: "灵隐飞来峰", meta: "石刻 · 1小时40分", detail: "早点进入片区，把山林步道安排在客流高峰前。", tone: "sage", source: "出发前核验" },
        { time: "10:00", title: "灵隐寺", meta: "寺院 · 1小时20分", detail: "预约、票务与开放时间以出发前官方信息为准。", tone: "lavender", source: "出发前核验" },
        { time: "12:30", title: "梅灵路午餐", meta: "午餐 · ¥60–100", detail: "以茶香简餐衔接下午动线。", tone: "clay" },
        { time: "14:30", title: "梅家坞茶村", meta: "茶村 · 1小时30分", detail: "重点体验茶园环境，不设置强制购物。", tone: "sage" },
      ],
    },
    {
      label: "DAY 03", date: "10月25日 · 周日", theme: "运河日常 · 街巷与博物馆", note: "安排为低强度日，从小河直街一路走向拱宸桥。", area: "运河—拱宸桥片区", transportAdvice: "街区节点步行可达，进出片区使用地铁或短程公交。", dailyBudget: "¥480–680 / 人",
      stops: [
        { time: "09:00", title: "小河直街", meta: "历史街区 · 1小时20分", detail: "观察临水民居与当代小店共存的城市尺度。", tone: "blue" },
        { time: "11:00", title: "桥西历史文化街区", meta: "街区 · 1小时", detail: "把手工艺展馆与街区散步合并。", tone: "clay" },
        { time: "12:10", title: "运河边杭味午餐", meta: "午餐 · ¥45–90", detail: "尝试葱包桧或杭帮小菜，不为热门店跨区。", tone: "clay" },
        { time: "13:30", title: "中国京杭大运河博物馆", meta: "博物馆 · 1小时30分", detail: "预约与展厅开放信息需提前核验。", tone: "lavender", source: "出发前核验" },
        { time: "16:00", title: "拱宸桥与运河畔", meta: "散步 · 1小时", detail: "是否继续乘船或看夜景根据体力决定。", tone: "blue" },
      ],
    },
    {
      label: "DAY 04", date: "10月26日 · 周一", theme: "九溪收尾 · 龙井山色", note: "最后一天只走一条山间路线，为取行李和返程保留缓冲。", area: "九溪—龙井片区", transportAdvice: "山间段建议打车或公交，步行量按天气与体力缩短。", dailyBudget: "¥480–700 / 人",
      stops: [
        { time: "09:00", title: "九溪烟树", meta: "轻徒步 · 1小时30分", detail: "按天气与路况决定步行长度，湿滑时缩短路线。", tone: "sage" },
        { time: "11:10", title: "龙井村", meta: "茶村 · 1小时10分", detail: "短暂停留看茶园与村落，不安排强制消费。", tone: "clay" },
        { time: "12:30", title: "茶村午餐", meta: "午餐 · ¥55–100", detail: "安排一顿清淡杭帮菜，为返程留出消化和休息时间。", tone: "clay" },
        { time: "14:20", title: "返回酒店取行李", meta: "交通 · 预留缓冲", detail: "不再临时加入跨区景点。", tone: "blue" },
      ],
    },
  ],
};

function chineseDate(iso: string, offset: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日 · ${weekdays[date.getUTCDay()]}`;
}

const DEMO_DATA_QUERIED_AT = "2026-08-08T00:00:00+08:00";

/**
 * 无密钥时也按所选城市生成可浏览的基础方案；所有动态事实均明确标记为待核验。
 * 这不是实时攻略，也不会用另一座城市的资料进行填充。
 */
export function createCityDemoPlan(input: TravelRequest): TravelPlan | null {
  const profile = findCityProfile(input.destination);
  if (!profile) return null;
  const knowledge = getCityKnowledge(profile);
  const requestedDays = Math.min(Math.max(input.days, 2), 8);
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
      dailyBudget: profile.dailyBudget,
      stops,
    };
  });

  const highlights: TravelPlan["highlights"] = knowledge.pois.map((poi, index) => ({
    name: poi.name,
    type: profile.tags[index % profile.tags.length],
    area: poi.area,
    why: `${poi.name}是${profile.city}${profile.hook}的重要切面，适合与${poi.area}体验顺路组合。`,
    duration: poi.suggestedDuration,
  }));
  highlights.push({
    name: `${profile.city}在地饮食体验`, type: "美食",
    why: `${profile.foods.join("、")}能补足景点之外的地域味道，并可自然嵌入每日路线。`,
    duration: "建议预留一餐", area: knowledge.stayAreas[0],
  });

  const maintainedSources = knowledge.sources.map((source) => ({
    title: `${profile.city}城市概况与文旅资源`, url: source.url, siteName: source.name,
    snippet: `城市资料整理于 ${knowledge.queriedAt}；营业、收费与预约信息请在出发前通过官方渠道确认。`,
    category: "城市基础资料" as const, queriedAt: source.queriedAt, official: source.official,
    confidence: source.confidence, priceType: "非价格信息" as const,
  }));

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
    verificationNote: "营业时间和收费信息可能调整，出发前建议通过景区官方渠道确认。",
    liveData: {
      searchedAt: DEMO_DATA_QUERIED_AT, searchStatus: "off", searchProvider: "未配置",
      cacheStatus: "off", queryCount: 0, sources: maintainedSources,
      warnings: ["联网搜索 API 尚未配置", "动态信息均为出发前待核验状态"],
    },
  };
}

export const DEMO_PLAN = createCityDemoPlan({
  destination: "杭州",
  originCity: "上海",
  startDate: "2026-10-23",
  days: 4,
  pace: "舒展",
  budget: "适中",
  interests: ["地道美食", "历史古迹", "街区漫游"],
  transport: "公共交通优先",
}) ?? LEGACY_HANGZHOU_PLAN;
