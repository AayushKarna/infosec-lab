import { useState } from "react";
import type { Route } from "./+types/md5";
import { md5 } from "../lib/md5";

export function meta({}: Route.MetaArgs) {
  return [{ title: "MD5" }];
}

export default function Md5() {
  const [input, setInput] = useState("");
  const digest = md5(input);
  const byteLength = new TextEncoder().encode(input).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <label
          htmlFor="md5-input"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Message
        </label>
        <textarea
          id="md5-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {byteLength} byte{byteLength === 1 ? "" : "s"} (UTF-8) — the digest
          updates as you type
        </p>

        <p className="mt-4 mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          MD5 digest (128 bits)
        </p>
        <div className="rounded-md bg-gray-100 p-3 font-mono text-sm break-all text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          {digest}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          RFC 1321 test vectors
        </h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase dark:text-gray-400">
              <th scope="col" className="pb-2 pr-4 font-semibold">
                Input
              </th>
              <th scope="col" className="pb-2 font-semibold">
                Digest
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs text-gray-700 dark:text-gray-300">
            {["", "a", "abc", "message digest"].map((vector) => (
              <tr key={vector} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4">
                  {vector === "" ? <em className="text-gray-400">(empty)</em> : `"${vector}"`}
                </td>
                <td className="py-2 break-all">{md5(vector)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
