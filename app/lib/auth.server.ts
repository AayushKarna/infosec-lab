import { createCookieSessionStorage, redirect } from "react-router";
import { db } from "./db.server";
import { sha2 } from "./sha2";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Passwords are hashed with our own SHA-256 implementation (app/lib/sha2.ts).
// Unsalted, as required for the lab — real systems should use a slow, salted
// KDF like bcrypt or argon2.
export function hashPassword(password: string): string {
  return sha2(password, "SHA-256");
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET ?? "insecure-dev-secret"],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  },
});

export async function createUserSession(userId: number): Promise<string> {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  return sessionStorage.commitSession(session);
}

export async function getUserId(request: Request): Promise<number | null> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  return typeof userId === "number" ? userId : null;
}

export async function getUser(request: Request): Promise<User | null> {
  const userId = await getUserId(request);
  if (userId === null) return null;
  const { rows } = await db.query(
    "SELECT id, first_name, last_name, email FROM users WHERE id = $1",
    [userId],
  );
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    firstName: rows[0].first_name,
    lastName: rows[0].last_name,
    email: rows[0].email,
  };
}

export async function requireUser(request: Request): Promise<User> {
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  return user;
}

export async function logout(request: Request): Promise<Response> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
