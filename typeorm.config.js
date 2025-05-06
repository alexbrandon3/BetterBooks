require("ts-node").register({
  transpileOnly: true,
  project: __dirname + "/tsconfig.json", // Full path to tsconfig
});

require("dotenv/config");

const { DataSource } = require("typeorm");

module.exports = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: ["src/entities/*.ts"],
  migrations: ["src/migrations/*.ts"],
});
