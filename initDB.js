import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client({connectionString: process.env.DATABASE_URL});
await client.connect();
await client.query('DROP TABLE IF EXISTS public."LevelBrief"');
await client.end();
