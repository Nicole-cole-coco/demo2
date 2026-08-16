import type { CityProfile, CitySeason } from "./cities";

export const CITY_DATA_QUERY_DATE = "2026-08-08";
const VERIFY_BEFORE_DEPARTURE = `出发前核验（预置资料查询于 ${CITY_DATA_QUERY_DATE}）`;

export type CityKnowledgeSource = {
  id: string;
  name: string;
  url: string;
  category: "城市概况与文旅资源";
  official: true;
  confidence: "高";
  queriedAt: string;
  validUntil: string;
};

export type CityPoiFact = {
  name: string;
  area: string;
  suggestedDuration: string;
  ticketReference: string;
  openingHours: string;
  reservation: string;
  sourceIds: string[];
};

export type CityFoodFact = {
  name: string;
  meal: string;
  budget: string;
};

export type CityKnowledge = {
  city: string;
  province: string;
  region: CityProfile["region"];
  coverImage: string;
  recommendedDays: string;
  recommendedSeasons: CitySeason[];
  pois: CityPoiFact[];
  foods: CityFoodFact[];
  stayAreas: string[];
  localTransport: string;
  arrivalAccess: string;
  dailyBudget: string;
  dataStatus: "预置基础资料";
  queriedAt: string;
  sources: CityKnowledgeSource[];
};

type CuratedConfig = {
  seasons: CitySeason[];
  stayAreas: string[];
  arrivalAccess: string;
  poiAreas: string[];
  sourceName: string;
  sourceUrl: string;
};

const CONFIG: Record<string, CuratedConfig> = {
  北京: { seasons: ["春季", "秋季"], stayAreas: ["东城", "西城", "国贸"], arrivalAccess: "首都机场、大兴机场及北京各火车站可通过机场线、轨道交通或正规出租车进入市区，具体班次出发前核验。", poiAreas: ["故宫—景山片区", "天坛—前门片区", "怀柔远郊"], sourceName: "北京市文化和旅游局", sourceUrl: "https://whlyj.beijing.gov.cn/" },
  上海: { seasons: ["春季", "秋季"], stayAreas: ["人民广场", "静安", "徐家汇"], arrivalAccess: "虹桥枢纽与浦东机场均可通过轨道交通或正规出租车进入市区，末班时刻出发前核验。", poiAreas: ["外滩—人民广场片区", "衡复历史街区", "人民广场文博片区"], sourceName: "上海市文化和旅游局", sourceUrl: "https://whlyj.sh.gov.cn/" },
  杭州: { seasons: ["春季", "秋季"], stayAreas: ["湖滨", "武林广场", "运河沿线"], arrivalAccess: "杭州东站、杭州西站及萧山机场可通过地铁或正规出租车进入市区，具体运营时段出发前核验。", poiAreas: ["西湖沿线", "灵隐—北高峰片区", "运河—拱宸桥片区"], sourceName: "杭州市文化广电旅游局", sourceUrl: "https://wgly.hangzhou.gov.cn/cw/cn/index.html" },
  成都: { seasons: ["春季", "秋季"], stayAreas: ["天府广场", "春熙路", "宽窄巷子周边"], arrivalAccess: "天府机场、双流机场和成都各火车站可通过地铁或正规出租车进入市区，具体班次出发前核验。", poiAreas: ["熊猫基地片区", "青羊宫—草堂片区", "武侯祠—锦里片区"], sourceName: "成都市文化广电旅游局", sourceUrl: "https://wglj.chengdu.gov.cn/" },
  重庆: { seasons: ["春季", "秋季"], stayAreas: ["解放碑", "观音桥", "沙坪坝"], arrivalAccess: "江北机场与重庆主要火车站可通过轨道交通或正规出租车进入市区，山城步行需预留坡道体力。", poiAreas: ["解放碑—洪崖洞片区", "李子坝—鹅岭片区", "渝中老城片区"], sourceName: "重庆市文化和旅游发展委员会", sourceUrl: "https://whlyw.cq.gov.cn/" },
  西安: { seasons: ["春季", "秋季"], stayAreas: ["钟楼", "大雁塔", "永宁门"], arrivalAccess: "西安北站、咸阳机场可通过地铁或正规出租车进入市区，兵马俑属于临潼远郊线。", poiAreas: ["临潼远郊", "明城墙片区", "小寨—大雁塔片区"], sourceName: "西安市文化和旅游局", sourceUrl: "https://wlj.xa.gov.cn/" },
  桂林: { seasons: ["春季", "夏季", "秋季"], stayAreas: ["两江四湖", "桂林站周边", "阳朔西街外围"], arrivalAccess: "两江机场、桂林站及桂林北站可乘机场巴士、公交或正规出租车进入市区，桂林与阳朔宜分段住宿。", poiAreas: ["漓江沿线", "阳朔遇龙河片区", "龙胜远郊"], sourceName: "桂林市文化广电和旅游局", sourceUrl: "https://wglj.guilin.gov.cn/" },
  苏州: { seasons: ["春季", "秋季"], stayAreas: ["观前街", "平江路外围", "苏州站周边"], arrivalAccess: "苏州站、苏州北站可通过轨道交通或公交进入古城，园林片区高峰期优先步行。", poiAreas: ["东北街园林片区", "平江路片区", "虎丘远郊片区"], sourceName: "苏州市文化广电和旅游局", sourceUrl: "https://wglj.suzhou.gov.cn/" },
  广州: { seasons: ["秋季", "冬季"], stayAreas: ["公园前", "珠江新城", "老西关"], arrivalAccess: "白云机场、广州南站和广州东站可通过地铁或正规出租车进入市区，末班时刻出发前核验。", poiAreas: ["西关—陈家祠片区", "越秀老城片区", "珠江新城—海心沙片区"], sourceName: "广州市文化广电旅游局", sourceUrl: "https://wglj.gz.gov.cn/" },
  大理: { seasons: ["春季", "秋季"], stayAreas: ["大理古城", "才村", "下关"], arrivalAccess: "大理站与大理机场可通过公交、机场巴士或正规出租车前往下关及古城，环洱海不建议一天赶完。", poiAreas: ["洱海生态廊道", "喜洲片区", "苍山片区"], sourceName: "大理白族自治州人民政府", sourceUrl: "https://www.dali.gov.cn/" },
  泉州: { seasons: ["春季", "秋季"], stayAreas: ["西街", "府文庙周边", "浦西"], arrivalAccess: "泉州站和晋江机场可通过公交或正规出租车进入古城，古城核心适合步行。", poiAreas: ["西街—开元寺片区", "古城街巷片区", "洛江外围"], sourceName: "泉州市人民政府·泉州旅游", sourceUrl: "https://quanzhou.gov.cn/lyb/" },
  拉萨: { seasons: ["夏季", "秋季"], stayAreas: ["八廓街外围", "布达拉宫周边", "柳梧新区"], arrivalAccess: "拉萨站与贡嘎机场有机场巴士、公交或正规出租车衔接；首日应低强度适应海拔。", poiAreas: ["布达拉宫片区", "八廓街片区", "北郊寺院片区"], sourceName: "拉萨市人民政府", sourceUrl: "https://www.lasa.gov.cn/" },
  青岛: { seasons: ["春季", "夏季", "秋季"], stayAreas: ["老城", "五四广场", "台东"], arrivalAccess: "胶东机场与青岛主要火车站可通过地铁或正规出租车进入市区，崂山宜独立安排。", poiAreas: ["老城海滨片区", "八大关片区", "崂山远郊"], sourceName: "青岛市文化和旅游局", sourceUrl: "https://whly.qingdao.gov.cn/" },
  南京: { seasons: ["春季", "秋季"], stayAreas: ["新街口", "夫子庙外围", "鼓楼"], arrivalAccess: "南京南站、南京站和禄口机场可通过地铁或正规出租车进入市区。", poiAreas: ["钟山风景区", "中山东路文博片区", "明城墙片区"], sourceName: "南京市文化和旅游局", sourceUrl: "https://wlj.nanjing.gov.cn/" },
  天津: { seasons: ["春季", "秋季"], stayAreas: ["和平区", "海河沿线", "天津站周边"], arrivalAccess: "天津站、天津西站及滨海机场可通过地铁或正规出租车进入市区。", poiAreas: ["五大道片区", "海河沿线", "古文化街片区"], sourceName: "天津市文化和旅游局", sourceUrl: "https://whly.tj.gov.cn/" },
  大同: { seasons: ["夏季", "秋季"], stayAreas: ["大同古城", "大同站周边"], arrivalAccess: "大同南站与云冈机场可通过公交或正规出租车进入市区，云冈石窟为城西单独线路。", poiAreas: ["云冈远郊", "古城片区", "古城墙片区"], sourceName: "大同市人民政府", sourceUrl: "https://www.dt.gov.cn/" },
  沈阳: { seasons: ["春季", "秋季"], stayAreas: ["中街", "青年大街", "沈阳站周边"], arrivalAccess: "桃仙机场、沈阳站和沈阳北站可通过地铁或正规出租车进入市区。", poiAreas: ["中街—故宫片区", "帅府片区", "铁西工业片区"], sourceName: "辽宁省人民政府·省情概况", sourceUrl: "https://www.ln.gov.cn/web/sqgk/" },
  大连: { seasons: ["夏季", "秋季"], stayAreas: ["中山广场", "星海广场", "青泥洼桥"], arrivalAccess: "周水子机场和大连北站可通过地铁或正规出租车进入市区，滨海路宜分段游览。", poiAreas: ["星海湾片区", "滨海路片区", "中山广场片区"], sourceName: "辽宁省人民政府·省情概况", sourceUrl: "https://www.ln.gov.cn/web/sqgk/" },
  哈尔滨: { seasons: ["夏季", "冬季"], stayAreas: ["中央大街", "博物馆广场", "哈尔滨站周边"], arrivalAccess: "太平机场、哈尔滨站和哈尔滨西站可通过机场巴士、地铁或正规出租车进入市区。", poiAreas: ["索菲亚—中央大街片区", "中央大街片区", "松北冰雪片区"], sourceName: "黑龙江省文化和旅游厅", sourceUrl: "https://wlt.hlj.gov.cn/" },
  厦门: { seasons: ["春季", "秋季", "冬季"], stayAreas: ["中山路", "思明南路", "曾厝垵外围"], arrivalAccess: "高崎机场与厦门站可通过公交、地铁或正规出租车进入市区；鼓浪屿船票及码头出发前核验。", poiAreas: ["鼓浪屿片区", "环岛路片区", "沙坡尾片区"], sourceName: "厦门市文化和旅游局", sourceUrl: "https://wlj.xm.gov.cn/" },
  武汉: { seasons: ["春季", "秋季"], stayAreas: ["江汉路", "中南路", "楚河汉街"], arrivalAccess: "天河机场、武汉站、汉口站和武昌站均可通过地铁或正规出租车进入市区。", poiAreas: ["东湖—省博片区", "东湖片区", "黄鹤楼—昙华林片区"], sourceName: "武汉市文化和旅游局", sourceUrl: "https://wlj.wuhan.gov.cn/" },
  长沙: { seasons: ["春季", "秋季"], stayAreas: ["五一广场", "岳麓山外围", "长沙南站周边"], arrivalAccess: "黄花机场、长沙南站和长沙站可通过地铁或正规出租车进入市区。", poiAreas: ["省博片区", "岳麓山片区", "橘子洲片区"], sourceName: "湖南省文化和旅游厅", sourceUrl: "https://whhlyt.hunan.gov.cn/" },
  洛阳: { seasons: ["春季", "秋季"], stayAreas: ["洛邑古城外围", "应天门", "洛阳龙门站周边"], arrivalAccess: "洛阳龙门站与北郊机场可通过公交或正规出租车进入市区，龙门与白马寺分线安排。", poiAreas: ["龙门远郊", "隋唐洛阳城片区", "白马寺东线"], sourceName: "洛阳市文化广电和旅游局", sourceUrl: "https://wglj.ly.gov.cn/" },
  张家界: { seasons: ["春季", "秋季"], stayAreas: ["武陵源", "永定城区", "张家界西站周边"], arrivalAccess: "张家界西站与荷花机场可通过公交或正规出租车前往市区及武陵源，景区之间不宜硬塞同日。", poiAreas: ["武陵源核心景区", "天门山片区", "金鞭溪片区"], sourceName: "湖南省文化和旅游厅", sourceUrl: "https://whhlyt.hunan.gov.cn/" },
  深圳: { seasons: ["秋季", "冬季"], stayAreas: ["福田中心区", "南山", "罗湖"], arrivalAccess: "宝安机场与深圳各火车站可通过地铁或正规出租车进入市区，大鹏半岛单列一日。", poiAreas: ["深圳湾片区", "大鹏远郊", "福田中心片区"], sourceName: "深圳市文化广电旅游体育局", sourceUrl: "https://wtl.sz.gov.cn/" },
  三亚: { seasons: ["秋季", "冬季", "春季"], stayAreas: ["三亚湾", "大东海", "亚龙湾"], arrivalAccess: "凤凰机场与三亚站可通过公交或正规出租车前往各海湾，海湾间距离较远宜按住宿区分日。", poiAreas: ["亚龙湾片区", "海棠湾片区", "天涯海角片区"], sourceName: "三亚市旅游和文化广电体育局", sourceUrl: "https://lwj.sanya.gov.cn/" },
  昆明: { seasons: ["全年适合", "冬季"], stayAreas: ["翠湖", "东风广场", "昆明南站周边"], arrivalAccess: "长水机场、昆明站和昆明南站可通过地铁或正规出租车进入市区。", poiAreas: ["滇池—海埂片区", "官渡文博片区", "翠湖片区"], sourceName: "云南省文化和旅游厅", sourceUrl: "https://dct.yn.gov.cn/" },
  丽江: { seasons: ["春季", "秋季"], stayAreas: ["丽江古城外围", "束河", "白沙"], arrivalAccess: "三义机场和丽江站可通过机场巴士、公交或正规出租车进入城区；雪山行程需关注天气和海拔。", poiAreas: ["玉龙雪山远郊", "丽江古城片区", "白沙—束河片区"], sourceName: "丽江市人民政府", sourceUrl: "https://www.lijiang.gov.cn/" },
  兰州: { seasons: ["夏季", "秋季"], stayAreas: ["张掖路", "东方红广场", "兰州西站周边"], arrivalAccess: "中川机场、兰州站和兰州西站可通过城际铁路、地铁或正规出租车进入市区。", poiAreas: ["黄河中山桥片区", "七里河文博片区", "白塔山片区"], sourceName: "甘肃省文化和旅游厅·兰州主题线路", sourceUrl: "https://www.gswbj.gov.cn/a/2026/04/27/28103.html" },
  敦煌: { seasons: ["春季", "秋季"], stayAreas: ["敦煌市区", "鸣沙山外围"], arrivalAccess: "敦煌机场与敦煌站可通过接驳车或正规出租车进入市区，西线景点分散需避免疲劳驾驶。", poiAreas: ["莫高窟东线", "鸣沙山片区", "敦煌西线"], sourceName: "丝绸之路（敦煌）国际文化博览会", sourceUrl: "https://www.gswbj.gov.cn/" },
  乌鲁木齐: { seasons: ["夏季", "秋季", "冬季"], stayAreas: ["红山", "友好商圈", "乌鲁木齐站周边"], arrivalAccess: "地窝堡机场与乌鲁木齐站可通过地铁、公交或正规出租车进入市区，天池为远郊一日线。", poiAreas: ["友好路文博片区", "红山片区", "天池远郊"], sourceName: "新疆维吾尔自治区文化和旅游厅", sourceUrl: "https://wlt.xinjiang.gov.cn/" },
  宁波: { seasons: ["春季", "秋季"], stayAreas: ["天一广场", "月湖", "宁波站周边"], arrivalAccess: "栎社机场、宁波站可通过地铁或正规出租车进入市区，远郊古镇另留半天。", poiAreas: ["天一阁—月湖片区", "鄞州文博片区", "老外滩片区"], sourceName: "宁波博物院", sourceUrl: "https://www.nbmuseum.cn/" },
  绍兴: { seasons: ["春季", "秋季"], stayAreas: ["鲁迅故里外围", "仓桥直街", "绍兴北站周边"], arrivalAccess: "绍兴北站可通过地铁、公交或正规出租车进入古城，古城核心适合步行。", poiAreas: ["鲁迅故里片区", "沈园—仓桥片区", "东湖外围"], sourceName: "绍兴市文化广电旅游局·城市概况", sourceUrl: "https://sxwg.sx.gov.cn/col/col1229534573/index.html" },
  福州: { seasons: ["春季", "秋季", "冬季"], stayAreas: ["东街口", "三坊七巷外围", "烟台山"], arrivalAccess: "长乐机场、福州站与福州南站可通过地铁、机场巴士或正规出租车进入市区。", poiAreas: ["三坊七巷片区", "烟台山片区", "西湖—省博片区"], sourceName: "福州市文化和旅游局", sourceUrl: "https://wlj.fuzhou.gov.cn/" },
  济南: { seasons: ["春季", "秋季"], stayAreas: ["泉城广场", "大明湖", "济南站周边"], arrivalAccess: "遥墙机场与济南主要火车站可通过机场巴士、地铁或正规出租车进入市区。", poiAreas: ["趵突泉—泉城广场片区", "大明湖—曲水亭街片区", "东部文博片区"], sourceName: "济南市文化和旅游局", sourceUrl: "https://jnwl.jinan.gov.cn/" },
  贵阳: { seasons: ["夏季", "秋季"], stayAreas: ["喷水池", "南明河", "观山湖"], arrivalAccess: "龙洞堡机场、贵阳北站和贵阳东站可通过地铁或正规出租车进入市区，青岩古镇单列半天。", poiAreas: ["南明河—甲秀楼片区", "观山湖文博片区", "青岩远郊"], sourceName: "贵阳市文化和旅游局", sourceUrl: "https://english.guiyang.gov.cn/whj/" },
  香港: { seasons: ["秋季", "冬季"], stayAreas: ["尖沙咀", "中环", "湾仔"], arrivalAccess: "香港国际机场及各铁路口岸可通过机场快线、港铁、巴士或的士进入市区，证件与跨境政策出发前核验。", poiAreas: ["维港两岸", "太平山片区", "西九龙片区"], sourceName: "香港旅游事务署", sourceUrl: "https://www.tourism.gov.hk/sc/" },
  澳门: { seasons: ["秋季", "冬季"], stayAreas: ["澳门半岛", "氹仔旧城区", "路氹"], arrivalAccess: "各口岸可通过公共巴士或的士进入城区，跨境证件及口岸时段出发前核验。", poiAreas: ["历史城区", "大炮台片区", "路环片区"], sourceName: "澳门特别行政区政府旅游局", sourceUrl: "https://www.macaotourism.gov.mo/zh-hans/sightseeing/" },
  台北: { seasons: ["春季", "秋季", "冬季"], stayAreas: ["台北车站", "中山", "信义"], arrivalAccess: "桃园机场、松山机场与台北车站可通过机场捷运、捷运、巴士或计程车衔接，跨境政策出发前核验。", poiAreas: ["士林文博片区", "大稻埕—西门片区", "信义—象山片区"], sourceName: "台北旅游网", sourceUrl: "https://www.travel.taipei/zh-cn/attraction/all-regions" },
  高雄: { seasons: ["秋季", "冬季", "春季"], stayAreas: ["美丽岛", "盐埕", "左营"], arrivalAccess: "高雄机场与左营站可通过捷运、巴士或计程车进入市区，跨境政策出发前核验。", poiAreas: ["驳二—盐埕片区", "旗津片区", "莲池潭片区"], sourceName: "高雄旅游网", sourceUrl: "https://khh.travel/zh-tw/" },
  太原: { seasons: ["春季", "秋季"], stayAreas: ["迎泽大街", "府西街", "长风商务区"], arrivalAccess: "太原站、太原南站和武宿机场可通过地铁、公交或正规出租车进入市区。", poiAreas: ["晋源南线", "汾河文博区", "城关河岸"], sourceName: "太原市文化和旅游局", sourceUrl: "https://wlj.taiyuan.gov.cn/" },
  承德: { seasons: ["夏季", "秋季"], stayAreas: ["丽正门", "南营子大街"], arrivalAccess: "承德南站到避暑山庄老城需公交或正规出租车接驳。", poiAreas: ["避暑山庄", "狮子沟外八庙", "双桥老城"], sourceName: "承德市旅游和文化广电局", sourceUrl: "https://lywh.chengde.gov.cn/" },
  长春: { seasons: ["夏季", "冬季"], stayAreas: ["人民广场", "重庆路", "红旗街"], arrivalAccess: "长春站、长春西站和龙嘉机场可通过轨道交通或城际铁路衔接。", poiAreas: ["宽城历史区", "朝阳电影区", "净月文博区"], sourceName: "长春市文化广播电视和旅游局", sourceUrl: "https://wgxj.changchun.gov.cn/" },
  扬州: { seasons: ["春季", "秋季"], stayAreas: ["文昌阁", "东关街外围", "瘦西湖南门"], arrivalAccess: "扬州东站到古城可通过公交或正规出租车接驳。", poiAreas: ["瘦西湖", "东关古城", "运河三湾"], sourceName: "扬州市文化广电和旅游局", sourceUrl: "https://wglj.yangzhou.gov.cn/" },
  无锡: { seasons: ["春季", "秋季"], stayAreas: ["三阳广场", "南长街外围"], arrivalAccess: "无锡站和无锡东站可通过地铁进入中心城区。", poiAreas: ["太湖鼋头渚", "惠山古镇", "古运河"], sourceName: "无锡市文化广电和旅游局", sourceUrl: "https://wgl.wuxi.gov.cn/" },
  黄山: { seasons: ["春季", "秋季"], stayAreas: ["汤口", "屯溪", "宏村"], arrivalAccess: "黄山北站前往屯溪、汤口和黟县方向不同，需按住宿选择接驳。", poiAreas: ["黄山风景区", "黟县古村", "屯溪徽州"], sourceName: "黄山市文化和旅游局", sourceUrl: "https://wlj.huangshan.gov.cn/" },
  开封: { seasons: ["春季", "秋季"], stayAreas: ["鼓楼", "龙亭外围"], arrivalAccess: "开封北站到老城可通过公交或正规出租车接驳。", poiAreas: ["新区文博区", "龙亭湖", "老城中轴"], sourceName: "开封市文化广电和旅游局", sourceUrl: "https://wgl.kaifeng.gov.cn/" },
  景德镇: { seasons: ["春季", "秋季"], stayAreas: ["人民广场", "御窑厂外围", "陶溪川"], arrivalAccess: "景德镇北站和罗家机场可通过公交或正规出租车进入城区。", poiAreas: ["珠山御窑区", "昌南文博区", "陶溪川工业区"], sourceName: "景德镇市文化广电旅游局", sourceUrl: "https://wgxj.jdz.gov.cn/" },
  珠海: { seasons: ["秋季", "冬季", "春季"], stayAreas: ["香洲", "吉大", "拱北"], arrivalAccess: "珠海站靠拱北，珠海机场到香洲需机场巴士或正规出租车。", poiAreas: ["情侣路", "唐家湾", "海岛线"], sourceName: "珠海市文化广电旅游体育局", sourceUrl: "https://wgltj.zhuhai.gov.cn/" },
  南宁: { seasons: ["秋季", "冬季"], stayAreas: ["朝阳广场", "民族广场"], arrivalAccess: "南宁东站与吴圩机场可通过地铁、机场巴士或正规出租车进入市区。", poiAreas: ["青秀山文博区", "兴宁老城", "邕江沿岸"], sourceName: "南宁市文化广电和旅游局", sourceUrl: "https://wgl.nanning.gov.cn/" },
};

function foodBudget(profile: CityProfile, index: number) {
  const mainland = profile.region !== "港澳台";
  if (!mainland) return index === 0 ? "当地币 45–100 / 人" : "当地币 70–180 / 人";
  return index === 0 ? "¥15–35 / 人" : index === 1 ? "¥45–100 / 人" : "¥25–70 / 人";
}

export function getCityKnowledge(profile: CityProfile): CityKnowledge {
  const config = CONFIG[profile.city];
  if (!config) throw new Error(`缺少 ${profile.city} 的预置城市资料配置`);
  const sourceId = `official-${profile.city}`;
  return {
    city: profile.city,
    province: profile.province,
    region: profile.region,
    coverImage: profile.image,
    recommendedDays: profile.idealDays,
    recommendedSeasons: config.seasons,
    pois: profile.sights.map((name, index) => ({
      name,
      area: config.poiAreas[index] ?? config.poiAreas[0],
      suggestedDuration: index === 0 ? "建议预留半天" : "建议游览 1.5–3 小时",
      ticketReference: VERIFY_BEFORE_DEPARTURE,
      openingHours: VERIFY_BEFORE_DEPARTURE,
      reservation: VERIFY_BEFORE_DEPARTURE,
      sourceIds: [sourceId],
    })),
    foods: profile.foods.map((name, index) => ({
      name,
      meal: index === 0 ? "早餐或午餐" : index === 1 ? "午餐或晚餐" : "晚餐或加餐",
      budget: foodBudget(profile, index),
    })),
    stayAreas: config.stayAreas,
    localTransport: profile.transit,
    arrivalAccess: config.arrivalAccess,
    dailyBudget: profile.dailyBudget,
    dataStatus: "预置基础资料",
    queriedAt: CITY_DATA_QUERY_DATE,
    sources: [{
      id: sourceId,
      name: config.sourceName,
      url: config.sourceUrl,
      category: "城市概况与文旅资源",
      official: true,
      confidence: "高",
      queriedAt: `${CITY_DATA_QUERY_DATE}T00:00:00+08:00`,
      validUntil: "动态信息仅供建库，门票、开放、预约及临时通知须在生成时或出发前刷新",
    }],
  };
}

export function assertCityKnowledgeCoverage(profiles: CityProfile[]) {
  const missing = profiles.filter((profile) => !CONFIG[profile.city]).map((profile) => profile.city);
  if (missing.length) throw new Error(`城市预置资料缺失：${missing.join("、")}`);
  return profiles.length;
}
