import express from "express";
import { Repository } from "typeorm";

import { myDataSource } from "../../../services/databaseService";
import { Account } from "../../../entity/account.entity";
import { getInstitutionRepository } from "./institutionsRouter";
import { User } from "../../../entity/user.entity";

const accountsRouter = express.Router();

type FetchAccountsRequest = {
  plaidItemId: string;
};
/**
 * Fetches all accounts belonging to user's institution.
 */
accountsRouter.post("/all", async function (req, res) {
  try {
    const { plaidItemId } = req.body as FetchAccountsRequest;
    const institution = await getInstitutionRepository().find({
      where: { plaidItemId },
    });
    const accounts = await getAccountRepository().find({
      where: { institution },
    });
    return res.json(accounts);
  } catch (error) {
    return res.json(error);
  }
});

export default accountsRouter;

/**
 * Get Account repository.
 */
export const getAccountRepository: () => Repository<Account> = () => {
  return myDataSource.getRepository(Account);
};
/**
 * Get accounts belong to a user.
 */
export const getUserAccounts: (user: User) => Promise<Account[]> = async (
  user
) => {
  return await getAccountRepository().find({ where: { user } });
};
