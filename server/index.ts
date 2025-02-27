import express from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);

console.log('Starting server with minimal configuration...');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create HTTP server
const port = 5000;
const server = createServer(app);

(async () => {
  try {
    // Setup Vite first
    console.log('Setting up Vite...');
    await setupVite(app, server);
    console.log('Vite setup complete');

    // Then add API routes
    app.get("/api", (_req, res) => {
      console.log("API root request received");
      res.json({ status: "API is running" });
    });

    app.get("/api/ping", (_req, res) => {
      console.log("Ping request received");
      res.send("pong");
    });

    // Setup basic auth
    const sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    });

    app.use(session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
      try {
        const user = await storage.getUser(id);
        done(null, user);
      } catch (error) {
        done(error);
      }
    });

    // Basic login route
    app.post("/api/login", async (req, res) => {
      try {
        const { username, password } = req.body;
        const user = await storage.getUserByUsername(username);

        if (!user) {
          return res.status(401).json({ error: "Identifiants invalides" });
        }

        res.json(user);
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: "Erreur interne du serveur" });
      }
    });

    // Error handler
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Server Error:', err);
      res.status(500).json({ error: "Internal Server Error" });
    });

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Setting up static file serving for production...');
      serveStatic(app);
    }

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