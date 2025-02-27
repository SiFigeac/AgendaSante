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
    // Attendre un peu avant d'initialiser le store pour laisser le temps à la base de données de démarrer
    setTimeout(() => {
      console.log('Initializing PostgreSQL session store...');
      this.sessionStore = new PostgresSessionStore({
        pool,
        createTableIfMissing: true,
      });
      console.log('PostgreSQL session store initialized');
    }, 1000);
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error in getUser:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    try {
      const [patient] = await db.insert(patients).values(insertPatient).returning();
      return patient;
    } catch (error) {
      console.error('Error in createPatient:', error);
      throw error;
    }
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    try {
      const [patient] = await db.select().from(patients).where(eq(patients.id, id));
      return patient;
    } catch (error) {
      console.error('Error in getPatient:', error);
      throw error;
    }
  }

  async getPatients(): Promise<Patient[]> {
    try {
      return await db.select().from(patients);
    } catch (error) {
      console.error('Error in getPatients:', error);
      throw error;
    }
  }

  async updatePatient(id: number, update: Partial<Patient>): Promise<Patient> {
    try {
      const [patient] = await db
        .update(patients)
        .set(update)
        .where(eq(patients.id, id))
        .returning();
      if (!patient) throw new Error("Patient not found");
      return patient;
    } catch (error) {
      console.error('Error in updatePatient:', error);
      throw error;
    }
  }

  async deletePatient(id: number): Promise<void> {
    try {
      await db.delete(patients).where(eq(patients.id, id));
    } catch (error) {
      console.error('Error in deletePatient:', error);
      throw error;
    }
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    try {
      const [appointment] = await db
        .insert(appointments)
        .values(insertAppointment)
        .returning();
      return appointment;
    } catch (error) {
      console.error('Error in createAppointment:', error);
      throw error;
    }
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    try {
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, id));
      return appointment;
    } catch (error) {
      console.error('Error in getAppointment:', error);
      throw error;
    }
  }

  async getAppointments(): Promise<Appointment[]> {
    try {
      return await db.select().from(appointments);
    } catch (error) {
      console.error('Error in getAppointments:', error);
      throw error;
    }
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    try {
      return await db
        .select()
        .from(appointments)
        .where(eq(appointments.patientId, patientId));
    } catch (error) {
      console.error('Error in getAppointmentsByPatient:', error);
      throw error;
    }
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    try {
      return await db
        .select()
        .from(appointments)
        .where(eq(appointments.doctorId, doctorId));
    } catch (error) {
      console.error('Error in getAppointmentsByDoctor:', error);
      throw error;
    }
  }

  async updateAppointment(id: number, update: Partial<Appointment>): Promise<Appointment> {
    try {
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
    } catch (error) {
      console.error('Error in updateAppointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: number): Promise<void> {
    try {
      await db.delete(appointments).where(eq(appointments.id, id));
    } catch (error) {
      console.error('Error in deleteAppointment:', error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  }

  async updateUser(id: number, update: Partial<User>): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set(update)
        .where(eq(users.id, id))
        .returning();
      if (!user) throw new Error("User not found");
      return user;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    try {
      const [newAvailability] = await db
        .insert(availabilityTable)
        .values(insertAvailability)
        .returning();
      return newAvailability;
    } catch (error) {
      console.error('Error in createAvailability:', error);
      throw error;
    }
  }

  async getAvailability(id: number): Promise<Availability | undefined> {
    try {
      const [avail] = await db
        .select()
        .from(availabilityTable)
        .where(eq(availabilityTable.id, id));
      return avail;
    } catch (error) {
      console.error('Error in getAvailability:', error);
      throw error;
    }
  }

  async getAvailabilities(): Promise<Availability[]> {
    try {
      return await db.select().from(availabilityTable);
    } catch (error) {
      console.error('Error in getAvailabilities:', error);
      throw error;
    }
  }

  async getAvailabilitiesByDoctor(doctorId: number): Promise<Availability[]> {
    try {
      return await db
        .select()
        .from(availabilityTable)
        .where(eq(availabilityTable.doctorId, doctorId));
    } catch (error) {
      console.error('Error in getAvailabilitiesByDoctor:', error);
      throw error;
    }
  }

  async updateAvailability(id: number, update: Partial<Availability>): Promise<Availability> {
    try {
      // Vérifier si la disponibilité existe
      const [existing] = await db
        .select()
        .from(availabilityTable)
        .where(eq(availabilityTable.id, id));

      if (!existing) {
        throw new Error("Cette plage horaire n'existe pas");
      }

      // Formater et valider les dates
      const startTime = update.startTime ? new Date(update.startTime) : existing.startTime;
      const endTime = update.endTime ? new Date(update.endTime) : existing.endTime;

      // Vérifier la validité des dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error("Les dates fournies sont invalides");
      }

      // Vérifier que la date de début est avant la date de fin
      if (startTime >= endTime) {
        throw new Error("La date de début doit être antérieure à la date de fin");
      }

      // Effectuer la mise à jour
      const [updated] = await db
        .update(availabilityTable)
        .set({
          ...update,
          startTime,
          endTime,
        })
        .where(eq(availabilityTable.id, id))
        .returning();

      if (!updated) {
        throw new Error("Échec de la mise à jour de la plage horaire");
      }

      return updated;
    } catch (error) {
      console.error('Error in updateAvailability:', error);
      throw error instanceof Error ? error : new Error("Erreur lors de la mise à jour");
    }
  }

  async deleteAvailability(id: number): Promise<void> {
    try {
      await db.delete(availabilityTable).where(eq(availabilityTable.id, id));
    } catch (error) {
      console.error('Error in deleteAvailability:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();