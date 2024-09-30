import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(express.json());

// CORSの設定
const corsOptions = {
  origin: "*",
  methods: ["*"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
};

app.use(cors(corsOptions));
// ルートに対するハンドラを追加
app.get("/", (req, res) => {
  res.send("Hello World");
});

export { app, server };
