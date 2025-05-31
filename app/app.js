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
                
                if (!appState.isGM && appState.activeGmMapId) {
                    MapManagement.handleOpenMap(appState.activeGmMapId, true);
                } else if (appState.isGM && appState.activeGmMapId && appState.mapList.find(m => m.id === appState.activeGmMapId)) {
                    MapManagement.handleOpenMap(appState.activeGmMapId, true);
                } else {
                    resetActiveMapState(); 
                    renderApp();
                }
            } else { 
                renderApp(); 
            }
            break;

        case 'mapDataLoaded':
            if (payload && payload.mapId && Array.isArray(payload.hexes)) {
                resetActiveMapState(); // This sets zoom to 1.0 as a baseline

                appState.currentMapId = payload.mapId;
                appState.currentMapName = payload.name || "Unnamed Map";
                appState.isCurrentMapDirty = false; 

                if (payload.mapSettings) {
                    appState.currentMapHexSizeValue = parseFloat(payload.mapSettings.hexSizeValue) || CONST.DEFAULT_HEX_SIZE_VALUE;
                    appState.currentMapHexSizeUnit = payload.mapSettings.hexSizeUnit || CONST.DEFAULT_HEX_SIZE_UNIT;
                    appState.currentMapHexTraversalTimeValue = parseFloat(payload.mapSettings.hexTraversalTimeValue) || CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
                    appState.currentMapHexTraversalTimeUnit = payload.mapSettings.hexTraversalTimeUnit || CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
                    appState.zoomLevel = parseFloat(payload.mapSettings.zoomLevel) || 1.0; // Load zoom level
                } else { 
                    // Defaults for scale/time are already set by resetActiveMapState
                    // zoomLevel also defaults to 1.0 from resetActiveMapState
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

                if (appState.isGM) {
                    if (appState.activeGmMapId !== appState.currentMapId) {
                        window.parent.postMessage({ 
                            type: 'gmSetActiveMap', 
                            payload: { mapId: appState.currentMapId }, 
                            moduleId: APP_MODULE_ID 
                        }, '*');
                        appState.activeGmMapId = appState.currentMapId; 
                    }
                }
                
                renderApp();

            } else { 
                alert("Error: Received incomplete map data from server.");
                resetActiveMapState(); 
                renderApp(); 
            }
            break;

        case 'mapLoadFailed':
            alert(`Failed to load map: ${payload?.mapId||''} - ${payload?.error||'Unknown'}`);
            resetActiveMapState();
            renderApp();
            break;

 case 'mapListUpdated':
            if (payload && payload.mapList) {
                appState.mapList = payload.mapList;
                let mapWasDeleted = false;
                let mapWasJustSaved = false; // Flag to see if this update was due to a save

                if (payload.savedMapId) { 
                    appState.currentMapId = payload.savedMapId; 
                    const savedMapInfo = appState.mapList.find(m => m.id === payload.savedMapId);
                    if(savedMapInfo) appState.currentMapName = savedMapInfo.name;
                    appState.isCurrentMapDirty = false; 
                    mapWasJustSaved = true; // This 'mapListUpdated' was due to a save operation
                }
                if (payload.deletedMapId && appState.currentMapId === payload.deletedMapId) {
                    resetActiveMapState(); 
                    appState.currentMapId = null; 
                    appState.currentMapName = null;
                    mapWasDeleted = true;
                }
                if (payload.newActiveGmMapId !== undefined) { 
                     appState.activeGmMapId = payload.newActiveGmMapId;
                }
                renderApp();

            } break;

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
                    appState.isWaitingForFeatureDetails = false; appState.featureDetailsCallback = null; appState.pendingFeaturePlacement = null;
                    renderApp(); 
                }
            } else { 
                appState.isWaitingForFeatureDetails = false; appState.featureDetailsCallback = null; appState.pendingFeaturePlacement = null;
                renderApp(); 
            }
            break;

   case 'activeMapChanged': 
            const newActiveGmMapIdFromPayload = payload.activeGmMapId;

            if (!appState.isGM) { 
                if (newActiveGmMapIdFromPayload) {
                    if (appState.currentMapId !== newActiveGmMapIdFromPayload || 
                        (appState.currentMapId === newActiveGmMapIdFromPayload && appState.activeGmMapId !== newActiveGmMapIdFromPayload) ||
                        (appState.currentMapId === newActiveGmMapIdFromPayload) 
                        ) {
                        appState.activeGmMapId = newActiveGmMapIdFromPayload; 
                        MapManagement.handleOpenMap(newActiveGmMapIdFromPayload, true); 
                    } else {
                         appState.activeGmMapId = newActiveGmMapIdFromPayload; 
                    }
                } else { 
                    if (appState.currentMapId || appState.currentMapName) { 
                        resetActiveMapState(); 
                        appState.currentMapId = null; 
                        appState.currentMapName = null;
                        appState.activeGmMapId = null; 
                        renderApp(); 
                    }
                }
            } else { 
                if (appState.activeGmMapId !== newActiveGmMapIdFromPayload) {
                    appState.activeGmMapId = newActiveGmMapIdFromPayload;
                    renderApp(); 
                }
            }
            break;

        case 'hexplorationDataUpdated':
            if (payload) {
                HexplorationLogic.updateLocalHexplorationDisplayValues(payload); 
                renderApp(); 
            }
            break;
    }
});

export function handleAppModeChange(newMode) { MapLogic.handleAppModeChange(newMode); }

async function start() {
    appState.appMode = appState.isGM ? CONST.DEFAULT_APP_MODE : CONST.AppMode.PLAYER;
    const templatesReady = await compileTemplates();
    if (!templatesReady) { return; }
    if (window.parent && APP_MODULE_ID) {
        window.parent.postMessage({ type: 'jsAppReady', moduleId: APP_MODULE_ID }, '*');
    } else { 
        resetActiveMapState(); renderApp(); 
    }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }