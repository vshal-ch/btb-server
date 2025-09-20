import pg from "pg";
import knex from "knex";
import knexConfig from "../../knexfile.js";

pg.types.setTypeParser(1082, (val) => val);
const environment = process.env.NODE_ENV || "development";
const db = knex(knexConfig[environment]);

export default db;
