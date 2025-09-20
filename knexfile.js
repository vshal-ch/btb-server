// Update with your config settings.
import "dotenv/config";

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {
  development: {
    client: "pg",
    connection: process.env.DEV_DATABASE_URL,
    pool: { min: 0, max: 10 },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" },
  },

  staging: {
    client: "pg",
    connection: process.env.STAGING_DATABASE_URL,
    pool: { min: 0, max: 10 },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" },
  },

  production: {
    client: "pg",
    connection: process.env.PROD_DATABASE_URL,
    pool: { min: 2, max: 20 },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" },
  },
};
