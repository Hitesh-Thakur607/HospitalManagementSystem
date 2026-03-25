const mysql = require("mysql2");

const db = mysql.createPool({
  uri: process.env.MYSQL_ADDON_URI,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: Number(process.env.DB_QUEUE_LIMIT) || 50,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ...(process.env.DB_SSL === "true"
    ? {
        ssl: {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
        },
      }
    : {}),
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL pool init error:", err.message);
    return;
  }

  console.log("MySQL Pool Connected");
  connection.release();
});

db.on("error", (err) => {
  console.error("MySQL pool error:", err.code || err.message);
});

module.exports = db;
