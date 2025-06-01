// File: app/app.js

import { appState, resetActiveMapState } from './state.js';
import * as CONST from './constants.js';
import { compileTemplates, renderApp } from './ui.js'; 
import * as MapLogic from './map-logic.js';
import * as MapManagement from './map-management.js';
import * as HexplorationLogic from './hexploration-logic.js';

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');

window.addEventListener('message', (event) => {
    const { type, payload, moduleId: msgModuleId } = event.data || {};

    if (!type || msgModuleId !== APP_MODULE_ID) {
        return;
    }

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
                let explicitCenteringNeeded = false; 

                if (payload.hasOwnProperty('partyMarkerPosition')) {
                    const oldMarkerPosId = appState.partyMarkerPosition ? appState.partyMarkerPosition.id : null;
                    appState.partyMarkerPosition = payload.partyMarkerPosition; 
                    
                    if (appState.partyMarkerPosition && oldMarkerPosId !== appState.partyMarkerPosition.id) {
                        if (appState.appMode === CONST.AppMode.PLAYER && !appState.isGM) {
                            appState.centerViewOnHexAfterRender = appState.partyMarkerPosition.id;
                            explicitCenteringNeeded = true;
                        }
                    }
                    needsRender = true; 
                }

                if (payload.discoveredHexIds && Array.isArray(payload.discoveredHexIds)) {
                    const newSet = new Set(payload.discoveredHexIds);
                    if (appState.playerDiscoveredHexIds.size !== newSet.size || ![...appState.playerDiscoveredHexIds].every(id => newSet.has(id))) {
                        appState.playerDiscoveredHexIds = newSet;
                        needsRender = true;
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
                    
                    const shouldPreserveScroll = !explicitCenteringNeeded && 
                                                 !(appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition);

                    renderApp({ preserveScroll: shouldPreserveScroll }); 
                }
            }
            break;
        
        case 'forceMapReload': 
            if (payload && payload.mapId && !appState.isGM) {
                if (appState.currentMapId === payload.mapId) {
                    MapManagement.handleOpenMap(payload.mapId, true); 
                }
            }
            break;
            
        case 'activeMapChanged': 
            const newActiveGmMapIdFromSetting = payload.activeGmMapId; 
            const oldActiveGmMapId = appState.activeGmMapId;
            appState.activeGmMapId = newActiveGmMapIdFromSetting; 

            if (newActiveGmMapIdFromSetting) {
                if (appState.currentMapId !== newActiveGmMapIdFromSetting || !appState.mapInitialized) {
                    MapManagement.handleOpenMap(newActiveGmMapIdFromSetting, true); 
                } else if (appState.currentMapId === newActiveGmMapIdFromSetting) {
                    MapManagement.handleOpenMap(newActiveGmMapIdFromSetting, true);
                }
            } else {
                if (appState.currentMapId || appState.mapInitialized) {
                    resetActiveMapState();
                    appState.currentMapId = null;
                    appState.currentMapName = null;
                }
                renderApp(); 
            }
            break;

        case 'activeMapContentRefreshed': 
            if (payload && payload.mapId === appState.currentMapId && !appState.isGM) {
                MapManagement.handleOpenMap(payload.mapId, true); 
            }
            break;

        case 'formInputResponse':
            if (appState.isWaitingForFormInput && typeof appState.formInputCallback === 'function') {
                appState.formInputCallback(payload); 
            } else { 
                appState.isWaitingForFormInput = false;
                appState.formInputCallback = null;
            }
            break;

        case 'featureDetailsInputResponse':
            if (appState.isWaitingForFeatureDetails && typeof appState.featureDetailsCallback === 'function') {
                if (appState.pendingFeaturePlacement && payload && appState.pendingFeaturePlacement.hexId === payload.hexId) {
                    appState.featureDetailsCallback(payload); 
                } else {
                    appState.isWaitingForFeatureDetails = false; 
                    appState.featureDetailsCallback = null; 
                    appState.pendingFeaturePlacement = null;
                    renderApp(); 
                }
            } else {
                appState.isWaitingForFeatureDetails = false;
                appState.featureDetailsCallback = null;
                appState.pendingFeaturePlacement = null;
                renderApp(); 
            }
            break;

        case 'hexplorationDataUpdated':
            if (payload) {
                HexplorationLogic.updateLocalHexplorationDisplayValues(payload);
                renderApp({ preserveScroll: true }); 
            }
            break;
        
        default:
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