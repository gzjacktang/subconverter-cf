import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "../src/request.js";

function mockEnvironment(accessKey = "test-secret") {
  const calls = [];
  return {
    calls,
    env: {
      ACCESS_KEY: accessKey,
      SUBCONVERTER: {
        getByName(name) {
          assert.equal(name, "main");
          return {
            fetch(request) {
              calls.push(request);
              return new Response("backend response");
            },
          };
        },
      },
    },
  };
}

test("blocks unauthenticated subscription requests", async () => {
  for (const key of ["", "wrong"]) {
    const { env, calls } = mockEnvironment();
    const response = await handleRequest(
      new Request(`https://example.com/sub?target=clash&key=${key}`),
      env,
    );
    assert.equal(response.status, 403);
    assert.equal(calls.length, 0);
  }
});

test("removes the access key before forwarding a subscription", async () => {
  const { env, calls } = mockEnvironment();
  const response = await handleRequest(
    new Request("https://example.com/sub?target=clash&url=https%3A%2F%2Fsource.example%2Fsub&key=test-secret"),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  const forwarded = new URL(calls[0].url);
  assert.equal(forwarded.searchParams.get("target"), "clash");
  assert.equal(forwarded.searchParams.get("url"), "https://source.example/sub");
  assert.equal(forwarded.searchParams.has("key"), false);
});

test("exposes only GET /version and GET /sub", async () => {
  const { env, calls } = mockEnvironment();
  assert.equal((await handleRequest(new Request("https://example.com/version"), env)).status, 200);
  assert.equal((await handleRequest(new Request("https://example.com/updateconf"), env)).status, 404);
  assert.equal((await handleRequest(new Request("https://example.com/sub", { method: "POST" }), env)).status, 405);
  assert.equal(calls.length, 1);
});
