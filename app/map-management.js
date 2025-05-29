// advanced-hex-map-editor/app/map-management.js
import { appState, resetActiveMapState } from './state.js';
import * as CONST from './constants.js';
import { initializeGridData, updatePartyMarkerBasedLoS } from './map-logic.js'; 
import { renderApp } from './ui.js';

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');


export function loadGlobalExplorationForMap(mapDataFromBridge) {
    const clientType = appState.isGM ? "GM" : "PLAYER";
    console.log(`MAP_MGMT (${clientType} CLIENT - User: ${appState.userId}): loadGlobalExplorationForMap called. Raw mapDataFromBridge.eventLog exists: ${mapDataFromBridge && mapDataFromBridge.hasOwnProperty('eventLog')}, IsArray: ${Array.isArray(mapDataFromBridge?.eventLog)}`);
    if (mapDataFromBridge && mapDataFromBridge.hasOwnProperty('eventLog')) {
        console.log(`MAP_MGMT (${clientType} CLIENT): mapDataFromBridge.eventLog (first 2):`, JSON.stringify(mapDataFromBridge.eventLog?.slice(0,2)));
    }


    if (mapDataFromBridge && mapDataFromBridge.exploration && Array.isArray(mapDataFromBridge.exploration.discoveredHexIds)) {
        appState.playerDiscoveredHexIds = new Set(mapDataFromBridge.exploration.discoveredHexIds);
    } else {
        appState.playerDiscoveredHexIds = new Set();
    }
    
    if (mapDataFromBridge && mapDataFromBridge.partyMarkerPosition && mapDataFromBridge.partyMarkerPosition.id && 
        typeof mapDataFromBridge.partyMarkerPosition.col === 'number' && 
        typeof mapDataFromBridge.partyMarkerPosition.row === 'number') {
        appState.partyMarkerPosition = { ...mapDataFromBridge.partyMarkerPosition }; 
        // console.log(`MAP_MGMT (${clientType} CLIENT): Set appState.partyMarkerPosition FROM BRIDGE DATA to:`, JSON.parse(JSON.stringify(appState.partyMarkerPosition)));
    } else {
        appState.partyMarkerPosition = null;
        // console.log(`MAP_MGMT (${clientType} CLIENT): Cleared appState.partyMarkerPosition (no valid marker data from bridge).`);
    }
    
    // Load Event Log
    if (mapDataFromBridge && Array.isArray(mapDataFromBridge.eventLog)) {
        appState.currentMapEventLog = mapDataFromBridge.eventLog;
        console.log(`MAP_MGMT (${clientType} CLIENT): Event log successfully populated from mapDataFromBridge. Entries: ${appState.currentMapEventLog.length}`);
    } else {
        appState.currentMapEventLog = []; 
        console.warn(`MAP_MGMT (${clientType} CLIENT): Event log NOT populated from mapDataFromBridge or was not an array. mapDataFromBridge.eventLog was:`, mapDataFromBridge?.eventLog);
    }
    
    // This log was here before, it will now reflect the outcome of the if/else above
    // console.log(`MAP_MGMT (${clientType} CLIENT - User: ${appState.userId}): Event log loaded. Entries: ${appState.currentMapEventLog.length}. First entry (if any):`, 
    //     appState.currentMapEventLog.length > 0 ? JSON.parse(JSON.stringify(appState.currentMapEventLog[0])) : "N/A");
}

export function getMapContextDataForSave() {
    const markerPos = appState.partyMarkerPosition;
    // --- Enhanced Logging for Party Marker ---
    console.log(`MAP_MGMT: getMapContextDataForSave - Current appState.partyMarkerPosition AT START OF FUNCTION:`, JSON.parse(JSON.stringify(markerPos || null)));
    
    const dataToReturn = {
        explorationData: {
            discoveredHexIds: Array.from(appState.playerDiscoveredHexIds)
        },
        // Ensure we save a clean representation of the marker position
        partyMarkerPosition: markerPos ? 
            { 
                id: markerPos.id, 
                col: markerPos.col, 
                row: markerPos.row,
                // Include q, r, s if they are consistently part of your marker object and needed on load
                q: markerPos.q, 
                r: markerPos.r, 
                s: markerPos.s 
            } : null
            ,
                    eventLog: appState.currentMapEventLog || [] // Add event log
    };
    
    console.log(`MAP_MGMT: getMapContextDataForSave - Data object being returned for save:`, JSON.parse(JSON.stringify(dataToReturn))); 
    // --- End Enhanced Logging ---
    return dataToReturn;
}

export function handleSaveCurrentMap(isAutoSave = false) {
    console.log(`%cMAP_MGMT: handleSaveCurrentMap CALLED. AutoSave: ${isAutoSave}`, "color: darkred; font-weight:bold; font-size: 14px;");

    if (!appState.isGM) { 
        if (!isAutoSave) alert("Only GMs can save maps."); 
        console.warn("MAP_MGMT: Save attempt by non-GM.");
        return; 
    }
    if (!appState.mapInitialized && !appState.currentMapName) { 
        if (!isAutoSave) alert("No active map data to save. Please create or open a map first."); 
        console.warn("MAP_MGMT: Save attempt with no active map data (map not initialized and no currentMapName).");
        return; 
    }
     if (!appState.mapInitialized && appState.currentMapName && !appState.currentMapId && isAutoSave) {
        console.warn("MAP_MGMT: Auto-save attempt for a new, uninitialized (no grid data yet) map context. Aborting auto-save. GM should make an edit or save manually first.");
        return;
    }
    
    let mapIdToSave = appState.currentMapId;
    let mapNameToSave = appState.currentMapName;

    if (!mapIdToSave && !isAutoSave) { 
        console.log("MAP_MGMT: Prompting for name for new map (manual save). Current default name:", mapNameToSave);
        // Replaced prompt with request to Foundry bridge
        appState.isWaitingForMapName = true;
        appState.mapNamePromptCallback = function(nameFromDialog) {
            appState.isWaitingForMapName = false;
            appState.mapNamePromptCallback = null;
            if (!nameFromDialog || !nameFromDialog.trim()) {
                alert("Map name cannot be empty for the first save.");
                console.log("MAP_MGMT: Save cancelled - no name entered for new map.");
                return;
            }
            appState.currentMapName = nameFromDialog.trim();
            proceedWithSave(null, appState.currentMapName); // Proceed with save using new name
        };
        window.parent.postMessage({ 
            type: 'requestMapNameInput', 
            payload: { title: "Save New Map", label: "Enter name for this new map:", defaultName: mapNameToSave || `New Hex Map ${appState.mapList.length + 1}` },
            moduleId: APP_MODULE_ID 
        }, '*');
        return; // Wait for callback
    } else if (!mapIdToSave && isAutoSave) {
        if (!appState.currentMapName || !appState.currentMapName.trim()) {
            console.warn("MAP_MGMT: Auto-save triggered for a new map without a valid name. Save aborted. GM should save manually first.");
            return;
        }
        console.log(`MAP_MGMT: Auto-saving new map with current name: '${appState.currentMapName}'`);
        mapNameToSave = appState.currentMapName; 
    }
    
    proceedWithSave(mapIdToSave, mapNameToSave); // For existing maps or auto-save of new map with name
}

function proceedWithSave(mapId, mapName) {
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
        eventLog: [] // Default to empty array
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

    if (contextDataForSave && Array.isArray(contextDataForSave.eventLog)) { // MODIFIED
        finalPayload.eventLog = contextDataForSave.eventLog;
    }
    
    console.log("MAP_MGMT: proceedWithSave - Final payload (with eventLog):", JSON.parse(JSON.stringify(finalPayload)));

    window.parent.postMessage({ 
        type: 'saveMapData', 
        payload: finalPayload, 
        moduleId: APP_MODULE_ID 
    }, '*');
}


export function handleSaveMapAs() {
    console.log("%cMAP_MGMT: handleSaveMapAs CALLED.", "color: darkred; font-weight:bold; font-size: 14px;");
    if (!appState.isGM || !appState.mapInitialized) { 
        alert("No active map to 'Save As'. Please create or open a map first."); 
        return; 
    }
    
    appState.isWaitingForMapName = true;
    appState.mapNamePromptCallback = function(newMapNameFromDialog) {
        appState.isWaitingForMapName = false;
        appState.mapNamePromptCallback = null;
        if (!newMapNameFromDialog || !newMapNameFromDialog.trim()) {
            alert("New map name for 'Save As' cannot be empty.");
            return;
        }
        const finalNewMapName = newMapNameFromDialog.trim();
        console.log(`MAP_MGMT: Requesting 'Save As' for map: '${finalNewMapName}'`);

        const mapStructurePayload = { 
            gridSettings: { gridWidth: appState.currentGridWidth, gridHeight: appState.currentGridHeight }, 
            hexes: Array.from(appState.hexDataMap.values()) 
        };
        
        console.log("MAP_MGMT: handleSaveMapAs (callback) - About to call getMapContextDataForSave(). Current marker in state:", JSON.parse(JSON.stringify(appState.partyMarkerPosition || null)));
        const contextDataForSave = getMapContextDataForSave(); 
        console.log("MAP_MGMT: handleSaveMapAs (callback) - contextDataForSave:", JSON.parse(JSON.stringify(contextDataForSave)));

        const finalPayload = { 
            mapId: null, // Critical for 'Save As' to generate a new ID in the bridge
            mapName: finalNewMapName, 
            mapData: mapStructurePayload, 
            explorationData: null,
            partyMarkerPosition: undefined
        };
        if (contextDataForSave && contextDataForSave.explorationData) {
            finalPayload.explorationData = contextDataForSave.explorationData;
        } else {
            finalPayload.explorationData = { discoveredHexIds: [] };
            console.warn("MAP_MGMT: handleSaveMapAs - contextDataForSave missing explorationData.");
        }
        if (contextDataForSave && contextDataForSave.hasOwnProperty('partyMarkerPosition')) {
            finalPayload.partyMarkerPosition = contextDataForSave.partyMarkerPosition;
        } else {
            finalPayload.partyMarkerPosition = null;
            console.warn("MAP_MGMT: handleSaveMapAs - contextDataForSave missing partyMarkerPosition key.");
        }
        
        console.log("MAP_MGMT: handleSaveMapAs (callback) - Final payload being sent:", JSON.parse(JSON.stringify(finalPayload)));

        window.parent.postMessage({ 
            type: 'saveMapData', 
            payload: finalPayload, 
            moduleId: APP_MODULE_ID 
        }, '*');
    };

    window.parent.postMessage({ 
        type: 'requestMapNameInput', 
        payload: { 
            title: "Save Map As...", 
            label: "Enter new name for this map copy:", 
            defaultName: `${appState.currentMapName || 'Unnamed Map'} (Copy)` 
        },
        moduleId: APP_MODULE_ID 
    }, '*');
}


export function handleCreateNewMap(silent = false) {
    console.log(`%cMAP_MGMT: handleCreateNewMap called. Silent: ${silent}`, "color: orange; font-weight: bold;");
    if (!appState.isGM) { alert("Only GMs can create maps."); console.warn("MAP_MGMT: Non-GM create attempt."); return; }
    
    if (appState.isCurrentMapDirty && appState.currentMapId && !silent) { 
        if (!window.confirm("You have unsaved changes on the current map. Create a new map anyway? Unsaved changes will be lost.")) { 
            console.log("MAP_MGMT: Create new map cancelled (current map is dirty)."); 
            return; 
        }
    }
    
    appState.isWaitingForMapName = true;
    appState.mapNamePromptCallback = function(mapNameFromDialog) {
        console.log(`%cMAP_MGMT: mapNamePromptCallback for CreateNewMap executed. Received: '${mapNameFromDialog}'`, "color: green;");
        appState.isWaitingForMapName = false; appState.mapNamePromptCallback = null; 
        if (!mapNameFromDialog || mapNameFromDialog.trim() === "") { 
            console.log("MAP_MGMT: Create new map aborted (no name entered or cancelled)."); 
            renderApp(); // Re-render to clear any waiting UI state
            return; 
        }
        const finalMapName = mapNameFromDialog.trim();
        console.log(`MAP_MGMT: Creating new map: '${finalMapName}'`);
        resetActiveMapState(); 
        appState.currentMapId = null; 
        appState.currentMapName = finalMapName; 
        appState.isCurrentMapDirty = true; // A new map is dirty by default as it's unsaved
        
        if (appState.isGM) { 
            window.parent.postMessage({ type: 'gmSetActiveMap', payload: { mapId: null }, moduleId: APP_MODULE_ID }, '*'); 
            appState.activeGmMapId = null; 
        }
        
        initializeGridData(CONST.INITIAL_GRID_WIDTH, CONST.INITIAL_GRID_HEIGHT, [], true); // True for mapIsNewAndUnsaved
        renderApp(); 
    };
    
    console.log("MAP_MGMT: Requesting map name from parent for new map. Default: " + `New Hex Map ${appState.mapList.length + 1}`);
    window.parent.postMessage({ 
        type: 'requestMapNameInput', 
        payload: { 
            title: "Create New Map", 
            label: "Enter name for the new map:", 
            defaultName: `New Hex Map ${appState.mapList.length + 1}` 
        }, 
        moduleId: APP_MODULE_ID 
    }, '*');
}

export function handleOpenMap(mapIdToOpen, isAutomaticOpen = false) {
    if (!isAutomaticOpen && appState.isCurrentMapDirty && appState.currentMapId) { 
        if (!confirm("You have unsaved changes on the current map. Open another map anyway? Unsaved changes will be lost.")) { 
            console.log("MAP_MGMT: Open map cancelled (current map is dirty)."); return; 
        } 
    }
    console.log(`MAP_MGMT: Requesting load for map ID: ${mapIdToOpen}, Automatic: ${isAutomaticOpen}`);
    resetActiveMapState(); 
    appState.currentMapId = mapIdToOpen; 
    const mapListItem = appState.mapList.find(m => m.id === mapIdToOpen);
    appState.currentMapName = mapListItem ? mapListItem.name : "Loading map..."; 
    appState.mapInitialized = false; 
    renderApp(); // Show "Loading map..." message
    window.parent.postMessage({ type: 'requestMapLoad', payload: { mapId: mapIdToOpen }, moduleId: APP_MODULE_ID }, '*');
}

export function handleDeleteMap(mapIdToDelete, mapName) {
    if (!appState.isGM) { alert("Only GMs can delete maps."); return; }
    if (!confirm(`Are you sure you want to delete the map "${mapName || 'this map'}"? This action cannot be undone.`)) return;
    console.log(`MAP_MGMT: Requesting delete for map ID: ${mapIdToDelete}`);
    window.parent.postMessage({ type: 'deleteMap', payload: { mapId: mapIdToDelete }, moduleId: APP_MODULE_ID }, '*');
}

export function handleLoadMapFileSelected(event) {
    const file = event.target.files?.[0]; 
    if (!file) { console.log("MAP_MGMT: No file selected for loading."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawData = JSON.parse(e.target.result); 
            let hexes, gridSettings, explorationData, partyMarkerPositionFromFile; // Renamed to avoid conflict
            
            // Standard format check
            if (rawData && 'mapData' in rawData && 'gridSettings' in rawData.mapData && 'hexes' in rawData.mapData) {
                gridSettings = rawData.mapData.gridSettings;
                hexes = rawData.mapData.hexes;
                explorationData = rawData.explorationData || { discoveredHexIds: [] };
                partyMarkerPositionFromFile = rawData.partyMarkerPosition !== undefined ? rawData.partyMarkerPosition : null;
            } 
            // Older/Simpler format check (array of hexes, or object with hexes and gridSettings directly)
            else if (rawData && 'gridSettings' in rawData && 'hexes' in rawData) { 
                gridSettings = rawData.gridSettings;
                hexes = rawData.hexes;
                explorationData = rawData.exploration || { discoveredHexIds: [] }; // 'exploration' was old key
                partyMarkerPositionFromFile = rawData.partyMarkerPosition !== undefined ? rawData.partyMarkerPosition : null;
            } 
            // Simplest format: just an array of hexes
            else if (Array.isArray(rawData)) {
                hexes = rawData;
                let maxX = 0, maxY = 0;
                hexes.forEach(h => { 
                    if (h.col > maxX) maxX = h.col; 
                    if (h.row > maxY) maxY = h.row; 
                });
                gridSettings = { gridWidth: maxX + 1, gridHeight: maxY + 1 };
                explorationData = { discoveredHexIds: [] }; // No exploration in this format
                partyMarkerPositionFromFile = null; // No marker in this format
            } else {
                throw new Error("Invalid or unrecognized map file format. Could not find expected data structure.");
            }

            const w = Math.max(CONST.MIN_GRID_DIMENSION, Math.min(CONST.MAX_GRID_DIMENSION, gridSettings.gridWidth || CONST.INITIAL_GRID_WIDTH));
            const h = Math.max(CONST.MIN_GRID_DIMENSION, Math.min(CONST.MAX_GRID_DIMENSION, gridSettings.gridHeight || CONST.INITIAL_GRID_HEIGHT));
            
            if (appState.isCurrentMapDirty && appState.currentMapId) { 
                if (!confirm("Loading this map file will replace any unsaved changes on the current map. Continue?")) { 
                    if(event.target) event.target.value = ""; // Reset file input
                    return; 
                }
            }
            
            resetActiveMapState();
            appState.currentMapId = null; // Loaded from file, so no existing ID
            appState.currentMapName = file.name.replace(/\.(json|hexmap)$/i, '') || "Imported Map"; // Remove extension
            
            appState.playerDiscoveredHexIds = new Set(explorationData.discoveredHexIds || []);
            appState.partyMarkerPosition = partyMarkerPositionFromFile; // Set from file
            
            console.log(`MAP_MGMT: handleLoadMapFileSelected - Loaded partyMarkerPosition:`, JSON.parse(JSON.stringify(appState.partyMarkerPosition || null)));

            initializeGridData(w, h, hexes, true); // True for mapIsNewAndUnsaved (needs saving to server)
            renderApp();
            alert(`Map "${appState.currentMapName}" loaded from file. Remember to 'Save' the map to persist it on the server.`);

        } catch (err) { 
            console.error("MAP_MGMT: Error loading map file:", err);
            alert(`Error loading map file: ${err.message}`); 
        } finally { 
            if(event.target) event.target.value = ""; // Reset file input in all cases
        }
    }; 
    reader.readAsText(file); 
}

export function handleResetGrid() {
    if (!appState.isGM) { alert("Only GMs can reset the map grid."); return; }
    if (appState.mapInitialized && appState.currentMapName) {
        if (confirm(`This will reset the grid for the current map context ('${appState.currentMapName}') to a blank ${CONST.INITIAL_GRID_WIDTH}x${CONST.INITIAL_GRID_HEIGHT} grid, clear all hex data, clear shared exploration progress, and remove the party marker. The map name will be preserved. This action requires saving to take effect. Are you sure?`)) {
            const currentName = appState.currentMapName; 
            const currentId = appState.currentMapId; // Preserve ID if it's a saved map being reset    
            
            resetActiveMapState(); 
            appState.currentMapName = currentName; 
            appState.currentMapId = currentId;     
            // Exploration and marker are already reset by resetActiveMapState
            
            initializeGridData(CONST.INITIAL_GRID_WIDTH, CONST.INITIAL_GRID_HEIGHT, [], true); // True for mapIsNewAndUnsaved (or dirty)
            appState.isCurrentMapDirty = true; 
            renderApp();
            alert(`Map '${appState.currentMapName}' has been reset locally. Click 'Save Current Map' to persist these changes.`);
        }
    } else {
        // If no map is initialized, this essentially becomes "Create New Map" with default settings
        alert("No map currently loaded. This will create a new, blank map context.");
        handleCreateNewMap(true); // true for silent if we don't want double confirm
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
    if (confirm(`This will reset ALL shared exploration progress and the party marker position for the current map ('${appState.currentMapName}'). The hex grid data (terrain, elevation, features) will remain unchanged. This action requires saving to take effect. Are you sure?`)) {
        appState.playerDiscoveredHexIds = new Set(); 
        appState.partyMarkerPosition = null; 
        appState.isCurrentMapDirty = true; // Mark as dirty because exploration/marker changed
        
        updatePartyMarkerBasedLoS(); // This will also clear playerCurrentVisibleHexIds
        renderApp(); 
        alert("Exploration data and party marker position have been reset locally for this map. Click 'Save Current Map' to persist these changes.");
    }
}