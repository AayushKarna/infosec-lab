import { useEffect, useRef } from "react";
import { data, Form, Link, redirect, useNavigate, useNavigation } from "react-router";
import toast from "react-hot-toast";
import type { Route } from "./+types/signup";
import { getUserId, hashPassword } from "../lib/auth.server";
import { db } from "../lib/db.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sign Up" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (await getUserId(request)) throw redirect("/dashboard");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const firstName = String(form.get("firstName") ?? "").trim();
  const lastName = String(form.get("lastName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!firstName || !lastName || !email || !password) {
    return data({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return data({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await db.query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return data({ error: "An account with this email already exists." }, { status: 409 });
  }

  await db.query(
    "INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4)",
    [firstName, lastName, email, hashPassword(password)],
  );

  return data({ success: true });
}

export default function Signup({ actionData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const busy = navigation.state === "submitting";

  useEffect(() => {
    if (!actionData) return;
    if ("success" in actionData) {
      formRef.current?.reset();
      toast.success("Account created! Please log in.");
      navigate("/login");
    } else if (actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData, navigate]);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign Up</h2>

        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          🔒 This login uses <strong>SHA-256</strong>.
        </div>

        <Form ref={formRef} method="post" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                First name
              </label>
              <input
                type="text"
                name="firstName"
                required
                autoComplete="given-name"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last name
              </label>
              <input
                type="text"
                name="lastName"
                required
                autoComplete="family-name"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Creating account…" : "Sign Up"}
          </button>
        </Form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
