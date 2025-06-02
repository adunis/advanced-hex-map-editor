// File: app/map-logic.js
import { appState } from './state.js';
import * as CONST from './constants.js';
import { WEATHER_UPDATE_INTERVAL_HOURS } from './constants.js';
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
    baseObserverRangeHexes = Math.max(weatherVisibilityMultiplier === 0 ? 0 : 1, baseObserverRangeHexes);

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

    let newlyDiscoveredHexesThisStep = new Set();
    if (appState.partyMarkerPosition && appState.hexDataMap.has(appState.partyMarkerPosition.id)) {
        appState.partyMarkerPosition = appState.hexDataMap.get(appState.partyMarkerPosition.id);
        const visibleFromMarker = calculateLineOfSight(appState.partyMarkerPosition.id, appState.hexDataMap);
        
        visibleFromMarker.forEach(id => {
            if (!appState.playerDiscoveredHexIds.has(id)) newlyDiscoveredHexesThisStep.add(id);
        });

        appState.playerCurrentVisibleHexIds = visibleFromMarker;
        if (newlyDiscoveredHexesThisStep.size > 0) {
            appState.playerDiscoveredHexIds = new Set([...appState.playerDiscoveredHexIds, ...newlyDiscoveredHexesThisStep]);
            appState.isCurrentMapDirty = true;
            // Encounter check for these new discoveries will happen in handleHexClick *after* movement is logged
        }
    } else {
        appState.playerCurrentVisibleHexIds = new Set();
    }
    return newlyDiscoveredHexesThisStep; // Return for immediate use in handleHexClick
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
                    featureOutcome = { hexId: originalHexId, name: newFeatureName, icon: newFeatureIcon, color: newFeatureIconColor, added: true };
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
    if (!appState.isGM) return { triggered: false, markedByGM: false };
    const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
    const chance = terrainConfig.encounterChanceOnEnter || 0;

    if (rollPercent(chance)) {
        HexplorationLogic.postHexplorationChatMessage(`System: Potential encounter upon entering hex ${targetHex.id} (${targetHex.terrain}). GM has been prompted.`, true);
        const details = await handleEncounterFeatureCreation(targetHex, `Entered ${targetHex.terrain}`);
        return { 
            triggered: true, 
            markedByGM: details.added, 
            featureName: details.name, 
            featureIcon: details.icon,
            reasonSkipped: !details.added ? details.reason : null
        };
    }
    return { triggered: false, markedByGM: false };
}

async function checkRandomEncountersOnDiscover(discoveredHexIdsSet) {
    if (!appState.isGM || !discoveredHexIdsSet || discoveredHexIdsSet.size === 0) return [];
    if (appState.appMode !== CONST.AppMode.PLAYER) return [];

    const createdFeaturesForLog = [];
    for (const hexId of discoveredHexIdsSet) {
        const hex = appState.hexDataMap.get(hexId);
        if (!hex) continue;
        const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[hex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
        const chance = terrainConfig.encounterChanceOnDiscover || 0;

        if (rollPercent(chance)) {
            HexplorationLogic.postHexplorationChatMessage(`System: Potential encounter noticed upon discovering hex ${hex.id} (${hex.terrain}). GM has been prompted.`, true);
            const details = await handleEncounterFeatureCreation(hex, `Discovered ${hex.terrain}`);
            if (details && details.hexId) { // Log attempt regardless of marking
                createdFeaturesForLog.push({
                    hexId: details.hexId,
                    triggered: true,
                    markedByGM: details.added,
                    featureName: details.name,
                    featureIcon: details.icon,
                    reasonSkipped: !details.added ? details.reason : null
                });
            }
        }
    }
    return createdFeaturesForLog;
}


export async function handleHexClick(row, col, isExploringCurrentHex = false) {
    if (!appState.mapInitialized && !appState.currentMapName) return;
    const clickedHexId = `${col}-${row}`;
    const targetHex = appState.hexDataMap.get(clickedHexId);
    if (!targetHex) { return; }
    if (!appState.isGM) return;

    if (appState.appMode === CONST.AppMode.PLAYER) {
        if (!isExploringCurrentHex && targetHex.id === appState.partyMarkerPosition?.id) return;
        const previousHex = appState.partyMarkerPosition;
        const oldPlayerDiscoveredHexIds = new Set(appState.playerDiscoveredHexIds);


        let baseTimeForHex = appState.currentMapHexTraversalTimeValue;
        const targetTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];

        let terrainTimeMultiplier = targetTerrainConfig.speedMultiplier;
        let activityTimeMultiplier = 1.0;
        if (appState.activePartyActivities.size > 0) {
            let maxPenalty = 1.0;
            appState.activePartyActivities.forEach(activityId => {
                const activityConf = CONST.PARTY_ACTIVITIES[activityId];
                if (activityConf && activityConf.movementPenaltyFactor > maxPenalty) {
                    maxPenalty = activityConf.movementPenaltyFactor;
                }
            });
            activityTimeMultiplier = maxPenalty;
        }
        
        let weatherTimeMultiplier = 1.0;
        let weatherOnHexDetails = null;
        if (appState.isWeatherEnabled && appState.weatherGrid && appState.weatherGrid[targetHex.id]) {
            const weatherId = appState.weatherGrid[targetHex.id];
            const weatherCondition = appState.weatherConditions.find(wc => wc.id === weatherId);
            if (weatherCondition) {
                weatherOnHexDetails = { id: weatherCondition.id, name: weatherCondition.name, icon: weatherCondition.icon };
                if (weatherCondition.effects && typeof weatherCondition.effects.travelSpeed === 'number') {
                    weatherTimeMultiplier = weatherCondition.effects.travelSpeed;
                }
            }
        }

        const timeAfterTerrain = baseTimeForHex * terrainTimeMultiplier;
        const terrainModifierEffect = timeAfterTerrain - baseTimeForHex;

        const timeAfterActivities = timeAfterTerrain * activityTimeMultiplier;
        const activityModifierEffect = timeAfterActivities - timeAfterTerrain;
        
        const timeAfterWeather = timeAfterActivities * weatherTimeMultiplier;
        const weatherModifierEffect = timeAfterWeather - timeAfterActivities;

        let elevationChange = 0;
        let elevationPenalty = 0;
        if (previousHex && !isExploringCurrentHex) {
            elevationChange = targetHex.elevation - previousHex.elevation;
            elevationPenalty = (Math.abs(elevationChange) / 100) * CONST.ELEVATION_TIME_PENALTY_FACTOR_PER_100M * baseTimeForHex; // Penalty based on base time
        }
        
        const totalCalculatedTime = timeAfterWeather + elevationPenalty;
        const finalTimeValue = Math.max(0.1, totalCalculatedTime);

        if (appState.isWeatherEnabled) {
            appState.timeSinceLastWeatherChange += finalTimeValue;
            if (appState.timeSinceLastWeatherChange >= WEATHER_UPDATE_INTERVAL_HOURS) {
                updateWeatherOverTime();
                appState.timeSinceLastWeatherChange %= WEATHER_UPDATE_INTERVAL_HOURS;
            }
        }

        if (!isExploringCurrentHex) {
            appState.partyMarkerPosition = targetHex;
        }
        
        const newlyDiscoveredHexesFromThisMove = updatePartyMarkerBasedLoS(); // This updates LOS and playerDiscoveredHexIds
        appState.isCurrentMapDirty = true;
        requestCenteringOnHex(targetHex.id);
        
        const encounterOnEnterDetails = await checkRandomEncountersOnEnter(targetHex);
        const encounterOnDiscoverDetails = await checkRandomEncountersOnDiscover(newlyDiscoveredHexesFromThisMove);

        const direction = getTravelDirection(previousHex, targetHex, isExploringCurrentHex);
        const travelLogEntry = {
            type: isExploringCurrentHex ? "exploration_current" : "movement",
            timestamp: new Date().toISOString(),
            fromHexId: isExploringCurrentHex ? targetHex.id : (previousHex ? previousHex.id : "N/A"),
            toHexId: targetHex.id,
            directionText: direction,
            distanceValue: isExploringCurrentHex ? 0 : appState.currentMapHexSizeValue,
            distanceUnit: appState.currentMapHexSizeUnit,
            timeBreakdown: {
                base: baseTimeForHex,
                terrainModifier: terrainModifierEffect,
                activityModifier: activityModifierEffect,
                weatherModifier: weatherModifierEffect,
                elevationPenalty: elevationPenalty,
                totalCalculated: totalCalculatedTime
            },
            totalTimeValue: finalTimeValue,
            timeUnit: appState.currentMapHexTraversalTimeUnit,
            terrainAtDestination: targetHex.terrain,
            elevationChange: elevationChange,
            weatherOnHex: weatherOnHexDetails,
            activitiesActive: Array.from(appState.activePartyActivities),
            encounterOnEnter: encounterOnEnterDetails,
            encountersOnDiscover: encounterOnDiscoverDetails, // Array of {hexId, triggered, markedByGM, ...}
            newlyDiscoveredHexIds: Array.from(newlyDiscoveredHexesFromThisMove)
        };

        if (!appState.currentMapEventLog) appState.currentMapEventLog = [];
        appState.currentMapEventLog.unshift(travelLogEntry);
        if (appState.currentMapEventLog.length > 100) appState.currentMapEventLog.pop(); // Increased log size

        let hoursCost = 0;
        if (appState.currentMapHexTraversalTimeUnit === 'hour') hoursCost = finalTimeValue;
        else if (appState.currentMapHexTraversalTimeUnit === 'minute') hoursCost = finalTimeValue / 60;
        else if (appState.currentMapHexTraversalTimeUnit === 'day') hoursCost = finalTimeValue * 24;
        
        let kmCost = 0;
        if (!isExploringCurrentHex) {
             if (appState.currentMapHexSizeUnit === 'km') kmCost = appState.currentMapHexSizeValue;
             else if (appState.currentMapHexSizeUnit === 'mi') kmCost = appState.currentMapHexSizeValue * 1.60934;
             else if (appState.currentMapHexSizeUnit === 'm') kmCost = appState.currentMapHexSizeValue / 1000;
        }
        const hexplorationActionType = isExploringCurrentHex ? `explore hex ${targetHex.id}` : `moveParty to ${targetHex.id}`;

        if (!appState.isStandaloneMode && window.parent && APP_MODULE_ID) {
             window.parent.postMessage({ type: 'gmPerformedHexplorationAction', payload: { action: hexplorationActionType, kmCost: kmCost, hoursCost: hoursCost, logEntry: travelLogEntry }, moduleId: APP_MODULE_ID }, '*');
        }
        if (appState.currentMapId && (!appState.isStandaloneMode || appState.isGM)) {
            handleSaveCurrentMap(true);
        }

        if (!(encounterOnEnterDetails.markedByGM || encounterOnDiscoverDetails.some(d => d.markedByGM))) {
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
                        else newHexData.terrain = CONST.TerrainType.PLAINS;
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
                    } else {
                        const selectedFeatureTypeConst = appState.selectedFeatureType;
                        const featureTypeToApplyLower = selectedFeatureTypeConst.toLowerCase();

                        if (targetHexCoords.id === clickedHexId &&
                            (selectedFeatureTypeConst === CONST.TerrainFeature.LANDMARK || selectedFeatureTypeConst === CONST.TerrainFeature.SECRET)) {

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
                            }
                        } else if (selectedFeatureTypeConst === CONST.TerrainFeature.NONE) {
                            if (newHexData.feature !== CONST.TerrainFeature.NONE.toLowerCase()) {
                                newHexData.feature = CONST.TerrainFeature.NONE.toLowerCase();
                                newHexData.featureName = "";
                                newHexData.featureIcon = null;
                                newHexData.featureIconColor = null;
                                hexSpecificChange = true;
                            }
                        } else if (selectedFeatureTypeConst !== CONST.TerrainFeature.LANDMARK && selectedFeatureTypeConst !== CONST.TerrainFeature.SECRET) {
                            if (newHexData.feature !== featureTypeToApplyLower) {
                                newHexData.feature = featureTypeToApplyLower;
                                newHexData.featureName = "";
                                newHexData.featureIcon = null;
                                newHexData.featureIconColor = null;
                                hexSpecificChange = true;
                            }
                        }
                    }
                    break;
            }
            if (hexSpecificChange) { interimHexDataMap.set(newHexData.id, newHexData); changedByBrushLoopOverall = true; }
        });

        if (requiresFeatureDetailsDialog) {
            appState.isWaitingForFeatureDetails = true;
            appState.featureDetailsCallback = (details) => {
                appState.isWaitingForFeatureDetails = false;
                const pendingInfo = appState.pendingFeaturePlacement;
                appState.pendingFeaturePlacement = null;
                appState.featureDetailsCallback = null;

                if (details && !details.cancelled && pendingInfo && details.hexId === pendingInfo.hexId) {
                    const hexToUpdate = appState.hexDataMap.get(details.hexId);
                    if (hexToUpdate) {
                        const updatedHex = {
                            ...hexToUpdate,
                            feature: pendingInfo.featureType,
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
                        renderApp({ preserveScroll: true });
                    }
                } else {
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
    if (!appState.mapInitialized || appState.appMode !== CONST.AppMode.HEX_EDITOR || !appState.paintMode || appState.paintMode === CONST.PaintMode.NONE) {
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

        let changed = newPreviewIds.size !== appState.brushPreviewHexIds.size;
        if (!changed) {
            for (const id of newPreviewIds) {
                if (!appState.brushPreviewHexIds.has(id)) {
                    changed = true;
                    break;
                }
            }
            if (!changed) {
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
    } else {
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
        renderApp({ preserveScroll: true });
        return;
    }

    appState.activeWeatherSystems = [];
    appState.weatherGrid = {};

    if (!appState.mapInitialized || !appState.hexDataMap || appState.hexDataMap.size === 0) {
        renderApp({ preserveScroll: true });
        return;
    }

    const defaultWeatherId = 'sunny';

    appState.hexDataMap.forEach(hex => {
        appState.weatherGrid[hex.id] = defaultWeatherId;
    });

    const numSystems = Math.floor(Math.random() * 3) + 1;

    const { weatherSettings, weatherConditions } = appState;
    const availableSystemTypes = weatherConditions.filter(wc => wc.id !== defaultWeatherId);

    if (availableSystemTypes.length === 0 && weatherConditions.find(wc => wc.id === defaultWeatherId) === undefined) {
    }
    
    const hexArray = Array.from(appState.hexDataMap.values());
    if (hexArray.length === 0) {
        renderApp({ preserveScroll: true });
        return;
    }

    for (let i = 0; i < numSystems; i++) {
        const weightedWeatherArray = [];
        const conditionsForSystemSelection = weatherConditions;
        
        conditionsForSystemSelection.forEach(condition => {
            const weight = weatherSettings[condition.id] || 0;
            for (let j = 0; j < weight; j++) {
                weightedWeatherArray.push(condition.id);
            }
        });
        
        let chosenWeatherId = defaultWeatherId;
        if (weightedWeatherArray.length > 0) {
            const randomIndex = Math.floor(Math.random() * weightedWeatherArray.length);
            chosenWeatherId = weightedWeatherArray[randomIndex];
        } else if (conditionsForSystemSelection.length > 0) {
            chosenWeatherId = conditionsForSystemSelection[Math.floor(Math.random() * conditionsForSystemSelection.length)].id;
        }


        const originHex = hexArray[Math.floor(Math.random() * hexArray.length)];
        const radius = Math.floor(Math.random() * 3) + 2;

        const directionKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS);
        const randomDirectionKey = directionKeys[Math.floor(Math.random() * directionKeys.length)];
        const randomMovementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[randomDirectionKey];
        const randomSpeed = Math.random() < 0.3 ? 0 : (Math.floor(Math.random() * 2) + 1);

        const newSystem = {
            id: 'system_' + Date.now() + '_' + i + Math.random().toString(36).substr(2, 5),
            weatherType: chosenWeatherId,
            hexesOccupied: new Set(),
            originHex: { col: originHex.col, row: originHex.row, id: originHex.id },
            radius: radius,
            intensity: 1.0,
            movementDirection: randomMovementDirection,
            speed: randomSpeed
        };

        const occupiedCoords = HEX_UTILS.getHexesInRadius(originHex, newSystem.radius, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
        occupiedCoords.forEach(coord => newSystem.hexesOccupied.add(coord.id));
        
        appState.activeWeatherSystems.push(newSystem);
    }

    appState.activeWeatherSystems.forEach(system => {
        system.hexesOccupied.forEach(hexId => {
            if (appState.weatherGrid.hasOwnProperty(hexId)) {
                 appState.weatherGrid[hexId] = system.weatherType;
            }
        });
    });

    appState.isCurrentMapDirty = true;
    renderApp({ preserveScroll: true });

    if (appState.isWeatherEnabled && appState.mapInitialized) {
        appState.timeSinceLastNewWeatherSystemSpawn += 1;
        if (appState.timeSinceLastNewWeatherSystemSpawn >= CONST.NEW_WEATHER_SYSTEM_SPAWN_INTERVAL_HOURS) {
            spawnNewWeatherSystem();
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

    const weightedWeatherArray = [];
    const spawnableConditions = weatherConditions.filter(wc => wc.id !== 'sunny'); 
    const conditionsToUse = spawnableConditions.length > 0 ? spawnableConditions : weatherConditions;

    conditionsToUse.forEach(condition => {
        const weight = weatherSettings[condition.id] || 0;
        for (let i = 0; i < weight; i++) {
            weightedWeatherArray.push(condition.id);
        }
    });

    let chosenWeatherId = 'cloudy';
    if (weightedWeatherArray.length > 0) {
        chosenWeatherId = weightedWeatherArray[Math.floor(Math.random() * weightedWeatherArray.length)];
    } else if (conditionsToUse.length > 0) {
        chosenWeatherId = conditionsToUse[Math.floor(Math.random() * conditionsToUse.length)].id;
    } else {
        return;
    }

    let originCol, originRow;
    const edge = Math.floor(Math.random() * 4);

    if (edge === 0) {
        originRow = 0;
        originCol = Math.floor(Math.random() * currentGridWidth);
    } else if (edge === 1) {
        originCol = currentGridWidth - 1;
        originRow = Math.floor(Math.random() * currentGridHeight);
    } else if (edge === 2) {
        originRow = currentGridHeight - 1;
        originCol = Math.floor(Math.random() * currentGridWidth);
    } else {
        originCol = 0;
        originRow = Math.floor(Math.random() * currentGridHeight);
    }
    
    const originHexId = `${originCol}-${originRow}`;
    const originHexData = appState.hexDataMap.get(originHexId);

    if (!originHexData) {
        return;
    }

    const radius = Math.floor(Math.random() * 2) + 2;
    const directionKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS).filter(k => k !== 'STATIONARY');
    const randomDirectionKey = directionKeys[Math.floor(Math.random() * directionKeys.length)];
    const movementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[randomDirectionKey];
    const speed = Math.floor(Math.random() * 2) + 1;

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

    newSystem.hexesOccupied.forEach(hexId => {
        if (appState.weatherGrid.hasOwnProperty(hexId)) {
            appState.weatherGrid[hexId] = newSystem.weatherType;
        }
    });

    appState.isCurrentMapDirty = true;
}

export function updateWeatherOverTime() {
    if (!appState.isWeatherEnabled || !appState.activeWeatherSystems || appState.activeWeatherSystems.length === 0) {
        if (appState.isWeatherEnabled && (!appState.activeWeatherSystems || appState.activeWeatherSystems.length === 0)) {
            const defaultWeatherId = 'sunny';
            let gridChangedByDissipation = false;
            appState.hexDataMap.forEach(hex => {
                if (appState.weatherGrid[hex.id] !== defaultWeatherId) {
                    appState.weatherGrid[hex.id] = defaultWeatherId;
                    gridChangedByDissipation = true;
                }
            });
            if (gridChangedByDissipation) {
                appState.isCurrentMapDirty = true;
                renderApp({ preserveScroll: true });
            }
        }
        return;
    }

    const updatedWeatherSystems = [];
    let weatherActuallyChanged = false;
    const initialSystemCount = appState.activeWeatherSystems.length;

    for (const system of appState.activeWeatherSystems) {
        let currentSystem = { ...system, hexesOccupied: new Set(system.hexesOccupied) };

        if (currentSystem.speed > 0 && currentSystem.movementDirection && (currentSystem.movementDirection.dCol !== 0 || currentSystem.movementDirection.dRow !== 0)) {
            weatherActuallyChanged = true;
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
                hexesInNewRadius.forEach(h => newOccupiedHexes.add(h.id));
                currentSystem.hexesOccupied = newOccupiedHexes;
                updatedWeatherSystems.push(currentSystem);
            }
        } else {
            updatedWeatherSystems.push(currentSystem);
        }
    }

    appState.activeWeatherSystems = updatedWeatherSystems;

    let systemsToRemoveAfterMerge = new Set();
    let systemsToAddAfterMerge = [];
    const currentSystemsForMerging = [...appState.activeWeatherSystems];

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
                    weatherActuallyChanged = true;
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
        weatherActuallyChanged = true;
    }

    const defaultWeatherId = 'sunny';
    appState.hexDataMap.forEach(hex => {
        appState.weatherGrid[hex.id] = defaultWeatherId;
    });

    appState.activeWeatherSystems.forEach(system => {
        system.hexesOccupied.forEach(hexId => {
            if (appState.hexDataMap.has(hexId)) {
                 appState.weatherGrid[hexId] = system.weatherType;
            }
        });
    });
    
    if (weatherActuallyChanged || appState.activeWeatherSystems.length !== initialSystemCount) {
        appState.isCurrentMapDirty = true;
    }

    renderApp({ preserveScroll: true });
}

export function getForecastedWeatherGrid(hoursAhead) {
    if (typeof hoursAhead !== 'number' || hoursAhead <= 0) {
        return null;
    }

    const defaultWeatherId = 'sunny';
    const baseGrid = {};
    appState.hexDataMap.forEach(hex => {
        baseGrid[hex.id] = defaultWeatherId;
    });

    if (!appState.isWeatherEnabled || !appState.activeWeatherSystems || appState.activeWeatherSystems.length === 0) {
        return baseGrid; 
    }

    let simulatedSystems = JSON.parse(JSON.stringify(appState.activeWeatherSystems));
    simulatedSystems.forEach(system => {
        system.hexesOccupied = new Set(system.hexesOccupied);
    });

    for (let h = 1; h <= hoursAhead; h++) {
        let systemsAtThisHour = [];

        for (const system of simulatedSystems) {
            let currentSystem = { ...system, hexesOccupied: new Set(system.hexesOccupied) }; 

            if (currentSystem.speed > 0 && currentSystem.movementDirection && (currentSystem.movementDirection.dCol !== 0 || currentSystem.movementDirection.dRow !== 0)) {
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
                    hexesInNewRadius.forEach(h_item => newOccupiedHexes.add(h_item.id));
                    currentSystem.hexesOccupied = newOccupiedHexes;
                    systemsAtThisHour.push(currentSystem);
                }
            } else {
                systemsAtThisHour.push(currentSystem);
            }
        }
        simulatedSystems = systemsAtThisHour;

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
                        systemsToRemoveAfterMerge.add(system1.id);
                        systemsToRemoveAfterMerge.add(system2.id);

                        const stormOriginHex = system1.hexesOccupied.size >= system2.hexesOccupied.size ? system1.originHex : system2.originHex;
                        const stormRadius = Math.max(system1.radius, system2.radius) + 1;
                        const stormMovementDirection = system1.speed >= system2.speed ? system1.movementDirection : system2.movementDirection;
                        const stormSpeed = Math.max(1, Math.floor((system1.speed + system2.speed) / 2));
                        const stormHexes = new Set([...system1.hexesOccupied, ...system2.hexesOccupied]);

                        const newStormSystem = {
                            id: 'storm_sim_' + Date.now() + '_' + h + '_' + i + '_' + j,
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
    }

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