import validator from "validator";

export function validateMedia(req, res, next) {
  const { type, description, position, youtube_url } = req.body;

  if (!["image", "video"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid media type" });
  }

  if (position && !validator.isNumeric(position, { no_symbols: true })) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid position" });
  }

  if (description && !validator.isAscii(description)) {
    return res
      .status(400)
      .json({ success: false, data: {}, error: "Invalid description" });
  }

  if (type === "video") {
    if (!youtube_url)
      return res.status(400).json({
        success: false,
        data: {},
        error: "Youtube URL is required for videos",
      });

    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?[A-Za-z0-9_\-]{11}/;
    if (!youtubeRegex.test(youtube_url)) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "Invalid YouTube URL" });
    }
  }

  if (type === "image" && !req.file && !req.body.src_url) {
    return res.status(400).json({
      success: false,
      data: {},
      error: "Image file or src_url required",
    });
  }

  next();
}
