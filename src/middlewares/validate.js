export function validate(schema) {
  return (req, res, next) => {
    try {
      const { error } = schema(req);
      if (error) {
        return res.status(400).json({ success: false, error });
      }
      return next();
    } catch (e) {
      return next(e);
    }
  };
}
