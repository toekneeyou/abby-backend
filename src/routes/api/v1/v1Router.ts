import express from "express";

import usersRouter from "./usersRouter";

const v1Router = express.Router();

v1Router.use("/users", usersRouter);

export default v1Router;
