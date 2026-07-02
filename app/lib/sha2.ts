// SHA-2 family (SHA-224, SHA-256, SHA-384, SHA-512) implemented from
// scratch per FIPS 180-4. The round constants and initial hash values are
// derived at module load from the fractional parts of the square/cube roots
// of the first primes, exactly as the standard defines them, using integer
// root extraction over BigInt (no floating point, no typo-prone tables).

export type Sha2Variant = "SHA-224" | "SHA-256" | "SHA-384" | "SHA-512";

const MASK64 = (1n << 64n) - 1n;

function firstPrimes(count: number): bigint[] {
  const primes: bigint[] = [];
  for (let n = 2n; primes.length < count; n++) {
    let isPrime = true;
    for (const p of primes) {
      if (p * p > n) break;
      if (n % p === 0n) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(n);
  }
  return primes;
}

// floor(n^(1/k)) via Newton's method on integers.
function iroot(n: bigint, k: bigint): bigint {
  if (n < 2n) return n;
  const bits = n.toString(2).length;
  let x = 1n << BigInt(Math.ceil(bits / Number(k)) + 1);
  while (true) {
    const y = ((k - 1n) * x + n / x ** (k - 1n)) / k;
    if (y >= x) return x;
    x = y;
  }
}

// First 64 fractional bits of sqrt(p) / cbrt(p).
const sqrtFrac64 = (p: bigint) => iroot(p << 128n, 2n) & MASK64;
const cbrtFrac64 = (p: bigint) => iroot(p << 192n, 3n) & MASK64;

const PRIMES = firstPrimes(80);

// SHA-256/224 use the high 32 bits of the fractional parts.
const K256 = PRIMES.slice(0, 64).map((p) => Number(cbrtFrac64(p) >> 32n));
const H256 = PRIMES.slice(0, 8).map((p) => Number(sqrtFrac64(p) >> 32n));
// SHA-224 IV: the *second* 32 bits of sqrt of the 9th–16th primes.
const H224 = PRIMES.slice(8, 16).map((p) => Number(sqrtFrac64(p) & 0xffffffffn));

const K512 = PRIMES.map(cbrtFrac64);
const H512 = PRIMES.slice(0, 8).map(sqrtFrac64);
const H384 = PRIMES.slice(8, 16).map(sqrtFrac64);

function rotr32(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

function sha256Core(data: Uint8Array, iv: number[], outWords: number): string {
  const bitLen = data.length * 8;
  const padded = new Uint8Array(Math.ceil((data.length + 9) / 64) * 64);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 4294967296), false);
  view.setUint32(padded.length - 4, bitLen >>> 0, false);

  const h = [...iv];
  const w = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K256[i] + w[i]) | 0;
      const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hh) | 0;
  }

  return h
    .slice(0, outWords)
    .map((x) => (x >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function rotr64(x: bigint, n: bigint): bigint {
  return ((x >> n) | (x << (64n - n))) & MASK64;
}

function sha512Core(data: Uint8Array, iv: bigint[], outWords: number): string {
  const bitLen = BigInt(data.length) * 8n;
  const padded = new Uint8Array(Math.ceil((data.length + 17) / 128) * 128);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setBigUint64(padded.length - 16, bitLen >> 64n, false);
  view.setBigUint64(padded.length - 8, bitLen & MASK64, false);

  const h = [...iv];
  const w: bigint[] = new Array(80);

  for (let offset = 0; offset < padded.length; offset += 128) {
    for (let i = 0; i < 16; i++) w[i] = view.getBigUint64(offset + i * 8, false);
    for (let i = 16; i < 80; i++) {
      const s0 = rotr64(w[i - 15], 1n) ^ rotr64(w[i - 15], 8n) ^ (w[i - 15] >> 7n);
      const s1 = rotr64(w[i - 2], 19n) ^ rotr64(w[i - 2], 61n) ^ (w[i - 2] >> 6n);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & MASK64;
    }

    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 80; i++) {
      const S1 = rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n);
      const ch = (e & f) ^ (~e & MASK64 & g);
      const t1 = (hh + S1 + ch + K512[i] + w[i]) & MASK64;
      const S0 = rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) & MASK64;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) & MASK64;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) & MASK64;
    }

    h[0] = (h[0] + a) & MASK64;
    h[1] = (h[1] + b) & MASK64;
    h[2] = (h[2] + c) & MASK64;
    h[3] = (h[3] + d) & MASK64;
    h[4] = (h[4] + e) & MASK64;
    h[5] = (h[5] + f) & MASK64;
    h[6] = (h[6] + g) & MASK64;
    h[7] = (h[7] + hh) & MASK64;
  }

  return h
    .slice(0, outWords)
    .map((x) => x.toString(16).padStart(16, "0"))
    .join("");
}

export function sha2(message: string, variant: Sha2Variant): string {
  const data = new TextEncoder().encode(message);
  switch (variant) {
    case "SHA-224":
      return sha256Core(data, H224, 7);
    case "SHA-256":
      return sha256Core(data, H256, 8);
    case "SHA-384":
      return sha512Core(data, H384, 6);
    case "SHA-512":
      return sha512Core(data, H512, 8);
  }
}
