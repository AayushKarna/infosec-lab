// Rail Fence (zigzag) transposition cipher.

function railPattern(length: number, rails: number): number[] {
  const rows: number[] = new Array(length);
  let row = 0;
  let dir = 1;
  for (let i = 0; i < length; i++) {
    rows[i] = row;
    if (row === 0) dir = 1;
    else if (row === rails - 1) dir = -1;
    row += dir;
  }
  return rows;
}

export function railFenceEncrypt(text: string, rails: number): string {
  if (rails < 2 || text.length === 0) return text;
  const pattern = railPattern(text.length, rails);
  const rows: string[] = new Array(rails).fill("");
  for (let i = 0; i < text.length; i++) {
    rows[pattern[i]] += text[i];
  }
  return rows.join("");
}

export function railFenceDecrypt(cipher: string, rails: number): string {
  if (rails < 2 || cipher.length === 0) return cipher;
  const pattern = railPattern(cipher.length, rails);

  // Count how many characters land on each rail, then find where each
  // rail's segment starts inside the ciphertext.
  const counts = new Array(rails).fill(0);
  for (const row of pattern) counts[row]++;
  const cursors: number[] = new Array(rails);
  let offset = 0;
  for (let r = 0; r < rails; r++) {
    cursors[r] = offset;
    offset += counts[r];
  }

  // Walk the zigzag again, pulling the next character from the
  // corresponding rail segment.
  const plain: string[] = new Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) {
    plain[i] = cipher[cursors[pattern[i]]++];
  }
  return plain.join("");
}

// Grid of the zigzag layout for visualization: grid[rail][column] is the
// character at that position, or null for an empty cell.
export function buildFence(text: string, rails: number): (string | null)[][] {
  const safeRails = Math.max(1, rails);
  const grid: (string | null)[][] = Array.from({ length: safeRails }, () =>
    new Array<string | null>(text.length).fill(null),
  );
  if (text.length === 0) return grid;
  const pattern = safeRails < 2 ? new Array(text.length).fill(0) : railPattern(text.length, safeRails);
  for (let i = 0; i < text.length; i++) {
    grid[pattern[i]][i] = text[i];
  }
  return grid;
}
