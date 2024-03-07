var express = require("express");
var apiRouter = express.Router();

var v1Router = require("./v1/v1Router");

apiRouter.use("/v1", v1Router);

module.exports = apiRouter;
