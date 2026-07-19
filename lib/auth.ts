import { cookies } from "next/headers";
import dbConnect from "./db";
import { User } from "./models";
import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const SESSION_COOKIE_NAME = "certdrop_session";

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  gid?: string;
}

/**
 * Gets the current logged-in organizer session from cookies
 */
export async function getOrganizerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    // Decode base64 session data
    const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const sessionData = JSON.parse(decoded) as SessionData;

    // Verify user exists in DB
    await dbConnect();
    const userExists = await User.findById(sessionData.userId);
    if (!userExists) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error("Failed to parse session", error);
    return null;
  }
}

/**
 * Sets a session cookie for the organizer
 */
export async function setOrganizerSession(userData: {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  gid?: string;
}) {
  const sessionData: SessionData = {
    userId: userData.id,
    email: userData.email,
    name: userData.name,
    avatar: userData.avatar,
    gid: userData.gid,
  };

  const encoded = Buffer.from(JSON.stringify(sessionData)).toString("base64");
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

/**
 * Clears the session cookie
 */
export async function clearOrganizerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Helper to get or create a mock Google user for the demo flow
 */
export async function getOrCreateDemoUser() {
  await dbConnect();
  
  // Find or create default demo user
  const email = "ambassador@google.com";
  let user = await User.findOne({ email });
  
  if (!user) {
    user = await User.create({
      name: "Google Developer Ambassador",
      email,
      password: hashPassword("demo1234"),
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    });
  }
  
  return user;
}
