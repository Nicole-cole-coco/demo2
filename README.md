# 旅策｜中国城市旅行攻略生成网站

“旅策”可在普通浏览器匿名访问，不依赖 ChatGPT、DeepSeek 或其他模型平台账号。第一版采用 **Codex 预置城市资料 + 运行时 Web Search + DeepSeek**：先从本地结构化资料读取稳定的城市事实，只联网刷新容易变化的信息，再由模型按片区组合少折返日程。

## 第一版能力

- 50 座中国境内代表城市，覆盖华北、东北、华东、华中、华南、西南、西北及港澳台；支持中文、拼音、简称与常见古称搜索。
- 每座城市包含独立地域图片、3 项代表景点及所属片区、3 项美食及餐次预算、建议天数与季节、住宿区域、进城方式、日预算和官方资料入口。
- 攻略包含推荐理由、景点价值、建议游览时长、门票/开放/预约状态、美食餐次、住宿与交通策略、逐日 3–5 个节点、当日片区、区域动线、预算与来源卡片。
- 未配置密钥时仍可按所选城市生成基础版；动态信息明确标为“出发前待核验”，不会回退成其他城市。
- 运行时最多搜索 4 次：门票与开放、预约与临时通知、城市交通、出发地到目的地的大交通；同一搜索缓存 24 小时，并设置每日调用上限。
- 第一版不接入地图算路 API，不展示未经证据支持的精确公里数、分钟数、公交编号或地铁站名；行程按片区分组，页面只提供外部地图核验入口。
- 第一版不接收费票务、库存、下单、支付或退改签。票价只区分“官方公开价 / 联网搜索参考价 / AI预算估算 / 出发前待核验”。
- 匿名会话可把表单和最近攻略保存在当前浏览器；接口带同源校验、请求大小限制与基础频率限制。

## 同源 API

- `POST /api/ai/generate`：生成完整攻略；未配置 AI 时返回透明标记的城市基础版。
- `GET /api/ai/status`：DeepSeek 配置状态，不返回密钥。
- `POST /api/search/travel`：按四类动态事实检索公开网页资料。
- `GET /api/data/status`：搜索、缓存、单次与每日调用上限状态。
- `POST /api/ticket/estimate`：公开网页票价参考及冲突提示，不代表实时可购。

地图和交易票务只在 `lib/provider-contracts.ts` 保留未来供应商接口，首版未启用，也没有公开算路接口。

## 本地运行

要求 Node.js `>=22.13.0`。

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local` 已被 Git 忽略。没有任何密钥也可以浏览和生成基础版。

## 环境变量

在本地填写项目根目录的 `.env.local`；在托管项目填写 **Settings → Environment Variables / Secrets**。不要把密钥发送到聊天，不要写入前端变量、`.openai/hosting.json` 或仓库。

```dotenv
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=45000

WEB_SEARCH_PROVIDER=bocha
WEB_SEARCH_API_KEY=
WEB_SEARCH_MAX_QUERIES=4
WEB_SEARCH_DAILY_LIMIT=200

REQUEST_LIMIT_WINDOW_MS=900000
REQUEST_LIMIT_MAX=10
```

- `DEEPSEEK_API_KEY`：DeepSeek 开放平台创建的服务端 Key。
- `WEB_SEARCH_API_KEY`：当前联网搜索适配器的服务端 Key；旧部署中的 `BOCHA_API_KEY` 仍兼容。
- 其余变量控制模型、超时、搜索缓存/配额和匿名频率限制。

当前 DeepSeek 使用官方 `POST /chat/completions` 与 JSON Output。业务层只依赖搜索适配器与模型调用边界，后续可替换供应商。

## 数据与安全边界

- 模型只理解偏好、筛选城市内容、组合片区、安排美食和预算取舍。
- 城市资料库记录资料查询日期；门票、开放、预约、临时闭馆、节假日政策与大交通价格必须由运行时搜索刷新。搜索失败时继续使用预置资料，但动态字段保持“出发前待核验”。
- 每条联网来源记录类别、站点、原文入口、查询时间、官方属性、可信度和价格口径；原始 URL 只藏在整洁的核验按钮中。
- 公开参考价，余票、优惠政策和最终支付金额请以官方页面为准。火车班次与票价最终前往铁路 12306 核验。
- 港澳台仍纳入独立区域，预算保留当地币种，并提示证件、支付和交通政策需出发前核验。

## 图片资产

- 图片位于 `public/cities/`，均有独立文件、固定宽高容器、响应式加载、非首屏懒加载和城市文字占位背景。
- 26 座城市的作者、来源页、许可、尺寸和获取时间保存在 `public/cities/attribution.json`，页面不堆放授权网址。
- 素材维护规则见 `docs/IMAGE_SOURCES.md`；历史 14 张素材的来源页仍需按清单补录，未补录前不得对外宣称为“官方图片”。

## 检查

```powershell
npm run lint
npx tsc --noEmit
npm test
```

自动化测试会重新构建站点，并验证匿名首页、50 城资料覆盖、无密钥城市基础版、片区动线、境外目的地拦截、搜索/票价降级、无地图算路公开接口和客户端无密钥。

公开发布必须在本地检查完成后另行确认；构建或测试不会自动部署。
