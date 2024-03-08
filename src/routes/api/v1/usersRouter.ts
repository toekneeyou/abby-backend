import express, { Request, Response, NextFunction } from "express";

const usersRouter = express.Router();

/* GET user. */
usersRouter.get(
  "/",
  function (req: Request, res: Response, next: NextFunction) {
    const response = {
      firstName: "Tony",
      lastName: "Yu",
    };
    res.json(response);
  }
);

export default usersRouter;
