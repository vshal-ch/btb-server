import pg from "pg";
import knex from "knex";
import knexConfig from "../../knexfile.js";

// Prevents automatic convertion of dates into JS Date object
// Now it returns date string, eg. "2026-02-01"
pg.types.setTypeParser(1082, (val) => val);

const environment = process.env.NODE_ENV || "development";
const db = knex(knexConfig[environment]);

export default db;
