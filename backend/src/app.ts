import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";

export const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use(morgan("dev"));

app.use("/api", apiRouter);

app.use(notFoundHandler);

app.use(errorHandler);