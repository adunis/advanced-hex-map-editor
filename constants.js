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
  SET_TO_VALUE: 'set_to_value', // New mode
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

export const TerrainType = {
  PLAINS: 'plains',
  FOREST: 'forest',
  THICK_FOREST: 'thick_forest',
  YOUNG_FOREST: 'young_forest',
  HILLS: 'hills',
  MOUNTAIN: 'mountain',
  SWAMP: 'swamp',
  DESERT: 'desert',
  JUNGLE: 'jungle',
  BADLANDS: 'badlands',
  ROAD: 'road',
  SETTLEMENT: 'settlement',
  WATER: 'water',
  CAVERN_FLOOR: 'cavern_floor',
  TUNNEL: 'tunnel',
  MUSHROOM_FOREST: 'mushroom_forest',
  CRYSTAL_CAVE: 'crystal_cave',
  UNDERGROUND_RIVER: 'underground_river',
  LAVA_TUBE: 'lava_tube',
  SHALLOW_WATER: 'shallow_water',
  DEEP_OCEAN: 'deep_ocean',
  CORAL_REEF: 'coral_reef',
  KELP_FOREST: 'kelp_forest',
  TRENCH: 'trench',
  SKELETAL_FOREST: 'skeletal_forest',
  ASHEN_WASTELAND: 'ashen_wasteland',
  BLOOD_MARSH: 'blood_marsh',
  MAGMA_LAKE: 'magma_lake',
  VOLCANIC_WASTELAND: 'volcanic_wasteland',
  FLOATING_ISLANDS: 'floating_islands',
  ETHEREAL_MIST: 'ethereal_mist',
  QUICKSAND: 'quicksand',
  ICE_PLAIN: 'ice_plain',
  OBSIDIAN_FIELD: 'obsidian_field',
};

export const HEX_SIZE = 30;
export const INITIAL_GRID_WIDTH = 12;
export const INITIAL_GRID_HEIGHT = 8;
export const MIN_GRID_DIMENSION = 1;
export const MAX_GRID_DIMENSION = 50;

export const MIN_ELEVATION = -200;
export const MAX_ELEVATION = 6000;
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

export const PLAINS_LOW_ELEV_COLOR = 'rgb(134, 239, 172)';
export const PLAINS_MID_ELEV_COLOR = 'rgb(74, 222, 128)';
export const PLAINS_HIGH_ELEV_COLOR = 'rgb(34, 197, 94)';
export const FOREST_LOW_ELEV_COLOR = 'rgb(22, 163, 74)';
export const FOREST_MID_ELEV_COLOR = 'rgb(21, 128, 61)';
export const FOREST_HIGH_ELEV_COLOR = 'rgb(22, 101, 52)';
export const THICK_FOREST_LOW_ELEV_COLOR = 'rgb(22, 101, 52)';
export const THICK_FOREST_MID_ELEV_COLOR = 'rgb(20, 83, 45)';
export const THICK_FOREST_HIGH_ELEV_COLOR = 'rgb(18, 70, 38)';
export const YOUNG_FOREST_LOW_ELEV_COLOR = 'rgb(163, 230, 53)';
export const YOUNG_FOREST_MID_ELEV_COLOR = 'rgb(132, 204, 22)';
export const YOUNG_FOREST_HIGH_ELEV_COLOR = 'rgb(101, 163, 13)';
export const HILLS_COLOR_LOW = 'rgb(245, 222, 179)';
export const HILLS_COLOR_MID = 'rgb(229, 195, 101)';
export const HILLS_COLOR_HIGH = 'rgb(218, 165, 32)';
export const MOUNTAIN_COLOR_LOW_SLOPE = 'rgb(160, 120, 80)';
export const MOUNTAIN_COLOR_MID_SLOPE = 'rgb(100, 70, 40)';
export const MOUNTAIN_ELEV_MID_SLOPE_END = 1999;
export const MOUNTAIN_COLOR_SNOW_LINE = 'rgb(250, 250, 250)';
export const MOUNTAIN_ELEV_SNOW_LINE_START = 2000;
export const MOUNTAIN_COLOR_ICE_PEAK = 'rgb(200, 220, 255)';
export const MOUNTAIN_ELEV_ICE_TRANSITION_START = 3000;
export const MOUNTAIN_ELEV_ICE_PEAK_END = 5000;
export const MOUNTAIN_LIGHT_SURFACE_TEXT_COLOR = 'fill-gray-800';
export const SWAMP_LOW_ELEV_COLOR = 'rgb(17, 94, 89)';
export const SWAMP_MID_ELEV_COLOR = 'rgb(15, 118, 110)';
export const SWAMP_HIGH_ELEV_COLOR = 'rgb(13, 148, 136)';
export const DESERT_LOW_ELEV_COLOR = 'rgb(254, 240, 138)';
export const DESERT_MID_ELEV_COLOR = 'rgb(253, 224, 71)';
export const DESERT_HIGH_ELEV_COLOR = 'rgb(250, 204, 21)';
export const JUNGLE_LOW_ELEV_COLOR = 'rgb(6, 78, 59)';
export const JUNGLE_MID_ELEV_COLOR = 'rgb(6, 95, 70)';
export const JUNGLE_HIGH_ELEV_COLOR = 'rgb(4, 120, 87)';
export const BADLANDS_LOW_ELEV_COLOR = 'rgb(154, 52, 18)';
export const BADLANDS_MID_ELEV_COLOR = 'rgb(194, 65, 12)';
export const BADLANDS_HIGH_ELEV_COLOR = 'rgb(234, 88, 12)';
export const WATER_SURFACE_COLOR = 'rgb(3, 105, 161)';
export const WATER_SHALLOW_DEPTH_COLOR = 'rgb(7, 89, 133)';
export const WATER_MID_DEPTH_COLOR = 'rgb(30, 58, 138)';
export const WATER_DEEP_DEPTH_COLOR = 'rgb(30, 64, 175)';
export const CAVERN_DEEP_COLOR = 'rgb(55, 65, 81)';
export const CAVERN_MID_COLOR = 'rgb(75, 85, 99)';
export const CAVERN_HIGH_COLOR = 'rgb(107, 114, 128)';
export const TUNNEL_COLOR = 'rgb(31, 41, 55)';
export const MUSHROOM_FOREST_DEEP_COLOR = 'rgb(126, 34, 206)';
export const MUSHROOM_FOREST_MID_COLOR = 'rgb(147, 51, 234)';
export const MUSHROOM_FOREST_HIGH_COLOR = 'rgb(168, 85, 247)';
export const CRYSTAL_CAVE_DEEP_COLOR = 'rgb(6, 182, 212)';
export const CRYSTAL_CAVE_MID_COLOR = 'rgb(34, 211, 238)';
export const CRYSTAL_CAVE_HIGH_COLOR = 'rgb(103, 232, 249)';
export const UNDERGROUND_RIVER_SURFACE_COLOR = 'rgb(30, 64, 175)';
export const UNDERGROUND_RIVER_DEEP_COLOR = 'rgb(30, 58, 138)';
export const UNDERGROUND_RIVER_VERY_DEEP_COLOR = 'rgb(31, 41, 55)';
export const LAVA_TUBE_COLOR = 'rgb(55, 25, 25)';
export const SHALLOW_WATER_VERY_SHALLOW_COLOR = 'rgb(56, 189, 248)';
export const SHALLOW_WATER_MID_DEPTH_COLOR = 'rgb(14, 165, 233)';
export const SHALLOW_WATER_DEEP_COLOR = 'rgb(2, 132, 199)';
export const DEEP_OCEAN_SURFACE_COLOR = 'rgb(30, 58, 138)';
export const DEEP_OCEAN_MID_DEPTH_COLOR = 'rgb(23, 37, 84)';
export const DEEP_OCEAN_VERY_DEEP_COLOR = 'rgb(17, 24, 39)';
export const CORAL_REEF_SHALLOW_COLOR = 'rgb(249, 168, 212)';
export const CORAL_REEF_MID_COLOR = 'rgb(244, 114, 182)';
export const CORAL_REEF_DEEP_COLOR = 'rgb(236, 72, 153)';
export const KELP_FOREST_SHALLOW_COLOR = 'rgb(20, 184, 166)';
export const KELP_FOREST_MID_COLOR = 'rgb(13, 148, 136)';
export const KELP_FOREST_DEEP_COLOR = 'rgb(15, 118, 110)';
export const TRENCH_UPPER_COLOR = 'rgb(39, 39, 42)';
export const TRENCH_MID_COLOR = 'rgb(24, 24, 27)';
export const TRENCH_DEEPEST_COLOR = 'rgb(0, 0, 0)';
export const SKELETAL_FOREST_LOW_COLOR = 'rgb(156, 163, 175)';
export const SKELETAL_FOREST_MID_COLOR = 'rgb(209, 213, 219)';
export const SKELETAL_FOREST_HIGH_COLOR = 'rgb(229, 231, 235)';
export const ASHEN_WASTELAND_LOW_COLOR = 'rgb(71, 85, 105)';
export const ASHEN_WASTELAND_MID_COLOR = 'rgb(100, 116, 139)';
export const ASHEN_WASTELAND_HIGH_COLOR = 'rgb(148, 163, 184)';
export const BLOOD_MARSH_DEEP_COLOR = 'rgb(153, 27, 27)';
export const BLOOD_MARSH_MID_COLOR = 'rgb(185, 28, 28)';
export const BLOOD_MARSH_SHALLOW_COLOR = 'rgb(220, 38, 38)';
export const MAGMA_LAKE_HOT_COLOR = 'rgb(250, 204, 21)';
export const MAGMA_LAKE_MID_COLOR = 'rgb(249, 115, 22)';
export const MAGMA_LAKE_COOLER_COLOR = 'rgb(220, 38, 38)';
export const VOLCANIC_LOW_COLOR = 'rgb(82, 82, 91)';
export const VOLCANIC_MID_COLOR = 'rgb(63, 63, 70)';
export const VOLCANIC_HIGH_COLOR = 'rgb(39, 39, 42)';
export const FLOATING_ISLAND_LOW_COLOR = 'rgb(252, 211, 77)';
export const FLOATING_ISLAND_MID_COLOR = 'rgb(253, 230, 138)';
export const FLOATING_ISLAND_HIGH_COLOR = 'rgb(254, 249, 195)';
export const ETHEREAL_MIST_DENSE_COLOR = 'rgb(167, 139, 250)';
export const ETHEREAL_MIST_MID_COLOR = 'rgb(192, 132, 252)';
export const ETHEREAL_MIST_THIN_COLOR = 'rgb(221, 190, 253)';
export const QUICKSAND_COLOR = 'rgb(161, 98, 7)';
export const ICE_PLAIN_LOW_COLOR = 'rgb(103, 232, 249)';
export const ICE_PLAIN_MID_COLOR = 'rgb(165, 243, 252)';
export const ICE_PLAIN_HIGH_COLOR = 'rgb(207, 250, 254)';
export const OBSIDIAN_FIELD_LOW_COLOR = 'rgb(0,0,0)';
export const OBSIDIAN_FIELD_MID_COLOR = 'rgb(17, 24, 39)';
export const OBSIDIAN_FIELD_HIGH_COLOR = 'rgb(39, 39, 42)';

export const DEFAULT_TERRAIN_TYPE = TerrainType.PLAINS;
export const MOUNTAIN_THRESHOLD = 600;
export const HILLS_THRESHOLD = 300;

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

// Config for auto terrain change based on elevation
export const AUTO_TERRAIN_CHANGE_ENABLED_DEFAULT = true; // New constant
export const AUTO_TERRAIN_IGNORE_TYPES = [ // Types not to change automatically
    TerrainType.ROAD, TerrainType.SETTLEMENT, TerrainType.WATER,
    TerrainType.SHALLOW_WATER, TerrainType.DEEP_OCEAN,
    TerrainType.CAVERN_FLOOR, TerrainType.TUNNEL, TerrainType.MUSHROOM_FOREST,
    TerrainType.CRYSTAL_CAVE, TerrainType.UNDERGROUND_RIVER, TerrainType.LAVA_TUBE,
    TerrainType.MAGMA_LAKE, TerrainType.BLOOD_MARSH
];


export const TERRAIN_TYPES_CONFIG = {
  [TerrainType.PLAINS]: {
    name: 'Plains', symbol: '🌾', color: 'fill-green-400',
    speedMultiplier: 1, visibilityFactor: 1,
    baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 5, encounterChanceOnDiscover: 2,
    elevationColor: (elevation) => {
      if (elevation < 50) return PLAINS_LOW_ELEV_COLOR;
      if (elevation < 150) return PLAINS_MID_ELEV_COLOR;
      return PLAINS_HIGH_ELEV_COLOR;
    },
  },
  [TerrainType.FOREST]: {
    name: 'Forest', symbol: '🌲', color: 'fill-green-700',
    speedMultiplier: 2, visibilityFactor: 0.5,
    baseInherentVisibilityBonus: -1, prominence: 5,
    canopyBlockage: FOREST_CANOPY_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 15, encounterChanceOnDiscover: 5,
    elevationColor: (elevation) => {
      if (elevation < 100) return FOREST_LOW_ELEV_COLOR;
      if (elevation < 400) return FOREST_MID_ELEV_COLOR;
      return FOREST_HIGH_ELEV_COLOR;
    },
  },
  [TerrainType.THICK_FOREST]: {
    name: 'Thick Forest', symbol: '🌳', color: 'fill-green-900',
    speedMultiplier: 3, visibilityFactor: 0.25,
    baseInherentVisibilityBonus: -2, prominence: 8,
    canopyBlockage: THICK_FOREST_CANOPY_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 25, encounterChanceOnDiscover: 10,
    elevationColor: (elevation) => {
      if (elevation < 100) return THICK_FOREST_LOW_ELEV_COLOR;
      if (elevation < 400) return THICK_FOREST_MID_ELEV_COLOR;
      return THICK_FOREST_HIGH_ELEV_COLOR;
    },
  },
  [TerrainType.YOUNG_FOREST]: {
    name: 'Young Forest', symbol: '🌿', color: 'fill-lime-500',
    speedMultiplier: 1.5, visibilityFactor: 0.75,
    baseInherentVisibilityBonus: 0, prominence: 2,
    canopyBlockage: YOUNG_FOREST_CANOPY_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 10, encounterChanceOnDiscover: 3,
    elevationColor: (elevation) => {
      if (elevation < 80) return YOUNG_FOREST_LOW_ELEV_COLOR;
      if (elevation < 250) return YOUNG_FOREST_MID_ELEV_COLOR;
      return YOUNG_FOREST_HIGH_ELEV_COLOR;
    },
  },
  [TerrainType.HILLS]: {
    name: 'Hills', symbol: '⛰️', color: 'fill-amber-600',
    speedMultiplier: 1.5, visibilityFactor: 1,
    baseInherentVisibilityBonus: 1, prominence: 20,
    canopyBlockage: HILLS_TERRAIN_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 10, encounterChanceOnDiscover: 7,
    elevationColor: (elevation) => {
      const typicalHillBase = 50;
      const hillRange = MOUNTAIN_THRESHOLD - typicalHillBase;
      if (elevation < typicalHillBase + hillRange * 0.33) return HILLS_COLOR_LOW;
      if (elevation < typicalHillBase + hillRange * 0.66) return HILLS_COLOR_MID;
      return HILLS_COLOR_HIGH;
    },
  },
  [TerrainType.MOUNTAIN]: {
    name: 'Mountain', symbol: '🏔️', color: 'fill-gray-500',
    speedMultiplier: 4, visibilityFactor: 1,
    baseInherentVisibilityBonus: 2, prominence: 50,
    canopyBlockage: 0,
    encounterChanceOnEnter: 20, encounterChanceOnDiscover: 15,
    elevationColor: (elevation) => {
      if (elevation < MOUNTAIN_THRESHOLD) return MOUNTAIN_COLOR_LOW_SLOPE; // Should ideally be a hill or plain color if below its own threshold
      const midSlopeStart = MOUNTAIN_THRESHOLD + (MOUNTAIN_ELEV_SNOW_LINE_START - MOUNTAIN_THRESHOLD) * 0.4;
      if (elevation < midSlopeStart) return MOUNTAIN_COLOR_LOW_SLOPE;
      if (elevation <= MOUNTAIN_ELEV_MID_SLOPE_END) return MOUNTAIN_COLOR_MID_SLOPE;
      if (elevation < MOUNTAIN_ELEV_ICE_TRANSITION_START) return MOUNTAIN_COLOR_SNOW_LINE;
      if (elevation <= MOUNTAIN_ELEV_ICE_PEAK_END) return MOUNTAIN_COLOR_ICE_PEAK;
      return 'rgb(180, 200, 235)';
    },
  },
  [TerrainType.SWAMP]: {
    name: 'Swamp', symbol: '🐊', color: 'fill-teal-700',
    speedMultiplier: 2.5, visibilityFactor: 0.6,
    baseInherentVisibilityBonus: -1, prominence: 1,
    canopyBlockage: 8,
    encounterChanceOnEnter: 30, encounterChanceOnDiscover: 5,
    elevationColor: (elevation) => {
      if (elevation < -10) return SWAMP_LOW_ELEV_COLOR;
      if (elevation < 20) return SWAMP_MID_ELEV_COLOR;
      return SWAMP_HIGH_ELEV_COLOR;
    },
  },
  [TerrainType.DESERT]: {
    name: 'Desert', symbol: '🏜️', color: 'fill-yellow-300',
    speedMultiplier: 1.2, visibilityFactor: 1.2,
    baseInherentVisibilityBonus: 1, prominence: 0,
    canopyBlockage: 0,
    encounterChanceOnEnter: 8, encounterChanceOnDiscover: 3,
    elevationColor: (elevation) => {
      if (elevation < 100) return DESERT_LOW_ELEV_COLOR;
      if (elevation < 500) return DESERT_MID_ELEV_COLOR;
      return DESERT_HIGH_ELEV_COLOR;
    },
  },
  [TerrainType.JUNGLE]: {
    name: 'Jungle', symbol: '🌴', color: 'fill-emerald-800',
    speedMultiplier: 3.5, visibilityFactor: 0.15,
    baseInherentVisibilityBonus: -3, prominence: 10,
    canopyBlockage: JUNGLE_CANOPY_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 35, encounterChanceOnDiscover: 10,
    elevationColor: (elevation) => {
      if (elevation < 50) return JUNGLE_LOW_ELEV_COLOR;
      if (elevation < 300) return JUNGLE_MID_ELEV_COLOR;
      return JUNGLE_HIGH_ELEV_COLOR;
    },
  },
  [TerrainType.BADLANDS]: {
    name: 'Badlands', symbol: '🌵', color: 'fill-orange-700',
    speedMultiplier: 2, visibilityFactor: 0.9,
    baseInherentVisibilityBonus: 0, prominence: 5,
    canopyBlockage: 2,
    encounterChanceOnEnter: 12, encounterChanceOnDiscover: 8,
    elevationColor: (elevation) => {
      if (elevation < 200) return BADLANDS_LOW_ELEV_COLOR;
      if (elevation < 700) return BADLANDS_MID_ELEV_COLOR;
      return BADLANDS_HIGH_ELEV_COLOR;
    },
  },
  [TerrainType.ROAD]: {
    name: 'Road', symbol: '🛣️', color: 'fill-yellow-600',
    speedMultiplier: 0.5, visibilityFactor: 1,
    baseInherentVisibilityBonus: 0, prominence: 0,
    canopyBlockage: 0,
    encounterChanceOnEnter: 2, encounterChanceOnDiscover: 0,
    elevationColor: (elevation) => 'rgb(168, 162, 158)',
  },
  [TerrainType.SETTLEMENT]: {
    name: 'Settlement', symbol: '🏘️', color: 'fill-orange-500',
    speedMultiplier: 1, visibilityFactor: 1,
    baseInherentVisibilityBonus: 1, prominence: 5,
    canopyBlockage: 5,
    encounterChanceOnEnter: 3, encounterChanceOnDiscover: 1,
    elevationColor: (elevation) => 'rgb(200, 150, 100)',
  },
  [TerrainType.WATER]: {
    name: 'Open Water', symbol: '🌊', color: 'fill-sky-700',
    speedMultiplier: 3, visibilityFactor: 1,
    baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 10, encounterChanceOnDiscover: 5,
    elevationColor: (elevation) => {
      if (elevation <= -100) return WATER_DEEP_DEPTH_COLOR;
      if (elevation < -20) return WATER_MID_DEPTH_COLOR;
      if (elevation < 0) return WATER_SHALLOW_DEPTH_COLOR;
      return WATER_SURFACE_COLOR;
    },
  },
  [TerrainType.CAVERN_FLOOR]: {
    name: 'Cavern Floor', symbol: '🕳️', color: 'fill-gray-600',
    speedMultiplier: 1, visibilityFactor: 0.7,
    baseInherentVisibilityBonus: -2, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 15, encounterChanceOnDiscover: 5,
    elevationColor: (elevation) => {
      if (elevation < -50) return CAVERN_DEEP_COLOR;
      if (elevation < 0) return CAVERN_MID_COLOR;
      return CAVERN_HIGH_COLOR;
    },
  },
  [TerrainType.TUNNEL]: {
    name: 'Tunnel', symbol: '↦', color: 'fill-gray-800',
    speedMultiplier: 1, visibilityFactor: 0.2,
    baseInherentVisibilityBonus: -4, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 10, encounterChanceOnDiscover: 2,
    elevationColor: (elevation) => TUNNEL_COLOR,
  },
  [TerrainType.MUSHROOM_FOREST]: {
    name: 'Mushroom Forest', symbol: '🍄', color: 'fill-purple-600',
    speedMultiplier: 2, visibilityFactor: 0.3,
    baseInherentVisibilityBonus: -2, prominence: 3, canopyBlockage: 10,
    encounterChanceOnEnter: 20, encounterChanceOnDiscover: 10,
    elevationColor: (elevation) => {
      if (elevation < -30) return MUSHROOM_FOREST_DEEP_COLOR;
      if (elevation < 10) return MUSHROOM_FOREST_MID_COLOR;
      return MUSHROOM_FOREST_HIGH_COLOR;
    },
  },
  [TerrainType.CRYSTAL_CAVE]: {
    name: 'Crystal Cave', symbol: '💎', color: 'fill-cyan-400',
    speedMultiplier: 1.5, visibilityFactor: 0.9,
    baseInherentVisibilityBonus: -1, prominence: 2, canopyBlockage: 2,
    encounterChanceOnEnter: 10, encounterChanceOnDiscover: 15,
    elevationColor: (elevation) => {
      if (elevation < -40) return CRYSTAL_CAVE_DEEP_COLOR;
      if (elevation < 5) return CRYSTAL_CAVE_MID_COLOR;
      return CRYSTAL_CAVE_HIGH_COLOR;
    },
  },
  [TerrainType.UNDERGROUND_RIVER]: {
    name: 'Underground River', symbol: '🏞️', color: 'fill-blue-800',
    speedMultiplier: 3, visibilityFactor: 0.4,
    baseInherentVisibilityBonus: -3, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 18, encounterChanceOnDiscover: 6,
    elevationColor: (elevation) => {
      if (elevation <= -50) return UNDERGROUND_RIVER_VERY_DEEP_COLOR;
      if (elevation < -10) return UNDERGROUND_RIVER_DEEP_COLOR;
      return UNDERGROUND_RIVER_SURFACE_COLOR;
    },
  },
  [TerrainType.LAVA_TUBE]: {
    name: 'Lava Tube', symbol: '🌋', color: 'fill-red-900',
    speedMultiplier: 1.2, visibilityFactor: 0.1,
    baseInherentVisibilityBonus: -5, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 5, encounterChanceOnDiscover: 1,
    elevationColor: (elevation) => LAVA_TUBE_COLOR,
  },
  [TerrainType.SHALLOW_WATER]: {
    name: 'Shallow Water', symbol: '얕', color: 'fill-sky-400',
    speedMultiplier: 1.5, visibilityFactor: 0.8,
    baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 8, encounterChanceOnDiscover: 3,
    elevationColor: (elevation) => {
      if (elevation <= -30) return SHALLOW_WATER_DEEP_COLOR;
      if (elevation < -5) return SHALLOW_WATER_MID_DEPTH_COLOR;
      return SHALLOW_WATER_VERY_SHALLOW_COLOR;
    },
  },
  [TerrainType.DEEP_OCEAN]: {
    name: 'Deep Ocean', symbol: '⚓', color: 'fill-blue-900',
    speedMultiplier: 2, visibilityFactor: 0.3,
    baseInherentVisibilityBonus: -2, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 20, encounterChanceOnDiscover: 7,
    elevationColor: (elevation) => {
      if (elevation <= -500) return DEEP_OCEAN_VERY_DEEP_COLOR;
      if (elevation < -100) return DEEP_OCEAN_MID_DEPTH_COLOR;
      return DEEP_OCEAN_SURFACE_COLOR;
    },
  },
  [TerrainType.CORAL_REEF]: {
    name: 'Coral Reef', symbol: '🐠', color: 'fill-pink-400',
    speedMultiplier: 1.8, visibilityFactor: 0.7,
    baseInherentVisibilityBonus: -1, prominence: 2, canopyBlockage: 5,
    encounterChanceOnEnter: 15, encounterChanceOnDiscover: 10,
    elevationColor: (elevation) => {
      if (elevation <= -20) return CORAL_REEF_DEEP_COLOR;
      if (elevation < -5) return CORAL_REEF_MID_COLOR;
      return CORAL_REEF_SHALLOW_COLOR;
    },
  },
  [TerrainType.KELP_FOREST]: {
    name: 'Kelp Forest', symbol: '🌿', color: 'fill-teal-600',
    speedMultiplier: 2.5, visibilityFactor: 0.4,
    baseInherentVisibilityBonus: -2, prominence: 3, canopyBlockage: 15,
    encounterChanceOnEnter: 18, encounterChanceOnDiscover: 8,
    elevationColor: (elevation) => {
      if (elevation <= -40) return KELP_FOREST_DEEP_COLOR;
      if (elevation < -10) return KELP_FOREST_MID_COLOR;
      return KELP_FOREST_SHALLOW_COLOR;
    },
  },
  [TerrainType.TRENCH]: {
    name: 'Ocean Trench', symbol: '↯', color: 'fill-black',
    speedMultiplier: 3, visibilityFactor: 0.05,
    baseInherentVisibilityBonus: -5, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 25, encounterChanceOnDiscover: 2,
    elevationColor: (elevation) => {
      if (elevation <= -2000) return TRENCH_DEEPEST_COLOR;
      if (elevation < -1000) return TRENCH_MID_COLOR;
      return TRENCH_UPPER_COLOR;
    },
  },
  [TerrainType.SKELETAL_FOREST]: {
    name: 'Skeletal Forest', symbol: '💀', color: 'fill-gray-300',
    speedMultiplier: 2.2, visibilityFactor: 0.6,
    baseInherentVisibilityBonus: -1, prominence: 4, canopyBlockage: 10,
    encounterChanceOnEnter: 22, encounterChanceOnDiscover: 9,
    elevationColor: (elevation) => {
      if (elevation < 0) return SKELETAL_FOREST_LOW_COLOR;
      if (elevation < 100) return SKELETAL_FOREST_MID_COLOR;
      return SKELETAL_FOREST_HIGH_COLOR;
    },
  },
  [TerrainType.ASHEN_WASTELAND]: {
    name: 'Ashen Wasteland', symbol: '🌫️', color: 'fill-slate-500',
    speedMultiplier: 1.3, visibilityFactor: 0.7,
    baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 12, encounterChanceOnDiscover: 4,
    elevationColor: (elevation) => {
      if (elevation < 50) return ASHEN_WASTELAND_LOW_COLOR;
      if (elevation < 200) return ASHEN_WASTELAND_MID_COLOR;
      return ASHEN_WASTELAND_HIGH_COLOR;
    },
  },
  [TerrainType.BLOOD_MARSH]: {
    name: 'Blood Marsh', symbol: '🩸', color: 'fill-red-700',
    speedMultiplier: 2.8, visibilityFactor: 0.5,
    baseInherentVisibilityBonus: -1, prominence: 1, canopyBlockage: 6,
    encounterChanceOnEnter: 35, encounterChanceOnDiscover: 12,
    elevationColor: (elevation) => {
      if (elevation < -5) return BLOOD_MARSH_DEEP_COLOR;
      if (elevation < 10) return BLOOD_MARSH_MID_COLOR;
      return BLOOD_MARSH_SHALLOW_COLOR;
    },
  },
  [TerrainType.MAGMA_LAKE]: {
    name: 'Magma Lake', symbol: '🔥', color: 'fill-orange-500',
    speedMultiplier: 10, visibilityFactor: 0.8,
    baseInherentVisibilityBonus: 1, prominence: 2, canopyBlockage: 0,
    encounterChanceOnEnter: 40, encounterChanceOnDiscover: 10,
    elevationColor: (elevation) => {
      if (elevation < -10) return MAGMA_LAKE_COOLER_COLOR;
      if (elevation < 10) return MAGMA_LAKE_MID_COLOR;
      return MAGMA_LAKE_HOT_COLOR;
    },
  },
  [TerrainType.VOLCANIC_WASTELAND]: {
    name: 'Volcanic Wasteland', symbol: '🌋', color: 'fill-neutral-700',
    speedMultiplier: 2.5, visibilityFactor: 0.9,
    baseInherentVisibilityBonus: 0, prominence: 10,
    canopyBlockage: 0,
    encounterChanceOnEnter: 18, encounterChanceOnDiscover: 8,
    elevationColor: (elevation) => {
      if (elevation < 300) return VOLCANIC_LOW_COLOR;
      if (elevation < 1000) return VOLCANIC_MID_COLOR;
      return VOLCANIC_HIGH_COLOR;
    },
  },
  [TerrainType.FLOATING_ISLANDS]: {
    name: 'Floating Islands', symbol: '☁️', color: 'fill-sky-300',
    speedMultiplier: 1.5, visibilityFactor: 1.5,
    baseInherentVisibilityBonus: 2, prominence: 30, canopyBlockage: 2,
    encounterChanceOnEnter: 10, encounterChanceOnDiscover: 15,
    elevationColor: (elevation) => {
      if (elevation < 100) return FLOATING_ISLAND_LOW_COLOR;
      if (elevation < 300) return FLOATING_ISLAND_MID_COLOR;
      return FLOATING_ISLAND_HIGH_COLOR;
    },
  },
  [TerrainType.ETHEREAL_MIST]: {
    name: 'Ethereal Mist', symbol: '💨', color: 'fill-purple-300',
    speedMultiplier: 1.2, visibilityFactor: 0.1,
    baseInherentVisibilityBonus: -4, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 20, encounterChanceOnDiscover: 5,
    elevationColor: (elevation) => {
      if (elevation < 0) return ETHEREAL_MIST_DENSE_COLOR;
      if (elevation < 50) return ETHEREAL_MIST_MID_COLOR;
      return ETHEREAL_MIST_THIN_COLOR;
    },
  },
  [TerrainType.QUICKSAND]: {
    name: 'Quicksand', symbol: '⏳', color: 'fill-yellow-700',
    speedMultiplier: 4, visibilityFactor: 1,
    baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 5, encounterChanceOnDiscover: 1,
    elevationColor: (elevation) => QUICKSAND_COLOR,
  },
  [TerrainType.ICE_PLAIN]: {
    name: 'Ice Plain', symbol: '❄️', color: 'fill-cyan-200',
    speedMultiplier: 1.5, visibilityFactor: 1.2,
    baseInherentVisibilityBonus: 1, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 10, encounterChanceOnDiscover: 4,
    elevationColor: (elevation) => {
      if (elevation < 0) return ICE_PLAIN_LOW_COLOR;
      if (elevation < 50) return ICE_PLAIN_MID_COLOR;
      return ICE_PLAIN_HIGH_COLOR;
    },
  },
  [TerrainType.OBSIDIAN_FIELD]: {
    name: 'Obsidian Field', symbol: '🔮', color: 'fill-gray-900',
    speedMultiplier: 2, visibilityFactor: 0.8,
    baseInherentVisibilityBonus: 0, prominence: 1, canopyBlockage: 0,
    encounterChanceOnEnter: 15, encounterChanceOnDiscover: 6,
    elevationColor: (elevation) => {
      if (elevation < 0) return OBSIDIAN_FIELD_LOW_COLOR;
      if (elevation < 50) return OBSIDIAN_FIELD_MID_COLOR;
      return OBSIDIAN_FIELD_HIGH_COLOR;
    },
  },
};

export const PARTY_ACTIVITIES = {
  avoid_notice: {
    id: 'avoid_notice',
    name: 'Avoid Notice',
    description: 'Attempt Stealth (Perception DC) while traveling at half speed. On encounter start, use Stealth for initiative and detection.',
    movementPenaltyFactor: 2.0,
    traits: ['Exploration'],
    source: 'Player Core pg. 438'
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    description: 'Move at half speed with shield raised. Gain Raise a Shield benefits before first turn in combat.',
    movementPenaltyFactor: 2.0,
    traits: ['Exploration'],
    source: 'Player Core pg. 438'
  },
  detect_magic: {
    id: 'detect_magic',
    name: 'Detect Magic',
    description: 'Cast detect magic at intervals. Half speed or slower. Specific speeds for thoroughness.',
    movementPenaltyFactor: 2.0,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 438'
  },
  follow_expert: {
    id: 'follow_expert',
    name: 'Follow the Expert',
    description: 'Match ally\'s skill check (e.g., Climb, Avoid Notice). Add level to skill, gain circumstance bonus from ally.',
    movementPenaltyFactor: 1.0,
    traits: ['Auditory', 'Concentrate', 'Exploration', 'Visual'],
    source: 'Player Core pg. 438'
  },
  hustle: {
    id: 'hustle',
    name: 'Hustle',
    description: 'Move at double travel speed for Con mod × 10 minutes (min 10 min). Group uses lowest Con.',
    movementPenaltyFactor: 0.5,
    traits: ['Exploration', 'Move'],
    source: 'Player Core pg. 438'
  },
  investigate: {
    id: 'investigate',
    name: 'Investigate',
    description: 'Seek info with Recall Knowledge (secret) at half speed.',
    movementPenaltyFactor: 2.0,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  repeat_spell: {
    id: 'repeat_spell',
    name: 'Repeat a Spell',
    description: 'Repeatedly cast a 2-action or less spell (usually cantrip) at half speed.',
    movementPenaltyFactor: 2.0,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    description: 'Scout ahead/behind at half speed. Party gains +1 initiative next encounter.',
    movementPenaltyFactor: 2.0,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  },
  search: {
    id: 'search',
    name: 'Search',
    description: 'Meticulously Seek for hidden things. Half speed usually; slower for thoroughness. GM makes free secret Seek.',
    movementPenaltyFactor: 2.0,
    traits: ['Concentrate', 'Exploration'],
    source: 'Player Core pg. 439'
  }
};