import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Information Security Lab" },
    { name: "description", content: "Information Security Lab — Aayush Karna" },
  ];
}

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Welcome
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Select a topic from the sidebar to get started.
      </p>
    </div>
  );
}
