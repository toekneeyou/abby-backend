var express = require("express");
var v1Router = express.Router();
var usersRouter = require("./usersRouter");

v1Router.use("/users", usersRouter);

module.exports = v1Router;
