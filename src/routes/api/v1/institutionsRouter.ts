import express from "express";
import { getUser } from "./usersRouter";
import { Institution } from "../../../entity/institution.entity";
import { Repository } from "typeorm";
import { myDataSource } from "../../../services/databaseService";

const institutionsRouter = express.Router();

type FetchInstitutionsRequest = {
  userId: number;
};
/**
 * Fetches all institutions belonging to a user.
 */
institutionsRouter.post("/all", async function (req, res) {
  try {
    const { userId } = req.body as FetchInstitutionsRequest;
    const user = await getUser(userId);
    const institutionRepository = getInstitutionRepository();
    const institutions = await institutionRepository.find({ where: { user } });
    return res.json(institutions);
  } catch (error) {
    return res.json(error);
  }
});

export default institutionsRouter;

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
    .findOne({ where: { plaidAccessToken: accessToken } });
};
