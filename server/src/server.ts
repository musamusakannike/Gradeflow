import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { connectDatabase } from "./config/db.config";

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDatabase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// API Routes
app.use("/api/v1", routes);

// Base route
app.get("/", (req, res) => {
  res.send("GradeFlow API is running!");
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});