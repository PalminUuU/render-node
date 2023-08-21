import express from "express";
import cors from "cors";
import { config } from "dotenv";
import pg from "pg";
const app = express();

app.use(cors());

config()

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("el servidor esta conectado en el puerto " + port);
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  //ssl: true
})

app.get("/", (req,res) =>{
    res.send("Hola, render y ramon es gay")
})

app.get("/ping", async (req,res) =>{
 const result = await pool.query('SELECT NOW ()')
 return res.json(result.rows[0])
})