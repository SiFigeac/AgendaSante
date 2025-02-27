import { type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPatientSchema, insertAppointmentSchema, insertUserSchema, insertAvailabilitySchema } from "@shared/schema";
import { WebSocketServer } from 'ws';

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

export function registerRoutes(app: any): Server {
  setupAuth(app);

  // Routes d'administration
  app.get("/api/admin/users", checkPermission("admin:read"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  app.post("/api/admin/users", checkPermission("admin:create"), async (req: AuthenticatedRequest, res: Response) => {
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

  app.patch("/api/admin/users/:id", checkPermission("admin:update"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updated = await storage.updateUser(userId, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  app.delete("/api/admin/users/:id", checkPermission("admin:delete"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteUser(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  });

  // Routes d'availability
  app.get("/api/availability", checkPermission("availability:read"), async (req: AuthenticatedRequest, res: Response) => {
    const availabilities = await storage.getAvailabilities();
    res.json(availabilities);
  });

  app.post("/api/availability", checkPermission("availability:create"), async (req: AuthenticatedRequest, res: Response) => {
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

  app.patch("/api/availability/:id", checkPermission("availability:update"), async (req: AuthenticatedRequest, res: Response) => {
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

  app.delete("/api/availability/:id", checkPermission("availability:delete"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteAvailability(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting availability:', error);
      res.status(500).json({ error: "Erreur lors de la suppression de la disponibilité" });
    }
  });

  // Patient routes
  app.get("/api/patients", checkPermission("patient:read"), async (req: AuthenticatedRequest, res: Response) => {
    const patients = await storage.getPatients();
    res.json(patients);
  });

  app.post("/api/patients", checkPermission("patient:create"), async (req: AuthenticatedRequest, res: Response) => {
    const parsed = insertPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const patient = await storage.createPatient(parsed.data);
    res.status(201).json(patient);
  });

  app.get("/api/patients/:id", checkPermission("patient:read"), async (req: AuthenticatedRequest, res: Response) => {
    const patient = await storage.getPatient(parseInt(req.params.id));
    if (!patient) return res.status(404).send();
    res.json(patient);
  });

  app.patch("/api/patients/:id", checkPermission("patient:update"), async (req: AuthenticatedRequest, res: Response) => {
    const updated = await storage.updatePatient(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/patients/:id", checkPermission("patient:delete"), async (req: AuthenticatedRequest, res: Response) => {
    await storage.deletePatient(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Appointment routes
  app.get("/api/appointments", checkPermission("appointment:read"), async (req: AuthenticatedRequest, res: Response) => {
    const appointments = await storage.getAppointments();
    res.json(appointments);
  });

  app.post("/api/appointments", checkPermission("appointment:create"), async (req: AuthenticatedRequest, res: Response) => {
    const parsed = insertAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const appointment = await storage.createAppointment(parsed.data);
    res.status(201).json(appointment);
  });

  app.get("/api/appointments/:id", checkPermission("appointment:read"), async (req: AuthenticatedRequest, res: Response) => {
    const appointment = await storage.getAppointment(parseInt(req.params.id));
    if (!appointment) return res.status(404).send();
    res.json(appointment);
  });

  app.patch("/api/appointments/:id", checkPermission("appointment:update"), async (req: AuthenticatedRequest, res: Response) => {
    const updated = await storage.updateAppointment(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/appointments/:id", checkPermission("appointment:delete"), async (req: AuthenticatedRequest, res: Response) => {
    await storage.deleteAppointment(parseInt(req.params.id));
    res.sendStatus(204);
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time updates
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