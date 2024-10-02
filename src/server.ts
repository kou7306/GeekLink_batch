import dotenv from "dotenv";
dotenv.config();

import { app, server } from "./app.js";
import { config } from "./config/config.js";

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
