import dotenv from "dotenv";
const environment = process.env.NODE_ENV ?? "development";
dotenv.config();
dotenv.config({ path: `.env.${environment}` });

import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import session from "express-session";
import passport from "passport";

import apiRouter from "./routes/api/apiRouter";
import { handle404Error, handleGeneralError } from "./services/errorHandler";
import initializeServer from "./services/initializeServer";
import { initializeDatabase } from "./services/databaseService";

initializeDatabase();

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // secure: true only works if there is an HTTPS connection
    cookie: { secure: environment === "production" },
  })
);
app.use(passport.authenticate("session"));

// routers
app.use("/api", apiRouter);

// error handling
app.use(handle404Error);
app.use(handleGeneralError);

initializeServer(app);
