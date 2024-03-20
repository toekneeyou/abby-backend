import express from "express";
import passport from "passport";
import { User } from "../../../entity/user.entity";

const authRouter = express.Router();

authRouter.post(
  "/login",
  passport.authenticate("local", {}),
  function (req, res) {
    const user = { ...(req.user as User) };
    delete user.salt;
    delete user.password;
    res.status(200).json(user);
  }
);

export default authRouter;
