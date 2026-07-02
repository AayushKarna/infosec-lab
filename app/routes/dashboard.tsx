import { Link } from "react-router";
import type { Route } from "./+types/dashboard";
import { requireUser } from "../lib/auth.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return { user: await requireUser(request) };
}

const topics = [
  { to: "/rail-fence", label: "Rail Fence Cipher", note: "Transposition cipher" },
  { to: "/rsa", label: "RSA Encryption", note: "Public-key cryptography" },
  { to: "/md5", label: "MD5", note: "128-bit message digest" },
  { to: "/sha2", label: "SHA2", note: "SHA-224/256/384/512" },
];

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Welcome, {user.firstName} {user.lastName}!
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          You are logged in as {user.email}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <Link
            key={topic.to}
            to={topic.to}
            className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-blue-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {topic.label}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {topic.note}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
