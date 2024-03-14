import express from "express";
import passport from "passport";

const authRouter = express.Router();

authRouter.post(
  "/login",
  passport.authenticate("local", {}),
  function (req, res) {
    res.json(req.user);
  }
);

export default authRouter;
