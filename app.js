import { appState, resetActiveMapState } from './state.js';
import * as CONST from './constants.js';
import { compileTemplates, renderApp } from './ui.js';
import * as MapLogic from './map-logic.js';
import * as MapManagement from './map-management.js';
import * as HexplorationLogic from './hexploration-logic.js';
import * as AnimationLogic from './animation-logic.js'; // Added import

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');
appState.isStandaloneMode = !APP_MODULE_ID; 

window.addEventListener('message', (event) => {
    const { type, payload, moduleId: msgModuleId } = event.data || {};

    if (!type || (!appState.isStandaloneMode && msgModuleId !== APP_MODULE_ID)) {
        return;
    }
    if (appState.isStandaloneMode && msgModuleId === APP_MODULE_ID) {
        return;
    }

    switch(type) {
        case 'initialData':
            if (appState.isStandaloneMode) return; 
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
                resetActiveMapState();
                renderApp();
            }
            break;

case 'partyMarkerImageSelected':
    console.log("IFRAME APP: Received partyMarkerImageSelected. Payload path:", payload?.path);
    if (payload) {
        appState.currentMapPartyMarkerImagePath = (typeof payload.path === 'string' && payload.path.trim() !== "") ? payload.path.trim() : null;
        console.log("IFRAME APP: appState.currentMapPartyMarkerImagePath set to:", appState.currentMapPartyMarkerImagePath);
        appState.isCurrentMapDirty = true;
        renderApp({ preserveScroll: true });
              const pathInput = document.getElementById("partyMarkerImagePathInput");
              if(pathInput) pathInput.value = appState.currentMapPartyMarkerImagePath || "";
          }
          break;


        case 'mapDataLoaded':
            if (appState.isStandaloneMode) return; 
            if (payload && payload.mapId && Array.isArray(payload.hexes)) {
                resetActiveMapState();

                if (payload.partyActivitiesData && typeof payload.partyActivitiesData === 'object') {
                    for (const [activityId, characterName] of Object.entries(payload.partyActivitiesData)) {
                        if (CONST.PARTY_ACTIVITIES[activityId] && typeof characterName === 'string') {
                            appState.activePartyActivities.set(activityId, characterName);
                        }
                    }
                } else if (window.parent && APP_MODULE_ID && typeof window.parent.postMessage === 'function') {
                    window.parent.postMessage({
                        type: 'ahnGetPartyActivities',
                        moduleId: APP_MODULE_ID
                    }, '*');
                }

                appState.currentMapId = payload.mapId;
                appState.currentMapName = payload.name || "Unnamed Map";
                appState.isCurrentMapDirty = false;

                if (payload.mapSettings) {
                    appState.currentMapHexSizeValue = parseFloat(payload.mapSettings.hexSizeValue) || CONST.DEFAULT_HEX_SIZE_VALUE;
                    appState.currentMapHexSizeUnit = payload.mapSettings.hexSizeUnit || CONST.DEFAULT_HEX_SIZE_UNIT;
                    appState.currentMapHexTraversalTimeValue = parseFloat(payload.mapSettings.hexTraversalTimeValue) || CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
                    appState.currentMapHexTraversalTimeUnit = payload.mapSettings.hexTraversalTimeUnit || CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
                    appState.zoomLevel = parseFloat(payload.mapSettings.zoomLevel) || 1.0;
                                    appState.currentMapPartyMarkerImagePath = payload.mapSettings.partyMarkerImagePath || null; // <<< ADDED
                } else {
                    appState.currentMapHexSizeValue = CONST.DEFAULT_HEX_SIZE_VALUE;
                    appState.currentMapHexSizeUnit = CONST.DEFAULT_HEX_SIZE_UNIT;
                    appState.currentMapHexTraversalTimeValue = CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
                    appState.currentMapHexTraversalTimeUnit = CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
                    appState.zoomLevel = 1.0;
                                    appState.currentMapPartyMarkerImagePath = null; // <<< ADDED DEFAULT
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
                    MapLogic.requestCenteringOnHex(appState.partyMarkerPosition.id);
                } else if (appState.mapInitialized) {
                    const firstHex = appState.hexDataMap.values().next().value;
                    if(firstHex) MapLogic.requestCenteringOnHex(firstHex.id);
                }
                renderApp();

            } else {
                alert("Error: Received incomplete map data from the server.");
                resetActiveMapState();
                renderApp();
            }
            break;

        case 'mapLoadFailed':
            if (appState.isStandaloneMode) return;
            alert(`Failed to load map: ${payload?.mapId || 'Unknown ID'} - ${payload?.error || 'Unknown reason'}`);
            if (appState.currentMapId === payload?.mapId || (appState.currentMapName && appState.currentMapName.startsWith("Loading"))) {
                resetActiveMapState();
                appState.currentMapId = null;
                appState.currentMapName = null;
            }
            renderApp();
            break;

        case 'mapListUpdated':
            if (appState.isStandaloneMode) return;
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
                if (!appState.isStandaloneMode || (appState.isStandaloneMode && appState.isGM)) {
                    let needsRender = false;
                    let explicitCenteringRequestedThisUpdate = false;

                    if (payload.hasOwnProperty('partyMarkerPosition')) {
                        const oldMarkerPosId = appState.partyMarkerPosition ? appState.partyMarkerPosition.id : null;
                        appState.partyMarkerPosition = payload.partyMarkerPosition;

                        if (appState.partyMarkerPosition && oldMarkerPosId !== appState.partyMarkerPosition.id) {
                            if (appState.appMode === CONST.AppMode.PLAYER || (appState.isGM && appState.appMode !== CONST.AppMode.HEX_EDITOR)) {
                                if (appState.mapInitialized) {
                                    MapLogic.requestCenteringOnHex(appState.partyMarkerPosition.id);
                                    explicitCenteringRequestedThisUpdate = true;
                                }
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
                        if (appState.mapInitialized) { 
                           MapLogic.updatePartyMarkerBasedLoS();
                        }
                        renderApp({ preserveScroll: !explicitCenteringRequestedThisUpdate });
                    }
                }
            }
            break;

        case 'forceMapReload':
            if (appState.isStandaloneMode) return;
            if (payload && payload.mapId && !appState.isGM) {
                if (appState.currentMapId === payload.mapId) {
                    MapManagement.handleOpenMap(payload.mapId, true);
                }
            }
            break;

        case 'activeMapChanged':
            if (appState.isStandaloneMode) return;
            const newActiveGmMapIdFromSetting = payload.activeGmMapId;
            appState.activeGmMapId = newActiveGmMapIdFromSetting;

            if (newActiveGmMapIdFromSetting) {
                if (appState.currentMapId !== newActiveGmMapIdFromSetting || !appState.mapInitialized) {
                    MapManagement.handleOpenMap(newActiveGmMapIdFromSetting, true);
                } else if (appState.currentMapId === newActiveGmMapIdFromSetting && appState.mapInitialized) {
                     if (appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition) {
                        MapLogic.requestCenteringOnHex(appState.partyMarkerPosition.id);
                        renderApp();
                    } else {
                        renderApp({preserveScroll: true});
                    }
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
            if (appState.isStandaloneMode) return;
            if (payload && payload.mapId === appState.currentMapId && !appState.isGM) {
                MapManagement.handleOpenMap(payload.mapId, true);
            }
            break;

        case 'formInputResponse':
            if (appState.isStandaloneMode && payload && payload.cancelled && !appState.isWaitingForFormInput) {
                renderApp(); 
                return;
            }
            if (appState.isWaitingForFormInput && typeof appState.formInputCallback === 'function') {
                appState.formInputCallback(payload);
            } else {
                appState.isWaitingForFormInput = false;
                appState.formInputCallback = null;
            }
            break;

case 'featureDetailsInputResponse':
            // Standalone specific quick exit if cancelled and not waiting (avoids unnecessary render)
            if (appState.isStandaloneMode && payload && payload.cancelled && !appState.isWaitingForFeatureDetails) {
                // Potentially do nothing or minimal render if truly not waiting
                // renderApp(); // Or remove this if it causes issues
                return;
            }

            if (appState.isWaitingForFeatureDetails && typeof appState.featureDetailsCallback === 'function') {
                // Check if this response is for the currently pending feature placement
                if (appState.pendingFeaturePlacement && payload && appState.pendingFeaturePlacement.hexId === payload.hexId) {
                    appState.featureDetailsCallback(payload); // This callback is in encounter-logic.js
                                                              // It will handle clearing pendingFeaturePlacement and isWaitingForFeatureDetails
                } else {
                    // This response is not for the current pending feature or no pending feature matches.
                    // This could be a stale response or an unexpected situation.
                    // Resetting state here is a defensive measure.
                    console.warn("AHME: Received featureDetailsInputResponse that didn't match pending placement or no callback was ready.", payload, appState.pendingFeaturePlacement);
                    appState.isWaitingForFeatureDetails = false;
                    appState.featureDetailsCallback = null;
                    appState.pendingFeaturePlacement = null;
                    renderApp(); // Re-render to clear any UI waiting for input
                }
            } else if (payload && payload.cancelled) {
                // If it was cancelled and we somehow weren't "waiting" anymore (e.g., another action interrupted)
                // still ensure state is clean.
                appState.isWaitingForFeatureDetails = false;
                appState.featureDetailsCallback = null;
                appState.pendingFeaturePlacement = null;
                renderApp();
            }
            // If none of the above, it's an unexpected message, do nothing or log.
            break;

        case 'ahnInitialPartyActivities':
          if (!appState.isStandaloneMode && payload) {
            appState.activePartyActivities.clear();
            for (const [activityId, characterName] of Object.entries(payload)) {
              if (CONST.PARTY_ACTIVITIES[activityId] && typeof characterName === 'string') {
                appState.activePartyActivities.set(activityId, characterName);
              }
            }
            renderApp({ preserveScroll: true });
          }
          break;

case 'ahnSyncTravelAnimation':
            const wasActive = appState.travelAnimation.isActive;
            
            // Update the local appState with the data from the GM
            // Make sure not to overwrite startTime and duration if the player has already started
            // and this is just a progress update (though we removed frequent progress updates from GM)
            // For start/stop, payload will have the definitive state.
            appState.travelAnimation = { 
                ...appState.travelAnimation, // Keep existing player-side startTime if already running
                ...payload 
            };

            if (!appState.isGM) { // Only player clients react to start/stop their loops
                if (payload.isActive && !wasActive) {
                    // If GM says "start" and it wasn't active, player starts their loop
                    // Ensure startTime and duration are fresh from GM for the player's loop
                    appState.travelAnimation.startTime = payload.startTime || Date.now(); // Use GM's start or current if missing
                    appState.travelAnimation.duration = payload.duration;
                    AnimationLogic.runPlayerAnimationLoop();
                } else if (!payload.isActive && wasActive) {
                    // If GM says "stop" and it was active, player stops their loop
                    AnimationLogic.stopPlayerAnimationLoop();
                }
            }
            
            // Re-render the UI to show/hide the popup and update marker for all
            // Player's marker will be driven by its own loop primarily, but this syncs initial/final state
            renderApp({ preserveScroll: true });
            break;

        default:
            break;
    }
});

export function handleAppModeChange(newMode) {
    MapLogic.handleAppModeChange(newMode);
}

async function start() {
    appState.isGM = appState.isStandaloneMode ? true : (new URLSearchParams(window.location.search).get('isGM') === 'true');
    appState.userId = appState.isStandaloneMode ? 'standalone_gm' : (new URLSearchParams(window.location.search).get('userId') || 'unknown_player_iframe');
    appState.appMode = appState.isGM ? CONST.DEFAULT_APP_MODE : CONST.AppMode.PLAYER;

    if (appState.isStandaloneMode) {
        appState.appMode = CONST.AppMode.PLAYER; // Default standalone to player view for now
    }

    const templatesReady = await compileTemplates();
    if (!templatesReady) {
        return;
    }

    if (appState.isStandaloneMode) {
        MapManagement.handleCreateNewMap(true); 
    } else if (window.parent && APP_MODULE_ID && typeof window.parent.postMessage === 'function') {
        try {
            window.parent.postMessage({ type: 'jsAppReady', moduleId: APP_MODULE_ID }, '*');
            window.parent.postMessage({
                type: 'ahnGetPartyActivities',
                moduleId: APP_MODULE_ID
            }, '*');
        } catch (e) {
            alert("AHME: Critical error initializing communication with Foundry. The map editor may not function correctly. Check console (F12).");
            resetActiveMapState();
            renderApp();
        }
    } else { // Fallback if no parent or module ID, assume standalone
        appState.isStandaloneMode = true; 
        appState.isGM = true; // Assume GM rights in this fallback standalone
        appState.userId = 'fallback_standalone_gm';
        appState.appMode = CONST.AppMode.PLAYER; // Default to player for consistency
        MapManagement.handleCreateNewMap(true); 
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}

export function syncActivitiesToFoundry() {
  if (appState.isStandaloneMode || !window.parent || typeof window.parent.postMessage !== 'function') {
    return;
  }

  const activitiesObject = Object.fromEntries(appState.activePartyActivities);

  try {
    window.parent.postMessage({
      type: 'ahnUpdatePartyActivities',
      payload: activitiesObject,
      moduleId: APP_MODULE_ID
    }, '*');
  } catch (e) {
    console.error("AHME: Error syncing party activities to Foundry:", e);
  }
}