import assert from "node:assert/strict";
import test from "node:test";

async function getWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
};

test("renders the public China travel planner", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    env,
    ctx,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>旅策｜中国城市美食、景点、交通与预算一体规划<\/title>/);
  assert.match(html, /杭州/);
  assert.match(html, /只做中国城市/);
  assert.match(html, /把特色美食安排到正确的一餐/);
  assert.doesNotMatch(html, /京都|KYOTO/);
});

test("exposes a secret-safe AI status route", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/ai/status"),
    env,
    ctx,
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.provider, "deepseek");
  assert.equal(typeof payload.configured, "boolean");
  assert.equal(typeof payload.model, "string");
  assert.equal("apiKey" in payload, false);
});

test("validates the public generation request before calling DeepSeek", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/ai/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destination: "杭州", days: 40 }),
    }),
    env,
    ctx,
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "INVALID_REQUEST");
});
