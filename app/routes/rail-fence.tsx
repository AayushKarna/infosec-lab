import { useState } from "react";
import type { Route } from "./+types/rail-fence";
import { buildFence, railFenceDecrypt, railFenceEncrypt } from "../lib/rail-fence";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Rail Fence Cipher" }];
}

const FENCE_LIMIT = 40;

export default function RailFence() {
  const [text, setText] = useState("");
  const [rails, setRails] = useState(3);
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");

  const result =
    mode === "encrypt" ? railFenceEncrypt(text, rails) : railFenceDecrypt(text, rails);
  const plaintext = mode === "encrypt" ? text : result;
  const fence =
    plaintext.length > 0 && plaintext.length <= FENCE_LIMIT
      ? buildFence(plaintext, rails)
      : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 inline-flex rounded-md border border-gray-300 dark:border-gray-700">
          {(["encrypt", "decrypt"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium capitalize first:rounded-l-md last:rounded-r-md ${
                mode === m
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />

        <label className="mt-4 mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rails
        </label>
        <input
          type="number"
          min={2}
          max={20}
          value={rails}
          onChange={(e) =>
            setRails(Math.max(2, Math.min(20, Number(e.target.value) || 2)))
          }
          className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />

        <label className="mt-4 mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
        </label>
        <div className="min-h-10 rounded-md bg-gray-100 p-3 font-mono text-sm break-all text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          {result || <span className="text-gray-400">—</span>}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Zigzag layout
        </h2>
        {fence ? (
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1 font-mono text-sm">
              <tbody>
                {fence.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className={`h-6 w-6 text-center ${
                          cell !== null
                            ? "rounded bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200"
                            : "text-gray-300 dark:text-gray-700"
                        }`}
                      >
                        {cell ?? "·"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {plaintext.length === 0
              ? "Enter some text to see the fence."
              : `Visualization is shown for texts up to ${FENCE_LIMIT} characters.`}
          </p>
        )}
      </div>
    </div>
  );
}
