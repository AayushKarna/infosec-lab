// RSA implemented from scratch with BigInt: random prime generation
// (Miller-Rabin), extended Euclid for the private exponent, and block-based
// text encryption. Educational textbook RSA — no OAEP padding.

export interface RsaKeyPair {
  p: bigint;
  q: bigint;
  n: bigint;
  phi: bigint;
  e: bigint;
  d: bigint;
  bits: number;
}

export function bitLength(x: bigint): number {
  return x <= 0n ? 0 : x.toString(2).length;
}

export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function modInverse(a: bigint, m: bigint): bigint {
  let [r0, r1] = [m, a % m];
  let [t0, t1] = [0n, 1n];
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [t0, t1] = [t1, t0 - q * t1];
  }
  if (r0 !== 1n) throw new Error("modular inverse does not exist");
  return ((t0 % m) + m) % m;
}

function randomBigInt(bits: number): bigint {
  const bytes = new Uint8Array(Math.ceil(bits / 8));
  crypto.getRandomValues(bytes);
  let x = 0n;
  for (const b of bytes) x = (x << 8n) | BigInt(b);
  return x & ((1n << BigInt(bits)) - 1n);
}

function randomBelow(max: bigint): bigint {
  const bits = bitLength(max);
  while (true) {
    const r = randomBigInt(bits);
    if (r < max) return r;
  }
}

const SMALL_PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

export function isProbablePrime(n: bigint, rounds = 20): boolean {
  if (n < 2n) return false;
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }

  // Write n - 1 as d * 2^r with d odd.
  let d = n - 1n;
  let r = 0n;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    r++;
  }

  for (let i = 0; i < rounds; i++) {
    const a = 2n + randomBelow(n - 3n);
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let j = 1n; j < r; j++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

function randomPrime(bits: number): bigint {
  while (true) {
    // Force the top bit (so the prime has exactly `bits` bits) and the
    // low bit (odd).
    const candidate = randomBigInt(bits) | (1n << BigInt(bits - 1)) | 1n;
    if (isProbablePrime(candidate)) return candidate;
  }
}

export function generateKeyPair(bits: number): RsaKeyPair {
  if (bits < 32) throw new Error("key size must be at least 32 bits");
  const half = Math.floor(bits / 2);
  while (true) {
    const p = randomPrime(half);
    const q = randomPrime(bits - half);
    if (p === q) continue;

    const n = p * q;
    const phi = (p - 1n) * (q - 1n);

    let e = phi > 65537n ? 65537n : 3n;
    while (gcd(e, phi) !== 1n) e += 2n;
    if (e >= phi) continue;

    const d = modInverse(e, phi);
    return { p, q, n, phi, e, d, bits: bitLength(n) };
  }
}

// Payload bytes per block. Each block is prefixed with a 0x01 marker byte
// (to preserve leading zero bytes), and the total must stay below n.
function blockSize(n: bigint): number {
  const size = Math.floor((bitLength(n) - 1) / 8) - 1;
  if (size < 1) throw new Error("modulus too small to encrypt data");
  return size;
}

export function encryptText(message: string, key: { e: bigint; n: bigint }): bigint[] {
  const data = new TextEncoder().encode(message);
  const size = blockSize(key.n);
  const blocks: bigint[] = [];
  for (let i = 0; i < data.length; i += size) {
    let m = 1n; // 0x01 marker
    for (const byte of data.subarray(i, i + size)) {
      m = (m << 8n) | BigInt(byte);
    }
    blocks.push(modPow(m, key.e, key.n));
  }
  return blocks;
}

export function decryptBlocks(blocks: bigint[], key: { d: bigint; n: bigint }): string {
  const bytes: number[] = [];
  for (const c of blocks) {
    if (c < 0n || c >= key.n) throw new Error("ciphertext block out of range");
    let m = modPow(c, key.d, key.n);
    const chunk: number[] = [];
    while (m > 0n) {
      chunk.unshift(Number(m & 0xffn));
      m >>= 8n;
    }
    if (chunk.shift() !== 1) throw new Error("invalid block (wrong key or corrupted data)");
    bytes.push(...chunk);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function blocksToHex(blocks: bigint[]): string {
  return blocks.map((b) => b.toString(16)).join(" ");
}

export function hexToBlocks(hex: string): bigint[] {
  const parts = hex.trim().split(/\s+/).filter(Boolean);
  return parts.map((part) => {
    if (!/^[0-9a-fA-F]+$/.test(part)) throw new Error(`invalid hex block: "${part}"`);
    return BigInt("0x" + part);
  });
}
