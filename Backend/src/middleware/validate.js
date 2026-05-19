import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new ApiError(422, "Validation failed", errors.array()));
  }

  return next();
};

export default validate;
