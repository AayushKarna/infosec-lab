import { useState } from "react";
import type { Route } from "./+types/sha2";
import { sha2, type Sha2Variant } from "../lib/sha2";

export function meta({}: Route.MetaArgs) {
  return [{ title: "SHA2" }];
}

const VARIANTS: { name: Sha2Variant; bits: number; blockBits: number }[] = [
  { name: "SHA-224", bits: 224, blockBits: 512 },
  { name: "SHA-256", bits: 256, blockBits: 512 },
  { name: "SHA-384", bits: 384, blockBits: 1024 },
  { name: "SHA-512", bits: 512, blockBits: 1024 },
];

export default function Sha2() {
  const [input, setInput] = useState("");
  const [variant, setVariant] = useState<Sha2Variant>("SHA-256");
  const digest = sha2(input, variant);
  const info = VARIANTS.find((v) => v.name === variant)!;
  const byteLength = new TextEncoder().encode(input).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Variant
        </p>
        <div
          role="group"
          aria-label="SHA-2 variant"
          className="mb-4 inline-flex max-w-full overflow-x-auto rounded-md border border-gray-300 dark:border-gray-700"
        >
          {VARIANTS.map((v) => (
            <button
              key={v.name}
              onClick={() => setVariant(v.name)}
              aria-pressed={variant === v.name}
              className={`px-4 py-2 text-sm font-medium first:rounded-l-md last:rounded-r-md ${
                variant === v.name
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {info.bits}-bit digest, {info.blockBits}-bit blocks
        </p>

        <label
          htmlFor="sha2-input"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Message
        </label>
        <textarea
          id="sha2-input"
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
          {variant} digest ({info.bits} bits)
        </p>
        <div className="rounded-md bg-gray-100 p-3 font-mono text-sm break-all text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          {digest}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          All variants for the current message
        </h2>
        <div className="space-y-3">
          {VARIANTS.map((v) => (
            <div key={v.name}>
              <span className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                {v.name}
              </span>
              <p className="font-mono text-xs break-all text-gray-700 dark:text-gray-300">
                {sha2(input, v.name)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
