const API_ORIGIN = "https://out-of-office-game.replit.app";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const apiUrl = API_ORIGIN + url.pathname + url.search;
      const apiRequest = new Request(apiUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      });
      return fetch(apiRequest);
    }

    return env.ASSETS.fetch(request);
  },
};
