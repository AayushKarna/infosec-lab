import { useEffect, useRef } from "react";
import { data, Form, Link, redirect, useNavigate, useNavigation } from "react-router";
import toast from "react-hot-toast";
import type { Route } from "./+types/login";
import { createUserSession, getUserId, hashPassword } from "../lib/auth.server";
import { db } from "../lib/db.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (await getUserId(request)) throw redirect("/dashboard");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return data({ error: "Email and password are required." }, { status: 400 });
  }

  const { rows } = await db.query(
    "SELECT id, first_name, password_hash FROM users WHERE email = $1",
    [email],
  );
  const user = rows[0];
  if (!user || user.password_hash !== hashPassword(password)) {
    return data({ error: "Invalid email or password." }, { status: 401 });
  }

  return data(
    { success: true, firstName: user.first_name as string },
    { headers: { "Set-Cookie": await createUserSession(user.id) } },
  );
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const busy = navigation.state === "submitting";

  useEffect(() => {
    if (!actionData) return;
    if ("success" in actionData) {
      formRef.current?.reset();
      toast.success(`Welcome back, ${actionData.firstName}!`);
      navigate("/dashboard");
    } else if (actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData, navigate]);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Login</h2>

        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          🔒 This login uses <strong>SHA-256</strong>.
        </div>

        <Form ref={formRef} method="post" className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Logging in…" : "Login"}
          </button>
        </Form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
