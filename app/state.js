// app/state.js
import * as CONST from './constants.js';

export const appState = {
  isGM: new URLSearchParams(window.location.search).get('isGM') === 'true',
  userId: new URLSearchParams(window.location.search).get('userId') || 'unknown_player_iframe',
  isStandaloneMode: !new URLSearchParams(window.location.search).get('moduleId'),
  appMode: null,
  viewMode: CONST.DEFAULT_VIEW_MODE,
  
  // Feature Connection Mode
  isConnectingFeature: false,
  connectingFeatureHexId: null,
  connectingFeatureType: null,

  // Hexploration Status
  hexplorationTimeElapsedHoursToday: 0,
  hexplorationKmTraveledToday: 0,
  currentTimeOfDay: "N/A", 
  currentTravelSpeedText: "N/A (Calculating...)", 

 mapDisorientation: {
    isActive: false,
    startTime: 0,
    duration: 0,                 // Duration in milliseconds
    currentRotationAngle: 0,     // Current angle of the map
    rotationSnapIntervalMs: 10000, // How often to snap to a new random angle
    internalIntervalId: null,    // For GM's internal timer to stop it
    playerAnimationId: null,     // For player's setTimeout loop
  },

  // New properties for detailed speed calculation
  calculatedSlowestIndividualTimeFactor: 1.0,
  calculatedSlowestIndividualActivityName: "None",
  calculatedCombinedGroupTimeFactor: 1.0,
  activeIndividualActivitiesList: [], 
  activeGroupActivitiesList: [], 
  finalEffectiveTimePerHex: 0, // This will be base hex time * activity factors only

  currentMapHexSizeValue: CONST.DEFAULT_HEX_SIZE_VALUE,
  currentMapHexSizeUnit: CONST.DEFAULT_HEX_SIZE_UNIT,
  currentMapHexTraversalTimeValue: CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE,
  currentMapHexTraversalTimeUnit: CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT,
  currentMapPartyMarkerImagePath: null, 

  isWaitingForFeatureDetails: false,
  featureDetailsCallback: null,
  pendingFeaturePlacement: null,

  currentGridWidth: CONST.INITIAL_GRID_WIDTH,
  currentGridHeight: CONST.INITIAL_GRID_HEIGHT,
  hexGridData: [],
  hexDataMap: new Map(),
  currentMapEventLog: [],

  elevationBrushMode: CONST.ElevationBrushMode.INCREASE,
  elevationBrushCustomStep: CONST.DEFAULT_CUSTOM_ELEVATION_STEP,
  elevationBrushSetValue: CONST.DEFAULT_SET_ELEVATION_VALUE,
  autoTerrainChangeOnElevation: CONST.AUTO_TERRAIN_CHANGE_ENABLED_DEFAULT,

  paintMode: CONST.PaintMode.ELEVATION,
  featureBrushAction: CONST.FeatureBrushAction.ADD,
  brushSize: CONST.DEFAULT_BRUSH_SIZE,
  selectedTerrainType: CONST.DEFAULT_TERRAIN_TYPE,
  selectedFeatureType: CONST.TerrainFeature.NONE,
  brushPreviewHexIds: new Set(),

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

  isWaitingForFormInput: false,
  formInputCallback: null,

  zoomLevel: 1.0,
  minZoom: 0.2,
  maxZoom: 3.0,
  zoomStep: 0.1,

  targetScrollLeft: null,
  targetScrollTop: null,
  centerViewOnHexAfterRender: null,

  activePartyActivities: new Map(),

  travelAnimation: {
    isActive: false,
    terrainType: null,
    terrainName: '',
    terrainColor: '#FFFFFF',
    terrainSymbol: '?',
    markerPosition: 0,
    startTime: 0,
    duration: 0,
    onComplete: null,
  },

  isWeatherEnabled: false,
  mapWeatherSystem: getDefaultMapWeatherSystem(),
  weatherGrid: {},

  timeSinceLastWeatherChange: 0, // This might be deprecated if weather moves continuously
  forecastHours: 0, // For GM forecast input
  forecastHoursPlayer: 0, // For player forecast slider
  displayingForecastWeatherGrid: null, // Holds the grid for the forecast view
  playerCanSeeCurrentWeather: true, // Player UI toggle
};

export function getDefaultMapWeatherSystem() {
  const defaultAvailableTypes = CONST.DEFAULT_WEATHER_CONDITIONS.map(wc => wc.id);
  const defaultWeights = {};
  CONST.DEFAULT_WEATHER_CONDITIONS.forEach(wc => {
    // Default weights, e.g., sunny 70, cloudy 15, rainy 10, etc.
    if (wc.id === 'sunny') defaultWeights[wc.id] = 70;
    else if (wc.id === 'cloudy') defaultWeights[wc.id] = 15;
    else if (wc.id === 'rainy') defaultWeights[wc.id] = 10;
    else if (wc.id === 'stormy') defaultWeights[wc.id] = 3;
    else if (wc.id === 'foggy') defaultWeights[wc.id] = 2;
    else defaultWeights[wc.id] = 0;
  });

  return {
    windStrength: 'CALM', // Key from CONST.WIND_STRENGTHS
    windDirection: 'CALM', // Key from CONST.WIND_DIRECTIONS
    availableWeatherTypes: defaultAvailableTypes, // Array of weather type IDs
    weatherTypeWeights: defaultWeights, // Object { weatherTypeId: weight, ... }
    activeWeatherSystems: [], // Array of active weather system objects
    weatherGrid: {}, // { hexId: weatherTypeId }
    // Add other map-specific general weather settings if needed later
  };
}


export function resetActiveMapState() {
    appState.hexGridData = []; appState.hexDataMap = new Map();
    appState.editorLosSourceHexId = null; appState.editorVisibleHexIds = new Set();
    appState.isEditorLosSelectMode = false;
    appState.partyMarkerPosition = null;
    appState.playerCurrentVisibleHexIds = new Set();
    appState.playerDiscoveredHexIds = new Set();
    appState.lastMovementInfo = null;
    appState.isWaitingForFeatureDetails = false;
    appState.isConnectingFeature = false;
    appState.connectingFeatureHexId = null;
    appState.connectingFeatureType = null;

  appState.mapDisorientation = {
    isActive: false,
    startTime: 0,
    duration: 0,
    internalIntervalId: null,
    playerAnimationId: null,
    jiggleRangePx: 15,
    jiggleIntervalMs: 100
  };

    appState.isWeatherEnabled = false; // Default to off for a new/reset map context
    appState.mapWeatherSystem = getDefaultMapWeatherSystem();

    appState.timeSinceLastWeatherChange = 0;
    appState.forecastHours = 0;
    appState.forecastHoursPlayer = 0;
    appState.displayingForecastWeatherGrid = null;
    appState.playerCanSeeCurrentWeather = true;

    appState.currentMapPartyMarkerImagePath = null; 
    appState.currentMapEventLog = [];
    appState.mapInitialized = false; appState.isCurrentMapDirty = false;
    appState.featureDetailsCallback = null;
    appState.pendingFeaturePlacement = null;

    appState.currentMapHexSizeValue = CONST.DEFAULT_HEX_SIZE_VALUE;
    appState.currentMapHexSizeUnit = CONST.DEFAULT_HEX_SIZE_UNIT;
    appState.currentMapHexTraversalTimeValue = CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
    appState.currentMapHexTraversalTimeUnit = CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;

    appState.targetScrollLeft = null;
    appState.targetScrollTop = null;
    appState.centerViewOnHexAfterRender = null;


    
    appState.zoomLevel = 1.0;
    appState.activePartyActivities = new Map();

    appState.travelAnimation = {
      isActive: false,
      terrainType: null,
      terrainName: '',
      terrainColor: '#FFFFFF',
      terrainSymbol: '?',
      markerPosition: 0,
      startTime: 0,
      duration: 0,
      onComplete: null,
    };

    appState.isWeatherEnabled = false;
    appState.weatherGrid = {};
    appState.weatherSettings = { sunny: 70, cloudy: 15, rainy: 10, foggy: 5, stormy: 1 };
    appState.timeSinceLastWeatherChange = 0;
    appState.forecastHoursAhead = null;
    appState.displayingForecastWeatherGrid = null;
    appState.playerCanSeeCurrentWeather = true;
    appState.activeWeatherSystems = [];
    appState.timeSinceLastNewWeatherSystemSpawn = 0;

    appState.elevationBrushMode = CONST.ElevationBrushMode.INCREASE;
    appState.elevationBrushCustomStep = CONST.DEFAULT_CUSTOM_ELEVATION_STEP;
    appState.elevationBrushSetValue = CONST.DEFAULT_SET_ELEVATION_VALUE;
    appState.autoTerrainChangeOnElevation = CONST.AUTO_TERRAIN_CHANGE_ENABLED_DEFAULT;
    
    // Reset Hexploration Status specific fields
    appState.hexplorationTimeElapsedHoursToday = 0;
    appState.hexplorationKmTraveledToday = 0;
    appState.currentTimeOfDay = "N/A";
    appState.currentTravelSpeedText = "N/A";

    // Reset new speed calculation fields
    appState.calculatedSlowestIndividualTimeFactor = 1.0;
    appState.calculatedSlowestIndividualActivityName = "None";
    appState.calculatedCombinedGroupTimeFactor = 1.0;
    appState.activeIndividualActivitiesList = [];
    appState.activeGroupActivitiesList = [];
    appState.finalEffectiveTimePerHex = CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;


    if (!appState.currentMapName || appState.isStandaloneMode) {
        appState.currentGridWidth = CONST.INITIAL_GRID_WIDTH;
        appState.currentGridHeight = CONST.INITIAL_GRID_HEIGHT;
        appState.tempGridWidth = CONST.INITIAL_GRID_WIDTH.toString();
        appState.tempGridHeight = CONST.INITIAL_GRID_HEIGHT.toString();
    }
}