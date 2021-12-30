const router = require("express").Router();
const csrf = require("csurf");

/**
 *
 * @param {*} app
 * @param {String} from
 * @param {[{ path:string, method:string, middleware:function|array, render:function }]} routes
 */
module.exports = (app, from, routes) => {
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const middlewares = route.middleware
      ? typeof route.middleware === "function"
        ? [route.middleware]
        : route.middleware
      : [];
    if (route.csrf) {
      middlewares.push(csrf({ cookie: true }));
    }
    if (route.method === "get") {
      router.get(route.path, ...middlewares, route.render);
    } else if (route.method === "post") {
      router.post(route.path, ...middlewares, route.render);
    } else if (route.method === "put") {
      router.put(route.path, ...middlewares, route.render);
    } else if (route.method === "delete") {
      router.delete(route.path, ...middlewares, route.render);
    } else if (route.method === "patch") {
      router.patch(route.path, ...middlewares, route.render);
    } else if (route.method === "options") {
      router.options(route.path, ...middlewares, route.render);
    }
  }

  app.use(from, router);
};
