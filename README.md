# 旅策｜中国城市旅行攻略生成网站

“旅策”是一个可在普通浏览器直接访问的旅行攻略网站。页面不依赖 ChatGPT 登录；AI 能力通过网站自己的服务端接口调用 DeepSeek，浏览器永远接触不到 API Key。

## 当前能力

- 公开网页：普通浏览器可直接浏览，未接入 AI 时自动展示杭州示例
- 中国城市限定：生成提示词只接受中国境内（含港澳台）城市
- 14 座城市灵感库：每座城市都有本地实景图、代表美食、特色景点、交通逻辑和预算带
- 完整方案结构：推荐理由、城市精华、必吃清单、交通策略、预算拆分和逐日路线
- DeepSeek 适配：`POST /api/ai/generate`
- 接入状态：`GET /api/ai/status`
- 联网检索：可选接入博查 Search API，覆盖门票与开放、特色美食、城市交通、预约和季节提示
- 路线核算：可选接入高德 Web 服务，自动计算每日相邻节点的距离、时长和可用费用信息
- 来源透明：结果页展示来源名称、资料类别、查询时间和原文核验按钮
- 成本保护：搜索缓存 24 小时，并限制单次搜索类别和路线段数
- 安全边界：密钥只读取服务端环境变量，不写进客户端或仓库
- 结构化输出：DeepSeek JSON 输出经服务端解析和结构检查后再返回页面

## 本地启动

要求 Node.js `>=22.13.0`。

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

未填写 DeepSeek Key 也能启动，此时页面会显示“演示模式”。

## 接入 DeepSeek

### 1. 创建 API Key

登录 DeepSeek 开放平台，在 API Keys 页面创建密钥。不要把密钥发到聊天、写进前端代码或提交到 Git。

### 2. 填写本地环境变量

复制 `.env.example` 为 `.env.local`，只替换第一项：

```dotenv
DEEPSEEK_API_KEY=你的真实密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=45000
```

保存后重启开发服务。页面右侧状态会从“演示模式”变为“DeepSeek 已连接”。

### 4. 接入联网搜索和路线（可选）

如果希望生成时核验公开资料，再配置两个服务端 Secret：

```dotenv
BOCHA_API_KEY=你的博查搜索密钥
AMAP_WEB_SERVICE_KEY=你的高德Web服务密钥
WEB_SEARCH_MAX_QUERIES=4
AMAP_MAX_ROUTE_LEGS=12
```

网站会在一次生成中最多检索四类资料，并最多计算十二段相邻路线。相同搜索和地点匹配会缓存 24 小时，优先使用服务商免费配额。若不配置其中某项，页面会明确显示“待接入”，不会把 AI 知识冒充成实时结果。

联网搜索得到的是公开参考价，不代表余票、库存或最终支付价格。景点、酒店和机票的实时可购价格仍需单独申请官方或票务合作接口。

### 3. 在正式网站配置密钥

在网站托管平台的项目设置中新增服务端 Secret：

- 名称：`DEEPSEEK_API_KEY`
- 值：你的真实 DeepSeek Key

可选再添加 `DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL` 和 `DEEPSEEK_TIMEOUT_MS`。保存后重新部署。不要把 `.env.local` 上传到服务器，也不要把 Key 写入 `.openai/hosting.json`。

## API 使用方式

网页调用本站同源接口：

```http
POST /api/ai/generate
Content-Type: application/json
```

请求示例：

```json
{
  "originCity": "上海",
  "destination": "泉州",
  "startDate": "2026-10-23",
  "days": 4,
  "pace": "舒展",
  "budget": "适中",
  "transport": "公共交通优先",
  "interests": ["地道美食", "历史古迹", "街区漫游"],
  "constraints": "每天午后留一小时休息"
}
```

成功响应：

```json
{
  "provider": "deepseek",
  "plan": {
    "title": "泉州，海丝旧城的四日",
    "subtitle": "10.23 — 10.26 · 两人同行 · 舒展节奏",
    "destination": "泉州",
    "heroSummary": "围绕海丝古城与闽南味道组织路线",
    "estimatedDailyBudget": "¥420–650 / 人",
    "estimatedTotalBudget": "¥1,680–2,600 / 人",
    "transportSummary": "古城步行与公交为主",
    "verificationNote": "开放、预约和交通信息请在出发前复核",
    "highlights": [],
    "foods": [],
    "transportPlan": [],
    "budgetBreakdown": [],
    "days": []
  }
}
```

状态接口：

```http
GET /api/ai/status
```

它只返回是否已配置、服务商和模型名，不会返回 API Key。

外部数据状态接口：

```http
GET /api/data/status
```

它只返回搜索和地图是否已配置，不会返回任何密钥。

## 代码位置

- `app/api/ai/generate/route.ts`：网站对外的 AI 生成接口
- `app/api/ai/status/route.ts`：配置状态接口
- `lib/deepseek.ts`：DeepSeek 调用、提示词、超时和 JSON 校验
- `lib/travel-data.ts`：联网搜索、高德路线、缓存和调用数量限制
- `app/api/data/status/route.ts`：搜索与地图配置状态
- `.env.example`：环境变量模板
- `app/page.tsx`：页面表单和结果展示

## 上线前安全建议

公开网站的服务端接口会消耗你的 DeepSeek 额度。正式推广前建议在托管层增加限流、异常用量告警和人机验证；同时限制单次天数、输入长度与输出长度。当前代码已经做了基础参数限制、45 秒超时和 6000 token 上限，但托管层限流仍然必要。

## 验证

```bash
npm run build
```

构建成功后再部署。DeepSeek 官方接口为 `POST https://api.deepseek.com/chat/completions`，通过 Bearer Token 鉴权，并使用 JSON Output 模式返回结构化攻略。

## 城市图片

页面中的城市照片已保存为 `public/cities/` 下的本地资源，浏览页面时不会跳转到图片来源网站。素材来自 Unsplash 免费许可图片，分别对应杭州、北京、上海、成都、重庆、西安、桂林、苏州、广州、大理、泉州、拉萨、青岛和南京；原始页面与作者信息保留在项目提交记录和制作过程记录中。
