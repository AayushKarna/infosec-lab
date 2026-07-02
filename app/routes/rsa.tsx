import { useState } from "react";
import type { Route } from "./+types/rsa";
import {
  blocksToHex,
  decryptBlocks,
  encryptText,
  generateKeyPair,
  hexToBlocks,
  type RsaKeyPair,
} from "../lib/rsa";

export function meta({}: Route.MetaArgs) {
  return [{ title: "RSA Encryption" }];
}

const KEY_SIZES = [64, 128, 256, 512, 1024];

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
        {label}
      </span>
      <p className="font-mono text-xs break-all text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

export default function Rsa() {
  const [bits, setBits] = useState(256);
  const [keys, setKeys] = useState<RsaKeyPair | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [cipherHex, setCipherHex] = useState("");
  const [decrypted, setDecrypted] = useState("");
  const [error, setError] = useState("");

  function handleGenerate() {
    setBusy(true);
    setError("");
    // Let the button re-render to its busy state before the (synchronous)
    // key generation blocks the main thread.
    setTimeout(() => {
      try {
        setKeys(generateKeyPair(bits));
        setCipherHex("");
        setDecrypted("");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    }, 30);
  }

  function handleEncrypt() {
    if (!keys) return;
    setError("");
    try {
      setCipherHex(blocksToHex(encryptText(message, keys)));
      setDecrypted("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDecrypt() {
    if (!keys) return;
    setError("");
    try {
      setDecrypted(decryptBlocks(hexToBlocks(cipherHex), keys));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          1. Key generation
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Modulus size
          </label>
          <select
            value={bits}
            onChange={(e) => setBits(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            {KEY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} bits
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Generating…" : "Generate Keys"}
          </button>
        </div>

        {keys && (
          <div className="mt-4 space-y-3">
            <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
              <p className="mb-2 text-xs font-semibold text-green-700 dark:text-green-400">
                Public key (n, e)
              </p>
              <div className="space-y-2">
                <KeyValue label={`n (${keys.bits} bits)`} value={keys.n.toString()} />
                <KeyValue label="e" value={keys.e.toString()} />
              </div>
            </div>
            <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
              <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-400">
                Private key (d)
              </p>
              <KeyValue label="d" value={keys.d.toString()} />
            </div>
            <details className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
              <summary className="cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                Internals (p, q, φ(n))
              </summary>
              <div className="mt-2 space-y-2">
                <KeyValue label="p" value={keys.p.toString()} />
                <KeyValue label="q" value={keys.q.toString()} />
                <KeyValue label="φ(n) = (p−1)(q−1)" value={keys.phi.toString()} />
              </div>
            </details>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          2. Encrypt — c = mᵉ mod n
        </h2>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />
        <button
          onClick={handleEncrypt}
          disabled={!keys}
          className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Encrypt
        </button>
        {!keys && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Generate a key pair first.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          3. Decrypt — m = cᵈ mod n
        </h2>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ciphertext (hex blocks)
        </label>
        <textarea
          value={cipherHex}
          onChange={(e) => setCipherHex(e.target.value)}
          rows={4}
          placeholder="Encrypt a message above, or paste hex blocks separated by spaces"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />
        <button
          onClick={handleDecrypt}
          disabled={!keys || cipherHex.trim() === ""}
          className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Decrypt
        </button>
        {decrypted && (
          <div className="mt-3">
            <span className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
              Recovered plaintext
            </span>
            <div className="mt-1 rounded-md bg-gray-100 p-3 font-mono text-sm break-all text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              {decrypted}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
