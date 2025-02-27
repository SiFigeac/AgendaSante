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

function checkPermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      if (!req.user || !req.user.permissions?.includes(permission)) {
        return res.status(403).json({ error: "Permission refusée" });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      next(error);
    }
  };
}

function isAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Accès administrateur requis" });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    next(error);
  }
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
  router.get("/admin/users", checkPermission("admin:read"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  router.post("/admin/users", checkPermission("admin:create"), async (req: AuthenticatedRequest, res: Response) => {
    try {
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

  router.patch("/admin/users/:id", checkPermission("admin:update"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updated = await storage.updateUser(userId, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  router.delete("/admin/users/:id", checkPermission("admin:delete"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteUser(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  });

  // Routes d'availability
  router.get("/availability", checkPermission("availability:read"), async (req: AuthenticatedRequest, res: Response) => {
    const availabilities = await storage.getAvailabilities();
    res.json(availabilities);
  });

  router.post("/availability", checkPermission("availability:create"), async (req: AuthenticatedRequest, res: Response) => {
    try {
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

  router.patch("/availability/:id", checkPermission("availability:update"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validation de l'ID
      const availabilityId = parseInt(req.params.id);
      if (isNaN(availabilityId)) {
        return res.status(400).json({
          error: "ID de disponibilité invalide"
        });
      }

      // Tenter la mise à jour
      const availability = await storage.updateAvailability(availabilityId, req.body);
      res.json(availability);

    } catch (error) {
      console.error('Error updating availability:', error);
      const message = error instanceof Error ? error.message : "Erreur inconnue";

      // Gestion spécifique des erreurs
      if (message.includes("n'existe pas")) {
        return res.status(404).json({ error: message });
      }
      if (message.includes("date")) {
        return res.status(400).json({ error: message });
      }

      res.status(500).json({
        error: "Erreur lors de la mise à jour de la disponibilité",
        details: message
      });
    }
  });

  router.delete("/availability/:id", checkPermission("availability:delete"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteAvailability(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting availability:', error);
      res.status(500).json({ error: "Erreur lors de la suppression de la disponibilité" });
    }
  });

  // Patient routes
  router.get("/patients", checkPermission("patient:read"), async (req: AuthenticatedRequest, res: Response) => {
    const patients = await storage.getPatients();
    res.json(patients);
  });

  router.post("/patients", checkPermission("patient:create"), async (req: AuthenticatedRequest, res: Response) => {
    const parsed = insertPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const patient = await storage.createPatient(parsed.data);
    res.status(201).json(patient);
  });

  router.get("/patients/:id", checkPermission("patient:read"), async (req: AuthenticatedRequest, res: Response) => {
    const patient = await storage.getPatient(parseInt(req.params.id));
    if (!patient) return res.status(404).send();
    res.json(patient);
  });

  router.patch("/patients/:id", checkPermission("patient:update"), async (req: AuthenticatedRequest, res: Response) => {
    const updated = await storage.updatePatient(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  router.delete("/patients/:id", checkPermission("patient:delete"), async (req: AuthenticatedRequest, res: Response) => {
    await storage.deletePatient(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Appointment routes
  router.get("/appointments", checkPermission("appointment:read"), async (req: AuthenticatedRequest, res: Response) => {
    const appointments = await storage.getAppointments();
    res.json(appointments);
  });

  router.post("/appointments", checkPermission("appointment:create"), async (req: AuthenticatedRequest, res: Response) => {
    const parsed = insertAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const appointment = await storage.createAppointment(parsed.data);
    res.status(201).json(appointment);
  });

  router.get("/appointments/:id", checkPermission("appointment:read"), async (req: AuthenticatedRequest, res: Response) => {
    const appointment = await storage.getAppointment(parseInt(req.params.id));
    if (!appointment) return res.status(404).send();
    res.json(appointment);
  });

  router.patch("/appointments/:id", checkPermission("appointment:update"), async (req: AuthenticatedRequest, res: Response) => {
    const updated = await storage.updateAppointment(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  router.delete("/appointments/:id", checkPermission("appointment:delete"), async (req: AuthenticatedRequest, res: Response) => {
    await storage.deleteAppointment(parseInt(req.params.id));
    res.sendStatus(204);
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