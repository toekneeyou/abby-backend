import express from "express";
import myPassport from "../../../services/authenticationService";

const authRouter = express.Router();

authRouter.post(
  "/login",
  myPassport.authenticate("local", {}),
  function (req, res) {
    console.log(req.user);
    console.log(res);
  }
);

export default authRouter;
