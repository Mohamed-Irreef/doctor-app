function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const sanitized = {};
    for (const [key, innerValue] of Object.entries(value)) {
      // Strip keys that can trigger operator injection in Mongo queries.
      if (key.startsWith("$") || key.includes(".")) continue;
      sanitized[key] = sanitizeValue(innerValue);
    }
    return sanitized;
  }

  if (typeof value === "string") {
    return value.replace(/<script.*?>.*?<\/script>/gi, "").trim();
  }

  return value;
}

function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    Object.assign(req.body, sanitizeValue(req.body));
  }
  if (req.query) {
    req.sanitizedQuery = sanitizeValue(req.query);
    try {
      Object.assign(req.query, req.sanitizedQuery);
    } catch (_error) {
      // Keep req.sanitizedQuery for handlers when query object is immutable.
    }
  }
  if (req.params && typeof req.params === "object") {
    Object.assign(req.params, sanitizeValue(req.params));
  }
  next();
}

module.exports = sanitizeInput;
