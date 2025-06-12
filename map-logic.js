// app/map-logic.js

import { appState } from './state.js';
import * as CONST from './constants.js';
import * as HEX_UTILS from './hex-utils.js';
import { renderApp } from './ui.js';
import { handleSaveCurrentMap } from './map-management.js';
import * as HexplorationLogic from './hexploration-logic.js';
import * as WeatherLogic from './weather-logic.js';
import * as EncounterLogic from './encounter-logic.js';
import * as AnimationLogic from './animation-logic.js'; // Corrected import path

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');

// Re-export for external use if needed
export const { updateWeatherOverTime, getForecastedWeatherGrid, generateWeatherGrid, spawnNewWeatherSystem } = WeatherLogic;

// NEW HELPER FUNCTION to determine terrain based on elevation
function determineTerrainFromElevation(elevation) {
    // This is a simplified example. A more robust solution would involve
    // checking a predefined mapping of elevation bands to terrain types or
    // iterating through TERRAIN_TYPES_CONFIG to find suitable matches.
    // This example uses global thresholds from constants.js.
    // It does not currently consult CONST.AUTO_TERRAIN_IGNORE_TYPES.
    if (elevation >= CONST.MOUNTAIN_THRESHOLD) { // e.g., 600m
        // Consider what high-altitude terrain is most appropriate.
        // SNOW_CAPPED_MOUNTAIN implies snow; ALPINE_TUNDRA might be a more general high-altitude rock/sparse veg.
        // Using SNOW_CAPPED_MOUNTAIN for this example as it's clearly tied to high elevation in many contexts.
        return CONST.TerrainType.SNOW_CAPPED_MOUNTAIN;
    } else if (elevation >= CONST.HILLS_THRESHOLD) { // e.g., 300m
        return CONST.TerrainType.GRASSY_HILLS; // Or a generic 'Hills'
    } else if (elevation < -5) { // Example for shallow water/coastal areas. More refined logic might be needed.
                                // Check for specific negative thresholds if defined for different water bodies.
        return CONST.TerrainType.COASTAL_SHALLOWS; // Or a generic 'Water' type
    }
    // Default for low-lying land not meeting other criteria
    return CONST.TerrainType.ROLLING_PLAINS;
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
    
    // Fallback for non-cubic coords, just in case
    const dCol = nextHex.col - prevHex.col;
    const dRow = nextHex.row - prevHex.row;
    if (dCol === 0 && dRow < 0) return "North";
    if (dCol === 0 && dRow > 0) return "South";
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
    // UPDATED to use mapWeatherSystem
    if (appState.isWeatherEnabled && appState.mapWeatherSystem.weatherGrid && appState.mapWeatherSystem.weatherGrid[sourceHex.id]) {
        const weatherId = appState.mapWeatherSystem.weatherGrid[sourceHex.id];
        // Use CONST.DEFAULT_WEATHER_CONDITIONS for definitions
        const weatherCondition = CONST.DEFAULT_WEATHER_CONDITIONS.find(wc => wc.id === weatherId);
        if (weatherCondition && weatherCondition.effects && typeof weatherCondition.effects.visibilityMultiplier === 'number') {
            weatherVisibilityMultiplier = weatherCondition.effects.visibilityMultiplier;
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
        }
    } else {
        appState.playerCurrentVisibleHexIds = new Set();
    }
    return newlyDiscoveredHexesThisStep;
}

export async function handleHexClick(row, col, isExploringCurrentHex = false) {
    if (!appState.mapInitialized && !appState.currentMapName) return;
    const clickedHexId = `${col}-${row}`;
    const targetHex = appState.hexDataMap.get(clickedHexId);
    if (!targetHex || appState.travelAnimation.isActive) return;

    if (appState.appMode === CONST.AppMode.PLAYER) {
        if (!appState.isGM) return;

        if (!isExploringCurrentHex && targetHex.id === appState.partyMarkerPosition?.id) return;
        
        const previousHex = appState.partyMarkerPosition;
        const targetTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[targetHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];

        // Ensure activity-based speed factors are current
        HexplorationLogic.calculateEffectivePartySpeed(); 

        const originalBaseTimePerHex = appState.currentMapHexTraversalTimeValue;
        const timeUnit = appState.currentMapHexTraversalTimeUnit;
        
        let finalTimeValue;
        let timeBreakdown = {};
        let animationDurationMs;
         let activityModifierEffect = 0;
        let terrainModifierEffect = 0;
        let weatherModifierEffect = 0;
        let elevationPenaltyAbsolute = 0;
        let elevationChange = 0; // Also needed for logging in onTravelComplete
        let weatherOnHexDetails = null; // For logging weather details in onTravelComplete
        // ***** MODIFICATION END *****
        
  if (isExploringCurrentHex) {

    
            // --- Specific Time Cost for Exploring Current Hex ---
            // Let's define a base exploration time, e.g., 1 hour.
            // This can be modified by active party activities (e.g., Detailed Survey might take longer).
            let baseExplorationTime = 1.0; // Default to 1 unit of the map's traversal time unit
            // Adjust if the map's base traversal unit is not hours, or make this a constant
            if (timeUnit === 'minute') baseExplorationTime = 60;
            else if (timeUnit === 'day') baseExplorationTime = 1/24 * 8; // e.g. 8 hours of a day for thorough exploration

            const effectiveActivityMultiplier = (appState.calculatedSlowestIndividualTimeFactor * appState.calculatedCombinedGroupTimeFactor) || 1.0;
            finalTimeValue = baseExplorationTime * effectiveActivityMultiplier;
            finalTimeValue = Math.max(0.1, finalTimeValue); 

            // Assign to outer-scoped variables
            activityModifierEffect = finalTimeValue - baseExplorationTime;
            terrainModifierEffect = 0; // No terrain travel cost for exploring in place
            weatherModifierEffect = 0; // Weather might affect discovery, but not time cost here
            elevationPenaltyAbsolute = 0; // No elevation change
            elevationChange = 0; // Explicitly zero

            timeBreakdown = {
                base: baseExplorationTime, // Base time for the exploration activity itself
                activityModifier: finalTimeValue - baseExplorationTime, // Effect of activities on exploration time
                terrainModifier: 0, // Typically no specific terrain "travel" cost for just exploring in place
                weatherModifier: 0, // Weather might affect discovery, but not necessarily time spent in one spot unless severe
                elevationPenalty: 0, // No elevation change
                totalCalculated: finalTimeValue
            };
            animationDurationMs = 3000; // Short animation for exploring
        } else {
            // --- Time Cost for Traveling to a New Hex (existing logic) ---
            const effectiveActivityMultiplier = (appState.calculatedSlowestIndividualTimeFactor * appState.calculatedCombinedGroupTimeFactor) || 1.0;
            const timeAfterActivities = originalBaseTimePerHex * effectiveActivityMultiplier;
            activityModifierEffect = timeAfterActivities - originalBaseTimePerHex; // Assign to outer-scoped variable

            const terrainTimeMultiplier = targetTerrainConfig.speedMultiplier || 1.0;
            const timeAfterTerrain = timeAfterActivities * terrainTimeMultiplier;
            terrainModifierEffect = timeAfterTerrain - timeAfterActivities; // Assign to outer-scoped variable
            
            let weatherTimeMultiplier = 1.0;
            if (appState.isWeatherEnabled && appState.mapWeatherSystem.weatherGrid?.[targetHex.id]) {
                const weatherId = appState.mapWeatherSystem.weatherGrid[targetHex.id];
                const weatherCondition = CONST.DEFAULT_WEATHER_CONDITIONS.find(wc => wc.id === weatherId);
                if (weatherCondition?.effects?.travelSpeedMultiplier) {
                    weatherTimeMultiplier = weatherCondition.effects.travelSpeedMultiplier;
                    if (weatherTimeMultiplier <= 0) weatherTimeMultiplier = 999;
                }
            }
            const timeAfterWeather = timeAfterTerrain * weatherTimeMultiplier;
            const weatherModifierEffect = timeAfterWeather - timeAfterTerrain;
            
            let elevationChange = 0;
            let elevationPenaltyAbsolute = 0;
            if (previousHex) { // previousHex will be different from targetHex here
                elevationChange = targetHex.elevation - previousHex.elevation;
                elevationPenaltyAbsolute = (Math.abs(elevationChange) / 100) * CONST.ELEVATION_TIME_PENALTY_FACTOR_PER_100M * originalBaseTimePerHex;
            }
            
            const totalCalculatedTime = timeAfterWeather + elevationPenaltyAbsolute;
            finalTimeValue = Math.max(0.1, totalCalculatedTime);

            timeBreakdown = {
                base: originalBaseTimePerHex,
                activityModifier: activityModifierEffect,
                terrainModifier: terrainModifierEffect,
                weatherModifier: weatherModifierEffect,
                elevationPenalty: elevationPenaltyAbsolute,
                totalCalculated: finalTimeValue
            };

            let scaleFactorToMs = 1000; 
            if (timeUnit === 'hour') scaleFactorToMs = 60 * 60 * 1000;
            else if (timeUnit === 'minute') scaleFactorToMs = 60 * 1000;
            else if (timeUnit === 'day') scaleFactorToMs = 24 * 60 * 60 * 1000;
            const realWorldTravelMs = finalTimeValue * scaleFactorToMs;
            animationDurationMs = Math.max(500, Math.min(realWorldTravelMs, 5000));
        }
        

        const onTravelComplete = async () => {
            if (!isExploringCurrentHex) {
                appState.partyMarkerPosition = targetHex;
            }
            
            const newlyDiscoveredHexes = updatePartyMarkerBasedLoS();
            appState.isCurrentMapDirty = true;
            requestCenteringOnHex(targetHex.id);
            
            const encounterOnEnterDetails = await EncounterLogic.checkRandomEncountersOnEnter(targetHex);
            const encounterOnDiscoverDetails = await EncounterLogic.checkRandomEncountersOnDiscover(newlyDiscoveredHexes);
    
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
                    base: originalBaseTimePerHex,
                    activityModifier: activityModifierEffect, 
                    terrainModifier: terrainModifierEffect, 
                    weatherModifier: weatherModifierEffect, 
                    elevationPenalty: elevationPenaltyAbsolute, 
                    totalCalculated: finalTimeValue // Log the final effective time
                },
                totalTimeValue: finalTimeValue, // This is what's actually used for game time advancement
                timeUnit: appState.currentMapHexTraversalTimeUnit,
                terrainAtDestination: targetHex.terrain,
                terrainNameAtDestination: targetTerrainConfig.name,
                elevationChange: elevationChange,
                weatherOnHex: weatherOnHexDetails,
                activitiesActive: Array.from(appState.activePartyActivities, ([id, charName]) => ({ 
                    id, 
                    characterName: charName, 
                    activityName: CONST.PARTY_ACTIVITIES[id]?.name || id,
                    // Use movementPenaltyFactor as it's the current name in CONST for timeFactor
                    timeFactor: CONST.PARTY_ACTIVITIES[id]?.movementPenaltyFactor ?? CONST.PARTY_ACTIVITIES[id]?.timeFactor 
                })),
                encounterOnEnter: encounterOnEnterDetails,
                encountersOnDiscover: encounterOnDiscoverDetails,
                newlyDiscoveredHexIds: Array.from(newlyDiscoveredHexes)
            };
    
            if (!appState.currentMapEventLog) appState.currentMapEventLog = [];
            appState.currentMapEventLog.unshift(travelLogEntry);
            if (appState.currentMapEventLog.length > 100) appState.currentMapEventLog.pop();
    
            let hoursCost = finalTimeValue * (timeUnit === 'day' ? 24 : (timeUnit === 'minute' ? (1/60) : (timeUnit === 'second' ? (1/3600) : 1)));
            let kmCost = 0;
            if (!isExploringCurrentHex) {
                let distMultiplier = 1;
                if (appState.currentMapHexSizeUnit === 'mi') distMultiplier = 1.60934;
                else if (appState.currentMapHexSizeUnit === 'm') distMultiplier = 0.001;
                else if (appState.currentMapHexSizeUnit === 'ft') distMultiplier = 0.0003048;
                // Add other distance unit conversions if necessary
                kmCost = appState.currentMapHexSizeValue * distMultiplier;
            }
            
            if (!appState.isStandaloneMode && window.parent && APP_MODULE_ID) {
                window.parent.postMessage({ type: 'gmPerformedHexplorationAction', payload: { action: `move to ${targetHex.id}`, kmCost, hoursCost, logEntry: travelLogEntry }, moduleId: APP_MODULE_ID }, '*');
            } else if (appState.isStandaloneMode) { // Update local counters for standalone
                appState.hexplorationKmTraveledToday += kmCost;
                appState.hexplorationTimeElapsedHoursToday += hoursCost;
                // Simulate time of day advancement (very basic)
                const currentHours = parseInt(appState.currentTimeOfDay.split(':')[0]);
                const currentMinutes = parseInt(appState.currentTimeOfDay.split(':')[1].substring(0,2));
                let totalMinutes = currentHours * 60 + currentMinutes + (hoursCost * 60);
                let newDayHour = Math.floor(totalMinutes / 60) % 24;
                let newDayMinute = Math.round(totalMinutes % 60);
                appState.currentTimeOfDay = `${String(newDayHour).padStart(2, '0')}:${String(newDayMinute).padStart(2, '0')} ${newDayHour >= 12 ? 'PM' : 'AM'}`;
                HexplorationLogic.calculateEffectivePartySpeed(); // Update display text
            }
            
            if (appState.currentMapId) {
                handleSaveCurrentMap(true); // Autosave
            }
    
            if (!(encounterOnEnterDetails.markedByGM || encounterOnDiscoverDetails.some(d => d.markedByGM))) {
                renderApp(); // Render unless an encounter dialog is taking over
            }
        };

  if (animationDurationMs > 0) {
            AnimationLogic.startTravelAnimation(
                targetHex, // For exploring, targetHex is the current hex
                animationDurationMs, 
                onTravelComplete,
                isExploringCurrentHex // Pass the flag here
            );
        } else {
            await onTravelComplete();
        }
        return;
    }

    if (appState.appMode === CONST.AppMode.HEX_EDITOR) {
        if (!appState.isGM) return;

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
            const oldTerrain = newHexData.terrain; // Store old terrain for comparison

            switch (appState.paintMode) {
                case CONST.PaintMode.ELEVATION:
                    let newElevation;
                    const oldElevation = newHexData.elevation; // Store old elevation for comparison

                    if (appState.elevationBrushMode === CONST.ElevationBrushMode.INCREASE) {
                        newElevation = newHexData.elevation + appState.elevationBrushCustomStep;
                    } else if (appState.elevationBrushMode === CONST.ElevationBrushMode.DECREASE) {
                        newElevation = newHexData.elevation - appState.elevationBrushCustomStep;
                    } else if (appState.elevationBrushMode === CONST.ElevationBrushMode.SET_TO_VALUE) {
                        newElevation = appState.elevationBrushSetValue;
                    }
                    newHexData.elevation = Math.max(CONST.MIN_ELEVATION, Math.min(CONST.MAX_ELEVATION, newElevation));
                    
                    if (newHexData.elevation !== oldElevation) { // Check if elevation actually changed
                        hexSpecificChange = true;
                    }

                    // --- START OF AUTO-TERRAIN CHANGE LOGIC ---
                    if (appState.autoTerrainChangeOnElevation && newHexData.elevation !== oldElevation) { // Only if elevation actually changed
                        // Note: CONST.AUTO_TERRAIN_IGNORE_TYPES is currently defined to ignore ALL terrains.
                        // For this feature to be useful, AUTO_TERRAIN_IGNORE_TYPES should be an empty array
                        // or a specific list of terrains to preserve.
                        // This implementation currently does NOT consult AUTO_TERRAIN_IGNORE_TYPES for simplicity.
                        
                        const determinedNewTerrainType = determineTerrainFromElevation(newHexData.elevation);
                        if (newHexData.terrain !== determinedNewTerrainType) {
                            newHexData.terrain = determinedNewTerrainType;
                            hexSpecificChange = true; // Ensure change is flagged if terrain also changes
                        }
                    }
                    // --- END OF AUTO-TERRAIN CHANGE LOGIC ---
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
            if (hexSpecificChange) { 
                interimHexDataMap.set(newHexData.id, newHexData); 
                changedByBrushLoopOverall = true; 
            }
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
                if (featureName === null) { appState.featureDetailsCallback({ ...messagePayloadToBridge, cancelled: true }); return; }
                const featureIcon = prompt("Enter Landmark Icon (e.g., ★, 🌲, 🏛️):", messagePayloadToBridge.currentIcon || "★");
                if (featureIcon === null) { appState.featureDetailsCallback({ ...messagePayloadToBridge, cancelled: true }); return; }
                const featureIconColor = prompt("Enter Landmark Icon Color (e.g., fill-red-500):", messagePayloadToBridge.currentIconColor || "fill-yellow-400");
                if (featureIconColor === null) { appState.featureDetailsCallback({ ...messagePayloadToBridge, cancelled: true }); return; }
                appState.featureDetailsCallback({ ...messagePayloadToBridge, featureName, featureIcon, featureIconColor, cancelled: false });
            }
            return; 
        }

        if (changedByBrushLoopOverall) {
            appState.hexDataMap = interimHexDataMap; 
            appState.hexDataMap.forEach(h => { if(appState.hexGridData[h.row]?.[h.col]) appState.hexGridData[h.row][h.col] = h; });
            appState.isCurrentMapDirty = true; 
            if (appState.editorLosSourceHexId) appState.editorVisibleHexIds = calculateLineOfSight(appState.editorLosSourceHexId, appState.hexDataMap);
            updatePartyMarkerBasedLoS(); 
            renderApp({preserveScroll: true});
        }
    }
}

export function triggerPlayerDisorientation(durationMs) {
    if (!appState.isGM) {
        console.warn("AHME: Non-GM tried to trigger player disorientation.");
        return;
    }
    console.log(`%cAHME IFRAME (GM): Triggering player disorientation for ${durationMs}ms.`, "color: red; font-weight: bold;");
    AnimationLogic.startMapDisorientation(durationMs);
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

export function toggleEditorLosSelectMode() { 
    if (appState.appMode !== CONST.AppMode.HEX_EDITOR) {
        alert("LoS sim only in Hex Editor mode."); 
        return; 
    }
    appState.isEditorLosSelectMode = !appState.isEditorLosSelectMode; 
    if (appState.isEditorLosSelectMode) { 
        appState.editorLosSourceHexId = null; 
        appState.editorVisibleHexIds = new Set(); 
        alert("Editor LoS Mode: Click hex for LoS source.");
    } 
    renderApp();
}

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
    if (!svgScrollContainer || isNaN(unscaledContentWidth) || isNaN(unscaledContentHeight) || unscaledContentWidth <= 0 || unscaledContentHeight <= 0) return null;

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
        const affectedHexes = HEX_UTILS.getHexesInRadius(hoveredHex, appState.brushSize, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
        const newPreviewIds = new Set(affectedHexes.map(h => h.id));

        const oldSize = appState.brushPreviewHexIds.size;
        const newSize = newPreviewIds.size;
        let changed = oldSize !== newSize;
        if (!changed && newSize > 0) {
            changed = !([...newPreviewIds].every(id => appState.brushPreviewHexIds.has(id)));
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

// --- Animation Logic ---
// All animation logic (startTravelAnimation, performAnimationStep, stopTravelAnimation,
// syncTravelAnimationStateToFoundry, runPlayerAnimationLoop, stopPlayerAnimationLoop)
// has been moved to animaiton-logic.js and is imported as AnimationLogic.