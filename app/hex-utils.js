// app/hex-utils.js

export function offsetToCube(col, row) {
  const q = col - (row - (row & 1)) / 2;
  const r = row;
  return { q, r, s: -q - r };
}

export function cubeToOffset(q, r, s) {
  const col = q + (r - (r & 1)) / 2;
  const row = r;
  return { col, row };
}

export function hexDistance(h1, h2) {
  return (Math.abs(h1.q - h2.q) + Math.abs(h1.r - h2.r) + Math.abs(h1.s - h2.s)) / 2;
}

function cubeRound(fracQ, fracR, fracS) {
  let q = Math.round(fracQ);
  let r = Math.round(fracR);
  let s = Math.round(fracS);

  const qDiff = Math.abs(q - fracQ);
  const rDiff = Math.abs(r - fracR);
  const sDiff = Math.abs(s - fracS);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }
  return { q, r, s };
}

export function hexLine(startHex, endHex) {
  const N = hexDistance(startHex, endHex);
  if (N === 0) return [startHex];

  const results = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const fracQ = startHex.q + (endHex.q - startHex.q) * t;
    const fracR = startHex.r + (endHex.r - startHex.r) * t;
    const fracS = startHex.s + (endHex.s - startHex.s) * t;
    const rounded = cubeRound(fracQ, fracR, fracS);
    const offsetCoords = cubeToOffset(rounded.q, rounded.r, rounded.s);
    results.push({ ...offsetCoords, ...rounded, id: `${offsetCoords.col}-${offsetCoords.row}` });
  }

  const uniqueResults = [];
  const seen = new Set();
  for (const hex of results) {
    const key = `${hex.q}-${hex.r}`;
    if (!seen.has(key)) {
      uniqueResults.push(hex);
      seen.add(key);
    }
  }
  return uniqueResults;
}

export function getHexesInRadius(
  centerHex,
  radius,
  allHexesMap,
  gridWidth,
  gridHeight
) {
  if (radius === 1) {
    const centerKey = `${centerHex.col}-${centerHex.row}`;
    const hex = allHexesMap.get(centerKey);
    return hex ? [hex] : [];
  }
  const results = [];

  for (let q_offset = -radius + 1; q_offset < radius; q_offset++) {
    for (let r_offset = Math.max(-radius + 1, -q_offset - radius + 1); r_offset < Math.min(radius, -q_offset + radius); r_offset++) {
      const s_offset = -q_offset - r_offset;
      const targetQ = centerHex.q + q_offset;
      const targetR = centerHex.r + r_offset;
      const { col, row } = cubeToOffset(targetQ, targetR, -targetQ - targetR);

      if (col >= 0 && col < gridWidth && row >= 0 && row < gridHeight) {
        const key = `${col}-${row}`;
        const hex = allHexesMap.get(key);
        if (hex && hexDistance(centerHex, hex) < radius) {
          results.push(hex);
        }
      }
    }
  }
  const centerKey = `${centerHex.col}-${centerHex.row}`;
  const cHex = allHexesMap.get(centerKey);
  if (cHex && !results.find(h => h.id === cHex.id)) {
    results.push(cHex);
  }
  return results.filter(Boolean);
}

export function getHexAt(
  coords,
  allHexesMap,
  gridWidth,
  gridHeight
) {
  if (coords.col < 0 || coords.col >= gridWidth || coords.row < 0 || coords.row >= gridHeight) {
    return undefined;
  }
  const key = `${coords.col}-${coords.row}`;
  return allHexesMap.get(key);
}