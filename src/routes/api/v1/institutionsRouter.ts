import express from "express";
import { getUser } from "./usersRouter";
import { Institution } from "../../../entity/institution.entity";
import { Repository } from "typeorm";
import { myDataSource } from "../../../services/databaseService";
import { CountryCode, ItemPublicTokenExchangeRequest } from "plaid";
import { User } from "../../../entity/user.entity";
import { plaidClient } from "../../../services/plaidService";

const institutionsRouter = express.Router();

// CREATE ==========================================================================

type CreateInstitutionRequest = {
  publicToken: string;
  userId: User["id"];
};
institutionsRouter.post("/", async function (req, res) {
  try {
    const { publicToken, userId } = req.body as CreateInstitutionRequest;
    const user = await getUser(userId);
    if (user) {
      // get access token
      const request: ItemPublicTokenExchangeRequest = {
        public_token: publicToken,
      };
      const accessTokenResponse = await plaidClient.itemPublicTokenExchange(
        request
      );
      const accessToken = accessTokenResponse.data.access_token;
      const itemId = accessTokenResponse.data.item_id;
      // get item/institution with accessToken
      const itemResponse = await plaidClient.itemGet({
        access_token: accessToken,
      });
      const institutionId = itemResponse.data.item.institution_id;
      // get item/institution info with institutionId
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
      });
      const institution = institutionResponse.data.institution;
      // create new institution
      const newInstitution = new Institution();
      newInstitution.itemId = itemId;
      newInstitution.institutionId = institutionId;
      newInstitution.name = institution.name;
      newInstitution.accessToken = accessToken;
      newInstitution.logo = institution.logo;
      newInstitution.url = institution.url;
      newInstitution.primaryColor = institution.primary_color;
      // must add user to institution
      newInstitution.user = user;
      const savedInstitution = await myDataSource.manager.save(newInstitution);
      // return savedInstitution as a response
      return res.json(savedInstitution);
    } else {
      res.status(400).send("Couldn't find user.");
    }
  } catch (error) {
    return res.json(error);
  }
});

// READ ============================================================================

type FetchInstitutionsRequest = {
  userId: User["id"];
};
/**
 * Fetches all institutions belonging to a user.
 */
institutionsRouter.get("/", async function (req, res) {
  try {
    const { userId } = req.body as FetchInstitutionsRequest;
    const user = await getUser(userId);
    if (user) {
      const institutions = await getInstitutionRepository().find({
        where: { user },
      });
      return res.json(institutions);
    } else {
      return res.status(400).send("Couldn't find user.");
    }
  } catch (error) {
    return res.json(error);
  }
});

// UPDATE ==========================================================================

type UpdateInstitutionRequest = Pick<Institution, "customName">;
/**
 * Update an institution.
 */
institutionsRouter.put("/:id", async function (req, res) {
  try {
    const id = req.params.id;
    const institution = await getInstitutionByItemId(id);

    if (institution) {
      Object.entries(req.body).forEach(([key, value]) => {
        switch (key as keyof UpdateInstitutionRequest) {
          case "customName":
            institution[key] = value;
            break;
          default:
        }
      });
      const savedInstitution = await myDataSource.manager.save(institution);
      return res.json(savedInstitution);
    } else {
      res.status(400).send("Couldn't find institution.");
    }
  } catch (error) {
    return res.json(error);
  }
});

// DELETE ==========================================================================

/**
 * Delete an institution.
 */
institutionsRouter.delete("/:id", async function (req, res) {
  try {
    const id = req.params.id;
    const institution = await getInstitutionByItemId(id);
    if (institution) {
      const removedInstitution = await myDataSource.manager.remove(institution);
      res.json(removedInstitution);
    } else {
      res.status(400).send("Couldn't find institution.");
    }
  } catch (error) {
    return res.json(error);
  }
});

export default institutionsRouter;

// HELPERS =============================================================================

/**
 * Get Institution repository.
 */
export const getInstitutionRepository: () => Repository<Institution> = () => {
  return myDataSource.getRepository(Institution);
};
/**
 * Get institution with access token.
 */
export const getInstitutionByAccessToken: (
  accessToken: string
) => Promise<Institution> = async (accessToken) => {
  return await myDataSource
    .getRepository(Institution)
    .findOne({ where: { accessToken: accessToken } });
};
/**
 * Get institution with access token.
 */
export const getInstitutionByItemId: (
  itemId: string
) => Promise<Institution> = async (itemId) => {
  return await myDataSource
    .getRepository(Institution)
    .findOne({ where: { itemId } });
};
