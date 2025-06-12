import {
  appState,
  resetActiveMapState,
  getDefaultMapWeatherSystem,
} from "./state.js";
import * as CONST from "./constants.js";
import { compileTemplates, renderApp } from "./ui.js";
import * as MapLogic from "./map-logic.js";
import * as MapManagement from "./map-management.js";
import * as HexplorationLogic from "./hexploration-logic.js";
import * as AnimationLogic from "./animation-logic.js";
import * as WeatherLogic from "./weather-logic.js"; // Make sure this is imported

const APP_MODULE_ID = new URLSearchParams(window.location.search).get(
  "moduleId"
);
appState.isStandaloneMode = !APP_MODULE_ID;

console.log(
  `%cAHME IFRAME (isGM: ${
    new URLSearchParams(window.location.search).get("isGM") === "true"
  }, User: ${new URLSearchParams(window.location.search).get(
    "userId"
  )}): app.js loaded. APP_MODULE_ID: ${APP_MODULE_ID}, Standalone: ${
    appState.isStandaloneMode
  }`,
  "color: orange; font-weight:bold;"
);

window.addEventListener("message", (event) => {
  const { type, payload, moduleId: msgModuleId } = event.data || {};

  if (!type || (!appState.isStandaloneMode && msgModuleId !== APP_MODULE_ID)) {
    // console.log(`%cAHME IFRAME (User: ${appState.userId}): Ignoring message due to missing type, or moduleId mismatch (isStandalone: ${appState.isStandaloneMode}, msgModuleId: ${msgModuleId}, APP_MODULE_ID: ${APP_MODULE_ID}). Data:`, "color: gray;", event.data);
    return;
  }
  // If in iframe mode, and message IS for this module, log it.
  // If in standalone mode, and message IS for this module (shouldn't happen from parent), also log.
  // Basically, log if it *might* be relevant or is definitely for us.
  // console.log(`%cAHME IFRAME (User: ${appState.userId}, isGM: ${appState.isGM}): Received message:`, "color: lightblue;", event.data);

  switch (type) {
    case "initialData":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'initialData'. Payload:`,
        "color: #FFD700;",
        payload
      );
      if (appState.isStandaloneMode) return;
      if (payload) {
        appState.mapList = payload.mapList || [];
        appState.activeGmMapId = payload.activeGmMapId || null;

        // Process initial world-level data
        if (payload.currentHexplorationStatus) {
          appState.hexplorationTimeElapsedHoursToday =
            payload.currentHexplorationStatus.timeElapsedHoursToday || 0;
          appState.hexplorationKmTraveledToday =
            payload.currentHexplorationStatus.kmTraveledToday || 0;
          appState.currentTimeOfDay =
            payload.currentHexplorationStatus.currentTimeOfDay || "N/A";
        }
        if (payload.partyActivitiesData) {
          appState.activePartyActivities.clear();
          for (const [activityId, characterName] of Object.entries(
            payload.partyActivitiesData
          )) {
            if (
              CONST.PARTY_ACTIVITIES[activityId] &&
              typeof characterName === "string"
            ) {
              appState.activePartyActivities.set(activityId, characterName);
            }
          }
        }

        if (payload.initialMapWeatherSystem) {
          appState.isWeatherEnabled = true; // Enable if system data is present
          appState.mapWeatherSystem = {
            ...appState.mapWeatherSystem, // Start with defaults from reset/initial state
            ...payload.initialMapWeatherSystem, // Overlay loaded data
            activeWeatherSystems: (
              payload.initialMapWeatherSystem.activeWeatherSystems || []
            ).map((sys) => ({
              ...sys,
              hexesOccupied: new Set(sys.hexesOccupied || []),
            })),
          };
        } else if (appState.activeGmMapId === null) {
          // If no active map, and no specific initial weather, ensure it's default & off
          appState.isWeatherEnabled = false;

          appState.mapWeatherSystem = getDefaultMapWeatherSystem(); // Use helper from state.js
        }

        if (appState.activeGmMapId) {
          // handleOpenMap will call resetActiveMapState, then mapDataLoaded will re-apply fresh world data
          MapManagement.handleOpenMap(appState.activeGmMapId, true);
        } else {
          // If no map is opened, resetActiveMapState is called, then re-apply world data from initial payload
          const tempHexploration = payload.currentHexplorationStatus;
          const tempActivities = payload.partyActivitiesData;
          resetActiveMapState(); // Clears everything
          if (tempHexploration) {
            // Re-apply
            appState.hexplorationTimeElapsedHoursToday =
              tempHexploration.timeElapsedHoursToday || 0;
            appState.hexplorationKmTraveledToday =
              tempHexploration.kmTraveledToday || 0;
            appState.currentTimeOfDay =
              tempHexploration.currentTimeOfDay || "N/A";
          }
          if (tempActivities) {
            // Re-apply
            appState.activePartyActivities.clear();
            for (const [activityId, characterName] of Object.entries(
              tempActivities
            )) {
              if (
                CONST.PARTY_ACTIVITIES[activityId] &&
                typeof characterName === "string"
              ) {
                appState.activePartyActivities.set(activityId, characterName);
              }
            }
          }
          renderApp();
        }
      } else {
        resetActiveMapState();
        renderApp();
      }
      break;

    case "hexplorationDataUpdated": // Assuming this is the message type from the bridge
      if (payload) {
        HexplorationLogic.updateLocalHexplorationDisplayValues(payload);
        renderApp({ preserveScroll: true }); // Or whatever render options are appropriate
      }
      break;
    case "partyMarkerImageSelected":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Received partyMarkerImageSelected. Payload path:`,
        "color: #98FB98;",
        payload?.path
      );
      if (payload) {
        appState.currentMapPartyMarkerImagePath =
          typeof payload.path === "string" && payload.path.trim() !== ""
            ? payload.path.trim()
            : null;
        console.log(
          `%cAHME IFRAME (User: ${appState.userId}): appState.currentMapPartyMarkerImagePath set to:`,
          "color: #98FB98;",
          appState.currentMapPartyMarkerImagePath
        );
        appState.isCurrentMapDirty = true;
        renderApp({ preserveScroll: true });
        const pathInput = document.getElementById("partyMarkerImagePathInput");
        if (pathInput)
          pathInput.value = appState.currentMapPartyMarkerImagePath || "";
      }
      break;

    case "mapDataLoaded":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'mapDataLoaded'. Map ID: ${payload?.mapId}.`,
        "color: #ADD8E6;"
      );
      if (appState.isStandaloneMode) return;
      if (payload && payload.mapId && Array.isArray(payload.hexes)) {
        resetActiveMapState(); // Clears state for the new map

        // Apply fresh world-level data received with the map
        if (payload.currentHexplorationStatus) {
          appState.hexplorationTimeElapsedHoursToday =
            payload.currentHexplorationStatus.timeElapsedHoursToday || 0;
          appState.hexplorationKmTraveledToday =
            payload.currentHexplorationStatus.kmTraveledToday || 0;
          appState.currentTimeOfDay =
            payload.currentHexplorationStatus.currentTimeOfDay || "N/A";
        }

        appState.activePartyActivities.clear(); // Clear before loading new ones
        if (
          payload.partyActivitiesData &&
          typeof payload.partyActivitiesData === "object"
        ) {
          for (const [activityId, characterName] of Object.entries(
            payload.partyActivitiesData
          )) {
            if (
              CONST.PARTY_ACTIVITIES[activityId] &&
              typeof characterName === "string"
            ) {
              appState.activePartyActivities.set(activityId, characterName);
            }
          }
        }

        let needsWeatherGridInitialization = false;
        if (
          payload.mapWeatherSystem &&
          payload.mapWeatherSystem.isWeatherEnabled === true
        ) {
          console.log(
            `%cAHME IFRAME (mapDataLoaded): Map ${payload.mapId} has weather enabled in payload. Loading weather system.`,
            "color: lightgreen;"
          );
          appState.isWeatherEnabled = true;
          appState.mapWeatherSystem = {
            ...getDefaultMapWeatherSystem(),
            ...payload.mapWeatherSystem,
            activeWeatherSystems: (
              payload.mapWeatherSystem.activeWeatherSystems || []
            ).map((sys) => ({
              ...sys,
              hexesOccupied: new Set(sys.hexesOccupied || []),
            })),
            windStrength:
              payload.mapWeatherSystem.windStrength ||
              getDefaultMapWeatherSystem().windStrength,
            windDirection:
              payload.mapWeatherSystem.windDirection ||
              getDefaultMapWeatherSystem().windDirection,
            availableWeatherTypes:
              Array.isArray(payload.mapWeatherSystem.availableWeatherTypes) &&
              payload.mapWeatherSystem.availableWeatherTypes.length > 0
                ? payload.mapWeatherSystem.availableWeatherTypes
                : getDefaultMapWeatherSystem().availableWeatherTypes,
            weatherTypeWeights:
              typeof payload.mapWeatherSystem.weatherTypeWeights === "object" &&
              Object.keys(payload.mapWeatherSystem.weatherTypeWeights).length >
                0
                ? payload.mapWeatherSystem.weatherTypeWeights
                : getDefaultMapWeatherSystem().weatherTypeWeights,
            weatherGrid:
              typeof payload.mapWeatherSystem.weatherGrid === "object"
                ? payload.mapWeatherSystem.weatherGrid // Load the grid as is
                : {},
          };

          // Determine if we need to initialize/regenerate the grid:
          // 1. If the loaded grid is empty.
          // 2. OR If there are no active systems (generateWeatherGrid will create some based on weights).
          // 3. OR (More robustly) If the grid doesn't seem to reflect the active systems (harder to check perfectly here,
          //    so for now, if active systems exist and grid is empty, regenerate. If both exist, assume they are in sync from save).
          if (Object.keys(appState.mapWeatherSystem.weatherGrid).length === 0) {
            console.log(
              `%cAHME IFRAME (mapDataLoaded): Loaded weatherGrid is empty for map ${payload.mapId}. Flagging for initialization.`,
              "color: lightblue;"
            );
            needsWeatherGridInitialization = true;
          } else {
            console.log(
              `%cAHME IFRAME (mapDataLoaded): Loaded weatherGrid has data for map ${payload.mapId}. Active systems count: ${appState.mapWeatherSystem.activeWeatherSystems.length}. No full regeneration, assuming sync.`,
              "color: lightblue;"
            );
            // If the grid has data, we assume it was saved correctly reflecting the active systems.
            // We just need to make sure the current app state's grid IS this loaded grid.
            // This is already handled by the spread operator above.
          }
        } else {
          console.log(
            `%cAHME IFRAME (mapDataLoaded): Map ${payload.mapId} has NO weather system in payload or it's disabled. Weather will be off.`,
            "color: orange;"
          );
          appState.isWeatherEnabled = false;
          appState.mapWeatherSystem = getDefaultMapWeatherSystem();
        }

        appState.currentMapId = payload.mapId;
        appState.currentMapName = payload.name || "Unnamed Map";
        appState.isCurrentMapDirty = false;

        if (payload.mapSettings) {
          appState.currentMapHexSizeValue =
            parseFloat(payload.mapSettings.hexSizeValue) ||
            CONST.DEFAULT_HEX_SIZE_VALUE;
          appState.currentMapHexSizeUnit =
            payload.mapSettings.hexSizeUnit || CONST.DEFAULT_HEX_SIZE_UNIT;
          appState.currentMapHexTraversalTimeValue =
            parseFloat(payload.mapSettings.hexTraversalTimeValue) ||
            CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
          appState.currentMapHexTraversalTimeUnit =
            payload.mapSettings.hexTraversalTimeUnit ||
            CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
          appState.zoomLevel = parseFloat(payload.mapSettings.zoomLevel) || 1.0;
          appState.currentMapPartyMarkerImagePath =
            payload.mapSettings.partyMarkerImagePath || null;
        } else {
          appState.currentMapHexSizeValue = CONST.DEFAULT_HEX_SIZE_VALUE;
          appState.currentMapHexSizeUnit = CONST.DEFAULT_HEX_SIZE_UNIT;
          appState.currentMapHexTraversalTimeValue =
            CONST.DEFAULT_HEX_TRAVERSAL_TIME_VALUE;
          appState.currentMapHexTraversalTimeUnit =
            CONST.DEFAULT_HEX_TRAVERSAL_TIME_UNIT;
          appState.zoomLevel = 1.0;
          appState.currentMapPartyMarkerImagePath = null;
        }

        MapManagement.loadGlobalExplorationForMap(payload);

        const gridSettings = payload.gridSettings || {
          gridWidth: CONST.INITIAL_GRID_WIDTH,
          gridHeight: CONST.INITIAL_GRID_HEIGHT,
        };
        MapLogic.initializeGridData(
          gridSettings.gridWidth,
          gridSettings.gridHeight,
          payload.hexes,
          false
        );

        if (appState.isGM && appState.activeGmMapId !== appState.currentMapId) {
          window.parent.postMessage(
            {
              type: "gmSetActiveMap",
              payload: { mapId: appState.currentMapId },
              moduleId: APP_MODULE_ID,
            },
            "*"
          );
        }

        MapLogic.updatePartyMarkerBasedLoS();

        if (appState.partyMarkerPosition) {
          MapLogic.requestCenteringOnHex(appState.partyMarkerPosition.id);
        } else if (appState.mapInitialized) {
          const firstHex = appState.hexDataMap.values().next().value;
          if (firstHex) MapLogic.requestCenteringOnHex(firstHex.id);
        }

        if (appState.isWeatherEnabled && needsWeatherGridInitialization) {
          console.log(
            `%cAHME IFRAME (mapDataLoaded): Calling WeatherLogic.generateWeatherGrid() due to empty loaded grid or need for initialization for map ${payload.mapId}.`,
            "color: lightblue; font-weight:bold;"
          );
          WeatherLogic.generateWeatherGrid(); // This will populate grid based on loaded active systems or generate new ones.
        } else if (
          appState.isWeatherEnabled &&
          !needsWeatherGridInitialization
        ) {
          // If the grid was loaded with data, we need to ensure it's actually applied to the visual state.
          // RenderApp will do this. No need to call generateWeatherGrid.
          // However, we should ensure all hexes on the map have *some* weather entry, even if it's default.
          const defaultWeatherId = "sunny"; // Or get from map settings
          let gridWasPatched = false;
          appState.hexDataMap.forEach((hex) => {
            if (!appState.mapWeatherSystem.weatherGrid.hasOwnProperty(hex.id)) {
              appState.mapWeatherSystem.weatherGrid[hex.id] = defaultWeatherId;
              gridWasPatched = true;
            }
          });
          if (gridWasPatched) {
            console.log(
              `%cAHME IFRAME (mapDataLoaded): Patched missing hexes in loaded weatherGrid with default for map ${payload.mapId}.`,
              "color: lightblue;"
            );
          }
          // Ensure active systems are correctly reflected if the grid was loaded.
          // This might be redundant if save/load is perfect, but safer.
          WeatherLogic.applyActiveSystemsToGrid(); // We'll create this new function
        }

        renderApp();
      } else {
        alert("Error: Received incomplete map data from the server.");
        resetActiveMapState();
        renderApp();
      }
      break;

    case "mapLoadFailed":
      console.error(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'mapLoadFailed'. Payload:`,
        "color: red;",
        payload
      );
      if (appState.isStandaloneMode) return;
      alert(
        `Failed to load map: ${payload?.mapId || "Unknown ID"} - ${
          payload?.error || "Unknown reason"
        }`
      );
      if (
        appState.currentMapId === payload?.mapId ||
        (appState.currentMapName &&
          appState.currentMapName.startsWith("Loading"))
      ) {
        resetActiveMapState();
        appState.currentMapId = null;
        appState.currentMapName = null;
      }
      renderApp();
      break;

    case "mapListUpdated":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'mapListUpdated'. Payload:`,
        "color: #AFEEEE;",
        payload
      );
      if (appState.isStandaloneMode) return;
      if (payload && Array.isArray(payload.mapList)) {
        appState.mapList = payload.mapList;
        let needsFullRender = true;

        if (payload.savedMapId) {
          const savedMapInfo = appState.mapList.find(
            (m) => m.id === payload.savedMapId
          );
          if (savedMapInfo) {
            if (
              appState.isGM &&
              (appState.currentMapId === payload.savedMapId ||
                (appState.currentMapId === null &&
                  appState.currentMapName === savedMapInfo.name))
            ) {
              appState.currentMapId = savedMapInfo.id;
              appState.currentMapName = savedMapInfo.name;
              appState.isCurrentMapDirty = false;
            }
          }
        }

        if (
          payload.deletedMapId &&
          appState.currentMapId === payload.deletedMapId
        ) {
          resetActiveMapState();
          appState.currentMapId = null;
          appState.currentMapName = null;
        }

        if (
          payload.newActiveGmMapId !== undefined &&
          appState.activeGmMapId !== payload.newActiveGmMapId
        ) {
          appState.activeGmMapId = payload.newActiveGmMapId;
          // If this user is a player and the active GM map changed, they might need to load it
          if (
            !appState.isGM &&
            appState.activeGmMapId &&
            appState.currentMapId !== appState.activeGmMapId
          ) {
            MapManagement.handleOpenMap(appState.activeGmMapId, true);
            needsFullRender = false; // handleOpenMap will render
          }
        }

        if (needsFullRender) {
          renderApp();
        }
      }
      break;

    case "partyDataUpdated":
      // console.log(`%cAHME IFRAME (User: ${appState.userId}): Case 'partyDataUpdated'. Payload mapId: ${payload?.mapId}, currentMapId: ${appState.currentMapId}. Payload:`, "color: #E6E6FA;", payload);
      if (payload && payload.mapId === appState.currentMapId) {
        // This message is primarily for GMs to update their own iframe after saving,
        // or for players if a GM tool directly updated party data without a full map reload.
        // For players, activeMapChanged or forceMapReload usually handles full data sync.
        // if (!appState.isStandaloneMode || (appState.isStandaloneMode && appState.isGM)) { // Original condition
        // Simpler: if it's for the current map, process it.
        let needsRender = false;
        let explicitCenteringRequestedThisUpdate = false;

        if (payload.hasOwnProperty("partyMarkerPosition")) {
          const oldMarkerPosId = appState.partyMarkerPosition
            ? appState.partyMarkerPosition.id
            : null;
          appState.partyMarkerPosition = payload.partyMarkerPosition;

          if (
            appState.partyMarkerPosition &&
            oldMarkerPosId !== appState.partyMarkerPosition.id
          ) {
            if (
              appState.appMode === CONST.AppMode.PLAYER ||
              (appState.isGM && appState.appMode !== CONST.AppMode.HEX_EDITOR)
            ) {
              if (appState.mapInitialized) {
                MapLogic.requestCenteringOnHex(appState.partyMarkerPosition.id);
                explicitCenteringRequestedThisUpdate = true;
              }
            }
          }
          needsRender = true;
        }

        if (
          payload.discoveredHexIds &&
          Array.isArray(payload.discoveredHexIds)
        ) {
          const newSet = new Set(payload.discoveredHexIds);
          if (
            appState.playerDiscoveredHexIds.size !== newSet.size ||
            ![...appState.playerDiscoveredHexIds].every((id) => newSet.has(id))
          ) {
            appState.playerDiscoveredHexIds = newSet;
            needsRender = true;
          }
        }

        if (payload.eventLog && Array.isArray(payload.eventLog)) {
          if (
            JSON.stringify(appState.currentMapEventLog) !==
            JSON.stringify(payload.eventLog)
          ) {
            appState.currentMapEventLog = [...payload.eventLog];
            needsRender = true;
          }
        }

        if (needsRender) {
          if (appState.mapInitialized) {
            MapLogic.updatePartyMarkerBasedLoS();
          }
          renderApp({ preserveScroll: !explicitCenteringRequestedThisUpdate });
        }
        // }
      }
      break;

    case "ahnSyncMapDisorientation":
  console.log(`%cAHME IFRAME (User: ${appState.userId}, isGM: ${appState.isGM}): Case 'ahnSyncMapDisorientation'. Payload:`, "color: brown; font-weight: bold;", JSON.parse(JSON.stringify(payload)));

  // Update the local appState.mapDisorientation with the complete payload from the GM.
  // This payload includes isActive, startTime, and duration.
  appState.mapDisorientation = {
    ...appState.mapDisorientation, // Keep constants like jiggleRangePx, jiggleIntervalMs
    ...payload
  };

  // Only players (or standalone GM) react to this message by starting/stopping their visual loop
  if (!appState.isGM || (appState.isStandaloneMode && appState.appMode === CONST.AppMode.PLAYER)) {
    if (payload.isActive) {
      AnimationLogic.runMapDisorientationLoop();
    } else {
      AnimationLogic.stopMapDisorientationLoop(); // Explicitly stop
    }
  }
  // No renderApp() needed here as the visual change is handled directly by AnimationLogic.
  break;

    case "forceMapReload":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'forceMapReload'. Payload:`,
        "color: #FF6347;",
        payload
      );
      if (appState.isStandaloneMode) return;
      if (payload && payload.mapId && !appState.isGM) {
        // Only non-GMs react to this forced reload
        if (appState.currentMapId === payload.mapId) {
          MapManagement.handleOpenMap(payload.mapId, true); // True to bypass unsaved changes prompt
        }
      }
      break;

    case "activeMapChanged":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'activeMapChanged'. Payload:`,
        "color: #FF4500;",
        payload
      );
      if (appState.isStandaloneMode) return;
      const newActiveGmMapIdFromSetting = payload.activeGmMapId;
      appState.activeGmMapId = newActiveGmMapIdFromSetting;

      if (newActiveGmMapIdFromSetting) {
        // If this client is a Player, or a GM whose current map isn't the new active one, load it.
        if (
          !appState.isGM ||
          (appState.isGM &&
            (appState.currentMapId !== newActiveGmMapIdFromSetting ||
              !appState.mapInitialized))
        ) {
          MapManagement.handleOpenMap(newActiveGmMapIdFromSetting, true); // true to bypass unsaved changes prompt
        } else if (
          appState.isGM &&
          appState.currentMapId === newActiveGmMapIdFromSetting &&
          appState.mapInitialized
        ) {
          // GM is already on the active map, just re-render (e.g., if another GM changed something minor)
          if (
            appState.appMode === CONST.AppMode.PLAYER &&
            appState.partyMarkerPosition
          ) {
            MapLogic.requestCenteringOnHex(appState.partyMarkerPosition.id);
            renderApp();
          } else {
            renderApp({ preserveScroll: true });
          }
        }
      } else {
        // No active GM map
        if (!appState.isGM) {
          // Player view should clear if no active map
          if (appState.currentMapId || appState.mapInitialized) {
            resetActiveMapState();
            appState.currentMapId = null;
            appState.currentMapName = null;
          }
          renderApp();
        } else {
          // GM view, no active map. Can keep current map open for editing if desired.
          renderApp({ preserveScroll: true }); // Just re-render to update UI if needed
        }
      }
      break;

    case "activeMapContentRefreshed": // This is a gentler refresh than forceMapReload
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'activeMapContentRefreshed'. Payload:`,
        "color: #FF8C00;",
        payload
      );
      if (appState.isStandaloneMode) return;
      if (
        payload &&
        payload.mapId === appState.currentMapId &&
        !appState.isGM
      ) {
        // Player client: active map content was updated by GM, re-request it.
        MapManagement.handleOpenMap(payload.mapId, true); // true to bypass unsaved changes prompt
      }
      break;

    case "formInputResponse":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'formInputResponse'. Waiting: ${appState.isWaitingForFormInput}. Payload:`,
        "color: #DAA520;",
        payload
      );
      if (
        appState.isStandaloneMode &&
        payload &&
        payload.cancelled &&
        !appState.isWaitingForFormInput
      ) {
        renderApp();
        return;
      }
      if (
        appState.isWaitingForFormInput &&
        typeof appState.formInputCallback === "function"
      ) {
        appState.formInputCallback(payload);
      } else {
        // Callback already handled or not waiting
        appState.isWaitingForFormInput = false;
        appState.formInputCallback = null;
        // Potentially render if it was an unexpected cancellation
        if (payload && payload.cancelled) renderApp({ preserveScroll: true });
      }
      break;

    case "featureDetailsInputResponse":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'featureDetailsInputResponse'. Waiting: ${appState.isWaitingForFeatureDetails}. PendingHexId: ${appState.pendingFeaturePlacement?.hexId}. Payload:`,
        "color: #BDB76B;",
        payload
      );
      if (
        appState.isStandaloneMode &&
        payload &&
        payload.cancelled &&
        !appState.isWaitingForFeatureDetails
      ) {
        return;
      }

      if (
        appState.isWaitingForFeatureDetails &&
        typeof appState.featureDetailsCallback === "function"
      ) {
        if (
          appState.pendingFeaturePlacement &&
          payload &&
          appState.pendingFeaturePlacement.hexId === payload.hexId
        ) {
          appState.featureDetailsCallback(payload);
        } else {
          console.warn(
            `AHME IFRAME (User: ${appState.userId}): Received featureDetailsInputResponse that didn't match pending placement or no callback was ready. Payload:`,
            payload,
            "Pending:",
            appState.pendingFeaturePlacement
          );
          appState.isWaitingForFeatureDetails = false;
          appState.featureDetailsCallback = null;
          appState.pendingFeaturePlacement = null;
          renderApp();
        }
      } else if (payload && payload.cancelled) {
        appState.isWaitingForFeatureDetails = false;
        appState.featureDetailsCallback = null;
        appState.pendingFeaturePlacement = null;
        renderApp();
      }
      break;

    case "ahnInitialPartyActivities":
      console.log(
        `%cAHME IFRAME (User: ${appState.userId}): Case 'ahnInitialPartyActivities'. Payload:`,
        "color: #20B2AA;",
        payload
      );
      // This check is good: only process if not in standalone and payload exists
      if (!appState.isStandaloneMode && payload) {
        appState.activePartyActivities.clear(); // Clear existing before applying new ones
        for (const [activityId, characterName] of Object.entries(payload)) {
          if (
            CONST.PARTY_ACTIVITIES[activityId] &&
            typeof characterName === "string"
          ) {
            appState.activePartyActivities.set(activityId, characterName);
          }
        }
        renderApp({ preserveScroll: true }); // Re-render to show updated activities
      }
      break;

   case "ahnSyncTravelAnimation":
      // console.log(`%cAHME IFRAME (User: ${appState.userId}, isGM: ${appState.isGM}): Case 'ahnSyncTravelAnimation'. Payload:`, "color: magenta; font-weight: bold;", JSON.parse(JSON.stringify(payload)));

      // Update the local appState.travelAnimation with the complete payload from the GM.
      appState.travelAnimation = {
        ...appState.travelAnimation, // Keep existing defaults if any
        ...payload, // Overlay payload from GM, this includes isExploringInPlace
      };

      if (!appState.isGM) { // Player client logic
        // console.log(`%cAHME IFRAME (Player - ${appState.userId}): Processing ahnSyncTravelAnimation. payload.isActive: ${payload.isActive}, payload.isExploringInPlace: ${payload.isExploringInPlace}`, "color: magenta;");

        if (payload.isActive) {
          appState.travelAnimation.startTime = payload.startTime || Date.now(); // Use GM's start time or current if missing
          appState.travelAnimation.duration = payload.duration;
          appState.travelAnimation.markerPosition = payload.markerPosition || 0; // For progress bar
          // No need to explicitly set isExploringInPlace again, it's in payload

          setTimeout(() => {
            // console.log(`%cAHME IFRAME (Player - ${appState.userId}): Deferred call to runPlayerAnimationLoop. Current state isActive: ${appState.travelAnimation.isActive}, isExploring: ${appState.travelAnimation.isExploringInPlace}`, "color: purple; font-weight: bold;");
            if (appState.travelAnimation.isActive) { // Check isActive from appState
                 AnimationLogic.runPlayerAnimationLoop();
            } else {
                // console.log(`%cAHME IFRAME (Player - ${appState.userId}): Animation was already stopped before deferred runPlayerAnimationLoop could execute. isActive: ${appState.travelAnimation.isActive}`, "color: purple;");
            }
          }, 0); 
        } else if (!payload.isActive) {
          // console.log(`%cAHME IFRAME (Player - ${appState.userId}): Calling stopPlayerAnimationLoop directly due to !payload.isActive.`, "color: magenta;");
          AnimationLogic.stopPlayerAnimationLoop();
        }
      }

      // console.log(`%cAHME IFRAME (User: ${appState.userId}, isGM: ${appState.isGM}): Calling renderApp after processing ahnSyncTravelAnimation. Animation active: ${appState.travelAnimation.isActive}`, "color: magenta;");
      renderApp({ preserveScroll: true }); // Re-render to show/hide popup
      break;
    default:
      // console.log(`%cAHME IFRAME (User: ${appState.userId}): Unhandled message type '${type}'. Payload:`, "color: orange;", payload);
      break;
  }
});

export function handleAppModeChange(newMode) {
  MapLogic.handleAppModeChange(newMode);
}

async function start() {
  appState.isGM = appState.isStandaloneMode
    ? true
    : new URLSearchParams(window.location.search).get("isGM") === "true";
  appState.userId = appState.isStandaloneMode
    ? "standalone_gm"
    : new URLSearchParams(window.location.search).get("userId") ||
      "unknown_player_iframe";
  appState.appMode = appState.isGM
    ? CONST.DEFAULT_APP_MODE
    : CONST.AppMode.PLAYER;
  console.log(
    `%cAHME IFRAME (User: ${appState.userId}): Start function. isGM: ${appState.isGM}, appMode: ${appState.appMode}, standalone: ${appState.isStandaloneMode}`,
    "color: orange; font-weight:bold;"
  );

  if (appState.isStandaloneMode) {
    appState.appMode = CONST.AppMode.PLAYER;
  }

  const templatesReady = await compileTemplates();
  if (!templatesReady) {
    console.error(
      "AHME IFRAME: Templates failed to compile. Application cannot start."
    );
    return;
  }

  if (appState.isStandaloneMode) {
    MapManagement.handleCreateNewMap(true);
  } else if (
    window.parent &&
    APP_MODULE_ID &&
    typeof window.parent.postMessage === "function"
  ) {
    try {
      // console.log(`%cAHME IFRAME (User: ${appState.userId}): Sending 'jsAppReady' to parent.`, "color: #FFD700;");
      window.parent.postMessage(
        { type: "jsAppReady", moduleId: APP_MODULE_ID },
        "*"
      );
      // console.log(`%cAHME IFRAME (User: ${appState.userId}): Sending 'ahnGetPartyActivities' to parent.`, "color: #20B2AA;");
      window.parent.postMessage(
        {
          type: "ahnGetPartyActivities",
          moduleId: APP_MODULE_ID,
        },
        "*"
      );
    } catch (e) {
      alert(
        "AHME: Critical error initializing communication with Foundry. The map editor may not function correctly. Check console (F12)."
      );
      console.error(
        "AHME IFRAME: Error during initial postMessage to parent:",
        e
      );
      resetActiveMapState();
      renderApp();
    }
  } else {
    console.warn(
      "AHME IFRAME: No parent or module ID, assuming standalone fallback."
    );
    appState.isStandaloneMode = true;
    appState.isGM = true;
    appState.userId = "fallback_standalone_gm";
    appState.appMode = CONST.AppMode.PLAYER;
    MapManagement.handleCreateNewMap(true);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}

export function syncActivitiesToFoundry() {
  if (
    appState.isStandaloneMode ||
    !window.parent ||
    typeof window.parent.postMessage !== "function"
  ) {
    if (appState.isStandaloneMode) {
      console.log(
        `%cAHME IFRAME (Standalone - ${appState.userId}): syncActivitiesToFoundry called. Local change only. Activities:`,
        "color: orange;",
        Object.fromEntries(appState.activePartyActivities)
      );
    }
    return;
  }

  const activitiesObject = Object.fromEntries(appState.activePartyActivities);

  try {
    console.log(
      `%cAHME IFRAME (User: ${appState.userId}, isGM: ${appState.isGM}): Syncing activities to Foundry (calling parent.postMessage). Payload:`,
      "color: #20B2AA; font-weight:bold;",
      activitiesObject
    );
    window.parent.postMessage(
      {
        type: "ahnUpdatePartyActivities", // Sent by both GM and Player iframes
        payload: activitiesObject,
        moduleId: APP_MODULE_ID,
      },
      "*"
    );
  } catch (e) {
    console.error("AHME IFRAME: Error syncing party activities to Foundry:", e);
  }
}
