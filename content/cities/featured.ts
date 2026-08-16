import { EDITORIAL_CITY_GUIDES } from "@/lib/editorial-city-guides";
import { compactSeed } from "./compact-seed";
import { createCompleteCityGuide } from "./factory";
import type { CompleteCityGuide } from "./types";

const seeds = [
  compactSeed({ city: "杭州", days: 4, intro: "杭州四日最顺的做法，是把西湖北线、灵隐山线、运河与南宋老城拆开。不要急着环完整个西湖，每天只解决一个片区，餐厅也跟着路线走。", fit: "适合湖山、人文、茶园与杭帮菜；西湖分段而不是环湖。", stay: "住凤起路—龙翔桥，四天不换酒店。", experiences: [["北山街—白堤—孤山","西湖北线","湖岸、近代建筑与孤山文脉连成最完整的西湖开场。","雨天改浙江省博物馆"],["湖滨—南山路","西湖南线","傍晚适合看城市与湖岸衔接。","改中国美术学院美术馆"],["灵隐飞来峰","西湖西侧","造像、寺院和山林值得半天。","客流大改茶叶博物馆"],["梅家坞—龙井村","梅灵山线","茶园与村落适合灵隐后半段。","雨天取消"],["小河直街—拱宸桥","运河","临水街巷与工业遗存展示杭州日常。","改运河博物馆"],["德寿宫—南宋御街","上城老城","遗址、御街和杭州面能组成返程日。","约不到改胡雪岩故居"]], foods: ["东坡肉","西湖醋鱼","宋嫂鱼羹","定胜糕","吴山酥油饼"], museums: ["浙江省博物馆", "中国茶叶博物馆", "南宋德寿宫遗址博物馆"], nature: ["西湖", "九溪", "西溪湿地"], restaurants: [["楼外楼","杭州中华老字号","东坡肉","龙井虾仁","孤山"],["知味观·味庄","杭帮菜地方品牌","杭帮点心","西湖莼菜汤","杨公堤"],["奎元馆","杭州面馆老字号","虾爆鳝面","片儿川","解放路"],["山外山菜馆","杭州传统菜馆","叫花鸡","鱼头豆腐","植物园"]], districts: ["湖滨—吴山","运河—桥西"], neighborhoods: ["北山街","小河直街","南宋御街支巷"], rain: ["浙江省博物馆与孤山短线。","中国茶叶博物馆加龙井村短段。","德寿宫与中国美院美术馆。"], night: ["湖滨只走一小段夜景","运河拱宸桥傍晚收尾"], arrival: ["杭州东站进湖滨方便，杭州西站方向不同。","萧山机场可地铁进城。"], mistakes: ["第一天急着环西湖。","灵隐后再跨到运河。"], skips: [["河坊街主街长时间逛店","商业重复。","走南宋御街支巷"],["法喜寺等多寺连刷","体验疲劳。","灵隐寺或永福寺二选一"]] }),
  compactSeed({ city: "成都", days: 4, intro: "成都四日不能只剩吃。熊猫基地要早，少城和青羊人文分开，武侯南城另一天；火锅、川菜与小吃轮换，宽窄巷子只是一段。", fit: "适合熊猫、博物馆、茶馆、街区与川菜；每天留一段坐下来的时间。", stay: "住天府广场—骡马市，去各片区都较均衡。", experiences: [["成都大熊猫繁育研究基地","成华北部","早到才能看到更活跃的熊猫，需完整半天。","约不到改成都自然博物馆"],["东郊记忆","成华","工业建筑与文化空间适合返城后低强度停留。","改望平街"],["成都博物馆","天府广场","城市史与皮影展适合雨天半日。","改四川博物院"],["人民公园—少城","少城","茶馆、鹤鸣与街巷构成成都日常。","宽窄主街不久留"],["杜甫草堂—浣花溪","青羊","诗歌、园林与城市河岸连续。","改四川博物院"],["武侯祠—玉林","成都南部","三国历史与南城餐饮可分午后到晚间。","锦里主街不久留"]], foods: ["钟水饺","麻婆豆腐","甜水面","夫妻肺片","蛋烘糕"], museums: ["成都博物馆", "四川博物院", "金沙遗址博物馆"], nature: ["青城山", "浣花溪", "龙泉山"], restaurants: [["陈麻婆豆腐","川菜老字号","麻婆豆腐","回锅肉","骡马市"],["盘飧市","成都老字号","卤味","锅魁","华兴街"],["钟水饺","成都小吃老字号","钟水饺","甜水面","提督街"],["荣乐园","川菜历史品牌","开水白菜","宫保鸡丁","成都城区"]], districts: ["奎星楼—吉祥街","玉林—芳草街"], neighborhoods: ["泡桐树街","望平街","玉林支路"], rain: ["成都博物馆作为半天主体。","金沙遗址博物馆与同区川菜。","四川博物院加人民公园茶馆。"], night: ["望平街沿河晚餐后短走","玉林一顿川菜后结束"], arrival: ["天府机场进城时间较长，双流机场更近。","成都东站与南站方向不同。"], mistakes: ["熊猫基地下午才去。","连续两顿火锅和重辣。"], skips: [["宽窄巷子主街半天打卡","商业重复。","走泡桐树街与小通巷"],["两日行程硬加都江堰青城山","远郊挤压市区。","留给下一次"]] }),
  compactSeed({ city: "北京", days: 4, intro: "北京的首要原则是预约成功后再排路线。故宫、中轴南段、海淀皇家园林和长城各自成日；胡同只选一片，烤鸭放进顺路晚餐。", fit: "适合历史建筑、博物馆、亲子与城市步行；距离大、安检和预约影响明显。", stay: "住东四—灯市口或和平门地铁沿线，去中轴和主要火车站方便。", experiences: [["故宫博物院","中轴核心","宫殿、展览与中轴空间足以成为全天主体。","约不到改国家博物馆"],["景山—北海东岸","中轴北段","故宫后按体力选择俯瞰或园林。","累了直接取消"],["天坛","中轴南段","礼制建筑与古树适合上午。","改首都博物馆"],["前门—大栅栏支巷","中轴南段","商业史与老字号可接天坛，不走主街全程。","改杨梅竹斜街"],["颐和园","海淀","皇家园林需要半天，不与故宫同日。","雨天改国家典籍博物馆"],["八达岭或慕田峪长城","远郊","长城必须单独一日并看天气。","天气差留市区馆"]], foods: ["豆汁焦圈","门钉肉饼","卤煮火烧","爆肚","驴打滚"], museums: ["故宫博物院", "中国国家博物馆", "首都博物馆"], nature: ["颐和园", "香山", "长城"], restaurants: [["全聚德","北京烤鸭老字号","烤鸭","鸭架汤","前门"],["便宜坊","焖炉烤鸭老字号","焖炉烤鸭","芥末鸭掌","崇文门"],["东来顺","涮羊肉老字号","手切羊肉","烧饼","王府井"],["砂锅居","北京菜老字号","砂锅白肉","炸三白","西四"]], districts: ["牛街—白广路","隆福寺—东四"], neighborhoods: ["杨梅竹斜街","东四胡同","白塔寺片区"], rain: ["首都博物馆作为半天主体。","国家典籍博物馆与海淀室内线。","雨大取消长城与香山。"], night: ["景山或前门只选一处夜景","东四胡同晚餐后短走"], arrival: ["北京南站、北京西站、北京朝阳站方向不同。","首都机场和大兴机场进城时长差异大。"], mistakes: ["故宫、天坛、颐和园塞同一天。","没预约就去现场找代购。"], skips: [["南锣鼓巷主街长时间逛店","商业重复。","走东四或白塔寺胡同"],["长城返城后再排大型夜游","体力透支。","回城只吃晚餐"]] }),
];

function enrichFeatured(seed: ReturnType<typeof compactSeed>): CompleteCityGuide {
  const generated = createCompleteCityGuide(seed);
  const legacy = EDITORIAL_CITY_GUIDES.find((item) => item.city === seed.city);
  if (!legacy) return generated;
  const routes = generated.routes.map((route) => route.days === legacy.defaultDays ? {
    ...route,
    itinerary: legacy.days.map((legacyDay, dayIndex) => {
      const generatedDay = route.itinerary[dayIndex] ?? route.itinerary.at(-1)!;
      return {
        ...generatedDay,
        ...legacyDay,
        startTime: generatedDay.startTime,
        endTime: generatedDay.endTime,
        pace: generatedDay.pace,
        transportSummary: generatedDay.transportSummary,
        earlyStart: generatedDay.earlyStart,
        bookingItems: generatedDay.bookingItems,
        queueAlternative: generatedDay.queueAlternative,
        rainAlternative: generatedDay.rainAlternative,
        lateStartAdjustment: generatedDay.lateStartAdjustment,
        nodes: legacyDay.nodes.map((node, nodeIndex) => ({
          ...generatedDay.nodes[nodeIndex % generatedDay.nodes.length],
          ...node,
          duration: generatedDay.nodes[nodeIndex % generatedDay.nodes.length]?.duration ?? node.meta,
          transportMode: generatedDay.nodes[nodeIndex % generatedDay.nodes.length]?.transportMode,
          transportTime: generatedDay.nodes[nodeIndex % generatedDay.nodes.length]?.transportTime,
          booking: generatedDay.nodes[nodeIndex % generatedDay.nodes.length]?.booking,
          crowd: node.pitfall ?? generatedDay.nodes[nodeIndex % generatedDay.nodes.length]?.crowd,
          imageSubject: node.title.replace(/午餐|晚餐|夜间散步/g, "").trim(),
        })),
      };
    }),
  } : route);
  const foodNames = new Set<string>();
  const foods = [...legacy.foods, ...generated.foods].filter((item) => !foodNames.has(item.name) && foodNames.add(item.name)).slice(0, 8);
  const restaurantNames = new Set<string>();
  const restaurants = [...legacy.restaurants, ...generated.restaurants].filter((item) => !restaurantNames.has(item.name) && restaurantNames.add(item.name)).slice(0, 4);
  return {
    ...generated,
    ...legacy,
    recommendedSeasons: generated.recommendedSeasons,
    travelTags: generated.travelTags,
    images: generated.images,
    experiences: generated.experiences,
    foods,
    restaurants,
    foodDistricts: generated.foodDistricts,
    neighborhoods: generated.neighborhoods,
    rainyPlans: generated.rainyPlans,
    nightIdeas: generated.nightIdeas,
    arrivalTips: generated.arrivalTips,
    firstTimerMistakes: generated.firstTimerMistakes,
    routes,
    preferenceContent: generated.preferenceContent,
    preferenceRoutes: generated.preferenceRoutes,
    sources: [...legacy.sources, ...generated.sources.filter((source) => !legacy.sources.some((legacySource) => legacySource.id === source.id))],
  };
}

export const FEATURED_GUIDES = seeds.map(enrichFeatured);
