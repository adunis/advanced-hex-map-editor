// app/animation-logic.js

import { appState } from './state.js';
import * as CONST from './constants.js'; // Assuming you might need constants later
import { renderApp } from './ui.js';

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');

let animationIntervalId = null; // GM's interval for its own UI updates & completion check
let playerAnimationRequestId = null; // Player's requestAnimationFrame ID for smooth animation
const JIGGLE_RANGE_PX = 100; // Max pixels (from center) to jiggle for "exploring in place"
const JIGGLE_INTERVAL_MS = 60; // How often to change jiggle position (ms)
let jiggleTimeoutId = null; // Timeout ID for the jiggle loop

// GM sends its current animation state to Foundry (for players)
function syncTravelAnimationStateToFoundry() {
  if (appState.isGM && !appState.isStandaloneMode && window.parent && APP_MODULE_ID) {
    // console.log(`%cAHME IFRAME (GM - ${appState.userId}): syncTravelAnimationStateToFoundry called. Payload:`, "color: blue; font-weight: bold;", JSON.parse(JSON.stringify(appState.travelAnimation)));
    try {
      // Exclude onComplete as it's not serializable or needed by players
      const { onComplete, ...payload } = appState.travelAnimation;
      window.parent.postMessage({
        type: 'gmSyncTravelAnimationToFoundry',
        payload: payload, // payload now includes isExploringInPlace if set
        moduleId: APP_MODULE_ID
      }, '*');
    } catch (e) {
      console.error("AHME: Error syncing travel animation state to Foundry:", e);
    }
  }
}

export function runPlayerAnimationLoop() {
    // console.log(`%cAHME IFRAME (Player - ${appState.userId}): runPlayerAnimationLoop called. Current travelAnimation state:`, "color: green; font-weight: bold;", JSON.parse(JSON.stringify(appState.travelAnimation)));
    
    if (!appState.travelAnimation.isActive) {
        // console.log(`%cAHME IFRAME (Player - ${appState.userId}): runPlayerAnimationLoop detected travelAnimation.isActive is false. Aborting start.`, "color: orange; font-weight: bold;");
        if (playerAnimationRequestId) {
            cancelAnimationFrame(playerAnimationRequestId);
            playerAnimationRequestId = null;
        }
        if (jiggleTimeoutId) {
            clearTimeout(jiggleTimeoutId);
            jiggleTimeoutId = null;
        }
        return; 
    }

    if (playerAnimationRequestId) {
        cancelAnimationFrame(playerAnimationRequestId);
    }
    if (jiggleTimeoutId) {
        clearTimeout(jiggleTimeoutId);
    }

    const markerElement = document.querySelector('.travel-animation-marker');

    if (appState.travelAnimation.isExploringInPlace) {
        // --- Exploring In Place Animation Logic for Player ---
        if (!markerElement) {
            console.warn("Player Animation: Marker element not found for jiggle.");
            playerAnimationRequestId = null;
            return;
        }
        
        // Calculate base left position to center the marker image initially
        const terrainContainer = document.querySelector('.travel-animation-terrain');
        let terrainWidth = 300; // default from CSS
        if (terrainContainer) terrainWidth = terrainContainer.offsetWidth;
        const markerWidth = markerElement.offsetWidth || 100; // Default/approx marker width
        const baseLeftPercentString = `${50 - (markerWidth / terrainWidth / 2) * 100}%`;
        
        markerElement.style.left = baseLeftPercentString;
        markerElement.dataset.originalLeft = baseLeftPercentString;


        const jiggleLoop = () => {
            if (!appState.travelAnimation.isActive || !appState.travelAnimation.isExploringInPlace) {
                if (jiggleTimeoutId) clearTimeout(jiggleTimeoutId);
                if (markerElement) markerElement.style.left = markerElement.dataset.originalLeft || '50%';
                // playerAnimationRequestId might be for the durationLoop, don't null it here.
                return;
            }

            const randomXOffsetPx = (Math.random() - 0.5) * 2 * JIGGLE_RANGE_PX;
            // Convert pixel jiggle to percentage of terrain width for calc()
            const jigglePercentOffset = (randomXOffsetPx / terrainWidth) * 100;
            
            markerElement.style.left = `calc(${baseLeftPercentString} + ${jigglePercentOffset.toFixed(2)}%)`;
            jiggleTimeoutId = setTimeout(jiggleLoop, JIGGLE_INTERVAL_MS);
        };
        
        jiggleLoop(); // Start the jiggle

        // This loop handles the duration progress for "exploring in place"
        const durationLoop = () => {
            if (!appState.travelAnimation.isActive) { 
                playerAnimationRequestId = null;
                if (jiggleTimeoutId) clearTimeout(jiggleTimeoutId); // Ensure jiggle stops too
                if (markerElement) markerElement.style.left = markerElement.dataset.originalLeft || '50%';
                return;
            }
            const elapsed = Date.now() - appState.travelAnimation.startTime;
            const progress = Math.min(1, elapsed / appState.travelAnimation.duration);
            
            // Conceptually update markerPosition for progress display if any UI uses it
            appState.travelAnimation.markerPosition = progress * 100; 

            if (progress < 1) {
                playerAnimationRequestId = requestAnimationFrame(durationLoop);
            } else {
                // console.log(`%cAHME IFRAME (Player - ${appState.userId}): Exploring animation duration reached.`, "color: green;");
                playerAnimationRequestId = null; 
                // Actual stop comes from GM message or if stopPlayerAnimationLoop is called directly.
            }
        };
        playerAnimationRequestId = requestAnimationFrame(durationLoop);

    } else {
        // --- Standard Travel Animation Logic for Player ---
        const animationLoop = () => {
            if (!appState.travelAnimation.isActive) {
                playerAnimationRequestId = null;
                return;
            }
            const elapsed = Date.now() - appState.travelAnimation.startTime;
            const progress = Math.min(1, elapsed / appState.travelAnimation.duration);
            
            appState.travelAnimation.markerPosition = progress * 100;
            if (markerElement) {
                markerElement.style.left = `${appState.travelAnimation.markerPosition}%`;
            }

            if (progress < 1) {
                playerAnimationRequestId = requestAnimationFrame(animationLoop);
            } else {
                // console.log(`%cAHME IFRAME (Player - ${appState.userId}): Standard travel animation progress reached 1.`, "color: green;");
                playerAnimationRequestId = null; 
            }
        };
        playerAnimationRequestId = requestAnimationFrame(animationLoop);
    }
    // console.log(`%cAHME IFRAME (Player - ${appState.userId}): Started new playerAnimationRequestId:`, "color: green;", playerAnimationRequestId);
}

// Player stops their animation loop (called by GM sync or direct stop)
export function stopPlayerAnimationLoop() {
    // console.log(`%cAHME IFRAME (Player - ${appState.userId}): stopPlayerAnimationLoop called. Current ID: ${playerAnimationRequestId}`, "color: red; font-weight: bold;");
    if (playerAnimationRequestId) {
        cancelAnimationFrame(playerAnimationRequestId);
        playerAnimationRequestId = null;
    }
    if (jiggleTimeoutId) { // Clear jiggle timeout if it was active
        clearTimeout(jiggleTimeoutId);
        jiggleTimeoutId = null;
    }

    const wasExploring = appState.travelAnimation.isExploringInPlace; // Check before changing isActive
    appState.travelAnimation.isActive = false; // Explicitly set inactive
    appState.travelAnimation.markerPosition = 100; // Mark as complete

    const markerElement = document.querySelector('.travel-animation-marker');
    if (markerElement) {
        if (wasExploring) {
            // Calculate base left position to center the marker image
            const terrainContainer = document.querySelector('.travel-animation-terrain');
            let terrainWidth = 300; // default from CSS
            if (terrainContainer) terrainWidth = terrainContainer.offsetWidth;
            const markerWidth = markerElement.offsetWidth || 100;
            const baseLeftPercentString = `${50 - (markerWidth / terrainWidth / 2) * 100}%`;
            markerElement.style.left = markerElement.dataset.originalLeft || baseLeftPercentString;
        } else {
            markerElement.style.left = `100%`; // Standard travel finishes at 100%
        }
    }
    // No renderApp() here, the caller (usually GM sync message handler) will do it.
}

// GM performs its animation step (updates its own UI, checks for completion)
function performAnimationStep() {
    if (!appState.travelAnimation.isActive) {
        if (animationIntervalId) {
            clearInterval(animationIntervalId);
            animationIntervalId = null;
        }
        return;
    }

    const elapsed = Date.now() - appState.travelAnimation.startTime;
    const progress = Math.min(1, elapsed / appState.travelAnimation.duration);
    
    const newMarkerPos = progress * 100;
    if (appState.travelAnimation.markerPosition !== newMarkerPos) {
        appState.travelAnimation.markerPosition = newMarkerPos;
        // GM's own UI update for the progress bar (marker might be static if exploring)
        const markerElement = document.querySelector('.travel-animation-marker'); // GM's marker
        if (markerElement && !appState.travelAnimation.isExploringInPlace) { // Only move GM marker for travel
             markerElement.style.left = `${appState.travelAnimation.markerPosition}%`;
        }
    }

    if (progress >= 1) {
        stopTravelAnimation(); // GM determines completion and calls stopTravelAnimation
    }
}

// GM stops the travel animation
export function stopTravelAnimation() {
    // console.log(`%cAHME IFRAME (GM - ${appState.userId}): stopTravelAnimation called. Was active: ${appState.travelAnimation.isActive}`, "color: darkorange; font-weight: bold;");
    if (animationIntervalId) { 
        clearInterval(animationIntervalId);
        animationIntervalId = null;
    }
    
    if (appState.travelAnimation.isActive) { 
        const onCompleteCallback = appState.travelAnimation.onComplete;
        
        appState.travelAnimation.isActive = false;
        appState.travelAnimation.onComplete = null; 
        appState.travelAnimation.markerPosition = 100; 
        // isExploringInPlace remains part of appState.travelAnimation until overwritten by next startTravelAnimation
        
        renderApp(); // GM renders its final state (popup hidden)
        syncTravelAnimationStateToFoundry(); // GM sends "stop" signal to players

        if (typeof onCompleteCallback === 'function' && appState.isGM) {
            onCompleteCallback();
        }
    }
}

// GM starts the travel animation
export function startTravelAnimation(targetHex, travelDurationMs, onCompleteCallback, isExploringInPlace = false) {
    if (animationIntervalId) clearInterval(animationIntervalId);
    // console.log(`%cAHME IFRAME (GM - ${appState.userId}): startTravelAnimation called. For hex:`, "color: blueviolet; font-weight: bold;", targetHex, `duration: ${travelDurationMs}ms`, `ExploringInPlace: ${isExploringInPlace}`);
    
    // Stop any ongoing player-side animations immediately
    if (playerAnimationRequestId) cancelAnimationFrame(playerAnimationRequestId);
    playerAnimationRequestId = null;
    if (jiggleTimeoutId) clearTimeout(jiggleTimeoutId);
    jiggleTimeoutId = null;


    const terrainType = targetHex.terrain; // For exploring, targetHex is the current party hex
    const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[terrainType] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];

    appState.travelAnimation = {
        isActive: true,
        isExploringInPlace: isExploringInPlace, // Flag for animation type
        terrainType,
        terrainName: terrainConfig.name,
        terrainColor: terrainConfig.colors.mid || terrainConfig.colors.low || 'rgb(128,128,128)',
        terrainSymbol: terrainConfig.symbol || '?',
        startTime: Date.now(),
        duration: travelDurationMs,
        markerPosition: 0, // Always starts at 0 for conceptual progress
        onComplete: onCompleteCallback,
    };
    
    renderApp(); // GM renders its UI (shows popup)
    syncTravelAnimationStateToFoundry(); // GM sends "start" signal to players (includes isExploringInPlace)

    if (appState.isGM) { // GM's own interval to check for completion
        animationIntervalId = setInterval(performAnimationStep, 50); 
    } else if (appState.isStandaloneMode && appState.appMode === CONST.AppMode.PLAYER) {
        // If in standalone mode and this instance is a player view, start its animation loop
        runPlayerAnimationLoop();
    }
}