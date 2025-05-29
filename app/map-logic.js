// advanced-hex-map-editor/app/map-logic.js
import { appState } from './state.js';
import * as CONST from './constants.js';
import * as HEX_UTILS from './hex-utils.js'; 
import { renderApp } from './ui.js';
import { handleSaveCurrentMap } from './map-management.js';
import * as HexplorationLogic from './hexploration-logic.js'; // For postHexplorationChatMessage

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');

// --- UTILITY FUNCTIONS ---
function rollPercent(chance) {
    return (Math.random() * 100) < (chance || 0); // Ensure chance is a number, default 0
}

function getTravelDirection(prevHex, nextHex) {
    if (!prevHex || !nextHex) return "into the unknown";
    
    // Using cube coordinates for more reliable hex direction
    const prevCube = prevHex.q !== undefined ? prevHex : HEX_UTILS.offsetToCube(prevHex.col, prevHex.row);
    const nextCube = nextHex.q !== undefined ? nextHex : HEX_UTILS.offsetToCube(nextHex.col, nextHex.row);

    const dq = nextCube.q - prevCube.q;
    const dr = nextCube.r - prevCube.r;
    // const ds = nextCube.s - prevCube.s; // Not strictly needed as s = -q-r

    // Directions for "odd-r" or pointy-top hexes (adjust if flat-top or different offset)
    if (dq === 1 && dr === 0) return "East";          // E
    if (dq === -1 && dr === 0) return "West";         // W
    if (dq === 0 && dr === -1) return "North-West";   // NW (or NE depending on system)
    if (dq === 1 && dr === -1) return "North-East";   // NE (or ENE)
    if (dq === -1 && dr === 1) return "South-West";   // SW (or WSW)
    if (dq === 0 && dr === 1) return "South-East";    // SE (or ESE)

    // Fallback for non-standard or diagonal moves if hexDistance > 1 (though typically we move 1 hex)
    // This simplified version handles direct adjacent moves well.
    // For a more visual direction if not perfectly aligned:
    const dCol = nextHex.col - prevHex.col;
    const dRow = nextHex.row - prevHex.row;
    if (dCol === 0 && dRow < 0) return "North";
    if (dCol === 0 && dRow > 0) return "South";
    if (dCol > 0 && dRow < 0) return "North-East";
    if (dCol > 0 && dRow > 0) return "South-East";
    if (dCol < 0 && dRow < 0) return "North-West";
    if (dCol < 0 && dRow > 0) return "South-West";
    if (dCol > 0) return "East";
    if (dCol < 0) return "West";
    
    return "a short distance";
}


// --- LINE OF SIGHT ---
export function calculateLineOfSight(sourceHexId, currentHexDataMap) {
    const sourceHex = currentHexDataMap.get(sourceHexId);
    if (!sourceHex) { return new Set(); }

    const visibleHexIds = new Set([sourceHex.id]); 
    const sourceTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[sourceHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
    const observerElevation = sourceHex.elevation + CONST.OBSERVER_EYE_HEIGHT_M; 
    
    let baseObserverRangeHexes = (sourceHex.baseVisibility || 0) +
                               Math.floor(Math.max(0, sourceHex.elevation) / CONST.ELEVATION_VISIBILITY_STEP_BONUS) +
                               (sourceTerrainConfig.baseInherentVisibilityBonus || 0);
    baseObserverRangeHexes = Math.max(1, baseObserverRangeHexes); 
    
    // console.log(`%cLoS Calc from ${sourceHex.id} (${sourceHex.terrain}, elev ${sourceHex.elevation}), Observer Eye: ${observerElevation.toFixed(0)}m. Base Observer Range = ${baseObserverRangeHexes.toFixed(1)} hexes`, 'color: blue; font-weight:bold;');

    currentHexDataMap.forEach(targetHex => {
        if (targetHex.id === sourceHex.id) return;
        const dist = HEX_UTILS.hexDistance(sourceHex, targetHex);
        if (dist === 0) return;
        
        const targetTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
        let targetProminenceBonus = targetTerrainConfig.prominence || 0;
        if (targetHex.elevation > 2000) { // Optional dynamic bonus for very high peaks
            targetProminenceBonus += Math.floor((targetHex.elevation - 2000) / 500); 
        }
        
        let observerRangeAlongPath = baseObserverRangeHexes;
        const hexesOnLine = HEX_UTILS.hexLine(sourceHex, targetHex); 
        
        if (hexesOnLine.length > 2) { 
            for (let i = 1; i < hexesOnLine.length - 1; i++) {
                const interveningHexOnLine = currentHexDataMap.get(hexesOnLine[i].id);
                if (interveningHexOnLine) {
                    const pathTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[interveningHexOnLine.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
                    if (pathTerrainConfig.visibilityFactor < 1.0) { 
                         observerRangeAlongPath *= pathTerrainConfig.visibilityFactor;
                         break; 
                    }
                }
            }
        }

        const finalMaxViewDistanceForTarget = observerRangeAlongPath + targetProminenceBonus;

        if (dist > finalMaxViewDistanceForTarget) { return; }

        const targetElevationForVisibility = targetHex.elevation + CONST.TARGET_VISIBILITY_THRESHOLD_M; 
        let isVisibleByProfile = true;

        if (hexesOnLine.length > 1) { 
            for (let i = 1; i < hexesOnLine.length; i++) { 
                const currentLineHexData = currentHexDataMap.get(hexesOnLine[i].id);
                if (!currentLineHexData) continue; 
                
                const fractionOfDistance = i / dist; 
                const losHeightAtInterveningPoint = observerElevation + (targetElevationForVisibility - observerElevation) * fractionOfDistance;
                let interveningHexObstructionHeight = currentLineHexData.elevation;
                
                if (currentLineHexData.id !== targetHex.id) { 
                    const interveningTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[currentLineHexData.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
                    interveningHexObstructionHeight += (interveningTerrainConfig.canopyBlockage || 0);
                    if (interveningHexObstructionHeight > losHeightAtInterveningPoint - CONST.PROFILE_LOS_BLOCKAGE_MARGIN) { 
                        isVisibleByProfile = false; break; 
                    }
                } else { 
                    if (losHeightAtInterveningPoint < (currentLineHexData.elevation + CONST.PROFILE_LOS_BLOCKAGE_MARGIN)) { 
                        isVisibleByProfile = false; break;
                    }
                }
            }
        }
        if (isVisibleByProfile) { visibleHexIds.add(targetHex.id); }
    });
    return visibleHexIds;
}

// --- GRID AND MAP STATE INITIALIZATION ---
export function initializeGridData(width, height, loadedHexes = [], mapIsNewAndUnsaved = false) {
    const grid = [], newHexMap = new Map();
    (loadedHexes || []).forEach(hex => {
        if (hex.q === undefined) { const c = HEX_UTILS.offsetToCube(hex.col, hex.row); hex.q = c.q; hex.r = c.r; hex.s = c.s; }
        if (hex.featureName === undefined) hex.featureName = "";
        if (hex.featureIcon === undefined) hex.featureIcon = null; 
        if (hex.feature === undefined) hex.feature = CONST.TerrainFeature.NONE.toLowerCase();
        newHexMap.set(hex.id, hex);
    });

    for (let r_idx = 0; r_idx < height; r_idx++) {
        const rowArr = [];
        for (let c = 0; c < width; c++) {
            const id = `${c}-${r_idx}`; let hex = newHexMap.get(id);
            if (!hex) {
                const { q, r: cubeR, s } = HEX_UTILS.offsetToCube(c, r_idx);
                hex = { 
                    col: c, row: r_idx, q, r: cubeR, s, id, 
                    elevation: CONST.INITIAL_ELEVATION, terrain: CONST.DEFAULT_TERRAIN_TYPE, 
                    baseVisibility: CONST.INITIAL_BASE_VISIBILITY, 
                    feature: CONST.TerrainFeature.NONE.toLowerCase(), featureName: "", featureIcon: null
                };
                newHexMap.set(id, hex);
            } rowArr.push(hex);
        } grid.push(rowArr);
    }
    appState.hexGridData = grid; appState.hexDataMap = newHexMap;
    appState.currentGridWidth = width; appState.currentGridHeight = height;
    appState.tempGridWidth = width.toString(); appState.tempGridHeight = height.toString();
    appState.editorLosSourceHexId = null; appState.editorVisibleHexIds = new Set();
    appState.isEditorLosSelectMode = false; appState.lastMovementInfo = null;
    appState.mapInitialized = true; 
    appState.isCurrentMapDirty = mapIsNewAndUnsaved; 
    
    if (mapIsNewAndUnsaved && !appState.partyMarkerPosition) {
        const defaultMarkerHex = newHexMap.get(`${CONST.INITIAL_PLAYER_COL}-${CONST.INITIAL_PLAYER_ROW}`) || newHexMap.values().next().value;
        if (defaultMarkerHex) appState.partyMarkerPosition = defaultMarkerHex;
        // console.log(`MAP_LOGIC: Default party marker set to ${appState.partyMarkerPosition?.id} for new/reset map.`);
    }
    
    appState.playerCurrentVisibleHexIds = new Set();
    updatePartyMarkerBasedLoS(); 
}

export function updatePartyMarkerBasedLoS() {
    if (!appState.mapInitialized || appState.hexDataMap.size === 0) {
        appState.playerCurrentVisibleHexIds = new Set(); return;
    }

    if (appState.partyMarkerPosition && appState.hexDataMap.has(appState.partyMarkerPosition.id)) {
        appState.partyMarkerPosition = appState.hexDataMap.get(appState.partyMarkerPosition.id); // Ensure fresh reference
        const visibleFromMarker = calculateLineOfSight(appState.partyMarkerPosition.id, appState.hexDataMap);
        const newlyDiscoveredHexesThisStep = new Set();
        visibleFromMarker.forEach(id => {
            if (!appState.playerDiscoveredHexIds.has(id)) newlyDiscoveredHexesThisStep.add(id);
        });
        
        appState.playerCurrentVisibleHexIds = visibleFromMarker;
        if (newlyDiscoveredHexesThisStep.size > 0) {
            appState.playerDiscoveredHexIds = new Set([...appState.playerDiscoveredHexIds, ...newlyDiscoveredHexesThisStep]);
            appState.isCurrentMapDirty = true;
            if (appState.isGM) {
                checkRandomEncountersOnDiscover(newlyDiscoveredHexesThisStep); // Async, no await needed here
            }
        }
    } else {
        appState.playerCurrentVisibleHexIds = new Set();
    }
}


// --- ENCOUNTER HANDLING ---
// advanced-hex-map-editor/app/map-logic.js
// ... (imports, other functions like rollPercent, getTravelDirection, calculateLineOfSight, initializeGridData, updatePartyMarkerBasedLoS) ...

// --- ENCOUNTER HANDLING ---
async function handleEncounterFeatureCreation(hexForEncounter, encounterTypeDescription) {
    if (!hexForEncounter || typeof hexForEncounter.id === 'undefined') {
        console.error("MAP_LOGIC: handleEncounterFeatureCreation - invalid hex object:", hexForEncounter);
        return Promise.resolve({ hexId: null, added: false, error: "Invalid hex object" });
    }
    if (!appState.isGM) {
        return Promise.resolve({ hexId: hexForEncounter.id, added: false, error: "Not GM" });
    }

    const originalHexId = hexForEncounter.id;

    return new Promise((resolve) => {
        const promptPayloadForDialog = {
            title: `Encounter: Hex ${originalHexId}!`,
            label: `An encounter occurred (${encounterTypeDescription}). Name it (or leave blank/cancel to skip marking):`,
            defaultName: `${encounterTypeDescription.substring(0, 25)}`,
        };

        // This callback is assigned to appState.mapNamePromptCallback
        // It will be called by app.js with the payload from the bridge.
        appState.mapNamePromptCallback = (responsePayloadFromBridge) => {
            appState.isWaitingForMapName = false; 
            appState.mapNamePromptCallback = null;  

            console.log(`MAP_LOGIC (Encounter Callback for ${originalHexId}): typeof responsePayloadFromBridge:`, typeof responsePayloadFromBridge);
            console.log(`MAP_LOGIC (Encounter Callback for ${originalHexId}): responsePayloadFromBridge raw value:`, responsePayloadFromBridge);
            if (typeof responsePayloadFromBridge === 'object' && responsePayloadFromBridge !== null) {
                 console.log(`MAP_LOGIC (Encounter Callback for ${originalHexId}): responsePayloadFromBridge (stringified object):`, JSON.parse(JSON.stringify(responsePayloadFromBridge)));
            } else {
                console.log(`MAP_LOGIC (Encounter Callback for ${originalHexId}): responsePayloadFromBridge raw:`, responsePayloadFromBridge);
            }


            let featureOutcome = { hexId: originalHexId, added: false, name: null, icon: null, reason: "Processing..." };

            const isValidResponse = responsePayloadFromBridge && 
                                  !responsePayloadFromBridge.cancelled && 
                                  responsePayloadFromBridge.hasOwnProperty('mapName') &&
                                  typeof responsePayloadFromBridge.mapName === 'string' && 
                                  responsePayloadFromBridge.mapName.trim() !== "";
            
            console.log(`MAP_LOGIC (Encounter Callback for ${originalHexId}): isValidResponse = ${isValidResponse}`);
            if (isValidResponse && responsePayloadFromBridge.mapName) { // Extra check for mapName existence before trim
                const encounterName = responsePayloadFromBridge.mapName.trim();
                const hexToUpdate = appState.hexDataMap.get(originalHexId); 
                
                if (hexToUpdate) {
                    console.log(`MAP_LOGIC (Encounter Callback for ${originalHexId}): Conditions MET. Adding feature. Encounter name: '${encounterName}'`);
                    let newFeatureName = `Random Encounter: ${encounterName}`;
                    let iconToUse = hexToUpdate.featureIcon; 

                    if (hexToUpdate.feature && hexToUpdate.feature !== CONST.TerrainFeature.NONE.toLowerCase() && hexToUpdate.featureName) {
                        newFeatureName = `${hexToUpdate.featureName}, ${newFeatureName}`;
                        if (iconToUse === "★" || iconToUse === CONST.ENCOUNTER_FEATURE_ICON || iconToUse === null || iconToUse === undefined) {
                            iconToUse = CONST.ENCOUNTER_FEATURE_ICON;
                        }
                    } else {
                        iconToUse = CONST.ENCOUNTER_FEATURE_ICON;
                    }
                    
                    const updatedHexObject = { ...hexToUpdate, feature: CONST.TerrainFeature.LANDMARK.toLowerCase(), featureName: newFeatureName, featureIcon: iconToUse };
                    appState.hexDataMap.set(originalHexId, updatedHexObject);
                    if (appState.hexGridData[hexToUpdate.row]?.[hexToUpdate.col]) { // Safer access
                        appState.hexGridData[hexToUpdate.row][hexToUpdate.col] = updatedHexObject;
                    }
                    appState.isCurrentMapDirty = true;
                    featureOutcome = { hexId: originalHexId, name: newFeatureName, added: true, icon: iconToUse };
                    renderApp({ specificallyUpdatedHex: updatedHexObject }); 
                } else { 
                    featureOutcome.error = "Hex not found for update post-dialog.";
                    featureOutcome.reason = "Internal error: hex missing.";
                    renderApp(); 
                }
            } else { 
                featureOutcome.reason = responsePayloadFromBridge?.cancelled ? "Cancelled by GM" : "Skipped by GM (no name entered or invalid response)";
                console.log(`MAP_LOGIC: GM skipped/cancelled/invalid response for encounter at ${originalHexId}.`);
                renderApp(); 
            }
            resolve(featureOutcome); 
        };

        appState.isWaitingForMapName = true; 
        window.parent.postMessage({ type: 'requestMapNameInput', payload: promptPayloadForDialog, moduleId: APP_MODULE_ID }, '*');
    });
}
async function checkRandomEncountersOnEnter(targetHex) {
    if (!appState.isGM) return null;
    const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
    const chance = terrainConfig.encounterChanceOnEnter || 0;

    // console.log(`MAP_LOGIC: Checking OnEnter encounter for ${targetHex.id} (${targetHex.terrain}). Chance: ${chance}%`);
    if (rollPercent(chance)) {
        HexplorationLogic.postHexplorationChatMessage(`System: Potential encounter upon entering hex ${targetHex.id} (${targetHex.terrain}). GM has been prompted.`, true);
        return await handleEncounterFeatureCreation(targetHex, `entering ${targetHex.terrain}`);
    }
    return null; // No encounter triggered
}

async function checkRandomEncountersOnDiscover(discoveredHexIdsSet) {
    if (!appState.isGM || !discoveredHexIdsSet || discoveredHexIdsSet.size === 0) return [];
    const createdFeatures = [];
    for (const hexId of discoveredHexIdsSet) {
        const hex = appState.hexDataMap.get(hexId);
        if (!hex) continue;
        const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[hex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
        const chance = terrainConfig.encounterChanceOnDiscover || 0;

        // console.log(`MAP_LOGIC: Checking OnDiscover encounter for ${hex.id} (${hex.terrain}). Chance: ${chance}%`);
        if (rollPercent(chance)) {
            HexplorationLogic.postHexplorationChatMessage(`System: Potential encounter noticed upon discovering hex ${hex.id} (${hex.terrain}). GM has been prompted.`, true);
            const details = await handleEncounterFeatureCreation(hex, `discovering ${hex.terrain}`);
            if (details && details.added) createdFeatures.push(details);
        }
    }
    return createdFeatures; // Array of {hexId, name, added, icon} objects or empty
}




// --- USER ACTIONS / HEX EDITOR LOGIC ---

// Modify handleHexClick for Player Mode
export async function handleHexClick(row, col) {
    if (!appState.mapInitialized && !appState.currentMapName) return;
    const clickedHexId = `${col}-${row}`;
    const targetHex = appState.hexDataMap.get(clickedHexId); 
    if (!targetHex) { console.warn(`MAP_LOGIC: Clicked invalid hex ID: ${clickedHexId}`); return; }

    if (!appState.isGM) return; 

    // --- GM PLAYER MODE ---
    if (appState.appMode === CONST.AppMode.PLAYER) { 
        if (targetHex.id === appState.partyMarkerPosition?.id) return; 

        const previousHex = appState.partyMarkerPosition;
        
        // Calculate travel time details
        let baseTimeHours = CONST.BASE_MOVE_HOURS_PER_HEX;
        const targetTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
        let terrainModifiedTime = baseTimeHours * targetTerrainConfig.speedMultiplier;
        let elevationTimePenalty = 0;
        if (previousHex) {
            const elevationDiff = targetHex.elevation - previousHex.elevation;
            elevationTimePenalty = (Math.abs(elevationDiff) / 100) * CONST.ELEVATION_TIME_PENALTY_FACTOR_PER_100M;
        }
        let totalTimeHours = terrainModifiedTime + elevationTimePenalty;
        totalTimeHours = Math.max(0.1, totalTimeHours);

        // Perform "on enter" encounter check BEFORE updating party position visually
        // The result 'encounterOnEnterDetails' will be like { hexId, name, added, icon } or null
        const encounterOnEnterDetails = await checkRandomEncountersOnEnter(targetHex);

        // Update party position and Line of Sight (LoS)
        // updatePartyMarkerBasedLoS might trigger onDiscover checks, which are also async
        // and might update features.
        appState.partyMarkerPosition = targetHex; 
        const direction = getTravelDirection(previousHex, targetHex);
        updatePartyMarkerBasedLoS(); // This updates LoS and may trigger onDiscover encounters
        
        appState.isCurrentMapDirty = true; 
        
        // Construct the log entry
        let encounterStatusMessage = "No significant event on entering hex.";
        if (encounterOnEnterDetails && encounterOnEnterDetails.added) {
            encounterStatusMessage = `Encounter '${encounterOnEnterDetails.name}' marked with icon '${encounterOnEnterDetails.icon || '?'}' at ${targetHex.id}.`;
        } else if (encounterOnEnterDetails && !encounterOnEnterDetails.added && encounterOnEnterDetails.reason) {
            // Encounter triggered but GM skipped marking
            encounterStatusMessage = `Encounter event at ${targetHex.id} occurred (GM skipped marking).`;
        }


        const travelLogEntry = {
            timestamp: new Date().toISOString(), type: "travel",
            from: previousHex ? previousHex.id : "Start", to: targetHex.id, direction,
            distanceKm: CONST.HEX_DIAMETER_KM, baseTime: baseTimeHours,
            terrainModifiedTime: terrainModifiedTime, 
            elevationPenalty: elevationTimePenalty, totalTime: totalTimeHours,
            previousTerrain: previousHex ? (CONST.TERRAIN_TYPES_CONFIG[previousHex.terrain]?.name || previousHex.terrain) : "N/A",
            targetTerrain: targetTerrainConfig.name,
            elevationChange: previousHex ? (targetHex.elevation - previousHex.elevation) : 0,
            encounterStatus: encounterStatusMessage,
        };
        
        if (!appState.currentMapEventLog) appState.currentMapEventLog = [];
        appState.currentMapEventLog.unshift(travelLogEntry);
        if (appState.currentMapEventLog.length > 50) appState.currentMapEventLog.pop();

        // Send Hexploration Action to Foundry Bridge
        if (window.parent && APP_MODULE_ID) {
            window.parent.postMessage({
                type: 'gmPerformedHexplorationAction',
                payload: { 
                    action: `moveParty ${direction} to ${targetHex.id}`, 
                    kmCost: CONST.HEX_DIAMETER_KM, hoursCost: totalTimeHours,
                    logEntry: travelLogEntry 
                }, moduleId: APP_MODULE_ID }, '*');
        }
        
        if (appState.currentMapId) { handleSaveCurrentMap(true); } // Auto-save map
        
        // The renderApp() call inside handleEncounterFeatureCreation will handle re-rendering if a feature was added.
        // If no encounter feature was added by onEnter, we still need to render the movement and LoS update.
        if (!(encounterOnEnterDetails && encounterOnEnterDetails.added)) {
            renderApp(); 
        }
        return;
    }

    // --- GM HEX EDITOR MODE --- (Logic from previous correct version)
    if (appState.appMode === CONST.AppMode.HEX_EDITOR) { 
        if (appState.isEditorLosSelectMode) { 
            appState.editorLosSourceHexId = clickedHexId; 
            appState.editorVisibleHexIds = calculateLineOfSight(clickedHexId, appState.hexDataMap); 
            appState.isEditorLosSelectMode = false; 
            renderApp(); return; 
        }
        
        const affectedHexesCoords = HEX_UTILS.getHexesInRadius(targetHex, appState.brushSize, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
        const interimHexDataMap = new Map(appState.hexDataMap);
        let changedByBrushLoopOverall = false; 
        let requiresFeatureDetailsDialog = false;

        affectedHexesCoords.forEach(targetHexCoords => {
            const currentHexInLoop = interimHexDataMap.get(targetHexCoords.id);
            if (!currentHexInLoop) return;
            let newHexData = { ...currentHexInLoop };
            let hexSpecificChange = false;

            switch (appState.paintMode) {
                case CONST.PaintMode.ELEVATION:
                    let newElevation = newHexData.elevation + (appState.elevationBrushMode === CONST.ElevationBrushMode.INCREASE ? CONST.ELEVATION_STEP : -CONST.ELEVATION_STEP);
                    newHexData.elevation = Math.max(CONST.MIN_ELEVATION, Math.min(CONST.MAX_ELEVATION, newElevation));
                    if (![CONST.TerrainType.ROAD, CONST.TerrainType.SETTLEMENT, CONST.TerrainType.WATER].includes(newHexData.terrain)) {
                         if (newHexData.elevation >= CONST.MOUNTAIN_THRESHOLD) newHexData.terrain = CONST.TerrainType.MOUNTAIN;
                         else if (newHexData.elevation >= CONST.HILLS_THRESHOLD) newHexData.terrain = CONST.TerrainType.HILLS;
                         else newHexData.terrain = CONST.TerrainType.PLAINS;
                    }
                    hexSpecificChange = true;
                    break;
                case CONST.PaintMode.TERRAIN: 
                    if (newHexData.terrain !== appState.selectedTerrainType) {
                        newHexData.terrain = appState.selectedTerrainType; hexSpecificChange = true; 
                    }
                    break;
                case CONST.PaintMode.FEATURE:
                    const selectedFeatureTypeConst = appState.selectedFeatureType; 
                    const featureTypeToApplyLower = selectedFeatureTypeConst.toLowerCase();
                    
                    if (targetHexCoords.id === clickedHexId && 
                        (selectedFeatureTypeConst === CONST.TerrainFeature.LANDMARK || selectedFeatureTypeConst === CONST.TerrainFeature.SECRET)) {
                        appState.pendingFeaturePlacement = { 
                            hexId: clickedHexId, featureType: featureTypeToApplyLower, 
                            currentName: newHexData.featureName || "", 
                            currentIcon: newHexData.featureIcon || (selectedFeatureTypeConst === CONST.TerrainFeature.LANDMARK ? "★" : null)
                        };
                        requiresFeatureDetailsDialog = true;
                    } else if (newHexData.feature === featureTypeToApplyLower && selectedFeatureTypeConst !== CONST.TerrainFeature.NONE) {
                        newHexData.feature = CONST.TerrainFeature.NONE.toLowerCase(); newHexData.featureName = ""; newHexData.featureIcon = null;
                        hexSpecificChange = true;
                    } else if (selectedFeatureTypeConst === CONST.TerrainFeature.NONE) {
                        if (newHexData.feature !== CONST.TerrainFeature.NONE.toLowerCase()) {
                            newHexData.feature = CONST.TerrainFeature.NONE.toLowerCase(); newHexData.featureName = ""; newHexData.featureIcon = null;
                            hexSpecificChange = true;
                        }
                    } else if (selectedFeatureTypeConst !== CONST.TerrainFeature.LANDMARK && selectedFeatureTypeConst !== CONST.TerrainFeature.SECRET) {
                        if (newHexData.feature !== featureTypeToApplyLower) {
                             newHexData.feature = featureTypeToApplyLower; newHexData.featureName = ""; newHexData.featureIcon = null;
                             hexSpecificChange = true;
                        }
                    }
                    break;
            } 
            if (hexSpecificChange) {
                 interimHexDataMap.set(newHexData.id, newHexData);
                 changedByBrushLoopOverall = true; 
            }
        });

        if (requiresFeatureDetailsDialog) {
            appState.isWaitingForFeatureDetails = true; 
            appState.featureDetailsCallback = (details) => { 
                appState.isWaitingForFeatureDetails = false; 
                appState.featureDetailsCallback = null;
                const pendingInfo = appState.pendingFeaturePlacement; 
                appState.pendingFeaturePlacement = null;

                let optionsForRender = { specificallyUpdatedHex: null };
                if (details && !details.cancelled && pendingInfo && details.hexId === pendingInfo.hexId) {
                    const hexToUpdate = interimHexDataMap.get(details.hexId) || appState.hexDataMap.get(details.hexId);
                    if (hexToUpdate) {
                        const updatedHex = {
                            ...hexToUpdate,
                            feature: details.featureType.toLowerCase(), 
                            featureName: details.featureName || "",
                            featureIcon: (details.featureType.toLowerCase() === CONST.TerrainFeature.LANDMARK.toLowerCase()) 
                                            ? (details.featureIcon || "★") : null 
                        };
                        interimHexDataMap.set(details.hexId, updatedHex); 
                        appState.hexDataMap = new Map(interimHexDataMap); 
                        if(appState.hexGridData[updatedHex.row]) appState.hexGridData[updatedHex.row][updatedHex.col] = updatedHex;
                        appState.isCurrentMapDirty = true;
                        optionsForRender.specificallyUpdatedHex = updatedHex;
                    }
                }
                updatePartyMarkerBasedLoS(); 
                if (appState.editorLosSourceHexId) appState.editorVisibleHexIds = calculateLineOfSight(appState.editorLosSourceHexId, appState.hexDataMap);
                renderApp(optionsForRender);
            };
            window.parent.postMessage({
                type: 'requestFeatureDetailsInput', payload: appState.pendingFeaturePlacement, moduleId: APP_MODULE_ID
            }, '*');
            return; 
        }
        
        if (changedByBrushLoopOverall) { 
            appState.hexDataMap = interimHexDataMap;
            appState.hexDataMap.forEach(h => { if(appState.hexGridData[h.row] && appState.hexGridData[h.row][h.col]) appState.hexGridData[h.row][h.col] = h; });
            appState.isCurrentMapDirty = true;
            if (appState.editorLosSourceHexId) appState.editorVisibleHexIds = calculateLineOfSight(appState.editorLosSourceHexId, appState.hexDataMap);
            updatePartyMarkerBasedLoS();
            renderApp(); 
        }
    } 
}

// --- OTHER CONTROL FUNCTIONS ---
export function handleGridResize(newWidthStr, newHeightStr) {
    if (!appState.isGM) { alert("Only GMs can resize map."); return; }
    const newWidth = parseInt(newWidthStr, 10); const newHeight = parseInt(newHeightStr, 10);
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth < CONST.MIN_GRID_DIMENSION || newWidth > CONST.MAX_GRID_DIMENSION || newHeight < CONST.MIN_GRID_DIMENSION || newHeight > CONST.MAX_GRID_DIMENSION) {
        alert(`Invalid dimensions. Min/Max: ${CONST.MIN_GRID_DIMENSION}/${CONST.MAX_GRID_DIMENSION}.`);
        appState.tempGridWidth = appState.currentGridWidth.toString(); appState.tempGridHeight = appState.currentGridHeight.toString();
        renderApp(); return;
    }
    if (newWidth === appState.currentGridWidth && newHeight === appState.currentGridHeight) return;
    if (appState.mapInitialized && appState.currentMapName && !confirm("Resizing will reset the current map context (layout, hex data, exploration). Name kept. Save required. Continue?")) {
        appState.tempGridWidth = appState.currentGridWidth.toString(); appState.tempGridHeight = appState.currentGridHeight.toString();
        renderApp(); return;
    }
    const oldName = appState.currentMapName, oldId = appState.currentMapId;
    appState.partyMarkerPosition = null; // Explicitly clear before re-init for resize
    initializeGridData(newWidth, newHeight, [], true); 
    appState.currentMapName = oldName; appState.currentMapId = oldId;
    appState.isCurrentMapDirty = true; 
    renderApp();
}

export function handleAppModeChange(newMode) {
    if (appState.appMode === newMode) return;
    appState.appMode = newMode;
    if (appState.mapInitialized) updatePartyMarkerBasedLoS();
    if (newMode !== CONST.AppMode.HEX_EDITOR && appState.isEditorLosSelectMode) {
        appState.isEditorLosSelectMode = false;
    }
    renderApp();
}

export function toggleEditorLosSelectMode() {
    if (appState.appMode !== CONST.AppMode.HEX_EDITOR) { alert("LoS sim only in Hex Editor mode."); return; }
    appState.isEditorLosSelectMode = !appState.isEditorLosSelectMode;
    if (appState.isEditorLosSelectMode) {
        appState.editorLosSourceHexId = null; appState.editorVisibleHexIds = new Set();
        alert("Editor LoS Mode: Click hex for LoS source.");
    }
    renderApp();
}