import express from "express";
import { Repository } from "typeorm";

import { myDataSource } from "../../../services/databaseService";
import { Account } from "../../../entity/account.entity";
import {
  getInstitutionByAccessToken,
  getInstitutionRepository,
} from "./institutionsRouter";
import { User } from "../../../entity/user.entity";
import { Institution } from "../../../entity/institution.entity";
import { getUser } from "./usersRouter";
import { AccountBase, AccountsGetRequest } from "plaid";
import { plaidClient } from "../../../services/plaidService";

const accountsRouter = express.Router();

// CREATE ==========================================================================

// READ ============================================================================

type FetchAccountsRequest = {
  itemId: Institution["itemId"];
  userId: User["id"];
};
/**
 * Fetches all accounts belonging to user or a user's institution from the database.
 * These accounts are not up to date with plaid.
 */
accountsRouter.get("/", async function (req, res) {
  const { itemId, userId } = req.params as unknown as FetchAccountsRequest;

  if (!userId) return res.status(400).send("Invalid userId.");
  if (!itemId) return res.status(400).send("Invalid itemId.");

  try {
    let accounts: Account[];

    if (userId) {
      const user = await getUser(userId);

      if (!user) return res.status(400).send("Couldn't find user");

      accounts = await getUserAccounts(user);
    } else if (itemId) {
      const institution = await getInstitutionRepository().find({
        where: { itemId },
      });

      if (!institution)
        return res.status(400).send("Couldn't find institution.");

      accounts = await getAccountRepository().find({
        where: { institution },
      });
    } else {
      return res.status(400).send("Invalid userId or itemId.");
    }

    if (!accounts) return res.status(400).send("Couldn't find accounts.");

    accounts = turnAccountDecimalsIntoNumbers(accounts);

    return res.json(accounts);
  } catch (error) {
    return res.json(error);
  }
});

type FetchBalancesRequest = {
  accessToken: Institution["accessToken"];
  userId: User["id"];
};
/**
 * Fetches new data from plaid and syncs it with the accounts in the database.
 */
accountsRouter.get("/balances", async function (req, res) {
  const { accessToken, userId } = req.params as unknown as FetchBalancesRequest;

  if (!userId) return res.status(400).send("Invalid userId.");
  if (!accessToken) return res.status(400).send("Invalid accessToken.");

  try {
    // get user and institution to save to accounts
    const user = await getUser(userId);
    const institution = await getInstitutionByAccessToken(accessToken);
    const userAccounts = await getUserAccounts(user);

    if (user && institution && userAccounts) {
      const request: AccountsGetRequest = {
        access_token: accessToken,
      };
      // get balances
      const getBalanceResponse = await plaidClient.accountsBalanceGet(request);
      const accounts = getBalanceResponse.data.accounts;
      // create new or update accounts
      const accountPromises = accounts.map((account) => {
        const acc =
          userAccounts.find((a) => a.accountId === account.account_id) ??
          new Account();
        normalizeAccountData(acc, account);
        acc.lastSync = new Date().toLocaleString();
        // must add institution and user to account
        acc.institution = institution;
        acc.user = user;
        return myDataSource.manager.save(acc);
      });
      // save accounts
      let savedAccounts = await Promise.all(accountPromises);
      savedAccounts = turnAccountDecimalsIntoNumbers(savedAccounts);

      return res.json(savedAccounts);
    } else {
      return res
        .status(400)
        .send("Couldn't find user, institution, or accounts.");
    }
  } catch (error) {
    console.error("/balance", error);
    return res.json(error);
  }
});

// UPDATE ==========================================================================

type UpdateAccountRequest = Pick<
  Account,
  "customName" | "isHidden" | "lastSync"
>;
/**
 * Update an account.
 */
accountsRouter.put("/:id", async function (req, res) {
  const id = Number(req.params.id);

  if (!id) return res.status(400).send("Invalid id.");

  try {
    const account = getAccountRepository().findOne({ where: { id } });

    if (!account) return res.status(400).send("Couldn't find account.");

    Object.entries(req.body).forEach(([key, value]) => {
      switch (key as keyof UpdateAccountRequest) {
        case "customName":
        case "isHidden":
        case "lastSync":
          account[key] = value;
          break;
        default:
      }
    });

    const updatedAccount = await myDataSource.manager.save(account);
    // turn numbers strings into numbers
    updatedAccount.availableBalance = Number(updatedAccount.availableBalance);
    updatedAccount.currentBalance = Number(updatedAccount.currentBalance);
    updatedAccount.limit = Number(updatedAccount.limit);

    return res.json(updatedAccount);
  } catch (error) {
    res.json(error);
  }
});

export default accountsRouter;

// HELPERS =============================================================================

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
/**
 * Turn decimals into numbers.
 */
export const turnAccountDecimalsIntoNumbers = (accounts: Account[]) => {
  return accounts.map((a) => {
    a.availableBalance = Number(a.availableBalance);
    a.currentBalance = Number(a.currentBalance);
    a.limit = Number(a.limit);
    return a;
  });
};

export const normalizeAccountData = (x: Account, y: AccountBase) => {
  x.accountId = y.account_id;
  x.availableBalance = y.balances.available;
  x.currentBalance = y.balances.current;
  x.limit = y.balances.limit;
  x.isoCurrencyCode = y.balances.iso_currency_code;
  x.name = y.name;
  x.officialName = y.official_name;
  x.persistentAccountId = y.persistent_account_id;
  x.subType = y.subtype;
  x.type = y.type;
};
