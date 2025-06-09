// app/state.js
import * as CONST from './constants.js';

export const appState = {
  isGM: new URLSearchParams(window.location.search).get('isGM') === 'true',
  userId: new URLSearchParams(window.location.search).get('userId') || 'unknown_player_iframe',
  isStandaloneMode: !new URLSearchParams(window.location.search).get('moduleId'),
  appMode: null,
  viewMode: CONST.DEFAULT_VIEW_MODE,
  
  // Hexploration Status
  hexplorationTimeElapsedHoursToday: 0,
  hexplorationKmTraveledToday: 0,
  currentTimeOfDay: "N/A", 
  currentTravelSpeedText: "N/A (Calculating...)", 

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
  weatherConditions: [
    { id: 'sunny', name: 'Sunny', icon: '☀️', effects: { travelSpeed: 1, visibility: 1 } },
    { id: 'cloudy', name: 'Cloudy', icon: '☁️', effects: { travelSpeed: 1, visibility: 0.8 } },
    { id: 'rainy', name: 'Rainy', icon: '🌧️', effects: { travelSpeed: 0.8, visibility: 0.6 } }, // Note: PF2e this is usually x2 time
    { id: 'stormy', name: 'Stormy', icon: '⛈️', effects: { travelSpeed: 0.5, visibility: 0.2 } }, // Note: PF2e this is usually x4 time
    { id: 'foggy', name: 'Foggy', icon: '🌫️', effects: { travelSpeed: 0.9, visibility: 0.4 } }, // Note: PF2e this is usually x1.5 or x2 time
  ],
  weatherGrid: {},
  weatherSettings: { sunny: 70, cloudy: 15, rainy: 10, foggy: 5, stormy: 1 },
  timeSinceLastWeatherChange: 0,
  forecastHoursAhead: null,
  displayingForecastWeatherGrid: null,
  playerCanSeeCurrentWeather: true,
  activeWeatherSystems: [],
  timeSinceLastNewWeatherSystemSpawn: 0,
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