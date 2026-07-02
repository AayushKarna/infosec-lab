import { useEffect } from "react";
import { data, Form, useNavigation } from "react-router";
import toast from "react-hot-toast";
import type { Route } from "./+types/profile";
import { requireUser } from "../lib/auth.server";
import { db } from "../lib/db.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit Profile" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return { user: await requireUser(request) };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const form = await request.formData();
  const firstName = String(form.get("firstName") ?? "").trim();
  const lastName = String(form.get("lastName") ?? "").trim();

  if (!firstName || !lastName) {
    return data({ error: "Both names are required." }, { status: 400 });
  }

  await db.query("UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3", [
    firstName,
    lastName,
    user.id,
  ]);

  return data({ success: true });
}

export default function Profile({ loaderData, actionData }: Route.ComponentProps) {
  const { user } = loaderData;
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";

  useEffect(() => {
    if (!actionData) return;
    if ("success" in actionData) {
      toast.success("Profile updated!");
    } else if (actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Edit Profile
        </h2>

        <Form method="post" className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                First name
              </label>
              <input
                type="text"
                name="firstName"
                required
                defaultValue={user.firstName}
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
                defaultValue={user.lastName}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </Form>
      </div>
    </div>
  );
}
