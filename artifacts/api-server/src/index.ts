import http from "http";
import app from "./app";
import { initGameServer } from "./game-server";

const rawPort = process.env["PORT"] || "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = http.createServer(app);
initGameServer(httpServer);

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
