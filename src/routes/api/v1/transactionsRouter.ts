import express from "express";

import { myDataSource } from "../../../services/databaseService";

import { Transaction as TransactionEntity } from "../../../entity/transaction.entity";
import { getUser } from "./usersRouter";
import { User } from "../../../entity/user.entity";
import { Institution } from "../../../entity/institution.entity";
import { getInstitutionByItemId } from "./institutionsRouter";
import { getAccountRepository } from "./accountsRouter";
import {
  RemovedTransaction as RemovedPlaidTransaction,
  Transaction as PlaidTransaction,
  TransactionsSyncRequest,
} from "plaid";
import { plaidClient } from "../../../services/plaidService";
import { Account } from "../../../entity/account.entity";
import { getCategoryRepository } from "./categoriesRouter";
import { Category } from "../../../entity/category.entity";

const transactionsRouter = express.Router();

// CREATE ==========================================================================

type CreateTransactionRequest = { userId: User["id"] } & Pick<
  TransactionEntity,
  "customName" | "amount" | "category" | "date"
>;
/**
 * Create a new transaction. This transaction will not belong to any institution or account.
 */
transactionsRouter.post("/", async function (req, res) {
  const { userId, ...createTransactionRequest } =
    req.body as CreateTransactionRequest;

  if (!userId) return res.status(400).send("Invalid userId.");

  try {
    const user = await getUser(userId);

    if (!user) return res.status(400).send("Couldn't find user.");

    const newTransaction = new TransactionEntity();
    Object.entries(createTransactionRequest).forEach(([key, value]) => {
      switch (key as keyof CreateTransactionRequest) {
        case "customName":
        case "amount":
        case "category":
        case "date":
          newTransaction[key] = value;
          break;
        default:
      }
    });
    newTransaction.user = user;
    const savedTransaction = await myDataSource.manager.save(newTransaction);

    return res.json(savedTransaction);
  } catch (error) {
    return res.json(error);
  }
});

// READ ============================================================================

type FetchTransactionsRequest = { userId: User["id"] };
/**
 * Fetch transactions belonging to a user from the database.
 */
transactionsRouter.get("/", async function (req, res) {
  const { userId } = req.query as unknown as FetchTransactionsRequest;

  if (!userId) return res.status(400).send("Invalid userId.");

  try {
    const user = await getUser(userId);

    if (!user) return res.status(400).send("Couldn't find user");

    let transactionsResponse = await getTransactionRepository().find({
      where: { user },
    });

    if (!transactionsResponse)
      return res.status(400).send("Couldn't find transactions.");

    transactionsResponse = transactionsResponse.map((t) => {
      turnTransactionDecimalsIntoNumbers(t);
      return t;
    });

    return res.json(transactionsResponse);
  } catch (error) {
    return res.json(error);
  }
});

type FetchTransactionsFromPlaidRequest = {
  itemId: Institution["itemId"];
  userId: User["id"];
};
transactionsRouter.get("/sync", async function (req, res) {
  const { itemId, userId } =
    req.query as unknown as FetchTransactionsFromPlaidRequest;

  if (!userId) return res.status(400).send("Invalid userId.");
  if (!itemId) return res.status(400).send("Invalid itemId.");

  try {
    const user = await getUser(userId);
    const institution = await getInstitutionByItemId(itemId);
    const transactionRepository = myDataSource.getRepository(TransactionEntity);
    const accounts = await getAccountRepository().find({ where: { user } });
    // make sure institution and user exists before moving on
    if (institution && user && transactionRepository && accounts) {
      // Provide a cursor from your database if you've previously
      // received one for the Item. Leave null if this is your
      // first sync call for this Item. The first request will
      // return a cursor.
      let cursor = institution.cursor ?? null;
      // New transaction updates since "cursor"
      let added: Array<PlaidTransaction> = [];
      let modified: Array<PlaidTransaction> = [];
      // Removed transaction ids
      let removed: Array<RemovedPlaidTransaction> = [];
      let hasMore = true;
      // Iterate through each page of new transaction updates for item
      while (hasMore) {
        const request: TransactionsSyncRequest = {
          access_token: institution.accessToken,
          cursor,
        };
        const response = await plaidClient.transactionsSync(request);
        const data = response.data;
        // Add this page of results
        added = added.concat(data.added);
        modified = modified.concat(data.modified);
        removed = removed.concat(data.removed);
        hasMore = data.has_more;
        // Update cursor to the next cursor
        cursor = data.next_cursor;
      }
      // create accountMap for easy lookup
      const accountMap: { [id: string]: Account } = {};
      accounts.forEach((a) => {
        accountMap[a.accountId] = a;
      });
      // assign uncategorized to new transactions
      const uncategorized = await getCategoryRepository().findOne({
        where: { name: "uncategorized", user },
      });
      const newTransactions = await createNewTransactionsFromAdded(
        added,
        accountMap,
        user,
        institution,
        uncategorized
      );
      // modify existing transactions located in modified
      await modifyExistingTransactions(modified, newTransactions);
      // remove existing transactions located in removed
      await deleteRemovedTransactions(removed);
      // save transactions
      let savedTransactions = await myDataSource.manager.save(newTransactions);
      // update institution cursor only if transactions are saved successfully
      institution.cursor = cursor;
      await myDataSource.manager.save(institution);

      savedTransactions = savedTransactions.map((t) => {
        turnTransactionDecimalsIntoNumbers(t);
        return t;
      });
      return res.json(savedTransactions);
    } else {
      return res.status(400).send("Couldn't find item or user.");
    }
  } catch (error) {
    console.error("/syncTransactions", error);
    return res.json(error);
  }
});

// UPDATE ==========================================================================

type UpdateTransactionRequest = Pick<
  TransactionEntity,
  "customName" | "category"
>;
/**
 * Update a transaction.
 */
transactionsRouter.put("/:id", async function (req, res) {
  const id = Number(req.params.id) as TransactionEntity["id"];
  const updateTransactionsRequest = req.body as UpdateTransactionRequest;

  if (!id) return res.status(400).send("Invalid id.");

  try {
    const transaction = await getTransactionRepository().findOne({
      where: { id },
    });

    if (!transaction) return res.status(400).send("Couldn't find transaction");

    Object.entries(updateTransactionsRequest).forEach(([key, value]) => {
      switch (key as keyof UpdateTransactionRequest) {
        case "customName":
        case "category":
          transaction[key] = value;
          break;
        default:
      }
    });
    const savedTransaction = await myDataSource.manager.save(transaction);
    turnTransactionDecimalsIntoNumbers(savedTransaction);

    return res.json(savedTransaction);
  } catch (error) {
    return res.json(error);
  }
});

// DELETE ==========================================================================

/**
 * Delete a transaction.
 */
transactionsRouter.delete("/:id", async function (req, res) {
  const id = Number(req.params.id) as TransactionEntity["id"];

  if (!id) return res.status(400).send("Invalid id.");

  try {
    const transaction = await getTransactionRepository().findOne({
      where: { id },
    });

    if (!transaction) return res.status(400).send("Couldn't find transaction");

    const deletedTransaction = await myDataSource.manager.remove(transaction);
    return res.json(deletedTransaction);
  } catch (error) {
    return res.json(error);
  }
});

// HELPERS =============================================================================

export const getTransactionRepository = () => {
  return myDataSource.getRepository(TransactionEntity);
};

const createNewTransactionsFromAdded = async (
  added: PlaidTransaction[],
  accountMap: { [accountId: string]: Account },
  user: User,
  institution: Institution,
  uncategorized: Category
) => {
  // normalize data from added and save to newTransactions
  const newTransactions = added.map((a) => {
    const t = new TransactionEntity();
    normalizeTransactionData(t, a);
    t.isModified = false;
    t.account = accountMap[a.account_id];
    t.institution = institution;
    t.user = user;
    if (uncategorized) {
      t.category = uncategorized;
    }
    return t;
  });

  return newTransactions;
};

const modifyExistingTransactions = async (
  modified: PlaidTransaction[],
  newTransactions: TransactionEntity[]
) => {
  const transactionRepository = getTransactionRepository();
  // modify transactions from modified array and add to newTransactions
  const transactionsToBeModifiedPromises = modified.map((m) => {
    return transactionRepository.findOne({
      where: { transactionId: m.transaction_id },
    });
  });
  const transactionsToBeModified = await Promise.all(
    transactionsToBeModifiedPromises
  );
  transactionsToBeModified.forEach((ttbm, i) => {
    if (ttbm) {
      normalizeTransactionData(ttbm, modified[i]);
      newTransactions.push(ttbm);
    }
  });
};

const deleteRemovedTransactions = async (
  removed: RemovedPlaidTransaction[]
) => {
  const transactionRepository = getTransactionRepository();
  // delete transactions from removed array
  const transactionsToBeRemovedPromises = removed.map((r) => {
    return transactionRepository.findOne({
      where: { transactionId: r.transaction_id },
    });
  });
  const transactionsToBeRemoved = await Promise.all(
    transactionsToBeRemovedPromises
  );
  const transactionsRemovalPromises = transactionsToBeRemoved.map((ttbr) => {
    return myDataSource.manager.remove(ttbr);
  });

  await Promise.all(transactionsRemovalPromises);
};

const normalizeTransactionData = (
  x: TransactionEntity,
  y: PlaidTransaction
) => {
  x.amount = y.amount;
  x.isoCurrencyCode = y.iso_currency_code;
  x.date = y.date;
  x.dateTime = y.datetime;
  x.authorizedDate = y.authorized_date;
  x.authorizedDateTime = y.authorized_datetime;
  x.name = y.name;
  x.merchantName = y.merchant_name;
  x.merchantAddress = y.location.address;
  x.merchantCity = y.location.city;
  x.merchantRegion = y.location.region;
  x.merchantPostalCode = y.location.postal_code;
  x.merchantCountry = y.location.country;
  x.merchantLat = y.location.lat;
  x.merchantLon = y.location.lon;
  x.merchantStoreNumber = y.location.store_number;
  x.pending = y.pending;
  x.transactionId = y.transaction_id;
  x.paymentChannel = y.payment_channel;
};

const turnTransactionDecimalsIntoNumbers = (transaction: TransactionEntity) => {
  transaction.amount = Number(transaction.amount);
};

export default transactionsRouter;
