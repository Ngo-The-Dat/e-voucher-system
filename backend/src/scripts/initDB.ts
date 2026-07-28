import pool from "../config/db.js";
import fs from "fs";
import path from "path";

let sql = fs.readFileSync(
    path.join(process.cwd(), "../database/scripts/init.sql"),
    "utf-8"
);

await pool.query(sql);
console.log("Database initialized successfully");

sql = fs.readFileSync(
    path.join(process.cwd(), "../database/seeds/data.sql"),
    "utf-8"
);
await pool.query(sql);
console.log("Database seeded successfully");

await pool.end();