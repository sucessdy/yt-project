import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
const app = express();

// app.use(cors( {
//     origin : process.env.CORS_ORIGIN,
//     credentials :true
// }))

app.use(cors());
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));



app.get("/", (req, res) => {
  return res.send("hare krishna");
});

app.use("/api", userRouter);


export default app;
