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

// Axial directions (cube components sum to 0)
// These represent the change in (q, r, s) to move one step in that direction.
export const CUBE_DIRECTIONS = [
  { q: 1,  r: 0,  s: -1, direction: "east" },      // East
  { q: -1, r: 0,  s: 1,  direction: "west" },      // West
  { q: 0,  r: -1, s: 1,  direction: "northWest" }, // North-West (axial)
  { q: 1,  r: -1, s: 0,  direction: "northEast" }, // North-East (axial)
  { q: -1, r: 1,  s: 0,  direction: "southWest" }, // South-West (axial)
  { q: 0,  r: 1,  s: -1, direction: "southEast" }  // South-East (axial)
];

// Direction names based on common usage for "odd-r" offset coordinates.
// This mapping helps if you need to relate cube directions to offset descriptions.
// Note: The exact naming ("north", "south") can be ambiguous in hex grids.
// This example prioritizes the axial direction names.
export const OFFSET_DIRECTION_NAMES = {
    east: "East",
    west: "West",
    northWest: "North-West",
    northEast: "North-East",
    southWest: "South-West",
    southEast: "South-East",
};


export function getDirection(sourceHex, targetHex) {
  const sourceCube = sourceHex.q !== undefined ? sourceHex : offsetToCube(sourceHex.col, sourceHex.row);
  const targetCube = targetHex.q !== undefined ? targetHex : offsetToCube(targetHex.col, targetHex.row);

  const dq = targetCube.q - sourceCube.q;
  const dr = targetCube.r - sourceCube.r;
  const ds = targetCube.s - sourceCube.s;

  for (const dir of CUBE_DIRECTIONS) {
    // For directly adjacent hexes, the diff will exactly match a direction vector.
    // We can normalize or simplify for non-adjacent if needed, but for connections, they should be adjacent.
    if (dir.q === dq && dir.r === dr && dir.s === ds) {
      return dir.direction;
    }
  }
  // Fallback or error if not directly adjacent or an issue occurs
  // This might happen if hexes are not perfectly adjacent or there's a calculation error.
  // For robust connection logic, you might want to find the *closest* direction.
  console.warn("getDirection: Hexes are not directly adjacent or direction unclear.", sourceHex, targetHex);
  return null;
}

export function getOppositeDirection(direction) {
  switch (direction) {
    case "east": return "west";
    case "west": return "east";
    case "northEast": return "southWest";
    case "southWest": return "northEast";
    case "northWest": return "southEast";
    case "southEast": return "northWest";
    default:
      console.warn("getOppositeDirection: Unknown direction", direction);
      return null;
  }
}

export function getAdjacentHexCoords(sourceHexCoords, direction) {
  const sourceCube = sourceHexCoords.q !== undefined
    ? { q: sourceHexCoords.q, r: sourceHexCoords.r, s: sourceHexCoords.s }
    : offsetToCube(sourceHexCoords.col, sourceHexCoords.row);

  const dirVector = CUBE_DIRECTIONS.find(d => d.direction === direction);

  if (!dirVector) {
    console.warn("getAdjacentHexCoords: Unknown direction", direction);
    return null;
  }

  const newQ = sourceCube.q + dirVector.q;
  const newR = sourceCube.r + dirVector.r;
  const newS = sourceCube.s + dirVector.s; // For completeness, though cubeToOffset only needs q,r

  const offsetCoords = cubeToOffset(newQ, newR, newS);

  return {
    col: offsetCoords.col,
    row: offsetCoords.row,
    q: newQ,
    r: newR,
    s: newS,
    id: `${offsetCoords.col}-${offsetCoords.row}`
  };
}