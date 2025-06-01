import * as CONST from './constants.js';

export const appState = {
  isGM: new URLSearchParams(window.location.search).get('isGM') === 'true',
  userId: new URLSearchParams(window.location.search).get('userId') || 'unknown_player_iframe',
  appMode: null,
  viewMode: CONST.DEFAULT_VIEW_MODE,
  hexplorationTimeElapsedHoursToday: 0,
  hexplorationKmTraveledToday: 0,

  currentMapHexSizeValue: CONST.DEFAULT_HEX_SIZE_VALUE,
  currentMapHexSizeUnit: CONST.DEFAULT_HEX_SIZE_UNIT,
  currentMapHexTraversalTimeValue: CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE,
  currentMapHexTraversalTimeUnit: CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT,

  isWaitingForFeatureDetails: false,
  featureDetailsCallback: null,
  pendingFeaturePlacement: null,

  currentGridWidth: CONST.INITIAL_GRID_WIDTH,
  currentGridHeight: CONST.INITIAL_GRID_HEIGHT,
  hexGridData: [],
  hexDataMap: new Map(),
  currentMapEventLog: [],
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

  isWaitingForFormInput: false,
  formInputCallback: null,

  zoomLevel: 1.0,
  minZoom: 0.2,
  maxZoom: 3.0,
  zoomStep: 0.1,

  targetScrollLeft: null,
  targetScrollTop: null,
  centerViewOnHexAfterRender: null,

  activePartyActivities: new Set(), // Store IDs of active activities
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
    appState.activePartyActivities = new Set();


    if (!appState.currentMapName) {
        appState.currentGridWidth = CONST.INITIAL_GRID_WIDTH;
        appState.currentGridHeight = CONST.INITIAL_GRID_HEIGHT;
        appState.tempGridWidth = CONST.INITIAL_GRID_WIDTH.toString();
        appState.tempGridHeight = CONST.INITIAL_GRID_HEIGHT.toString();
    }
}