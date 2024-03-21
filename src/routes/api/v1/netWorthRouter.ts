import express from "express";
import { Repository } from "typeorm";

import { myDataSource } from "../../../services/databaseService";
import { NetWorth } from "../../../entity/netWorth";
import { getUser, getUserRepository } from "./usersRouter";

const netWorthRouter = express.Router();

type SaveNetWorthRequest = {
  amount: number;
  month: number;
  day: number;
  year: number;
  userId: number;
};
netWorthRouter.post("/save", async function (req, res) {
  try {
    const { amount, month, day, year, userId } =
      req.body as SaveNetWorthRequest;
    let netWorth = await getNetWorthRepository().findOne({
      where: { month, day, year },
    });

    if (netWorth) {
      netWorth.amount = amount;
    } else {
      netWorth = new NetWorth();
      netWorth.amount = amount;
      netWorth.month = month;
      netWorth.day = day;
      netWorth.year = year;
    }
    const user = await getUser(userId);
    netWorth.user = user;
    const response = await myDataSource.manager.save(netWorth);
    return res.json(response);
  } catch (error) {
    return res.json(error);
  }
});

type FetchNetWorthsRequest = {
  userId: number;
};
netWorthRouter.post("/all", async function (req, res) {
  try {
    const { userId } = req.body as FetchNetWorthsRequest;
    const user = await getUserRepository().find({ where: { id: userId } });
    const netWorths = await getNetWorthRepository().find({ where: { user } });
    return res.json(netWorths);
  } catch (error) {
    return res.json(error);
  }
});

export default netWorthRouter;

export const getNetWorthRepository: () => Repository<NetWorth> = () => {
  return myDataSource.getRepository(NetWorth);
};
