import express from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { createApiRouter } from "./routes";

console.log('Starting server initialization...');

const app = express();
const port = 5000;
const server = createServer(app);

(async () => {
  try {
    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Mount API router first
    console.log('Setting up API routes...');
    const apiRouter = createApiRouter();
    app.use('/api', apiRouter);
    console.log('API routes setup complete');

    // Then setup Vite
    console.log('Setting up Vite...');
    await setupVite(app, server);
    console.log('Vite setup complete');


    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Setting up static file serving...');
      serveStatic(app);
    }

    // Error handler
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Server Error:', err);
      res.status(500).json({ error: "Internal Server Error" });
    });

    // 404 handler (after all other routes)
    app.use((req, res) => {
      log(`404 Not Found: ${req.method} ${req.path}`);
      res.status(404).json({ error: 'Not Found' });
    });

    // Start the server
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      console.log(`Server running on port ${port}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
})();