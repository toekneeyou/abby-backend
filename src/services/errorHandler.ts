import { Request, Response, NextFunction } from "express";
import createError, { HttpError } from "http-errors";

export function handle404Error(
  req: Request,
  res: Response,
  next: NextFunction
) {
  next(createError(404));
}

export function handleGeneralError(
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  res
    .status(err.status || 500)
    .json(req.app.get("env") === "development" ? err : {});
}
