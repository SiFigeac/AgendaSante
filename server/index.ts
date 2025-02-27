import express from "express";
import { log } from "./vite";

console.log('Starting server with minimal configuration...');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Root route
app.get("/", (_req, res) => {
  console.log("Root request received");
  res.send("Server is running");
});

// Test route
app.get("/ping", (_req, res) => {
  console.log("Ping request received");
  res.send("pong");
});

// Basic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 404 handler (retained from original for completeness)
app.use((req, res) => {
  log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not Found' });
});


const port = 5000;
const server = app.listen({
  port,
  host: "0.0.0.0",
}, (err?: Error) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
