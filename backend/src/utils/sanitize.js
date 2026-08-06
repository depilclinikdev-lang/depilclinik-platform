export const sanitizeEmptyStrings = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeEmptyStrings(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        sanitizeEmptyStrings(val),
      ]),
    );
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
};
