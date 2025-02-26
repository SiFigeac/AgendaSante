import { users, patients, appointments, availability as availabilityTable, type User, type InsertUser, type Patient, type InsertPatient, type Appointment, type InsertAppointment, type Availability, type InsertAvailability } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Patient operations
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatients(): Promise<Patient[]>;
  updatePatient(id: number, patient: Partial<Patient>): Promise<Patient>;
  deletePatient(id: number): Promise<void>;

  // Appointment operations  
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  // Availability operations
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  getAvailability(id: number): Promise<Availability | undefined>;
  getAvailabilities(): Promise<Availability[]>;
  getAvailabilitiesByDoctor(doctorId: number): Promise<Availability[]>;
  updateAvailability(id: number, update: Partial<Availability>): Promise<Availability>;
  deleteAvailability(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async updatePatient(id: number, update: Partial<Patient>): Promise<Patient> {
    const [patient] = await db
      .update(patients)
      .set(update)
      .where(eq(patients.id, id))
      .returning();
    if (!patient) throw new Error("Patient not found");
    return patient;
  }

  async deletePatient(id: number): Promise<void> {
    await db.delete(patients).where(eq(patients.id, id));
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId));
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId));
  }

  async updateAppointment(id: number, update: Partial<Appointment>): Promise<Appointment> {
    // Assurez-vous que les dates sont au bon format
    const formattedUpdate = {
      ...update,
      startTime: update.startTime ? new Date(update.startTime) : undefined,
      endTime: update.endTime ? new Date(update.endTime) : undefined,
    };

    const [appointment] = await db
      .update(appointments)
      .set(formattedUpdate)
      .where(eq(appointments.id, id))
      .returning();
    if (!appointment) throw new Error("Appointment not found");
    return appointment;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, update: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    const [newAvailability] = await db
      .insert(availabilityTable)
      .values(insertAvailability)
      .returning();
    return newAvailability;
  }

  async getAvailability(id: number): Promise<Availability | undefined> {
    const [avail] = await db
      .select()
      .from(availabilityTable)
      .where(eq(availabilityTable.id, id));
    return avail;
  }

  async getAvailabilities(): Promise<Availability[]> {
    return await db.select().from(availabilityTable);
  }

  async getAvailabilitiesByDoctor(doctorId: number): Promise<Availability[]> {
    return await db
      .select()
      .from(availabilityTable)
      .where(eq(availabilityTable.doctorId, doctorId));
  }

  async updateAvailability(id: number, update: Partial<Availability>): Promise<Availability> {
    try {
      // Ensure dates are properly formatted as Date objects
      const formattedUpdate = {
        ...update,
        startTime: update.startTime ? new Date(update.startTime) : undefined,
        endTime: update.endTime ? new Date(update.endTime) : undefined,
      };

      // Validate dates
      if (formattedUpdate.startTime && formattedUpdate.endTime &&
          formattedUpdate.startTime >= formattedUpdate.endTime) {
        throw new Error("La date de début doit être antérieure à la date de fin");
      }

      const [avail] = await db
        .update(availabilityTable)
        .set(formattedUpdate)
        .where(eq(availabilityTable.id, id))
        .returning();

      if (!avail) throw new Error("Cette plage horaire n'existe pas");
      return avail;
    } catch (error) {
      console.error('Error in updateAvailability:', error);
      throw error instanceof Error ? error : new Error("Erreur inconnue lors de la mise à jour");
    }
  }

  async deleteAvailability(id: number): Promise<void> {
    await db.delete(availabilityTable).where(eq(availabilityTable.id, id));
  }
}

export const storage = new DatabaseStorage();