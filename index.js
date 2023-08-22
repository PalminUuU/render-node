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
 const result = await pool.query('SELECT * FROM public.users')
 return res.json(result.rows[0])
})

app.get("/consulta/:email/:password", async (req, res) => {
  try {
    const email = req.params.email;
    const password = req.params.password;

    const sqlSelect ="SELECT * FROM  public.users WHERE correo = $1 AND contraseña = $2";
    const result = await pool.query(sqlSelect, [email, password]);

    if (result.rows.length === 0) {
      res.send('[{"nombre": "INEXISTENTE"}]');
    } else {
      const filteredResult = result.rows.map(item => ({
        id: item.id,
        nombre: item.nombre,
        correo: item.correo,
      }));

      res.send(filteredResult);
    }
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ message: "Error en la consulta" });
  }
});