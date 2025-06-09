// animation-logic.js

import { appState } from './state.js';
import * as CONST from './constants.js';
import { renderApp } from './ui.js';

const APP_MODULE_ID = new URLSearchParams(window.location.search).get('moduleId');

let animationIntervalId = null; // GM's interval
let playerAnimationRequestId = null; // Player's requestAnimationFrame ID

// GM sends its current animation state to Foundry (for players)
function syncTravelAnimationStateToFoundry() {
  if (appState.isGM && !appState.isStandaloneMode && window.parent && APP_MODULE_ID) {
    console.log(`%cAHME IFRAME (GM - ${appState.userId}): syncTravelAnimationStateToFoundry called. Payload:`, "color: blue; font-weight: bold;", JSON.parse(JSON.stringify(appState.travelAnimation)));
    try {
      // Send the relevant parts of the travelAnimation state
      // Exclude onComplete as it's not serializable or needed by players
      const { onComplete, ...payload } = appState.travelAnimation;
      window.parent.postMessage({
        type: 'gmSyncTravelAnimationToFoundry',
        payload: payload,
        moduleId: APP_MODULE_ID
      }, '*');
    } catch (e) {
      console.error("AHME: Error syncing travel animation state to Foundry:", e);
    }
  }
}

export function runPlayerAnimationLoop() {
    console.log(`%cAHME IFRAME (Player - ${appState.userId}): runPlayerAnimationLoop called. Current travelAnimation state:`, "color: green; font-weight: bold;", JSON.parse(JSON.stringify(appState.travelAnimation)));
    
    // Crucial check: If the animation is already marked as inactive (e.g., a "stop" message arrived very fast and was processed), don't start.
    if (!appState.travelAnimation.isActive) {
        console.log(`%cAHME IFRAME (Player - ${appState.userId}): runPlayerAnimationLoop detected travelAnimation.isActive is false. Aborting start.`, "color: orange; font-weight: bold;");
        if (playerAnimationRequestId) {
            cancelAnimationFrame(playerAnimationRequestId);
            playerAnimationRequestId = null;
        }
        return; // Don't start the loop if it's not supposed to be active
    }

    if (playerAnimationRequestId) {
        // console.log(`AHME IFRAME (Player - ${appState.userId}): Cancelling existing playerAnimationRequestId:`, playerAnimationRequestId);
        cancelAnimationFrame(playerAnimationRequestId);
    }

    const animationLoop = () => {
        // console.log(`AHME IFRAME (Player - ${appState.userId}): Player animationLoop tick. isActive: ${appState.travelAnimation.isActive}`);
        if (!appState.travelAnimation.isActive) { // Check local state
            // console.log(`AHME IFRAME (Player - ${appState.userId}): Animation loop check: travelAnimation.isActive is false. Stopping loop.`);
            playerAnimationRequestId = null;
            return;
        }

        const elapsed = Date.now() - appState.travelAnimation.startTime;
        const progress = Math.min(1, elapsed / appState.travelAnimation.duration);
        
        // console.log(`AHME IFRAME (Player - ${appState.userId}): Animation loop. Progress: ${progress.toFixed(3)}, Elapsed: ${elapsed}ms, Duration: ${appState.travelAnimation.duration}ms`);
        
        appState.travelAnimation.markerPosition = progress * 100;
        const markerElement = document.querySelector('.travel-animation-marker');
        if (markerElement) {
            markerElement.style.left = `${appState.travelAnimation.markerPosition}%`;
        }

        if (progress < 1) {
            playerAnimationRequestId = requestAnimationFrame(animationLoop);
        } else {
            // console.log(`AHME IFRAME (Player - ${appState.userId}): Animation loop progress reached 1. Ending natural loop.`);
            playerAnimationRequestId = null; 
            // The actual "stop" with state change (isActive=false) should come from a GM message.
            // Or if stopPlayerAnimationLoop is called directly.
        }
    };
    playerAnimationRequestId = requestAnimationFrame(animationLoop);
    // console.log(`AHME IFRAME (Player - ${appState.userId}): Started new playerAnimationRequestId:`, playerAnimationRequestId);
}

// Player stops their animation loop
export function stopPlayerAnimationLoop() {
    console.log(`%cAHME IFRAME (Player - ${appState.userId}): stopPlayerAnimationLoop called. Current ID: ${playerAnimationRequestId}`, "color: red; font-weight: bold;");
    if (playerAnimationRequestId) {
        cancelAnimationFrame(playerAnimationRequestId);
        playerAnimationRequestId = null;
    }
    // Ensure marker is at 100% if stopped by GM or finished
    appState.travelAnimation.markerPosition = 100;
    appState.travelAnimation.isActive = false; // Explicitly set inactive on player side too
    const markerElement = document.querySelector('.travel-animation-marker');
    if (markerElement) {
        markerElement.style.left = `100%`;
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
        const markerElement = document.querySelector('.travel-animation-marker');
        if (markerElement) {
            markerElement.style.left = `${appState.travelAnimation.markerPosition}%`;
        }
        // GM does NOT sync repeatedly here. Sync happens on start and stop.
    }

    if (progress >= 1) {
        stopTravelAnimation(); // GM determines completion and calls stopTravelAnimation
    }
}

// GM stops the travel animation
export function stopTravelAnimation() {
    console.log(`%cAHME IFRAME (GM - ${appState.userId}): stopTravelAnimation called. Was active: ${appState.travelAnimation.isActive}`, "color: darkorange; font-weight: bold;");
    if (animationIntervalId) { // Clear GM's interval
        clearInterval(animationIntervalId);
        animationIntervalId = null;
    }
    
    if (appState.travelAnimation.isActive) { // Check if it was active
        const onCompleteCallback = appState.travelAnimation.onComplete;
        
        appState.travelAnimation.isActive = false;
        appState.travelAnimation.onComplete = null; 
        appState.travelAnimation.markerPosition = 100; 
        
        renderApp(); // GM renders its final state (popup hidden)
        syncTravelAnimationStateToFoundry(); // GM sends "stop" signal to players

        if (typeof onCompleteCallback === 'function' && appState.isGM) {
            onCompleteCallback();
        }
    }
}

// GM starts the travel animation
export function startTravelAnimation(targetHex, travelDurationMs, onCompleteCallback) {
    if (animationIntervalId) clearInterval(animationIntervalId);
    console.log(`%cAHME IFRAME (GM - ${appState.userId}): startTravelAnimation called for hex:`, "color: blueviolet; font-weight: bold;", targetHex, `duration: ${travelDurationMs}ms`);
    if (playerAnimationRequestId) cancelAnimationFrame(playerAnimationRequestId);


    const terrainType = targetHex.terrain;
    const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[terrainType] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];

    appState.travelAnimation = {
        isActive: true,
        terrainType,
        terrainName: terrainConfig.name,
        terrainColor: terrainConfig.colors.mid || terrainConfig.colors.low || 'rgb(128,128,128)',
        terrainSymbol: terrainConfig.symbol || '?',
        startTime: Date.now(),
        duration: travelDurationMs,
        markerPosition: 0,
        onComplete: onCompleteCallback,
    };
    
    renderApp(); 
    syncTravelAnimationStateToFoundry(); // GM sends "start" signal to players

    if (appState.isGM) {
        animationIntervalId = setInterval(performAnimationStep, 50); 
    } else if (appState.isStandaloneMode && appState.appMode === CONST.AppMode.PLAYER) {
        runPlayerAnimationLoop();
    }
}