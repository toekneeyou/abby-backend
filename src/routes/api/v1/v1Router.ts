import express from "express";

import usersRouter from "./usersRouter";
import authRouter from "./authRouter";
import plaidRouter from "./plaidRouter";
import institutionsRouter from "./institutionsRouter";
import accountsRouter from "./accountsRouter";
import trendsRouter from "./trendsRouter";
import transactionsRouter from "./transactionsRouter";
import categoriesRouter from "./categoriesRouter";

const v1Router = express.Router();

v1Router.use("/users", usersRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/plaid", plaidRouter);
v1Router.use("/institutions", institutionsRouter);
v1Router.use("/accounts", accountsRouter);
v1Router.use("/trends", trendsRouter);
v1Router.use("/transactions", transactionsRouter);
v1Router.use("/categories", categoriesRouter);

export default v1Router;
