import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = Number(process.env.PORT) || 4000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("Database connected");

    const server = app.listen(PORT, () => {
      console.log(
        `Server running at http://localhost:${PORT}`,
      );
    });

    const shutdown = async () => {
      console.log("Shutting down...");

      await prisma.$disconnect();

      server.close(() => {
        console.log("Server stopped");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server");
    console.error(error);

    process.exit(1);
  }
}

void startServer();