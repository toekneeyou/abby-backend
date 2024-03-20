import express, { Request, Response, NextFunction } from "express";
import { myDataSource } from "../../../services/databaseService";
import { User } from "../../../entity/user.entity";
import {
  generateSalt,
  hashPassword,
} from "../../../services/authenticationService";
import { Repository } from "typeorm";

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
  try {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(req.body.password, salt);

    let newUser = { ...req.body, password: hashedPassword, salt };

    newUser = myDataSource.getRepository(User).create(newUser);
    const results = await myDataSource.getRepository(User).save(newUser);

    return res.json(results);
  } catch (error) {
    console.error(error);
  }
});

// DELETE a user
usersRouter.delete("/:id", async function (req, res) {
  try {
    const userRepository = myDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: +req.params.id },
    });
    console.log("DELETED!");
    const response = await userRepository.remove(user);
    return res.json(response);
  } catch (error) {
    console.error(error);
  }
});

export default usersRouter;

export const getUserRepository: () => Repository<User> = () => {
  return myDataSource.getRepository(User);
};

export const getUser: (id: number) => Promise<User> = async (id) => {
  const userRepository = getUserRepository();
  return await userRepository.findOneBy({ id });
};
