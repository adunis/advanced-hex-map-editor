// app/hexploration-logic.js
import { appState } from './state.js';
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

// --- HELPER FUNCTIONS ---
function simpleDiceRoll(formula) { 
    if (typeof formula !== 'string') return 0;
    const parts = formula.toLowerCase().split('d');
    if (parts.length !== 2) {
        const flatNum = parseInt(formula, 10);
        return isNaN(flatNum) ? 0 : flatNum;
    }
    const numDice = parseInt(parts[0], 10) || 1;
    const dieSize = parseInt(parts[1], 10);
    if (isNaN(dieSize) || dieSize <= 0) return 0;
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * dieSize) + 1;
    }
    return total;
}

function tiraDaTabellaPesata(tabella) {
    if (!tabella || !Array.isArray(tabella) || tabella.length === 0) {
        return { tipo: "Error", descrizione: "Encounter table is invalid or empty.", peso: 1 };
    }
    let pesoTotale = 0;
    tabella.forEach(entry => pesoTotale += Math.max(1, (entry.peso || 1)));
    if (pesoTotale === 0) return tabella[0] || { tipo: "Error", descrizione: "Encounter table has no valid weights.", peso: 1 };

    let tiroCasuale = Math.floor(Math.random() * pesoTotale);
    for (const entry of tabella) {
        const currentWeight = Math.max(1, (entry.peso || 1));
        if (tiroCasuale < currentWeight) return entry;
        tiroCasuale -= currentWeight;
    }
    return tabella[tabella.length - 1]; // Fallback
}


/**
 * Posts a message to the Foundry VTT chat log via the bridge.
 * @param {string} content HTML content for the chat message.
 * @param {boolean} isGMWhisper If true, whispers the message to GMs.
 * @param {string} alias The alias to use for the chat message speaker.
 */
export function postHexplorationChatMessage(content, isGMWhisper = false, alias = "Hexploration Event") {
   if (window.parent && APP_MODULE_ID_HEXPLORATION) {
       window.parent.postMessage({
           type: 'postChatMessage',
           payload: { content, whisper: isGMWhisper, alias },
           moduleId: APP_MODULE_ID_HEXPLORATION
       }, '*');
   } else { // Fallback for standalone or testing
       const mode = isGMWhisper ? "GM Whisper" : "Public";
       console.log(`%cHEXPLORATION CHAT (${mode} - Alias: ${alias}):\n%c${content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')}`, 
                   "color: blue; font-weight: bold;", "color: black;");
   }
}

// --- CORE HEXPLORATION ACTIONS (Exported) ---

/**
 * GM action to signal the start of a new hexploration day.
 * This messages the bridge, which then resets relevant game settings.
 */
export function startNewHexplorationDay() {
    if (!appState.isGM) {
        console.warn("HEXPLORATION: Non-GM tried to start a new hexploration day.");
        return;
    }
    console.log("HEXPLORATION: GM requesting new hexploration day from bridge.");
    if (window.parent && APP_MODULE_ID_HEXPLORATION) {
        window.parent.postMessage({
            type: 'gmRequestNewHexplorationDay', 
            moduleId: APP_MODULE_ID_HEXPLORATION
        }, '*');
    }
    // The bridge will then send 'hexplorationDataUpdated' back to all clients (including this one),
    // which app.js will catch and use to call updateLocalHexplorationDisplayValues.
}

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

/**
 * Updates local appState with hexploration data (time/km traveled today) received from the bridge.
 * This is called by app.js when it receives the 'hexplorationDataUpdated' message.
 * @param {object} data - Payload from 'hexplorationDataUpdated'. Expected: { timeElapsedHoursToday, kmTraveledToday }
 */
export function updateLocalHexplorationDisplayValues(data) {
    if (data) {
        // console.log("HEXPLORATION_LOGIC: Updating local display values with data:", data);
        if (typeof data.timeElapsedHoursToday === 'number') {
            appState.hexplorationTimeElapsedHoursToday = data.timeElapsedHoursToday;
        }
        if (typeof data.kmTraveledToday === 'number') {
            appState.hexplorationKmTraveledToday = data.kmTraveledToday;
        }
        // renderApp() is handled by app.js after this function returns.
    } else {
        console.warn("HEXPLORATION_LOGIC: updateLocalHexplorationDisplayValues called with no data.");
    }
}