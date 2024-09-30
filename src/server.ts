import dotenv from "dotenv";
dotenv.config();

import { app, server } from "./app";
import { config } from "./config/config";

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
