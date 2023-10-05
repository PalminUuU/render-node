import express from "express";
import cors from "cors";
import { config } from "dotenv";
import pg from "pg";
import jwt from "jsonwebtoken"

const app = express();
app.use(cors());
config()
const secret =process.env.SECRET
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("el servidor esta conectado en el puerto " + port);
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
})

app.get("/", (req,res) =>{
    res.send("Hola, render y ramon es gay")
})

app.get("/ping", async (req,res) =>{
 const result = await pool.query('SELECT * FROM public.users')
 return res.json(result.rows)
})

app.get("/consulta/:email/:password", async (req, res) => {
  try {
    const email = req.params.email;
    const password = req.params.password;

    const sqlSelect = "SELECT * FROM public.users WHERE correo = $1 AND contraseña = $2";
    const result = await pool.query(sqlSelect, [email, password]);

    if (result.rows.length === 0) {
      res.send('[{"nombre": "INEXISTENTE"}]');
    } else {
      const user = result.rows[0];
      const token = jwt.sign({
        nombre: user.nombre,
        correo: user.correo,
        exp: Date.now() + 24 * 60 * 60 * 1000, 
      }, secret);
      res.send(token);
    }
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ message: "Error en la consulta" });
  }
});


app.get("/private/:token", (req,res) =>{
 try {
  const token = req.params.token
  const payload = jwt.verify(token, secret)

  const nombre = payload.nombre;
  const correo = payload.correo;

  if (Date.now() > payload.exp){
    return res.status(401).send({error : "token expired"})
  }

  res.send("im private")
 } catch (error) {
  res.status(401).send({error: error.message})
 }
})