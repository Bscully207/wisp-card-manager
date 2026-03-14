import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { sessionMiddleware } from "./lib/session.js";
import router from "./routes/index.js";

const app: Express = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionMiddleware);

app.use("/api", router);

export default app;
