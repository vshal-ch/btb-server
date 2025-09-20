// middleware/validateContacts.js
import validator from "validator";

function validatePhonesArray(phones) {
  if (!Array.isArray(phones) || phones.length === 0) return false;
  for (const ph of phones) {
    if (!ph.phone_no || !validator.isMobilePhone(ph.phone_no + "", "any")) {
      return false;
    }
    if (!["tel", "whatsapp"].includes(ph.type)) return false;
  }
  return true;
}

export function validateCreateContact(req, res, next) {
  const { name, email } = req.body;

  if (!name || validator.isEmpty(name.trim())) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Name is required" });
  }
  if (email && !validator.isEmail(email)) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid email" });
  }
//  if (!validatePhonesArray(phones)) {
//    return res
//      .status(400)
//      .json({ success: false, data: {}, error: "Invalid phones array" });
//  }

  // sanitize
  req.body.name = validator.escape(name);
  req.body.email = email || null;
//  req.body.phones = phones;
  next();
}

export function validateUpdateContact(req, res, next) {
  const { name, email } = req.body;

  if (name && name.trim().length == 0) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Name cannot be empty" });
  }

  if (email && !validator.isEmail(email)) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid email" });
  }

  if (name) req.body.name = validator.escape(name);
  if (email) req.body.email = email;

  next();
}
