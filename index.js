import express from "express";
import cors from "cors";
const app = express();

app.use(cors());

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("el servidor esta conectado en el puerto " + port);
});

app.get("/", (req,res) =>{
    res.send("Hola, render y ramon es gay")
})