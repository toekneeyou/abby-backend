import express from "express";

import usersRouter from "./usersRouter";
import authRouter from "./authRouter";

const v1Router = express.Router();

v1Router.use("/users", usersRouter);
v1Router.use("/auth", authRouter);

export default v1Router;
