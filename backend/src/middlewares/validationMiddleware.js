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

export const validateCheckoutSubmit = (req, res, next) => {
  const {
    orderId,
    name,
    phone,
    email,
    addressStreet,
    subdistrict,
    district,
    province,
    zipcode
  } = req.body || {};

  if (!orderId || typeof orderId !== "string" || !/^[A-Za-z0-9._-]{1,60}$/.test(orderId)) {
    return res.status(400).json({ error: "Order ID is invalid." });
  }

  if (name !== undefined) {
    const cleanName = sanitizeString(name);
    if (cleanName.length > 100) {
      return res.status(400).json({ error: "Name is too long." });
    }
  }

  if (phone !== undefined && phone !== "") {
    const cleanPhone = sanitizeString(phone);
    if (!/^[0-9+()\-\s]{4,20}$/.test(cleanPhone)) {
      return res.status(400).json({ error: "Phone number format is invalid." });
    }
  }

  if (email !== undefined && email !== "" && !isValidEmail(email)) {
    return res.status(400).json({ error: "Email format is invalid." });
  }

  const addressFields = [addressStreet, subdistrict, district, province, zipcode];
  for (const field of addressFields) {
    if (field !== undefined && typeof field === "string" && field.trim().length > 200) {
      return res.status(400).json({ error: "Address field is too long." });
    }
  }

  if (!req.file) {
    return res.status(400).json({ error: "Payment slip image is required." });
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
