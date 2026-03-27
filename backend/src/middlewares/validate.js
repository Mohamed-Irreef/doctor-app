const ApiError = require("../utils/ApiError");

const validate =
  (schema, target = "body") =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req[target]);
    if (!parsed.success) {
      return next(
        new ApiError(400, "Validation failed", parsed.error.flatten()),
      );
    }
    req[target] = parsed.data;
    return next();
  };

module.exports = validate;
