// app/constants.js

export const AppMode = {
  HEX_EDITOR: 'hex_editor',
  PLAYER: 'player',
};

export const ViewMode = { 
  TWOD: '2d',
  THREED: '3d',
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
};

export const TerrainFeature = {
  NONE: 'none', 
  LANDMARK: 'LANDMARK', 
  SECRET: 'SECRET',     
};

export const ElevationBrushMode = {
  INCREASE: 'increase',
  DECREASE: 'decrease',
};

export const PaintMode = {
  ELEVATION: 'elevation',
  TERRAIN: 'terrain',
  FEATURE: 'feature',
};

export const HEX_SIZE = 30; 
export const INITIAL_GRID_WIDTH = 12; 
export const INITIAL_GRID_HEIGHT = 8; 
export const MIN_GRID_DIMENSION = 1;
export const MAX_GRID_DIMENSION = 50;

export const MIN_ELEVATION = -200;
export const MAX_ELEVATION = 6000;
export const ELEVATION_STEP = 100;
export const INITIAL_ELEVATION = 0;
export const INITIAL_BASE_VISIBILITY = 1; // Default base visibility for a hex before terrain/elevation mods

export const HEX_DIAMETER_KM = 5;
export const BASE_MOVE_HOURS_PER_HEX = 1;

export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 5;
export const DEFAULT_BRUSH_SIZE = 1;

export const ELEVATION_VISIBILITY_STEP_BONUS = 200; // For every X meters of elevation, sight range +1 (observer)

export const OBSERVER_EYE_HEIGHT_M = 5; 
export const TARGET_VISIBILITY_THRESHOLD_M = 1; 
export const PROFILE_LOS_BLOCKAGE_MARGIN = 1; 
export const ELEVATION_TIME_PENALTY_FACTOR_PER_100M = 0.1; // Hours per 100m change
export const FOREST_CANOPY_BLOCKAGE_ADDITION = 15; 
export const THICK_FOREST_CANOPY_BLOCKAGE_ADDITION = 20; 
export const YOUNG_FOREST_CANOPY_BLOCKAGE_ADDITION = 10; 
export const JUNGLE_CANOPY_BLOCKAGE_ADDITION = 25;    
export const HILLS_TERRAIN_BLOCKAGE_ADDITION = 5;   
export const ENCOUNTER_FEATURE_ICON = "⚔"; // Default icon for encounters turned features

export const TERRAIN_TYPES_CONFIG = {
  [TerrainType.PLAINS]: { 
    name: 'Plains', symbol: 'P', color: 'fill-green-400',
    speedMultiplier: 1, visibilityFactor: 1, 
    baseInherentVisibilityBonus: 0, prominence: 0, canopyBlockage: 0,
    encounterChanceOnEnter: 5,      // 5% chance when entering plains
    encounterChanceOnDiscover: 2,   // 2% chance when plains hex is revealed
  },
  [TerrainType.FOREST]: { 
    name: 'Forest', symbol: 'F', color: 'fill-green-700',
    speedMultiplier: 2, visibilityFactor: 0.5, 
    baseInherentVisibilityBonus: -1, prominence: 5, 
    canopyBlockage: FOREST_CANOPY_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 15,
    encounterChanceOnDiscover: 5,
  },
  [TerrainType.THICK_FOREST]: { 
    name: 'Thick Forest', symbol: 'TF', color: 'fill-green-900',
    speedMultiplier: 3, visibilityFactor: 0.25, 
    baseInherentVisibilityBonus: -2, prominence: 8, 
    canopyBlockage: THICK_FOREST_CANOPY_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 25,
    encounterChanceOnDiscover: 10,
  },
  [TerrainType.YOUNG_FOREST]: { 
    name: 'Young Forest', symbol: 'YF', color: 'fill-lime-500',
    speedMultiplier: 1.5, visibilityFactor: 0.75, 
    baseInherentVisibilityBonus: 0, prominence: 2, 
    canopyBlockage: YOUNG_FOREST_CANOPY_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 10,
    encounterChanceOnDiscover: 3,
  },
  [TerrainType.HILLS]: { 
    name: 'Hills', symbol: 'H', color: 'fill-amber-600',
    speedMultiplier: 1.5, visibilityFactor: 1, 
    baseInherentVisibilityBonus: 1, prominence: 20, 
    canopyBlockage: HILLS_TERRAIN_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 10,
    encounterChanceOnDiscover: 7, // Might spot lairs from hills
  },
  [TerrainType.MOUNTAIN]: { 
    name: 'Mountain', symbol: 'M', color: 'fill-gray-500',
    speedMultiplier: 4, visibilityFactor: 1, 
    baseInherentVisibilityBonus: 2, prominence: 50, 
    canopyBlockage: 0, 
    encounterChanceOnEnter: 20,
    encounterChanceOnDiscover: 15, // High peaks might have visible lairs/dangers
  },
  [TerrainType.SWAMP]: {
    name: 'Swamp', symbol: 'Sw', color: 'fill-teal-700',
    speedMultiplier: 2.5, visibilityFactor: 0.6, 
    baseInherentVisibilityBonus: -1, prominence: 1, 
    canopyBlockage: 8, 
    encounterChanceOnEnter: 30,
    encounterChanceOnDiscover: 5,
  },
  // ... (Add encounterChanceOnEnter & encounterChanceOnDiscover for DESERT, JUNGLE, BADLANDS, SETTLEMENT, ROAD, WATER)
  // Example for DESERT:
  [TerrainType.DESERT]: {
    name: 'Desert', symbol: 'Ds', color: 'fill-yellow-300',
    speedMultiplier: 1.2, visibilityFactor: 1.2, 
    baseInherentVisibilityBonus: 1, prominence: 0, 
    canopyBlockage: 0, 
    encounterChanceOnEnter: 8,
    encounterChanceOnDiscover: 3,
  },
  [TerrainType.JUNGLE]: {
    name: 'Jungle', symbol: 'Jg', color: 'fill-emerald-800',
    speedMultiplier: 3.5, visibilityFactor: 0.15, 
    baseInherentVisibilityBonus: -3, prominence: 10, 
    canopyBlockage: JUNGLE_CANOPY_BLOCKAGE_ADDITION,
    encounterChanceOnEnter: 35,
    encounterChanceOnDiscover: 10,
  },
  [TerrainType.BADLANDS]: {
    name: 'Badlands', symbol: 'Bd', color: 'fill-orange-700',
    speedMultiplier: 2, visibilityFactor: 0.9, 
    baseInherentVisibilityBonus: 0, prominence: 5, 
    canopyBlockage: 2, 
    encounterChanceOnEnter: 12,
    encounterChanceOnDiscover: 8,
  },
  [TerrainType.ROAD]: { 
    name: 'Road', symbol: 'Rd', color: 'fill-yellow-600',
    speedMultiplier: 0.25, visibilityFactor: 1, 
    baseInherentVisibilityBonus: 0, prominence: 0, 
    canopyBlockage: 0,
    encounterChanceOnEnter: 2, // Low on roads, but possible ambush
    encounterChanceOnDiscover: 0, // Unlikely to "discover" an encounter on a road from afar
  },
  [TerrainType.SETTLEMENT]: { 
    name: 'Settlement', symbol: 'S', color: 'fill-orange-500',
    speedMultiplier: 1, visibilityFactor: 1, 
    baseInherentVisibilityBonus: 1, prominence: 5, 
    canopyBlockage: 5, 
    encounterChanceOnEnter: 3, // Social encounter or trouble
    encounterChanceOnDiscover: 1, // Might spot a commotion
  },
  [TerrainType.WATER]: { 
    name: 'Water', symbol: 'W', color: 'fill-sky-700',
    speedMultiplier: 3, visibilityFactor: 1, 
    baseInherentVisibilityBonus: 0, prominence: 0, 
    canopyBlockage: 0,
    encounterChanceOnEnter: 10, // Aquatic encounter
    encounterChanceOnDiscover: 5, // Something on the surface/coast
  },
};

export const DEFAULT_TERRAIN_TYPE = TerrainType.PLAINS;

export const MOUNTAIN_THRESHOLD = 600; 
export const HILLS_THRESHOLD = 300;    

export const PLAINS_LOW_ELEV_COLOR = 'rgb(134, 239, 172)'; 
export const HILLS_COLOR_LOW = 'rgb(245, 222, 179)';
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

export const INITIAL_PLAYER_COL = 0;
export const INITIAL_PLAYER_ROW = 0;
export const PLAYER_MARKER_COLOR = 'fill-red-500'; 
export const FOG_OF_WAR_COLOR = 'rgb(20, 20, 20)'; 
export const DISCOVERED_DIM_OPACITY = 0.6; 
export const DEFAULT_APP_MODE = AppMode.HEX_EDITOR;
export const DEFAULT_VIEW_MODE = ViewMode.TWOD; 

// For 3D Projection
export const HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT = 0.05; 
export const HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT = 0.05;  
export const HEX_3D_Y_SQUASH_FACTOR = 1.0; 
export const HEX_3D_SIDE_COLOR_DARKEN_FACTOR = 0.25; 
export const HEX_3D_MIN_VISUAL_DEPTH = 1.5; 