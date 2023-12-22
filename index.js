import express from "express";
import cors from "cors";
import { config } from "dotenv";
import pg from "pg";
import jwt from "jsonwebtoken"
import bodyParser from "body-parser";
import argon2 from "argon2";

const app = express();
app.use(cors());
config()
const secret =process.env.SECRET
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


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

app.get("/consulta/:email/:password", async (req, res) => {
  try {
    const email = req.params.email;
    const providedPassword = req.params.password;
    const sqlSelect = "SELECT * FROM public.users WHERE correo = $1";
    const result = await pool.query(sqlSelect, [email]);
    if (result.rows.length === 0) {
      res.send({token: "", message: "Usuario Incorrecto" });
    } else {
      const user = result.rows[0];
      const isPasswordValid = await argon2.verify(user.contraseña, providedPassword);
      if (isPasswordValid) {
        const token = jwt.sign({
          nombre: user.nombre,
          correo: user.correo,
          exp: Date.now() + 24 * 60 * 60 * 1000, 
        }, secret);
        res.send({token:token});
      } else {
        res.send({token:"" , message: "Contraseña incorrecta" });
      }
    }
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ message: "Error en la consulta" });
  }
});


app.post("/private/", (req,res) =>{
 try {
  const token = req.body.token
  const payload = jwt.verify(token, secret)
  if (Date.now() > payload.exp){ 
    return res.send({error : "token expired"})
  }
  res.send("ok")
 } catch (error) {
  res.send({error: error.message})
 }
})

app.post("/register/", async (req, res) => {
  try {
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const contraseña = req.body.contraseña;
    const hash = await argon2.hash(contraseña);
    const insertQuery =
    `INSERT INTO public.users (nombre, correo, contraseña)
      VALUES ($1, $2, $3)
      RETURNING id, nombre, correo;`;
    const result = await pool.query(insertQuery, [nombre, correo, hash]);
    const insertedUser = result.rows[0];
    res.status(201).json(insertedUser);
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({error});
  }
});

app.get("/usuarios", async (req, res) => {
  try {
    const query = `
    SELECT
    public.users.id,
	  public.users.nombre,
    ARRAY_AGG(public.citas.id_cita) AS id_citas,
    ARRAY_AGG(public.citas.fecha_cita) AS fechas_citas,
    ARRAY_AGG(public.citas.clave) AS claves_citas
    FROM
    public.users
    JOIN
    public.citas ON public.users.id = public.citas.id
    GROUP BY
    public.users.id
    ORDER BY
    public.users.id ASC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/usuarios_citas", async (req, res) => {
  try {
    const query = `
    SELECT
    public.users.id,
    public.users.nombre,
    public.citas.*
    FROM
    public.users
    JOIN
    public.citas ON public.users.id = public.citas.id
    WHERE
    public.citas.clave = 'A'
    ORDER BY
    public.citas.fecha_cita ASC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
