var express = require("express");
var usersRouter = express.Router();

/* GET home page. */
usersRouter.get("/", function (req, res, next) {
  const response = {
    firstName: "Tony",
    lastName: "Yu",
  };
  res.json(response);
});

module.exports = usersRouter;
