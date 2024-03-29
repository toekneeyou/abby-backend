import express from "express";
import { myDataSource } from "../../../services/databaseService";
import { Category } from "../../../entity/category.entity";
import { getUser } from "./usersRouter";
import { User } from "../../../entity/user.entity";

const categoriesRouter = express.Router();

// CREATE ==========================================================================

type CreateCategoryRequest = {
  userId: User["id"];
  name: string;
};
/**
 * Create and save a new category.
 */
categoriesRouter.post("/", async function (req, res) {
  try {
    const { userId, name } = req.body as CreateCategoryRequest;
    const user = await getUser(userId);

    if (!user) return res.status(400).send("Couldn't find user.");

    const newCategory = new Category();
    newCategory.name = name.toLowerCase();
    newCategory.user = user;
    myDataSource.manager.save(newCategory);

    return res.json(newCategory);
  } catch (error) {
    res.json(error);
  }
});

// READ ============================================================================

type FetchCategoriesRequest = {
  userId: User["id"];
};
/**
 * Fetch all categories belonging to a user.
 */
categoriesRouter.get("/", async function (req, res) {
  try {
    const { userId } = req.body as FetchCategoriesRequest;
    const user = await getUser(userId);
    if (user) {
      const categories = await getCategoryRepository().find({
        where: { user },
      });
      return res.json(categories);
    } else {
      return res.status(400).send("Couldn't find user.");
    }
  } catch (error) {
    res.json(error);
  }
});

// UPDATE ==========================================================================

type UpdateCategoryRequest = Pick<Category, "name">;
/**
 * Update a single category.
 */
categoriesRouter.put("/:id", async function (req, res) {
  try {
    const id = Number(req.params.id);
    const category = await getCategoryRepository().findOne({ where: { id } });

    if (!category) return res.status(400).send("Couldn't find category.");

    Object.entries(req.body).forEach(([key, value]) => {
      switch (key as keyof UpdateCategoryRequest) {
        case "name":
          category[key] = value;
      }
    });
    const savedCategory = await myDataSource.manager.save(category);
    return res.json(savedCategory);
  } catch (error) {
    res.json(error);
  }
});

// DELETE ==========================================================================

/**
 * Delete a single category.
 */
categoriesRouter.delete("/:id", async function (req, res) {
  try {
    const id = Number(req.params.id);
    const category = await getCategoryRepository().findOne({ where: { id } });

    if (!category) return res.status(400).send("Couldn't find category.");

    const removedCategory = await myDataSource.manager.remove(category);
    return res.json(removedCategory);
  } catch (error) {
    res.json(error);
  }
});

export default categoriesRouter;

// HELPERS =============================================================================

export const getCategoryRepository = () => {
  return myDataSource.getRepository(Category);
};
