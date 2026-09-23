export function handleRequest(request, env) {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (url.pathname !== "/sub" && url.pathname !== "/version") {
    return new Response("Not found", { status: 404 });
  }

  if (url.pathname === "/sub") {
    const key = url.searchParams.get("key");
    if (!env.ACCESS_KEY || !key || key !== env.ACCESS_KEY) {
      return new Response("Forbidden", { status: 403 });
    }
    url.searchParams.delete("key");
    request = new Request(url, request);
  }

  return env.SUBCONVERTER.getByName("main").fetch(request);
}
