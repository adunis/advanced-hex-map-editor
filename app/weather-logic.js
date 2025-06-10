// weather-logic.js

import { appState } from './state.js'; // Still needed for some top-level functions
import * as CONST from './constants.js';
import * as HEX_UTILS from './hex-utils.js';
import { renderApp } from './ui.js';

// determineFallbackWeather: (as previously corrected - uses weights dynamically)
function determineFallbackWeather(weatherTypeWeights, availableWeatherTypes) {
    if (!availableWeatherTypes || availableWeatherTypes.length === 0) return 'sunny'; 
    let highestWeight = -1; let candidatesWithHighestWeight = [];
    for (const typeId of availableWeatherTypes) {
        const weight = weatherTypeWeights[typeId] || 0;
        if (weight > highestWeight) highestWeight = weight;
    }
    if (highestWeight <= 0) {
        if (availableWeatherTypes.includes('cloudy')) return 'cloudy';
        if (availableWeatherTypes.includes('sunny')) return 'sunny';
        return availableWeatherTypes[0];
    }
    for (const typeId of availableWeatherTypes) {
        if ((weatherTypeWeights[typeId] || 0) === highestWeight) candidatesWithHighestWeight.push(typeId);
    }
    if (candidatesWithHighestWeight.length > 0) return candidatesWithHighestWeight[Math.floor(Math.random() * candidatesWithHighestWeight.length)];
    console.warn("AHME WeatherLogic: determineFallbackWeather reached an unexpected state. Defaulting.");
    if (availableWeatherTypes.includes('cloudy')) return 'cloudy';
    if (availableWeatherTypes.includes('sunny')) return 'sunny';
    return availableWeatherTypes[0];
}


/**
 * Helper function for _simulateWeatherSystemsForDuration to attempt spawning a new system
 * during the simulation. This function is PURE regarding appState, operating on passed parameters.
 */
function _trySpawnSystemForSimulation(
    currentSimulatedSystemsList, // The current list of systems *within the simulation*
    mapWeatherConfig,            // An object containing { availableWeatherTypes, weatherTypeWeights } for THIS map
    hexDataMapForSim,            // The hex data map
    gridW, gridH,
    simHour,                     // For unique ID generation
    windStrengthKey, windDirKey   // Pass current wind for new cluster movement
) {
    if (currentSimulatedSystemsList.length >= CONST.MAX_ACTIVE_WEATHER_SYSTEMS) {
        return null;
    }

    const { availableWeatherTypes, weatherTypeWeights } = mapWeatherConfig;
    const allGlobalConditions = CONST.DEFAULT_WEATHER_CONDITIONS;

    const spawnableMapConditions = allGlobalConditions.filter(cond => 
        availableWeatherTypes.includes(cond.id) && 
        cond.id !== 'sunny' && // Don't spawn 'sunny' systems explicitly
        (weatherTypeWeights[cond.id] || 0) > 0 // Only spawn types with a weight > 0
    );

    if (spawnableMapConditions.length === 0) return null;

    const weightedWeatherArray = [];
    spawnableMapConditions.forEach(condition => {
        const weight = weatherTypeWeights[condition.id] || 0;
        for (let i = 0; i < weight; i++) weightedWeatherArray.push(condition.id);
    });

    let chosenWeatherId;
    if (weightedWeatherArray.length > 0) {
        chosenWeatherId = weightedWeatherArray[Math.floor(Math.random() * weightedWeatherArray.length)];
    } else {
        return null; // Should not happen if spawnableMapConditions is not empty
    }
    
    let originCol, originRow;
    const edge = Math.floor(Math.random() * 4); 
    const spawnMargin = 2; // Slightly smaller margin for simulation to ensure it hits map
    if (edge === 0) { originRow = -spawnMargin; originCol = Math.floor(Math.random() * gridW); }
    else if (edge === 1) { originCol = gridW - 1 + spawnMargin; originRow = Math.floor(Math.random() * gridH); }
    else if (edge === 2) { originRow = gridH - 1 + spawnMargin; originCol = Math.floor(Math.random() * gridW); }
    else { originCol = -spawnMargin; originRow = Math.floor(Math.random() * gridH); }
    
    const originHexId = `sim_spawn_o_${originCol}-${originRow}_h${simHour}`;
    const tempOriginHexForCalc = {col: originCol, row:originRow, id:originHexId, ...HEX_UTILS.offsetToCube(originCol, originRow)};
    const radius = Math.floor(Math.random() * 2) + 2; // e.g. 2-3

    const weatherDef = allGlobalConditions.find(wc => wc.id === chosenWeatherId);
    let systemMovementDirection, systemSpeed;
    const windStrengthDetails = CONST.WIND_STRENGTHS[windStrengthKey];
    const windDirectionDetails = CONST.WIND_DIRECTIONS[windDirKey];

    if (weatherDef && weatherDef.type === 'cluster') {
        systemSpeed = windStrengthDetails ? windStrengthDetails.speedHexesPerHour : 0;
        systemMovementDirection = windDirectionDetails ? { dCol: windDirectionDetails.dCol, dRow: windDirectionDetails.dRow, name: windDirectionDetails.name } : CONST.WIND_DIRECTIONS.CALM;
        if (systemSpeed === 0 && systemMovementDirection.name === 'Calm') systemSpeed = 0; 
        else if (systemSpeed === 0 && systemMovementDirection.name !== 'Calm') systemSpeed = 1; 
    } else { 
        const targetCenterCol = Math.floor(gridW / 2); const targetCenterRow = Math.floor(gridH / 2);
        let dCol = Math.sign(targetCenterCol - originCol); let dRow = Math.sign(targetCenterRow - originRow);
        if (dCol === 0 && dRow === 0) { 
            const dirKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS).filter(k => k !== 'STATIONARY');
            systemMovementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[dirKeys[Math.floor(Math.random() * dirKeys.length)]];
        } else {
            let bestMatchDirKey = 'STATIONARY'; let minDiff = Infinity;
            for(const dirKey in CONST.WEATHER_MOVEMENT_DIRECTIONS){
                const dir = CONST.WEATHER_MOVEMENT_DIRECTIONS[dirKey];
                if (dir.name === 'Stationary' && (dCol !==0 || dRow !== 0)) continue;
                const diff = Math.abs(dCol - dir.dCol) + Math.abs(dRow - dir.dRow);
                if(diff < minDiff){ minDiff = diff; bestMatchDirKey = dirKey; }
                else if (diff === minDiff && bestMatchDirKey === 'STATIONARY' && dir.name !== 'Stationary') bestMatchDirKey = dirKey;
            } systemMovementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[bestMatchDirKey];
        }
        systemSpeed = systemMovementDirection.name === 'Stationary' ? 0 : (Math.floor(Math.random() * 2) + 1);
    }

    const newSystem = {
        id: `system_sim_spawn_${Date.now()}_h${simHour}_${Math.random().toString(36).substring(2,7)}`,
        weatherType: chosenWeatherId, hexesOccupied: new Set(), originHex: { col: originCol, row: originRow, id: originHexId },
        radius: radius, intensity: 1.0, movementDirection: systemMovementDirection, speed: systemSpeed
    };

    const occupiedCoords = HEX_UTILS.getHexesInRadius(tempOriginHexForCalc, newSystem.radius, hexDataMapForSim, gridW, gridH);
    occupiedCoords.forEach(coord => newSystem.hexesOccupied.add(coord.id));
    
    return newSystem.hexesOccupied.size > 0 ? newSystem : null;
}


/**
 * Simulates weather system movement, interaction, AND SPAWNING over a given duration.
 * This function is PURE regarding appState, operating on copies and passed parameters.
 */
function _simulateWeatherSystemsForDuration(initialSystems, hoursToSimulate, mapWeatherConfigForSim, hexDataMapForSim, gridW, gridH) {
    if (!mapWeatherConfigForSim || !hexDataMapForSim || initialSystems === null || initialSystems === undefined) {
        console.warn("_simulateWeatherSystemsForDuration: Missing critical parameters.");
        return [];
    }

    let simulatedSystems = initialSystems.map(system => ({
        ...system,
        hexesOccupied: new Set(system.hexesOccupied || []),
        originHex: system.originHex ? { ...system.originHex } : {col:0, row:0, id:"0-0"},
        movementDirection: system.movementDirection ? { ...system.movementDirection } : {dCol:0, dRow:0, name: 'Stationary'},
    }));

    // Get wind details from the passed mapWeatherConfigForSim
    // This config represents the state of the map's weather settings AT THE START of the forecast.
    const windStrengthDetails = CONST.WIND_STRENGTHS[mapWeatherConfigForSim.windStrength];
    const windDirectionDetails = CONST.WIND_DIRECTIONS[mapWeatherConfigForSim.windDirection];
    const windHexesPerHour = windStrengthDetails ? windStrengthDetails.speedHexesPerHour : 0;
    const windMove = windDirectionDetails ? { dCol: windDirectionDetails.dCol, dRow: windDirectionDetails.dRow, name: windDirectionDetails.name } : CONST.WIND_DIRECTIONS.CALM;

    let simulatedTimeSinceLastSpawn = 0; 

    for (let h = 1; h <= hoursToSimulate; h++) {
        let systemsAfterMovementThisHour = []; 
        for (const system of simulatedSystems) { 
            let currentSystemInstance = { ...system, hexesOccupied: new Set(system.hexesOccupied) };
            const weatherDef = CONST.DEFAULT_WEATHER_CONDITIONS.find(wc => wc.id === currentSystemInstance.weatherType);
            let moveSpeed = currentSystemInstance.speed; 
            let moveDirection = currentSystemInstance.movementDirection;

            // Apply wind to clusters for THIS simulation step
            if (weatherDef && weatherDef.type === 'cluster') { 
                moveSpeed = windHexesPerHour;       // Use wind speed for this hour
                moveDirection = windMove;           // Use wind direction for this hour
                if (windHexesPerHour === 0 || (windDirectionDetails && windDirectionDetails.name === 'Calm')) {
                    moveSpeed = 0; 
                }
            }

            if (moveSpeed > 0 && moveDirection && (moveDirection.dCol !== 0 || moveDirection.dRow !== 0)) {
                // ... (movement logic as before) ...
                if (!currentSystemInstance.originHex || typeof currentSystemInstance.originHex.col !== 'number') { /* basic validation */ }
                const tempCol = currentSystemInstance.originHex.col + moveDirection.dCol * moveSpeed;
                const tempRow = currentSystemInstance.originHex.row + moveDirection.dRow * moveSpeed;
                if (tempCol < -(currentSystemInstance.radius + 2) || tempCol >= gridW + (currentSystemInstance.radius + 2) ||
                    tempRow < -(currentSystemInstance.radius + 2) || tempRow >= gridH + (currentSystemInstance.radius + 2)) {
                    continue; 
                }
                currentSystemInstance.originHex = { col: tempCol, row: tempRow, id: `${tempCol}-${tempRow}` };
                const newOccupiedHexes = new Set();
                let centerHexForRadiusCalc = hexDataMapForSim.get(currentSystemInstance.originHex.id);
                if (!centerHexForRadiusCalc) { 
                    centerHexForRadiusCalc = { ...currentSystemInstance.originHex, ...HEX_UTILS.offsetToCube(currentSystemInstance.originHex.col, currentSystemInstance.originHex.row) };
                }
                const hexesInNewRadius = HEX_UTILS.getHexesInRadius(centerHexForRadiusCalc, currentSystemInstance.radius, hexDataMapForSim, gridW, gridH);
                hexesInNewRadius.forEach(h_item => newOccupiedHexes.add(h_item.id));
                currentSystemInstance.hexesOccupied = newOccupiedHexes;
                if (currentSystemInstance.hexesOccupied.size > 0) systemsAfterMovementThisHour.push(currentSystemInstance);
            } else { systemsAfterMovementThisHour.push(currentSystemInstance); }
        }
        simulatedSystems = systemsAfterMovementThisHour; 

        // Merge Logic
        let systemsToRemoveAfterMerge = new Set(); let systemsToAddAfterMerge = [];
        const systemsToCheckMerge = [...simulatedSystems]; 
        for (let i = 0; i < systemsToCheckMerge.length; i++) {
            for (let j = i + 1; j < systemsToCheckMerge.length; j++) {
                // ... (merge logic as before, creating 'stormy' systems) ...
                // IMPORTANT: When a new storm is created from merging, its initial movement
                // should ALSO be based on the wind parameters (windMove, windHexesPerHour)
                // if 'stormy' is a cluster type. This was already correctly handled.
                const system1 = systemsToCheckMerge[i]; const system2 = systemsToCheckMerge[j];
                if (systemsToRemoveAfterMerge.has(system1.id) || systemsToRemoveAfterMerge.has(system2.id)) continue;
                const s1Def = CONST.DEFAULT_WEATHER_CONDITIONS.find(wc => wc.id === system1.weatherType);
                const s2Def = CONST.DEFAULT_WEATHER_CONDITIONS.find(wc => wc.id === system2.weatherType);
                if (s1Def && s1Def.id === 'rainy' && s2Def && s2Def.id === 'rainy') { 
                    const intersection = new Set([...(system1.hexesOccupied || [])].filter(hexId => (system2.hexesOccupied || new Set()).has(hexId)));
                    const s1OccupiedSize = system1.hexesOccupied ? system1.hexesOccupied.size : 0;
                    const s2OccupiedSize = system2.hexesOccupied ? system2.hexesOccupied.size : 0;
                    if (s1OccupiedSize === 0 || s2OccupiedSize === 0) continue;
                    const overlapThreshold = Math.min(s1OccupiedSize, s2OccupiedSize) * 0.3;
                    if (intersection.size > overlapThreshold && intersection.size > 1) {
                        systemsToRemoveAfterMerge.add(system1.id); systemsToRemoveAfterMerge.add(system2.id);
                        const stormOriginHex = s1OccupiedSize >= s2OccupiedSize ? system1.originHex : system2.originHex;
                        const stormRadius = Math.max(system1.radius, system2.radius) + 1; 
                        let stormMovementDirection, stormSpeed;
                        const stormDef = CONST.DEFAULT_WEATHER_CONDITIONS.find(wc => wc.id === 'stormy');
                        if (stormDef && stormDef.type === 'cluster') { // Merged storm follows current wind
                            stormMovementDirection = windMove; 
                            stormSpeed = windHexesPerHour;
                            if (stormSpeed === 0 && (stormMovementDirection && stormMovementDirection.name === 'Calm')) stormSpeed = 0;
                            else if (stormSpeed === 0) stormSpeed = 1; 
                        } else { 
                           stormMovementDirection = system1.speed >= system2.speed ? system1.movementDirection : system2.movementDirection;
                           stormSpeed = Math.max(1, Math.floor((system1.speed + system2.speed) / 2));
                        }
                        const stormHexes = new Set([...(system1.hexesOccupied || []), ...(system2.hexesOccupied || [])]);
                        const newStormSystem = {
                            id: `storm_sim_${Date.now()}_${h}_${i}_${j}`, weatherType: 'stormy', hexesOccupied: stormHexes,
                            originHex: stormOriginHex, radius: stormRadius, intensity: ((system1.intensity||1) + (system2.intensity||1)) / 2 * 1.2,
                            movementDirection: stormMovementDirection, speed: stormSpeed
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

        // Simulated Spawning Logic for hour `h`
        simulatedTimeSinceLastSpawn++;
        if (simulatedTimeSinceLastSpawn >= CONST.NEW_WEATHER_SYSTEM_SPAWN_INTERVAL_HOURS) {
            if (simulatedSystems.length < CONST.MAX_ACTIVE_WEATHER_SYSTEMS) {
                const newlySpawnedSystem = _trySpawnSystemForSimulation(
                    simulatedSystems,      
                    mapWeatherConfigForSim, // Pass the consistent map weather config
                    hexDataMapForSim, 
                    gridW, gridH, 
                    h,
                    mapWeatherConfigForSim.windStrength,  // <<< Pass current windStrength key
                    mapWeatherConfigForSim.windDirection // <<< Pass current windDirection key
                );
                if (newlySpawnedSystem) {
                    simulatedSystems.push(newlySpawnedSystem);
                    // console.log(`%cSIM FORECAST: Spawned ${newlySpawnedSystem.id} (${newlySpawnedSystem.weatherType}) at sim hour ${h}`, "color: cyan");
                }
            }
            simulatedTimeSinceLastSpawn = 0; 
        }
    } 
    return simulatedSystems;
}



// --- EXPORTED FUNCTIONS ---

export function applyActiveSystemsToGrid() {
    // ... (Implementation as previously corrected - uses determineFallbackWeather)
    if (!appState.isWeatherEnabled && Object.keys(appState.mapWeatherSystem.weatherGrid || {}).length === 0 && (appState.mapWeatherSystem.activeWeatherSystems || []).length === 0) {
        return false;
    }
    if (!appState.mapInitialized || !appState.hexDataMap || appState.hexDataMap.size === 0) {
        return false; 
    }
    const { weatherTypeWeights, availableWeatherTypes } = appState.mapWeatherSystem;
    const fallbackWeatherId = determineFallbackWeather(weatherTypeWeights, availableWeatherTypes);
    let gridChanged = false;
    if (!appState.isWeatherEnabled) {
        appState.hexDataMap.forEach(hex => {
            if (appState.mapWeatherSystem.weatherGrid[hex.id] !== fallbackWeatherId) {
                appState.mapWeatherSystem.weatherGrid[hex.id] = fallbackWeatherId;
                gridChanged = true;
            }
        });
        if ((appState.mapWeatherSystem.activeWeatherSystems || []).length > 0) {
            appState.mapWeatherSystem.activeWeatherSystems = [];
            gridChanged = true; 
        }
        if (gridChanged) appState.isCurrentMapDirty = true;
        return gridChanged;
    }
    const newGridFromSystems = {};
    appState.hexDataMap.forEach(hex => { newGridFromSystems[hex.id] = fallbackWeatherId; });
    (appState.mapWeatherSystem.activeWeatherSystems || []).forEach(system => {
        if (system.hexesOccupied && system.hexesOccupied.size > 0) {
            system.hexesOccupied.forEach(hexId => {
                if (newGridFromSystems.hasOwnProperty(hexId)) { newGridFromSystems[hexId] = system.weatherType; }
            });
        }
    });
    appState.hexDataMap.forEach(hex => {
        const currentHexWeatherInGrid = appState.mapWeatherSystem.weatherGrid ? appState.mapWeatherSystem.weatherGrid[hex.id] : undefined;
        const newCalculatedHexWeather = newGridFromSystems[hex.id];
        if (!appState.mapWeatherSystem.weatherGrid.hasOwnProperty(hex.id) || currentHexWeatherInGrid !== newCalculatedHexWeather) {
            appState.mapWeatherSystem.weatherGrid[hex.id] = newCalculatedHexWeather;
            gridChanged = true;
        }
    });
    if (gridChanged) appState.isCurrentMapDirty = true;
    return gridChanged;
}

export function generateWeatherGrid() {
    // ... (Implementation as previously corrected - uses determineFallbackWeather & applyActiveSystemsToGrid)
     if (!appState.isWeatherEnabled) {
        appState.mapWeatherSystem.weatherGrid = {}; appState.mapWeatherSystem.activeWeatherSystems = [];
        applyActiveSystemsToGrid(); renderApp({ preserveScroll: true }); return;
    }
    console.log("%cAHME WeatherLogic: Regenerating new weather grid and systems.", "color: orange; font-weight:bold;");
    appState.mapWeatherSystem.activeWeatherSystems = []; 
    if (!appState.mapInitialized || !appState.hexDataMap || appState.hexDataMap.size === 0) {
        applyActiveSystemsToGrid(); renderApp({ preserveScroll: true }); return;
    }
    const { availableWeatherTypes, weatherTypeWeights } = appState.mapWeatherSystem;
    const allGlobalConditions = CONST.DEFAULT_WEATHER_CONDITIONS;
    const spawnableMapConditions = allGlobalConditions.filter(cond => 
        availableWeatherTypes.includes(cond.id) && cond.id !== 'sunny' && (weatherTypeWeights[cond.id] || 0) > 0
    );
    if (spawnableMapConditions.length === 0) {
        console.warn("AHME WeatherLogic: No weather types have weight > 0 for spawning systems. Grid will be fallback weather.");
        applyActiveSystemsToGrid(); appState.isCurrentMapDirty = true; 
        renderApp({ preserveScroll: true }); return;
    }
    const numSystemsToAttempt = Math.max(1, Math.floor(Math.random() * (CONST.MAX_ACTIVE_WEATHER_SYSTEMS / 2)) + 1);
    const hexArray = Array.from(appState.hexDataMap.values());
    for (let i = 0; i < numSystemsToAttempt && appState.mapWeatherSystem.activeWeatherSystems.length < CONST.MAX_ACTIVE_WEATHER_SYSTEMS; i++) {
        const weightedWeatherArray = [];
        spawnableMapConditions.forEach(condition => {
            const weight = weatherTypeWeights[condition.id] || 0;
            for (let j = 0; j < weight; j++) weightedWeatherArray.push(condition.id);
        });
        let chosenWeatherId; 
        if (weightedWeatherArray.length > 0) chosenWeatherId = weightedWeatherArray[Math.floor(Math.random() * weightedWeatherArray.length)];
        else { console.warn("AHME WeatherLogic: generateWeatherGrid - weightedWeatherArray empty."); continue; }
        const originHex = hexArray[Math.floor(Math.random() * hexArray.length)];
        const radius = Math.floor(Math.random() * 3) + 2; 
        const weatherDef = allGlobalConditions.find(wc => wc.id === chosenWeatherId);
        let systemMovementDirection, systemSpeed;
        const windStrengthDetails = CONST.WIND_STRENGTHS[appState.mapWeatherSystem.windStrength];
        const windDirectionDetails = CONST.WIND_DIRECTIONS[appState.mapWeatherSystem.windDirection];
        if (weatherDef && weatherDef.type === 'cluster') {
            systemSpeed = windStrengthDetails ? windStrengthDetails.speedHexesPerHour : 0;
            systemMovementDirection = windDirectionDetails ? { dCol: windDirectionDetails.dCol, dRow: windDirectionDetails.dRow, name: windDirectionDetails.name } : CONST.WIND_DIRECTIONS.CALM;
            if (systemSpeed === 0 && systemMovementDirection.name === 'Calm') systemSpeed = 0; 
            else if (systemSpeed === 0) systemSpeed = 1; 
        } else {
            const directionKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS);
            const randomDirectionKey = directionKeys[Math.floor(Math.random() * directionKeys.length)];
            systemMovementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[randomDirectionKey];
            systemSpeed = (randomDirectionKey === 'STATIONARY' || Math.random() < 0.3) ? 0 : (Math.floor(Math.random() * 2) + 1);
        }
        const newSystem = {
            id: `system_gen_${Date.now()}_${i}`, weatherType: chosenWeatherId, hexesOccupied: new Set(),
            originHex: { col: originHex.col, row: originHex.row, id: originHex.id }, radius: radius, intensity: 1.0, 
            movementDirection: systemMovementDirection, speed: systemSpeed
        };
        const occupiedCoords = HEX_UTILS.getHexesInRadius(originHex, newSystem.radius, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
        occupiedCoords.forEach(coord => newSystem.hexesOccupied.add(coord.id));
        if (newSystem.hexesOccupied.size > 0) appState.mapWeatherSystem.activeWeatherSystems.push(newSystem);
    }
    appState.timeSinceLastNewWeatherSystemSpawn = 0;
    applyActiveSystemsToGrid(); 
    renderApp({ preserveScroll: true });
}

export function updateWeatherOverTime() {
    // ... (Implementation as previously corrected - calls _simulateWeatherSystemsForDuration, applyActiveSystemsToGrid, and spawnNewWeatherSystem)
     if (!appState.isWeatherEnabled || !appState.mapInitialized) {
        if ((appState.mapWeatherSystem.activeWeatherSystems||[]).length > 0 || Object.keys(appState.mapWeatherSystem.weatherGrid || {} ).length > 0) {
            appState.mapWeatherSystem.activeWeatherSystems = []; 
            applyActiveSystemsToGrid(); renderApp({ preserveScroll: true });
        } return;
    }
    let visualChangeOccurred = false;
    if ((!appState.mapWeatherSystem.activeWeatherSystems || appState.mapWeatherSystem.activeWeatherSystems.length === 0)) {
        const gridChangedByFallback = applyActiveSystemsToGrid(); 
        if (gridChangedByFallback) visualChangeOccurred = true;
        let newSystemSpawnedHere = false;
        if ((appState.mapWeatherSystem.activeWeatherSystems||[]).length < CONST.MAX_ACTIVE_WEATHER_SYSTEMS) {
             const initialCount = (appState.mapWeatherSystem.activeWeatherSystems||[]).length;
             spawnNewWeatherSystem(); 
             if((appState.mapWeatherSystem.activeWeatherSystems||[]).length > initialCount) newSystemSpawnedHere = true;
        }
        if(newSystemSpawnedHere) visualChangeOccurred = true; 
        if (visualChangeOccurred) renderApp({ preserveScroll: true });
        return;
    }
    const initialSystemsForCompare = (appState.mapWeatherSystem.activeWeatherSystems||[]).map(s => ({id:s.id, o:s.originHex.id, t:s.weatherType, ocSize:(s.hexesOccupied||new Set()).size }));
    const newSystems = _simulateWeatherSystemsForDuration(
        appState.mapWeatherSystem.activeWeatherSystems, 1, 
        { // Pass a config object for the simulation
            availableWeatherTypes: appState.mapWeatherSystem.availableWeatherTypes,
            weatherTypeWeights: appState.mapWeatherSystem.weatherTypeWeights,
            windStrength: appState.mapWeatherSystem.windStrength,
            windDirection: appState.mapWeatherSystem.windDirection
        },
        appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight
    );
    const newSystemsForCompare = newSystems.map(s => ({id:s.id, o:s.originHex.id, t:s.weatherType, ocSize:(s.hexesOccupied||new Set()).size }));
    const systemsStructurallyChanged = JSON.stringify(initialSystemsForCompare) !== JSON.stringify(newSystemsForCompare);
    appState.mapWeatherSystem.activeWeatherSystems = newSystems;
    const gridUpdatedByMovement = applyActiveSystemsToGrid();
    if (systemsStructurallyChanged || gridUpdatedByMovement) {
        visualChangeOccurred = true; appState.isCurrentMapDirty = true; 
    }
    appState.timeSinceLastNewWeatherSystemSpawn = (appState.timeSinceLastNewWeatherSystemSpawn || 0) + 1;
    let newSystemSpawnedThisTick = false;
    if (appState.timeSinceLastNewWeatherSystemSpawn >= CONST.NEW_WEATHER_SYSTEM_SPAWN_INTERVAL_HOURS) {
        if ((appState.mapWeatherSystem.activeWeatherSystems||[]).length < CONST.MAX_ACTIVE_WEATHER_SYSTEMS) {
            const initialCount = (appState.mapWeatherSystem.activeWeatherSystems||[]).length;
            spawnNewWeatherSystem(); 
            if((appState.mapWeatherSystem.activeWeatherSystems||[]).length > initialCount) {
                newSystemSpawnedThisTick = true; visualChangeOccurred = true; 
            }
        }
        appState.timeSinceLastNewWeatherSystemSpawn = 0;
    }
    if (visualChangeOccurred) renderApp({ preserveScroll: true });
}

export function getForecastedWeatherGrid(hoursAhead) {
    // ... (Implementation as previously corrected - calls _simulateWeatherSystemsForDuration)
    if (typeof hoursAhead !== 'number' || hoursAhead < 0) {
        return null;
    }
    const { weatherTypeWeights, availableWeatherTypes, windStrength, windDirection } = appState.mapWeatherSystem;
    const fallbackWeatherId = determineFallbackWeather(weatherTypeWeights, availableWeatherTypes);
    const forecastGrid = {};
    appState.hexDataMap.forEach(hex => { forecastGrid[hex.id] = fallbackWeatherId; });

    let systemsToProject = [];
    if (appState.isWeatherEnabled && appState.mapWeatherSystem.activeWeatherSystems) {
        // Deep clone systems for simulation to avoid mutating appState directly
        systemsToProject = appState.mapWeatherSystem.activeWeatherSystems.map(s => ({
            ...s, 
            hexesOccupied: new Set(s.hexesOccupied || []) // Ensure it's a Set for simulation
        }));
    }

    if (!appState.isWeatherEnabled) { 
        return forecastGrid;
    }

    if (hoursAhead > 0) { 
         systemsToProject = _simulateWeatherSystemsForDuration(
            systemsToProject, hoursAhead, 
            { availableWeatherTypes, weatherTypeWeights, windStrength, windDirection }, // Pass current map's config
            appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight
        );
    }
    
    if (!systemsToProject || systemsToProject.length === 0) {
        return forecastGrid;
    }

    systemsToProject.forEach(system => {
        if (system.hexesOccupied && system.hexesOccupied.size > 0) {
            system.hexesOccupied.forEach(hexId => {
                if (forecastGrid.hasOwnProperty(hexId)) {
                     forecastGrid[hexId] = system.weatherType;
                }
            });
        }
    });
    return forecastGrid;
}

export function spawnNewWeatherSystem() {
    // ... (Implementation as previously corrected - calls applyActiveSystemsToGrid)
     if (!appState.isWeatherEnabled || !appState.mapInitialized || !appState.hexDataMap || appState.hexDataMap.size === 0 || 
        (appState.mapWeatherSystem.activeWeatherSystems||[]).length >= CONST.MAX_ACTIVE_WEATHER_SYSTEMS) {
        return;
    }
    const { availableWeatherTypes, weatherTypeWeights } = appState.mapWeatherSystem;
    const allGlobalConditions = CONST.DEFAULT_WEATHER_CONDITIONS;
    const spawnableMapConditions = allGlobalConditions.filter(cond => 
        availableWeatherTypes.includes(cond.id) && cond.id !== 'sunny' && (weatherTypeWeights[cond.id] || 0) > 0
    );
    if (spawnableMapConditions.length === 0) return;
    const weightedWeatherArray = [];
    spawnableMapConditions.forEach(condition => {
        const weight = weatherTypeWeights[condition.id] || 0;
        for (let i = 0; i < weight; i++) weightedWeatherArray.push(condition.id);
    });
    let chosenWeatherId;
    if (weightedWeatherArray.length > 0) chosenWeatherId = weightedWeatherArray[Math.floor(Math.random() * weightedWeatherArray.length)];
    else chosenWeatherId = spawnableMapConditions[Math.floor(Math.random() * spawnableMapConditions.length)].id;
    let originCol, originRow; const edge = Math.floor(Math.random() * 4); const spawnMargin = 3; 
    if (edge === 0) { originRow = -spawnMargin; originCol = Math.floor(Math.random() * appState.currentGridWidth); }
    else if (edge === 1) { originCol = appState.currentGridWidth -1 + spawnMargin; originRow = Math.floor(Math.random() * appState.currentGridHeight); }
    else if (edge === 2) { originRow = appState.currentGridHeight -1 + spawnMargin; originCol = Math.floor(Math.random() * appState.currentGridWidth); }
    else { originCol = -spawnMargin; originRow = Math.floor(Math.random() * appState.currentGridHeight); }
    const originHexId = `${originCol}-${originRow}`;
    const tempOriginHexForCalc = {col: originCol, row:originRow, id:originHexId, ...HEX_UTILS.offsetToCube(originCol, originRow)};
    const radius = Math.floor(Math.random() * 2) + 2;
    const weatherDef = allGlobalConditions.find(wc => wc.id === chosenWeatherId);
    let systemMovementDirection, systemSpeed;
    const windStrengthDetails = CONST.WIND_STRENGTHS[appState.mapWeatherSystem.windStrength];
    const windDirectionDetails = CONST.WIND_DIRECTIONS[appState.mapWeatherSystem.windDirection];
    if (weatherDef && weatherDef.type === 'cluster') {
        systemSpeed = windStrengthDetails ? windStrengthDetails.speedHexesPerHour : 0;
        systemMovementDirection = windDirectionDetails ? { dCol: windDirectionDetails.dCol, dRow: windDirectionDetails.dRow, name: windDirectionDetails.name } : CONST.WIND_DIRECTIONS.CALM;
        if (systemSpeed === 0 && systemMovementDirection.name === 'Calm') systemSpeed = 0; 
        else if (systemSpeed === 0) systemSpeed = 1; 
    } else { 
        const targetCenterCol = Math.floor(appState.currentGridWidth / 2); const targetCenterRow = Math.floor(appState.currentGridHeight / 2);
        let dCol = Math.sign(targetCenterCol - originCol); let dRow = Math.sign(targetCenterRow - originRow);
        if (dCol === 0 && dRow === 0) { 
            const dirKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS).filter(k => k !== 'STATIONARY');
            systemMovementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[dirKeys[Math.floor(Math.random() * dirKeys.length)]];
        } else {
            let bestMatchDirKey = 'STATIONARY'; let minDiff = Infinity;
            for(const dirKey in CONST.WEATHER_MOVEMENT_DIRECTIONS){
                const dir = CONST.WEATHER_MOVEMENT_DIRECTIONS[dirKey];
                if (dir.name === 'Stationary' && (dCol !==0 || dRow !== 0)) continue;
                const diff = Math.abs(dCol - dir.dCol) + Math.abs(dRow - dir.dRow); 
                if(diff < minDiff){ minDiff = diff; bestMatchDirKey = dirKey; }
                else if (diff === minDiff && bestMatchDirKey === 'STATIONARY' && dir.name !== 'Stationary') bestMatchDirKey = dirKey;
            } systemMovementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[bestMatchDirKey];
        } systemSpeed = systemMovementDirection.name === 'Stationary' ? 0 : (Math.floor(Math.random() * 2) + 1);
    }
    const newSystem = {
        id: `system_spawned_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, weatherType: chosenWeatherId, hexesOccupied: new Set(),
        originHex: { col: originCol, row: originRow, id: originHexId }, radius: radius, intensity: 1.0,
        movementDirection: systemMovementDirection, speed: systemSpeed
    };
    const occupiedCoords = HEX_UTILS.getHexesInRadius(tempOriginHexForCalc, newSystem.radius, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
    occupiedCoords.forEach(coord => newSystem.hexesOccupied.add(coord.id));
    if (newSystem.hexesOccupied.size > 0) {
        if (!appState.mapWeatherSystem.activeWeatherSystems) appState.mapWeatherSystem.activeWeatherSystems = []; // Ensure array exists
        appState.mapWeatherSystem.activeWeatherSystems.push(newSystem);
        applyActiveSystemsToGrid(); 
    }
}