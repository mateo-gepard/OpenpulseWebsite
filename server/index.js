export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // The multi-page site was archived on 2026-07-30 and replaced by a single
    // page. Old URLs 301 to the root so inbound links keep working.
    const retired = new Set([
      "/product", "/product.html",
      "/hardware", "/hardware.html",
      "/software", "/software.html",
      "/team", "/team.html",
      "/use-cases", "/use-cases.html",
      "/competitions", "/competitions.html",
    ]);

    if (retired.has(url.pathname)) {
      return Response.redirect(new URL("/", url), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
