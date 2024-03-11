import express, { Request, Response, NextFunction } from "express";
import { myDataSource } from "../../../services/databaseService";
import { User } from "../../../entity/user.entity";

const usersRouter = express.Router();

/* GET all users. */
usersRouter.get(
  "/",
  async function (req: Request, res: Response, next: NextFunction) {
    const users = await myDataSource.getRepository(User).find();
    res.json(users);
  }
);

/* GET user based on id. */
usersRouter.get("/:id", async function (req: Request, res: Response) {
  const results = await myDataSource.getRepository(User).findOneBy({
    id: +req.params.id,
  });
  return res.json(results);
});

// CREATE a user
usersRouter.post("/", async function (req: Request, res: Response) {
  const user = await myDataSource.getRepository(User).create(req.body);
  const results = await myDataSource.getRepository(User).save(user);
  return res.json(results);
});

export default usersRouter;
