// File: app/map-logic.js
import { appState } from './state.js';
import * as CONST from './constants.js';
import { WEATHER_UPDATE_INTERVAL_HOURS } from './constants.js'; // Added import
import * as HEX_UTILS from './hex-utils.js';
import { renderApp } from './ui.js';
import { handleSaveCurrentMap } from './map-management.js';
import * as HexplorationLogic from './hexploration-logic.js';

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');

function rollPercent(chance) {
    return (Math.random() * 100) < (chance || 0);
}

function getTravelDirection(prevHex, nextHex, isExploringCurrentHex = false) {
    if (isExploringCurrentHex) return "exploring current location";
    if (!prevHex || !nextHex) return "into the unknown";

    const prevCube = prevHex.q !== undefined ? prevHex : HEX_UTILS.offsetToCube(prevHex.col, prevHex.row);
    const nextCube = nextHex.q !== undefined ? nextHex : HEX_UTILS.offsetToCube(nextHex.col, nextHex.row);

    const dq = nextCube.q - prevCube.q;
    const dr = nextCube.r - prevCube.r;

    if (dq === 1 && dr === 0) return "East";
    if (dq === -1 && dr === 0) return "West";
    if (dq === 0 && dr === -1) return "North-West";
    if (dq === 1 && dr === -1) return "North-East";
    if (dq === -1 && dr === 1) return "South-West";
    if (dq === 0 && dr === 1) return "South-East";

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


export function calculateLineOfSight(sourceHexId, currentHexDataMap) {
    const sourceHex = currentHexDataMap.get(sourceHexId);
    if (!sourceHex) { return new Set(); }

    const visibleHexIds = new Set([sourceHex.id]);
    const sourceTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[sourceHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
    const observerElevation = sourceHex.elevation + CONST.OBSERVER_EYE_HEIGHT_M;

    let weatherVisibilityMultiplier = 1.0;
    if (appState.isWeatherEnabled && appState.weatherGrid && appState.weatherGrid[sourceHex.id]) {
        const weatherId = appState.weatherGrid[sourceHex.id];
        const weatherCondition = appState.weatherConditions.find(wc => wc.id === weatherId);
        if (weatherCondition && weatherCondition.effects && typeof weatherCondition.effects.visibility === 'number') {
            weatherVisibilityMultiplier = weatherCondition.effects.visibility;
        }
    }

    let baseObserverRangeHexes = (sourceHex.baseVisibility || 0) +
                               Math.floor(Math.max(0, sourceHex.elevation) / CONST.ELEVATION_VISIBILITY_STEP_BONUS) +
                               (sourceTerrainConfig.baseInherentVisibilityBonus || 0);
    
    baseObserverRangeHexes *= weatherVisibilityMultiplier;
    baseObserverRangeHexes = Math.max(weatherVisibilityMultiplier === 0 ? 0 : 1, baseObserverRangeHexes); // Allow 0 vis if multiplier is 0

    currentHexDataMap.forEach(targetHex => {
        if (targetHex.id === sourceHex.id) return;
        const dist = HEX_UTILS.hexDistance(sourceHex, targetHex);
        if (dist === 0) return;

        const targetTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
        let targetProminenceBonus = targetTerrainConfig.prominence || 0;
        if (targetHex.elevation > 2000) {
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

export function initializeGridData(
    width,
    height,
    loadedHexes = [],
    mapIsNewAndUnsaved = false,
    defaultElevation = CONST.INITIAL_ELEVATION,
    defaultTerrain = CONST.DEFAULT_TERRAIN_TYPE
) {
    const grid = [], newHexMap = new Map();
    (loadedHexes || []).forEach(hex => {
        if (hex.q === undefined) { const c = HEX_UTILS.offsetToCube(hex.col, hex.row); hex.q = c.q; hex.r = c.r; hex.s = c.s; }
        if (hex.featureName === undefined) hex.featureName = "";
        if (hex.featureIcon === undefined) hex.featureIcon = null;
        if (hex.featureIconColor === undefined) hex.featureIconColor = null;
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
                    elevation: defaultElevation, terrain: defaultTerrain,
                    baseVisibility: CONST.INITIAL_BASE_VISIBILITY,
                    feature: CONST.TerrainFeature.NONE.toLowerCase(), featureName: "", featureIcon: null,
                    featureIconColor: null
                };
                newHexMap.set(id, hex);
            } rowArr.push(hex);
        } grid.push(rowArr);
    }
    appState.hexGridData = grid; appState.hexDataMap = newHexMap;
    appState.currentGridWidth = width; appState.currentGridHeight = height;
    appState.editorLosSourceHexId = null; appState.editorVisibleHexIds = new Set();
    appState.isEditorLosSelectMode = false; appState.lastMovementInfo = null;
    appState.mapInitialized = true;
    appState.isCurrentMapDirty = mapIsNewAndUnsaved;

    if (mapIsNewAndUnsaved && !appState.partyMarkerPosition) {
        const defaultMarkerHex = newHexMap.get(`${CONST.INITIAL_PLAYER_COL}-${CONST.INITIAL_PLAYER_ROW}`) || newHexMap.values().next().value;
        if (defaultMarkerHex) appState.partyMarkerPosition = defaultMarkerHex;
    }

    appState.playerCurrentVisibleHexIds = new Set();
    updatePartyMarkerBasedLoS();
}

export function updatePartyMarkerBasedLoS() {
    if (!appState.mapInitialized || appState.hexDataMap.size === 0) {
        appState.playerCurrentVisibleHexIds = new Set(); return;
    }

    if (appState.partyMarkerPosition && appState.hexDataMap.has(appState.partyMarkerPosition.id)) {
        appState.partyMarkerPosition = appState.hexDataMap.get(appState.partyMarkerPosition.id);
        const visibleFromMarker = calculateLineOfSight(appState.partyMarkerPosition.id, appState.hexDataMap);
        const newlyDiscoveredHexesThisStep = new Set();
        visibleFromMarker.forEach(id => {
            if (!appState.playerDiscoveredHexIds.has(id)) newlyDiscoveredHexesThisStep.add(id);
        });

        appState.playerCurrentVisibleHexIds = visibleFromMarker;
        if (newlyDiscoveredHexesThisStep.size > 0) {
            appState.playerDiscoveredHexIds = new Set([...appState.playerDiscoveredHexIds, ...newlyDiscoveredHexesThisStep]);
            appState.isCurrentMapDirty = true;
            if (appState.isGM && appState.appMode === CONST.AppMode.PLAYER) {
                checkRandomEncountersOnDiscover(newlyDiscoveredHexesThisStep);
            }
        }
    } else {
        appState.playerCurrentVisibleHexIds = new Set();
    }
}


async function handleEncounterFeatureCreation(hexForEncounter, encounterTypeDescription) {
    if (!hexForEncounter || typeof hexForEncounter.id === 'undefined') {
        return Promise.resolve({ hexId: null, added: false, error: "Invalid hex object" });
    }
    if (!appState.isGM) {
        return Promise.resolve({ hexId: hexForEncounter.id, added: false, error: "Not GM" });
    }

    const originalHexId = hexForEncounter.id;

    return new Promise((resolve) => {
        const hexToUpdateFromMap = appState.hexDataMap.get(originalHexId);

        appState.pendingFeaturePlacement = {
            hexId: originalHexId,
            featureType: CONST.TerrainFeature.LANDMARK.toLowerCase(),
            currentName: hexToUpdateFromMap?.featureName
                           ? `${hexToUpdateFromMap.featureName}, ${encounterTypeDescription.substring(0, 15)}`
                           : `${encounterTypeDescription.substring(0, 25)}`,
            currentIcon: (hexToUpdateFromMap?.featureIcon && hexToUpdateFromMap.feature !== CONST.TerrainFeature.NONE.toLowerCase())
                           ? hexToUpdateFromMap.featureIcon
                           : CONST.ENCOUNTER_FEATURE_ICON,
            currentIconColor: hexToUpdateFromMap?.featureIconColor || CONST.DEFAULT_ENCOUNTER_ICON_COLOR_CLASS,
            isEncounterContext: true
        };

        appState.isWaitingForFeatureDetails = true;

        appState.featureDetailsCallback = (details) => {
            appState.isWaitingForFeatureDetails = false;
            appState.featureDetailsCallback = null;
            const pendingInfo = appState.pendingFeaturePlacement;
            appState.pendingFeaturePlacement = null;

            let featureOutcome = { hexId: originalHexId, added: false, name: null, icon: null, color: null, reason: "Processing..." };

            if (details && !details.cancelled && pendingInfo && details.hexId === pendingInfo.hexId) {
                const hexToUpdateForEncounter = appState.hexDataMap.get(details.hexId);
                if (hexToUpdateForEncounter) {
                    const newFeatureName = details.featureName || pendingInfo.currentName;
                    const newFeatureIcon = details.featureIcon || pendingInfo.currentIcon;
                    const newFeatureIconColor = details.featureIconColor || pendingInfo.currentIconColor;

                    const updatedHexObject = {
                        ...hexToUpdateForEncounter,
                        feature: CONST.TerrainFeature.LANDMARK.toLowerCase(),
                        featureName: newFeatureName,
                        featureIcon: newFeatureIcon,
                        featureIconColor: newFeatureIconColor
                    };

                    appState.hexDataMap.set(originalHexId, updatedHexObject);
                    if (appState.hexGridData[updatedHexObject.row]?.[updatedHexObject.col]) {
                        appState.hexGridData[updatedHexObject.row][updatedHexObject.col] = updatedHexObject;
                    }
                    appState.isCurrentMapDirty = true;
                    featureOutcome = { hexId: originalHexId, name: newFeatureName, added: true, icon: newFeatureIcon, color: newFeatureIconColor };
                    renderApp({ specificallyUpdatedHex: updatedHexObject });
                } else {
                    featureOutcome.error = "Hex not found for update post-dialog.";
                    featureOutcome.reason = "Internal error: hex missing.";
                    renderApp();
                }
            } else {
                featureOutcome.reason = details?.cancelled ? "Cancelled by GM" : "Skipped by GM or invalid response";
                renderApp();
            }
            resolve(featureOutcome);
        };

        const messagePayloadToBridgeForEncounter = {
            ...appState.pendingFeaturePlacement,
            availableIconColors: CONST.FEATURE_ICON_COLORS
        };
        if (!appState.isStandaloneMode) {
            window.parent.postMessage({ type: 'requestFeatureDetailsInput', payload: messagePayloadToBridgeForEncounter, moduleId: APP_MODULE_ID }, '*');
        } else {
            const featureName = prompt("Enter Landmark Name:", appState.pendingFeaturePlacement.currentName || "");
            if (featureName === null) {
                appState.featureDetailsCallback({ ...appState.pendingFeaturePlacement, cancelled: true });
                return;
            }
            const featureIcon = prompt("Enter Landmark Icon (e.g., ★, 🌲, 🏛️):", appState.pendingFeaturePlacement.currentIcon || "★");
            if (featureIcon === null) {
                appState.featureDetailsCallback({ ...appState.pendingFeaturePlacement, cancelled: true });
                return;
            }
            const featureIconColor = prompt("Enter Landmark Icon Color (Tailwind class, e.g., fill-red-500, text-blue-300):", appState.pendingFeaturePlacement.currentIconColor || "fill-yellow-400");
            if (featureIconColor === null) {
                appState.featureDetailsCallback({ ...appState.pendingFeaturePlacement, cancelled: true });
                return;
            }
            appState.featureDetailsCallback({ ...appState.pendingFeaturePlacement, featureName, featureIcon, featureIconColor, cancelled: false });
        }
    });
}

async function checkRandomEncountersOnEnter(targetHex) {
    if (!appState.isGM) return null;
    const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
    const chance = terrainConfig.encounterChanceOnEnter || 0;

    if (rollPercent(chance)) {
        HexplorationLogic.postHexplorationChatMessage(`System: Potential encounter upon entering hex ${targetHex.id} (${targetHex.terrain}). GM has been prompted.`, true);
        return await handleEncounterFeatureCreation(targetHex, `Entered ${targetHex.terrain}`);
    }
    return null;
}

async function checkRandomEncountersOnDiscover(discoveredHexIdsSet) {
    if (!appState.isGM || !discoveredHexIdsSet || discoveredHexIdsSet.size === 0) return [];
    if (appState.appMode !== CONST.AppMode.PLAYER) return [];

    const createdFeatures = [];
    for (const hexId of discoveredHexIdsSet) {
        const hex = appState.hexDataMap.get(hexId);
        if (!hex) continue;
        const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[hex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
        const chance = terrainConfig.encounterChanceOnDiscover || 0;

        if (rollPercent(chance)) {
            HexplorationLogic.postHexplorationChatMessage(`System: Potential encounter noticed upon discovering hex ${hex.id} (${hex.terrain}). GM has been prompted.`, true);
            const details = await handleEncounterFeatureCreation(hex, `Discovered ${hex.terrain}`);
            if (details && details.added) createdFeatures.push(details);
        }
    }
    return createdFeatures;
}


export async function handleHexClick(row, col, isExploringCurrentHex = false) {
    if (!appState.mapInitialized && !appState.currentMapName) return;
    const clickedHexId = `${col}-${row}`;
    const targetHex = appState.hexDataMap.get(clickedHexId);
    if (!targetHex) { return; }
    if (!appState.isGM) return; // Only GMs (or standalone user acting as GM) can interact

    if (appState.appMode === CONST.AppMode.PLAYER) {
        if (!isExploringCurrentHex && targetHex.id === appState.partyMarkerPosition?.id) return;
        const previousHex = appState.partyMarkerPosition;

        let baseTimeValue = appState.currentMapHexTraversalTimeValue;
        const targetTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];

        let overallActivityPenaltyFactor = 1.0;
        if (appState.activePartyActivities.size > 0) {
            let maxPenalty = 1.0;
            appState.activePartyActivities.forEach(activityId => {
                const activityConf = CONST.PARTY_ACTIVITIES[activityId];
                if (activityConf && activityConf.movementPenaltyFactor > maxPenalty) {
                    maxPenalty = activityConf.movementPenaltyFactor;
                }
            });
            overallActivityPenaltyFactor = maxPenalty;
        }

        let weatherTravelSpeedMultiplier = 1.0;
        if (appState.isWeatherEnabled && appState.weatherGrid && appState.weatherGrid[targetHex.id]) {
            const weatherId = appState.weatherGrid[targetHex.id];
            const weatherCondition = appState.weatherConditions.find(wc => wc.id === weatherId);
            if (weatherCondition && weatherCondition.effects && typeof weatherCondition.effects.travelSpeed === 'number') {
                weatherTravelSpeedMultiplier = weatherCondition.effects.travelSpeed;
            }
        }

        let terrainModifiedTime = baseTimeValue * targetTerrainConfig.speedMultiplier * overallActivityPenaltyFactor * weatherTravelSpeedMultiplier;

        let elevationTimePenalty = 0;
        if (previousHex && !isExploringCurrentHex) {
            const elevationDiff = targetHex.elevation - previousHex.elevation;
            elevationTimePenalty = (Math.abs(elevationDiff) / 100) * CONST.ELEVATION_TIME_PENALTY_FACTOR_PER_100M;
        }
        let totalTimeValue = terrainModifiedTime + elevationTimePenalty;
        totalTimeValue = Math.max(0.1, totalTimeValue);

        if (appState.isWeatherEnabled) {
            appState.timeSinceLastWeatherChange += totalTimeValue;
            if (appState.timeSinceLastWeatherChange >= WEATHER_UPDATE_INTERVAL_HOURS) {
                updateWeatherOverTime();
                appState.timeSinceLastWeatherChange %= WEATHER_UPDATE_INTERVAL_HOURS; // Carry over excess
            }
        }

        if (!isExploringCurrentHex) {
            appState.partyMarkerPosition = targetHex;
        }
        const direction = getTravelDirection(previousHex, targetHex, isExploringCurrentHex);
        updatePartyMarkerBasedLoS();
        appState.isCurrentMapDirty = true;
        requestCenteringOnHex(targetHex.id);

        const encounterOnEnterDetails = await checkRandomEncountersOnEnter(targetHex);

        let encounterStatusMessage = "No significant event on entering hex.";
        if (isExploringCurrentHex) encounterStatusMessage = "No significant event while exploring current hex.";
        if (encounterOnEnterDetails && encounterOnEnterDetails.added) { encounterStatusMessage = `Encounter '${encounterOnEnterDetails.name}' marked with icon '${encounterOnEnterDetails.icon || '?'}' at ${targetHex.id}.`;}
        else if (encounterOnEnterDetails && !encounterOnEnterDetails.added && encounterOnEnterDetails.reason) { encounterStatusMessage = `Encounter event at ${targetHex.id} occurred (GM skipped marking).`;}

        const travelLogEntry = { /* ... (same as before) ... */ };
        if (!appState.currentMapEventLog) appState.currentMapEventLog = [];
        appState.currentMapEventLog.unshift(travelLogEntry);
        if (appState.currentMapEventLog.length > 50) appState.currentMapEventLog.pop();

        let hoursCost = totalTimeValue; /* ... (same conversion) ... */
        let kmCost = isExploringCurrentHex ? 0 : appState.currentMapHexSizeValue; /* ... (same conversion) ... */
        const hexplorationActionType = isExploringCurrentHex ? `explore hex ${targetHex.id}` : `moveParty ${direction} to ${targetHex.id}`;

        if (!appState.isStandaloneMode && window.parent && APP_MODULE_ID) {
             window.parent.postMessage({ type: 'gmPerformedHexplorationAction', payload: { action: hexplorationActionType, kmCost: kmCost, hoursCost: hoursCost, logEntry: travelLogEntry }, moduleId: APP_MODULE_ID }, '*');
        }
        if (appState.currentMapId && (!appState.isStandaloneMode || appState.isGM)) { // GM can auto-save in standalone
            handleSaveCurrentMap(true);
        }

        if (!(encounterOnEnterDetails && encounterOnEnterDetails.added)) {
            renderApp();
        }
        return;
    }

    if (appState.appMode === CONST.AppMode.HEX_EDITOR) {
        if (appState.isEditorLosSelectMode) { appState.editorLosSourceHexId = clickedHexId; appState.editorVisibleHexIds = calculateLineOfSight(clickedHexId, appState.hexDataMap); appState.isEditorLosSelectMode = false; renderApp(); return; }
        
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
                    let newElevation;
                    if (appState.elevationBrushMode === CONST.ElevationBrushMode.INCREASE) {
                        newElevation = newHexData.elevation + appState.elevationBrushCustomStep;
                    } else if (appState.elevationBrushMode === CONST.ElevationBrushMode.DECREASE) {
                        newElevation = newHexData.elevation - appState.elevationBrushCustomStep;
                    } else if (appState.elevationBrushMode === CONST.ElevationBrushMode.SET_TO_VALUE) {
                        newElevation = appState.elevationBrushSetValue;
                    }
                    newHexData.elevation = Math.max(CONST.MIN_ELEVATION, Math.min(CONST.MAX_ELEVATION, newElevation));
                    
                    if (appState.autoTerrainChangeOnElevation && !CONST.AUTO_TERRAIN_IGNORE_TYPES.includes(newHexData.terrain)) {
                        if (newHexData.elevation >= CONST.MOUNTAIN_THRESHOLD) newHexData.terrain = CONST.TerrainType.MOUNTAIN;
                        else if (newHexData.elevation >= CONST.HILLS_THRESHOLD) newHexData.terrain = CONST.TerrainType.HILLS;
                        else newHexData.terrain = CONST.TerrainType.PLAINS; // Default for lower elevations
                    }
                    hexSpecificChange = true; 
                    break;
                case CONST.PaintMode.TERRAIN: 
                    if (newHexData.terrain !== appState.selectedTerrainType) { 
                        newHexData.terrain = appState.selectedTerrainType; 
                        hexSpecificChange = true; 
                    } 
                    break;
                case CONST.PaintMode.FEATURE:
                    if (appState.featureBrushAction === CONST.FeatureBrushAction.REMOVE) {
                        if (newHexData.feature !== CONST.TerrainFeature.NONE.toLowerCase() || newHexData.featureName !== "" || newHexData.featureIcon !== null) {
                            newHexData.feature = CONST.TerrainFeature.NONE.toLowerCase();
                            newHexData.featureName = "";
                            newHexData.featureIcon = null;
                            newHexData.featureIconColor = null;
                            hexSpecificChange = true;
                        }
                    } else { // This is ADD mode
                        const selectedFeatureTypeConst = appState.selectedFeatureType;
                        const featureTypeToApplyLower = selectedFeatureTypeConst.toLowerCase();

                        // Specific handling for LANDMARK or SECRET (requires dialog) only on the primary clicked hex
                        if (targetHexCoords.id === clickedHexId &&
                            (selectedFeatureTypeConst === CONST.TerrainFeature.LANDMARK || selectedFeatureTypeConst === CONST.TerrainFeature.SECRET)) {

                            // Only trigger dialog if we are actually changing to this feature or if it's currently NONE
                            // This prevents re-triggering dialog if clicking on an already existing landmark of the same type to "change" it.
                            // If changing from a different landmark/secret, it should still trigger.
                            if (newHexData.feature !== featureTypeToApplyLower || featureTypeToApplyLower === CONST.TerrainFeature.NONE.toLowerCase()) {
                                appState.pendingFeaturePlacement = {
                                    hexId: clickedHexId,
                                    featureType: featureTypeToApplyLower,
                                    currentName: newHexData.featureName || `New ${selectedFeatureTypeConst}`,
                                    currentIcon: newHexData.featureIcon || (selectedFeatureTypeConst === CONST.TerrainFeature.LANDMARK ? '★' : '❓'),
                                    currentIconColor: newHexData.featureIconColor || CONST.DEFAULT_LANDMARK_ICON_COLOR_CLASS,
                                    isEncounterContext: false
                                };
                                requiresFeatureDetailsDialog = true;
                                // No hexSpecificChange = true here; it's handled by the dialog callback
                            }
                        } else if (selectedFeatureTypeConst === CONST.TerrainFeature.NONE) {
                            // If "None" is selected, remove any existing feature
                            if (newHexData.feature !== CONST.TerrainFeature.NONE.toLowerCase()) {
                                newHexData.feature = CONST.TerrainFeature.NONE.toLowerCase();
                                newHexData.featureName = "";
                                newHexData.featureIcon = null;
                                newHexData.featureIconColor = null;
                                hexSpecificChange = true;
                            }
                        } else if (selectedFeatureTypeConst !== CONST.TerrainFeature.LANDMARK && selectedFeatureTypeConst !== CONST.TerrainFeature.SECRET) {
                            // For simple, non-dialog features (if any were to exist)
                            if (newHexData.feature !== featureTypeToApplyLower) {
                                newHexData.feature = featureTypeToApplyLower;
                                newHexData.featureName = ""; // Clear name/icon for non-landmark/secret types
                                newHexData.featureIcon = null;
                                newHexData.featureIconColor = null;
                                hexSpecificChange = true;
                            }
                        }
                        // Note: Clicking on an existing feature of the same type (non-dialog) does nothing here, which is fine.
                        // Clicking on an existing feature with a *different* simple type selected will change it.
                    }
                    break;
            }
            if (hexSpecificChange) { interimHexDataMap.set(newHexData.id, newHexData); changedByBrushLoopOverall = true; }
        });

        if (requiresFeatureDetailsDialog) {
            appState.isWaitingForFeatureDetails = true;
            // The actual callback that processes the details after they are received (either from bridge or standalone prompts)
            appState.featureDetailsCallback = (details) => {
                appState.isWaitingForFeatureDetails = false;
                const pendingInfo = appState.pendingFeaturePlacement; // Capture before clearing
                appState.pendingFeaturePlacement = null;
                appState.featureDetailsCallback = null; // Clear callback

                if (details && !details.cancelled && pendingInfo && details.hexId === pendingInfo.hexId) {
                    const hexToUpdate = appState.hexDataMap.get(details.hexId);
                    if (hexToUpdate) {
                        const updatedHex = {
                            ...hexToUpdate,
                            feature: pendingInfo.featureType, // Use featureType from pendingInfo
                            featureName: details.featureName,
                            featureIcon: details.featureIcon,
                            featureIconColor: details.featureIconColor,
                        };
                        appState.hexDataMap.set(details.hexId, updatedHex);
                        if (appState.hexGridData[updatedHex.row]?.[updatedHex.col]) {
                            appState.hexGridData[updatedHex.row][updatedHex.col] = updatedHex;
                        }
                        appState.isCurrentMapDirty = true;
                        if (appState.editorLosSourceHexId) {
                            appState.editorVisibleHexIds = calculateLineOfSight(appState.editorLosSourceHexId, appState.hexDataMap);
                        }
                        updatePartyMarkerBasedLoS();
                        renderApp({ preserveScroll: true, specificallyUpdatedHex: updatedHex });
                    } else {
                        console.error("Hex to update not found after feature details input:", details.hexId);
                        renderApp({ preserveScroll: true });
                    }
                } else {
                    // Cancelled or invalid details
                    renderApp({ preserveScroll: true });
                }
            };

            const messagePayloadToBridge = {
                hexId: appState.pendingFeaturePlacement.hexId,
                featureType: appState.pendingFeaturePlacement.featureType,
                currentName: appState.pendingFeaturePlacement.currentName,
                currentIcon: appState.pendingFeaturePlacement.currentIcon,
                currentIconColor: appState.pendingFeaturePlacement.currentIconColor,
                availableIconColors: CONST.FEATURE_ICON_COLORS
            };

            if (!appState.isStandaloneMode) {
                 window.parent.postMessage({ type: 'requestFeatureDetailsInput', payload: messagePayloadToBridge, moduleId: APP_MODULE_ID }, '*');
            } else {
                // Standalone mode: use prompts
                const featureName = prompt("Enter Landmark Name:", messagePayloadToBridge.currentName || "");
                if (featureName === null) {
                    appState.featureDetailsCallback({ ...messagePayloadToBridge, cancelled: true });
                    return;
                }
                const featureIcon = prompt("Enter Landmark Icon (e.g., ★, 🌲, 🏛️):", messagePayloadToBridge.currentIcon || "★");
                if (featureIcon === null) {
                    appState.featureDetailsCallback({ ...messagePayloadToBridge, cancelled: true });
                    return;
                }
                const featureIconColor = prompt("Enter Landmark Icon Color (Tailwind class, e.g., fill-red-500, text-blue-300):", messagePayloadToBridge.currentIconColor || "fill-yellow-400");
                if (featureIconColor === null) {
                    appState.featureDetailsCallback({ ...messagePayloadToBridge, cancelled: true });
                    return;
                }
                appState.featureDetailsCallback({ ...messagePayloadToBridge, featureName, featureIcon, featureIconColor, cancelled: false });
            }
            return; 
        }

        if (changedByBrushLoopOverall) {
            appState.hexDataMap = interimHexDataMap; 
            appState.hexDataMap.forEach(h => { if(appState.hexGridData[h.row] && appState.hexGridData[h.row][h.col]) appState.hexGridData[h.row][h.col] = h; });
            appState.isCurrentMapDirty = true; 
            if (appState.editorLosSourceHexId) appState.editorVisibleHexIds = calculateLineOfSight(appState.editorLosSourceHexId, appState.hexDataMap);
            updatePartyMarkerBasedLoS(); 
            renderApp({preserveScroll: true});
        }
    }
}

export function handleAppModeChange(newMode) {
    if (appState.appMode === newMode) return;
    appState.appMode = newMode;

    if (appState.mapInitialized) updatePartyMarkerBasedLoS();
    if (newMode !== CONST.AppMode.HEX_EDITOR && appState.isEditorLosSelectMode) {
        appState.isEditorLosSelectMode = false;
    }

    if (appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition) {
        requestCenteringOnHex(appState.partyMarkerPosition.id);
    } else {
        const svgScrollContainer = document.getElementById('svg-scroll-container');
        if (svgScrollContainer && appState.zoomLevel !== 0 && appState.mapInitialized) {
             setTargetScrollForHexBasedOnCurrentCenter(appState.zoomLevel, appState.zoomLevel);
        } else {
            appState.centerViewOnHexAfterRender = null;
            appState.targetScrollLeft = null;
            appState.targetScrollTop = null;
        }
    }
    renderApp();
}


export function toggleEditorLosSelectMode() { if (appState.appMode !== CONST.AppMode.HEX_EDITOR) { alert("LoS sim only in Hex Editor mode."); return; }
appState.isEditorLosSelectMode = !appState.isEditorLosSelectMode; if (appState.isEditorLosSelectMode) { appState.editorLosSourceHexId = null; appState.editorVisibleHexIds = new Set(); alert("Editor LoS Mode: Click hex for LoS source.");} renderApp();}


export function requestCenteringOnHex(hexId) {
    if (!appState.mapInitialized || !hexId) {
        appState.centerViewOnHexAfterRender = null;
        return;
    }
    const hexData = appState.hexDataMap.get(hexId);
    if (!hexData) {
        appState.centerViewOnHexAfterRender = null;
        return;
    }
    appState.centerViewOnHexAfterRender = hexId;
    appState.targetScrollLeft = null;
    appState.targetScrollTop = null;
}

export function getCalculatedScrollForHex(hexId, svgScrollContainerId = 'svg-scroll-container', unscaledContentWidth, unscaledContentHeight) {
    if (!appState.mapInitialized || !hexId) return null;
    const hexData = appState.hexDataMap.get(hexId);
    if (!hexData) return null;
    const svgScrollContainer = document.getElementById(svgScrollContainerId);
    if (!svgScrollContainer) return null;
    if (isNaN(unscaledContentWidth) || isNaN(unscaledContentHeight) || unscaledContentWidth <= 0 || unscaledContentHeight <= 0) return null;

    const hexTrueW = CONST.HEX_SIZE * Math.sqrt(3);
    const hexVOff = CONST.HEX_SIZE * 1.5;
    const svgPad = CONST.HEX_SIZE;
    let hexCenterX_unzoomed = svgPad + hexTrueW / 2 + hexData.col * hexTrueW + (hexData.row % 2 !== 0 ? hexTrueW / 2 : 0);
    let hexCenterY_unzoomed = svgPad + CONST.HEX_SIZE + hexData.row * hexVOff;
    if (appState.viewMode === CONST.ViewMode.THREED) {
        hexCenterY_unzoomed -= hexData.elevation * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT;
    }
    const targetX_scaled_pixels = hexCenterX_unzoomed * appState.zoomLevel;
    const targetY_scaled_pixels = hexCenterY_unzoomed * appState.zoomLevel;
    const containerWidth = svgScrollContainer.clientWidth;
    const containerHeight = svgScrollContainer.clientHeight;
    let scrollLeft = targetX_scaled_pixels - (containerWidth / 2);
    let scrollTop = targetY_scaled_pixels - (containerHeight / 2);
    const maxScrollLeft = Math.max(0, (unscaledContentWidth * appState.zoomLevel) - containerWidth);
    const maxScrollTop = Math.max(0, (unscaledContentHeight * appState.zoomLevel) - containerHeight);
    scrollLeft = Math.max(0, Math.min(scrollLeft, maxScrollLeft));
    scrollTop = Math.max(0, Math.min(scrollTop, maxScrollTop));
    return { scrollLeft, scrollTop };
}

export function setTargetScrollForHexBasedOnCurrentCenter(oldZoom, newZoom) {
    const svgScrollContainer = document.getElementById('svg-scroll-container');
    if (!svgScrollContainer || oldZoom === 0) {
        appState.targetScrollLeft = null;
        appState.targetScrollTop = null;
        return;
    }
    if (appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition) {
        requestCenteringOnHex(appState.partyMarkerPosition.id);
        return;
    }
    const containerWidth = svgScrollContainer.clientWidth;
    const containerHeight = svgScrollContainer.clientHeight;
    const currentViewportCenterX_scaled = svgScrollContainer.scrollLeft + containerWidth / 2;
    const currentViewportCenterY_scaled = svgScrollContainer.scrollTop + containerHeight / 2;
    const currentViewportCenterX_unzoomed = currentViewportCenterX_scaled / oldZoom;
    const currentViewportCenterY_unzoomed = currentViewportCenterY_scaled / oldZoom;
    appState.targetScrollLeft = (currentViewportCenterX_unzoomed * newZoom) - (containerWidth / 2);
    appState.targetScrollTop = (currentViewportCenterY_unzoomed * newZoom) - (containerHeight / 2);
    appState.centerViewOnHexAfterRender = null;
}

export function handleMouseMoveOnGrid(event) {
    if (!appState.mapInitialized || appState.appMode !== CONST.AppMode.HEX_EDITOR || !appState.paintMode || appState.paintMode === CONST.PaintMode.NONE) { // Added check for PaintMode.NONE
        if (appState.brushPreviewHexIds.size > 0) {
            appState.brushPreviewHexIds.clear();
            renderApp({ preserveScroll: true });
        }
        return;
    }

    let hoveredHex = null;
    const targetGroup = event.target.closest('g[data-hex-id]');

    if (targetGroup && targetGroup.dataset.hexId) {
        hoveredHex = appState.hexDataMap.get(targetGroup.dataset.hexId);
    }

    if (hoveredHex) {
        const affectedHexes = HEX_UTILS.getHexesInRadius(
            hoveredHex,
            appState.brushSize,
            appState.hexDataMap,
            appState.currentGridWidth,
            appState.currentGridHeight
        );
        const newPreviewIds = new Set(affectedHexes.map(h => h.id));

        // Check if the set of previewed hex IDs has actually changed
        let changed = newPreviewIds.size !== appState.brushPreviewHexIds.size;
        if (!changed) {
            for (const id of newPreviewIds) {
                if (!appState.brushPreviewHexIds.has(id)) {
                    changed = true;
                    break;
                }
            }
            if (!changed) { // If still not changed, check the reverse (old ones not in new)
                 for (const id of appState.brushPreviewHexIds) {
                    if (!newPreviewIds.has(id)) {
                        changed = true;
                        break;
                    }
                }
            }
        }

        if (changed) {
            appState.brushPreviewHexIds = newPreviewIds;
            renderApp({ preserveScroll: true });
        }
    } else { // Not hovering a specific hex, clear preview
        if (appState.brushPreviewHexIds.size > 0) {
            appState.brushPreviewHexIds.clear();
            renderApp({ preserveScroll: true });
        }
    }
}

export function handleMouseLeaveFromGrid() {
    if (appState.brushPreviewHexIds.size > 0) {
        appState.brushPreviewHexIds.clear();
        renderApp({ preserveScroll: true });
    }
}

export function generateWeatherGrid() {
    if (!appState.isWeatherEnabled) {
        appState.weatherGrid = {};
        appState.activeWeatherSystems = [];
        renderApp({ preserveScroll: true }); // Render to clear visuals
        return;
    }

    appState.activeWeatherSystems = []; // Clear previous systems
    appState.weatherGrid = {};         // Clear previous grid

    if (!appState.mapInitialized || !appState.hexDataMap || appState.hexDataMap.size === 0) {
        renderApp({ preserveScroll: true }); // Render to show empty grid state
        return;
    }

    const defaultWeatherId = 'sunny'; // Assuming 'sunny' is a valid weatherCondition id

    // 1. Fill the entire weatherGrid with the default weather
    appState.hexDataMap.forEach(hex => {
        appState.weatherGrid[hex.id] = defaultWeatherId;
    });

    // 2. Determine the number of weather systems
    const numSystems = Math.floor(Math.random() * 3) + 1; // 1-3 systems

    const { weatherSettings, weatherConditions } = appState;
    const availableSystemTypes = weatherConditions.filter(wc => wc.id !== defaultWeatherId); // Optionally exclude default type

    if (availableSystemTypes.length === 0 && weatherConditions.find(wc => wc.id === defaultWeatherId) === undefined) {
        console.warn("No weather types available for systems, and default sunny is missing. Weather grid will be empty or only default.");
        // If defaultWeatherId is also not in weatherConditions, the grid might be problematic.
        // For now, we assume 'sunny' exists or this state is handled.
    }
    
    const hexArray = Array.from(appState.hexDataMap.values());
    if (hexArray.length === 0) {
        renderApp({ preserveScroll: true });
        return; // No hexes to place systems on
    }

    for (let i = 0; i < numSystems; i++) {
        // Select Weather Type for System (weighted random)
        const weightedWeatherArray = [];
        // Use all conditions for systems, or availableSystemTypes if you want to exclude default
        const conditionsForSystemSelection = weatherConditions; // Or availableSystemTypes
        
        conditionsForSystemSelection.forEach(condition => {
            const weight = weatherSettings[condition.id] || 0;
            // Ensure even 0% chance conditions could be chosen if it's the only one, or handle minimum weight
            for (let j = 0; j < weight; j++) {
                weightedWeatherArray.push(condition.id);
            }
        });
        
        let chosenWeatherId = defaultWeatherId; // Fallback
        if (weightedWeatherArray.length > 0) {
            const randomIndex = Math.floor(Math.random() * weightedWeatherArray.length);
            chosenWeatherId = weightedWeatherArray[randomIndex];
        } else if (conditionsForSystemSelection.length > 0) {
            // If weights are all zero, pick a random one from available system types
            chosenWeatherId = conditionsForSystemSelection[Math.floor(Math.random() * conditionsForSystemSelection.length)].id;
        }


        // Select Origin Hex
        const originHex = hexArray[Math.floor(Math.random() * hexArray.length)];

        // Determine Radius
        const radius = Math.floor(Math.random() * 3) + 2; // 2-4 hex radius

        const directionKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS);
        const randomDirectionKey = directionKeys[Math.floor(Math.random() * directionKeys.length)];
        const randomMovementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[randomDirectionKey];
        const randomSpeed = Math.random() < 0.3 ? 0 : (Math.floor(Math.random() * 2) + 1); // 30% chance stationary, else 1-2

        const newSystem = {
            id: 'system_' + Date.now() + '_' + i + Math.random().toString(36).substr(2, 5),
            weatherType: chosenWeatherId,
            hexesOccupied: new Set(),
            originHex: { col: originHex.col, row: originHex.row, id: originHex.id },
            radius: radius,
            intensity: 1.0, // Default intensity
            movementDirection: randomMovementDirection,
            speed: randomSpeed
        };

        // Populate hexesOccupied
        const occupiedCoords = HEX_UTILS.getHexesInRadius(originHex, newSystem.radius, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
        occupiedCoords.forEach(coord => newSystem.hexesOccupied.add(coord.id));
        
        appState.activeWeatherSystems.push(newSystem);
    }

    // 3. Update weatherGrid from activeWeatherSystems
    // This ensures later systems can override earlier ones in overlapping areas
    appState.activeWeatherSystems.forEach(system => {
        system.hexesOccupied.forEach(hexId => {
            if (appState.weatherGrid.hasOwnProperty(hexId)) { // Ensure hex exists in grid
                 appState.weatherGrid[hexId] = system.weatherType;
            }
        });
    });

    appState.isCurrentMapDirty = true;
    renderApp({ preserveScroll: true });

    // Spawn new systems periodically
    if (appState.isWeatherEnabled && appState.mapInitialized) {
        appState.timeSinceLastNewWeatherSystemSpawn += 1; // Assumes updateWeatherOverTime is called hourly
        if (appState.timeSinceLastNewWeatherSystemSpawn >= CONST.NEW_WEATHER_SYSTEM_SPAWN_INTERVAL_HOURS) {
            spawnNewWeatherSystem(); // This function will call renderApp again if a system is spawned
            appState.timeSinceLastNewWeatherSystemSpawn = 0;
        }
    }
}

export function spawnNewWeatherSystem() {
    if (!appState.isWeatherEnabled || 
        !appState.mapInitialized || 
        !appState.hexDataMap || 
        appState.hexDataMap.size === 0 ||
        appState.activeWeatherSystems.length >= CONST.MAX_ACTIVE_WEATHER_SYSTEMS) {
        return;
    }

    const { weatherSettings, weatherConditions, currentGridWidth, currentGridHeight } = appState;

    // 1. Select Weather Type for System (weighted random)
    const weightedWeatherArray = [];
    // Optionally filter out 'sunny' or other baseline weather for spawning systems
    const spawnableConditions = weatherConditions.filter(wc => wc.id !== 'sunny'); 
    const conditionsToUse = spawnableConditions.length > 0 ? spawnableConditions : weatherConditions; // Fallback to all if filter is too restrictive

    conditionsToUse.forEach(condition => {
        const weight = weatherSettings[condition.id] || 0;
        for (let i = 0; i < weight; i++) {
            weightedWeatherArray.push(condition.id);
        }
    });

    let chosenWeatherId = 'cloudy'; // Default spawn type if weighted random fails
    if (weightedWeatherArray.length > 0) {
        chosenWeatherId = weightedWeatherArray[Math.floor(Math.random() * weightedWeatherArray.length)];
    } else if (conditionsToUse.length > 0) {
        chosenWeatherId = conditionsToUse[Math.floor(Math.random() * conditionsToUse.length)].id;
    } else {
        console.warn("No suitable weather types available for spawning a new system.");
        return; // Cannot spawn if no types available
    }

    // 2. Select Origin Hex (Edge Spawning)
    let originCol, originRow;
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

    if (edge === 0) { // Top edge
        originRow = 0;
        originCol = Math.floor(Math.random() * currentGridWidth);
    } else if (edge === 1) { // Right edge
        originCol = currentGridWidth - 1;
        originRow = Math.floor(Math.random() * currentGridHeight);
    } else if (edge === 2) { // Bottom edge
        originRow = currentGridHeight - 1;
        originCol = Math.floor(Math.random() * currentGridWidth);
    } else { // Left edge (edge === 3)
        originCol = 0;
        originRow = Math.floor(Math.random() * currentGridHeight);
    }
    
    const originHexId = `${originCol}-${originRow}`;
    const originHexData = appState.hexDataMap.get(originHexId);

    if (!originHexData) {
        console.error(`Failed to find origin hex ${originHexId} for new weather system.`);
        return;
    }

    // 3. Determine Radius
    const radius = Math.floor(Math.random() * 2) + 2; // 2-3 radius

    // 4. Movement Direction
    const directionKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS).filter(k => k !== 'STATIONARY'); // Exclude stationary
    const randomDirectionKey = directionKeys[Math.floor(Math.random() * directionKeys.length)];
    const movementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[randomDirectionKey];
    
    // 5. Speed
    const speed = Math.floor(Math.random() * 2) + 1; // 1-2 speed

    const newSystem = {
        id: 'system_spawned_' + Date.now() + Math.random().toString(36).substr(2, 5),
        weatherType: chosenWeatherId,
        hexesOccupied: new Set(),
        originHex: { col: originCol, row: originRow, id: originHexId },
        radius: radius,
        intensity: 1.0,
        movementDirection: movementDirection,
        speed: speed
    };

    const occupiedCoords = HEX_UTILS.getHexesInRadius(originHexData, newSystem.radius, appState.hexDataMap, currentGridWidth, currentGridHeight);
    occupiedCoords.forEach(coord => newSystem.hexesOccupied.add(coord.id));

    appState.activeWeatherSystems.push(newSystem);

    // Update weatherGrid for the new system
    newSystem.hexesOccupied.forEach(hexId => {
        if (appState.weatherGrid.hasOwnProperty(hexId)) {
            appState.weatherGrid[hexId] = newSystem.weatherType;
        }
    });

    appState.isCurrentMapDirty = true;
    console.log("Spawned new weather system:", newSystem.id, "Type:", newSystem.weatherType, "at", originHexId);
    
    // renderApp({ preserveScroll: true }); // The calling function updateWeatherOverTime will render.
}

export function updateWeatherOverTime() {
    if (!appState.isWeatherEnabled || !appState.activeWeatherSystems || appState.activeWeatherSystems.length === 0) {
        if (appState.isWeatherEnabled && (!appState.activeWeatherSystems || appState.activeWeatherSystems.length === 0)) {
            // If weather is on but systems just dissipated, ensure grid reflects this (likely becomes all 'sunny')
            // This might be redundant if generateWeatherGrid was the last thing called,
            // but good for safety if updateWeatherOverTime could be called independently after systems are gone.
            const defaultWeatherId = 'sunny';
            let gridChangedByDissipation = false;
            appState.hexDataMap.forEach(hex => {
                if (appState.weatherGrid[hex.id] !== defaultWeatherId) {
                    appState.weatherGrid[hex.id] = defaultWeatherId;
                    gridChangedByDissipation = true;
                }
            });
            if (gridChangedByDissipation) {
                appState.isCurrentMapDirty = true; // The weather on hexes changed
                renderApp({ preserveScroll: true });
            }
        }
        return;
    }

    const updatedWeatherSystems = [];
    let weatherActuallyChanged = false;
    const initialSystemCount = appState.activeWeatherSystems.length;

    for (const system of appState.activeWeatherSystems) {
        let currentSystem = { ...system, hexesOccupied: new Set(system.hexesOccupied) }; // Deep enough copy for modification

        if (currentSystem.speed > 0 && currentSystem.movementDirection && (currentSystem.movementDirection.dCol !== 0 || currentSystem.movementDirection.dRow !== 0)) {
            weatherActuallyChanged = true;
            let newOriginCol = currentSystem.originHex.col;
            let newOriginRow = currentSystem.originHex.row;

            for (let step = 0; step < currentSystem.speed; step++) {
                const tempCol = newOriginCol + currentSystem.movementDirection.dCol;
                const tempRow = newOriginRow + currentSystem.movementDirection.dRow;

                if (tempCol < 0 || tempCol >= appState.currentGridWidth || tempRow < 0 || tempRow >= appState.currentGridHeight) {
                    currentSystem = null; // System moves off map and dissipates
                    break; 
                }
                newOriginCol = tempCol;
                newOriginRow = tempRow;
            }

            if (currentSystem) {
                currentSystem.originHex = { col: newOriginCol, row: newOriginRow, id: `${newOriginCol}-${newOriginRow}` }; // Update ID too
                
                const newOccupiedHexes = new Set();
                // Ensure originHex for getHexesInRadius is a valid hex object from hexDataMap if possible, or has col/row
                const centerHexDataForRadius = appState.hexDataMap.get(currentSystem.originHex.id) || currentSystem.originHex;

                const hexesInNewRadius = HEX_UTILS.getHexesInRadius(centerHexDataForRadius, currentSystem.radius, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
                hexesInNewRadius.forEach(h => newOccupiedHexes.add(h.id));
                currentSystem.hexesOccupied = newOccupiedHexes;
                updatedWeatherSystems.push(currentSystem);
            }
        } else {
            // System is stationary or has no movement data, keep it as is
            updatedWeatherSystems.push(currentSystem);
        }
    }

    appState.activeWeatherSystems = updatedWeatherSystems;

    // Storm Formation Logic (after movement, before grid rebuild & spawning)
    let systemsToRemoveAfterMerge = new Set();
    let systemsToAddAfterMerge = [];
    const currentSystemsForMerging = [...appState.activeWeatherSystems]; // Use the already updated list

    for (let i = 0; i < currentSystemsForMerging.length; i++) {
        for (let j = i + 1; j < currentSystemsForMerging.length; j++) {
            const system1 = currentSystemsForMerging[i];
            const system2 = currentSystemsForMerging[j];

            if (systemsToRemoveAfterMerge.has(system1.id) || systemsToRemoveAfterMerge.has(system2.id)) {
                continue;
            }

            if (system1.weatherType === 'rainy' && system2.weatherType === 'rainy') {
                const intersection = new Set([...system1.hexesOccupied].filter(hexId => system2.hexesOccupied.has(hexId)));
                const overlapThreshold = Math.min(system1.hexesOccupied.size, system2.hexesOccupied.size) * 0.3;
                
                if (intersection.size > overlapThreshold && intersection.size > 2) {
                    console.log("Rain systems merging into storm:", system1.id, system2.id);
                    weatherActuallyChanged = true; // A merge is a significant change
                    systemsToRemoveAfterMerge.add(system1.id);
                    systemsToRemoveAfterMerge.add(system2.id);

                    const stormOriginHex = system1.hexesOccupied.size >= system2.hexesOccupied.size ? system1.originHex : system2.originHex;
                    const stormRadius = Math.max(system1.radius, system2.radius) + 1;
                    const stormMovementDirection = system1.speed >= system2.speed ? system1.movementDirection : system2.movementDirection;
                    const stormSpeed = Math.max(1, Math.floor((system1.speed + system2.speed) / 2));
                    const stormHexes = new Set([...system1.hexesOccupied, ...system2.hexesOccupied]);

                    const newStormSystem = {
                        id: 'storm_' + Date.now() + Math.random().toString(36).substr(2, 9),
                        weatherType: 'stormy',
                        hexesOccupied: stormHexes,
                        originHex: stormOriginHex,
                        radius: stormRadius,
                        intensity: 1.2,
                        movementDirection: stormMovementDirection,
                        speed: stormSpeed
                    };
                    systemsToAddAfterMerge.push(newStormSystem);
                }
            }
        }
    }

    if (systemsToRemoveAfterMerge.size > 0 || systemsToAddAfterMerge.length > 0) {
        appState.activeWeatherSystems = appState.activeWeatherSystems.filter(sys => !systemsToRemoveAfterMerge.has(sys.id));
        appState.activeWeatherSystems.push(...systemsToAddAfterMerge);
        weatherActuallyChanged = true; // Merging or adding storms means weather changed
    }

    // Re-populate weatherGrid based on new system positions (and potential new storms)
    const defaultWeatherId = 'sunny'; // Or from a constant
    appState.hexDataMap.forEach(hex => {
        // Initialize or reset to default. Important if systems moved away or merged.
        appState.weatherGrid[hex.id] = defaultWeatherId;
    });

    appState.activeWeatherSystems.forEach(system => {
        system.hexesOccupied.forEach(hexId => {
            // Check if hexId is valid/exists in hexDataMap, though getHexesInRadius should ensure this.
            if (appState.hexDataMap.has(hexId)) {
                 appState.weatherGrid[hexId] = system.weatherType;
            }
        });
    });
    
    // If systems moved, or if any system dissipated (count changed)
    if (weatherActuallyChanged || appState.activeWeatherSystems.length !== initialSystemCount) {
        appState.isCurrentMapDirty = true;
    }

    renderApp({ preserveScroll: true });
}

export function getForecastedWeatherGrid(hoursAhead) {
    if (typeof hoursAhead !== 'number' || hoursAhead <= 0) {
        console.error("getForecastedWeatherGrid: hoursAhead must be a positive number.", hoursAhead);
        return null;
    }

    const defaultWeatherId = 'sunny';
    const baseGrid = {};
    appState.hexDataMap.forEach(hex => {
        baseGrid[hex.id] = defaultWeatherId;
    });

    if (!appState.isWeatherEnabled || !appState.activeWeatherSystems || appState.activeWeatherSystems.length === 0) {
        // If weather is off or no systems, forecast is just all default weather
        return baseGrid; 
    }

    // Deep copy systems for simulation
    let simulatedSystems = JSON.parse(JSON.stringify(appState.activeWeatherSystems));
    simulatedSystems.forEach(system => {
        system.hexesOccupied = new Set(system.hexesOccupied); // Convert array back to Set
    });

    for (let h = 1; h <= hoursAhead; h++) {
        let systemsAtThisHour = [];
        let weatherActuallyChangedThisHour = false; // To track if any system moved or merged in this specific hour

        // --- Movement Logic ---
        for (const system of simulatedSystems) {
            let currentSystem = { ...system, hexesOccupied: new Set(system.hexesOccupied) }; 

            if (currentSystem.speed > 0 && currentSystem.movementDirection && (currentSystem.movementDirection.dCol !== 0 || currentSystem.movementDirection.dRow !== 0)) {
                weatherActuallyChangedThisHour = true;
                let newOriginCol = currentSystem.originHex.col;
                let newOriginRow = currentSystem.originHex.row;

                for (let step = 0; step < currentSystem.speed; step++) {
                    const tempCol = newOriginCol + currentSystem.movementDirection.dCol;
                    const tempRow = newOriginRow + currentSystem.movementDirection.dRow;

                    if (tempCol < 0 || tempCol >= appState.currentGridWidth || tempRow < 0 || tempRow >= appState.currentGridHeight) {
                        currentSystem = null; 
                        break;
                    }
                    newOriginCol = tempCol;
                    newOriginRow = tempRow;
                }

                if (currentSystem) {
                    currentSystem.originHex = { col: newOriginCol, row: newOriginRow, id: `${newOriginCol}-${newOriginRow}` };
                    const newOccupiedHexes = new Set();
                    const centerHexDataForRadius = appState.hexDataMap.get(currentSystem.originHex.id) || currentSystem.originHex;
                    const hexesInNewRadius = HEX_UTILS.getHexesInRadius(centerHexDataForRadius, currentSystem.radius, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
                    hexesInNewRadius.forEach(h_item => newOccupiedHexes.add(h_item.id)); // Renamed h to h_item
                    currentSystem.hexesOccupied = newOccupiedHexes;
                    systemsAtThisHour.push(currentSystem);
                }
            } else {
                systemsAtThisHour.push(currentSystem);
            }
        }
        simulatedSystems = systemsAtThisHour;

        // --- Storm Formation Logic ---
        let systemsToRemoveAfterMerge = new Set();
        let systemsToAddAfterMerge = [];
        
        for (let i = 0; i < simulatedSystems.length; i++) {
            for (let j = i + 1; j < simulatedSystems.length; j++) {
                const system1 = simulatedSystems[i];
                const system2 = simulatedSystems[j];

                if (systemsToRemoveAfterMerge.has(system1.id) || systemsToRemoveAfterMerge.has(system2.id)) {
                    continue;
                }

                if (system1.weatherType === 'rainy' && system2.weatherType === 'rainy') {
                    const intersection = new Set([...system1.hexesOccupied].filter(hexId => system2.hexesOccupied.has(hexId)));
                    const overlapThreshold = Math.min(system1.hexesOccupied.size, system2.hexesOccupied.size) * 0.3;
                    
                    if (intersection.size > overlapThreshold && intersection.size > 2) {
                        weatherActuallyChangedThisHour = true;
                        systemsToRemoveAfterMerge.add(system1.id);
                        systemsToRemoveAfterMerge.add(system2.id);

                        const stormOriginHex = system1.hexesOccupied.size >= system2.hexesOccupied.size ? system1.originHex : system2.originHex;
                        const stormRadius = Math.max(system1.radius, system2.radius) + 1;
                        const stormMovementDirection = system1.speed >= system2.speed ? system1.movementDirection : system2.movementDirection;
                        const stormSpeed = Math.max(1, Math.floor((system1.speed + system2.speed) / 2));
                        const stormHexes = new Set([...system1.hexesOccupied, ...system2.hexesOccupied]);

                        const newStormSystem = {
                            id: 'storm_sim_' + Date.now() + '_' + h + '_' + i + '_' + j, // Ensure unique ID for simulation
                            weatherType: 'stormy',
                            hexesOccupied: stormHexes,
                            originHex: stormOriginHex,
                            radius: stormRadius,
                            intensity: 1.2,
                            movementDirection: stormMovementDirection,
                            speed: stormSpeed
                        };
                        systemsToAddAfterMerge.push(newStormSystem);
                    }
                }
            }
        }

        if (systemsToRemoveAfterMerge.size > 0 || systemsToAddAfterMerge.length > 0) {
            simulatedSystems = simulatedSystems.filter(sys => !systemsToRemoveAfterMerge.has(sys.id));
            simulatedSystems.push(...systemsToAddAfterMerge);
        }
        // Note: Spawning of entirely new systems is NOT part of this forecast simulation for simplicity.
        // If it were, it would happen here, for hour 'h'.
    }

    // Generate Final Forecast Grid from the state of simulatedSystems after all hours
    const forecastGrid = {};
    appState.hexDataMap.forEach(hex => {
        forecastGrid[hex.id] = defaultWeatherId;
    });
    simulatedSystems.forEach(system => {
        system.hexesOccupied.forEach(hexId => {
            if (forecastGrid.hasOwnProperty(hexId)) {
                 forecastGrid[hexId] = system.weatherType;
            }
        });
    });

    return forecastGrid;
}