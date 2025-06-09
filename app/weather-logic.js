// weather-logic.js

import { appState } from './state.js';
import * as CONST from './constants.js';
import * as HEX_UTILS from './hex-utils.js';
import { renderApp } from './ui.js';

/**
 * Simulates weather system movement and interaction over a given duration.
 * This is a pure function that does not modify the global state.
 * @param {Array<Object>} initialSystems - The array of weather systems to start with.
 * @param {number} hoursToSimulate - The number of 1-hour steps to simulate.
 * @returns {Array<Object>} The new array of weather systems after simulation.
 */
function _simulateWeatherSystemsForDuration(initialSystems, hoursToSimulate) {
    if (!appState.mapInitialized || !initialSystems) return [];

    let simulatedSystems = initialSystems.map(system => ({
        ...system,
        hexesOccupied: new Set(system.hexesOccupied),
        originHex: { ...system.originHex },
        movementDirection: { ...system.movementDirection },
    }));

    for (let h = 1; h <= hoursToSimulate; h++) {
        let systemsAtThisHour = [];

        for (const system of simulatedSystems) {
            let currentSystem = system;

            if (currentSystem.speed > 0 && currentSystem.movementDirection && (currentSystem.movementDirection.dCol !== 0 || currentSystem.movementDirection.dRow !== 0)) {
                const tempCol = currentSystem.originHex.col + currentSystem.movementDirection.dCol * currentSystem.speed;
                const tempRow = currentSystem.originHex.row + currentSystem.movementDirection.dRow * currentSystem.speed;

                if (tempCol < -currentSystem.radius || tempCol >= appState.currentGridWidth + currentSystem.radius || tempRow < -currentSystem.radius || tempRow >= appState.currentGridHeight + currentSystem.radius) {
                    currentSystem = null;
                }

                if (currentSystem) {
                    currentSystem.originHex = { col: tempCol, row: tempRow, id: `${tempCol}-${tempRow}` };
                    const newOccupiedHexes = new Set();
                    const centerHexForRadius = { ...currentSystem.originHex, q: undefined, r: undefined };
                    const hexesInNewRadius = HEX_UTILS.getHexesInRadius(centerHexForRadius, currentSystem.radius, appState.hexDataMap, appState.currentGridWidth, appState.currentGridHeight);
                    hexesInNewRadius.forEach(h_item => newOccupiedHexes.add(h_item.id));
                    currentSystem.hexesOccupied = newOccupiedHexes;
                    if (currentSystem.hexesOccupied.size > 0) {
                        systemsAtThisHour.push(currentSystem);
                    }
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

                if (systemsToRemoveAfterMerge.has(system1.id) || systemsToRemoveAfterMerge.has(system2.id)) continue;

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
                            id: `storm_sim_${Date.now()}_${h}_${i}_${j}`,
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

    return simulatedSystems;
}

export function updateWeatherOverTime() {
    if (!appState.isWeatherEnabled) {
        if (appState.activeWeatherSystems.length > 0 || Object.keys(appState.weatherGrid).length > 0) {
            appState.activeWeatherSystems = [];
            appState.weatherGrid = {};
            appState.isCurrentMapDirty = true;
            renderApp({ preserveScroll: true });
        }
        return;
    }
    
    if ((!appState.activeWeatherSystems || appState.activeWeatherSystems.length === 0)) {
        const defaultWeatherId = 'sunny';
        let gridChangedByDissipation = false;
        appState.hexDataMap.forEach(hex => {
            if (appState.weatherGrid[hex.id] && appState.weatherGrid[hex.id] !== defaultWeatherId) {
                appState.weatherGrid[hex.id] = defaultWeatherId;
                gridChangedByDissipation = true;
            }
        });
        if (gridChangedByDissipation) {
            appState.isCurrentMapDirty = true;
            renderApp({ preserveScroll: true });
        }
        return;
    }

    const initialSystemCount = appState.activeWeatherSystems.length;
    const newSystems = _simulateWeatherSystemsForDuration(appState.activeWeatherSystems, 1);
    
    const weatherActuallyChanged = (initialSystemCount !== newSystems.length) || newSystems.some(sys => sys.speed > 0);
    appState.activeWeatherSystems = newSystems;

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

    if (weatherActuallyChanged) {
        appState.isCurrentMapDirty = true;
    }

    renderApp({ preserveScroll: true });
}

export function getForecastedWeatherGrid(hoursAhead) {
    if (typeof hoursAhead !== 'number' || hoursAhead <= 0) {
        return null;
    }

    const defaultWeatherId = 'sunny';
    const forecastGrid = {};
    appState.hexDataMap.forEach(hex => {
        forecastGrid[hex.id] = defaultWeatherId;
    });

    if (!appState.isWeatherEnabled || !appState.activeWeatherSystems || appState.activeWeatherSystems.length === 0) {
        return forecastGrid; 
    }

    const simulatedSystems = _simulateWeatherSystemsForDuration(appState.activeWeatherSystems, hoursAhead);

    simulatedSystems.forEach(system => {
        system.hexesOccupied.forEach(hexId => {
            if (forecastGrid.hasOwnProperty(hexId)) {
                 forecastGrid[hexId] = system.weatherType;
            }
        });
    });

    return forecastGrid;
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
    const hexArray = Array.from(appState.hexDataMap.values());
    if (hexArray.length === 0) return;

    for (let i = 0; i < numSystems; i++) {
        const weightedWeatherArray = [];
        weatherConditions.forEach(condition => {
            const weight = weatherSettings[condition.id] || 0;
            for (let j = 0; j < weight; j++) weightedWeatherArray.push(condition.id);
        });
        
        let chosenWeatherId = defaultWeatherId;
        if (weightedWeatherArray.length > 0) {
            chosenWeatherId = weightedWeatherArray[Math.floor(Math.random() * weightedWeatherArray.length)];
        } else if (weatherConditions.length > 0) {
            chosenWeatherId = weatherConditions[Math.floor(Math.random() * weatherConditions.length)].id;
        }

        const originHex = hexArray[Math.floor(Math.random() * hexArray.length)];
        const radius = Math.floor(Math.random() * 3) + 2;
        const directionKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS);
        const randomDirectionKey = directionKeys[Math.floor(Math.random() * directionKeys.length)];
        const randomMovementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[randomDirectionKey];
        const randomSpeed = Math.random() < 0.3 ? 0 : (Math.floor(Math.random() * 2) + 1);

        const newSystem = {
            id: `system_${Date.now()}_${i}`,
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
    if (!appState.isWeatherEnabled || !appState.mapInitialized || appState.hexDataMap.size === 0 || appState.activeWeatherSystems.length >= CONST.MAX_ACTIVE_WEATHER_SYSTEMS) {
        return;
    }

    const { weatherSettings, weatherConditions, currentGridWidth, currentGridHeight } = appState;
    const weightedWeatherArray = [];
    const spawnableConditions = weatherConditions.filter(wc => wc.id !== 'sunny'); 
    const conditionsToUse = spawnableConditions.length > 0 ? spawnableConditions : weatherConditions;

    conditionsToUse.forEach(condition => {
        const weight = weatherSettings[condition.id] || 0;
        for (let i = 0; i < weight; i++) weightedWeatherArray.push(condition.id);
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
    if (edge === 0) { originRow = 0; originCol = Math.floor(Math.random() * currentGridWidth); }
    else if (edge === 1) { originCol = currentGridWidth - 1; originRow = Math.floor(Math.random() * currentGridHeight); }
    else if (edge === 2) { originRow = currentGridHeight - 1; originCol = Math.floor(Math.random() * currentGridWidth); }
    else { originCol = 0; originRow = Math.floor(Math.random() * currentGridHeight); }
    
    const originHexId = `${originCol}-${originRow}`;
    const originHexData = appState.hexDataMap.get(originHexId);
    if (!originHexData) return;

    const radius = Math.floor(Math.random() * 2) + 2;
    const directionKeys = Object.keys(CONST.WEATHER_MOVEMENT_DIRECTIONS).filter(k => k !== 'STATIONARY');
    const movementDirection = CONST.WEATHER_MOVEMENT_DIRECTIONS[directionKeys[Math.floor(Math.random() * directionKeys.length)]];
    const speed = Math.floor(Math.random() * 2) + 1;

    const newSystem = {
        id: `system_spawned_${Date.now()}`,
        weatherType: chosenWeatherId,
        hexesOccupied: new Set(),
        originHex: { col: originCol, row: originRow, id: originHexId },
        radius: radius,
        intensity: 1.0,
        movementDirection,
        speed
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