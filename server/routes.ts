import { type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPatientSchema, insertAppointmentSchema, insertUserSchema, insertAvailabilitySchema } from "@shared/schema";
import { WebSocketServer } from 'ws';
import { Router } from "express";

interface AuthenticatedRequest extends Request {
  user?: Express.User;
  isAuthenticated(): this is AuthenticatedRequest;
}

export function createApiRouter() {
  const router = Router();

  // Ensure all API responses are JSON
  router.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
  });

  // Test routes
  router.get("/ping", (_req, res) => {
    console.log("Ping request received");
    res.json({ message: "pong" });
  });

  // Setup auth routes on the router
  setupAuth(router);

  // Routes d'administration
  router.get("/admin/users", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  router.post("/admin/users", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error });
      }
      const user = await storage.createUser(parsed.data);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
    }
  });

  // Routes des disponibilités
  router.get("/availability", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    const availabilities = await storage.getAvailabilities();
    res.json(availabilities);
  });

  router.post("/availability", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Non authentifié" });
      }
      const parsed = insertAvailabilitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error });
      }
      const availability = await storage.createAvailability(parsed.data);
      res.status(201).json(availability);
    } catch (error) {
      console.error('Error creating availability:', error);
      res.status(500).json({ error: "Erreur lors de la création de la disponibilité" });
    }
  });

  // Routes des patients
  router.get("/patients", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    const patients = await storage.getPatients();
    res.json(patients);
  });

  router.post("/patients", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    const parsed = insertPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const patient = await storage.createPatient(parsed.data);
    res.status(201).json(patient);
  });

  router.get("/patients/:id", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    const patient = await storage.getPatient(parseInt(req.params.id));
    if (!patient) return res.status(404).send();
    res.json(patient);
  });

  // Routes des rendez-vous
  router.get("/appointments", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    const appointments = await storage.getAppointments();
    res.json(appointments);
  });

  router.post("/appointments", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    const parsed = insertAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const appointment = await storage.createAppointment(parsed.data);
    res.status(201).json(appointment);
  });

  router.get("/appointments/:id", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    const appointment = await storage.getAppointment(parseInt(req.params.id));
    if (!appointment) return res.status(404).send();
    res.json(appointment);
  });

  return router;
}

export function registerRoutes(app: any): Server {
  const apiRouter = createApiRouter();
  app.use('/api', apiRouter); // Mount the API router at /api

  // Setup WebSocket server for real-time updates
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      console.log('Received:', message);
    });

    ws.on('error', console.error);
  });

  return httpServer;
}