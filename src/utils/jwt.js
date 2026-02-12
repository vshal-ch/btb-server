import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, SECRET, {
    expiresIn: "15m",
  });
};

export function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "1d",
  });
}

export function generateUserRefreshToken(payload, expiry) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${expiry}d`,
  });
}

export const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
