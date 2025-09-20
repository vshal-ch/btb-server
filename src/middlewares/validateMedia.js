import validator from "validator";

export function validateMedia(req, res, next) {
  const { type, description, position } = req.body;

  if (!["image", "video"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid media type" });
  }

  if(position && !validator.isNumeric(position,{ no_symbols:true})){
	return res.status(400)
		.json({success: false, data: {}, error: "Invalid position"})
  }

  if (description && !validator.isAscii(description)) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid description" });
  }

  next();
}
