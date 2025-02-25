import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  const hashedPassword = await hashPassword("poiuy13579");
  
  await db.insert(users).values({
    username: "Admin",
    password: hashedPassword,
    firstName: "Admin",
    lastName: "Admin",
    role: "admin",
    isAdmin: true,
    isActive: true,
    permissions: [],
  }).onConflictDoNothing();

  console.log("Admin user created successfully");
  process.exit(0);
}

createAdmin().catch(console.error);
