// middleware/validatePhones.js
import validator from "validator";

export function validateCreatePhone(req, res, next) {
  const { phone_no, type } = req.body;

  if (!contact_id) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "contact_id required" });
  }
  if (!phone_no || !validator.isMobilePhone(phone_no + "", "any")) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid phone number" });
  }
  if (!["tel", "whatsapp"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid phone type" });
  }

  next();
}

export function validateUpdatePhone(req, res, next) {
  const { phone_no, type } = req.body;

  if (phone_no && !validator.isMobilePhone(phone_no + "", "any")) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid phone number" });
  }
  if (type && !["tel", "whatsapp"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid phone type" });
  }

  next();
}
