// app/app.js
import { appState, resetActiveMapState } from './state.js';
import * as CONST from './constants.js';
import { compileTemplates, renderApp } from './ui.js';
import * as MapLogic from './map-logic.js';
import * as MapManagement from './map-management.js'; 
import * as HexplorationLogic from './hexploration-logic.js';



const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');
            const clientTypeForLog = appState.isGM ? "GM" : "PLAYER";


window.addEventListener('message', (event) => {
    const { type, payload, moduleId: msgModuleId } = event.data || {};
    if (!type || msgModuleId !== APP_MODULE_ID) return;
    

    switch(type) {
        case 'initialData':
            if (payload) {
                appState.mapList = payload.mapList || [];
                appState.activeGmMapId = payload.activeGmMapId || null;
                // console.log(`APP_MAIN (${clientTypeForLog}): Processed 'initialData'. Maps: ${appState.mapList.length}, ActiveGMMap: ${appState.activeGmMapId}`);
                
                if (!appState.isGM && appState.activeGmMapId) {
                    // Player client: auto-open the GM's active map
                    // console.log(`APP_MAIN (PLAYER): Auto-opening active GM map: ${appState.activeGmMapId}`);
                    MapManagement.handleOpenMap(appState.activeGmMapId, true);
                } else if (appState.isGM && appState.activeGmMapId && appState.mapList.find(m => m.id === appState.activeGmMapId)) {
                    // GM client: auto-open their last active map if it exists in the list
                    // console.log(`APP_MAIN (GM): Auto-opening last active map: ${appState.activeGmMapId}`);
                    MapManagement.handleOpenMap(appState.activeGmMapId, true);
                } else {
                    // No specific map to auto-open, or player with no active GM map
                    resetActiveMapState(); // Ensure clean state
                    renderApp();
                }
            } else { 
                console.warn(`APP_MAIN (${clientTypeForLog}): 'initialData' no payload.`); 
                renderApp(); 
            }
            break;

        case 'mapDataLoaded':
            if (payload && payload.mapId && Array.isArray(payload.hexes)) {
                // 1. Reset relevant parts of the active map state before loading new data.
                //    Don't do a full reset if we want to preserve things like viewMode,
                //    but map-specific things should be cleared.
                //    resetActiveMapState() clears hexGridData, hexDataMap, LoS states, partyMarkerPosition, eventLog, etc.
                resetActiveMapState(); // Clears previous map's event log from appState too.

                // 2. Update basic map identifiers in appState
                appState.currentMapId = payload.mapId;
                appState.currentMapName = payload.name || "Unnamed Map";
                appState.isCurrentMapDirty = false; // Freshly loaded map is not dirty

                // 3. Load exploration-related data (discovered hexes, party marker, EVENT LOG)
                //    This function will populate appState.playerDiscoveredHexIds, 
                //    appState.partyMarkerPosition, and appState.currentMapEventLog
                MapManagement.loadGlobalExplorationForMap(payload); 
                
                // --- Verification Log (especially for player client) ---
                console.log(`APP_MAIN (${clientTypeForLog}): After loadGlobalExplorationForMap for '${appState.currentMapName}':`);
                console.log(`  - Party Marker:`, appState.partyMarkerPosition ? JSON.parse(JSON.stringify(appState.partyMarkerPosition)) : null);
                console.log(`  - Discovered Hexes: ${appState.playerDiscoveredHexIds.size}`);
                console.log(`  - Event Log Entries: ${appState.currentMapEventLog?.length || 0}`);
                if (appState.currentMapEventLog?.length > 0) {
                    // console.log(`  - First Event Log:`, JSON.parse(JSON.stringify(appState.currentMapEventLog[0])));
                }
                // --- End Verification Log ---

                // 4. Initialize grid data (hexes, dimensions)
                const gridSettings = payload.gridSettings || { 
                    gridWidth: CONST.INITIAL_GRID_WIDTH, 
                    gridHeight: CONST.INITIAL_GRID_HEIGHT 
                };
                MapLogic.initializeGridData(
                    gridSettings.gridWidth, 
                    gridSettings.gridHeight, 
                    payload.hexes, 
                    false // false because map is loaded, not new/unsaved from client perspective
                );
                // Note: initializeGridData calls updatePartyMarkerBasedLoS internally which might trigger
                // onDiscover encounter checks if the loaded party position reveals new hexes.

                // 5. If GM, ensure this map is set as the active one in Foundry world settings
                if (appState.isGM) {
                    // console.log(`APP_MAIN (GM): Map '${appState.currentMapName}' (ID: ${appState.currentMapId}) fully loaded. Setting as active GM map.`);
                    if (appState.activeGmMapId !== appState.currentMapId) {
                        window.parent.postMessage({ 
                            type: 'gmSetActiveMap', 
                            payload: { mapId: appState.currentMapId }, 
                            moduleId: APP_MODULE_ID 
                        }, '*');
                        appState.activeGmMapId = appState.currentMapId; // Update local GM state too
                    }
                }
                
                // 6. Render the application with the new map data
                console.log(`APP_MAIN (${clientTypeForLog}): Map '${appState.currentMapName}' processed. Rendering app.`);
                renderApp();

            } else { 
                console.error(`APP_MAIN (${clientTypeForLog}): Invalid or incomplete 'mapDataLoaded' payload:`, payload);
                alert("Error: Received incomplete map data from server.");
                resetActiveMapState(); // Clear any partial state
                renderApp(); 
            }
            break;

        // ... (mapLoadFailed, mapListUpdated, mapNameInputResponse, featureDetailsInputResponse, activeMapChanged, hexplorationDataUpdated cases) ...
        // Ensure these other cases are also robust and use clientTypeForLog for their console messages if helpful.
        // For mapNameInputResponse, the refined logic from previous steps should be used.
        case 'mapLoadFailed':
            alert(`Failed to load map: ${payload?.mapId||''} - ${payload?.error||'Unknown'}`);
            resetActiveMapState();
            renderApp();
            break;

        case 'mapListUpdated':
            if (payload && payload.mapList) {
                appState.mapList = payload.mapList;
                if (payload.savedMapId) { 
                    appState.currentMapId = payload.savedMapId; 
                    const savedMapInfo = appState.mapList.find(m => m.id === payload.savedMapId);
                    if(savedMapInfo) appState.currentMapName = savedMapInfo.name;
                    appState.isCurrentMapDirty = false; 
                }
                if (payload.deletedMapId && appState.currentMapId === payload.deletedMapId) {
                    resetActiveMapState(); // Full reset if current map deleted
                    appState.currentMapId = null; 
                    appState.currentMapName = null;
                }
                if (payload.newActiveGmMapId !== undefined) { // Trust activeGmMapId from bridge after save/delete
                     appState.activeGmMapId = payload.newActiveGmMapId;
                }
                // console.log(`APP_MAIN (${clientTypeForLog}): Map list updated. CurrentMapId: ${appState.currentMapId}, ActiveGMMapId: ${appState.activeGmMapId}`);
                renderApp();
            } break;

        case 'mapNameInputResponse': 
            // console.log(`%cAPP_MAIN (${clientTypeForLog}): Received 'mapNameInputResponse'. Raw Payload:`, "color: blue; font-weight:bold;", JSON.parse(JSON.stringify(payload || {})));
            if (appState.isWaitingForMapName && typeof appState.mapNamePromptCallback === 'function') {
                // console.log(`APP_MAIN (${clientTypeForLog}): 'mapNameInputResponse' - Calling appState.mapNamePromptCallback.`);
                appState.mapNamePromptCallback(payload); 
            } else { 
                // console.warn(`APP_MAIN (${clientTypeForLog}): 'mapNameInputResponse' received, but not waiting or no callback set.`);
                appState.isWaitingForMapName = false; 
                appState.mapNamePromptCallback = null;
            }
            break;
        
        case 'featureDetailsInputResponse':
            // console.log(`%cAPP_MAIN (${clientTypeForLog}): Received 'featureDetailsInputResponse'. Payload:`, "color: green; font-weight:bold;", JSON.parse(JSON.stringify(payload || {})));
            if (appState.isWaitingForFeatureDetails && typeof appState.featureDetailsCallback === 'function') {
                if (appState.pendingFeaturePlacement && payload && appState.pendingFeaturePlacement.hexId === payload.hexId) {
                    appState.featureDetailsCallback(payload);
                } else {
                    // console.warn("APP_MAIN: HexID mismatch or pendingPlacement/payload missing for featureDetailsInputResponse.");
                    appState.isWaitingForFeatureDetails = false; appState.featureDetailsCallback = null; appState.pendingFeaturePlacement = null;
                    renderApp(); 
                }
            } else { 
                // console.warn("APP_MAIN: 'featureDetailsInputResponse' unexpected or no callback.");
                appState.isWaitingForFeatureDetails = false; appState.featureDetailsCallback = null; appState.pendingFeaturePlacement = null;
                renderApp(); 
            }
            break;

   case 'activeMapChanged': 
            const newActiveGmMapIdFromPayload = payload.activeGmMapId;
            console.log(`APP_MAIN (${clientTypeForLog}): Received 'activeMapChanged'. New activeGMMapId from payload: ${newActiveGmMapIdFromPayload}. Current local activeGmMapId: ${appState.activeGmMapId}, Current open mapId: ${appState.currentMapId}`);

            if (!appState.isGM) { // Player client logic
                if (newActiveGmMapIdFromPayload) {
                    // If the new active map ID is different from what player currently has open OR
                    // if it's the SAME map ID (meaning data for the current map was updated by GM)
                    if (appState.currentMapId !== newActiveGmMapIdFromPayload || 
                        (appState.currentMapId === newActiveGmMapIdFromPayload && appState.activeGmMapId !== newActiveGmMapIdFromPayload) ||
                        (appState.currentMapId === newActiveGmMapIdFromPayload) // Force reload if it's the same map
                        ) {
                        console.log(`APP_MAIN (PLAYER): GM's active map is now '${newActiveGmMapIdFromPayload}'. Requesting map load/refresh.`);
                        appState.activeGmMapId = newActiveGmMapIdFromPayload; // Update tracked active GM map
                        MapManagement.handleOpenMap(newActiveGmMapIdFromPayload, true); // Force re-open/refresh
                    } else {
                        // console.log(`APP_MAIN (PLAYER): Received activeMapChanged for the already active and loaded map ID '${newActiveGmMapIdFromPayload}'. No forced reload, assuming local state is fine unless other signals come.`);
                        // This branch might be hit if the GM toggles active map off then on to the same map quickly.
                        // The key is that the bridge's onChange by setting to null then back to ID should ensure this triggers a fresh load.
                         appState.activeGmMapId = newActiveGmMapIdFromPayload; // Still update this
                    }
                } else { // GM cleared the active map
                    console.log("APP_MAIN (PLAYER): GM cleared active map.");
                    if (appState.currentMapId || appState.currentMapName) { 
                        resetActiveMapState(); 
                        appState.currentMapId = null; 
                        appState.currentMapName = null;
                        appState.activeGmMapId = null; // Clear tracked active GM map
                        renderApp(); 
                    }
                }
            } else { // GM client logic
                // GM client just notes if another GM session changed the active map.
                if (appState.activeGmMapId !== newActiveGmMapIdFromPayload) {
                    console.log(`APP_MAIN (GM): Noted activeGMMapId changed by other source from '${appState.activeGmMapId}' to '${newActiveGmMapIdFromPayload}'.`);
                    appState.activeGmMapId = newActiveGmMapIdFromPayload;
                    // GM might want to automatically open this new active map if it's not what they have open.
                    // For now, just update state and re-render (map list might show active status).
                    renderApp(); 
                }
            }
            break;

        case 'hexplorationDataUpdated':
            if (payload) {
                // console.log(`APP_MAIN (${clientTypeForLog}): Hexploration data updated from bridge.`, payload);
                HexplorationLogic.updateLocalHexplorationDisplayValues(payload); 
                renderApp(); 
            }
            break;
    }
});

// ... (handleAppModeChange, start function, DOMContentLoaded listener)
export function handleAppModeChange(newMode) { MapLogic.handleAppModeChange(newMode); }

async function start() {
    const clientTypeForLog = appState.isGM ? "GM" : "PLAYER";
    // console.log(`APP_MAIN (${clientTypeForLog}): Start. UserID: ${appState.userId}`);
    appState.appMode = appState.isGM ? CONST.DEFAULT_APP_MODE : CONST.AppMode.PLAYER;
    const templatesReady = await compileTemplates();
    if (!templatesReady) { console.error(`APP_MAIN (${clientTypeForLog}): Halting: template compile failure.`); return; }
    // console.log(`APP_MAIN (${clientTypeForLog}): Templates compiled.`);
    if (window.parent && APP_MODULE_ID) {
        // console.log(`APP_MAIN (${clientTypeForLog}): Sending jsAppReady.`);
        window.parent.postMessage({ type: 'jsAppReady', moduleId: APP_MODULE_ID }, '*');
    } else { 
        console.warn(`APP_MAIN (${clientTypeForLog}): Standalone mode.`); 
        resetActiveMapState(); renderApp(); 
    }
    // console.log(`APP_MAIN (${clientTypeForLog}): Start function finished.`);
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }