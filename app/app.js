// File: app/app.js

import { appState, resetActiveMapState } from './state.js';
import * as CONST from './constants.js';
import { compileTemplates, renderApp } from './ui.js'; 
import * as MapLogic from './map-logic.js';
import * as MapManagement from './map-management.js';
import * as HexplorationLogic from './hexploration-logic.js';

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');

/**
 * Main message handler for communication with the parent window (Foundry bridge).
 */
window.addEventListener('message', (event) => {
    const { type, payload, moduleId: msgModuleId } = event.data || {};

    if (!type || msgModuleId !== APP_MODULE_ID) {
        // console.warn("AHME IFRAME: Ignoring message - no type or mismatched moduleId.", event.data);
        return;
    }

    // console.log(`AHME IFRAME: Received message: ${type}`, payload);

    switch(type) {
        case 'initialData':
            if (payload) {
                appState.mapList = payload.mapList || [];
                appState.activeGmMapId = payload.activeGmMapId || null;

                if (appState.activeGmMapId) {
                    MapManagement.handleOpenMap(appState.activeGmMapId, true); 
                } else {
                    resetActiveMapState();
                    renderApp();
                }
            } else {
                console.warn("AHME IFRAME: 'initialData' received with no payload.");
                resetActiveMapState(); 
                renderApp();
            }
            break;

        case 'mapDataLoaded': 
            if (payload && payload.mapId && Array.isArray(payload.hexes)) {
                resetActiveMapState(); 

                appState.currentMapId = payload.mapId;
                appState.currentMapName = payload.name || "Unnamed Map";
                appState.isCurrentMapDirty = false; 

                if (payload.mapSettings) {
                    appState.currentMapHexSizeValue = parseFloat(payload.mapSettings.hexSizeValue) || CONST.DEFAULT_HEX_SIZE_VALUE;
                    appState.currentMapHexSizeUnit = payload.mapSettings.hexSizeUnit || CONST.DEFAULT_HEX_SIZE_UNIT;
                    appState.currentMapHexTraversalTimeValue = parseFloat(payload.mapSettings.hexTraversalTimeValue) || CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
                    appState.currentMapHexTraversalTimeUnit = payload.mapSettings.hexTraversalTimeUnit || CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
                    appState.zoomLevel = parseFloat(payload.mapSettings.zoomLevel) || 1.0;
                } else {
                    appState.currentMapHexSizeValue = CONST.DEFAULT_HEX_SIZE_VALUE;
                    appState.currentMapHexSizeUnit = CONST.DEFAULT_HEX_SIZE_UNIT;
                    appState.currentMapHexTraversalTimeValue = CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
                    appState.currentMapHexTraversalTimeUnit = CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
                    appState.zoomLevel = 1.0;
                }

                MapManagement.loadGlobalExplorationForMap(payload);

                const gridSettings = payload.gridSettings || {
                    gridWidth: CONST.INITIAL_GRID_WIDTH, 
                    gridHeight: CONST.INITIAL_GRID_HEIGHT
                };
                MapLogic.initializeGridData(
                    gridSettings.gridWidth,
                    gridSettings.gridHeight,
                    payload.hexes,
                    false 
                );
                
                if (appState.isGM && appState.activeGmMapId !== appState.currentMapId) {
                     window.parent.postMessage({
                        type: 'gmSetActiveMap',
                        payload: { mapId: appState.currentMapId },
                        moduleId: APP_MODULE_ID
                    }, '*');
                }
                
                MapLogic.updatePartyMarkerBasedLoS(); 

                if (appState.partyMarkerPosition) {
                    appState.centerViewOnHexAfterRender = appState.partyMarkerPosition.id;
                } else if (appState.mapInitialized) {
                    const firstHex = appState.hexDataMap.values().next().value;
                    if(firstHex) appState.centerViewOnHexAfterRender = firstHex.id;
                }
                renderApp();

            } else {
                console.error("AHME IFRAME: 'mapDataLoaded' - Invalid payload.", payload);
                alert("Error: Received incomplete map data from the server.");
                resetActiveMapState();
                renderApp();
            }
            break;

        case 'mapLoadFailed':
            alert(`Failed to load map: ${payload?.mapId || 'Unknown ID'} - ${payload?.error || 'Unknown reason'}`);
            if (appState.currentMapId === payload?.mapId || (appState.currentMapName && appState.currentMapName.startsWith("Loading"))) {
                resetActiveMapState();
                appState.currentMapId = null;
                appState.currentMapName = null;
            }
            renderApp();
            break;

        case 'mapListUpdated': 
            if (payload && Array.isArray(payload.mapList)) {
                appState.mapList = payload.mapList;
                let needsFullRender = true;

                if (payload.savedMapId) { 
                    const savedMapInfo = appState.mapList.find(m => m.id === payload.savedMapId);
                    if (savedMapInfo) {
                        if (appState.isGM && 
                            (appState.currentMapId === payload.savedMapId || 
                             (appState.currentMapId === null && appState.currentMapName === savedMapInfo.name))) {
                            appState.currentMapId = savedMapInfo.id; 
                            appState.currentMapName = savedMapInfo.name; 
                            appState.isCurrentMapDirty = false;
                        }
                    }
                }

                if (payload.deletedMapId && appState.currentMapId === payload.deletedMapId) {
                    resetActiveMapState();
                    appState.currentMapId = null;
                    appState.currentMapName = null;
                }
                
                if (payload.newActiveGmMapId !== undefined && appState.activeGmMapId !== payload.newActiveGmMapId) {
                     appState.activeGmMapId = payload.newActiveGmMapId;
                }

                if (needsFullRender) {
                    renderApp();
                }
            }
            break;
        
case 'partyDataUpdated':
            if (payload && payload.mapId === appState.currentMapId) {
                let needsRender = false;
                let centerViewOnMarker = false;

                if (payload.hasOwnProperty('partyMarkerPosition')) {
                    if (!appState.isGM) { // Player client
                        if (JSON.stringify(appState.partyMarkerPosition) !== JSON.stringify(payload.partyMarkerPosition)) {
                            appState.partyMarkerPosition = payload.partyMarkerPosition;
                            needsRender = true;
                            if (appState.partyMarkerPosition) {
                                centerViewOnMarker = true;
                            }
                        }
                    } else { // GM client
                        if (JSON.stringify(appState.partyMarkerPosition) !== JSON.stringify(payload.partyMarkerPosition)) {
                            appState.partyMarkerPosition = payload.partyMarkerPosition;
                            needsRender = true;
                        }
                    }
                }

                if (payload.discoveredHexIds && Array.isArray(payload.discoveredHexIds)) {
                    const newSet = new Set(payload.discoveredHexIds);
                    if (!appState.isGM) {
                        if (appState.playerDiscoveredHexIds.size !== newSet.size || ![...appState.playerDiscoveredHexIds].every(id => newSet.has(id))) {
                            appState.playerDiscoveredHexIds = newSet;
                            needsRender = true;
                        }
                    } else {
                        if (appState.playerDiscoveredHexIds.size !== newSet.size || ![...appState.playerDiscoveredHexIds].every(id => newSet.has(id))) {
                            appState.playerDiscoveredHexIds = newSet;
                            needsRender = true;
                        }
                    }
                }

                if (payload.eventLog && Array.isArray(payload.eventLog)) {
                     if (JSON.stringify(appState.currentMapEventLog) !== JSON.stringify(payload.eventLog)) {
                        appState.currentMapEventLog = [...payload.eventLog];
                        needsRender = true;
                     }
                }
                
                if (needsRender) {
                    MapLogic.updatePartyMarkerBasedLoS(); 
                    if (centerViewOnMarker && appState.partyMarkerPosition && appState.appMode === CONST.AppMode.PLAYER && !appState.isGM) {
                         appState.centerViewOnHexAfterRender = appState.partyMarkerPosition.id;
                    } else {
                         centerViewOnMarker = false; // ensure it's reset if not centering
                    }
                    renderApp({ preserveScroll: !centerViewOnMarker }); 
                }
            }
            break;
        
                    case 'forceMapReload': // NEW CASE specifically for player clients
            if (payload && payload.mapId && !appState.isGM) {
                if (appState.currentMapId === payload.mapId) {
                    console.log(`AHME_IFRAME (Player ${appState.userId}): Received 'forceMapReload' for current map ${payload.mapId}. Reloading...`);
                    MapManagement.handleOpenMap(payload.mapId, true); // true = isAutomaticOpen
                } else {
                    console.warn(`AHME_IFRAME (Player ${appState.userId}): Received 'forceMapReload' for map ${payload.mapId}, but current map is ${appState.currentMapId}. Ignoring.`);
                }
            } else if (appState.isGM) {
                 console.debug(`AHME_IFRAME (GM ${appState.userId}): Received 'forceMapReload', GM typically doesn't force reload itself this way. Ignoring.`);
            }
            break;
            


        case 'activeMapChanged': 
            // This handler is primarily for when the GM *switches* their globally active map.
            // Or when the app first loads and needs to open the GM's active map.
            const newActiveGmMapIdFromSetting = payload.activeGmMapId; 
            const oldActiveGmMapId = appState.activeGmMapId;
            appState.activeGmMapId = newActiveGmMapIdFromSetting; 

            // console.log(`AHME IFRAME: activeMapChanged (from setting hook) from ${oldActiveGmMapId} to ${newActiveGmMapIdFromSetting}. Current loaded map: ${appState.currentMapId}`);

            if (newActiveGmMapIdFromSetting) {
                // If player isn't viewing this map, or map isn't initialized, load it.
                if (appState.currentMapId !== newActiveGmMapIdFromSetting || !appState.mapInitialized) {
                    // console.log(`AHME IFRAME: Triggering map open/reload for ${newActiveGmMapIdFromSetting} due to activeMapChanged.`);
                    MapManagement.handleOpenMap(newActiveGmMapIdFromSetting, true); // isAutomaticOpen = true
                } else if (appState.currentMapId === newActiveGmMapIdFromSetting) {
                    // Player is already viewing this map, but the activeMapId setting was re-affirmed.
                    // This case *could* also trigger a reload, but activeMapContentRefreshed is more specific for content updates.
                    // For safety, a reload here ensures sync if other mechanisms fail.
                    // console.log(`AHME IFRAME: Active map ID ${newActiveGmMapIdFromSetting} re-affirmed. Reloading.`);
                    MapManagement.handleOpenMap(newActiveGmMapIdFromSetting, true);
                }
            } else {
                // No map is globally active. Reset if this client was viewing something.
                if (appState.currentMapId || appState.mapInitialized) {
                    resetActiveMapState();
                    appState.currentMapId = null;
                    appState.currentMapName = null;
                }
                renderApp(); 
            }
            break;

        case 'activeMapContentRefreshed': // NEW CASE from socket
            if (payload && payload.mapId === appState.currentMapId && !appState.isGM) {
                // Player client is viewing the map whose content was just updated by GM (e.g. party move).
                // console.log(`AHME IFRAME (Player): Received activeMapContentRefreshed for current map ${payload.mapId}. Reloading.`);
                MapManagement.handleOpenMap(payload.mapId, true); // true for automatic, no confirm needed
            } else if (payload && payload.mapId === appState.currentMapId && appState.isGM) {
                // GM client also receives this if they have an iframe open.
                // Their partyDataUpdated handler should have already updated their local state from their own save action.
                // A full reload might be redundant or even disruptive if they were in the middle of an edit.
                // However, to ensure consistency if their local update failed, a soft refresh might be considered.
                // For now, let's assume GM's local `partyDataUpdated` is sufficient.
                // console.log(`AHME IFRAME (GM): Received activeMapContentRefreshed for current map ${payload.mapId}. GM local updates should suffice.`);
            }
            break;


        case 'formInputResponse':
            // console.log("AHME IFRAME: formInputResponse received. Waiting?", appState.isWaitingForFormInput, "Callback?", typeof appState.formInputCallback);
            if (appState.isWaitingForFormInput && typeof appState.formInputCallback === 'function') {
                appState.formInputCallback(payload); // Callback MUST reset isWaitingForFormInput and formInputCallback itself
            } else { 
                // console.warn("AHME IFRAME: formInputResponse received but not waiting or no callback.");
                // This case can happen if multiple dialogs were somehow triggered or a race condition.
                // It's generally safer to reset these if a response comes in unexpectedly.
                appState.isWaitingForFormInput = false;
                appState.formInputCallback = null;
                // Potentially renderApp() if a UI element was expecting this state to be cleared.
            }
            break;

        case 'featureDetailsInputResponse':
            // console.log("AHME IFRAME: featureDetailsInputResponse received. Waiting?", appState.isWaitingForFeatureDetails, "Callback?", typeof appState.featureDetailsCallback);
            if (appState.isWaitingForFeatureDetails && typeof appState.featureDetailsCallback === 'function') {
                // Ensure response corresponds to the pending request for safety, though not strictly necessary if only one can be pending.
                if (appState.pendingFeaturePlacement && payload && appState.pendingFeaturePlacement.hexId === payload.hexId) {
                    appState.featureDetailsCallback(payload); // Callback MUST reset the waiting state and its own reference.
                } else {
                    // console.warn("AHME IFRAME: Mismatched or unexpected featureDetailsInputResponse.", { pending: appState.pendingFeaturePlacement, received: payload });
                    // Mismatched or unexpected response, clear pending state to avoid issues
                    appState.isWaitingForFeatureDetails = false; 
                    appState.featureDetailsCallback = null; 
                    appState.pendingFeaturePlacement = null;
                    renderApp(); // Render to clear any waiting UI state
                }
            } else {
                // console.warn("AHME IFRAME: featureDetailsInputResponse received but not waiting or no callback.");
                appState.isWaitingForFeatureDetails = false;
                appState.featureDetailsCallback = null;
                appState.pendingFeaturePlacement = null;
                renderApp(); // Important to clear UI if it was stuck in a waiting state
            }
            break;

        case 'hexplorationDataUpdated':
            if (payload) {
                HexplorationLogic.updateLocalHexplorationDisplayValues(payload);
                renderApp({ preserveScroll: true }); 
            }
            break;
        
        default:
            // console.warn("AHME IFRAME: Received unhandled message type:", type, payload);
            break;
    }
});

export function handleAppModeChange(newMode) {
    MapLogic.handleAppModeChange(newMode);
}

async function start() {
    appState.appMode = appState.isGM ? CONST.DEFAULT_APP_MODE : CONST.AppMode.PLAYER;

    const templatesReady = await compileTemplates();
    if (!templatesReady) {
        return;
    }

    if (window.parent && APP_MODULE_ID && typeof window.parent.postMessage === 'function') {
        try {
            // console.log("AHME IFRAME: Sending jsAppReady to parent.");
            window.parent.postMessage({ type: 'jsAppReady', moduleId: APP_MODULE_ID }, '*');
        } catch (e) {
            console.error("AHME IFRAME: Error sending 'jsAppReady' to parent:", e);
            alert("AHME: Critical error initializing communication with Foundry. The map editor may not function correctly. Check console (F12).");
            resetActiveMapState(); 
            renderApp();
        }
    } else {
        console.warn("AHME IFRAME: Not running in a Foundry iframe or APP_MODULE_ID is missing. Map operations requiring Foundry interaction will not work. Running in limited/standalone mode.");
        resetActiveMapState(); 
        renderApp();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}