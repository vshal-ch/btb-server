require("dotenv").config();

const required = ["JWT_SECRET", "JWT_REFRESH_SECRET", "NODE_ENV", "PORT"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
};
