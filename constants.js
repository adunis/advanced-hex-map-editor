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

const TERRAIN_METADATA = {
  ROLLING_PLAINS: {
    id: 'rolling_plains', name: 'Rolling Plains', symbol: '🌾', color: 'fill-green-400',
    speedMultiplier: 1, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(134, 239, 172)', mid: 'rgb(74, 222, 128)', high: 'rgb(34, 197, 94)' },
    elevationThresholds: { mid: 50, high: 150 },
    encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  TALLGRASS_PRAIRIE: {
    id: 'tallgrass_prairie', name: 'Tallgrass Prairie', symbol: '🌿', color: 'fill-lime-600',
    speedMultiplier: 1.2, visibilityFactor: 0.9, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(100, 150, 70)', mid: 'rgb(120, 170, 90)', high: 'rgb(140, 190, 110)' },
    elevationThresholds: { mid: 50, high: 200 },
    encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SHORTGRASS_STEPPE: {
    id: 'shortgrass_steppe', name: 'Shortgrass Steppe', symbol: '🐎', color: 'fill-amber-300',
    speedMultiplier: 0.9, visibilityFactor: 1.1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(180, 180, 100)', mid: 'rgb(190, 190, 120)', high: 'rgb(200, 200, 140)' },
    elevationThresholds: { mid: 100, high: 400 },
    encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  OAK_FOREST: {
    id: 'oak_forest', name: 'Oak Forest', symbol: '🌳', color: 'fill-green-700',
    speedMultiplier: 1.8, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 5, canopyBlockage: 15,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(40, 100, 30)', mid: 'rgb(50, 110, 40)', high: 'rgb(60, 120, 50)' },
    elevationThresholds: { mid: 100, high: 300 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  PINE_FOREST: {
    id: 'pine_forest', name: 'Pine Forest', symbol: '🌲', color: 'fill-emerald-800',
    speedMultiplier: 1.9, visibilityFactor: 0.55, baseInherentVisibilityBonus: -1, prominence: 5, canopyBlockage: 17,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(10, 80, 50)', mid: 'rgb(20, 90, 60)', high: 'rgb(30, 100, 70)' },
    elevationThresholds: { mid: 150, high: 500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  BIRCH_FOREST: {
    id: 'birch_forest', name: 'Birch Forest', symbol: '🤍', color: 'fill-lime-500',
    speedMultiplier: 1.6, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 3, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(120, 160, 90)', mid: 'rgb(130, 170, 100)', high: 'rgb(140, 180, 110)' },
    elevationThresholds: { mid: 100, high: 300 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  GRASSY_HILLS: {
    id: 'grassy_hills', name: 'Grassy Hills', symbol: '⛰️', color: 'fill-amber-600',
    speedMultiplier: 1.5, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 20, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(218, 165, 32)', mid: 'rgb(228, 175, 42)', high: 'rgb(238, 185, 52)' },
    elevationThresholds: { mid: 300, high: 600 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ROCKY_FOOTHILLS: {
    id: 'rocky_foothills', name: 'Rocky Foothills', symbol: '🪨', color: 'fill-stone-700',
    speedMultiplier: 1.8, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 25, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(140, 110, 80)', mid: 'rgb(150, 120, 90)', high: 'rgb(160, 130, 100)' },
    elevationThresholds: { mid: 400, high: 800 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ALPINE_TUNDRA: {
    id: 'alpine_tundra', name: 'Alpine Tundra', symbol: '❄️', color: 'fill-gray-400',
    speedMultiplier: 2.2, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(110, 120, 100)', mid: 'rgb(120, 130, 110)', high: 'rgb(130, 140, 120)' },
    elevationThresholds: { mid: 2000, high: 3000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  COASTAL_BEACH: {
    id: 'coastal_beach', name: 'Coastal Beach', symbol: '🏖️', color: 'fill-yellow-100',
    speedMultiplier: 1, visibilityFactor: 1.1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(255, 245, 190)', mid: 'rgb(255, 250, 200)', high: 'rgb(255, 255, 210)' },
    elevationThresholds: { mid: 1, high: 5 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  FRESHWATER_SWAMP: {
    id: 'freshwater_swamp', name: 'Freshwater Swamp', symbol: '🐊', color: 'fill-teal-700',
    speedMultiplier: 2.5, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 1, canopyBlockage: 8,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(13, 148, 136)', mid: 'rgb(23, 158, 146)', high: 'rgb(33, 168, 156)' },
    elevationThresholds: { mid: -5, high: 10 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  REED_MARSH: {
    id: 'reed_marsh', name: 'Reed Marsh', symbol: '🌾', color: 'fill-teal-500',
    speedMultiplier: 2.8, visibilityFactor: 0.7, baseInherentVisibilityBonus: 0, prominence: 1, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(30, 120, 110)', mid: 'rgb(40, 130, 120)', high: 'rgb(50, 140, 130)' },
    elevationThresholds: { mid: -2, high: 5 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SAND_DUNES_DESERT: {
    id: 'sand_dunes_desert', name: 'Sand Dunes Desert', symbol: '🏜️', color: 'fill-yellow-300',
    speedMultiplier: 1.5, visibilityFactor: 1.2, baseInherentVisibilityBonus: 1, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(250, 204, 21)', mid: 'rgb(255, 214, 31)', high: 'rgb(255, 224, 41)' },
    elevationThresholds: { mid: 200, high: 600 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ROCKY_INFERTILE_DESERT: {
    id: 'rocky_infertile_desert', name: 'Rocky Infertile Desert', symbol: '🌵', color: 'fill-amber-700',
    speedMultiplier: 1.3, visibilityFactor: 1.1, baseInherentVisibilityBonus: 0, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(200, 160, 80)', mid: 'rgb(210, 170, 90)', high: 'rgb(220, 180, 100)' },
    elevationThresholds: { mid: 300, high: 700 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ARCTIC_ICE_FLATS: {
    id: 'arctic_ice_flats', name: 'Arctic Ice Flats', symbol: '❄️', color: 'fill-cyan-200',
    speedMultiplier: 1.5, visibilityFactor: 1.2, baseInherentVisibilityBonus: 1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(207, 250, 254)', mid: 'rgb(217, 252, 255)', high: 'rgb(227, 255, 255)' },
    elevationThresholds: { mid: 0, high: 50 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SAVANNA_WOODLAND: {
    id: 'savanna_woodland', name: 'Savanna Woodland', symbol: '🌳', color: 'fill-yellow-500',
    speedMultiplier: 1.1, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 5, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(160, 190, 70)', mid: 'rgb(170, 200, 80)', high: 'rgb(180, 210, 90)' },
    elevationThresholds: { mid: 100, high: 400 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  RAINFOREST_JUNGLE: {
    id: 'rainforest_jungle', name: 'Rainforest Jungle', symbol: '🌴', color: 'fill-green-900',
    speedMultiplier: 3.5, visibilityFactor: 0.15, baseInherentVisibilityBonus: -3, prominence: 10, canopyBlockage: 25,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(4, 120, 87)', mid: 'rgb(14, 130, 97)', high: 'rgb(24, 140, 107)' },
    elevationThresholds: { mid: 100, high: 500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  MANGROVE_COAST: {
    id: 'mangrove_coast', name: 'Mangrove Coast', symbol: '🌿', color: 'fill-emerald-700',
    speedMultiplier: 3.5, visibilityFactor: 0.3, baseInherentVisibilityBonus: -2, prominence: 8, canopyBlockage: 18,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(60, 100, 90)', mid: 'rgb(70, 110, 100)', high: 'rgb(80, 120, 110)' },
    elevationThresholds: { mid: -2, high: 2 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  CLOUD_MIST_FOREST: {
    id: 'cloud_mist_forest', name: 'Cloud Mist Forest', symbol: '☁️', color: 'fill-gray-300',
    speedMultiplier: 2.8, visibilityFactor: 0.2, baseInherentVisibilityBonus: -3, prominence: 10, canopyBlockage: 15,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(150, 190, 170)', mid: 'rgb(160, 200, 180)', high: 'rgb(170, 210, 190)' },
    elevationThresholds: { mid: 1000, high: 2000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  GLACIAL_FJORDS: {
    id: 'glacial_fjords', name: 'Glacial Fjords', symbol: '🧊🌊', color: 'fill-blue-600',
    speedMultiplier: 2.5, visibilityFactor: 0.9, baseInherentVisibilityBonus: 0, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(40, 120, 180)', mid: 'rgb(50, 130, 190)', high: 'rgb(60, 140, 200)' },
    elevationThresholds: { mid: -50, high: 0 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SALT_FLATS_DRY: {
    id: 'salt_flats_dry', name: 'Dry Salt Flats', symbol: '🧂', color: 'fill-stone-100',
    speedMultiplier: 1.2, visibilityFactor: 1.3, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(240, 240, 230)', mid: 'rgb(245, 245, 235)', high: 'rgb(250, 250, 240)' },
    elevationThresholds: { mid: -10, high: 10 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  CRIMSON_CANYON_LANDS: {
    id: 'crimson_canyon_lands', name: 'Crimson Canyon Lands', symbol: '🏜️', color: 'fill-red-800',
    speedMultiplier: 3.5, visibilityFactor: 0.9, baseInherentVisibilityBonus: -1, prominence: 50, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(234, 88, 12)', mid: 'rgb(244, 98, 22)', high: 'rgb(254, 108, 32)' },
    elevationThresholds: { mid: 200, high: 600 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  GEOTHERMAL_SPRINGS: {
    id: 'geothermal_springs', name: 'Geothermal Springs', symbol: '♨️', color: 'fill-orange-600',
    speedMultiplier: 3, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(255, 120, 0)', mid: 'rgb(255, 140, 20)', high: 'rgb(255, 160, 40)' },
    elevationThresholds: { mid: 50, high: 150 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ANCIENT_OVERGROWN_RUINS: {
    id: 'ancient_overgrown_ruins', name: 'Ancient Overgrown Ruins', symbol: '🏛️', color: 'fill-gray-700',
    speedMultiplier: 2.5, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 20, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(130, 120, 110)', mid: 'rgb(140, 130, 120)', high: 'rgb(150, 140, 130)' },
    elevationThresholds: { mid: 100, high: 300 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  METEORITE_IMPACT_CRATER: {
    id: 'meteorite_impact_crater', name: 'Meteorite Impact Crater', symbol: '🌑', color: 'fill-gray-800',
    speedMultiplier: 3, visibilityFactor: 0.5, baseInherentVisibilityBonus: -2, prominence: 50, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(70, 60, 50)', mid: 'rgb(80, 70, 60)', high: 'rgb(90, 80, 70)' },
    elevationThresholds: { mid: 0, high: 100 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SHALLOW_QUICKSAND_PIT: {
    id: 'shallow_quicksand_pit', name: 'Shallow Quicksand Pit', symbol: '⏳', color: 'fill-yellow-700',
    speedMultiplier: 4, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(161, 98, 7)', mid: 'rgb(171, 108, 17)', high: 'rgb(181, 118, 27)' },
    elevationThresholds: { mid: -5, high: 0 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SINKING_TAR_PITS: {
    id: 'sinking_tar_pits', name: 'Sinking Tar Pits', symbol: '🕳️', color: 'fill-neutral-900',
    speedMultiplier: 999, visibilityFactor: 0.3, baseInherentVisibilityBonus: -3, prominence: 0, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 20, 20)', mid: 'rgb(30, 30, 30)', high: 'rgb(40, 40, 40)' },
    elevationThresholds: { mid: -10, high: 0 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  DEEP_MIRE: {
    id: 'deep_mire', name: 'Deep Mire', symbol: '🕳️', color: 'fill-gray-800',
    speedMultiplier: 999, visibilityFactor: 0.4, baseInherentVisibilityBonus: -2, prominence: 0, canopyBlockage: 3,
    isImpassable: true, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 30, 10)', mid: 'rgb(30, 40, 20)', high: 'rgb(40, 50, 30)' },
    elevationThresholds: { mid: -20, high: -5 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  IRONLEAF_FOREST: {
    id: 'ironleaf_forest', name: 'Ironleaf Forest', symbol: '🛡️', color: 'fill-slate-500',
    speedMultiplier: 2, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 10, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(130, 140, 150)', mid: 'rgb(140, 150, 160)', high: 'rgb(150, 160, 170)' },
    elevationThresholds: { mid: 100, high: 400 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  MOONOAK_FOREST: {
    id: 'moonlit_oak_forest', name: 'Moon-Oak Forest', symbol: '🌕', color: 'fill-indigo-700',
    speedMultiplier: 2.5, visibilityFactor: 0.4, baseInherentVisibilityBonus: -2, prominence: 15, canopyBlockage: 20,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(80, 100, 140)', mid: 'rgb(90, 110, 150)', high: 'rgb(100, 120, 160)' },
    elevationThresholds: { mid: 100, high: 400 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  PETRIFIED_STONE_FOREST: {
    id: 'petrified_stone_forest', name: 'Petrified Stone Forest', symbol: '🗿', color: 'fill-stone-600',
    speedMultiplier: 3.5, visibilityFactor: 0.5, baseInherentVisibilityBonus: -2, prominence: 10, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(110, 100, 90)', mid: 'rgb(120, 110, 100)', high: 'rgb(130, 120, 110)' },
    elevationThresholds: { mid: 50, high: 200 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  BIOLUMINESCENT_GROVE: {
    id: 'bioluminescent_grove', name: 'Bioluminescent Grove', symbol: '✨', color: 'fill-purple-500',
    speedMultiplier: 2.5, visibilityFactor: 0.4, baseInherentVisibilityBonus: -3, prominence: 5, canopyBlockage: 12,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(70, 20, 120)', mid: 'rgb(80, 30, 130)', high: 'rgb(90, 40, 140)' },
    elevationThresholds: { mid: -20, high: 30 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SNOW_CAPPED_MOUNTAIN: {
    id: 'snow_capped_mountain', name: 'Snow-Capped Mountain', symbol: '🏔️', color: 'fill-blue-100',
    speedMultiplier: 5, visibilityFactor: 1, baseInherentVisibilityBonus: 2, prominence: 70, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(180, 190, 200)', mid: 'rgb(200, 220, 255)', high: 'rgb(230, 240, 255)' },
    elevationThresholds: { mid: 1500, high: 3000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  OBSIDIAN_LAVA_FLOW_FIELD: {
    id: 'obsidian_lava_flow_field', name: 'Obsidian Lava Flow Field', symbol: '🌋', color: 'fill-neutral-700',
    speedMultiplier: 2.5, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(40, 40, 50)', mid: 'rgb(50, 50, 60)', high: 'rgb(60, 60, 70)' },
    elevationThresholds: { mid: 100, high: 500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  COMPACT_EARTH_CAVERN: {
    id: 'compact_earth_cavern', name: 'Compact Earth Cavern', symbol: '🕳️', color: 'fill-gray-600',
    speedMultiplier: 1, visibilityFactor: 0.7, baseInherentVisibilityBonus: -2, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(97, 104, 118)', mid: 'rgb(107, 114, 128)', high: 'rgb(117, 124, 138)' },
    elevationThresholds: { mid: -1000, high: -200 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  NATURAL_CAVE_TUNNEL: {
    id: 'natural_cave_tunnel', name: 'Natural Cave Tunnel', symbol: '↦', color: 'fill-gray-800',
    speedMultiplier: 1.2, visibilityFactor: 0.2, baseInherentVisibilityBonus: -4, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(21, 31, 45)', mid: 'rgb(31, 41, 55)', high: 'rgb(41, 51, 65)' },
    elevationThresholds: { mid: -2000, high: -500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SUBTERRANEAN_RIVER_BED: {
    id: 'subterranean_river_bed', name: 'Subterranean River Bed', symbol: '🏞️', color: 'fill-blue-800',
    speedMultiplier: 3, visibilityFactor: 0.4, baseInherentVisibilityBonus: -3, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 54, 165)', mid: 'rgb(30, 64, 175)', high: 'rgb(40, 74, 185)' },
    elevationThresholds: { mid: -1500, high: -400 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  LUMINOUS_CRYSTAL_CAVERNS: {
    id: 'luminous_crystal_caverns', name: 'Luminous Crystal Caverns', symbol: '💎', color: 'fill-cyan-400',
    speedMultiplier: 1.5, visibilityFactor: 0.9, baseInherentVisibilityBonus: -1, prominence: 2, canopyBlockage: 2,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(93, 222, 239)', mid: 'rgb(103, 232, 249)', high: 'rgb(113, 242, 255)' },
    elevationThresholds: { mid: -800, high: -300 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  UNDERGROUND_FUNGI_FOREST: {
    id: 'underground_fungi_forest', name: 'Underground Fungi Forest', symbol: '🍄', color: 'fill-purple-600',
    speedMultiplier: 2, visibilityFactor: 0.3, baseInherentVisibilityBonus: -2, prominence: 3, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(158, 75, 237)', mid: 'rgb(168, 85, 247)', high: 'rgb(178, 95, 255)' },
    elevationThresholds: { mid: -600, high: -150 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  GLOWWORM_LIT_CAVE: {
    id: 'glowworm_lit_cave', name: 'Glowworm-Lit Cave', symbol: '✨', color: 'fill-sky-700',
    speedMultiplier: 1.5, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(70, 90, 110)', mid: 'rgb(80, 100, 120)', high: 'rgb(90, 110, 130)' },
    elevationThresholds: { mid: -1200, high: -300 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  COOLING_MAGMA_TUBE: {
    id: 'cooling_magma_tube', name: 'Cooling Magma Tube', symbol: '🌋', color: 'fill-red-900',
    speedMultiplier: 1.2, visibilityFactor: 0.1, baseInherentVisibilityBonus: -5, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(45, 15, 15)', mid: 'rgb(55, 25, 25)', high: 'rgb(65, 35, 35)' },
    elevationThresholds: { mid: -2500, high: -1000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SHEER_GRANITE_WALL: {
    id: 'sheer_granite_wall', name: 'Sheer Granite Wall', symbol: '⛰️', color: 'fill-gray-700',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(100, 90, 80)', light: 'rgb(120, 110, 100)' },
    elevationThresholds: { light: -1000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  BASALT_COLUMN_BARRIER: {
    id: 'basalt_column_barrier', name: 'Basalt Column Barrier', symbol: '🪨', color: 'fill-slate-900',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(50, 50, 60)', light: 'rgb(70, 70, 80)' },
    elevationThresholds: { light: -1000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  QUARTZ_CRYSTAL_SPINES: {
    id: 'quartz_crystal_spines', name: 'Quartz Crystal Spines', symbol: '💎', color: 'fill-cyan-500',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -5, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(190, 230, 245)', light: 'rgb(210, 250, 255)' },
    elevationThresholds: { light: -1000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  LIMESTONE_FLOWSTONE_WALL: {
    id: 'limestone_flowstone_wall', name: 'Limestone Flowstone Wall', symbol: '⛰️', color: 'fill-amber-400',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -2, prominence: 15, canopyBlockage: 5,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(160, 150, 140)', light: 'rgb(180, 170, 160)' },
    elevationThresholds: { light: -1000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SOLID_OBSIDIAN_WALL: {
    id: 'solid_obsidian_wall', name: 'Solid Obsidian Wall', symbol: '🔮', color: 'fill-gray-900',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(0,0,0)', light: 'rgb(10, 5, 15)' },
    elevationThresholds: { light: -1000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  MARBLE_STRATA_WALL: {
    id: 'marble_strata_wall', name: 'Marble Strata Wall', symbol: '🧱', color: 'fill-gray-200',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(180, 170, 160)', light: 'rgb(200, 190, 180)' },
    elevationThresholds: { light: -1000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  COMPACTED_CLAY_DEPOSIT: {
    id: 'compacted_clay_deposit', name: 'Compacted Clay Deposit', symbol: '🕳️', color: 'fill-amber-900',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -5, prominence: 50, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(130, 90, 50)', light: 'rgb(150, 110, 70)' },
    elevationThresholds: { light: -500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ADAMANTINE_ORE_VEIN: {
    id: 'adamantine_ore_vein', name: 'Adamantine Ore Vein', symbol: '💎', color: 'fill-slate-800',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(40, 50, 60)', light: 'rgb(60, 70, 80)' },
    elevationThresholds: { light: -2000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  DEEP_SUBTERRANEAN_CHASM: {
    id: 'deep_subterranean_chasm', name: 'Deep Subterranean Chasm', symbol: '⚫', color: 'fill-black',
    speedMultiplier: 999, visibilityFactor: 0, baseInherentVisibilityBonus: -10, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { dark: 'rgb(0,0,0)', light: 'rgb(20,20,20)' },
    elevationThresholds: { light: -4000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  VOLCANIC_LAVA_RIVER: {
    id: 'volcanic_lava_river', name: 'Volcanic Lava River', symbol: '🔥', color: 'fill-red-800',
    speedMultiplier: 999, visibilityFactor: 0.1, baseInherentVisibilityBonus: -5, prominence: 0, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: false,
    colors: { cool: 'rgb(200, 50, 0)', hot: 'rgb(255, 150, 50)' },
    elevationThresholds: { hot: -1500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  COASTAL_SHALLOWS: {
    id: 'coastal_shallows', name: 'Coastal Shallows', symbol: '🌊', color: 'fill-cyan-400',
    speedMultiplier: 1.5, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deep: 'rgb(46, 179, 238)', mid: 'rgb(56, 189, 248)', shallow: 'rgb(66, 199, 255)' },
    elevationThresholds: { mid: -50, shallow: -10 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  VIBRANT_CORAL_REEF: {
    id: 'vibrant_coral_reef', name: 'Vibrant Coral Reef', symbol: '🐠', color: 'fill-pink-400',
    speedMultiplier: 1.8, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 2, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deep: 'rgb(239, 158, 202)', mid: 'rgb(249, 168, 212)', shallow: 'rgb(255, 178, 222)' },
    elevationThresholds: { mid: -40, shallow: -15 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  DENSE_KELP_FOREST: {
    id: 'dense_kelp_forest', name: 'Dense Kelp Forest', symbol: '🌿', color: 'fill-teal-600',
    speedMultiplier: 2.5, visibilityFactor: 0.4, baseInherentVisibilityBonus: -2, prominence: 3, canopyBlockage: 15,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deep: 'rgb(5, 108, 100)', mid: 'rgb(15, 118, 110)', shallow: 'rgb(25, 128, 120)' },
    elevationThresholds: { mid: -100, shallow: -30 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ABYSSAL_OCEAN_FLOOR: {
    id: 'abyssal_ocean_floor', name: 'Abyssal Ocean Floor', symbol: '🌑', color: 'fill-blue-900',
    speedMultiplier: 2, visibilityFactor: 0.3, baseInherentVisibilityBonus: -2, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deep: 'rgb(7, 14, 29)', mid: 'rgb(17, 24, 39)', high: 'rgb(27, 34, 49)' },
    elevationThresholds: { mid: -4000, high: -1000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  HYDROTHERMAL_VENT_FIELD: {
    id: 'hydrothermal_vent_field', name: 'Hydrothermal Vent Field', symbol: '🫧', color: 'fill-gray-950',
    speedMultiplier: 999, visibilityFactor: 0.05, baseInherentVisibilityBonus: -10, prominence: 0, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: false,
    colors: { deep: 'rgb(0,0,10)', mid: 'rgb(5, 5, 20)', high: 'rgb(10, 10, 30)' },
    elevationThresholds: { mid: -5000, high: -2000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  OCEANIC_TRENCH: {
    id: 'oceanic_trench', name: 'Oceanic Trench', symbol: '↯', color: 'fill-black',
    speedMultiplier: 3, visibilityFactor: 0.05, baseInherentVisibilityBonus: -5, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { deepest: 'rgb(0,0,0)', mid: 'rgb(0,0,5)', upper: 'rgb(0,0,10)' },
    elevationThresholds: { mid: -8000, upper: -4000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  CLEAR_SKY: {
    id: 'clear_sky', name: 'Clear Sky', symbol: '☁️', color: 'fill-sky-300',
    speedMultiplier: 0.5, visibilityFactor: 1.5, baseInherentVisibilityBonus: 2, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(125, 196, 225)', mid: 'rgb(135, 206, 235)', high: 'rgb(145, 216, 245)' },
    elevationThresholds: { mid: 10000, high: 20000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  TURBULENT_AIR_CURRENTS: {
    id: 'turbulent_air_currents', name: 'Turbulent Air Currents', symbol: '🌬️', color: 'fill-sky-400',
    speedMultiplier: 2, visibilityFactor: 0.8, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(90, 170, 210)', mid: 'rgb(100, 180, 220)', high: 'rgb(110, 190, 230)' },
    elevationThresholds: { mid: 8000, high: 16000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  FLOATING_EARTHMOTE_CLUSTER: {
    id: 'floating_earthmote_cluster', name: 'Floating Earthmote Cluster', symbol: '🏝️', color: 'fill-amber-700',
    speedMultiplier: 1.2, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 50, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(170, 140, 90)', mid: 'rgb(180, 150, 100)', high: 'rgb(190, 160, 110)' },
    elevationThresholds: { mid: 5000, high: 10000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  CELESTIAL_SKY_ISLAND: {
    id: 'celestial_sky_island', name: 'Celestial Sky Island', symbol: '🏝️', color: 'fill-yellow-100',
    speedMultiplier: 1.2, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 50, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(244, 239, 185)', mid: 'rgb(254, 249, 195)', high: 'rgb(255, 255, 205)' },
    elevationThresholds: { mid: 15000, high: 25000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ETERNAL_BATTLEFIELD_PLAINS: {
    id: 'eternal_battlefield_plains', name: 'Eternal Battlefield Plains', symbol: '⚔️', color: 'fill-slate-600',
    speedMultiplier: 1.2, visibilityFactor: 0.8, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(140, 140, 150)', mid: 'rgb(150, 150, 160)', high: 'rgb(160, 160, 170)' },
    elevationThresholds: { mid: 100, high: 400 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ARCANE_RADIATION_WASTES: {
    id: 'arcane_radiation_wastes', name: 'Arcane Radiation Wastes', symbol: '☢️', color: 'fill-purple-700',
    speedMultiplier: 1.5, visibilityFactor: 1.1, baseInherentVisibilityBonus: -2, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(170, 140, 190)', mid: 'rgb(180, 150, 200)', high: 'rgb(190, 160, 210)' },
    elevationThresholds: { mid: 200, high: 800 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  NON_EUCLIDEAN_RUINS: {
    id: 'non_euclidean_ruins', name: 'Non-Euclidean Ruins', symbol: '🌀', color: 'fill-indigo-800',
    speedMultiplier: 4, visibilityFactor: 0.5, baseInherentVisibilityBonus: -3, prominence: 20, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(110, 70, 140)', mid: 'rgb(120, 80, 150)', high: 'rgb(130, 90, 160)' },
    elevationThresholds: { mid: 500, high: 1500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  FLESHCRAFTING_LABORATORY: {
    id: 'fleshcrafting_laboratory', name: 'Fleshcrafting Laboratory', symbol: '🧬', color: 'fill-red-900',
    speedMultiplier: 1.2, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(170, 70, 70)', mid: 'rgb(180, 80, 80)', high: 'rgb(190, 90, 90)' },
    elevationThresholds: { mid: 0, high: 50 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  RUINED_NECROPOLIS: {
    id: 'ruined_necropolis', name: 'Ruined Necropolis', symbol: '®️', color: 'fill-gray-300',
    speedMultiplier: 1.3, visibilityFactor: 0.9, baseInherentVisibilityBonus: 0, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(123, 123, 232)', mid: 'rgb(116, 116, 255)', high: 'rgb(62, 62, 255)' },
    elevationThresholds: { mid: 100, high: 300 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  REALITY_CANCER_FLESHLANDS: {
    id: 'reality_cancer_fleshlands', name: 'Reality-Cancer Fleshlands', symbol: '🦠', color: 'fill-pink-800',
    speedMultiplier: 4, visibilityFactor: 0.6, baseInherentVisibilityBonus: -4, prominence: 15, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(190, 40, 90)', mid: 'rgb(200, 50, 100)', high: 'rgb(210, 60, 110)' },
    elevationThresholds: { mid: 0, high: 100 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  FEY_EMOTION_LANDSCAPE: {
    id: 'fey_emotion_landscape', name: 'Fey Emotion-Landscape', symbol: '🎭', color: 'fill-fuchsia-400',
    speedMultiplier: 2.5, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 10, canopyBlockage: 10,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(210, 90, 245)', mid: 'rgb(220, 100, 255)', high: 'rgb(230, 110, 255)' },
    elevationThresholds: { mid: 50, high: 250 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  AERIAL_VORTEX: {
    id: 'aerial_vortex', name: 'Aerial Vortex', symbol: '🌀', color: 'fill-purple-900',
    speedMultiplier: 999, visibilityFactor: 0.1, baseInherentVisibilityBonus: -10, prominence: 0, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 0, 40)', mid: 'rgb(30, 0, 50)', high: 'rgb(40, 0, 60)' },
    elevationThresholds: { mid: 10000, high: 20000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  FLOATING_MOUNTAIN_BARRIER: {
    id: 'floating_mountain_barrier', name: 'Floating Mountain Barrier', symbol: '☁️🏔️', color: 'fill-slate-500',
    speedMultiplier: 999, visibilityFactor: 0.5, baseInherentVisibilityBonus: 5, prominence: 100, canopyBlockage: 0,
    isImpassable: true, blocksLineOfSight: true,
    colors: { low: 'rgb(90, 110, 130)', mid: 'rgb(100, 120, 140)', high: 'rgb(110, 130, 150)' },
    elevationThresholds: { mid: 8000, high: 15000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SPECTRAL_RAIN_ZONE: {
    id: 'spectral_rain_zone', name: 'Spectral Rain Zone', symbol: '💧', color: 'fill-slate-400',
    speedMultiplier: 1.1, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(160, 160, 180)', mid: 'rgb(170, 170, 190)', high: 'rgb(180, 180, 200)' },
    elevationThresholds: { mid: 50, high: 200 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ECHO_STORM_FIELD: {
    id: 'echo_storm_field', name: 'Echo Storm Field', symbol: '🌩️', color: 'fill-indigo-400',
    speedMultiplier: 2.0, visibilityFactor: 0.5, baseInherentVisibilityBonus: -3, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(120, 120, 140)', mid: 'rgb(130, 130, 150)', high: 'rgb(140, 140, 160)' },
    elevationThresholds: { mid: 100, high: 500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ETERNAL_WEEPING_HILLS: {
    id: 'eternal_weeping_hills', name: 'Eternal Weeping Hills', symbol: '😢', color: 'fill-teal-800',
    speedMultiplier: 1.5, visibilityFactor: 0.8, baseInherentVisibilityBonus: 1, prominence: 15, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(100, 130, 120)', mid: 'rgb(110, 140, 130)', high: 'rgb(120, 150, 140)' },
    elevationThresholds: { mid: 200, high: 500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  VOID_QUARTZ_VEINS: {
    id: 'void_quartz_veins', name: 'Void Quartz Veins', symbol: '🔮', color: 'fill-purple-900',
    speedMultiplier: 1.8, visibilityFactor: 1, baseInherentVisibilityBonus: 0, prominence: 2, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(10, 0, 20)', mid: 'rgb(20, 5, 30)', high: 'rgb(30, 10, 40)' },
    elevationThresholds: { mid: 0, high: 200 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  FLOATING_RUIN_FIELD: {
    id: 'floating_ruin_field', name: 'Floating Ruin Field', symbol: '🏛️', color: 'fill-gray-600',
    speedMultiplier: 1.3, visibilityFactor: 1.2, baseInherentVisibilityBonus: 2, prominence: 30, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(110, 110, 120)', mid: 'rgb(120, 120, 130)', high: 'rgb(130, 130, 140)' },
    elevationThresholds: { mid: 4000, high: 8000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  UNSTABLE_LEY_LINE_CONFLUX: {
    id: 'unstable_ley_line_conflux', name: 'Unstable Ley Line Conflux', symbol: '💥', color: 'fill-fuchsia-600',
    speedMultiplier: 3.0, visibilityFactor: 0.6, baseInherentVisibilityBonus: -2, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(150, 50, 200)', mid: 'rgb(170, 70, 220)', high: 'rgb(190, 90, 240)' },
    elevationThresholds: { mid: 100, high: 500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  CRIMSON_WIDOWS_VEIL_FIELD: {
    id: 'crimson_widows_veil_field', name: "Crimson Widow's Veil Field", symbol: '🍄', color: 'fill-red-700',
    speedMultiplier: 1.8, visibilityFactor: 0.4, baseInherentVisibilityBonus: -2, prominence: 5, canopyBlockage: 8,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(150, 20, 20)', mid: 'rgb(180, 30, 30)', high: 'rgb(210, 40, 40)' },
    elevationThresholds: { mid: 0, high: 100 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  MARROW_CAP_GROVE: {
    id: 'marrow_cap_grove', name: 'Marrow Cap Grove', symbol: '🦴', color: 'fill-stone-300',
    speedMultiplier: 1.2, visibilityFactor: 0.9, baseInherentVisibilityBonus: 0, prominence: 2, canopyBlockage: 5,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(200, 200, 180)', mid: 'rgb(210, 210, 190)', high: 'rgb(220, 220, 200)' },
    elevationThresholds: { mid: 50, high: 150 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ASHEN_BONE_PLAINS: {
    id: 'ashen_bone_plains', name: 'Ashen Bone Plains', symbol: '🌫️', color: 'fill-gray-400',
    speedMultiplier: 1.1, visibilityFactor: 1.1, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(190, 190, 190)', mid: 'rgb(200, 200, 200)', high: 'rgb(210, 210, 210)' },
    elevationThresholds: { mid: 100, high: 300 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  HARMONIC_CRYSTAL_PILLARS: {
    id: 'harmonic_crystal_pillars', name: 'Harmonic Crystal Pillars', symbol: '💎', color: 'fill-teal-400',
    speedMultiplier: 2.2, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 30, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(100, 180, 180)', mid: 'rgb(120, 200, 200)', high: 'rgb(140, 220, 220)' },
    elevationThresholds: { mid: 200, high: 800 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  TELLURIC_FLUX_ZONE: {
    id: 'telluric_flux_zone', name: 'Telluric Flux Zone', symbol: '🌍', color: 'fill-amber-800',
    speedMultiplier: 1.8, visibilityFactor: 0.7, baseInherentVisibilityBonus: -1, prominence: 10, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(140, 100, 60)', mid: 'rgb(160, 120, 80)', high: 'rgb(180, 140, 100)' },
    elevationThresholds: { mid: 0, high: 200 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  LIVING_MIST_SEA: {
    id: 'living_mist_sea', name: 'Living Mist Sea', symbol: '🌫️', color: 'fill-slate-500',
    speedMultiplier: 1.5, visibilityFactor: 0.1, baseInherentVisibilityBonus: -4, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(140, 150, 160)', mid: 'rgb(160, 170, 180)', high: 'rgb(180, 190, 200)' },
    elevationThresholds: { mid: 50, high: 250 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  ECHO_BAZAAR: {
    id: 'echo_bazaar', name: 'Echo Bazaar', symbol: '🗣️', color: 'fill-violet-600',
    speedMultiplier: 1, visibilityFactor: 0.9, baseInherentVisibilityBonus: -1, prominence: 5, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(120, 100, 130)', mid: 'rgb(140, 120, 150)', high: 'rgb(160, 140, 170)' },
    elevationThresholds: { mid: 0, high: 100 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  FROZEN_SOUL_GLACIER: {
    id: 'frozen_soul_glacier', name: 'Frozen Soul Glacier', symbol: '🧊', color: 'fill-sky-300',
    speedMultiplier: 3, visibilityFactor: 1, baseInherentVisibilityBonus: 1, prominence: 40, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(150, 180, 220)', mid: 'rgb(170, 200, 240)', high: 'rgb(190, 220, 255)' },
    elevationThresholds: { mid: 1000, high: 2500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  WHITE_BLOOD_SNOWFIELD: {
    id: 'white_blood_snowfield', name: 'White Blood Snowfield', symbol: '❄️', color: 'fill-gray-200',
    speedMultiplier: 1.6, visibilityFactor: 0.8, baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(220, 210, 210)', mid: 'rgb(230, 220, 220)', high: 'rgb(240, 230, 230)' },
    elevationThresholds: { mid: 500, high: 1500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  KRAKEN_BONE_TRENCH: {
    id: 'kraken_bone_trench', name: 'Kraken Bone Trench', symbol: '🐙', color: 'fill-slate-800',
    speedMultiplier: 2.5, visibilityFactor: 0.2, baseInherentVisibilityBonus: -3, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(20, 20, 40)', mid: 'rgb(30, 30, 50)', high: 'rgb(40, 40, 60)' },
    elevationThresholds: { mid: -5000, high: -2000 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  WHISPERING_JELLYFISH_SWARM: {
    id: 'whispering_jellyfish_swarm', name: 'Whispering Jellyfish Swarm', symbol: '🎐', color: 'fill-blue-300',
    speedMultiplier: 1.8, visibilityFactor: 0.6, baseInherentVisibilityBonus: -1, prominence: 0, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(150, 150, 220)', mid: 'rgb(170, 170, 240)', high: 'rgb(190, 190, 255)' },
    elevationThresholds: { mid: -500, high: -100 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  OBSIDIAN_ZIGGURAT_RUINS: {
    id: 'obsidian_ziggurat_ruins', name: 'Obsidian Ziggurat Ruins', symbol: '🔺', color: 'fill-black',
    speedMultiplier: 2, visibilityFactor: 0.7, baseInherentVisibilityBonus: 1, prominence: 40, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(25, 10, 30)', mid: 'rgb(35, 15, 40)', high: 'rgb(45, 20, 50)' },
    elevationThresholds: { mid: 100, high: 400 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  BLOODVINE_JUNGLE: {
    id: 'bloodvine_jungle', name: 'Bloodvine Jungle', symbol: '🩸', color: 'fill-red-800',
    speedMultiplier: 3.8, visibilityFactor: 0.1, baseInherentVisibilityBonus: -3, prominence: 12, canopyBlockage: 30,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(100, 20, 30)', mid: 'rgb(120, 30, 40)', high: 'rgb(140, 40, 50)' },
    elevationThresholds: { mid: 50, high: 300 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  SILVERDEW_SPRING: {
    id: 'silverdew_spring', name: 'Silverdew Spring', symbol: '💧', color: 'fill-cyan-100',
    speedMultiplier: 1, visibilityFactor: 1.1, baseInherentVisibilityBonus: 1, prominence: 1, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(180, 200, 210)', mid: 'rgb(200, 220, 230)', high: 'rgb(220, 240, 250)' },
    elevationThresholds: { mid: 50, high: 200 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  FLESHFORGED_DEMON_CITADEL: {
    id: 'fleshforged_demon_citadel', name: 'Fleshforged Demon Citadel', symbol: '👹', color: 'fill-rose-900',
    speedMultiplier: 1.5, visibilityFactor: 0.6, baseInherentVisibilityBonus: -2, prominence: 60, canopyBlockage: 0,
    isImpassable: false, blocksLineOfSight: true,
    colors: { low: 'rgb(110, 50, 60)', mid: 'rgb(130, 60, 70)', high: 'rgb(150, 70, 80)' },
    elevationThresholds: { mid: 100, high: 500 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
  VOID_FUNGUS_CAVERNS: {
    id: 'void_fungus_caverns', name: 'Void Fungus Caverns', symbol: '🍄', color: 'fill-indigo-900',
    speedMultiplier: 2.2, visibilityFactor: 0.2, baseInherentVisibilityBonus: -4, prominence: 5, canopyBlockage: 15,
    isImpassable: false, blocksLineOfSight: false,
    colors: { low: 'rgb(40, 30, 50)', mid: 'rgb(60, 50, 70)', high: 'rgb(80, 70, 90)' },
    elevationThresholds: { mid: -2000, high: -800 },
        encounterChanceOnEnter: 5,
    encounterChanceOnDiscover: 5
  },
};

export const TerrainType = Object.fromEntries(
  Object.entries(TERRAIN_METADATA).map(([key, data]) => [key, data.id])
);

export const TERRAIN_TYPES_CONFIG = Object.fromEntries(
  Object.entries(TERRAIN_METADATA).map(([key, data]) => {
    const { colors, elevationThresholds, ...gameplayData } = data;
    
    const finalConfig = {
      ...gameplayData,
      colors: colors,
      elevationColor: (elevation) => {
        if (elevationThresholds.light !== undefined && colors.light && colors.dark) {
          return elevation < elevationThresholds.light ? colors.dark : colors.light;
        }
        if (elevationThresholds.hot !== undefined && colors.hot && colors.cool) {
          return elevation < elevationThresholds.hot ? colors.cool : colors.hot;
        }
        if (elevationThresholds.mid !== undefined && elevationThresholds.high !== undefined) {
          if (elevation < elevationThresholds.mid) return colors.low;
          if (elevation < elevationThresholds.high) return colors.mid;
          return colors.high;
        }
        if (elevationThresholds.mid !== undefined && elevationThresholds.shallow !== undefined) {
            if (elevation < elevationThresholds.mid) return colors.deep;
            if (elevation < elevationThresholds.shallow) return colors.mid;
            return colors.shallow;
        }
        if (elevationThresholds.mid !== undefined && elevationThresholds.upper !== undefined) {
          if (elevation < elevationThresholds.mid) return colors.deepest;
          if (elevation < elevationThresholds.upper) return colors.mid;
          return colors.upper;
      }
        return colors.low || colors.dark || colors.cool || Object.values(colors)[0];
      }
    };

    return [data.id, finalConfig];
  })
);

export const DEFAULT_TERRAIN_TYPE = TerrainType.ROLLING_PLAINS;
export const MOUNTAIN_THRESHOLD = 600;
export const HILLS_THRESHOLD = 300;

export const HEX_SIZE = 30;
export const INITIAL_GRID_WIDTH = 12;
export const INITIAL_GRID_HEIGHT = 8;
export const MIN_GRID_DIMENSION = 1;
export const MAX_GRID_DIMENSION = 50;

export const MIN_ELEVATION = -16000;
export const MAX_ELEVATION = 46000;
export const ELEVATION_STEP = 100;
export const DEFAULT_CUSTOM_ELEVATION_STEP = 100;
export const DEFAULT_SET_ELEVATION_VALUE = 0;
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


const TerrainGroup = {
  // Ground - Open
  OPEN_FLAT_GROUND: 'OPEN_FLAT_GROUND', // Plains, beaches, steppes, dry salt flats
  OPEN_ROUGH_GROUND: 'OPEN_ROUGH_GROUND', // Grassy hills, rocky deserts, badlands, ruins
  OPEN_OBSTRUCTED_GROUND: 'OPEN_OBSTRUCTED_GROUND', // Tallgrass prairie, light scrub

  // Ground - Forested
  FOREST_SPARSE_GROUND: 'FOREST_SPARSE_GROUND', // Birch, savanna woodland, light ruins
  FOREST_MODERATE_GROUND: 'FOREST_MODERATE_GROUND', // Oak forest, typical pine forest
  FOREST_DENSE_GROUND: 'FOREST_DENSE_GROUND', // Rainforest, jungle, dense pine, ironleaf, moonoak, mangrove

  // Ground - Difficult/Hazardous
  SWAMP_MUDDY_GROUND: 'SWAMP_MUDDY_GROUND', // Swamps, marshes, mires (if not impassable)
  DESERT_SAND_GROUND: 'DESERT_SAND_GROUND', // Sand dunes, quicksand (if not impassable)
  MOUNTAIN_SLOPES_GROUND: 'MOUNTAIN_SLOPES_GROUND', // Foothills, lower mountains, alpine tundra, canyons
  MOUNTAIN_STEEP_GROUND: 'MOUNTAIN_STEEP_GROUND', // Steeper mountain paths, difficult alpine
  ARCTIC_COLD_GROUND: 'ARCTIC_COLD_GROUND', // Ice flats, glaciers, snowfields
  VOLCANIC_HAZARD_GROUND: 'VOLCANIC_HAZARD_GROUND', // Obsidian fields, geothermal areas (cooled)
  UNIQUE_OTHERWORLDLY_GROUND: 'UNIQUE_OTHERWORLDLY_GROUND', // Fey, reality cancer, arcane wastes, fleshlands

  // Subterranean
  CAVERN_EASY_SUB: 'CAVERN_EASY_SUB', // Compact earth caverns, large natural tunnels
  CAVERN_DIFFICULT_SUB: 'CAVERN_DIFFICULT_SUB', // Crystal/fungi caves, complex tunnels
  CAVERN_HAZARDOUS_SUB: 'CAVERN_HAZARDOUS_SUB', // Magma tubes (cooled), unstable areas

  // Aquatic
  AQUATIC_SHALLOW_OPEN: 'AQUATIC_SHALLOW_OPEN', // Coastal shallows, calm riverbeds
  AQUATIC_SHALLOW_OBSTRUCTED: 'AQUATIC_SHALLOW_OBSTRUCTED', // Coral reefs, kelp edges
  AQUATIC_DEEP_OPEN: 'AQUATIC_DEEP_OPEN', // Abyssal floor, open ocean trench
  AQUATIC_DEEP_HAZARDOUS: 'AQUATIC_DEEP_HAZARDOUS', // Hydrothermal vents

  // Aerial
  AERIAL_CLEAR_OPEN: 'AERIAL_CLEAR_OPEN', // Clear sky, high altitude over flat terrain
  AERIAL_OBSTRUCTED_LOW: 'AERIAL_OBSTRUCTED_LOW', // Flying near/through forest canopy, around tall structures/ruins
  AERIAL_HAZARDOUS_CONDITIONS: 'AERIAL_HAZARDOUS_CONDITIONS', // Turbulent air, storms, mist, geothermal updrafts
  AERIAL_HIGH_ALTITUDE_MOUNTAIN: 'AERIAL_HIGH_ALTITUDE_MOUNTAIN', // Flying over/around high peaks
  AERIAL_UNIQUE_PHENOMENA: 'AERIAL_UNIQUE_PHENOMENA', // Floating islands, ley lines, aerial vortex (if not impassable)

  // Impassable Categories (for convenience, though individual terrains also have isImpassable)
  IMPASSABLE_SOLID_BARRIER: 'IMPASSABLE_SOLID_BARRIER', // Sheer walls, adamantine
  IMPASSABLE_DEEP_LIQUID_HAZARD: 'IMPASSABLE_DEEP_LIQUID_HAZARD', // Lava river, tar pits
  IMPASSABLE_AERIAL_VOID: 'IMPASSABLE_AERIAL_VOID', // True aerial vortexes that are instant death

  UNKNOWN_DEFAULT: 'UNKNOWN_DEFAULT' // Fallback
};

function generateExpandedTerrainPenalties(
  mountGroupPenalties,
  terrainToGroupMap, // e.g., { [TerrainType.ROLLING_PLAINS]: TerrainGroup.OPEN_FLAT_GROUND, ... }
  allTerrainConfigs // e.g., TERRAIN_TYPES_CONFIG
) {
  const expandedPenalties = {};
  const {
    travelMode, // 'ground', 'aerial', 'aquatic', 'subterranean'
    basePenalty, // Base time factor on ideal terrain for this mount (e.g., 1.0 for walking, 0.6 for horse)
    groupMultipliers, // { [TerrainGroup.SOME_GROUP]: 1.5, ... } - these multiply the basePenalty
    defaultMultiplier, // Default multiplier for groups not explicitly listed for this mount
    impassableOverride // Value for impassable terrain (e.g., 999)
  } = mountGroupPenalties;

  for (const terrainId in allTerrainConfigs) {
    if (!allTerrainConfigs.hasOwnProperty(terrainId)) continue;

    const terrainConfigData = allTerrainConfigs[terrainId];
    const terrainGroup = terrainToGroupMap[terrainId] || TerrainGroup.UNKNOWN_DEFAULT;
    let finalPenaltyValue = impassableOverride;

    // Determine if inherently impassable by the terrain's own flag or by mode mismatch
    let isTerrainImpassableForThisMode = terrainConfigData.isImpassable; // Base impassability

    if (travelMode === 'ground' && (terrainGroup.startsWith('AQUATIC_') || terrainGroup.startsWith('AERIAL_') || terrainGroup === TerrainGroup.IMPASSABLE_DEEP_LIQUID_HAZARD)) {
      isTerrainImpassableForThisMode = true;
    } else if (travelMode === 'aerial' && (terrainGroup.startsWith('AQUATIC_') || terrainGroup.startsWith('CAVERN_') || terrainGroup === TerrainGroup.IMPASSABLE_AERIAL_VOID)) {
      // Exception: Giant open-to-sky caverns might be flyable, handle with specific group.
      isTerrainImpassableForThisMode = true;
    } else if (travelMode === 'aquatic' && (!terrainGroup.startsWith('AQUATIC_'))) {
      isTerrainImpassableForThisMode = true;
    } else if (travelMode === 'subterranean' && (!terrainGroup.startsWith('CAVERN_') && !terrainGroup.startsWith('OPEN_') /* for surfacing */)) {
         isTerrainImpassableForThisMode = true;
    }
    // Add more sophisticated checks if needed, e.g., isImpassableForAerial flags on terrainConfigData

    if (isTerrainImpassableForThisMode) {
      finalPenaltyValue = impassableOverride;
    } else {
      let specificMultiplier = groupMultipliers[terrainGroup];

      if (specificMultiplier === undefined) {
        // Special handling for aerial mounts flying OVER ground terrain not explicitly covered by an AERIAL_OBSTRUCTED_LOW type group for that ground type
        if (travelMode === 'aerial' && (terrainGroup.endsWith('_GROUND') || terrainGroup.endsWith('_SUB'))) {
            specificMultiplier = groupMultipliers[TerrainGroup.AERIAL_CLEAR_OPEN] !== undefined ? groupMultipliers[TerrainGroup.AERIAL_CLEAR_OPEN] : 1.0; // Default to clear flying over it
            // Example: if flying over a volcano, and AERIAL_HAZARDOUS_CONDITIONS has a multiplier, apply it
            if (terrainGroup === TerrainGroup.VOLCANIC_HAZARD_GROUND && groupMultipliers[TerrainGroup.AERIAL_HAZARDOUS_CONDITIONS]) {
                 specificMultiplier *= groupMultipliers[TerrainGroup.AERIAL_HAZARDOUS_CONDITIONS];
            }
        } else {
           specificMultiplier = defaultMultiplier;
        }
      }

      if (specificMultiplier === impassableOverride) {
        finalPenaltyValue = impassableOverride;
      } else {
        finalPenaltyValue = basePenalty * specificMultiplier;
      }
    }
    expandedPenalties[terrainId] = parseFloat(finalPenaltyValue.toFixed(2));
  }
  return expandedPenalties;
}


const MIXED_GROUND_MOUNTS_GROUP_PENALTIES = {
  travelMode: 'ground',
  basePenalty: 0.7, // Sits between a fast horse/wolf and a slower, sturdier mount like a Kodo.
  groupMultipliers: {
    [TerrainGroup.OPEN_FLAT_GROUND]: 1.0,          // Total: 0.7
    [TerrainGroup.OPEN_ROUGH_GROUND]: 1.4,          // Total: ~0.98 (handles it okay)
    [TerrainGroup.OPEN_OBSTRUCTED_GROUND]: 1.3,   // Total: ~0.91
    [TerrainGroup.FOREST_SPARSE_GROUND]: 1.8,          // Total: ~1.26
    [TerrainGroup.FOREST_MODERATE_GROUND]: 3.0,          // Total: 2.1
    [TerrainGroup.FOREST_DENSE_GROUND]: 5.0,          // Total: 3.5 (slow, but not impossible if some mounts can manage)
    [TerrainGroup.SWAMP_MUDDY_GROUND]: 7.0,          // Total: 4.9 (difficult, some might get stuck)
    [TerrainGroup.DESERT_SAND_GROUND]: 3.5,          // Total: ~2.45
    [TerrainGroup.MOUNTAIN_SLOPES_GROUND]: 2.5,          // Total: 1.75
    [TerrainGroup.MOUNTAIN_STEEP_GROUND]: 6.0,          // Total: 4.2 (very hard, relies on sure-footed types)
    [TerrainGroup.ARCTIC_COLD_GROUND]: 3.5,          // Total: ~2.45
    [TerrainGroup.VOLCANIC_HAZARD_GROUND]: 5.0,      // Total: 3.5
    [TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND]: 4.0,   // Total: 2.8
    [TerrainGroup.CAVERN_EASY_SUB]: 999, // Generally, mixed ground mounts aren't for caving
    [TerrainGroup.IMPASSABLE_SOLID_BARRIER]: 999,
    [TerrainGroup.IMPASSABLE_DEEP_LIQUID_HAZARD]: 999,
  },
  defaultMultiplier: 4.0, // For unlisted ground terrain groups
  impassableOverride: 999
};

const MIXED_FLYING_MOUNTS_GROUP_PENALTIES = {
  travelMode: 'aerial',
  basePenalty: 0.32, // Average of typical flying mounts.
  groupMultipliers: {
    [TerrainGroup.AERIAL_CLEAR_OPEN]: 1.0,            // Total: 0.32
    [TerrainGroup.AERIAL_OBSTRUCTED_LOW]: 2.0,      // Total: 0.64 (some flyers better than others here)
    [TerrainGroup.AERIAL_HAZARDOUS_CONDITIONS]: 3.0,  // Total: ~0.96 (average resilience to weather)
    [TerrainGroup.AERIAL_HIGH_ALTITUDE_MOUNTAIN]: 1.8, // Total: ~0.58
    [TerrainGroup.AERIAL_UNIQUE_PHENOMENA]: 2.5,     // Total: 0.8
    [TerrainGroup.IMPASSABLE_AERIAL_VOID]: 999,
    // Flying over ground terrain:
    [TerrainGroup.FOREST_DENSE_GROUND]: 2.0, // (Implies AERIAL_OBSTRUCTED_LOW for some in the group)
    [TerrainGroup.MOUNTAIN_STEEP_GROUND]: 1.5, // (Average turbulence/effort)
    [TerrainGroup.CLOUD_MIST_FOREST]: 3.5, // (Average difficulty with severe visibility/weather)
  },
  defaultMultiplier: 1.5, // Flying over generic ground or in generic air for the mix
  impassableOverride: 999
};

const RIDING_HORSE_GROUP_PENALTIES = {
  travelMode: 'ground', // Helps the generator function
  // Base penalty (time factor relative to standard walking) on ideal terrain for this mount
  basePenalty: 0.6, // e.g., on OPEN_FLAT_GROUND
  groupMultipliers: { // Multipliers on its own basePenalty, or absolute if preferred
    [TerrainGroup.OPEN_FLAT_GROUND]: 1.0, // Factor of 0.6 * 1.0 = 0.6
    [TerrainGroup.OPEN_ROUGH_GROUND]: 1.7, // Factor of 0.6 * 1.7 = ~1.0
    [TerrainGroup.OPEN_OBSTRUCTED_GROUND]: 1.5,
    [TerrainGroup.FOREST_SPARSE_GROUND]: 2.5,
    [TerrainGroup.FOREST_MODERATE_GROUND]: 3.0,
    [TerrainGroup.FOREST_DENSE_GROUND]: 6.0,
    [TerrainGroup.SWAMP_MUDDY_GROUND]: 7.0,
    [TerrainGroup.DESERT_SAND_GROUND]: 3.5,
    [TerrainGroup.MOUNTAIN_SLOPES_GROUND]: 2.5,
    [TerrainGroup.MOUNTAIN_STEEP_GROUND]: 8.0,
    [TerrainGroup.ARCTIC_COLD_GROUND]: 4.0,
    [TerrainGroup.VOLCANIC_HAZARD_GROUND]: 5.0,
    [TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND]: 5.0, // General high penalty
    // Impassable by default for non-ground types
    [TerrainGroup.CAVERN_EASY_SUB]: 999,
    [TerrainGroup.AQUATIC_SHALLOW_OPEN]: 999,
    [TerrainGroup.AERIAL_CLEAR_OPEN]: 999,
    [TerrainGroup.IMPASSABLE_SOLID_BARRIER]: 999,
    [TerrainGroup.IMPASSABLE_DEEP_LIQUID_HAZARD]: 999,
  },
  defaultMultiplier: 4.0, // For ground terrains not explicitly listed
  impassableOverride: 999
};

const STURDY_CART_WAGON_GROUP_PENALTIES = {
  travelMode: 'ground',
  basePenalty: 0.8, // On a good road (conceptual, map to OPEN_FLAT_GROUND or similar)
  groupMultipliers: {
    [TerrainGroup.OPEN_FLAT_GROUND]: 1.2, // Slightly worse than just horse on plains
    [TerrainGroup.OPEN_ROUGH_GROUND]: 3.0,
    [TerrainGroup.OPEN_OBSTRUCTED_GROUND]: 2.5,
    [TerrainGroup.FOREST_SPARSE_GROUND]: 5.0, // Needs clear paths
    [TerrainGroup.FOREST_MODERATE_GROUND]: 8.0,
    [TerrainGroup.FOREST_DENSE_GROUND]: 999, // Usually impassable
    [TerrainGroup.SWAMP_MUDDY_GROUND]: 999,
    [TerrainGroup.DESERT_SAND_GROUND]: 999,
    [TerrainGroup.MOUNTAIN_SLOPES_GROUND]: 6.0,
    [TerrainGroup.MOUNTAIN_STEEP_GROUND]: 999,
    [TerrainGroup.ARCTIC_COLD_GROUND]: 7.0, // If sled possible, else higher
    // ... other categories
  },
  defaultMultiplier: 8.0,
  impassableOverride: 999
};

const WALKING_ON_FOOT_GROUP_PENALTIES = {
  travelMode: 'ground',
  basePenalty: 1.0, // Baseline speed
  groupMultipliers: {
    [TerrainGroup.OPEN_FLAT_GROUND]: 1.0,
    [TerrainGroup.OPEN_ROUGH_GROUND]: 1.5,
    [TerrainGroup.OPEN_OBSTRUCTED_GROUND]: 1.2,
    [TerrainGroup.FOREST_SPARSE_GROUND]: 1.3,
    [TerrainGroup.FOREST_MODERATE_GROUND]: 1.8,
    [TerrainGroup.FOREST_DENSE_GROUND]: 2.5,
    [TerrainGroup.SWAMP_MUDDY_GROUND]: 3.0,
    [TerrainGroup.DESERT_SAND_GROUND]: 2.0, // Deep sand is tiring
    [TerrainGroup.MOUNTAIN_SLOPES_GROUND]: 2.0,
    [TerrainGroup.MOUNTAIN_STEEP_GROUND]: 3.5,
    [TerrainGroup.ARCTIC_COLD_GROUND]: 2.2,
    [TerrainGroup.VOLCANIC_HAZARD_GROUND]: 2.5,
    [TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND]: 2.0, // Varies wildly
    [TerrainGroup.CAVERN_EASY_SUB]: 1.2,
    [TerrainGroup.CAVERN_DIFFICULT_SUB]: 2.0,
    [TerrainGroup.CAVERN_HAZARDOUS_SUB]: 3.0,
    [TerrainGroup.IMPASSABLE_SOLID_BARRIER]: 999,
    [TerrainGroup.IMPASSABLE_DEEP_LIQUID_HAZARD]: 999,
  },
  defaultMultiplier: 2.0,
  impassableOverride: 999
};


const SWIFT_WOLF_RIDING_GROUP_PENALTIES = { // WoW Inspired
  travelMode: 'ground',
  basePenalty: 0.55, // Slightly faster/more agile than a horse on its preferred terrain
  groupMultipliers: {
    [TerrainGroup.OPEN_FLAT_GROUND]: 1.0,          // Total: 0.55
    [TerrainGroup.OPEN_ROUGH_GROUND]: 1.5,          // Total: ~0.83
    [TerrainGroup.OPEN_OBSTRUCTED_GROUND]: 1.2,   // Total: 0.66
    [TerrainGroup.FOREST_SPARSE_GROUND]: 1.4,          // Total: ~0.77 (good in light woods)
    [TerrainGroup.FOREST_MODERATE_GROUND]: 2.5,          // Total: ~1.38
    [TerrainGroup.FOREST_DENSE_GROUND]: 6.0,          // Total: 3.3
    [TerrainGroup.MOUNTAIN_SLOPES_GROUND]: 2.0,          // Total: 1.1
    [TerrainGroup.MOUNTAIN_STEEP_GROUND]: 7.0,          // Total: 3.85 (better than horse but still hard)
    [TerrainGroup.ARCTIC_COLD_GROUND]: 3.0,          // Total: 1.65 (hardy)
    [TerrainGroup.SWAMP_MUDDY_GROUND]: 999,
    [TerrainGroup.DESERT_SAND_GROUND]: 5.0,
    [TerrainGroup.IMPASSABLE_SOLID_BARRIER]: 999,
  },
  defaultMultiplier: 4.0,
  impassableOverride: 999
};

const STURDY_KODO_RIDING_GROUP_PENALTIES = { // WoW Inspired
  travelMode: 'ground',
  basePenalty: 0.8, // Slower base, but resilient
  groupMultipliers: {
    [TerrainGroup.OPEN_FLAT_GROUND]: 1.0,         // Total: 0.8
    [TerrainGroup.OPEN_ROUGH_GROUND]: 1.1,         // Total: ~0.88 (good here)
    [TerrainGroup.OPEN_OBSTRUCTED_GROUND]: 1.3,  // Total: ~1.04
    [TerrainGroup.FOREST_SPARSE_GROUND]: 2.0,         // Total: 1.6
    [TerrainGroup.FOREST_MODERATE_GROUND]: 4.0,         // Total: 3.2 (can push through some)
    [TerrainGroup.FOREST_DENSE_GROUND]: 9.0,         // Total: 7.2 (very slow)
    [TerrainGroup.DESERT_SAND_GROUND]: 1.5,         // Total: 1.2 (good in deserts)
    [TerrainGroup.SWAMP_MUDDY_GROUND]: 5.0,         // Total: 4.0 (can manage some softer ground)
    [TerrainGroup.MOUNTAIN_SLOPES_GROUND]: 2.5,         // Total: 2.0
    [TerrainGroup.ARCTIC_COLD_GROUND]: 3.0,         // Total: 2.4
    [TerrainGroup.IMPASSABLE_SOLID_BARRIER]: 999,
  },
  defaultMultiplier: 5.0,
  impassableOverride: 999
};

const MECHANOSTRIDER_RIDING_GROUP_PENALTIES = { // WoW Inspired
  travelMode: 'ground',
  basePenalty: 0.5, // Very fast on ideal surfaces
  groupMultipliers: {
    [TerrainGroup.OPEN_FLAT_GROUND]: 1.0,        // Total: 0.5 (roads, hardpan desert)
    [TerrainGroup.SHORTGRASS_STEPPE]: 1.1,       // Total: 0.55
    [TerrainGroup.SALT_FLATS_DRY]: 0.9,          // Total: 0.45 (excellent!)
    [TerrainGroup.OPEN_ROUGH_GROUND]: 4.0,        // Total: 2.0 (bad on rocks/rubble)
    [TerrainGroup.OPEN_OBSTRUCTED_GROUND]: 3.0,  // Total: 1.5
    [TerrainGroup.FOREST_SPARSE_GROUND]: 5.0,        // Total: 2.5 (gets snagged)
    [TerrainGroup.FOREST_MODERATE_GROUND]: 999,
    [TerrainGroup.FOREST_DENSE_GROUND]: 999,
    [TerrainGroup.SWAMP_MUDDY_GROUND]: 999,      // Prone to malfunction/sinking
    [TerrainGroup.DESERT_SAND_GROUND]: 6.0,        // Total: 3.0 (clogs gears)
    [TerrainGroup.MOUNTAIN_SLOPES_GROUND]: 999,   // Cannot handle inclines well
    [TerrainGroup.ARCTIC_ICE_FLATS]: 2.0,         // Total: 1.0 (if not too uneven)
    [TerrainGroup.VOLCANIC_HAZARD_GROUND]: 7.0,   // Total: 3.5 (heat, dust)
    [TerrainGroup.AQUATIC_SHALLOW_OPEN]: 999, // Water bad for mechanics
    [TerrainGroup.IMPASSABLE_SOLID_BARRIER]: 999,
  },
  defaultMultiplier: 6.0,
  impassableOverride: 999
};

const WIND_RIDER_FLIGHT_GROUP_PENALTIES = { // Wyvern - WoW Inspired
  travelMode: 'aerial',
  basePenalty: 0.35, // Standard aerial mount speed
  groupMultipliers: {
    [TerrainGroup.AERIAL_CLEAR_OPEN]: 1.0,            // Total: 0.35
    [TerrainGroup.AERIAL_OBSTRUCTED_LOW]: 1.7,      // Total: ~0.6 (flying through canopy/ruins)
    [TerrainGroup.AERIAL_HAZARDOUS_CONDITIONS]: 2.5,  // Total: ~0.88 (storms, strong winds)
    [TerrainGroup.AERIAL_HIGH_ALTITUDE_MOUNTAIN]: 1.5, // Total: ~0.53 (stronger winds, thinner air)
    [TerrainGroup.AERIAL_UNIQUE_PHENOMENA]: 2.0,     // Total: 0.7
    [TerrainGroup.IMPASSABLE_AERIAL_VOID]: 999,
    // Flying over ground terrain:
    [TerrainGroup.FOREST_DENSE_GROUND]: 1.7, // (Implies AERIAL_OBSTRUCTED_LOW)
    [TerrainGroup.MOUNTAIN_STEEP_GROUND]: 1.3, // (Implies some AERIAL_HIGH_ALTITUDE turbulence)
    [TerrainGroup.CLOUD_MIST_FOREST]: 2.8, // (Visibility + AERIAL_HAZARDOUS_CONDITIONS)
  },
  defaultMultiplier: 1.2, // Flying over generic ground or in generic air
  impassableOverride: 999
};

const FLYING_MACHINE_FLIGHT_GROUP_PENALTIES = { // WoW Inspired
  travelMode: 'aerial',
  basePenalty: 0.3, // Potentially faster in ideal conditions
  groupMultipliers: {
    [TerrainGroup.AERIAL_CLEAR_OPEN]: 1.0,            // Total: 0.3
    [TerrainGroup.AERIAL_OBSTRUCTED_LOW]: 2.5,      // Total: 0.75 (clunky, risk of collision)
    [TerrainGroup.AERIAL_HAZARDOUS_CONDITIONS]: 4.0,  // Total: 1.2 (very susceptible to weather/turbulence)
    [TerrainGroup.AERIAL_HIGH_ALTITUDE_MOUNTAIN]: 2.0, // Total: 0.6 (engine performance issues?)
    [TerrainGroup.AERIAL_UNIQUE_PHENOMENA]: 3.0,     // Total: 0.9 (magical interference)
    [TerrainGroup.IMPASSABLE_AERIAL_VOID]: 999,
  },
  defaultMultiplier: 1.5,
  impassableOverride: 999
};


export const TERRAIN_TYPE_TO_GROUP_MAP = {
  [TerrainType.ROLLING_PLAINS]: TerrainGroup.OPEN_FLAT_GROUND,
  [TerrainType.TALLGRASS_PRAIRIE]: TerrainGroup.OPEN_OBSTRUCTED_GROUND,
  [TerrainType.SHORTGRASS_STEPPE]: TerrainGroup.OPEN_FLAT_GROUND,
  [TerrainType.OAK_FOREST]: TerrainGroup.FOREST_MODERATE_GROUND,
  [TerrainType.PINE_FOREST]: TerrainGroup.FOREST_MODERATE_GROUND, // Could be DENSE based on your vision
  [TerrainType.BIRCH_FOREST]: TerrainGroup.FOREST_SPARSE_GROUND,
  [TerrainType.GRASSY_HILLS]: TerrainGroup.OPEN_ROUGH_GROUND,
  [TerrainType.ROCKY_FOOTHILLS]: TerrainGroup.MOUNTAIN_SLOPES_GROUND,
  [TerrainType.ALPINE_TUNDRA]: TerrainGroup.ARCTIC_COLD_GROUND, // Also MOUNTAIN_STEEP_GROUND elements
  [TerrainType.COASTAL_BEACH]: TerrainGroup.OPEN_FLAT_GROUND,
  [TerrainType.FRESHWATER_SWAMP]: TerrainGroup.SWAMP_MUDDY_GROUND,
  [TerrainType.REED_MARSH]: TerrainGroup.SWAMP_MUDDY_GROUND,
  [TerrainType.SAND_DUNES_DESERT]: TerrainGroup.DESERT_SAND_GROUND,
  [TerrainType.ROCKY_INFERTILE_DESERT]: TerrainGroup.OPEN_ROUGH_GROUND,
  [TerrainType.ARCTIC_ICE_FLATS]: TerrainGroup.ARCTIC_COLD_GROUND,
  [TerrainType.SAVANNA_WOODLAND]: TerrainGroup.FOREST_SPARSE_GROUND,
  [TerrainType.RAINFOREST_JUNGLE]: TerrainGroup.FOREST_DENSE_GROUND,
  [TerrainType.MANGROVE_COAST]: TerrainGroup.FOREST_DENSE_GROUND, // Also SWAMP_MUDDY elements
  [TerrainType.CLOUD_MIST_FOREST]: TerrainGroup.FOREST_DENSE_GROUND, // Also AERIAL_HAZARDOUS_CONDITIONS for flight
  [TerrainType.GLACIAL_FJORDS]: TerrainGroup.MOUNTAIN_STEEP_GROUND, // For land portions, AQUATIC_DEEP_OPEN for water
  [TerrainType.SALT_FLATS_DRY]: TerrainGroup.OPEN_FLAT_GROUND,
  [TerrainType.CRIMSON_CANYON_LANDS]: TerrainGroup.MOUNTAIN_SLOPES_GROUND,
  [TerrainType.GEOTHERMAL_SPRINGS]: TerrainGroup.VOLCANIC_HAZARD_GROUND,
  [TerrainType.ANCIENT_OVERGROWN_RUINS]: TerrainGroup.OPEN_ROUGH_GROUND, // Can lean FOREST_SPARSE if heavily wooded
  [TerrainType.METEORITE_IMPACT_CRATER]: TerrainGroup.OPEN_ROUGH_GROUND,
  [TerrainType.SHALLOW_QUICKSAND_PIT]: TerrainGroup.SWAMP_MUDDY_GROUND, // Or DESERT_SAND_GROUND if dry quicksand
  [TerrainType.SINKING_TAR_PITS]: TerrainGroup.IMPASSABLE_DEEP_LIQUID_HAZARD,
  [TerrainType.DEEP_MIRE]: TerrainGroup.SWAMP_MUDDY_GROUND, // Potentially IMPASSABLE
  [TerrainType.IRONLEAF_FOREST]: TerrainGroup.FOREST_DENSE_GROUND, // Metal leaves could make it rougher
  [TerrainType.MOONOAK_FOREST]: TerrainGroup.FOREST_DENSE_GROUND, // Magical elements might fit UNIQUE_OTHERWORLDLY
  [TerrainType.PETRIFIED_STONE_FOREST]: TerrainGroup.OPEN_ROUGH_GROUND, // Like very difficult rocky terrain
  [TerrainType.BIOLUMINESCENT_GROVE]: TerrainGroup.FOREST_SPARSE_GROUND, // Or UNIQUE_OTHERWORLDLY or CAVERN_DIFFICULT_SUB if underground
  [TerrainType.SNOW_CAPPED_MOUNTAIN]: TerrainGroup.MOUNTAIN_STEEP_GROUND, // Upper parts are ARCTIC_COLD
  [TerrainType.OBSIDIAN_LAVA_FLOW_FIELD]: TerrainGroup.VOLCANIC_HAZARD_GROUND, // Sharp, difficult
  [TerrainType.COMPACT_EARTH_CAVERN]: TerrainGroup.CAVERN_EASY_SUB,
  [TerrainType.NATURAL_CAVE_TUNNEL]: TerrainGroup.CAVERN_EASY_SUB,
  [TerrainType.SUBTERRANEAN_RIVER_BED]: TerrainGroup.CAVERN_DIFFICULT_SUB, // Water hazard, uneven floor
  [TerrainType.LUMINOUS_CRYSTAL_CAVERNS]: TerrainGroup.CAVERN_DIFFICULT_SUB,
  [TerrainType.UNDERGROUND_FUNGI_FOREST]: TerrainGroup.CAVERN_DIFFICULT_SUB, // Obstructed, potentially unique
  [TerrainType.GLOWWORM_LIT_CAVE]: TerrainGroup.CAVERN_EASY_SUB,
  [TerrainType.COOLING_MAGMA_TUBE]: TerrainGroup.CAVERN_HAZARDOUS_SUB, // Unstable, hot spots
  [TerrainType.SHEER_GRANITE_WALL]: TerrainGroup.IMPASSABLE_SOLID_BARRIER,
  [TerrainType.BASALT_COLUMN_BARRIER]: TerrainGroup.IMPASSABLE_SOLID_BARRIER,
  [TerrainType.QUARTZ_CRYSTAL_SPINES]: TerrainGroup.IMPASSABLE_SOLID_BARRIER, // Or OPEN_ROUGH_GROUND if they can be navigated around
  [TerrainType.LIMESTONE_FLOWSTONE_WALL]: TerrainGroup.IMPASSABLE_SOLID_BARRIER,
  [TerrainType.SOLID_OBSIDIAN_WALL]: TerrainGroup.IMPASSABLE_SOLID_BARRIER,
  [TerrainType.MARBLE_STRATA_WALL]: TerrainGroup.IMPASSABLE_SOLID_BARRIER,
  [TerrainType.COMPACTED_CLAY_DEPOSIT]: TerrainGroup.IMPASSABLE_SOLID_BARRIER, // If a large, unyielding mass
  [TerrainType.ADAMANTINE_ORE_VEIN]: TerrainGroup.IMPASSABLE_SOLID_BARRIER,
  [TerrainType.DEEP_SUBTERRANEAN_CHASM]: TerrainGroup.IMPASSABLE_SOLID_BARRIER, // For ground travel; AERIAL_UNIQUE for flight
  [TerrainType.VOLCANIC_LAVA_RIVER]: TerrainGroup.IMPASSABLE_DEEP_LIQUID_HAZARD,
  [TerrainType.COASTAL_SHALLOWS]: TerrainGroup.AQUATIC_SHALLOW_OPEN,
  [TerrainType.VIBRANT_CORAL_REEF]: TerrainGroup.AQUATIC_SHALLOW_OBSTRUCTED,
  [TerrainType.DENSE_KELP_FOREST]: TerrainGroup.AQUATIC_DEEP_OBSTRUCTED, // Can also be shallow
  [TerrainType.ABYSSAL_OCEAN_FLOOR]: TerrainGroup.AQUATIC_DEEP_OPEN,
  [TerrainType.HYDROTHERMAL_VENT_FIELD]: TerrainGroup.AQUATIC_DEEP_HAZARDOUS,
  [TerrainType.OCEANIC_TRENCH]: TerrainGroup.AQUATIC_DEEP_OPEN, // Walls could be AQUATIC_DEEP_OBSTRUCTED
  [TerrainType.CLEAR_SKY]: TerrainGroup.AERIAL_CLEAR_OPEN,
  [TerrainType.TURBULENT_AIR_CURRENTS]: TerrainGroup.AERIAL_HAZARDOUS_CONDITIONS,
  [TerrainType.FLOATING_EARTHMOTE_CLUSTER]: TerrainGroup.AERIAL_UNIQUE_PHENOMENA, // Landing on them is OPEN_ROUGH/FOREST etc.
  [TerrainType.CELESTIAL_SKY_ISLAND]: TerrainGroup.AERIAL_UNIQUE_PHENOMENA, // Surface like ground terrain
  [TerrainType.ETERNAL_BATTLEFIELD_PLAINS]: TerrainGroup.OPEN_ROUGH_GROUND, // Debris, uneven
  [TerrainType.ARCANE_RADIATION_WASTES]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND,
  [TerrainType.NON_EUCLIDEAN_RUINS]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND,
  [TerrainType.FLESHCRAFTING_LABORATORY]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND, // Or OPEN_ROUGH_GROUND if just a building
  [TerrainType.RUINED_NECROPOLIS]: TerrainGroup.OPEN_ROUGH_GROUND,
  [TerrainType.REALITY_CANCER_FLESHLANDS]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND,
  [TerrainType.FEY_EMOTION_LANDSCAPE]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND,
  [TerrainType.AERIAL_VORTEX]: TerrainGroup.IMPASSABLE_AERIAL_VOID,
  [TerrainType.FLOATING_MOUNTAIN_BARRIER]: TerrainGroup.IMPASSABLE_AERIAL_VOID, // Or AERIAL_HIGH_ALTITUDE if navigable around
  [TerrainType.SPECTRAL_RAIN_ZONE]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND, // Or OPEN_OBSTRUCTED_GROUND
  [TerrainType.ECHO_STORM_FIELD]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND, // Also AERIAL_HAZARDOUS_CONDITIONS
  [TerrainType.ETERNAL_WEEPING_HILLS]: TerrainGroup.OPEN_ROUGH_GROUND, // Could be SWAMPY
  [TerrainType.VOID_QUARTZ_VEINS]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND, // Or OPEN_ROUGH if just rocky
  [TerrainType.FLOATING_RUIN_FIELD]: TerrainGroup.AERIAL_UNIQUE_PHENOMENA, // Surface like OPEN_ROUGH
  [TerrainType.UNSTABLE_LEY_LINE_CONFLUX]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND, // Also AERIAL_HAZARDOUS_CONDITIONS
  [TerrainType.CRIMSON_WIDOWS_VEIL_FIELD]: TerrainGroup.FOREST_DENSE_GROUND, // Or UNIQUE_OTHERWORLDLY
  [TerrainType.MARROW_CAP_GROVE]: TerrainGroup.FOREST_SPARSE_GROUND, // Or UNIQUE_OTHERWORLDLY
  [TerrainType.ASHEN_BONE_PLAINS]: TerrainGroup.OPEN_FLAT_GROUND, // Potentially OPEN_ROUGH if bones are large
  [TerrainType.HARMONIC_CRYSTAL_PILLARS]: TerrainGroup.OPEN_ROUGH_GROUND, // Or UNIQUE_OTHERWORLDLY. AERIAL_OBSTRUCTED for flight.
  [TerrainType.TELLURIC_FLUX_ZONE]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND,
  [TerrainType.LIVING_MIST_SEA]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND, // Also AERIAL_HAZARDOUS_CONDITIONS
  [TerrainType.ECHO_BAZAAR]: TerrainGroup.OPEN_ROUGH_GROUND, // Assuming structures, could be UNIQUE
  [TerrainType.FROZEN_SOUL_GLACIER]: TerrainGroup.ARCTIC_COLD_GROUND, // Or UNIQUE_OTHERWORLDLY
  [TerrainType.WHITE_BLOOD_SNOWFIELD]: TerrainGroup.ARCTIC_COLD_GROUND, // Or UNIQUE_OTHERWORLDLY
  [TerrainType.KRAKEN_BONE_TRENCH]: TerrainGroup.AQUATIC_DEEP_OBSTRUCTED,
  [TerrainType.WHISPERING_JELLYFISH_SWARM]: TerrainGroup.AQUATIC_SHALLOW_OBSTRUCTED, // Or DEEP
  [TerrainType.OBSIDIAN_ZIGGURAT_RUINS]: TerrainGroup.OPEN_ROUGH_GROUND, // Or UNIQUE_OTHERWORLDLY
  [TerrainType.BLOODVINE_JUNGLE]: TerrainGroup.FOREST_DENSE_GROUND, // Potentially UNIQUE_OTHERWORLDLY
  [TerrainType.SILVERDEW_SPRING]: TerrainGroup.OPEN_FLAT_GROUND, // Or UNIQUE_OTHERWORLDLY
  [TerrainType.FLESHFORGED_DEMON_CITADEL]: TerrainGroup.UNIQUE_OTHERWORLDLY_GROUND, // Or OPEN_ROUGH_GROUND
  [TerrainType.VOID_FUNGUS_CAVERNS]: TerrainGroup.CAVERN_DIFFICULT_SUB, // Or UNIQUE_OTHERWORLDLY_GROUND if surface-like
  // Add a default for safety, though ideally all are mapped:
  // UNKNOWN_DEFAULT: TerrainGroup.OPEN_ROUGH_GROUND // This would be handled by the generator function if a terrainId isn't in this map.
};

export const PARTY_ACTIVITIES = {
  // --- Non-Mount Specific Travel Activities ---
  avoid_notice: {
    id: 'avoid_notice',
    name: 'Avoid Notice',
    icon: '🤫',
    description: 'Attempt Stealth (Perception DC). Modifies current travel mode speed by a factor of 2.0 (half speed). On encounter start, use Stealth for initiative and detection.',
    movementPenaltyFactor: 2.0, // This is a multiplier on the current travel mode's effective time
    isGroupActivity: false,
    traits: ['Exploration'],
    source: 'Player Core pg. 438'
  },
  careful_traverse: {
    id: 'careful_traverse',
    name: 'Careful Traverse',
    icon: '⛰️',
    description: 'When moving slowly (such as due to encumbrance or hazardous terrain), you concentrate on secure footing. Does not inherently slow you further than current conditions but grants +1 circumstance bonus to saves vs. prone and relevant skill checks for balance/treacherous surfaces.',
    movementPenaltyFactor: 1.0, // No additional penalty beyond what the terrain/mode imposes
    isGroupActivity: false,
    traits: ['Exploration', 'Move'],
    source: 'Custom Rule (Encumbrance Adaptation)'
  },
  cover_tracks: {
    id: 'cover_tracks',
    name: 'Cover Tracks',
    icon: '🚫',
    description: 'Use Survival to obscure tracks. Modifies current travel mode speed by a factor of 2.0 (half speed).',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false, // Can be, but one person usually does it
    traits: ['Exploration', 'Move'],
    source: 'Player Core pg. 263'
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    icon: '🛡️',
    description: 'Move with shield raised. Modifies current travel mode speed by a factor of 2.0 (half speed). Gain Raise a Shield benefits before first turn in combat.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Exploration'],
    source: 'Player Core pg. 438'
  },
  detailed_survey: {
    id: 'detailed_survey',
    name: 'Detailed Survey',
    icon: '🧐',
    description: 'Meticulously observe surroundings. Modifies current travel mode speed by a factor of 2.0 (half speed). GM makes secret checks for advantageous positions, routes, hazards, resources.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Exploration', 'Concentrate', 'Secret', 'Move'],
    source: 'Custom Rule (Environmental Focus)'
  },
  detect_magic: {
    id: 'detect_magic',
    name: 'Detect Magic',
    icon: '✨',
    description: 'Cast detect magic at intervals. Modifies current travel mode speed by a factor of 2.0 (half speed) or slower for thoroughness.',
    movementPenaltyFactor: 2.0, // Can be set higher by GM for more thoroughness
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 438'
  },
  follow_expert: {
    id: 'follow_expert',
    name: 'Follow the Expert',
    icon: '👣',
    description: 'Match an ally\'s skill check (e.g., Climb, Avoid Notice) while traveling. Does not inherently modify speed beyond the expert\'s activity.',
    movementPenaltyFactor: 1.0, // Relies on the expert's speed/activity
    isGroupActivity: false,
    traits: ['Auditory', 'Concentrate', 'Exploration', 'Visual'],
    source: 'Player Core pg. 438'
  },
  investigate: {
    id: 'investigate',
    name: 'Investigate',
    icon: '🔍',
    description: 'Seek info with Recall Knowledge (secret). Modifies current travel mode speed by a factor of 2.0 (half speed).',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  manage_burdens: {
    id: 'manage_burdens',
    name: 'Manage Burdens',
    icon: '🎒',
    description: 'Focus on keeping gear secure and balanced when heavily laden. Does not inherently slow you further than current conditions. May prevent item dropping/damage or reduce DC for exhaustion checks (GM discretion).',
    movementPenaltyFactor: 1.0,
    isGroupActivity: false,
    traits: ['Exploration', 'Manipulate'],
    source: 'Custom Rule (Encumbrance Adaptation)'
  },
  repeat_spell: {
    id: 'repeat_spell',
    name: 'Repeat a Spell',
    icon: '🔁',
    description: 'Repeatedly cast a 2-action or less spell (usually cantrip). Modifies current travel mode speed by a factor of 2.0 (half speed).',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    icon: '👁️‍🗨️',
    description: 'Scout ahead/behind. Modifies current travel mode speed by a factor of 2.0 (half speed). Party gains +1 initiative next encounter.',
    movementPenaltyFactor: 2.0,
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  search: {
    id: 'search',
    name: 'Search',
    icon: '🧐',
    description: 'Meticulously Seek for hidden things. Modifies current travel mode speed by a factor of 2.0 (half speed) or slower. GM makes free secret Seek.',
    movementPenaltyFactor: 2.0, // Can be higher for more thoroughness
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  sense_direction: {
    id: 'sense_direction',
    name: 'Sense Direction',
    icon: '🗺️',
    description: 'Use Survival to get a sense of location or cardinal directions. Minimal time, does not significantly impact travel speed unless lost (then takes up to 10 min).',
    movementPenaltyFactor: 1.0, // Assume efficient use, or minimal pause
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration', 'Secret'],
    source: 'Player Core pg. 264'
  },
  squeeze: {
    id: 'squeeze',
    name: 'Squeeze',
    icon: '🤏',
    description: 'Use Acrobatics to squeeze through tight spaces. Modifies current travel mode speed by a factor of 3.0 (one-third speed).',
    movementPenaltyFactor: 3.0,
    isGroupActivity: false,
    traits: ['Exploration', 'Move'],
    source: 'Player Core pg. 242'
  },
  track: {
    id: 'track',
    name: 'Track',
    icon: '👀',
    description: 'Use Survival to follow tracks. Modifies current travel mode speed by a factor of 2.0 (half speed), or slower for difficult tracks.',
    movementPenaltyFactor: 2.0, // Can be higher for difficult tracks
    isGroupActivity: false,
    traits: ['Concentrate', 'Exploration', 'Move'],
    source: 'Player Core pg. 264'
  },
  
  coordinated_pace_group: { // Renamed to avoid conflict if there's an individual one
    id: 'coordinated_pace_group',
    name: 'Coordinated Pace (Group)',
    icon: '⚖️',
    description: 'The party focuses on a unified rhythm, especially useful if encumbered or in difficult conditions. Party travels at the slowest member\'s effective speed. Grants +1 circumstance bonus to Fortitude saves against fatigue from environmental conditions or prolonged Hustling.',
    movementPenaltyFactor: 1.0, // Relies on group's slowest member's speed
    isGroupActivity: true,
    traits: ['Exploration'],
    source: 'Custom Rule (Group Coordination)'
  },
  hustle_group: { // Renamed for clarity
    id: 'hustle_group',
    name: 'Hustle (Group)',
    icon: '💨',
    description: 'Move at double travel speed (current travel mode time factor is halved) for Con mod × 10 minutes (min 10 min). Group uses lowest Con. This activity\'s factor is applied to the current travel mode\'s effective time factor.',
    movementPenaltyFactor: 0.5, // Multiplier on the current travel mode's effective time
    isGroupActivity: true,
    traits: ['Exploration', 'Move'],
    source: 'Player Core pg. 438'
  },
  stealthy_group_approach: {
    id: 'stealthy_group_approach',
    name: 'Stealth (Group)',
    icon: '🤫',
    description: 'The entire party attempts to move stealthily. Modifies current travel mode speed by a factor of 2.0 (half speed).',
    movementPenaltyFactor: 2.0,
    isGroupActivity: true,
    traits: ['Exploration', 'Secret', 'Move'],
    source: 'Game Master Intuition'
  },
  walking_on_foot: {
    id: 'walking_on_foot',
    name: 'Walking (On Foot)',
    icon: '🚶',
    description: 'Standard bipedal movement. Performance based on terrain. Base time factor on ideal plains is 1.0. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration'],
    source: 'Core Rule',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(WALKING_ON_FOOT_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  riding_horse: {
    id: 'riding_horse',
    name: 'Riding Horse (Group)',
    icon: '🐎',
    description: 'Travel with common riding horses. Faster than walking on open ground. Base time factor on ideal plains is ~0.6. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration'],
    source: 'Custom Rule (Expanded Travel)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(RIDING_HORSE_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  sturdy_cart_wagon: {
    id: 'sturdy_cart_wagon',
    name: 'Cart/Wagon (Group)',
    icon: '🛒',
    description: 'Animal-drawn cart/wagon. Best on roads. Base time factor on good roads/flat terrain is ~0.8-1.0. Heavily impacted by rough terrain. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration', 'Vehicle'],
    source: 'Custom Rule (Expanded Travel)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(STURDY_CART_WAGON_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  swift_beast_riding: {
    id: 'swift_wolf_riding',
    name: 'Swift Beast Riding (Group)',
    icon: '🐺',
    description: 'Ride a large, swift beast. Excellent on plains and in sparse forests. Base time factor on ideal plains is ~0.55. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration'],
    source: 'Custom Rule (WoW Inspired)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(SWIFT_WOLF_RIDING_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  sturdy_kodo_riding: {
    id: 'sturdy_kodo_riding',
    name: 'Sturdy Beast Riding (Group)',
    icon: '🦏',
    description: 'Ride a massive, resilient beast. Slower but handles rough terrain and deserts well. Base time factor on ideal plains is ~0.8. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration', 'Beast of Burden'],
    source: 'Custom Rule (WoW Inspired)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(STURDY_KODO_RIDING_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  land_machine_piloting: {
    id: 'land_machine_piloting',
    name: 'Land Machine Piloting (Group)',
    icon: '🤖',
    description: 'Gnomish mechanical bird-like walker. Very fast on flat, hard surfaces. Struggles with natural or uneven terrain and water. Base time factor on ideal roads is ~0.5. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration', 'Vehicle', 'Mechanical'],
    source: 'Custom Rule (WoW Inspired)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(MECHANOSTRIDER_RIDING_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  wind_rider_flight: {
    id: 'wind_rider_flight',
    name: 'Flying Beast Riding (Group)',
    icon: '🦅',
    description: 'WoW Inspired: Fly mounted on a Wyvern. Versatile aerial travel. Base time factor in clear skies is ~0.35. Affected by aerial conditions and canopy. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration', 'Aerial'],
    source: 'Custom Rule (WoW Inspired)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(WIND_RIDER_FLIGHT_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  flying_machine_flight: {
    id: 'flying_machine_flight',
    name: 'Flying Machine (Group)',
    icon: '🚁',
    description: 'WoW Inspired: A Gnomish or Goblin contraption for flight. Fast in clear air but susceptible to turbulence and damage. Base time factor in ideal air is ~0.3. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration', 'Aerial', 'Vehicle', 'Mechanical'],
    source: 'Custom Rule (WoW Inspired)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(FLYING_MACHINE_FLIGHT_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  mixed_ground_mounts: {
    id: 'mixed_ground_mounts',
    name: 'Mixed Ground Mounts (Group)',
    icon: '🐴🐺', // Example icons
    description: 'The party travels using a variety of ground mounts. Performance is averaged, offering versatility without specialization. Base time factor on ideal plains is ~0.7. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration'],
    source: 'Custom Rule (Mixed Group)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(MIXED_GROUND_MOUNTS_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
  mixed_flying_mounts: {
    id: 'mixed_flying_mounts',
    name: 'Mixed Flying Mounts (Group)',
    icon: '🦅🐉', 
    description: 'The party travels using a variety of flying mounts. Aerial performance is averaged. Base time factor in clear skies is ~0.32. Specific terrain time factors apply.',
    isGroupActivity: true,
    traits: ['Move', 'Exploration', 'Aerial'],
    source: 'Custom Rule (Mixed Group)',
    terrainPenaltyFactors: generateExpandedTerrainPenalties(MIXED_FLYING_MOUNTS_GROUP_PENALTIES, TERRAIN_TYPE_TO_GROUP_MAP, TERRAIN_TYPES_CONFIG)
  },
};
