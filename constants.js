// File: app/constants.js

export const AppMode = {
  HEX_EDITOR: 'hex_editor',
  PLAYER: 'player',
};

export const ViewMode = {
  TWOD: '2d',
  THREED: '3d',
};

export const ElevationBrushMode = {
  INCREASE: 'increase',
  DECREASE: 'decrease',
  SET_TO_VALUE: 'set_to_value',
};

export const PaintMode = {
  ELEVATION: 'elevation',
  TERRAIN: 'terrain',
  FEATURE: 'feature',
};

export const FeatureBrushAction = {
    ADD: 'add',
    REMOVE: 'remove'
};

export const TerrainFeature = {
  NONE: 'none',
  LANDMARK: 'LANDMARK',
  SECRET: 'SECRET',
};

// ==================================================================
// TERRAIN MASTER DATA
// Central source of truth for all terrain types.
// The TerrainType and TERRAIN_TYPES_CONFIG exports are generated from this object.
// ==================================================================

const TERRAIN_METADATA = {
  // --- Terrestrial - Mundane/Semi-Mundane ---
  ROLLING_PLAINS: {
    id: 'rolling_plains', name: 'Rolling Plains', symbol: '🌾', color: 'fill-green-400',
    speedMultiplier: 1, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(134, 239, 172)', mid: 'rgb(74, 222, 128)', high: 'rgb(34, 197, 94)' },
    elevationThresholds: { mid: 50, high: 150 },
  },
  TALLGRASS_PRAIRIE: {
    id: 'tallgrass_prairie', name: 'Tallgrass Prairie', symbol: '🌿', color: 'fill-lime-600',
    speedMultiplier: 1.2, visibilityFactor: 0.9, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(100, 150, 70)', mid: 'rgb(120, 170, 90)', high: 'rgb(140, 190, 110)' },
    elevationThresholds: { mid: 50, high: 200 },
  },
  SHORTGRASS_STEPPE: {
    id: 'shortgrass_steppe', name: 'Shortgrass Steppe', symbol: '🐎', color: 'fill-amber-300',
    speedMultiplier: 0.9, visibilityFactor: 1.1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(180, 180, 100)', mid: 'rgb(190, 190, 120)', high: 'rgb(200, 200, 140)' },
    elevationThresholds: { mid: 100, high: 400 },
  },
  OAK_FOREST: {
    id: 'oak_forest', name: 'Oak Forest', symbol: '🌳', color: 'fill-green-700',
    speedMultiplier: 1.8, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 5, canopyBlockage: 15,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(40, 100, 30)', mid: 'rgb(50, 110, 40)', high: 'rgb(60, 120, 50)' },
    elevationThresholds: { mid: 100, high: 300 },
  },
  PINE_FOREST: {
    id: 'pine_forest', name: 'Pine Forest', symbol: '🌲', color: 'fill-emerald-800',
    speedMultiplier: 1.9, visibilityFactor: 0.55, baseInherentVisibilityBonus: -1, prominence: 5, canopyBlockage: 17,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(10, 80, 50)', mid: 'rgb(20, 90, 60)', high: 'rgb(30, 100, 70)' },
    elevationThresholds: { mid: 150, high: 500 },
  },
  BIRCH_FOREST: {
    id: 'birch_forest', name: 'Birch Forest', symbol: '🤍', color: 'fill-lime-500',
    speedMultiplier: 1.6, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 3, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(120, 160, 90)', mid: 'rgb(130, 170, 100)', high: 'rgb(140, 180, 110)' },
    elevationThresholds: { mid: 100, high: 300 },
  },
  GRASSY_HILLS: {
    id: 'grassy_hills', name: 'Grassy Hills', symbol: '⛰️', color: 'fill-amber-600',
    speedMultiplier: 1.5, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 20, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(218, 165, 32)', mid: 'rgb(228, 175, 42)', high: 'rgb(238, 185, 52)' },
    elevationThresholds: { mid: 300, high: 600 },
  },
  ROCKY_FOOTHILLS: {
    id: 'rocky_foothills', name: 'Rocky Foothills', symbol: '🪨', color: 'fill-stone-700',
    speedMultiplier: 1.8, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 25, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(140, 110, 80)', mid: 'rgb(150, 120, 90)', high: 'rgb(160, 130, 100)' },
    elevationThresholds: { mid: 400, high: 800 },
  },
  ALPINE_TUNDRA: {
    id: 'alpine_tundra', name: 'Alpine Tundra', symbol: '❄️', color: 'fill-gray-400',
    speedMultiplier: 2.2, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(110, 120, 100)', mid: 'rgb(120, 130, 110)', high: 'rgb(130, 140, 120)' },
    elevationThresholds: { mid: 2000, high: 3000 },
  },
  COASTAL_BEACH: {
    id: 'coastal_beach', name: 'Coastal Beach', symbol: '🏖️', color: 'fill-yellow-100',
    speedMultiplier: 1, visibilityFactor: 1.1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(255, 245, 190)', mid: 'rgb(255, 250, 200)', high: 'rgb(255, 255, 210)' },
    elevationThresholds: { mid: 1, high: 5 },
  },
  FRESHWATER_SWAMP: {
    id: 'freshwater_swamp', name: 'Freshwater Swamp', symbol: '🐊', color: 'fill-teal-700',
    speedMultiplier: 2.5, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 1, canopyBlockage: 8,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(13, 148, 136)', mid: 'rgb(23, 158, 146)', high: 'rgb(33, 168, 156)' },
    elevationThresholds: { mid: -5, high: 10 },
  },
  REED_MARSH: {
    id: 'reed_marsh', name: 'Reed Marsh', symbol: '🌾', color: 'fill-teal-500',
    speedMultiplier: 2.8, visibilityFactor: 0.7, baseInherentVisibilityBonus: 0, prominence: 1, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(30, 120, 110)', mid: 'rgb(40, 130, 120)', high: 'rgb(50, 140, 130)' },
    elevationThresholds: { mid: -2, high: 5 },
  },
  SAND_DUNES_DESERT: {
    id: 'sand_dunes_desert', name: 'Sand Dunes Desert', symbol: '🏜️', color: 'fill-yellow-300',
    speedMultiplier: 1.5, visibilityFactor: 1.2, baseInherentVisibilityBonus: 1, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(250, 204, 21)', mid: 'rgb(255, 214, 31)', high: 'rgb(255, 224, 41)' },
    elevationThresholds: { mid: 200, high: 600 },
  },
  ROCKY_INFERTILE_DESERT: {
    id: 'rocky_infertile_desert', name: 'Rocky Infertile Desert', symbol: '🌵', color: 'fill-amber-700',
    speedMultiplier: 1.3, visibilityFactor: 1.1, baseInherentVisibilityBonus: 0, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(200, 160, 80)', mid: 'rgb(210, 170, 90)', high: 'rgb(220, 180, 100)' },
    elevationThresholds: { mid: 300, high: 700 },
  },
  ARCTIC_ICE_FLATS: {
    id: 'arctic_ice_flats', name: 'Arctic Ice Flats', symbol: '❄️', color: 'fill-cyan-200',
    speedMultiplier: 1.5, visibilityFactor: 1.2, baseInherentVisibilityBonus: 1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(207, 250, 254)', mid: 'rgb(217, 252, 255)', high: 'rgb(227, 255, 255)' },
    elevationThresholds: { mid: 0, high: 50 },
  },

  // --- Terrestrial - Lore-Inspired & Exotic ---
  SAVANNA_WOODLAND: {
    id: 'savanna_woodland', name: 'Savanna Woodland', symbol: '🌳', color: 'fill-yellow-500',
    speedMultiplier: 1.1, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 5, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(160, 190, 70)', mid: 'rgb(170, 200, 80)', high: 'rgb(180, 210, 90)' },
    elevationThresholds: { mid: 100, high: 400 },
  },
  RAINFOREST_JUNGLE: {
    id: 'rainforest_jungle', name: 'Rainforest Jungle', symbol: '🌴', color: 'fill-green-900',
    speedMultiplier: 3.5, visibilityFactor: 0.15, baseInherentVisibilityBonus: -3, prominence: 10, canopyBlockage: 25,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(4, 120, 87)', mid: 'rgb(14, 130, 97)', high: 'rgb(24, 140, 107)' },
    elevationThresholds: { mid: 100, high: 500 },
  },
  MANGROVE_COAST: {
    id: 'mangrove_coast', name: 'Mangrove Coast', symbol: '🌿', color: 'fill-emerald-700',
    speedMultiplier: 3.5, visibilityFactor: 0.3, baseInherentVisibilityBonus: -2, prominence: 8, canopyBlockage: 18,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(60, 100, 90)', mid: 'rgb(70, 110, 100)', high: 'rgb(80, 120, 110)' },
    elevationThresholds: { mid: -2, high: 2 },
  },
  CLOUD_MIST_FOREST: {
    id: 'cloud_mist_forest', name: 'Cloud Mist Forest', symbol: '☁️', color: 'fill-gray-300',
    speedMultiplier: 2.8, visibilityFactor: 0.2, baseInherentVisibilityBonus: -3, prominence: 10, canopyBlockage: 15,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(150, 190, 170)', mid: 'rgb(160, 200, 180)', high: 'rgb(170, 210, 190)' },
    elevationThresholds: { mid: 1000, high: 2000 },
  },
  GLACIAL_FJORDS: {
    id: 'glacial_fjords', name: 'Glacial Fjords', symbol: '🧊🌊', color: 'fill-blue-600',
    speedMultiplier: 2.5, visibilityFactor: 0.9, baseInherentVisibilityBonus: 0, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(40, 120, 180)', mid: 'rgb(50, 130, 190)', high: 'rgb(60, 140, 200)' },
    elevationThresholds: { mid: -50, high: 0 },
  },
  SALT_FLATS_DRY: {
    id: 'salt_flats_dry', name: 'Dry Salt Flats', symbol: '🧂', color: 'fill-stone-100',
    speedMultiplier: 1.2, visibilityFactor: 1.3, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(240, 240, 230)', mid: 'rgb(245, 245, 235)', high: 'rgb(250, 250, 240)' },
    elevationThresholds: { mid: -10, high: 10 },
  },
  CRIMSON_CANYON_LANDS: {
    id: 'crimson_canyon_lands', name: 'Crimson Canyon Lands', symbol: '🏜️', color: 'fill-red-800',
    speedMultiplier: 3.5, visibilityFactor: 0.9, baseInherentVisibilityBonus: -1, prominence: 50, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(234, 88, 12)', mid: 'rgb(244, 98, 22)', high: 'rgb(254, 108, 32)' },
    elevationThresholds: { mid: 200, high: 600 },
  },
  GEOTHERMAL_SPRINGS: {
    id: 'geothermal_springs', name: 'Geothermal Springs', symbol: '♨️', color: 'fill-orange-600',
    speedMultiplier: 3, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(255, 120, 0)', mid: 'rgb(255, 140, 20)', high: 'rgb(255, 160, 40)' },
    elevationThresholds: { mid: 50, high: 150 },
  },
  ANCIENT_OVERGROWN_RUINS: {
    id: 'ancient_overgrown_ruins', name: 'Ancient Overgrown Ruins', symbol: '🏛️', color: 'fill-gray-700',
    speedMultiplier: 2.5, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 20, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(130, 120, 110)', mid: 'rgb(140, 130, 120)', high: 'rgb(150, 140, 130)' },
    elevationThresholds: { mid: 100, high: 300 },
  },
  METEORITE_IMPACT_CRATER: {
    id: 'meteorite_impact_crater', name: 'Meteorite Impact Crater', symbol: '🌑', color: 'fill-gray-800',
    speedMultiplier: 3, visibilityFactor: 0.5, baseInherentVisibilityBonus: -2, prominence: 50, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(70, 60, 50)', mid: 'rgb(80, 70, 60)', high: 'rgb(90, 80, 70)' },
    elevationThresholds: { mid: 0, high: 100 },
  },
  SHALLOW_QUICKSAND_PIT: {
    id: 'shallow_quicksand_pit', name: 'Shallow Quicksand Pit', symbol: '⏳', color: 'fill-yellow-700',
    speedMultiplier: 4, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(161, 98, 7)', mid: 'rgb(171, 108, 17)', high: 'rgb(181, 118, 27)' },
    elevationThresholds: { mid: -5, high: 0 },
  },
  SINKING_TAR_PITS: {
    id: 'sinking_tar_pits', name: 'Sinking Tar Pits', symbol: '🕳️', color: 'fill-neutral-900',
    speedMultiplier: 999, visibilityFactor: 0.3, baseInherentVisibilityBonus: -3, prominence: 0, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 20, 20)', mid: 'rgb(30, 30, 30)', high: 'rgb(40, 40, 40)' },
    elevationThresholds: { mid: -10, high: 0 },
  },
  DEEP_MIRE: {
    id: 'deep_mire', name: 'Deep Mire', symbol: '🕳️', color: 'fill-gray-800',
    speedMultiplier: 999, visibilityFactor: 0.4, baseInherentVisibilityBonus: -2, prominence: 0, canopyBlockage: 3,
    isImpassable: true, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 30, 10)', mid: 'rgb(30, 40, 20)', high: 'rgb(40, 50, 30)' },
    elevationThresholds: { mid: -20, high: -5 },
  },
  IRONLEAF_FOREST: {
    id: 'ironleaf_forest', name: 'Ironleaf Forest', symbol: '🛡️', color: 'fill-slate-500',
    speedMultiplier: 2, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 10, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(130, 140, 150)', mid: 'rgb(140, 150, 160)', high: 'rgb(150, 160, 170)' },
    elevationThresholds: { mid: 100, high: 400 },
  },
  MOONOAK_FOREST: {
    id: 'moonlit_oak_forest', name: 'Moon-Oak Forest', symbol: '🌕', color: 'fill-indigo-700',
    speedMultiplier: 2.5, visibilityFactor: 0.4, baseInherentVisibilityBonus: -2, prominence: 15, canopyBlockage: 20,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(80, 100, 140)', mid: 'rgb(90, 110, 150)', high: 'rgb(100, 120, 160)' },
    elevationThresholds: { mid: 100, high: 400 },
  },
  PETRIFIED_STONE_FOREST: {
    id: 'petrified_stone_forest', name: 'Petrified Stone Forest', symbol: '🗿', color: 'fill-stone-600',
    speedMultiplier: 3.5, visibilityFactor: 0.5, baseInherentVisibilityBonus: -2, prominence: 10, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(110, 100, 90)', mid: 'rgb(120, 110, 100)', high: 'rgb(130, 120, 110)' },
    elevationThresholds: { mid: 50, high: 200 },
  },
  BIOLUMINESCENT_GROVE: {
    id: 'bioluminescent_grove', name: 'Bioluminescent Grove', symbol: '✨', color: 'fill-purple-500',
    speedMultiplier: 2.5, visibilityFactor: 0.4, baseInherentVisibilityBonus: -3, prominence: 5, canopyBlockage: 12,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(70, 20, 120)', mid: 'rgb(80, 30, 130)', high: 'rgb(90, 40, 140)' },
    elevationThresholds: { mid: -20, high: 30 },
  },
  SNOW_CAPPED_MOUNTAIN: {
    id: 'snow_capped_mountain', name: 'Snow-Capped Mountain', symbol: '🏔️', color: 'fill-blue-100',
    speedMultiplier: 5, visibilityFactor: 1, baseInherentVisibilityBonus: 2, prominence: 70, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(180, 190, 200)', mid: 'rgb(200, 220, 255)', high: 'rgb(230, 240, 255)' },
    elevationThresholds: { mid: 1500, high: 3000 },
  },
  OBSIDIAN_LAVA_FLOW_FIELD: {
    id: 'obsidian_lava_flow_field', name: 'Obsidian Lava Flow Field', symbol: '🌋', color: 'fill-neutral-700',
    speedMultiplier: 2.5, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(40, 40, 50)', mid: 'rgb(50, 50, 60)', high: 'rgb(60, 60, 70)' },
    elevationThresholds: { mid: 100, high: 500 },
  },

  // --- Underground - Traversable ---
  COMPACT_EARTH_CAVERN: {
    id: 'compact_earth_cavern', name: 'Compact Earth Cavern', symbol: '🕳️', color: 'fill-gray-600',
    speedMultiplier: 1, visibilityFactor: 0.7, baseInherentVisibilityBonus: -2, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(97, 104, 118)', mid: 'rgb(107, 114, 128)', high: 'rgb(117, 124, 138)' },
    elevationThresholds: { mid: -1000, high: -200 },
  },
  NATURAL_CAVE_TUNNEL: {
    id: 'natural_cave_tunnel', name: 'Natural Cave Tunnel', symbol: '↦', color: 'fill-gray-800',
    speedMultiplier: 1.2, visibilityFactor: 0.2, baseInherentVisibilityBonus: -4, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(21, 31, 45)', mid: 'rgb(31, 41, 55)', high: 'rgb(41, 51, 65)' },
    elevationThresholds: { mid: -2000, high: -500 },
  },
  SUBTERRANEAN_RIVER_BED: {
    id: 'subterranean_river_bed', name: 'Subterranean River Bed', symbol: '🏞️', color: 'fill-blue-800',
    speedMultiplier: 3, visibilityFactor: 0.4, baseInherentVisibilityBonus: -3, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 54, 165)', mid: 'rgb(30, 64, 175)', high: 'rgb(40, 74, 185)' },
    elevationThresholds: { mid: -1500, high: -400 },
  },
  LUMINOUS_CRYSTAL_CAVERNS: {
    id: 'luminous_crystal_caverns', name: 'Luminous Crystal Caverns', symbol: '💎', color: 'fill-cyan-400',
    speedMultiplier: 1.5, visibilityFactor: 0.9, baseInherentVisibilityBonus: -1, prominence: 2, canopyBlockage: 2,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(93, 222, 239)', mid: 'rgb(103, 232, 249)', high: 'rgb(113, 242, 255)' },
    elevationThresholds: { mid: -800, high: -300 },
  },
  UNDERGROUND_FUNGI_FOREST: {
    id: 'underground_fungi_forest', name: 'Underground Fungi Forest', symbol: '🍄', color: 'fill-purple-600',
    speedMultiplier: 2, visibilityFactor: 0.3, baseInherentVisibilityBonus: -2, prominence: 3, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(158, 75, 237)', mid: 'rgb(168, 85, 247)', high: 'rgb(178, 95, 255)' },
    elevationThresholds: { mid: -600, high: -150 },
  },
  GLOWWORM_LIT_CAVE: {
    id: 'glowworm_lit_cave', name: 'Glowworm-Lit Cave', symbol: '✨', color: 'fill-sky-700',
    speedMultiplier: 1.5, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(70, 90, 110)', mid: 'rgb(80, 100, 120)', high: 'rgb(90, 110, 130)' },
    elevationThresholds: { mid: -1200, high: -300 },
  },
  COOLING_MAGMA_TUBE: {
    id: 'cooling_magma_tube', name: 'Cooling Magma Tube', symbol: '🌋', color: 'fill-red-900',
    speedMultiplier: 1.2, visibilityFactor: 0.1, baseInherentVisibilityBonus: -5, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(45, 15, 15)', mid: 'rgb(55, 25, 25)', high: 'rgb(65, 35, 35)' },
    elevationThresholds: { mid: -2500, high: -1000 },
  },

  // --- Underground - Impassable Geology/Barriers ---
  SHEER_GRANITE_WALL: {
    id: 'sheer_granite_wall', name: 'Sheer Granite Wall', symbol: '⛰️', color: 'fill-gray-700',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(100, 90, 80)', light: 'rgb(120, 110, 100)' },
    elevationThresholds: { light: -1000 },
  },
  BASALT_COLUMN_BARRIER: {
    id: 'basalt_column_barrier', name: 'Basalt Column Barrier', symbol: '🪨', color: 'fill-slate-900',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(50, 50, 60)', light: 'rgb(70, 70, 80)' },
    elevationThresholds: { light: -1000 },
  },
  QUARTZ_CRYSTAL_SPINES: {
    id: 'quartz_crystal_spines', name: 'Quartz Crystal Spines', symbol: '💎', color: 'fill-cyan-500',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -5, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(190, 230, 245)', light: 'rgb(210, 250, 255)' },
    elevationThresholds: { light: -1000 },
  },
  LIMESTONE_FLOWSTONE_WALL: {
    id: 'limestone_flowstone_wall', name: 'Limestone Flowstone Wall', symbol: '⛰️', color: 'fill-amber-400',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -2, prominence: 15, canopyBlockage: 5,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(160, 150, 140)', light: 'rgb(180, 170, 160)' },
    elevationThresholds: { light: -1000 },
  },
  SOLID_OBSIDIAN_WALL: {
    id: 'solid_obsidian_wall', name: 'Solid Obsidian Wall', symbol: '🔮', color: 'fill-gray-900',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(0,0,0)', light: 'rgb(10, 5, 15)' },
    elevationThresholds: { light: -1000 },
  },
  MARBLE_STRATA_WALL: {
    id: 'marble_strata_wall', name: 'Marble Strata Wall', symbol: '🧱', color: 'fill-gray-200',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(180, 170, 160)', light: 'rgb(200, 190, 180)' },
    elevationThresholds: { light: -1000 },
  },
  COMPACTED_CLAY_DEPOSIT: {
    id: 'compacted_clay_deposit', name: 'Compacted Clay Deposit', symbol: '🕳️', color: 'fill-amber-900',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -5, prominence: 50, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(130, 90, 50)', light: 'rgb(150, 110, 70)' },
    elevationThresholds: { light: -500 },
  },
  ADAMANTINE_ORE_VEIN: {
    id: 'adamantine_ore_vein', name: 'Adamantine Ore Vein', symbol: '💎', color: 'fill-slate-800',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(40, 50, 60)', light: 'rgb(60, 70, 80)' },
    elevationThresholds: { light: -2000 },
  },
  DEEP_SUBTERRANEAN_CHASM: {
    id: 'deep_subterranean_chasm', name: 'Deep Subterranean Chasm', symbol: '⚫', color: 'fill-black',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(0,0,0)', light: 'rgb(20,20,20)' },
    elevationThresholds: { light: -4000 },
  },
  VOLCANIC_LAVA_RIVER: {
    id: 'volcanic_lava_river', name: 'Volcanic Lava River', symbol: '🔥', color: 'fill-red-800',
    speedMultiplier: 999, visibilityFactor: 0.1, baseInherentVisibilityBonus: -5, prominence: 0, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: false,
    colors: { cool: 'rgb(200, 50, 0)', hot: 'rgb(255, 150, 50)' },
    elevationThresholds: { hot: -1500 },
  },

  // --- Aquatic - Underwater ---
  COASTAL_SHALLOWS: {
    id: 'coastal_shallows', name: 'Coastal Shallows', symbol: '🌊', color: 'fill-cyan-400',
    speedMultiplier: 1.5, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deep: 'rgb(46, 179, 238)', mid: 'rgb(56, 189, 248)', shallow: 'rgb(66, 199, 255)' },
    elevationThresholds: { mid: -50, shallow: -10 },
  },
  VIBRANT_CORAL_REEF: {
    id: 'vibrant_coral_reef', name: 'Vibrant Coral Reef', symbol: '🐠', color: 'fill-pink-400',
    speedMultiplier: 1.8, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 2, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deep: 'rgb(239, 158, 202)', mid: 'rgb(249, 168, 212)', shallow: 'rgb(255, 178, 222)' },
    elevationThresholds: { mid: -40, shallow: -15 },
  },
  DENSE_KELP_FOREST: {
    id: 'dense_kelp_forest', name: 'Dense Kelp Forest', symbol: '🌿', color: 'fill-teal-600',
    speedMultiplier: 2.5, visibilityFactor: 0.4, baseInherentVisibilityBonus: -2, prominence: 3, canopyBlockage: 15,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deep: 'rgb(5, 108, 100)', mid: 'rgb(15, 118, 110)', shallow: 'rgb(25, 128, 120)' },
    elevationThresholds: { mid: -100, shallow: -30 },
  },
  ABYSSAL_OCEAN_FLOOR: {
    id: 'abyssal_ocean_floor', name: 'Abyssal Ocean Floor', symbol: '🌑', color: 'fill-blue-900',
    speedMultiplier: 2, visibilityFactor: 0.3, baseInherentVisibilityBonus: -2, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deep: 'rgb(7, 14, 29)', mid: 'rgb(17, 24, 39)', high: 'rgb(27, 34, 49)' },
    elevationThresholds: { mid: -4000, high: -1000 },
  },
  HYDROTHERMAL_VENT_FIELD: {
    id: 'hydrothermal_vent_field', name: 'Hydrothermal Vent Field', symbol: '🫧', color: 'fill-gray-950',
    speedMultiplier: 999, visibilityFactor: 0.05, baseInherentVisibilityBonus: -10, prominence: 0, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: false,
    colors: { deep: 'rgb(0,0,10)', mid: 'rgb(5, 5, 20)', high: 'rgb(10, 10, 30)' },
    elevationThresholds: { mid: -5000, high: -2000 },
  },
  OCEANIC_TRENCH: {
    id: 'oceanic_trench', name: 'Oceanic Trench', symbol: '↯', color: 'fill-black',
    speedMultiplier: 3, visibilityFactor: 0.05, baseInherentVisibilityBonus: -5, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deepest: 'rgb(0,0,0)', mid: 'rgb(0,0,5)', upper: 'rgb(0,0,10)' },
    elevationThresholds: { mid: -8000, upper: -4000 },
  },

  // --- Sky - Traversable & Structures ---
  CLEAR_SKY: {
    id: 'clear_sky', name: 'Clear Sky', symbol: '☁️', color: 'fill-sky-300',
    speedMultiplier: 0.5, visibilityFactor: 1.5, baseInherentVisibilityBonus: 2, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(125, 196, 225)', mid: 'rgb(135, 206, 235)', high: 'rgb(145, 216, 245)' },
    elevationThresholds: { mid: 10000, high: 20000 },
  },
  TURBULENT_AIR_CURRENTS: {
    id: 'turbulent_air_currents', name: 'Turbulent Air Currents', symbol: '🌬️', color: 'fill-sky-400',
    speedMultiplier: 2, visibilityFactor: 0.8, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(90, 170, 210)', mid: 'rgb(100, 180, 220)', high: 'rgb(110, 190, 230)' },
    elevationThresholds: { mid: 8000, high: 16000 },
  },
  FLOATING_EARTHMOTE_CLUSTER: {
    id: 'floating_earthmote_cluster', name: 'Floating Earthmote Cluster', symbol: '🏝️', color: 'fill-amber-700',
    speedMultiplier: 1.2, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 50, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(170, 140, 90)', mid: 'rgb(180, 150, 100)', high: 'rgb(190, 160, 110)' },
    elevationThresholds: { mid: 5000, high: 10000 },
  },
  CELESTIAL_SKY_ISLAND: {
    id: 'celestial_sky_island', name: 'Celestial Sky Island', symbol: '🏝️', color: 'fill-yellow-100',
    speedMultiplier: 1.2, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 50, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(244, 239, 185)', mid: 'rgb(254, 249, 195)', high: 'rgb(255, 255, 205)' },
    elevationThresholds: { mid: 15000, high: 25000 },
  },

  // --- Post-Descent & Planar Anomalies ---
  ETERNAL_BATTLEFIELD_PLAINS: {
    id: 'eternal_battlefield_plains', name: 'Eternal Battlefield Plains', symbol: '⚔️', color: 'fill-slate-600',
    speedMultiplier: 1.2, visibilityFactor: 0.8, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(140, 140, 150)', mid: 'rgb(150, 150, 160)', high: 'rgb(160, 160, 170)' },
    elevationThresholds: { mid: 100, high: 400 },
  },
  ARCANE_RADIATION_WASTES: {
    id: 'arcane_radiation_wastes', name: 'Arcane Radiation Wastes', symbol: '☢️', color: 'fill-purple-700',
    speedMultiplier: 1.5, visibilityFactor: 1.1, baseInherentVisibilityBonus: -2, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(170, 140, 190)', mid: 'rgb(180, 150, 200)', high: 'rgb(190, 160, 210)' },
    elevationThresholds: { mid: 200, high: 800 },
  },
  NON_EUCLIDEAN_RUINS: {
    id: 'non_euclidean_ruins', name: 'Non-Euclidean Ruins', symbol: '🌀', color: 'fill-indigo-800',
    speedMultiplier: 4, visibilityFactor: 0.5, baseInherentVisibilityBonus: -3, prominence: 20, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(110, 70, 140)', mid: 'rgb(120, 80, 150)', high: 'rgb(130, 90, 160)' },
    elevationThresholds: { mid: 500, high: 1500 },
  },
  FLESHCRAFTING_LABORATORY: {
    id: 'fleshcrafting_laboratory', name: 'Fleshcrafting Laboratory', symbol: '🧬', color: 'fill-red-900',
    speedMultiplier: 1.2, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(170, 70, 70)', mid: 'rgb(180, 80, 80)', high: 'rgb(190, 90, 90)' },
    elevationThresholds: { mid: 0, high: 50 },
  },
  WHITE_ASH_NECROPOLIS: {
    id: 'white_ash_necropolis', name: 'White Ash Necropolis', symbol: '💀', color: 'fill-gray-300',
    speedMultiplier: 1.3, visibilityFactor: 0.9, baseInherentVisibilityBonus: 0, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(200, 200, 210)', mid: 'rgb(210, 210, 220)', high: 'rgb(220, 220, 230)' },
    elevationThresholds: { mid: 100, high: 300 },
  },
  REALITY_CANCER_FLESHLANDS: {
    id: 'reality_cancer_fleshlands', name: 'Reality-Cancer Fleshlands', symbol: '🦠', color: 'fill-pink-800',
    speedMultiplier: 4, visibilityFactor: 0.6, baseInherentVisibilityBonus: -4, prominence: 15, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(190, 40, 90)', mid: 'rgb(200, 50, 100)', high: 'rgb(210, 60, 110)' },
    elevationThresholds: { mid: 0, high: 100 },
  },
  FEY_EMOTION_LANDSCAPE: {
    id: 'fey_emotion_landscape', name: 'Fey Emotion-Landscape', symbol: '🎭', color: 'fill-fuchsia-400',
    speedMultiplier: 2.5, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 10, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(210, 90, 245)', mid: 'rgb(220, 100, 255)', high: 'rgb(230, 110, 255)' },
    elevationThresholds: { mid: 50, high: 250 },
  },
  AERIAL_VORTEX: {
    id: 'aerial_vortex', name: 'Aerial Vortex', symbol: '🌀', color: 'fill-purple-900',
    speedMultiplier: 999, visibilityFactor: 0.1, baseInherentVisibilityBonus: -10, prominence: 0, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 0, 40)', mid: 'rgb(30, 0, 50)', high: 'rgb(40, 0, 60)' },
    elevationThresholds: { mid: 10000, high: 20000 },
  },
  FLOATING_MOUNTAIN_BARRIER: {
    id: 'floating_mountain_barrier', name: 'Floating Mountain Barrier', symbol: '☁️🏔️', color: 'fill-slate-500',
    speedMultiplier: 999, visibilityFactor: 0.5, baseInherentVisibilityBonus: 5, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { low: 'rgb(90, 110, 130)', mid: 'rgb(100, 120, 140)', high: 'rgb(110, 130, 150)' },
    elevationThresholds: { mid: 8000, high: 15000 },
  },

  // --- New Terrains from Lore ---
  SPECTRAL_RAIN_ZONE: {
    id: 'spectral_rain_zone', name: 'Spectral Rain Zone', symbol: '💧', color: 'fill-slate-400',
    speedMultiplier: 1.1, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(160, 160, 180)', mid: 'rgb(170, 170, 190)', high: 'rgb(180, 180, 200)' },
    elevationThresholds: { mid: 50, high: 200 },
  },
  ECHO_STORM_FIELD: {
    id: 'echo_storm_field', name: 'Echo Storm Field', symbol: '🌩️', color: 'fill-indigo-400',
    speedMultiplier: 2.0, visibilityFactor: 0.5, baseInherentVisibilityBonus: -3, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(120, 120, 140)', mid: 'rgb(130, 130, 150)', high: 'rgb(140, 140, 160)' },
    elevationThresholds: { mid: 100, high: 500 },
  },
  ETERNAL_WEEPING_HILLS: {
    id: 'eternal_weeping_hills', name: 'Eternal Weeping Hills', symbol: '😢', color: 'fill-teal-800',
    speedMultiplier: 1.5, visibilityFactor: 0.8, baseInherentVisibilityBonus: 1, prominence: 15, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(100, 130, 120)', mid: 'rgb(110, 140, 130)', high: 'rgb(120, 150, 140)' },
    elevationThresholds: { mid: 200, high: 500 },
  },
  VOID_QUARTZ_VEINS: {
    id: 'void_quartz_veins', name: 'Void Quartz Veins', symbol: '🔮', color: 'fill-purple-900',
    speedMultiplier: 1.8, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 2, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(10, 0, 20)', mid: 'rgb(20, 5, 30)', high: 'rgb(30, 10, 40)' },
    elevationThresholds: { mid: 0, high: 200 },
  },
  FLOATING_RUIN_FIELD: {
    id: 'floating_ruin_field', name: 'Floating Ruin Field', symbol: '🏛️', color: 'fill-gray-600',
    speedMultiplier: 1.3, visibilityFactor: 1.2, baseInherentVisibilityBonus: 2, prominence: 30, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(110, 110, 120)', mid: 'rgb(120, 120, 130)', high: 'rgb(130, 130, 140)' },
    elevationThresholds: { mid: 4000, high: 8000 },
  },
  UNSTABLE_LEY_LINE_CONFLUX: {
    id: 'unstable_ley_line_conflux', name: 'Unstable Ley Line Conflux', symbol: '💥', color: 'fill-fuchsia-600',
    speedMultiplier: 3.0, visibilityFactor: 0.6, baseInherentVisibilityBonus: -2, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(150, 50, 200)', mid: 'rgb(170, 70, 220)', high: 'rgb(190, 90, 240)' },
    elevationThresholds: { mid: 100, high: 500 },
  },
  CRIMSON_WIDOWS_VEIL_FIELD: {
    id: 'crimson_widows_veil_field', name: "Crimson Widow's Veil Field", symbol: '🍄', color: 'fill-red-700',
    speedMultiplier: 1.8, visibilityFactor: 0.4, baseInherentVisibilityBonus: -2, prominence: 5, canopyBlockage: 8,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(150, 20, 20)', mid: 'rgb(180, 30, 30)', high: 'rgb(210, 40, 40)' },
    elevationThresholds: { mid: 0, high: 100 },
  },
  MARROW_CAP_GROVE: {
    id: 'marrow_cap_grove', name: 'Marrow Cap Grove', symbol: '🦴', color: 'fill-stone-300',
    speedMultiplier: 1.2, visibilityFactor: 0.9, baseInherentVisibilityBonus: 0, prominence: 2, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(200, 200, 180)', mid: 'rgb(210, 210, 190)', high: 'rgb(220, 220, 200)' },
    elevationThresholds: { mid: 50, high: 150 },
  },
  ASHEN_BONE_PLAINS: {
    id: 'ashen_bone_plains', name: 'Ashen Bone Plains', symbol: '💀', color: 'fill-gray-400',
    speedMultiplier: 1.1, visibilityFactor: 1.1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(190, 190, 190)', mid: 'rgb(200, 200, 200)', high: 'rgb(210, 210, 210)' },
    elevationThresholds: { mid: 100, high: 300 },
  },
  HARMONIC_CRYSTAL_PILLARS: {
    id: 'harmonic_crystal_pillars', name: 'Harmonic Crystal Pillars', symbol: '💎', color: 'fill-teal-400',
    speedMultiplier: 2.2, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 30, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(100, 180, 180)', mid: 'rgb(120, 200, 200)', high: 'rgb(140, 220, 220)' },
    elevationThresholds: { mid: 200, high: 800 },
  },
  TELLURIC_FLUX_ZONE: {
    id: 'telluric_flux_zone', name: 'Telluric Flux Zone', symbol: '🌍', color: 'fill-amber-800',
    speedMultiplier: 1.8, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(140, 100, 60)', mid: 'rgb(160, 120, 80)', high: 'rgb(180, 140, 100)' },
    elevationThresholds: { mid: 0, high: 200 },
  },
  LIVING_MIST_SEA: {
    id: 'living_mist_sea', name: 'Living Mist Sea', symbol: '🌫️', color: 'fill-slate-500',
    speedMultiplier: 1.5, visibilityFactor: 0.1, baseInherentVisibilityBonus: -4, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(140, 150, 160)', mid: 'rgb(160, 170, 180)', high: 'rgb(180, 190, 200)' },
    elevationThresholds: { mid: 50, high: 250 },
  },
  ECHO_BAZAAR: {
    id: 'echo_bazaar', name: 'Echo Bazaar', symbol: '🗣️', color: 'fill-violet-600',
    speedMultiplier: 1, visibilityFactor: 0.9, baseInherentVisibilityBonus: -1, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(120, 100, 130)', mid: 'rgb(140, 120, 150)', high: 'rgb(160, 140, 170)' },
    elevationThresholds: { mid: 0, high: 100 },
  },
  FROZEN_SOUL_GLACIER: {
    id: 'frozen_soul_glacier', name: 'Frozen Soul Glacier', symbol: '🧊', color: 'fill-sky-300',
    speedMultiplier: 3, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 40, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(150, 180, 220)', mid: 'rgb(170, 200, 240)', high: 'rgb(190, 220, 255)' },
    elevationThresholds: { mid: 1000, high: 2500 },
  },
  WHITE_BLOOD_SNOWFIELD: {
    id: 'white_blood_snowfield', name: 'White Blood Snowfield', symbol: '❄️', color: 'fill-gray-200',
    speedMultiplier: 1.6, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(220, 210, 210)', mid: 'rgb(230, 220, 220)', high: 'rgb(240, 230, 230)' },
    elevationThresholds: { mid: 500, high: 1500 },
  },
  KRAKEN_BONE_TRENCH: {
    id: 'kraken_bone_trench', name: 'Kraken Bone Trench', symbol: '🐙', color: 'fill-slate-800',
    speedMultiplier: 2.5, visibilityFactor: 0.2, baseInherentVisibilityBonus: -3, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 20, 40)', mid: 'rgb(30, 30, 50)', high: 'rgb(40, 40, 60)' },
    elevationThresholds: { mid: -5000, high: -2000 },
  },
  WHISPERING_JELLYFISH_SWARM: {
    id: 'whispering_jellyfish_swarm', name: 'Whispering Jellyfish Swarm', symbol: '🎐', color: 'fill-blue-300',
    speedMultiplier: 1.8, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(150, 150, 220)', mid: 'rgb(170, 170, 240)', high: 'rgb(190, 190, 255)' },
    elevationThresholds: { mid: -500, high: -100 },
  },
  OBSIDIAN_ZIGGURAT_RUINS: {
    id: 'obsidian_ziggurat_ruins', name: 'Obsidian Ziggurat Ruins', symbol: '🔺', color: 'fill-black',
    speedMultiplier: 2, visibilityFactor: 0.7, baseInherentVisibilityBonus: 1, prominence: 40, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(25, 10, 30)', mid: 'rgb(35, 15, 40)', high: 'rgb(45, 20, 50)' },
    elevationThresholds: { mid: 100, high: 400 },
  },
  BLOODVINE_JUNGLE: {
    id: 'bloodvine_jungle', name: 'Bloodvine Jungle', symbol: '🩸', color: 'fill-red-800',
    speedMultiplier: 3.8, visibilityFactor: 0.1, baseInherentVisibilityBonus: -3, prominence: 12, canopyBlockage: 30,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(100, 20, 30)', mid: 'rgb(120, 30, 40)', high: 'rgb(140, 40, 50)' },
    elevationThresholds: { mid: 50, high: 300 },
  },
  SILVERDEW_SPRING: {
    id: 'silverdew_spring', name: 'Silverdew Spring', symbol: '💧', color: 'fill-cyan-100',
    speedMultiplier: 1, visibilityFactor: 1.1, baseInherentVisibilityBonus: 1, prominence: 1, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(180, 200, 210)', mid: 'rgb(200, 220, 230)', high: 'rgb(220, 240, 250)' },
    elevationThresholds: { mid: 50, high: 200 },
  },
  FLESHFORGED_DEMON_CITADEL: {
    id: 'fleshforged_demon_citadel', name: 'Fleshforged Demon Citadel', symbol: '👹', color: 'fill-rose-900',
    speedMultiplier: 1.5, visibilityFactor: 0.6, baseInherentVisibilityBonus: -2, prominence: 60, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(110, 50, 60)', mid: 'rgb(130, 60, 70)', high: 'rgb(150, 70, 80)' },
    elevationThresholds: { mid: 100, high: 500 },
  },
  VOID_FUNGUS_CAVERNS: {
    id: 'void_fungus_caverns', name: 'Void Fungus Caverns', symbol: '🍄', color: 'fill-indigo-900',
    speedMultiplier: 2.2, visibilityFactor: 0.2, baseInherentVisibilityBonus: -4, prominence: 5, canopyBlockage: 15,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(40, 30, 50)', mid: 'rgb(60, 50, 70)', high: 'rgb(80, 70, 90)' },
    elevationThresholds: { mid: -2000, high: -800 },
  },
};

// ==================================================================
// GENERATED CONFIGURATIONS
// These exports are generated from TERRAIN_METADATA for use in the application.
// Do not edit these directly. Modify TERRAIN_METADATA instead.
// ==================================================================

/**
 * An enum-like object for referencing terrain types programmatically.
 * e.g., TerrainType.OAK_FOREST returns 'oak_forest'
 */
export const TerrainType = Object.fromEntries(
  Object.entries(TERRAIN_METADATA).map(([key, data]) => [key, data.id])
);

/**
 * The main configuration object used by the application, keyed by terrain ID string.
 * This loop constructs the object and its `elevationColor` functions from the master data.
 */
export const TERRAIN_TYPES_CONFIG = Object.fromEntries(
  Object.entries(TERRAIN_METADATA).map(([key, data]) => {
    const { colors, elevationThresholds, ...gameplayData } = data;
    
    const finalConfig = {
      ...gameplayData,
      elevationColor: (elevation) => {
        // Handle two-color terrains (like impassable walls)
        if (elevationThresholds.light !== undefined && colors.light && colors.dark) {
          return elevation < elevationThresholds.light ? colors.dark : colors.light;
        }
        // Handle two-color terrains (like lava rivers)
        if (elevationThresholds.hot !== undefined && colors.hot && colors.cool) {
          return elevation < elevationThresholds.hot ? colors.cool : colors.hot;
        }
        // Handle three-color terrains (most common type)
        if (elevationThresholds.mid !== undefined && elevationThresholds.high !== undefined) {
          if (elevation < elevationThresholds.mid) return colors.low;
          if (elevation < elevationThresholds.high) return colors.mid;
          return colors.high;
        }
        // Handle three-color terrains for underwater depths
        if (elevationThresholds.mid !== undefined && elevationThresholds.shallow !== undefined) {
            if (elevation < elevationThresholds.mid) return colors.deep;
            if (elevation < elevationThresholds.shallow) return colors.mid;
            return colors.shallow;
        }
        // Handle three-color terrains for deep ocean/trenches
        if (elevationThresholds.mid !== undefined && elevationThresholds.upper !== undefined) {
          if (elevation < elevationThresholds.mid) return colors.deepest;
          if (elevation < elevationThresholds.upper) return colors.mid;
          return colors.upper;
      }
        // Fallback for any misconfigured or single-color terrains
        return colors.low || colors.dark || colors.cool || Object.values(colors)[0];
      }
    };

    return [data.id, finalConfig];
  })
);


// ==================================================================
// OTHER CONSTANTS
// ==================================================================

export const DEFAULT_TERRAIN_TYPE = TerrainType.ROLLING_PLAINS;
export const MOUNTAIN_THRESHOLD = 600;
export const HILLS_THRESHOLD = 300;

export const HEX_SIZE = 30;
export const INITIAL_GRID_WIDTH = 12;
export const INITIAL_GRID_HEIGHT = 8;
export const MIN_GRID_DIMENSION = 1;
export const MAX_GRID_DIMENSION = 50;

export const MIN_ELEVATION = -16000; // Deepest ocean trench / underground abyss
export const MAX_ELEVATION = 46000; // Highest mountain / lower stratosphere
export const ELEVATION_STEP = 100; // Default step for increase/decrease
export const DEFAULT_CUSTOM_ELEVATION_STEP = 100; // Default for the input field
export const DEFAULT_SET_ELEVATION_VALUE = 0; // Default for "Set to..."
export const INITIAL_ELEVATION = 0;
export const INITIAL_BASE_VISIBILITY = 1;

export const DEFAULT_HEX_SIZE_VALUE = 5;
export const DEFAULT_HEX_SIZE_UNIT = 'km';
export const DEFAULT_HEX_TRAVERSAL_TIME_VALUE = 1;
export const DEFAULT_HEX_TRAVERSAL_TIME_UNIT = 'hour';

export const DISTANCE_UNITS = [
    { key: 'm', label: 'Meters' },
    { key: 'km', label: 'Kilometers' },
    { key: 'mi', label: 'Miles' },
    { key: 'ft', label: 'Feet' },
    { key: 'ly', label: 'Light Years' }
];

export const TIME_UNITS = [
    { key: 'second', label: 'Seconds' },
    { key: 'minute', label: 'Minutes' },
    { key: 'hour', label: 'Hours' },
    { key: 'day', label: 'Days' },
    { key: 'week', label: 'Weeks' },
    { key: 'month', label: 'Months' },
    { key: 'year', label: 'Years' }
];

export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 5;
export const DEFAULT_BRUSH_SIZE = 1;

export const ELEVATION_VISIBILITY_STEP_BONUS = 200;
export const OBSERVER_EYE_HEIGHT_M = 5;
export const TARGET_VISIBILITY_THRESHOLD_M = 1;
export const PROFILE_LOS_BLOCKAGE_MARGIN = 1;
export const ELEVATION_TIME_PENALTY_FACTOR_PER_100M = 0.15;
export const FOREST_CANOPY_BLOCKAGE_ADDITION = 15;
export const THICK_FOREST_CANOPY_BLOCKAGE_ADDITION = 20;
export const YOUNG_FOREST_CANOPY_BLOCKAGE_ADDITION = 10;
export const JUNGLE_CANOPY_BLOCKAGE_ADDITION = 25;
export const HILLS_TERRAIN_BLOCKAGE_ADDITION = 5;
export const ENCOUNTER_FEATURE_ICON = "⚠️";

export const FEATURE_ICON_COLORS = [
    { name: "Default Yellow", class: "fill-yellow-200" },
    { name: "Bright Red", class: "fill-red-500" },
    { name: "Sky Blue", class: "fill-sky-400" },
    { name: "Lime Green", class: "fill-lime-500" },
    { name: "Orange", class: "fill-orange-400" },
    { name: "Purple", class: "fill-purple-400" },
    { name: "Pink", class: "fill-pink-400" },
    { name: "Teal", class: "fill-teal-400" },
    { name: "White", class: "fill-white" },
    { name: "Gray", class: "fill-gray-300" }
];

export const DEFAULT_LANDMARK_ICON_COLOR_CLASS = "fill-yellow-200";
export const DEFAULT_ENCOUNTER_ICON_COLOR_CLASS = "fill-red-500";
export const DEFAULT_SECRET_ICON_COLOR_CLASS = "fill-purple-400";


export const INITIAL_PLAYER_COL = 0;
export const INITIAL_PLAYER_ROW = 0;
export const PLAYER_MARKER_COLOR = 'fill-red-500';
export const FOG_OF_WAR_COLOR = 'rgb(20, 20, 20)';
export const DISCOVERED_DIM_OPACITY = 0.6;
export const DEFAULT_APP_MODE = AppMode.HEX_EDITOR;
export const DEFAULT_VIEW_MODE = ViewMode.TWOD;

CONST.INITIAL_GRID_WIDTH is undefined



export const HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT = 0.05;
export const HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT = 0.05;
export const HEX_3D_Y_SQUASH_FACTOR = 1.0;
export const HEX_3D_SIDE_COLOR_DARKEN_FACTOR = 0.25;
export const HEX_3D_MIN_VISUAL_DEPTH = 1.5;
export const HEX_PREVIEW_STROKE_WIDTH_ADDITION = 1.5;

export const AUTO_TERRAIN_CHANGE_ENABLED_DEFAULT = true;
export const WEATHER_UPDATE_INTERVAL_HOURS = 1;
export const WEATHER_MOVEMENT_DIRECTIONS = { STATIONARY: { dCol: 0, dRow: 0, name: 'Stationary' }, EAST: { dCol: 1, dRow: 0, name: 'East' }, WEST: { dCol: -1, dRow: 0, name: 'West' }, SOUTH_EAST: { dCol: 1, dRow: 1, name: 'South-East (approx)' }, NORTH_WEST: { dCol: -1, dRow: -1, name: 'North-West (approx)' }, };
export const NEW_WEATHER_SYSTEM_SPAWN_INTERVAL_HOURS = 8;
export const MAX_ACTIVE_WEATHER_SYSTEMS = 5;
export const AUTO_TERRAIN_IGNORE_TYPES = Object.values(TerrainType);


export const PARTY_ACTIVITIES = {
  avoid_notice: {
    id: 'avoid_notice',
    name: 'Avoid Notice',
    icon: '🤫',
    description: 'Attempt Stealth (Perception DC) while traveling at half speed. On encounter start, use Stealth for initiative and detection.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Exploration'],
    source: 'Player Core pg. 438'
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    icon: '🛡️',
    description: 'Move at half speed with shield raised. Gain Raise a Shield benefits before first turn in combat.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Exploration'],
    source: 'Player Core pg. 438'
  },
  detect_magic: {
    id: 'detect_magic',
    name: 'Detect Magic',
    icon: '✨',
    description: 'Cast detect magic at intervals. Half speed or slower. Specific speeds for thoroughness.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 438'
  },
  follow_expert: {
    id: 'follow_expert',
    name: 'Follow the Expert',
    icon: '👣',
    description: 'Match ally\'s skill check (e.g., Climb, Avoid Notice). Add level to skill, gain circumstance bonus from ally.',
    movementPenaltyFactor: 1.0,
    isGroupActivity: false,
    traits: ['Auditory', 'Concentrate', 'Exploration', 'Visual'],
    source: 'Player Core pg. 438'
  },
  hustle: {
    id: 'hustle',
    name: 'Hustle',
    icon: '💨',
    description: 'Move at double travel speed for Con mod × 10 minutes (min 10 min). Group uses lowest Con.',
    movementPenaltyFactor: 0.5,
    isGroupActivity: false,
    traits: ['Exploration', 'Move'],
    source: 'Player Core pg. 438'
  },
  investigate: {
    id: 'investigate',
    name: 'Investigate',
    icon: '🔍',
    description: 'Seek info with Recall Knowledge (secret) at half speed.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  repeat_spell: {
    id: 'repeat_spell',
    name: 'Repeat a Spell',
    icon: '🔁',
    description: 'Repeatedly cast a 2-action or less spell (usually cantrip) at half speed.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    icon: '👁️‍🗨️',
    description: 'Scout ahead/behind at half speed. Party gains +1 initiative next encounter.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  search: {
    id: 'search',
    name: 'Search',
    icon: '🧐',
    description: 'Meticulously Seek for hidden things. Half speed usually; slower for thoroughness. GM makes free secret Seek.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  mounted_travel: {
    id: 'mounted_travel',
    name: 'Mounted Travel',
    icon: '🐎',
    description: 'The entire party travels on horseback or similar mounts, increasing base travel speed.',
    movementPenaltyFactor: 0.75,
    isGroupActivity: true,
    traits: ['Move'],
    source: 'Game Master Intuition'
  },
  stealthy_group_approach: {
    id: 'stealthy_group_approach',
    name: 'Group Stealth',
    icon: '🤫👥',
    description: 'The entire party attempts to move stealthily together, typically at a reduced speed.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: true,
    traits: ['Exploration', 'Secret'],
    source: 'Game Master Intuition'
  },
  wheeled_vehicle: {
    id: 'wheeled_vehicle',
    name: 'Wheeled Vehicle',
    icon: '🛒',
    description: 'Travel by wheeled vehicle (e.g., cart, wagon). Offers faster travel on roads but is hindered by rough terrain.',
    movementPenaltyFactor: 1.2,
    isGroupActivity: true,
    terrainModifiers: [
        { terrains: [TerrainType.COBBLESTONE_ROAD], movementPenaltyFactor: 0.5 },
        { terrains: Object.values(TerrainType).filter(t => t !== TerrainType.COBBLESTONE_ROAD), movementPenaltyFactor: 2.5 }
    ],
    traits: ['Move'],
    source: 'Custom Rule'
  }
};
