// encounter-logic.js

import { appState } from './state.js';
import * as CONST from './constants.js';
import { renderApp } from './ui.js';
import * as HexplorationLogic from './hexploration-logic.js';

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');

function rollPercent(chance) {
    return (Math.random() * 100) < (chance || 0);
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

export async function checkRandomEncountersOnEnter(targetHex) {
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

export async function checkRandomEncountersOnDiscover(discoveredHexIdsSet) {
    if (!appState.isGM || !discoveredHexIdsSet || discoveredHexIdsSet.size === 0) return [];
    
    const createdFeaturesForLog = [];
    for (const hexId of discoveredHexIdsSet) {
        const hex = appState.hexDataMap.get(hexId);
        if (!hex) continue;
        const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[hex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
        const chance = terrainConfig.encounterChanceOnDiscover || 0;

        if (rollPercent(chance)) {
            HexplorationLogic.postHexplorationChatMessage(`System: Potential encounter noticed upon discovering hex ${hex.id} (${hex.terrain}). GM has been prompted.`, true);
            const details = await handleEncounterFeatureCreation(hex, `Discovered ${hex.terrain}`);
            if (details && details.hexId) {
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