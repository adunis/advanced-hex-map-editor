// app/hexploration-logic.js
import { appState } from './state.js';
import { renderApp } from './ui.js';
import * as CONST from './constants.js'; 

const APP_MODULE_ID_HEXPLORATION = new URLSearchParams(window.location.search).get('moduleId');

// --- DATA TABLES ---
// Example, you might have different tables for different biomes/regions
const tabellaIncontriCasualiGenerica = [
    { "tipo": "Harmless", "descrizione": "A gentle breeze rustles through the area.", "peso": 5 },
    { "tipo": "Points of Interest", "descrizione": "You spot an unusual rock formation in the distance.", "peso": 2 },
    { "tipo": "Hazard", "descrizione": "The ground is treacherous here, covered in loose scree.", "peso": 2 },
    { "tipo": "Creature (Weak)", "descrizione": "A pack of 1d4 agitated local creatures are disturbed!", "peso": 3 },
    { "tipo": "Creature (Moderate)", "descrizione": "A lone, hungry predator sniffs the air.", "peso": 1 }
];
// --- END DATA TABLES ---

export function postHexplorationChatMessage(message, whisperToGM = false, alias = "Hexploration System") {
    if (!message || typeof message !== 'string' || message.trim() === "") {
        console.warn("HexplorationLogic: postHexplorationChatMessage called with empty or invalid message.");
        return;
    }

    if (appState.isStandaloneMode) {
        const logStyle = whisperToGM 
            ? "color: gray; font-style: italic;" 
            : "color: black; background: #e0efff; padding: 2px; border-left: 3px solid #60a5fa;";
        console.log(`%cHEXPLORATION CHAT (Standalone): ${alias} - ${message}`, logStyle);
        
        // Optionally, add to a more persistent in-app log if you have one for standalone
        // For example, if you want these messages to also appear in the appState.currentMapEventLog:
        if (!whisperToGM) { // Only log public messages to the event log
            const logEntry = {
                type: "chat_message_sim", // Differentiate from actual Foundry chat
                timestamp: new Date().toISOString(),
                alias: alias,
                content: message,
            };
            if (!appState.currentMapEventLog) appState.currentMapEventLog = [];
            appState.currentMapEventLog.unshift(logEntry);
            if (appState.currentMapEventLog.length > 100) appState.currentMapEventLog.pop();
            // If the event log is visible, a renderApp might be needed.
            // However, this function is often called during other operations that will trigger renderApp.
            // renderApp({ preserveScroll: true }); 
        }
        return;
    }

    // Foundry Mode: Send message to bridge
    if (window.parent && APP_MODULE_ID_HEXPLORATION && typeof window.parent.postMessage === 'function') {
        const payloadToBridge = {
            content: message,
            whisper: whisperToGM,
            alias: alias
        };
        try {
            window.parent.postMessage({
                type: 'postChatMessage', // Bridge listens for this type
                payload: payloadToBridge,
                moduleId: APP_MODULE_ID_HEXPLORATION
            }, '*');
        } catch (e) {
            console.error("HexplorationLogic: Error posting chat message to parent:", e);
        }
    } else {
        console.warn("HexplorationLogic: Cannot post chat message to Foundry. Parent window, postMessage, or APP_MODULE_ID_HEXPLORATION missing.");
        // Fallback to console if bridge communication fails
        const logStyle = whisperToGM ? "color: gray; font-style: italic;" : "color: darkred;";
        console.log(`%cHEXPLORATION CHAT (Bridge Fail): ${alias} - ${message}`, logStyle);
    }
}


function getUnitLabelByKeyLocal(key, unitType) {
    let unitsArray;
    if (unitType === 'distance') { unitsArray = CONST.DISTANCE_UNITS; }
    else if (unitType === 'time') { unitsArray = CONST.TIME_UNITS; }
    else { return key; }
    const unit = unitsArray.find(u => u.key === key);
    return unit ? (unit.label.toLowerCase() === key.toLowerCase() || unit.label.length <= 3 ? unit.label : unit.label.toLowerCase()) : key;
}


// NEW or MODIFIED: Calculate and update current travel speed text
export function calculateAndUpdateCurrentTravelSpeed() {
    if (!appState.mapInitialized) {
        appState.currentTravelSpeedText = "N/A (Map not loaded)";
        return;
    }

    let baseTimePerHex = appState.currentMapHexTraversalTimeValue;
    let finalTimeMultiplier = 1.0;
    let activeActivityNames = [];
    let primaryActivityName = ""; // For display if multiple are just penalties

    // Base terrain effect (optional for general display, could be complex)
    // For now, let's assume base travel refers to ideal conditions unless modified by activities
    // If you want it to reflect current hex terrain:
    // if (appState.partyMarkerPosition) {
    //     const currentHex = appState.hexDataMap.get(appState.partyMarkerPosition.id);
    //     if (currentHex) {
    //         const terrainConf = CONST.TERRAIN_TYPES_CONFIG[currentHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
    //         finalTimeMultiplier *= terrainConf.speedMultiplier;
    //         primaryActivityName = terrainConf.name; // Or some indicator
    //     }
    // }

    if (appState.activePartyActivities.size > 0) {
        appState.activePartyActivities.forEach((characterName, activityId) => {
            const activityConf = CONST.PARTY_ACTIVITIES[activityId];
            if (activityConf) {
                let factorToUse = activityConf.movementPenaltyFactor;
                // Terrain modifiers for activities are complex for a single "current speed" display.
                // We will use the base penalty factor. This is applied during actual travel calculation.
                finalTimeMultiplier *= factorToUse;
                activeActivityNames.push(activityConf.name);
            }
        });
    }

    const effectiveTimePerHex = baseTimePerHex * finalTimeMultiplier;
    let speedText = `${effectiveTimePerHex.toFixed(2)} ${getUnitLabelByKeyLocal(appState.currentMapHexTraversalTimeUnit, "time")} / hex`;
    
    if (activeActivityNames.length > 0) {
        speedText += ` (${activeActivityNames.join('/')})`;
    } else if (primaryActivityName) { // If we had a base terrain name
        // speedText += ` (${primaryActivityName})`;
    }

    appState.currentTravelSpeedText = speedText;
}


/**
 * GM action to signal the start of a new hexploration day.

/**
 * General random encounter check based on time passed or number of activities.
 * This is now distinct from onEnter or onDiscover checks which are in map-logic.js.
 * This function could be called for things like "long rest in dangerous area" or "X hours spent foraging".
 * For now, it's not directly called by the implemented travel logic but remains available.
 * @param {number} numberOfChecks - E.g., number of hours spent on an activity.
 * @param {string} contextTerrain - Optional: terrain type for varied encounter chances.
 */
export async function checkGenericRandomEncounters(numberOfChecks, contextTerrain = "wilderness") {
    if (!appState.isGM) return; 
    console.log(`HEXPLORATION: Generic check for ${numberOfChecks} encounter(s) period(s). Context: ${contextTerrain}`);
    
    // Example: Use a generic encounter chance table from CONST if defined
    // const encounterCDTable = CONST.GENERIC_ENCOUNTER_CHANCE_TABLE || {}; 
    // const defaultEncounterCD = 18; // Higher CD for generic checks, less frequent

    for (let i = 0; i < numberOfChecks; i++) {
        // const encounterRoll = simpleDiceRoll("1d20");
        // const encounterCD = encounterCDTable[contextTerrain] !== undefined 
        //                     ? encounterCDTable[contextTerrain] 
        //                     : defaultEncounterCD;

        // if (encounterRoll >= encounterCD) {
        //     const encounterDetail = tiraDaTabellaPesata(tabellaIncontriCasualiGenerica); // Use a generic table
        //     postHexplorationChatMessage(
        //         `<b>RANDOM EVENT!</b> (During period ${i + 1} of activity)<br><b>Type:</b> ${encounterDetail.tipo}<br><b>Details:</b> ${encounterDetail.descrizione}`,
        //         true // Whisper to GM
        //     );
        // } else {
        //      console.log(`HEXPLORATION: No generic encounter during period ${i+1} (Roll ${encounterRoll} vs CD ${encounterCD})`);
        // }
    }
    // If this function were to create features, it would need access to map-logic's
    // handleEncounterFeatureCreation or similar, and a target hex.
    // For now, it just posts chat messages.
}



export function calculateEffectivePartySpeed() {
    if (!appState.mapInitialized) { // Simplified condition
        // If map not initialized, display N/A, but keep underlying calculation values at defaults
        appState.currentTravelSpeedText = "N/A (Map not loaded or initializing)";
        appState.finalEffectiveTimePerHex = appState.currentMapHexTraversalTimeValue || CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
        appState.calculatedSlowestIndividualTimeFactor = 1.0;
        appState.calculatedSlowestIndividualActivityName = "None";
        appState.calculatedCombinedGroupTimeFactor = 1.0;
        // It's fine if activeIndividualActivitiesList/activeGroupActivitiesList are empty here,
        // as activePartyActivities would also be empty or freshly loaded by mapDataLoaded.
        appState.activeIndividualActivitiesList = [];
        appState.activeGroupActivitiesList = [];
        return;
    }

     if (!appState.mapInitialized && !appState.currentMapName) { // If truly no map context
        appState.currentTravelSpeedText = "N/A";
        // Set other defaults as in resetActiveMapState for these fields
        appState.finalEffectiveTimePerHex = CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
        appState.calculatedSlowestIndividualTimeFactor = 1.0;
        appState.calculatedSlowestIndividualActivityName = "None";
        appState.calculatedCombinedGroupTimeFactor = 1.0;
        appState.activeIndividualActivitiesList = [];
        appState.activeGroupActivitiesList = [];
        return;
    }


    const baseTimePerHex = appState.currentMapHexTraversalTimeValue || CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
    let slowestIndividualFactor = 1.0;
    let slowestIndividualActivityName = "None";
    let combinedGroupFactor = 1.0;

    const currentActiveIndividualActivities = [];
    const currentActiveGroupActivities = [];

    if (appState.activePartyActivities.size > 0) {
        appState.activePartyActivities.forEach((characterName, activityId) => {
            const activityConf = CONST.PARTY_ACTIVITIES[activityId];
            // Ensure movementPenaltyFactor is treated as timeFactor
            const activityTimeFactor = activityConf?.movementPenaltyFactor ?? activityConf?.timeFactor; 

            if (activityConf && typeof activityTimeFactor === 'number') {
                if (activityConf.isGroupActivity) {
                    combinedGroupFactor *= activityTimeFactor;
                    currentActiveGroupActivities.push({
                        id: activityId,
                        name: activityConf.name,
                        timeFactor: activityTimeFactor,
                        icon: activityConf.icon
                    });
                } else { // Individual activity
                    if (activityTimeFactor > slowestIndividualFactor) {
                        slowestIndividualFactor = activityTimeFactor;
                        slowestIndividualActivityName = activityConf.name;
                    }
                    currentActiveIndividualActivities.push({
                        id: activityId,
                        name: activityConf.name,
                        characterName: characterName,
                        timeFactor: activityTimeFactor,
                        icon: activityConf.icon
                    });
                }
            }
        });
    }

    appState.calculatedSlowestIndividualTimeFactor = slowestIndividualFactor;
    appState.calculatedSlowestIndividualActivityName = slowestIndividualActivityName;
    appState.calculatedCombinedGroupTimeFactor = combinedGroupFactor;
    appState.activeIndividualActivitiesList = currentActiveIndividualActivities;
    appState.activeGroupActivitiesList = currentActiveGroupActivities;

    // This is the base time per hex modified ONLY by activities.
    // Terrain, weather, elevation will be applied on top of this during actual movement.
    appState.finalEffectiveTimePerHex = baseTimePerHex * slowestIndividualFactor * combinedGroupFactor;

    // Update the display text
    let speedSummaryParts = [];
    if (slowestIndividualFactor !== 1.0 && slowestIndividualActivityName !== "None") {
        speedSummaryParts.push(`${slowestIndividualActivityName}`);
    }
    currentActiveGroupActivities.forEach(act => {
        // Only list group activities that have a non-neutral effect or if it's the only type of modifier
        if (act.timeFactor !== 1.0 || (speedSummaryParts.length === 0 && currentActiveGroupActivities.length ===1 )) {
             speedSummaryParts.push(act.name);
        }
    });
    
    const timeUnitLabel = getUnitLabelByKeyLocal(appState.currentMapHexTraversalTimeUnit, "time");
    // Display the time per hex modified by activities
    appState.currentTravelSpeedText = `${appState.finalEffectiveTimePerHex.toFixed(2)} ${timeUnitLabel} / hex`;
    if (speedSummaryParts.length > 0) {
        appState.currentTravelSpeedText += ` (${speedSummaryParts.join(', ')})`;
    } else {
        appState.currentTravelSpeedText += ` (Standard Pace)`;
    }
}

export function startNewHexplorationDay() {
    if (!appState.isGM) {
        console.warn("HEXPLORATION: Non-GM tried to start a new hexploration day.");
        return;
    }
    console.log("HEXPLORATION: GM requesting new hexploration day.");

    // Reset local counters immediately for responsiveness
    appState.hexplorationTimeElapsedHoursToday = 0;
    appState.hexplorationKmTraveledToday = 0;

    if (appState.isStandaloneMode) {
        appState.currentTimeOfDay = "07:00 AM"; // Set to 7 AM for standalone
        calculateAndUpdateCurrentTravelSpeed(); // Recalculate speed
        renderApp(); // Update UI directly
        postHexplorationChatMessage("A new day of hexploration begins!", false, "Hexploration");
    } else {
        // Foundry Mode: Send message to bridge
        // The bridge will determine if PF2e is active or use generic time advancement
        window.parent.postMessage({
            type: 'ahnTriggerNewDayProcedure', // New generic message type for bridge
            moduleId: APP_MODULE_ID_HEXPLORATION 
        }, '*');
        // The bridge will handle time advancement and then broadcast 'hexplorationDataUpdated'
        // which will update appState.currentTimeOfDay and re-confirm km/time.
        // We call calculateAndUpdateCurrentTravelSpeed here for local responsiveness,
        // it will be called again when hexplorationDataUpdated arrives.
        calculateAndUpdateCurrentTravelSpeed();
        renderApp(); // Render local changes immediately
    }
}



export function updateLocalHexplorationDisplayValues(data) {
    if (data) {
        if (typeof data.timeElapsedHoursToday === 'number') {
            appState.hexplorationTimeElapsedHoursToday = data.timeElapsedHoursToday;
        }
        if (typeof data.kmTraveledToday === 'number') {
            appState.hexplorationKmTraveledToday = data.kmTraveledToday;
        }
        if (typeof data.currentTimeOfDay === 'string') { 
            appState.currentTimeOfDay = data.currentTimeOfDay;
        }
        calculateEffectivePartySpeed(); // Recalculate speed as context might have changed
    } else {
        console.warn("HEXPLORATION_LOGIC: updateLocalHexplorationDisplayValues called with no data.");
    }
}