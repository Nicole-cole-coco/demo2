# 旅策｜中国城市旅行攻略生成网站

“旅策”可在普通浏览器匿名访问，不依赖 ChatGPT、DeepSeek 或其他模型平台账号。AI、联网搜索和地图能力均由本站服务端调用；浏览器与构建产物不包含 API Key。

## 已实现

- 35 座中国境内代表城市，覆盖华北、东北、华东、华中、华南、西南、西北及港澳台；支持中文、拼音、简称与常见古称搜索。
- 每座城市有独立地域图片、3 项代表景点、3 项美食、建议天数、预算带与交通策略。
- 攻略包含推荐理由、景点价值、游览时间、门票/开放/预约状态、美食餐次、住宿预算、交通策略、逐日 3–5 个节点与来源卡片。
- 未配置密钥时按所选城市生成基础版，所有动态字段标记“待核验”；不会回退成杭州或其他城市。
- DeepSeek、Web Search 与高德地图均为服务端适配器；搜索缓存 24 小时，单次默认最多 4 次搜索、12 段路线。
- 匿名会话可把表单和最近攻略保存在当前浏览器；接口带同源校验、请求大小限制与基础频率限制。
- 票价仅区分“官方公开价 / 公开参考价 / 待核验”，不宣称余票、库存、实时可购或最终成交价。

## 同源 API

- `POST /api/ai/generate`：生成完整攻略；未配置 AI 时返回透明标记的城市基础版。
- `GET /api/ai/status`：DeepSeek 配置状态，不返回密钥。
- `POST /api/search/travel`：检索门票、开放、交通、美食和季节资料。
- `GET /api/data/status`：搜索、地图、缓存与调用上限状态。
- `POST /api/map/poi`：城市内 POI 坐标匹配。
- `POST /api/map/route`：公交、步行或驾车路线参考。
- `POST /api/ticket/estimate`：公开网页票价估算及冲突提示。

## 本地运行

要求 Node.js `>=22.13.0`。

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.local` 已被 Git 忽略。没有任何密钥也可以浏览和生成基础版。

## 环境变量

在本地填写项目根目录的 `.env.local`；在公开站点填写托管项目的 **Settings → Environment Variables / Secrets**。不要把密钥发送到聊天，不要写入前端变量、`.openai/hosting.json` 或仓库。

```dotenv
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=45000

WEB_SEARCH_PROVIDER=bocha
WEB_SEARCH_API_KEY=
AMAP_WEB_SERVICE_KEY=

WEB_SEARCH_MAX_QUERIES=4
AMAP_MAX_ROUTE_LEGS=12
REQUEST_LIMIT_WINDOW_MS=900000
REQUEST_LIMIT_MAX=10
```

变量用途：

- `DEEPSEEK_API_KEY`：DeepSeek 开放平台创建的服务端 Key。
- `WEB_SEARCH_API_KEY`：当前 Bocha 搜索适配器的 Key；旧部署中的 `BOCHA_API_KEY` 仍兼容。
- `AMAP_WEB_SERVICE_KEY`：高德开放平台创建的 **Web 服务** Key，不是 JS API Key。
- 其余变量控制模型、超时、免费配额和匿名频率限制。

当前 DeepSeek 使用官方 `chat/completions` 与 JSON Output；高德使用 Web Service POI 搜索和路径规划 2.0。业务层只依赖适配器接口，后续可以替换供应商。

## 数据与安全边界

- 模型只理解偏好、筛选城市内容和组织方案；坐标、距离、耗时、票价、开放时间、预约和临时公告必须来自结构化 API 或可追溯网页来源。
- 搜索来源记录类别、站点、原文入口、查询时间、官方属性、可信度和价格口径；原始 URL 只藏在整洁的“核验原文”按钮中。
- 高德未配置时显示“路线 API 待接入”，不生成虚假距离或实时路线。
- 12306 是铁路班次与票价的最终核验渠道；本站不支付、不售票、不保证库存。
- 港澳台已纳入独立区域，预算保留当地币种，并提示证件、支付和交通政策需出发前核验。

## 图片资产

- 图片位于 `public/cities/`，均有固定宽高容器、响应式加载、非首屏懒加载和城市文字占位背景。
- 新增 21 座城市的作者、来源页、许可、尺寸和获取时间保存在 `public/cities/attribution.json`，页面不堆放授权网址。
- 素材维护规则见 `docs/IMAGE_SOURCES.md`；历史 14 张素材的来源页仍需按清单补录，未补录前不得对外宣称为“官方图片”。

## 检查

```powershell
npm run lint
npx tsc --noEmit
npm test
```

`npm test` 会重新构建站点，并验证匿名首页、30+ 城市、无密钥动态基础版、境外目的地拦截、新 API 降级响应和密钥不出现在客户端响应中。

公开发布必须在本地检查完成后另行确认；本仓库不会因构建或测试自动部署。
