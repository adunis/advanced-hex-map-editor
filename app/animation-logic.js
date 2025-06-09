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

// Player runs their own animation loop using requestAnimationFrame
export function runPlayerAnimationLoop() {
    if (playerAnimationRequestId) cancelAnimationFrame(playerAnimationRequestId);

    const animationLoop = () => {
        if (!appState.travelAnimation.isActive) { // Check local state
            playerAnimationRequestId = null;
            return;
        }

        const elapsed = Date.now() - appState.travelAnimation.startTime;
        const progress = Math.min(1, elapsed / appState.travelAnimation.duration);
        
        // Update player's local marker position
        appState.travelAnimation.markerPosition = progress * 100;
        const markerElement = document.querySelector('.travel-animation-marker');
        if (markerElement) {
            markerElement.style.left = `${appState.travelAnimation.markerPosition}%`;
        }

        if (progress < 1) {
            playerAnimationRequestId = requestAnimationFrame(animationLoop);
        } else {
            // Player's animation loop finished.
            // Actual stop comes from GM's message.
            playerAnimationRequestId = null;
        }
    };
    playerAnimationRequestId = requestAnimationFrame(animationLoop);
}

// Player stops their animation loop
export function stopPlayerAnimationLoop() {
    if (playerAnimationRequestId) {
        cancelAnimationFrame(playerAnimationRequestId);
        playerAnimationRequestId = null;
    }
    // Ensure marker is at 100% if stopped abruptly by GM
    appState.travelAnimation.markerPosition = 100;
    const markerElement = document.querySelector('.travel-animation-marker');
    if (markerElement) {
        markerElement.style.left = `100%`;
    }
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
        // GM updates its own marker
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
    if (animationIntervalId) { // Clear GM's interval
        clearInterval(animationIntervalId);
        animationIntervalId = null;
    }
    
    if (appState.travelAnimation.isActive) { // Check if it was active
        const onCompleteCallback = appState.travelAnimation.onComplete;
        
        // Update GM's state to reflect animation end
        appState.travelAnimation.isActive = false;
        appState.travelAnimation.onComplete = null; // Clear callback
        appState.travelAnimation.markerPosition = 100; // Ensure it ends at 100%
        
        renderApp(); // GM renders its final state (popup hidden)
        syncTravelAnimationStateToFoundry(); // GM sends "stop" signal to players

        // Execute GM's onComplete callback
        if (typeof onCompleteCallback === 'function' && appState.isGM) {
            onCompleteCallback();
        }
    }
}

// GM starts the travel animation
export function startTravelAnimation(targetHex, travelDurationMs, onCompleteCallback) {
    if (animationIntervalId) clearInterval(animationIntervalId); // Clear any existing GM interval
    if (playerAnimationRequestId) cancelAnimationFrame(playerAnimationRequestId); // Clear any existing player loop (e.g. if GM restarts anim quickly)


    const terrainType = targetHex.terrain;
    const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[terrainType] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];

    // Set GM's animation state
    appState.travelAnimation = {
        isActive: true,
        terrainType,
        terrainName: terrainConfig.name,
        terrainColor: terrainConfig.colors.mid || terrainConfig.colors.low || 'rgb(128,128,128)',
        terrainSymbol: terrainConfig.symbol || '?',
        startTime: Date.now(),
        duration: travelDurationMs,
        markerPosition: 0,
        onComplete: onCompleteCallback, // Store GM's callback
    };
    
    renderApp(); // GM renders its initial state (popup visible)
    syncTravelAnimationStateToFoundry(); // GM sends "start" signal to players

    // Only GM runs the setInterval loop. Player uses requestAnimationFrame started by message handler.
    if (appState.isGM) {
        animationIntervalId = setInterval(performAnimationStep, 50); // GM's loop interval
    } else if (appState.isStandaloneMode && appState.appMode === CONST.AppMode.PLAYER) {
        // Handle standalone player mode directly starting its own loop if GM isn't present
        runPlayerAnimationLoop();
    }
}