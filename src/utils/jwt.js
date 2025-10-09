import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, {
    expiresIn: "15m",
  });
};

export function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "1d",
  });
}

export const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};
