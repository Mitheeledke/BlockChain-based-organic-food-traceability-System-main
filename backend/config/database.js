const { Sequelize } = require("sequelize");

// pull connection details from environment so they can be changed without
// editing source code. provide sensible defaults for local development.
const dbName = process.env.DB_NAME || "food_traceability";
const dbUser = process.env.DB_USER || "root";
const dbPass = process.env.DB_PASS || "1234";
const dbHost = process.env.DB_HOST || "localhost";

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: process.env.DB_DIALECT || "mysql",
  logging: false,
});

module.exports = sequelize;