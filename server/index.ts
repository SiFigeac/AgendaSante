import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Validate required environment variables
const requiredEnvVars = ['SESSION_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is not set`);
    process.exit(1);
  }
}

console.log('Starting server initialization...');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test route for basic connectivity
app.get("/ping", (_req, res) => {
  console.log("Ping request received");
  res.send("pong");
});

// Enhanced request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  console.log(`Incoming request: ${req.method} ${path}`);

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log requests on completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }
    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }
    log(logLine);
  });

  next();
});

(async () => {
  try {
    console.log('Initializing routes...');
    const server = await registerRoutes(app);
    console.log('Routes initialized successfully');

    // Error handling middleware
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      console.error('Server Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message}`);
      res.status(status).json({ error: message });
    });

    // 404 handler
    app.use((req, res) => {
      log(`404 Not Found: ${req.method} ${req.path}`);
      res.status(404).json({ error: 'Not Found' });
    });

    if (app.get("env") === "development") {
      console.log('Setting up Vite for development...');
      await setupVite(app, server);
      console.log('Vite setup complete');
    } else {
      console.log('Setting up static serving for production...');
      serveStatic(app);
    }

    // Enhanced server startup
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, (err?: Error) => {
      if (err) {
        console.error("Error starting server:", err);
        process.exit(1);
      }
      log(`Server running on port ${port}`);
    });

    // Add error handler for the server
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
})();