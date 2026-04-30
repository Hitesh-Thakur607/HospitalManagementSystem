const mysql = require("mysql2");

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hospital_db",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: Number(process.env.DB_QUEUE_LIMIT) || 50,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000,
};

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
  if (err) {
    console.error(`MySQL pool init error (${dbConfig.host}:${dbConfig.port}):`, err.message);
    return;
  }

  console.log("MySQL pool connected");
  connection.release();
});

db.on("error", (err) => {
  console.error("MySQL pool error:", err.code || err.message);
});

module.exports = db;
