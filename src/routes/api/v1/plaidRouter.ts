import express from "express";
import { plaidClient } from "../../../services/plaidService";
import { CountryCode, LinkTokenCreateRequest, Products } from "plaid";

const plaidRouter = express.Router();

/**
 * Retreives a linkToken from Plaid.
 */
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

plaidRouter.get("/categories", async (req, res) => {
  try {
    const response = await plaidClient.categoriesGet({});
    const categories = response.data.categories;
    res.json(categories);
  } catch (error) {
    // handle error
  }
});

export default plaidRouter;
