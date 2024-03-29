import express from "express";
import { Repository } from "typeorm";

import { myDataSource } from "../../../services/databaseService";
import { Trend, TrendType } from "../../../entity/trends.entity";
import { getUser, getUserRepository } from "./usersRouter";
import { User } from "../../../entity/user.entity";

const trendsRouter = express.Router();

// CREATE ==========================================================================

type SaveTrendRrequest = Omit<Trend, "id" | "user"> & { userId: User["id"] };
/**
 * Create or update a trend.
 */
trendsRouter.put("/", async function (req, res) {
  try {
    const { value, date, type, userId } = req.body as SaveTrendRrequest;

    if (!isTrendType(type)) return res.status(400).send("Invalid type.");

    const user = await getUser(userId);

    if (!user) return res.status(400).send("Couldn't find user.");

    let trend = await getTrendRepository().findOne({
      where: { date, user, type },
    });

    if (trend) {
      trend.value = value;
    } else {
      trend = new Trend();
      trend.value = value;
      trend.date = date;
      trend.type = type;
    }
    trend.user = user;

    const savedTrend = await myDataSource.manager.save(trend);
    savedTrend.value = Number(savedTrend.value);
    return res.json(savedTrend);
  } catch (error) {
    return res.json(error);
  }
});

// READ ============================================================================

type FetchTrendsRequest = {
  userId: User["id"];
};
trendsRouter.get("/", async function (req, res) {
  try {
    const { userId } = req.body as FetchTrendsRequest;
    const user = await getUserRepository().find({ where: { id: userId } });

    if (!user) return res.status(400).send("Couldn't find user.");

    const trends = await getTrendRepository().find({ where: { user } });

    return res.json(
      trends.map((t) => {
        t.value = Number(t.value);
        return t;
      })
    );
  } catch (error) {
    return res.json(error);
  }
});

// HELPERS =============================================================================

export const getTrendRepository: () => Repository<Trend> = () => {
  return myDataSource.getRepository(Trend);
};

function isTrendType(arg: string): arg is TrendType {
  return (
    arg === "cash" ||
    arg === "credit cards" ||
    arg === "loans" ||
    arg === "investments"
  );
}

export default trendsRouter;
