const sanitizeString = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().replace(/\s+/g, " ");
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const validateCreateOrder = (req, res, next) => {
  const { items, totalPrice } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must include at least one item." });
  }

  const invalidItem = items.find((item) => {
    if (!item || typeof item !== "object") return true;
    const productId = item.product?.id ?? item.id;
    const quantity = Number(item.quantity);
    return !productId || !Number.isInteger(quantity) || quantity <= 0;
  });

  if (invalidItem) {
    return res.status(400).json({ error: "Each order item must include a valid product id and quantity." });
  }

  if (typeof totalPrice !== "number" || !Number.isFinite(totalPrice) || totalPrice < 0) {
    return res.status(400).json({ error: "Total price must be a valid non-negative number." });
  }

  next();
};

export const validateLoginPayload = (req, res, next) => {
  const { username, password } = req.body || {};

  if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 50) {
    return res.status(400).json({ error: "Username must be between 3 and 50 characters." });
  }

  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: "Password must be between 6 and 128 characters." });
  }

  next();
};
