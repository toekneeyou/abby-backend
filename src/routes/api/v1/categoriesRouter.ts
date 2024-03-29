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
  const { userId, name } = req.body as CreateCategoryRequest;

  if (!userId) return res.status(400).send("Invalid userId.");
  if (!name) return res.status(400).send("Invalid name.");

  try {
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
  const { userId } = req.params as unknown as FetchCategoriesRequest;

  if (!userId) return res.status(400).send("Invalid userId.");

  try {
    const user = await getUser(userId);

    if (!user) return res.status(400).send("Couldn't find user.");

    const categories = await getCategoryRepository().find({
      where: { user },
    });

    return res.json(categories);
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
  const id = Number(req.params.id);

  if (!id) return res.status(400).send("Invalid id.");

  try {
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
  const id = Number(req.params.id);

  if (!id) return res.status(400).send("Invalid id.");

  try {
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
