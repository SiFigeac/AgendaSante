import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPatientSchema, insertAppointmentSchema, insertUserSchema, insertAvailabilitySchema } from "@shared/schema";

function isAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.isAdmin) return res.sendStatus(403);
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Routes d'administration
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/admin/users", isAdmin, async (req, res) => {
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

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updated = await storage.updateUser(userId, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteUser(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  });

  // Routes d'availability
  app.get("/api/availability", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const availabilities = await storage.getAvailabilities();
    res.json(availabilities);
  });

  app.post("/api/availability", isAdmin, async (req, res) => {
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

  app.patch("/api/availability/:id", isAdmin, async (req, res) => {
    try {
      const availabilityId = parseInt(req.params.id);
      if (isNaN(availabilityId)) {
        return res.status(400).json({ error: "ID de disponibilité invalide" });
      }

      // Validation des dates
      const startTime = new Date(req.body.startTime);
      const endTime = new Date(req.body.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return res.status(400).json({ error: "Dates invalides" });
      }

      if (startTime >= endTime) {
        return res.status(400).json({
          error: "La date de début doit être antérieure à la date de fin"
        });
      }

      // Vérifier si la disponibilité existe
      const existing = await storage.getAvailability(availabilityId);
      if (!existing) {
        return res.status(404).json({
          error: "Cette plage horaire n'existe pas"
        });
      }

      const availability = await storage.updateAvailability(availabilityId, {
        ...req.body,
        startTime,
        endTime,
      });

      res.json(availability);
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({
        error: "Erreur lors de la mise à jour de la disponibilité",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  app.delete("/api/availability/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteAvailability(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting availability:', error);
      res.status(500).json({ error: "Erreur lors de la suppression de la disponibilité" });
    }
  });

  // Patient routes
  app.get("/api/patients", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const patients = await storage.getPatients();
    res.json(patients);
  });

  app.post("/api/patients", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const patient = await storage.createPatient(parsed.data);
    res.status(201).json(patient);
  });

  app.get("/api/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const patient = await storage.getPatient(parseInt(req.params.id));
    if (!patient) return res.sendStatus(404);
    res.json(patient);
  });

  app.patch("/api/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const updated = await storage.updatePatient(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deletePatient(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Appointment routes
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const appointments = await storage.getAppointments();
    res.json(appointments);
  });

  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const appointment = await storage.createAppointment(parsed.data);
    res.status(201).json(appointment);
  });

  app.get("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const appointment = await storage.getAppointment(parseInt(req.params.id));
    if (!appointment) return res.sendStatus(404);
    res.json(appointment);
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const updated = await storage.updateAppointment(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteAppointment(parseInt(req.params.id));
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}