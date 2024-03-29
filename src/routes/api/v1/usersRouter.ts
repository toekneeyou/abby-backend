import express, { Request, Response, NextFunction } from "express";
import { myDataSource } from "../../../services/databaseService";
import { User } from "../../../entity/user.entity";
import {
  generateSalt,
  hashPassword,
} from "../../../services/authenticationService";
import { Repository } from "typeorm";

const isDev = process.env.NODE_ENV === "development";
const usersRouter = express.Router();

// CREATE ==========================================================================

type CreateUserRequest = Pick<
  User,
  "firstName" | "lastName" | "email" | "username" | "password"
>;
/**
 * Create a user.
 */
usersRouter.post("/", async function (req: Request, res: Response) {
  try {
    // generate salt and hashed password
    const salt = generateSalt();
    const hashedPassword = await hashPassword(req.body.password, salt);
    const user = new User();
    // add data to user
    Object.entries(req.body).forEach(([key, value]) => {
      switch (key as keyof CreateUserRequest) {
        case "firstName":
        case "lastName":
        case "email":
        case "username":
          user[key] = value;
          break;
        default:
      }
    });
    user.password = hashedPassword as string;
    user.salt = salt;
    // save user
    const newUser = await myDataSource.getRepository(User).save(user);
    return res.json(newUser);
  } catch (error) {
    return res.json(error);
  }
});

// READ ============================================================================

/**
 * Fetch all users. Only use in dev.
 */
usersRouter.get("/", async function (req, res, next) {
  if (isDev) {
    const users = await myDataSource.getRepository(User).find();

    if (!users) res.status(400).send("Couldn't find users.");

    return res.json(users);
  } else {
    return res.status(400).send("Access Forbidden");
  }
});

/**
 * Fetch a single user.
 */
usersRouter.get("/:id", async function (req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!id) return res.status(400).send("Invalid id.");

  try {
    const user = await getUser(id);

    if (!user) return res.status(400).send("Couldn't find user.");

    return res.json(user);
  } catch (error) {
    return res.json(error);
  }
});

// UPDATE ==========================================================================

type UpdateUserRequest = Pick<
  User,
  "firstName" | "lastName" | "email" | "username" | "password"
>;
/**
 * Update a user.
 */
usersRouter.put("/:id", async function (req, res) {
  const id = Number(req.params.id);

  if (!id) return res.status(400).send("Invalid id.");

  try {
    const user = await getUser(id);

    if (!user) return res.status(400).send("Couldn't find user.");

    Object.entries(req.body).forEach(([key, value]) => {
      switch (key as keyof UpdateUserRequest) {
        case "firstName":
        case "lastName":
        case "email":
        case "username":
        case "password":
          user[key] = value;
          break;
        default:
      }
    });
    const savedUser = await myDataSource.manager.save(user);

    return res.json(savedUser);
  } catch (error) {
    return res.json(error);
  }
});

// DELETE ==========================================================================

/**
 * Delete a user.
 */
usersRouter.delete("/:id", async function (req, res) {
  const id = Number(req.params.id);

  if (!id) return res.status(400).send("Invalid id.");

  try {
    const user = await getUser(id);

    if (!user) return res.status(400).send("Couldn't find user.");

    const userRepository = myDataSource.getRepository(User);
    const removedUser = await userRepository.remove(user);

    return res.json(removedUser);
  } catch (error) {
    console.error(error);
  }
});

// HELPERS =============================================================================

export const getUserRepository: () => Repository<User> = () => {
  return myDataSource.getRepository(User);
};

export const getUser: (id: number) => Promise<User> = async (id) => {
  const userRepository = getUserRepository();
  const user = await userRepository.findOne({ where: { id } });
  console.log("wtf", id, user);
  return user;
};

export default usersRouter;
