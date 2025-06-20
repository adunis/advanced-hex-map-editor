// File: app/map-management.js

import { appState, resetActiveMapState } from './state.js';
import * as CONST from './constants.js';
import { initializeGridData, updatePartyMarkerBasedLoS, requestCenteringOnHex } from './map-logic.js';
import { renderApp } from './ui.js';

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');


export function loadGlobalExplorationForMap(mapDataFromBridge) {

    if (mapDataFromBridge && mapDataFromBridge.exploration && Array.isArray(mapDataFromBridge.exploration.discoveredHexIds)) {
        appState.playerDiscoveredHexIds = new Set(mapDataFromBridge.exploration.discoveredHexIds);
    } else {
        appState.playerDiscoveredHexIds = new Set();
    }

    if (mapDataFromBridge && mapDataFromBridge.partyMarkerPosition && mapDataFromBridge.partyMarkerPosition.id &&
        typeof mapDataFromBridge.partyMarkerPosition.col === 'number' &&
        typeof mapDataFromBridge.partyMarkerPosition.row === 'number') {
        appState.partyMarkerPosition = { ...mapDataFromBridge.partyMarkerPosition };
    } else {
        appState.partyMarkerPosition = null;
    }

    if (mapDataFromBridge && Array.isArray(mapDataFromBridge.eventLog)) {
        appState.currentMapEventLog = mapDataFromBridge.eventLog;
    } else {
        appState.currentMapEventLog = [];
    }
}

// app/map-management.js

export function getMapContextDataForSave() {
    const markerPos = appState.partyMarkerPosition;

    let weatherSystemDataToSave = null;
    if (appState.isWeatherEnabled && appState.mapWeatherSystem) { // Check if mapWeatherSystem exists
        weatherSystemDataToSave = {
            ...appState.mapWeatherSystem,
            isWeatherEnabled: true, // Explicitly save the enabled state here
            activeWeatherSystems: (appState.mapWeatherSystem.activeWeatherSystems || []).map(sys => ({
                ...sys,
                hexesOccupied: Array.from(sys.hexesOccupied || [])
            }))
        };
    } else {
        // If weather is not enabled, we can save a minimal object indicating it's off,
        // or rely on null and let the loading logic handle it.
        // For clarity, let's save an explicit "off" state if it was interacted with but then disabled.
        // Or, if it was never enabled, mapWeatherSystem might be default.
        // Simplest: if appState.isWeatherEnabled is false, mapWeatherSystem in payload will be null.
    }


    const dataToReturn = {
        explorationData: {
            discoveredHexIds: Array.from(appState.playerDiscoveredHexIds)
        },
        partyMarkerPosition: markerPos ?
            {
                id: markerPos.id,
                col: markerPos.col,
                row: markerPos.row,
                q: markerPos.q,
                r: markerPos.r,
                s: markerPos.s
            } : null,
        eventLog: appState.currentMapEventLog || [],
        mapSettings: {
            hexSizeValue: appState.currentMapHexSizeValue,
            hexSizeUnit: appState.currentMapHexSizeUnit,
            hexTraversalTimeValue: appState.currentMapHexTraversalTimeValue,
            hexTraversalTimeUnit: appState.currentMapHexTraversalTimeUnit,
            zoomLevel: appState.zoomLevel,
            partyMarkerImagePath: appState.currentMapPartyMarkerImagePath,
        },
        // Updated: mapWeatherSystem will be null if appState.isWeatherEnabled is false,
        // or it will contain the weather data including its own isWeatherEnabled: true flag.
        mapWeatherSystem: appState.isWeatherEnabled ? weatherSystemDataToSave : null
    };

    return dataToReturn;
}

export function handleSaveCurrentMap(eventOrIsAutoSave = false) {
    const isAutoSaveActual = (typeof eventOrIsAutoSave === 'boolean') ? eventOrIsAutoSave : false;

    if (!appState.isGM && !appState.isStandaloneMode) { // Allow save in standalone mode for anyone
        if (!isAutoSaveActual) alert("Only GMs can save maps to the server.");
        return;
    }
    if (!appState.mapInitialized && !appState.currentMapName) {
        if (!isAutoSaveActual) alert("No active map data to save. Please create or open a map first.");
        return;
    }
     if (appState.isStandaloneMode && isAutoSaveActual) { // Don't auto-save in standalone
        return;
    }
    if (!appState.currentMapId && isAutoSaveActual && (!appState.currentMapName || !appState.currentMapName.trim())) {
        return;
    }


    let mapIdToSave = appState.currentMapId;
    let mapNameToSave = appState.currentMapName;

    if (!mapIdToSave && !isAutoSaveActual && !appState.isStandaloneMode) { // Prompt for name if new map and not standalone
        appState.isWaitingForFormInput = true;
        appState.formInputCallback = function(formDataFromDialog) {
            appState.isWaitingForFormInput = false;
            appState.formInputCallback = null;
            if (!formDataFromDialog || formDataFromDialog.cancelled || !formDataFromDialog.mapName || !formDataFromDialog.mapName.trim()) {
                if (formDataFromDialog && formDataFromDialog.cancelled) {
                    renderApp({ preserveScroll: true });
                } else {
                    alert("Map name cannot be empty for the first save.");
                }
                return;
            }
            appState.currentMapName = formDataFromDialog.mapName.trim();
            proceedWithSave(null, appState.currentMapName, false);
        };
        const formPayload = {
            title: "Save New Map",
            fields: [{
                name: "mapName",
                label: "Enter name for this new map:",
                type: "text",
                default: mapNameToSave || `New Hex Map ${appState.mapList.length + 1}`
            }]
        };
        window.parent.postMessage({
            type: 'requestFormInput',
            payload: formPayload,
            moduleId: APP_MODULE_ID
        }, '*');
        return;
    }
     if (!mapIdToSave && !mapNameToSave && appState.isStandaloneMode && !isAutoSaveActual) { // If standalone, new map, and manual save
        const newName = prompt("Enter a name for this map:", `My Standalone Map`);
        if (!newName || !newName.trim()) {
            alert("Map name cannot be empty.");
            return;
        }
        mapNameToSave = newName.trim();
        appState.currentMapName = mapNameToSave;
        // In standalone, ID might not matter as much unless we implement local storage listing
        mapIdToSave = `standalone-${Date.now()}`;
        appState.currentMapId = mapIdToSave;
    }
    proceedWithSave(mapIdToSave, mapNameToSave, isAutoSaveActual);
}

function proceedWithSave(mapId, mapName, isAutoSaveFlag) {
    if (!mapName || !mapName.trim()) {
        alert("Map name is missing or empty. Cannot save.");
        return;
    }

    const mapStructurePayload = {
        gridSettings: { gridWidth: appState.currentGridWidth, gridHeight: appState.currentGridHeight },
        hexes: Array.from(appState.hexDataMap.values())
    };
    const contextDataForSave = getMapContextDataForSave();
    const finalPayload = {
        mapId: mapId,
        mapName: mapName,
        mapData: mapStructurePayload,
        explorationData: contextDataForSave.explorationData || { discoveredHexIds: [] },
        partyMarkerPosition: contextDataForSave.partyMarkerPosition, // Can be null
        eventLog: contextDataForSave.eventLog || [],
        mapSettings: contextDataForSave.mapSettings || {
            hexSizeValue: CONST.DEFAULT_HEX_SIZE_VALUE,
            hexSizeUnit: CONST.DEFAULT_HEX_SIZE_UNIT,
            hexTraversalTimeValue: CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE,
            hexTraversalTimeUnit: CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT,
            zoomLevel: 1.0
        },
                mapWeatherSystem: contextDataForSave.mapWeatherSystem, // This is now correctly sourced
        isAutoSave: isAutoSaveFlag
    };

    if (appState.isStandaloneMode) {
        handleExportMapFile(true); // True indicates it's part of a save operation
        appState.isCurrentMapDirty = false;
        renderApp({ preserveScroll: true });
    } else {
        window.parent.postMessage({
            type: 'saveMapData',
            payload: finalPayload,
            moduleId: APP_MODULE_ID
        }, '*');
    }
}


export function handleSaveMapAs() {
    if (!appState.isGM && !appState.isStandaloneMode) { alert("Operation not allowed."); return; }
    if (!appState.mapInitialized) {
        alert("No active map to 'Save As'. Please create or open a map first.");
        return;
    }
    if (appState.isStandaloneMode) {
        alert("'Save As' is not applicable in standalone mode. Use 'Export Map' or simply save if you renamed it.");
        return;
    }

    appState.isWaitingForFormInput = true;
    appState.formInputCallback = function(formDataFromDialog) {
        appState.isWaitingForFormInput = false;
        appState.formInputCallback = null;
        if (!formDataFromDialog || formDataFromDialog.cancelled || !formDataFromDialog.mapName || !formDataFromDialog.mapName.trim()) {
            if (formDataFromDialog && formDataFromDialog.cancelled) {
                renderApp({ preserveScroll: true });
            } else {
                alert("New map name for 'Save As' cannot be empty.");
            }
            return;
        }
        const finalNewMapName = formDataFromDialog.mapName.trim();

        const mapStructurePayload = {
            gridSettings: { gridWidth: appState.currentGridWidth, gridHeight: appState.currentGridHeight },
            hexes: Array.from(appState.hexDataMap.values())
        };
        const contextDataForSave = getMapContextDataForSave();
        const finalPayload = {
            mapId: null, // Null ID signifies a new map for the bridge
            mapName: finalNewMapName,
            mapData: mapStructurePayload,
            explorationData: contextDataForSave.explorationData || { discoveredHexIds: [] },
            partyMarkerPosition: contextDataForSave.partyMarkerPosition,
            eventLog: [], // Typically, event log is not copied for "Save As"
            mapSettings: contextDataForSave.mapSettings || { /* defaults */ },
            isAutoSave: false
        };

        window.parent.postMessage({
            type: 'saveMapData',
            payload: finalPayload,
            moduleId: APP_MODULE_ID
        }, '*');
    };
    const formPayload = {
        title: "Save Map As...",
        fields: [{
            name: "mapName",
            label: "Enter new name for this map copy:",
            type: "text",
            default: `${appState.currentMapName || 'Unnamed Map'} (Copy)`
        }]
    };
    window.parent.postMessage({
        type: 'requestFormInput',
        payload: formPayload,
        moduleId: APP_MODULE_ID
    }, '*');
}

function populateStandaloneModalSelects() {
    const terrainSelect = document.getElementById('modalDefaultTerrain');
    if (terrainSelect) {
        terrainSelect.innerHTML = ''; // Clear existing
        Object.entries(CONST.TERRAIN_TYPES_CONFIG).forEach(([key, conf]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${conf.name} (${conf.symbol})`;
            if (key === CONST.DEFAULT_TERRAIN_TYPE) option.selected = true;
            terrainSelect.appendChild(option);
        });
    }
    const hexSizeUnitSelect = document.getElementById('modalHexSizeUnit');
    if (hexSizeUnitSelect) {
        hexSizeUnitSelect.innerHTML = '';
        CONST.DISTANCE_UNITS.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.key;
            option.textContent = unit.label;
            if (unit.key === CONST.DEFAULT_HEX_SIZE_UNIT) option.selected = true;
            hexSizeUnitSelect.appendChild(option);
        });
    }
    const hexTraversalTimeUnitSelect = document.getElementById('modalHexTraversalTimeUnit');
    if (hexTraversalTimeUnitSelect) {
        hexTraversalTimeUnitSelect.innerHTML = '';
        CONST.TIME_UNITS.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.key;
            option.textContent = unit.label;
            if (unit.key === CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT) option.selected = true;
            hexTraversalTimeUnitSelect.appendChild(option);
        });
    }
     // Set default values for inputs
    const modalMapName = document.getElementById('modalMapName');
    if (modalMapName) modalMapName.value = `My Map ${Date.now() % 10000}`;
    const modalGridWidth = document.getElementById('modalGridWidth');
    if (modalGridWidth) modalGridWidth.value = CONST.INITIAL_GRID_WIDTH;
    const modalGridHeight = document.getElementById('modalGridHeight');
    if (modalGridHeight) modalGridHeight.value = CONST.INITIAL_GRID_HEIGHT;
    const modalDefaultElevation = document.getElementById('modalDefaultElevation');
    if (modalDefaultElevation) modalDefaultElevation.value = CONST.INITIAL_ELEVATION;
    const modalHexSizeValue = document.getElementById('modalHexSizeValue');
    if(modalHexSizeValue) modalHexSizeValue.value = CONST.DEFAULT_HEX_SIZE_VALUE;
    const modalHexTraversalTimeValue = document.getElementById('modalHexTraversalTimeValue');
    if(modalHexTraversalTimeValue) modalHexTraversalTimeValue.value = CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;

}


// This function will be called by handleCreateNewMap
function createMapLogic(formDataFromDialog) {
    const finalMapName = formDataFromDialog.mapName.trim();
    const gridWidth = parseInt(formDataFromDialog.gridWidth, 10) || CONST.INITIAL_GRID_WIDTH;
    const gridHeight = parseInt(formDataFromDialog.gridHeight, 10) || CONST.INITIAL_GRID_HEIGHT;
    const rawDefaultElevation = parseFloat(formDataFromDialog.defaultElevation);
    const defaultElevation = !isNaN(rawDefaultElevation) ? rawDefaultElevation : CONST.INITIAL_ELEVATION;
    const defaultTerrainType = formDataFromDialog.defaultTerrainType || CONST.DEFAULT_TERRAIN_TYPE;

    resetActiveMapState();
    appState.currentMapId = appState.isStandaloneMode ? `standalone-${Date.now()}` : null;
    appState.currentMapName = finalMapName;
    appState.currentMapHexSizeValue = parseFloat(formDataFromDialog.hexSizeValue) || CONST.DEFAULT_HEX_SIZE_VALUE;
    appState.currentMapHexSizeUnit = formDataFromDialog.hexSizeUnit || CONST.DEFAULT_HEX_SIZE_UNIT;
        appState.currentMapPartyMarkerImagePath = null; // <<< ADDED (default for new maps)
    appState.currentMapHexTraversalTimeValue = parseFloat(formDataFromDialog.hexTraversalTimeValue) || CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
    appState.currentMapHexTraversalTimeUnit = formDataFromDialog.hexTraversalTimeUnit || CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
    appState.isCurrentMapDirty = true;

    if (appState.isGM && !appState.isStandaloneMode) {
        window.parent.postMessage({ type: 'gmSetActiveMap', payload: { mapId: null }, moduleId: APP_MODULE_ID }, '*');
        appState.activeGmMapId = null;
    }

    initializeGridData(gridWidth, gridHeight, [], true, defaultElevation, defaultTerrainType);
    const firstHex = appState.hexDataMap.values().next().value;
    if(firstHex) requestCenteringOnHex(firstHex.id);
    renderApp();
};


export function handleCreateNewMap(silent = false) {
    if (!appState.isGM && !appState.isStandaloneMode) { alert("Operation not allowed."); return; }

    if (appState.isCurrentMapDirty && (appState.currentMapId || appState.isStandaloneMode) && !silent) {
        const message = appState.isStandaloneMode
            ? "You have unsaved changes on the current local map. Create a new map anyway? Unsaved changes will be lost if not exported/saved."
            : "You have unsaved changes on the current map. Create a new map anyway? Unsaved changes will be lost.";
        if (!window.confirm(message)) {
            return;
        }
    }
    const defaultMapName = appState.isStandaloneMode ? `My Standalone Map` : `New Hex Map ${appState.mapList.length + 1}`;


    if (appState.isStandaloneMode && silent) { // For initial load in standalone
        const defaultData = {
            mapName: "Standalone Default Map",
            gridWidth: CONST.INITIAL_GRID_WIDTH,
            gridHeight: CONST.INITIAL_GRID_HEIGHT,
            defaultElevation: CONST.INITIAL_ELEVATION,
            defaultTerrainType: CONST.DEFAULT_TERRAIN_TYPE,
            hexSizeValue: CONST.DEFAULT_HEX_SIZE_VALUE,
            hexSizeUnit: CONST.DEFAULT_HEX_SIZE_UNIT,
            hexTraversalTimeValue: CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE,
            hexTraversalTimeUnit: CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT,
        };
        createMapLogic(defaultData);
        return;
    }

    if (appState.isStandaloneMode && !silent) {
        const modal = document.getElementById('standaloneCreateMapModal');
        const form = document.getElementById('standaloneCreateMapForm');
        const cancelButton = document.getElementById('cancelStandaloneCreateMap');

        if (!modal || !form || !cancelButton) {
            console.error("Standalone create map modal elements not found!");
            // Fallback to simple prompt if modal is broken
            const mapName = prompt("Enter Map Name:", defaultMapName);
            if (!mapName || !mapName.trim()) { renderApp(); return; }
            const formData = { mapName: mapName.trim(), /* add other defaults here */ };
             formFields.forEach(f => formData[f.name] = formData[f.name] || f.default);
            createMapLogic(formData);
            return;
        }

        populateStandaloneModalSelects(); // Populate dropdowns with current data
        modal.classList.remove('hidden');

        const submitHandler = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            // Ensure numeric types
            data.gridWidth = parseInt(data.gridWidth, 10);
            data.gridHeight = parseInt(data.gridHeight, 10);
            data.defaultElevation = parseFloat(data.defaultElevation);
            data.hexSizeValue = parseFloat(data.hexSizeValue);
            data.hexTraversalTimeValue = parseFloat(data.hexTraversalTimeValue);


            modal.classList.add('hidden');
            form.removeEventListener('submit', submitHandler); // Clean up
            createMapLogic(data);
        };

        const cancelHandler = () => {
            modal.classList.add('hidden');
            form.removeEventListener('submit', submitHandler);
            cancelButton.removeEventListener('click', cancelHandler);
            renderApp({ preserveScroll: true }); // Re-render to clear any app mode changes
        };

        form.addEventListener('submit', submitHandler);
        cancelButton.addEventListener('click', cancelHandler);
        return;
    }

    // Foundry mode - use form dialog via bridge
    appState.isWaitingForFormInput = true;
    appState.formInputCallback = function(formDataFromDialog) {
        appState.isWaitingForFormInput = false; appState.formInputCallback = null;
        if (!formDataFromDialog || formDataFromDialog.cancelled || !formDataFromDialog.mapName || formDataFromDialog.mapName.trim() === "") {
            renderApp();
            return;
        }
        createMapLogic(formDataFromDialog);
    };

    const formFieldsForBridge = [ // Define here for bridge, as CONST might not be accessible in bridge context
        { name: "mapName", label: "Map Name:", type: "text", default: defaultMapName },
        { name: "gridWidth", label: "Grid Width:", type: "number", default: CONST.INITIAL_GRID_WIDTH, min: CONST.MIN_GRID_DIMENSION, max: CONST.MAX_GRID_DIMENSION, step: 1 },
        { name: "gridHeight", label: "Grid Height:", type: "number", default: CONST.INITIAL_GRID_HEIGHT, min: CONST.MIN_GRID_DIMENSION, max: CONST.MAX_GRID_DIMENSION, step: 1 },
        { name: "defaultElevation", label: "Default Hex Elevation (m):", type: "number", default: CONST.INITIAL_ELEVATION, min: CONST.MIN_ELEVATION, max: CONST.MAX_ELEVATION, step: 10 },
        { name: "defaultTerrainType", label: "Default Hex Terrain:", type: "select", default: CONST.DEFAULT_TERRAIN_TYPE, options: Object.entries(CONST.TERRAIN_TYPES_CONFIG).map(([key, conf]) => ({value: key, label: `${conf.name} (${conf.symbol})`})) },
        { name: "hexSizeValue", label: "Hex Size Value:", type: "number", default: CONST.DEFAULT_HEX_SIZE_VALUE, min: 0.01, step: 0.01 },
        { name: "hexSizeUnit", label: "Hex Size Unit:", type: "select", default: CONST.DEFAULT_HEX_SIZE_UNIT, options: CONST.DISTANCE_UNITS.map(u => ({value: u.key, label: u.label})) },
        { name: "hexTraversalTimeValue", label: "Traversal Time:", type: "number", default: CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE, min: 0.01, step: 0.01 },
        { name: "hexTraversalTimeUnit", label: "Traversal Unit:", type: "select", default: CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT, options: CONST.TIME_UNITS.map(u => ({value: u.key, label: u.label})) },
    ];
    const formPayload = { title: "Create New Map", fields: formFieldsForBridge, dialogWidth: 500 };
    window.parent.postMessage({ type: 'requestFormInput', payload: formPayload, moduleId: APP_MODULE_ID }, '*');
}


export function handleOpenMap(mapIdToOpen, isAutomaticOpen = false) {
    if (appState.isStandaloneMode) {
        alert("Opening saved maps from server is not available in standalone mode. Use 'Load File...'");
        return;
    }
    if (!isAutomaticOpen && appState.isCurrentMapDirty && appState.currentMapId) {
        if (!confirm("You have unsaved changes on the current map. Open another map anyway? Unsaved changes will be lost.")) {
            const selectElement = document.getElementById('savedMapSelect');
            if (selectElement && appState.currentMapId) {
                selectElement.value = appState.currentMapId;
            } else if (selectElement) {
                selectElement.value = "";
            }
            return;
        }
    }

    appState.currentMapId = mapIdToOpen;
    const mapListItem = appState.mapList.find(m => m.id === mapIdToOpen);
    appState.currentMapName = mapListItem ? mapListItem.name : "Loading map...";
    appState.mapInitialized = false;
    appState.activePartyActivities.clear();
    renderApp();
    window.parent.postMessage({ type: 'requestMapLoad', payload: { mapId: mapIdToOpen }, moduleId: APP_MODULE_ID }, '*');
}


export function handleDeleteMap(mapIdToDelete, mapName) {
    if (appState.isStandaloneMode) { alert("Deleting maps is not applicable in standalone mode."); return; }
    if (!appState.isGM) { alert("Only GMs can delete maps."); return; }
    if (!confirm(`Are you sure you want to delete the map "${mapName || 'this map'}"? This action cannot be undone.`)) return;
    window.parent.postMessage({ type: 'deleteMap', payload: { mapId: mapIdToDelete }, moduleId: APP_MODULE_ID }, '*');
}

export function handleLoadMapFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) { return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawData = JSON.parse(e.target.result);
            let hexes, gridSettings, explorationData, partyMarkerPositionFromFile, mapSettingsFromFile, eventLogFromFile, mapWeatherSystemFromFile;

            if (rawData && 'mapData' in rawData && 'gridSettings' in rawData.mapData && 'hexes' in rawData.mapData) { // Preferred full export format
                gridSettings = rawData.mapData.gridSettings;
                hexes = rawData.mapData.hexes;
                explorationData = rawData.explorationData || { discoveredHexIds: [] };
                partyMarkerPositionFromFile = rawData.partyMarkerPosition !== undefined ? rawData.partyMarkerPosition : null;
                eventLogFromFile = rawData.eventLog || [];
                mapSettingsFromFile = rawData.mapSettings;
                                mapWeatherSystemFromFile = rawData.mapWeatherSystem || null;
            }
            // ... (keep other format checks if necessary) ...
            else {
                throw new Error("Invalid or unrecognized map file format. Could not find expected data structure.");
            }

            const w = Math.max(CONST.MIN_GRID_DIMENSION, Math.min(CONST.MAX_GRID_DIMENSION, gridSettings.gridWidth || CONST.INITIAL_GRID_WIDTH));
            const h = Math.max(CONST.MIN_GRID_DIMENSION, Math.min(CONST.MAX_GRID_DIMENSION, gridSettings.gridHeight || CONST.INITIAL_GRID_HEIGHT));

            if (appState.isCurrentMapDirty && (appState.currentMapId || appState.isStandaloneMode)) {
                if (!confirm("Loading this map file will replace any unsaved changes on the current map. Continue?")) {
                    if(event.target) event.target.value = "";
                    return;
                }
            }

            resetActiveMapState();
            appState.currentMapId = rawData.mapId && !appState.isStandaloneMode ? rawData.mapId : `loaded-${Date.now()}`;
            appState.currentMapName = rawData.mapName || file.name.replace(/\.(json|hexmap)$/i, '') || "Imported Map";
            appState.currentMapEventLog = eventLogFromFile;
            appState.playerDiscoveredHexIds = new Set(explorationData.discoveredHexIds || []);
            appState.partyMarkerPosition = partyMarkerPositionFromFile;
            appState.activePartyActivities.clear();

            if (mapSettingsFromFile) {
                appState.currentMapHexSizeValue = parseFloat(mapSettingsFromFile.hexSizeValue) || CONST.DEFAULT_HEX_SIZE_VALUE;
                appState.currentMapHexSizeUnit = mapSettingsFromFile.hexSizeUnit || CONST.DEFAULT_HEX_SIZE_UNIT;
                appState.currentMapHexTraversalTimeValue = parseFloat(mapSettingsFromFile.hexTraversalTimeValue) || CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
                appState.currentMapHexTraversalTimeUnit = mapSettingsFromFile.hexTraversalTimeUnit || CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
                appState.zoomLevel = parseFloat(mapSettingsFromFile.zoomLevel) || 1.0;
                            appState.currentMapPartyMarkerImagePath = mapSettingsFromFile.partyMarkerImagePath || null; // <<< ADDED
            } else {
                 // Reset to defaults if not in file
                appState.currentMapHexSizeValue = CONST.DEFAULT_HEX_SIZE_VALUE;
                appState.currentMapHexSizeUnit = CONST.DEFAULT_HEX_SIZE_UNIT;
                appState.currentMapHexTraversalTimeValue = CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
                appState.currentMapHexTraversalTimeUnit = CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
                appState.zoomLevel = 1.0;
                            appState.currentMapPartyMarkerImagePath = null; // <<< ADDED DEFAULT
            }

  if (mapWeatherSystemFromFile && mapWeatherSystemFromFile.isWeatherEnabled) { // Check the flag
                appState.isWeatherEnabled = true;
                appState.mapWeatherSystem = {
                    ...getDefaultMapWeatherSystem(), // Start with defaults
                    ...mapWeatherSystemFromFile,     // Overlay loaded data
                    activeWeatherSystems: (mapWeatherSystemFromFile.activeWeatherSystems || []).map(sys => ({
                        ...sys,
                        hexesOccupied: new Set(sys.hexesOccupied || [])
                    })),
                    // Ensure sub-properties
                    windStrength: mapWeatherSystemFromFile.windStrength || getDefaultMapWeatherSystem().windStrength,
                    windDirection: mapWeatherSystemFromFile.windDirection || getDefaultMapWeatherSystem().windDirection,
                    availableWeatherTypes: Array.isArray(mapWeatherSystemFromFile.availableWeatherTypes) && mapWeatherSystemFromFile.availableWeatherTypes.length > 0
                                         ? mapWeatherSystemFromFile.availableWeatherTypes
                                         : getDefaultMapWeatherSystem().availableWeatherTypes,
                    weatherTypeWeights: typeof mapWeatherSystemFromFile.weatherTypeWeights === 'object' && Object.keys(mapWeatherSystemFromFile.weatherTypeWeights).length > 0
                                        ? mapWeatherSystemFromFile.weatherTypeWeights
                                        : getDefaultMapWeatherSystem().weatherTypeWeights,
                    weatherGrid: typeof mapWeatherSystemFromFile.weatherGrid === 'object'
                                 ? mapWeatherSystemFromFile.weatherGrid
                                 : {},
                };
            } else {
                appState.isWeatherEnabled = false;
                appState.mapWeatherSystem = getDefaultMapWeatherSystem();
            }



            initializeGridData(w, h, hexes, true);

                        if (appState.isWeatherEnabled) { // If weather was loaded and enabled
                 MapLogic.generateWeatherGrid(); // Populate grid based on loaded active systems or generate new if none
            }


            updatePartyMarkerBasedLoS();
            if (appState.partyMarkerPosition) {
                requestCenteringOnHex(appState.partyMarkerPosition.id);
            } else if (appState.mapInitialized) {
                 const firstHex = appState.hexDataMap.values().next().value;
                 if(firstHex) requestCenteringOnHex(firstHex.id);
            }
            renderApp();
            alert(`Map "${appState.currentMapName}" loaded from file.${appState.isStandaloneMode ? "" : " Remember to 'Save' the map to persist it on the server if this is a new map or you intend to overwrite."}`);

        } catch (err) {
            alert(`Error loading map file: ${err.message}`);
        } finally {
            if(event.target) event.target.value = "";
        }
    };
    reader.readAsText(file);
}

export function handleResetGrid() {
    if (!appState.isGM && !appState.isStandaloneMode) { alert("Operation not allowed."); return; }
    if (appState.mapInitialized && appState.currentMapName) {
        if (confirm(`This will reset the grid for the current map context ('${appState.currentMapName}') to a blank ${CONST.INITIAL_GRID_WIDTH}x${CONST.INITIAL_GRID_HEIGHT} grid, clear all hex data, clear shared exploration progress, and remove the party marker. The map name AND SCALE SETTINGS will be preserved. This action requires saving (or exporting if standalone) to take effect. Are you sure?`)) {
            const currentName = appState.currentMapName;
            const currentId = appState.currentMapId; // Preserve ID if it exists
            const { currentMapHexSizeValue, currentMapHexSizeUnit, currentMapHexTraversalTimeValue, currentMapHexTraversalTimeUnit, zoomLevel } = appState;

            resetActiveMapState();
            appState.currentMapName = currentName;
            appState.currentMapId = currentId; // Restore ID
            appState.currentMapHexSizeValue = currentMapHexSizeValue;
            appState.currentMapHexSizeUnit = currentMapHexSizeUnit;
            appState.currentMapHexTraversalTimeValue = currentMapHexTraversalTimeValue;
            appState.currentMapHexTraversalTimeUnit = currentMapHexTraversalTimeUnit;
            appState.zoomLevel = zoomLevel; // Preserve zoom
            appState.activePartyActivities.clear();

            initializeGridData(
                CONST.INITIAL_GRID_WIDTH,
                CONST.INITIAL_GRID_HEIGHT,
                [],
                true,
                CONST.INITIAL_ELEVATION,
                CONST.DEFAULT_TERRAIN_TYPE
            );
            appState.isCurrentMapDirty = true;

            const firstHex = appState.hexDataMap.values().next().value;
            if(firstHex) requestCenteringOnHex(firstHex.id);
            renderApp();
            alert(`Map '${appState.currentMapName}' has been reset locally. Click 'Save Current Map' (or export if standalone) to persist these changes.`);
        }
    } else {
        alert("No map currently loaded. This will create a new, blank map context with default scale settings.");
        handleCreateNewMap(appState.isStandaloneMode); // Pass standalone status
    }
}

export function handleResetExplorationAndMarker() {
    if (appState.isStandaloneMode) { alert("This operation is primarily for server-saved maps. In standalone, data is local until exported."); return; }
    if (!appState.isGM) {
        alert("Only GMs can reset exploration and party marker.");
        return;
    }
    if (!appState.currentMapId || !appState.mapInitialized) {
        alert("No active saved map is selected, or the map is not initialized. Cannot reset exploration and marker.");
        return;
    }
    if (confirm(`This will reset ALL shared exploration progress and the party marker position for the current map ('${appState.currentMapName}'). The hex grid data (terrain, elevation, features) and MAP SCALE SETTINGS will remain unchanged. This action requires saving to take effect. Are you sure?`)) {
        appState.playerDiscoveredHexIds = new Set();
        appState.partyMarkerPosition = null;
        appState.isCurrentMapDirty = true;

        updatePartyMarkerBasedLoS();
        renderApp();
        alert("Exploration data and party marker position have been reset locally for this map. Click 'Save Current Map' to persist these changes.");
    }
}

export function handleExportMapFile(isAutoSaveForStandalone = false) {
    if (!appState.mapInitialized) {
        if (!isAutoSaveForStandalone) alert("No map data to export.");
        return;
    }

    const mapStructurePayload = {
        gridSettings: { gridWidth: appState.currentGridWidth, gridHeight: appState.currentGridHeight },
        hexes: Array.from(appState.hexDataMap.values())
    };
    const contextDataForSave = getMapContextDataForSave(); // Uses current appState

    const exportData = {
        mapId: appState.currentMapId || `exported-${Date.now()}`, // Use current ID or generate one
        mapName: appState.currentMapName || "Exported Map",
        mapData: mapStructurePayload,
        explorationData: contextDataForSave.explorationData,
        partyMarkerPosition: contextDataForSave.partyMarkerPosition,
        eventLog: contextDataForSave.eventLog,
        mapSettings: contextDataForSave.mapSettings
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = (appState.currentMapName || "hexmap").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${fileName}.hexmap.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (!isAutoSaveForStandalone) {
        alert(`Map "${exportData.mapName}" has been prepared for download.`);
    }
}
