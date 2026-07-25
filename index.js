import "dotenv/config";
import express from "express";

import app from "./src/app.js";

const PORT = process.env.PORT 
import DBconnect from "./src/db/db.js";

let server;
async function startServer() {
  await DBconnect();
  server = app.listen(PORT,  () => {
    console.log(`server is running :  ${PORT}`);
  });
}

startServer();
