module.exports = (app) => {
  const controllers = require("../controllers/api"); // change your controllers
  // add your private middleware
  require("../utils/createRouter")(app, "/api", [
    {
      path: "/",
      method: "get",
      render: controllers.index,
    },
    {
      path: "/contact",
      method: "get",
      render: controllers.contact,
    },
    {
      path: "/about",
      method: "get",
      render: controllers.about,
    },
    {
      path: "/csrf-token",
      method: "get",
      csrf: true,
      render: controllers.csrf,
    },
  ]);
};
