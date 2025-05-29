// app/state.js
import * as CONST from './constants.js';

export const appState = {
  isGM: new URLSearchParams(window.location.search).get('isGM') === 'true',
  userId: new URLSearchParams(window.location.search).get('userId') || 'unknown_player_iframe',
  appMode: null, 
  viewMode: CONST.DEFAULT_VIEW_MODE, // Added for 2D/3D toggle
  hexplorationTimeElapsedHoursToday: 0, // Total hours spent in current hexploration day
  hexplorationKmTraveledToday: 0,   // KM traveled today
  isWaitingForFeatureDetails: false,
  featureDetailsCallback: null,
  pendingFeaturePlacement: null, // Will store { hexId, featureType }

  currentGridWidth: CONST.INITIAL_GRID_WIDTH,
  currentGridHeight: CONST.INITIAL_GRID_HEIGHT,
  hexGridData: [], 
  hexDataMap: new Map(),
    currentMapEventLog: [], // Add this
  elevationBrushMode: CONST.ElevationBrushMode.INCREASE,
  paintMode: CONST.PaintMode.ELEVATION,
  brushSize: CONST.DEFAULT_BRUSH_SIZE,
  selectedTerrainType: CONST.DEFAULT_TERRAIN_TYPE,
  selectedFeatureType: CONST.TerrainFeature.NONE,
  
  editorLosSourceHexId: null,
  editorVisibleHexIds: new Set(),
  isEditorLosSelectMode: false,
  
  partyMarkerPosition: null, 
  playerDiscoveredHexIds: new Set(), 
  playerCurrentVisibleHexIds: new Set(), 
  lastMovementInfo: null, 
  
  mapInitialized: false, 
  tempGridWidth: CONST.INITIAL_GRID_WIDTH.toString(),
  tempGridHeight: CONST.INITIAL_GRID_HEIGHT.toString(),

  mapList: [], 
  currentMapId: null, 
  currentMapName: null, 
  isCurrentMapDirty: false, 
  activeGmMapId: null, 
  
  isWaitingForMapName: false, 
  mapNamePromptCallback: null,
};

export function resetActiveMapState() {
    appState.hexGridData = []; appState.hexDataMap = new Map();
    appState.editorLosSourceHexId = null; appState.editorVisibleHexIds = new Set();
    appState.isEditorLosSelectMode = false;
    appState.partyMarkerPosition = null; 
    appState.playerCurrentVisibleHexIds = new Set();
    appState.playerDiscoveredHexIds = new Set(); 
    appState.lastMovementInfo = null;
    appState.isWaitingForFeatureDetails = false;
        appState.currentMapEventLog = []; // Reset log when map changes
    appState.mapInitialized = false; appState.isCurrentMapDirty = false;
    appState.featureDetailsCallback = null;
    appState.pendingFeaturePlacement = null;
    appState.mapInitialized = false; appState.isCurrentMapDirty = false;
    // appState.viewMode remains as it's a general UI preference, not map-specific state.
    
    if (!appState.currentMapName) { 
        appState.currentGridWidth = CONST.INITIAL_GRID_WIDTH;
        appState.currentGridHeight = CONST.INITIAL_GRID_HEIGHT;
        appState.tempGridWidth = CONST.INITIAL_GRID_WIDTH.toString();
        appState.tempGridHeight = CONST.INITIAL_GRID_HEIGHT.toString();
    }
    console.log("JS App STATE: Active map-specific state reset.");
}