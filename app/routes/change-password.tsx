import { useEffect, useRef } from "react";
import { data, Form, useNavigation } from "react-router";
import toast from "react-hot-toast";
import type { Route } from "./+types/change-password";
import { hashPassword, requireUser } from "../lib/auth.server";
import { db } from "../lib/db.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Change Password" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const form = await request.formData();
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return data({ error: "All fields are required." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return data({ error: "New password must be at least 6 characters." }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return data({ error: "New passwords do not match." }, { status: 400 });
  }

  const { rows } = await db.query("SELECT password_hash FROM users WHERE id = $1", [
    user.id,
  ]);
  if (rows[0]?.password_hash !== hashPassword(currentPassword)) {
    return data({ error: "Current password is incorrect." }, { status: 401 });
  }

  await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    hashPassword(newPassword),
    user.id,
  ]);

  return data({ success: true });
}

export default function ChangePassword({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const busy = navigation.state === "submitting";

  useEffect(() => {
    if (!actionData) return;
    if ("success" in actionData) {
      formRef.current?.reset();
      toast.success("Password changed!");
    } else if (actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Change Password
        </h2>

        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          🔒 Passwords are hashed with <strong>SHA-256</strong>.
        </div>

        <Form ref={formRef} method="post" className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current password
            </label>
            <input
              type="password"
              name="currentPassword"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              New password
            </label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm new password
            </label>
            <input
              type="password"
              name="confirmPassword"
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
            {busy ? "Changing…" : "Change Password"}
          </button>
        </Form>
      </div>
    </div>
  );
}
