export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/product" || url.pathname === "/product.html") {
      return Response.redirect(new URL("/hardware.html", url), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
