import express from "express";
import { plaidClient } from "../../../services/plaidService";
import {
  AccountBase,
  AccountsGetRequest,
  CountryCode,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
  Products,
} from "plaid";
import { myDataSource } from "../../../services/databaseService";
import { Institution } from "../../../entity/institution.entity";
import { Account } from "../../../entity/account.entity";
import { getUser } from "./usersRouter";
import { getUserAccounts } from "./accountsRouter";
import { getInstitutionByAccessToken } from "./institutionsRouter";

const plaidRouter = express.Router();

plaidRouter.post("/linkToken", async function (req, res) {
  try {
    const { userId } = req.body;
    const request: LinkTokenCreateRequest = {
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      client_name: "ABBY",
      country_codes: [CountryCode.Us],
      language: "en",
      products: [Products.Transactions],
      optional_products: [Products.Investments, Products.Liabilities],
      user: {
        client_user_id: String(userId),
      },
    };
    const response = await plaidClient.linkTokenCreate(request);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("/linkToken", error);
    return res.json(error);
  }
});

plaidRouter.post("/accessToken", async function (req, res) {
  try {
    // get access token
    const { publicToken, userId } = req.body;
    const request: ItemPublicTokenExchangeRequest = {
      public_token: publicToken,
    };
    const response = await plaidClient.itemPublicTokenExchange(request);
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // create new institution
    const user = await getUser(userId);
    const newInstitution = new Institution();
    newInstitution.plaidAccessToken = accessToken;
    newInstitution.plaidItemId = itemId;
    newInstitution.user = user;
    const institution = await myDataSource.manager.save(newInstitution);

    // return institution as a response
    return res.status(200).json(institution);
  } catch (error) {
    console.error("/accessToken", error);
    return res.json(error);
  }
});

plaidRouter.post("/balance", async function (req, res) {
  try {
    const { accessToken, userId } = req.body;
    const request: AccountsGetRequest = {
      access_token: accessToken,
    };
    // get balances
    const getBalanceResponse = await plaidClient.accountsBalanceGet(request);
    const accounts = getBalanceResponse.data.accounts;
    // get user and institution to save to accounts
    const user = await getUser(userId);
    const institution = await getInstitutionByAccessToken(accessToken);
    const userAccounts = await getUserAccounts(user);
    // create new or update accounts
    const accountPromises = accounts.map((account) => {
      const acc =
        userAccounts.find((a) => a.plaidAccountId === account.account_id) ??
        new Account();

      acc.plaidAccountId = account.account_id;
      acc.plaidAvailableBalance = account.balances.available;
      acc.plaidCurrentBalance = account.balances.current;
      acc.lastUpdatedDatetime = account.balances.last_updated_datetime;
      acc.plaidCreditLimit = account.balances.limit;
      acc.plaidIsoCurrencyCode = account.balances.iso_currency_code;
      acc.plaidName = account.name;
      acc.plaidOfficialName = account.official_name;
      acc.plaidPersistentAccountId = account.persistent_account_id;
      acc.plaidSubType = account.subtype;
      acc.lastUpdatedDatetime = account.balances.last_updated_datetime;
      acc.lastSync = new Date();
      acc.plaidType = account.type;
      acc.institution = institution;
      acc.user = user;

      return myDataSource.manager.save(acc);
    });

    const updatedAccounts = await Promise.all(accountPromises);

    return res.json(updatedAccounts);
  } catch (error) {
    console.error("/balance", error);
    return res.json(error);
  }
});

plaidRouter.post("/all", async function (req, res) {
  const { plaidItemId } = req.body;
  const institution = await myDataSource
    .getRepository(Institution)
    .find({ where: { plaidItemId } });
  const accounts = await myDataSource
    .getRepository(Account)
    .find({ where: { institution } });
  return res.status(200).json({ accounts });
});

// plaidRouter.post("/syncTransactions", async function (req, res) {
//   const { itemId, id } = req.body;
//   const institutions = await getInstitutions(id);
//   const institution = institutions[itemId];

//   // Provide a cursor from your database if you've previously
//   // received one for the Item. Leave null if this is your
//   // first sync call for this Item. The first request will
//   // return a cursor.
//   let cursor = institution.cursor ?? null;

//   // New transaction updates since "cursor"
//   let added: Array<Transaction> = [];
//   let modified: Array<Transaction> = [];
//   // Removed transaction ids
//   let removed: Array<RemovedTransaction> = [];
//   let hasMore = true;

//   // Iterate through each page of new transaction updates for item
//   while (hasMore) {
//     const request: TransactionsSyncRequest = {
//       access_token: institution.accessToken,
//       cursor,
//     };

//     const response = await plaidClient.transactionsSync(request);
//     const data = response.data;
//     // Add this page of results
//     added = added.concat(data.added);
//     modified = modified.concat(data.modified);
//     removed = removed.concat(data.removed);
//     hasMore = data.has_more;
//     // Update cursor to the next cursor
//     cursor = data.next_cursor;
//   }

//   // update institution
//   institution.cursor = cursor;
//   const newInstitutions = { ...institutions, [itemId]: institution };

//   await saveUser(id, "institutions", JSON.stringify(newInstitutions));

//   return res.status(200).json(newInstitutions);
// });

export default plaidRouter;

function transformPlaidKeys(str: string) {
  const transformed = str.split("_").map((word) => {
    return `${word[0].toUpperCase()}${word.slice(1)}`;
  });
  return `plaid${transformed.join("")}`;
}
