import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import apiRouter from "./routes/api/apiRouter";
import { handle404Error, handleGeneralError } from "./services/errorHandler";
import createServer from "./services/createServer";
import { initializeDatabase } from "./services/databaseService";

initializeDatabase();

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// routers
app.use("/api", apiRouter);

// error handling
app.use(handle404Error);
app.use(handleGeneralError);

createServer(app);
