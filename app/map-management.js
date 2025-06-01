// File: app/map-management.js

import { appState, resetActiveMapState } from './state.js';
import * as CONST from './constants.js';
import { initializeGridData, updatePartyMarkerBasedLoS, getCalculatedScrollForHex } from './map-logic.js';
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

export function getMapContextDataForSave() {
    const markerPos = appState.partyMarkerPosition;

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
            zoomLevel: appState.zoomLevel
        }
    };

    return dataToReturn;
}

export function handleSaveCurrentMap(eventOrIsAutoSave = false) {
    const isAutoSaveActual = (typeof eventOrIsAutoSave === 'boolean') ? eventOrIsAutoSave : false;

    if (!appState.isGM) {
        if (!isAutoSaveActual) alert("Only GMs can save maps."); 
        return;
    }
    if (!appState.mapInitialized && !appState.currentMapName) {
        if (!isAutoSaveActual) alert("No active map data to save. Please create or open a map first.");
        return;
    }
    if (!appState.currentMapId && isAutoSaveActual && (!appState.currentMapName || !appState.currentMapName.trim())) {
        console.warn("AHME: Auto-save skipped for new map without a name.");
        return;
    }

    let mapIdToSave = appState.currentMapId;
    let mapNameToSave = appState.currentMapName;

    if (!mapIdToSave && !isAutoSaveActual) {
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
    proceedWithSave(mapIdToSave, mapNameToSave, isAutoSaveActual);
}

function proceedWithSave(mapId, mapName, isAutoSaveFlag) {
    console.log(`%cAHME_IFRAME (GM ${appState.userId}): In proceedWithSave. MapID: ${mapId}, Name: ${mapName}, AutoSave: ${isAutoSaveFlag}. Sending 'saveMapData' to bridge.`, "color: magenta; font-weight:bold;");
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
        explorationData: null, 
        partyMarkerPosition: undefined, 
        eventLog: [], 
        mapSettings: null, 
        isAutoSave: isAutoSaveFlag 
    };

    if (contextDataForSave && contextDataForSave.explorationData) {
        finalPayload.explorationData = contextDataForSave.explorationData;
    } else {
        finalPayload.explorationData = { discoveredHexIds: [] };
    }

    if (contextDataForSave && contextDataForSave.hasOwnProperty('partyMarkerPosition')) {
        finalPayload.partyMarkerPosition = contextDataForSave.partyMarkerPosition;
    } else {
        finalPayload.partyMarkerPosition = null; 
    }

    if (contextDataForSave && Array.isArray(contextDataForSave.eventLog)) {
        finalPayload.eventLog = contextDataForSave.eventLog;
    }

    if (contextDataForSave && contextDataForSave.mapSettings) {
        finalPayload.mapSettings = contextDataForSave.mapSettings;
    } else {
        finalPayload.mapSettings = { 
            hexSizeValue: CONST.DEFAULT_HEX_SIZE_VALUE,
            hexSizeUnit: CONST.DEFAULT_HEX_SIZE_UNIT,
            hexTraversalTimeValue: CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE,
            hexTraversalTimeUnit: CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT,
            zoomLevel: 1.0
        };
    }
    
    window.parent.postMessage({
        type: 'saveMapData',
        payload: finalPayload, 
        moduleId: APP_MODULE_ID
    }, '*');
}


export function handleSaveMapAs() {
    if (!appState.isGM || !appState.mapInitialized) {
        alert("No active map to 'Save As'. Please create or open a map first.");
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
            mapId: null, 
            mapName: finalNewMapName,
            mapData: mapStructurePayload,
            explorationData: null,
            partyMarkerPosition: undefined,
            eventLog: [], 
            mapSettings: null,
            isAutoSave: false 
        };
        if (contextDataForSave && contextDataForSave.explorationData) {
            finalPayload.explorationData = contextDataForSave.explorationData;
        } else {
            finalPayload.explorationData = { discoveredHexIds: [] };
        }
        if (contextDataForSave && contextDataForSave.hasOwnProperty('partyMarkerPosition')) {
            finalPayload.partyMarkerPosition = contextDataForSave.partyMarkerPosition;
        } else {
            finalPayload.partyMarkerPosition = null;
        }
        
        if (contextDataForSave && contextDataForSave.mapSettings) {
            finalPayload.mapSettings = contextDataForSave.mapSettings;
        } else {
            finalPayload.mapSettings = {
                hexSizeValue: CONST.DEFAULT_HEX_SIZE_VALUE,
                hexSizeUnit: CONST.DEFAULT_HEX_SIZE_UNIT,
                hexTraversalTimeValue: CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE,
                hexTraversalTimeUnit: CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT,
                zoomLevel: 1.0
            };
        }

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




export function handleCreateNewMap(silent = false) {
    if (!appState.isGM) { alert("Only GMs can create maps."); return; }

    if (appState.isCurrentMapDirty && appState.currentMapId && !silent) {
        if (!window.confirm("You have unsaved changes on the current map. Create a new map anyway? Unsaved changes will be lost.")) {
            return;
        }
    }

    appState.isWaitingForFormInput = true;
    appState.formInputCallback = function(formDataFromDialog) {
        appState.isWaitingForFormInput = false; appState.formInputCallback = null;
        if (!formDataFromDialog || formDataFromDialog.cancelled || !formDataFromDialog.mapName || formDataFromDialog.mapName.trim() === "") {
            renderApp(); 
            return;
        }
        const finalMapName = formDataFromDialog.mapName.trim();
        const gridWidth = parseInt(formDataFromDialog.gridWidth, 10) || CONST.INITIAL_GRID_WIDTH;
        const gridHeight = parseInt(formDataFromDialog.gridHeight, 10) || CONST.INITIAL_GRID_HEIGHT;
        const rawDefaultElevation = parseFloat(formDataFromDialog.defaultElevation);
        const defaultElevation = !isNaN(rawDefaultElevation) ? rawDefaultElevation : CONST.INITIAL_ELEVATION;
        const defaultTerrainType = formDataFromDialog.defaultTerrainType || CONST.DEFAULT_TERRAIN_TYPE;


        resetActiveMapState();

        appState.currentMapId = null;
        appState.currentMapName = finalMapName;

        appState.currentMapHexSizeValue = parseFloat(formDataFromDialog.hexSizeValue) || CONST.DEFAULT_HEX_SIZE_VALUE;
        appState.currentMapHexSizeUnit = formDataFromDialog.hexSizeUnit || CONST.DEFAULT_HEX_SIZE_UNIT;
        appState.currentMapHexTraversalTimeValue = parseFloat(formDataFromDialog.hexTraversalTimeValue) || CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
        appState.currentMapHexTraversalTimeUnit = formDataFromDialog.hexTraversalTimeUnit || CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;


        appState.isCurrentMapDirty = true; 

        if (appState.isGM) {
            window.parent.postMessage({ type: 'gmSetActiveMap', payload: { mapId: null }, moduleId: APP_MODULE_ID }, '*');
            appState.activeGmMapId = null;
        }

        initializeGridData(gridWidth, gridHeight, [], true, defaultElevation, defaultTerrainType);
        
        if (appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition) { 
            appState.centerViewOnHexAfterRender = appState.partyMarkerPosition.id;
        } else {
            const firstHex = appState.hexDataMap.values().next().value;
            if(firstHex) appState.centerViewOnHexAfterRender = firstHex.id;
        }
        renderApp(); 
    };

    const formPayload = {
        title: "Create New Map",
        fields: [
            { name: "mapName", label: "Map Name:", type: "text", default: `New Hex Map ${appState.mapList.length + 1}` },
            { name: "gridWidth", label: "Grid Width:", type: "number", default: CONST.INITIAL_GRID_WIDTH, min: CONST.MIN_GRID_DIMENSION, max: CONST.MAX_GRID_DIMENSION, step: 1 },
            { name: "gridHeight", label: "Grid Height:", type: "number", default: CONST.INITIAL_GRID_HEIGHT, min: CONST.MIN_GRID_DIMENSION, max: CONST.MAX_GRID_DIMENSION, step: 1 },
            { name: "defaultElevation", label: "Default Hex Elevation (m):", type: "number", default: CONST.INITIAL_ELEVATION, min: CONST.MIN_ELEVATION, max: CONST.MAX_ELEVATION, step: 10 },
            { name: "defaultTerrainType", label: "Default Hex Terrain:", type: "select", default: CONST.DEFAULT_TERRAIN_TYPE, options: Object.entries(CONST.TERRAIN_TYPES_CONFIG).map(([key, conf]) => ({value: key, label: `${conf.name} (${conf.symbol})`})) },
            { name: "hexSizeValue", label: "Hex Size Value:", type: "number", default: CONST.DEFAULT_HEX_SIZE_VALUE, min: 0.01, step: 0.01 },
            { name: "hexSizeUnit", label: "Hex Size Unit:", type: "select", default: CONST.DEFAULT_HEX_SIZE_UNIT, options: CONST.DISTANCE_UNITS.map(u => ({value: u.key, label: u.label})) },
            { name: "hexTraversalTimeValue", label: "Traversal Time:", type: "number", default: CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE, min: 0.01, step: 0.01 },
            { name: "hexTraversalTimeUnit", label: "Traversal Unit:", type: "select", default: CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT, options: CONST.TIME_UNITS.map(u => ({value: u.key, label: u.label})) },
        ],
        dialogWidth: 500
    };
    window.parent.postMessage({
        type: 'requestFormInput',
        payload: formPayload,
        moduleId: APP_MODULE_ID
    }, '*');
}


export function handleOpenMap(mapIdToOpen, isAutomaticOpen = false) {
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
            let hexes, gridSettings, explorationData, partyMarkerPositionFromFile, mapSettingsFromFile, eventLogFromFile; 

            if (rawData && 'mapData' in rawData && 'gridSettings' in rawData.mapData && 'hexes' in rawData.mapData) {
                gridSettings = rawData.mapData.gridSettings;
                hexes = rawData.mapData.hexes;
                explorationData = rawData.explorationData || { discoveredHexIds: [] };
                partyMarkerPositionFromFile = rawData.partyMarkerPosition !== undefined ? rawData.partyMarkerPosition : null;
                eventLogFromFile = rawData.eventLog || []; 
                mapSettingsFromFile = rawData.mapSettings;
            }
            else if (rawData && 'gridSettings' in rawData && 'hexes' in rawData) {
                gridSettings = rawData.gridSettings;
                hexes = rawData.hexes;
                explorationData = rawData.exploration || { discoveredHexIds: [] }; 
                partyMarkerPositionFromFile = rawData.partyMarkerPosition !== undefined ? rawData.partyMarkerPosition : null;
                eventLogFromFile = rawData.eventLog || []; 
                mapSettingsFromFile = rawData.mapSettings;
            }
            else if (Array.isArray(rawData)) {
                hexes = rawData;
                let maxX = 0, maxY = 0;
                hexes.forEach(h => {
                    if (h.col > maxX) maxX = h.col;
                    if (h.row > maxY) maxY = h.row;
                });
                gridSettings = { gridWidth: maxX + 1, gridHeight: maxY + 1 };
                explorationData = { discoveredHexIds: [] }; 
                partyMarkerPositionFromFile = null; 
                eventLogFromFile = []; 
                mapSettingsFromFile = null; 
            } else {
                throw new Error("Invalid or unrecognized map file format. Could not find expected data structure.");
            }

            const w = Math.max(CONST.MIN_GRID_DIMENSION, Math.min(CONST.MAX_GRID_DIMENSION, gridSettings.gridWidth || CONST.INITIAL_GRID_WIDTH));
            const h = Math.max(CONST.MIN_GRID_DIMENSION, Math.min(CONST.MAX_GRID_DIMENSION, gridSettings.gridHeight || CONST.INITIAL_GRID_HEIGHT));

            if (appState.isCurrentMapDirty && appState.currentMapId) {
                if (!confirm("Loading this map file will replace any unsaved changes on the current map. Continue?")) {
                    if(event.target) event.target.value = ""; 
                    return;
                }
            }

            resetActiveMapState();
            appState.currentMapId = null; 
            appState.currentMapName = file.name.replace(/\.(json|hexmap)$/i, '') || "Imported Map";
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
            } else {
            }

            initializeGridData(w, h, hexes, true); 
            updatePartyMarkerBasedLoS();
             if (appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition) {
                appState.centerViewOnHexAfterRender = appState.partyMarkerPosition.id;
            } else if (appState.mapInitialized) {
                 const firstHex = appState.hexDataMap.values().next().value;
                 if(firstHex) appState.centerViewOnHexAfterRender = firstHex.id;
            }
            renderApp();
            alert(`Map "${appState.currentMapName}" loaded from file. Remember to 'Save' the map to persist it on the server.`);

        } catch (err) {
            alert(`Error loading map file: ${err.message}`);
            console.error("AHME: Error loading map file:", err);
        } finally {
            if(event.target) event.target.value = ""; 
        }
    };
    reader.readAsText(file);
}

export function handleResetGrid() {
    if (!appState.isGM) { alert("Only GMs can reset the map grid."); return; }
    if (appState.mapInitialized && appState.currentMapName) {
        if (confirm(`This will reset the grid for the current map context ('${appState.currentMapName}') to a blank ${CONST.INITIAL_GRID_WIDTH}x${CONST.INITIAL_GRID_HEIGHT} grid, clear all hex data, clear shared exploration progress, and remove the party marker. The map name AND SCALE SETTINGS will be preserved. This action requires saving to take effect. Are you sure?`)) {
            const currentName = appState.currentMapName;
            const currentId = appState.currentMapId;
            const { currentMapHexSizeValue, currentMapHexSizeUnit, currentMapHexTraversalTimeValue, currentMapHexTraversalTimeUnit } = appState;

            resetActiveMapState();
            appState.currentMapName = currentName;
            appState.currentMapId = currentId;
            appState.currentMapHexSizeValue = currentMapHexSizeValue;
            appState.currentMapHexSizeUnit = currentMapHexSizeUnit;
            appState.currentMapHexTraversalTimeValue = currentMapHexTraversalTimeValue;
            appState.currentMapHexTraversalTimeUnit = currentMapHexTraversalTimeUnit;
            appState.zoomLevel = 1.0;
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
            if(firstHex) appState.centerViewOnHexAfterRender = firstHex.id;
            renderApp();
            alert(`Map '${appState.currentMapName}' has been reset locally. Click 'Save Current Map' to persist these changes.`);
        }
    } else {
        alert("No map currently loaded. This will create a new, blank map context with default scale settings.");
        handleCreateNewMap(true); 
    }
}

export function handleResetExplorationAndMarker() {
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