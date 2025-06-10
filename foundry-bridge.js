const MODULE_ID = "advanced-hex-map-editor";
const SETTING_MAP_DATA = "hexMapData";
const SETTING_ACTIVE_GM_MAP_ID = "activeGmMapId";
const SETTING_HEXPLORATION_TIME_ELAPSED_HOURS =
  "hexplorationTimeElapsedHoursToday";
const SETTING_HEXPLORATION_KM_TRAVELED_TODAY = "hexplorationKmTraveledToday";
const AHME_SOCKET_NAME = `module.${MODULE_ID}`;

const DEFAULT_MAP_SETTINGS = {
  hexSizeValue: 5,
  hexSizeUnit: "km",
  hexTraversalTimeValue: 1,
  hexTraversalTimeUnit: "hour",
  zoomLevel: 1.0,
  partyMarkerImagePath: null,
};
const DEFAULT_LANDMARK_ICON_COLOR_CLASS_BRIDGE = "fill-yellow-200";

const DEFAULT_MAP_WEATHER_SYSTEM_STRUCTURE_BRIDGE = {
    windStrength: 'CALM',
    windDirection: 'CALM',
    availableWeatherTypes: ['sunny', 'cloudy', 'rainy'], // Minimal default
    weatherTypeWeights: { sunny: 70, cloudy: 20, rainy: 10 },
    activeWeatherSystems: [],
    weatherGrid: {}
};

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getModuleData() {
  let data;
  try {
    const savedJson = game.settings.get(MODULE_ID, SETTING_MAP_DATA);
    data = JSON.parse(savedJson || "{}");
  } catch (e) {
    data = { maps: {} };
  }

  if (!data || typeof data !== "object") data = { maps: {} };
  if (!data.maps) data.maps = {};

  for (const mapId in data.maps) {
    if (data.maps.hasOwnProperty(mapId)) {
      const map = data.maps[mapId];
      if (
        !map.exploration ||
        typeof map.exploration.discoveredHexIds === "undefined"
      ) {
        map.exploration = { discoveredHexIds: [] };
      }
      if (map.partyMarkerPosition === undefined) map.partyMarkerPosition = null;
      if (!Array.isArray(map.eventLog)) map.eventLog = [];
      if (!map.mapSettings) {
        map.mapSettings = { ...DEFAULT_MAP_SETTINGS };
      } else {
        map.mapSettings.hexSizeValue =
          typeof map.mapSettings.hexSizeValue === "number" &&
          !isNaN(map.mapSettings.hexSizeValue)
            ? map.mapSettings.hexSizeValue
            : DEFAULT_MAP_SETTINGS.hexSizeValue;
        map.mapSettings.hexSizeUnit =
          typeof map.mapSettings.hexSizeUnit === "string" &&
          map.mapSettings.hexSizeUnit
            ? map.mapSettings.hexSizeUnit
            : DEFAULT_MAP_SETTINGS.hexSizeUnit;
        map.mapSettings.hexTraversalTimeValue =
          typeof map.mapSettings.hexTraversalTimeValue === "number" &&
          !isNaN(map.mapSettings.hexTraversalTimeValue)
            ? map.mapSettings.hexTraversalTimeValue
            : DEFAULT_MAP_SETTINGS.hexTraversalTimeValue;
        map.mapSettings.hexTraversalTimeUnit =
          typeof map.mapSettings.hexTraversalTimeUnit === "string" &&
          map.mapSettings.hexTraversalTimeUnit
            ? map.mapSettings.hexTraversalTimeUnit
            : DEFAULT_MAP_SETTINGS.hexTraversalTimeUnit;
        map.mapSettings.zoomLevel =
          typeof map.mapSettings.zoomLevel === "number" &&
          !isNaN(map.mapSettings.zoomLevel)
            ? map.mapSettings.zoomLevel
            : DEFAULT_MAP_SETTINGS.zoomLevel;
        map.mapSettings.partyMarkerImagePath =
          typeof map.mapSettings.partyMarkerImagePath === "string"
            ? map.mapSettings.partyMarkerImagePath
            : DEFAULT_MAP_SETTINGS.partyMarkerImagePath;
      }

  if (map.mapWeatherSystem === undefined) {
        map.mapWeatherSystem = null; // Default to null (weather effectively off for this map or uses app defaults)
      } else if (map.mapWeatherSystem !== null) {
        // Ensure activeWeatherSystems' hexesOccupied are arrays (they are saved as arrays)
        // The iframe will convert them to Sets upon loading into its appState
        if (map.mapWeatherSystem.activeWeatherSystems && Array.isArray(map.mapWeatherSystem.activeWeatherSystems)) {
            map.mapWeatherSystem.activeWeatherSystems = map.mapWeatherSystem.activeWeatherSystems.map(sys => ({
                ...sys,
                hexesOccupied: Array.isArray(sys.hexesOccupied) ? sys.hexesOccupied : Array.from(sys.hexesOccupied || [])
            }));
        } else {
            map.mapWeatherSystem.activeWeatherSystems = [];
        }


                if (map.mapWeatherSystem.isWeatherEnabled === undefined) {
            map.mapWeatherSystem.isWeatherEnabled = true; // Assume enabled if the object structure is there
        }
        // Ensure other core weather properties exist
        map.mapWeatherSystem.windStrength = map.mapWeatherSystem.windStrength || DEFAULT_MAP_WEATHER_SYSTEM_STRUCTURE_BRIDGE.windStrength;
        map.mapWeatherSystem.windDirection = map.mapWeatherSystem.windDirection || DEFAULT_MAP_WEATHER_SYSTEM_STRUCTURE_BRIDGE.windDirection;
        map.mapWeatherSystem.availableWeatherTypes = Array.isArray(map.mapWeatherSystem.availableWeatherTypes) ? map.mapWeatherSystem.availableWeatherTypes : [...DEFAULT_MAP_WEATHER_SYSTEM_STRUCTURE_BRIDGE.availableWeatherTypes];
        map.mapWeatherSystem.weatherTypeWeights = typeof map.mapWeatherSystem.weatherTypeWeights === 'object' ? map.mapWeatherSystem.weatherTypeWeights : {...DEFAULT_MAP_WEATHER_SYSTEM_STRUCTURE_BRIDGE.weatherTypeWeights};
        map.mapWeatherSystem.weatherGrid = typeof map.mapWeatherSystem.weatherGrid === 'object' ? map.mapWeatherSystem.weatherGrid : {};
      }
    }

  }
  return data;
}

async function saveModuleData(data) {
  try {
    const dataToSave = data && typeof data === "object" ? data : { maps: {} };
    // Before saving, ensure any Sets in activeWeatherSystems are converted to Arrays
    if (dataToSave.maps) {
        for (const mapId in dataToSave.maps) {
            const map = dataToSave.maps[mapId];
            if (map.mapWeatherSystem && map.mapWeatherSystem.activeWeatherSystems) {
                map.mapWeatherSystem.activeWeatherSystems = map.mapWeatherSystem.activeWeatherSystems.map(sys => ({
                    ...sys,
                    hexesOccupied: Array.from(sys.hexesOccupied || []) // Ensure it's an array
                }));
            }
        }
    }
    await game.settings.set(
      MODULE_ID,
      SETTING_MAP_DATA,
      JSON.stringify(dataToSave)
    );
    return true;
  } catch (e) {
    ui.notifications.error(`CRITICAL: Failed to save ${MODULE_ID} data.`);
    console.error(`AHME SAVE ERROR:`, e);
    return false;
  }
}

function broadcastToAllIframes(messageType, messagePayload) {
  console.log(
    `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}): Attempting to broadcast type '${messageType}' to all relevant iframes. Payload:`,
    "color: #FF8C00;",
    messagePayload
  );
  Object.values(ui.windows).forEach((appWindow) => {
    if (
      appWindow.id === "hexmap-app" &&
      appWindow.element?.length &&
      appWindow instanceof HexMapApplication
    ) {
      const iframeInstance = appWindow.element.find("#hexmap-iframe")[0];
      // console.log(`%cAHME BRIDGE (User: ${game.user?.id}): Found appWindow: ${appWindow.id}. Iframe available: ${!!iframeInstance}, ContentWindow available: ${!!iframeInstance?.contentWindow}`, "color: #FF8C00;");
      if (iframeInstance && iframeInstance.contentWindow) {
        iframeInstance.contentWindow.postMessage(
          { type: messageType, payload: messagePayload, moduleId: MODULE_ID },
          "*"
        );
      } else {
        console.warn(
          `%cAHME BRIDGE (User: ${game.user?.id}): Could not post message to iframe in window ${appWindow.id}, contentWindow not available.`,
          "color: #FFA500;"
        );
      }
    }
  });
}

Hooks.once("ready", () => {
  if (game.socket) {
    game.socket.on(AHME_SOCKET_NAME, (data) => {
      // NO CHECKS YET - LOG EVERYTHING RECEIVED ON THIS SOCKET NAME
      console.log(
        `%c!!!! AHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}) - RAW SOCKET DATA RECEIVED !!!! Event: '${data?.ahmeEvent}', Sender: ${data?.senderId}, Payload:`,
        "background: #222; color: #bada55; font-size: 14px; font-weight: bold;",
        JSON.parse(JSON.stringify(data?.payload))
      );

      if (!data || !data.ahmeEvent || !data.payload || !game.user) {
        console.log(
          `%cAHME BRIDGE (User: ${game.user?.id}): Socket event ignored (incomplete data or no user). Event:`,
          "color: gray;",
          data?.ahmeEvent
        );
        return;
      }

      // Original logic for map refresh
      if (
        data.ahmeEvent === "ahme_force_player_map_refresh" &&
        !game.user.isGM &&
        data.senderId !== game.user.id
      ) {
        console.log(
          `%cAHME BRIDGE (Player - ${game.user?.id}): Processing 'ahme_force_player_map_refresh' from sender ${data.senderId}.`,
          "color: #4682B4;"
        );
        Object.values(ui.windows).forEach((appWindow) => {
          if (
            appWindow.id === "hexmap-app" &&
            appWindow.element?.length &&
            appWindow instanceof HexMapApplication
          ) {
            const iframeInstance = appWindow.element.find("#hexmap-iframe")[0];
            if (iframeInstance && iframeInstance.contentWindow) {
              iframeInstance.contentWindow.postMessage(
                {
                  type: "forceMapReload",
                  payload: { mapId: data.payload.mapId },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            }
          }
        });
      }

      // Socket event handler for animation
      if (data.ahmeEvent === "ahme_sync_travel_animation_socket") {
        console.log(
          `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}): Processing 'ahme_sync_travel_animation_socket' from sender ${data.senderId}. Broadcasting to local iframe(s).`,
          "color: #9370DB; font-weight: bold;"
        );
        // We are now broadcasting regardless of senderId for this test, to see if the player's iframe gets it AT ALL
        // The iframe itself has logic to only act if !appState.isGM
        broadcastToAllIframes("ahnSyncTravelAnimation", data.payload);
      }

      // LISTENER FOR PLAYER REQUESTS TO UPDATE ACTIVITIES
      if (data.ahmeEvent === "playerRequestsGMToSetPartyActivities") {
        // This log should appear in the GM's console if the socket message arrives.
        console.log(
          `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}): Received socket event: '${data.ahmeEvent}' from sender ${data.senderId}.`,
          "color: #FF69B4; font-weight: bold;"
        );

        if (game.user?.isGM) {
          // Only GMs should process this request.
          console.log(
            `%cAHME BRIDGE (GM - ${game.user.id}): Processing 'playerRequestsGMToSetPartyActivities'. Payload:`,
            "color: #FF69B4;",
            JSON.parse(JSON.stringify(data.payload))
          );
          if (data.payload) {
            game.settings
              .set(MODULE_ID, "partyActivities", data.payload)
              .then(() => {
                console.log(
                  `%cAHME BRIDGE (GM - ${game.user.id}): Party activities updated via player request & saved by GM. The 'onChange' hook for 'partyActivities' will now propagate to all clients.`,
                  "color: #32CD32; font-weight:bold;"
                );
              })
              .catch((err) => {
                console.error(
                  `%cAHME BRIDGE (GM - ${game.user.id}): Error saving party activities from player request:`,
                  "color: red;",
                  err
                );
              });
          }
        } else {
          console.log(
            `%cAHME BRIDGE (Player - ${game.user?.id}): Received 'playerRequestsGMToSetPartyActivities' but I am not a GM. Ignoring. Sender: ${data.senderId}`,
            "color: orange;"
          );
        }
      }
    });
  }
});

class HexMapApplication extends Application {
  constructor(options = {}) {
    super(options);
    this.initialPayloadForIframe = null;
  }
  static get defaultOptions() {
    const screenWidth = window.screen.availWidth || window.innerWidth;
    const screenHeight = window.screen.availHeight || window.innerHeight;
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "hexmap-app",
      title: "Advanced Hex Map Editor",
      template: `modules/${MODULE_ID}/templates/hexmap-app.html`,
      width: Math.min(1800, screenWidth * 0.9),
      height: Math.min(1200, screenHeight * 0.95),
      resizable: true,
      popOut: true,
      classes: ["hexmap-application-window", "advanced-hex-map-dialog"],
    });
  }
  async getData(options) {
    const appTemplateData = await super.getData(options);
    const isGM = game.user?.isGM || false;
    let currentUserId = game.user?.id || "unknown_user_bridge";
    appTemplateData.iframeSrc = `modules/${MODULE_ID}/app/index.html?isGM=${isGM}&moduleId=${MODULE_ID}&userId=${currentUserId}`;
    const completeModuleData = await getModuleData();
    const activeGmMapIdSetting = game.settings.get(
      MODULE_ID,
      SETTING_ACTIVE_GM_MAP_ID
    );

   const hoursToday = game.settings.get(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS) || 0;
    const kmToday = game.settings.get(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY) || 0;
    const worldTimeFormatted = game.time && game.time.worldTime ?
        new Date(game.time.worldTime * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "N/A";
    const currentPartyActivities = game.settings.get(MODULE_ID, "partyActivities") || {};

    let activeMapWeatherSystem = null;
    if (activeGmMapIdSetting && completeModuleData.maps[activeGmMapIdSetting]) {
        const activeMap = completeModuleData.maps[activeGmMapIdSetting];
        if (activeMap.mapWeatherSystem) { // It can be null
            activeMapWeatherSystem = {
                ...activeMap.mapWeatherSystem,
                activeWeatherSystems: (activeMap.mapWeatherSystem.activeWeatherSystems || []).map(sys => ({
                    ...sys,
                    hexesOccupied: Array.from(sys.hexesOccupied || []) // Ensure array for postMessage
                }))
            };
        }
    }

   this.initialPayloadForIframe = {
        mapList: Object.entries(completeModuleData.maps || {}).map(
            ([id, mapInfo]) => ({ id: id, name: mapInfo.name || "Unnamed Map" })
        ),
        activeGmMapId: activeGmMapIdSetting || null,
        currentHexplorationStatus: {
            timeElapsedHoursToday: hoursToday,
            kmTraveledToday: kmToday,
            currentTimeOfDay: worldTimeFormatted,
        },
        partyActivitiesData: currentPartyActivities,
        // Include weather system for the active map, if any
        // This is for when the iframe first loads and requests initialData
        // The `mapDataLoaded` message will also send map-specific weather
        initialMapWeatherSystem: activeMapWeatherSystem // Add this for the initial load
    };
    return appTemplateData;
}


  activateListeners(html) {
    super.activateListeners(html);
    const iframe = html.find("#hexmap-iframe")[0];
    if (!iframe) {
      console.error(
        "AHME BRIDGE: Iframe element not found in HexMapApplication template!"
      );
      return;
    }

    const messageHandler = async (event) => {
      if (!event.data || typeof event.data !== "object") {
        // console.log("AHME BRIDGE: Ignoring message with no data or not an object.", event.origin);
        return;
      }
      // Log ALL messages from any iframe for debugging purposes before the moduleId check
      // console.log(`%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}): Raw message received by bridge listener:`, "color: #ADD8E6;", event.data, "from origin:", event.origin);

      if (event.data.moduleId !== MODULE_ID) {
        // console.log("AHME BRIDGE: Ignoring message not for this module ID. Received:", event.data.moduleId, "Expected:", MODULE_ID);
        return;
      }

      const { type, payload } = event.data;
      if (type === undefined) {
        console.warn(
          "AHME BRIDGE: Received message with undefined type from iframe.",
          payload
        );
        return;
      }
      console.log(
        `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}): Processing message of type '${type}' from iframe. Payload:`,
        "color: #90EE90;",
        payload
      );

      let moduleData;
      switch (type) {
        case "jsAppReady":
          if (iframe.contentWindow && this.initialPayloadForIframe) {
            console.log(
              `%cAHME BRIDGE (User: ${game.user?.id}): iframe jsAppReady. Sending initialData.`,
              "color: #FFD700;"
            );
            iframe.contentWindow.postMessage(
              {
                type: "initialData",
                payload: this.initialPayloadForIframe,
                moduleId: MODULE_ID,
              },
              "*"
            );
          }
          break;
        case "ahnTriggerNewDayProcedure":
          if (!game.user?.isGM) return;
          console.log(
            "AHME_BRIDGE: Received ahnTriggerNewDayProcedure from iframe."
          );
          const pf2eSystemActive =
            game.system?.id === "pf2e" && game.pf2e?.actions?.restForTheNight;
          let timeAdvancedByPF2eRest = false;

          if (pf2eSystemActive) {
            try {
              let actorsToRest = [];
              if (canvas.scene) {
                actorsToRest = canvas.scene.tokens
                  .filter(
                    (token) =>
                      token.actor &&
                      token.actor.type === "character" &&
                      token.actor.hasPlayerOwner
                  )
                  .map((token) => token.actor);
              }
              if (actorsToRest.length === 0) {
                actorsToRest = game.actors.filter(
                  (actor) => actor.type === "character" && actor.hasPlayerOwner
                );
              }
              const uniqueActorsToRest = [...new Set(actorsToRest)].filter(
                (a) => a.canUserModify(game.user, "update")
              );

              if (uniqueActorsToRest.length > 0) {
                console.log(
                  "AHME_BRIDGE: Attempting PF2e Rest for the Night with actors:",
                  uniqueActorsToRest.map((a) => a.name)
                );

                // The `restForTheNight` action in PF2e itself handles the 8-hour time advancement.
                // We don't need to manually advance time here if this is successful.
                await game.pf2e.actions.restForTheNight({
                  actors: uniqueActorsToRest,
                });
                timeAdvancedByPF2eRest = true; // Mark that PF2e handled the time
                ui.notifications.info(
                  "AHME: PF2e Rest for the Night successfully triggered for party members. Time advanced by PF2e system."
                );
              } else {
                ui.notifications.warn(
                  "AHME: PF2e Rest - No player-owned character actors found to rest. Falling back to manual 8-hour time advance."
                );
                // Fallback: If no actors, manually advance 8 hours
                await game.time.advance(8 * 60 * 60); // 8 hours in seconds
                ChatMessage.create({
                  speaker: ChatMessage.getSpeaker({ alias: "System" }),
                  content:
                    "Time advanced by 8 hours as no specific characters were rested via PF2e system.",
                });
              }
            } catch (e) {
              console.error("AHME_BRIDGE: Error triggering PF2e rest:", e);
              ui.notifications.error(
                "AHME: An error occurred during PF2e rest. Falling back to manual 8-hour time advance."
              );
              // Fallback: If error during PF2e rest, manually advance 8 hours
              await game.time.advance(8 * 60 * 60); // 8 hours in seconds
              ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ alias: "System" }),
                content:
                  "Error during PF2e rest. Time advanced by 8 hours as a fallback.",
              });
            }
          } else {
            // Generic Foundry or other system: Manually advance 8 hours
            console.log(
              "AHME_BRIDGE: PF2e system not active or rest action not found. Manually advancing time by 8 hours."
            );
            if (game.time && game.time.advance) {
              await game.time.advance(8 * 60 * 60); // 8 hours in seconds
              ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ alias: "System" }),
                content: "Time advanced by 8 hours for a new day.",
              });
            } else {
              ui.notifications.warn(
                "AHME: Game time system not available to advance time."
              );
            }
          }

          // This part runs regardless of how time was advanced (PF2e or manual)
          // Reset Hexploration daily counters
          await game.settings.set(
            MODULE_ID,
            SETTING_HEXPLORATION_KM_TRAVELED_TODAY,
            0
          );
          await game.settings.set(
            MODULE_ID,
            SETTING_HEXPLORATION_TIME_ELAPSED_HOURS,
            0
          );

          // Get the new world time to send to iframes
          const worldTimeFormatted =
            game.time && typeof game.time.worldTime === "number"
              ? new Date(game.time.worldTime * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "N/A";

          // Broadcast updated Hexploration data to all iframes
          // The onChange hooks for the settings will also fire, but this ensures
          // the very latest currentTimeOfDay is bundled with the reset counters.
          // Broadcast updated Hexploration data to all iframes
          broadcastToAllIframes("hexplorationDataUpdated", {
            timeElapsedHoursToday: 0,
            kmTraveledToday: 0,
            currentTimeOfDay: worldTimeFormatted,
            forceCenterOnPartyMarker: true, //
          });

          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ alias: "Hexploration" }),
            content: `Hexploration: A new day dawns. Current time is now ${worldTimeFormatted}.`,
          });
          break;

        case "requestFilePickForMarker":
          if (!game.user?.isGM) {
            ui.notifications.warn("Only GMs can pick files.");
            return;
          }

          let fpInstance = null;
          fpInstance = new FilePicker({
            type: "imagevideo",
            current: payload.current || "",
            callback: (pathFromPicker) => {
              console.log(
                "AHME_BRIDGE: FilePicker returned raw path:",
                pathFromPicker
              );
              let finalPath = pathFromPicker;
              if (
                !pathFromPicker.startsWith("/") &&
                !pathFromPicker.startsWith("http://") &&
                !pathFromPicker.startsWith("https://")
              ) {
                const currentTarget = fpInstance?.target?.value || "";
                const activeSource = fpInstance?.activeSource || "data";
                let basePath = "";
                if (activeSource === "data") {
                  basePath = "/";
                } else if (
                  activeSource === "s3" &&
                  fpInstance?.sources?.s3?.[currentTarget]?.bucket
                ) {
                  const s3BucketData = fpInstance.sources.s3[currentTarget];
                  if (s3BucketData && s3BucketData.displayPath) {
                    basePath = s3BucketData.displayPath.endsWith("/")
                      ? s3BucketData.displayPath
                      : s3BucketData.displayPath + "/";
                  }
                }
                if (currentTarget.endsWith(pathFromPicker)) {
                  finalPath = currentTarget;
                } else {
                  let combinedPath =
                    (currentTarget.endsWith("/")
                      ? currentTarget
                      : currentTarget + "/") + pathFromPicker;
                  combinedPath = combinedPath.replace(/\/\//g, "/");
                  finalPath = combinedPath;
                }
                if (activeSource === "data" && !finalPath.startsWith("/")) {
                  finalPath = "/" + finalPath;
                }
                finalPath = finalPath.replace(/^\/\//, "/");
                console.log(
                  `AHME_BRIDGE: ActiveSource: ${activeSource}, CurrentTarget: ${currentTarget}, BasePath constructed: ${basePath}`
                );
                console.log("AHME_BRIDGE: Constructed finalPath:", finalPath);
              }
              if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(
                  {
                    type: "partyMarkerImageSelected",
                    payload: { path: finalPath },
                    moduleId: MODULE_ID,
                  },
                  "*"
                );
              }
            },
            buttons: [
              {
                label: "Clear & Use Default",
                class: "clear-file",
                icon: "fas fa-times-circle",
                action: function (fp) {
                  if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage(
                      {
                        type: "partyMarkerImageSelected",
                        payload: { path: null },
                        moduleId: MODULE_ID,
                      },
                      "*"
                    );
                  }
                  fp.close();
                },
              },
            ],
          });
          fpInstance.browse(payload.current || "");
          break;
        case "requestMapLoad":
          if (!payload || !payload.mapId) {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "mapLoadFailed",
                  payload: { error: "Missing mapId" },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }
          moduleData = await getModuleData();
          const mapToLoad = moduleData.maps[payload.mapId];
          if (mapToLoad && iframe.contentWindow) {
            if (!mapToLoad.exploration)
              mapToLoad.exploration = { discoveredHexIds: [] };
            if (mapToLoad.partyMarkerPosition === undefined)
              mapToLoad.partyMarkerPosition = null;
            if (!Array.isArray(mapToLoad.eventLog)) mapToLoad.eventLog = [];
            if (
              !mapToLoad.mapSettings ||
              typeof mapToLoad.mapSettings.zoomLevel !== "number" ||
              isNaN(mapToLoad.mapSettings.zoomLevel)
            ) {
              mapToLoad.mapSettings = {
                ...DEFAULT_MAP_SETTINGS,
                ...(mapToLoad.mapSettings || {}),
              };
              mapToLoad.mapSettings.zoomLevel =
                mapToLoad.mapSettings.zoomLevel ||
                DEFAULT_MAP_SETTINGS.zoomLevel;
            }


 const hoursToday = game.settings.get(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS) || 0;
            const kmToday = game.settings.get(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY) || 0;
            const worldTimeFormatted = game.time && game.time.worldTime ? 
                new Date(game.time.worldTime * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "N/A";
            const currentPartyActivities = game.settings.get(MODULE_ID, "partyActivities") || {};

            // Prepare mapWeatherSystem for sending to iframe (convert Sets to Arrays if any were Sets, though unlikely from JSON)
            let mapWeatherSystemForIframe = null;
            if (mapToLoad.mapWeatherSystem) {
                mapWeatherSystemForIframe = {
                    ...mapToLoad.mapWeatherSystem,
                    activeWeatherSystems: (mapToLoad.mapWeatherSystem.activeWeatherSystems || []).map(sys => ({
                        ...sys,
                        hexesOccupied: Array.from(sys.hexesOccupied || [])
                    }))
                };
            }

            iframe.contentWindow.postMessage(
              {
                type: "mapDataLoaded",
                payload: {
                  // ... existing map specific data (mapId, name, gridSettings, hexes, exploration, etc.)
                  mapId: payload.mapId,
                  name: mapToLoad.name,
                  gridSettings: mapToLoad.gridSettings,
                  hexes: mapToLoad.hexes,
                  exploration: mapToLoad.exploration,
                  partyMarkerPosition: mapToLoad.partyMarkerPosition,
                  eventLog: mapToLoad.eventLog,
                  mapSettings: mapToLoad.mapSettings,
                  currentHexplorationStatus: {
                    timeElapsedHoursToday: hoursToday,
                    kmTraveledToday: kmToday,
                    currentTimeOfDay: worldTimeFormatted,
                  },
                  partyActivitiesData: currentPartyActivities,
                                  mapWeatherSystem: mapWeatherSystemForIframe, // Send weather system // Ensure this is always sent
                },
                moduleId: MODULE_ID,
              },
              "*"
            );
          } else {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "mapLoadFailed",
                  payload: { mapId: payload.mapId, error: "Map not found" },
                  moduleId: MODULE_ID,
                },
                "*"
              );
          }
          break;

        case "saveMapData":
          if (!game.user?.isGM) {
            ui.notifications.warn("Only GMs can save map data.");
            return;
          }
          let validationError = null;
          if (!payload) validationError = "Payload missing.";
          else if (
            !payload.mapName ||
            typeof payload.mapName !== "string" ||
            !payload.mapName.trim()
          )
            validationError = "Map name missing or invalid.";
          else if (
            !payload.mapData ||
            !payload.mapData.gridSettings ||
            !Array.isArray(payload.mapData.hexes)
          )
            validationError = "Map data structure invalid.";
          else if (
            !payload.explorationData ||
            !Array.isArray(payload.explorationData.discoveredHexIds)
          )
            validationError = "Exploration data invalid.";
          else if (payload.partyMarkerPosition === undefined)
            validationError = "Party marker position missing.";
          else if (
            payload.eventLog === undefined ||
            !Array.isArray(payload.eventLog)
          )
            validationError = "Event log invalid.";
          else if (
            !payload.mapSettings ||
            typeof payload.mapSettings.hexSizeValue !== "number" ||
            typeof payload.mapSettings.hexSizeUnit !== "string" ||
            typeof payload.mapSettings.hexTraversalTimeValue !== "number" ||
            typeof payload.mapSettings.hexTraversalTimeUnit !== "string" ||
            typeof payload.mapSettings.zoomLevel !== "number" ||
            (typeof payload.mapSettings.partyMarkerImagePath !== "string" &&
              payload.mapSettings.partyMarkerImagePath !== null)
          ) {
            validationError = "Map settings invalid.";
          }
          
             // Weather System Validation (if present)
          if (payload.mapWeatherSystem !== null && payload.mapWeatherSystem !== undefined) {
              if (typeof payload.mapWeatherSystem !== 'object' ||
                  payload.mapWeatherSystem.isWeatherEnabled === undefined || // Check for the flag
                  !payload.mapWeatherSystem.hasOwnProperty('windStrength') ||
                  !payload.mapWeatherSystem.hasOwnProperty('windDirection') ||
                  !Array.isArray(payload.mapWeatherSystem.availableWeatherTypes) ||
                  typeof payload.mapWeatherSystem.weatherTypeWeights !== 'object' ||
                  !Array.isArray(payload.mapWeatherSystem.activeWeatherSystems) || // iframe sends arrays
                  typeof payload.mapWeatherSystem.weatherGrid !== 'object') {
                  validationError = "Map Weather System data structure invalid.";
              } else {
                  for (const sys of payload.mapWeatherSystem.activeWeatherSystems) {
                      if (typeof sys.id !== 'string' || typeof sys.weatherType !== 'string' || !Array.isArray(sys.hexesOccupied)) {
                           validationError = "Invalid structure in activeWeatherSystems.";
                           break;
                      }
                  }
              }
          }

          if (validationError) {
            ui.notifications.error(`AHME Save Error: ${validationError}`);
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "mapSaveFailed",
                  payload: {
                    mapId: payload?.mapId,
                    error: `Invalid save data: ${validationError}`,
                  },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }

          moduleData = await getModuleData();
          const originalMapIdFromPayload = payload.mapId;
          const mapIdToSave = originalMapIdFromPayload || generateUUID();

             let weatherSystemToSave = null;
          if (payload.mapWeatherSystem) {
            weatherSystemToSave = {
                ...payload.mapWeatherSystem,
                activeWeatherSystems: (payload.mapWeatherSystem.activeWeatherSystems || []).map(sys => ({
                    ...sys,
                    hexesOccupied: Array.from(sys.hexesOccupied || [])
                }))
            };
          }

          moduleData.maps[mapIdToSave] = {
            name: payload.mapName.trim(),
            gridSettings: payload.mapData.gridSettings,
            hexes: payload.mapData.hexes,
            exploration: {
              discoveredHexIds: payload.explorationData.discoveredHexIds,
            },
            partyMarkerPosition: payload.partyMarkerPosition,
            eventLog: payload.eventLog || [],
            mapSettings: payload.mapSettings,
            lastUpdated: Date.now(),
            mapWeatherSystem: payload.mapWeatherSystem
          };

          const savedSuccessfully = await saveModuleData(moduleData);

          if (savedSuccessfully) {
            if (!payload.isAutoSave) {
              ui.notifications.info(
                `Map '${moduleData.maps[mapIdToSave].name}' saved.`
              );
            }
            const currentActiveGmMapId = game.settings.get(
              MODULE_ID,
              SETTING_ACTIVE_GM_MAP_ID
            );
            let activeMapIdSettingChangedByThisSaveAction = false;

            if (
              game.user.isGM &&
              currentActiveGmMapId !== mapIdToSave &&
              !payload.isAutoSave
            ) {
              await game.settings.set(
                MODULE_ID,
                SETTING_ACTIVE_GM_MAP_ID,
                mapIdToSave
              );
              activeMapIdSettingChangedByThisSaveAction = true;
            }

            if (currentActiveGmMapId === mapIdToSave) {
              if (game.user.isGM && game.socket) {
                try {
                  console.log(
                    `%cAHME BRIDGE (GM - ${game.user?.id}): Emitting ahme_force_player_map_refresh for map ${mapIdToSave}`,
                    "color: #4682B4;"
                  );
                  game.socket.emit(AHME_SOCKET_NAME, {
                    ahmeEvent: "ahme_force_player_map_refresh",
                    payload: { mapId: mapIdToSave },
                    senderId: game.user.id,
                  });
                } catch (socketError) {
                  console.error(
                    "AHME_BRIDGE: Error emitting socket event:",
                    socketError
                  );
                }
              }

              if (!activeMapIdSettingChangedByThisSaveAction) {
                // This forces a setting change event even if the value is the same,
                // triggering onChange handlers that broadcast to iframes.
                await game.settings.set(
                  MODULE_ID,
                  SETTING_ACTIVE_GM_MAP_ID,
                  null
                );
                await game.settings.set(
                  MODULE_ID,
                  SETTING_ACTIVE_GM_MAP_ID,
                  mapIdToSave
                );
              }
            }

            if (iframe.contentWindow) {
              const localPartyDataPayload = {
                mapId: mapIdToSave,
                partyMarkerPosition:
                  moduleData.maps[mapIdToSave].partyMarkerPosition,
                discoveredHexIds:
                  moduleData.maps[mapIdToSave].exploration.discoveredHexIds,
                eventLog: moduleData.maps[mapIdToSave].eventLog,
              };
              // console.log(`%cAHME BRIDGE (GM - ${game.user?.id}): Posting partyDataUpdated to own iframe for map ${mapIdToSave}`, "color: #4682B4;");
              iframe.contentWindow.postMessage(
                {
                  type: "partyDataUpdated",
                  payload: localPartyDataPayload,
                  moduleId: MODULE_ID,
                },
                "*"
              );
              // Send mapListUpdated only if the active map wasn't just changed by this save
              // to avoid redundant updates if the onChange hook for SETTING_ACTIVE_GM_MAP_ID handles it.
              if (!activeMapIdSettingChangedByThisSaveAction) {
                const mapListForThisGM = Object.entries(moduleData.maps).map(
                  ([id_entry, mapInfo]) => ({
                    id: id_entry,
                    name: mapInfo.name,
                  })
                );
                // console.log(`%cAHME BRIDGE (GM - ${game.user?.id}): Posting mapListUpdated to own iframe. SavedMapId: ${mapIdToSave}`, "color: #4682B4;");
                iframe.contentWindow.postMessage(
                  {
                    type: "mapListUpdated",
                    payload: {
                      mapList: mapListForThisGM,
                      savedMapId: mapIdToSave, // Inform iframe which map was just saved
                      newActiveGmMapId: currentActiveGmMapId, // Send current active map ID
                    },
                    moduleId: MODULE_ID,
                  },
                  "*"
                );
              }
            }
          } else {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "mapSaveFailed",
                  payload: {
                    mapId: payload.mapId || mapIdToSave,
                    error: "Failed to write to Foundry.",
                  },
                  moduleId: MODULE_ID,
                },
                "*"
              );
          }
          break;

        case "deleteMap":
          if (!game.user?.isGM) {
            ui.notifications.warn("Only GMs can delete maps.");
            return;
          }
          if (!payload || !payload.mapId) return;
          moduleData = await getModuleData();
          const mapIdToDelete = payload.mapId;
          if (moduleData.maps[mapIdToDelete]) {
            const mapNameToDelete = moduleData.maps[mapIdToDelete].name;
            delete moduleData.maps[mapIdToDelete];
            if (await saveModuleData(moduleData)) {
              ui.notifications.info(`Map '${mapNameToDelete}' deleted.`);
              if (
                game.settings.get(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID) ===
                mapIdToDelete
              ) {
                await game.settings.set(
                  MODULE_ID,
                  SETTING_ACTIVE_GM_MAP_ID,
                  null
                ); // This will trigger its own onChange and broadcast.
              } else {
                // If the deleted map wasn't active, just update lists.
                const mapListUpdatePayload = {
                  mapList: Object.entries(moduleData.maps).map(
                    ([id, mapInfo]) => ({ id, name: mapInfo.name })
                  ),
                  deletedMapId: mapIdToDelete,
                  newActiveGmMapId: game.settings.get(
                    // send current active map
                    MODULE_ID,
                    SETTING_ACTIVE_GM_MAP_ID
                  ),
                };
                broadcastToAllIframes("mapListUpdated", mapListUpdatePayload);
              }
            }
          } else {
            ui.notifications.warn(
              `Map ID '${mapIdToDelete}' not found for deletion.`
            );
          }
          break;

        case "requestFormInput":
          if (!game.user?.isGM) {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "formInputResponse",
                  payload: { error: "Permission denied", cancelled: true },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }
          if (
            !payload ||
            !Array.isArray(payload.fields) ||
            payload.fields.length === 0
          ) {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "formInputResponse",
                  payload: {
                    error: "Bridge: Invalid request fields",
                    cancelled: true,
                  },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }
          let formContent =
            '<form autocomplete="off" class="dialog-form-flex">';
          payload.fields.forEach((field) => {
            formContent += `<div class="form-group"><label for="${
              field.name
            }">${field.label || field.name}:</label><div class="form-fields">`;
            if (field.type === "select" && Array.isArray(field.options)) {
              formContent += `<select name="${field.name}" id="${field.name}">`;
              field.options.forEach((opt) => {
                formContent += `<option value="${opt.value}" ${
                  String(opt.value) === String(field.default) ? "selected" : ""
                }>${opt.label}</option>`;
              });
              formContent += `</select>`;
            } else if (field.type === "number") {
              formContent += `<input type="number" name="${field.name}" id="${
                field.name
              }" value="${field.default || ""}" ${
                field.min !== undefined ? `min="${field.min}"` : ""
              } ${field.max !== undefined ? `max="${field.max}"` : ""} ${
                field.step !== undefined ? `step="${field.step}"` : ""
              } />`;
            } else {
              formContent += `<input type="text" name="${field.name}" id="${
                field.name
              }" value="${String(field.default || "")}" />`;
            }
            formContent += `</div></div>`;
          });
          formContent += "</form>";
          new Dialog(
            {
              title: payload.title || "Input Required",
              content: formContent,
              buttons: {
                ok: {
                  icon: '<i class="fas fa-check"></i>',
                  label: "OK",
                  callback: (htmlEl) => {
                    const formData = {};
                    payload.fields.forEach((field) => {
                      const inputElement = htmlEl.find(
                        `[name="${field.name}"]`
                      );
                      if (inputElement.length) {
                        formData[field.name] = inputElement.val();
                        if (field.type === "number") {
                          const parsedVal = parseFloat(inputElement.val());
                          formData[field.name] = isNaN(parsedVal)
                            ? typeof field.default === "number"
                              ? field.default
                              : 0
                            : parsedVal;
                        }
                      }
                    });
                    if (iframe.contentWindow)
                      iframe.contentWindow.postMessage(
                        {
                          type: "formInputResponse",
                          payload: { ...formData, cancelled: false },
                          moduleId: MODULE_ID,
                        },
                        "*"
                      );
                  },
                },
                cancel: {
                  icon: '<i class="fas fa-times"></i>',
                  label: "Cancel",
                  callback: () => {
                    if (iframe.contentWindow)
                      iframe.contentWindow.postMessage(
                        {
                          type: "formInputResponse",
                          payload: { cancelled: true },
                          moduleId: MODULE_ID,
                        },
                        "*"
                      );
                  },
                },
              },
              default: "ok",
              render: (htmlEl) => {
                if (payload.fields.length > 0) {
                  setTimeout(
                    () =>
                      htmlEl.find(`[name="${payload.fields[0].name}"]`).focus(),
                    50
                  );
                }
              },
            },
            { width: payload.dialogWidth || 450 }
          ).render(true);
          break;

        case "gmSetActiveMap":
          if (!game.user?.isGM) return;
          const newActiveMapIdFromIframe =
            payload &&
            (typeof payload.mapId === "string" || payload.mapId === null)
              ? payload.mapId
              : null;
          if (
            game.settings.get(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID) !==
            newActiveMapIdFromIframe // Only update if it's different
          ) {
            await game.settings.set(
              MODULE_ID,
              SETTING_ACTIVE_GM_MAP_ID,
              newActiveMapIdFromIframe
            ); // This will trigger its own onChange and broadcast
          }
          break;

        case "requestFeatureDetailsInput":
          if (!game.user?.isGM) {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "featureDetailsInputResponse",
                  payload: { error: "Permission denied", cancelled: true },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }
          if (!payload || !payload.hexId || !payload.featureType) {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "featureDetailsInputResponse",
                  payload: { error: "Invalid request", cancelled: true },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }
          const isLandmarkDialogBridge = payload.featureType === "landmark";
          const isSecretDialogBridge = payload.featureType === "secret";
          let dialogFieldsArray = [];
          dialogFieldsArray.push({
            name: "featureName",
            label: isLandmarkDialogBridge
              ? "Landmark Name:"
              : isSecretDialogBridge
              ? "Secret Note/Name (GM Only):"
              : "Feature Name:",
            type: "text",
            default: payload.currentName || "",
          });
          if (isLandmarkDialogBridge) {
            const landmarkIcons = [
              { char: "★", name: "Star" },
              { char: "⚐", name: "Flag" },
              { char: "⌖", name: "Target" },
              { char: "📍", name: "Pin" },
              { char: "⚜", name: "Fleur-de-lis" },
              { char: "⛺", name: "Camp" },
              { char: "⚔", name: "Battle" },
              { char: "☠", name: "Danger" },
              { char: "🏠", name: "House" },
              { char: "🏰", name: "Castle" },
              { char: "⚓", name: "Anchor" },
              { char: "🌲", name: "Tree" },
              { char: "⛰️", name: "Mountain" },
              { char: "💧", name: "Water Drop" },
              { char: "🔥", name: "Fire" },
              { char: "⚠️", name: "Encounter" },
              { char: "❔", name: "Question" },
              { char: "❗", name: "Exclamation" },
            ];
            dialogFieldsArray.push({
              name: "featureIcon",
              label: "Icon:",
              type: "select",
              default: payload.currentIcon || "★",
              options: landmarkIcons.map((icon) => ({
                value: icon.char,
                label: `${icon.char} (${icon.name})`,
              })),
            });
          }
          if (
            (isLandmarkDialogBridge || isSecretDialogBridge) &&
            payload.availableIconColors &&
            Array.isArray(payload.availableIconColors)
          ) {
            dialogFieldsArray.push({
              name: "featureIconColor",
              label: "Icon Color:",
              type: "select",
              default:
                payload.currentIconColor ||
                (payload.availableIconColors.length > 0
                  ? payload.availableIconColors[0].class
                  : DEFAULT_LANDMARK_ICON_COLOR_CLASS_BRIDGE),
              options: payload.availableIconColors.map((c) => ({
                value: c.class,
                label: c.name,
              })),
            });
          }
          const featureDialogDisplayPayload = {
            title: `Set ${
              isLandmarkDialogBridge
                ? "Landmark"
                : isSecretDialogBridge
                ? "Secret"
                : "Feature"
            } Details for Hex ${payload.hexId}`,
            fields: dialogFieldsArray,
            dialogWidth: 450,
          };
          const originalFeatureRequestFromApp = { ...payload };
          new Dialog(
            {
              title: featureDialogDisplayPayload.title,
              content: (() => {
                let c = '<form autocomplete="off" class="dialog-form-flex">';
                featureDialogDisplayPayload.fields.forEach((field) => {
                  c += `<div class="form-group"><label for="${field.name}">${
                    field.label || field.name
                  }:</label><div class="form-fields">`;
                  if (field.type === "select" && Array.isArray(field.options)) {
                    c += `<select name="${field.name}" id="${field.name}">`;
                    field.options.forEach((opt) => {
                      c += `<option value="${opt.value}" ${
                        String(opt.value) === String(field.default)
                          ? "selected"
                          : ""
                      }>${opt.label}</option>`;
                    });
                    c += `</select>`;
                  } else {
                    c += `<input type="text" name="${field.name}" id="${
                      field.name
                    }" value="${String(field.default || "")}" />`;
                  }
                  c += `</div></div>`;
                });
                c += "</form>";
                return c;
              })(),
              buttons: {
                ok: {
                  icon: '<i class="fas fa-check"></i>',
                  label: "Set Details",
                  callback: (htmlElCb) => {
                    const formData = {};
                    featureDialogDisplayPayload.fields.forEach((field) => {
                      const inputElement = htmlElCb.find(
                        `[name="${field.name}"]`
                      );
                      formData[field.name] = inputElement.length
                        ? inputElement.val()
                        : null;
                    });
                    if (iframe.contentWindow)
                      iframe.contentWindow.postMessage(
                        {
                          type: "featureDetailsInputResponse",
                          payload: {
                            ...originalFeatureRequestFromApp,
                            ...formData,
                            cancelled: false,
                          },
                          moduleId: MODULE_ID,
                        },
                        "*"
                      );
                  },
                },
                cancel: {
                  icon: '<i class="fas fa-times"></i>',
                  label: "Cancel",
                  callback: () => {
                    if (iframe.contentWindow)
                      iframe.contentWindow.postMessage(
                        {
                          type: "featureDetailsInputResponse",
                          payload: {
                            ...originalFeatureRequestFromApp,
                            cancelled: true,
                          },
                          moduleId: MODULE_ID,
                        },
                        "*"
                      );
                  },
                },
              },
              default: "ok",
              render: (htmlElToRender) => {
                if (featureDialogDisplayPayload.fields.length > 0) {
                  setTimeout(
                    () =>
                      htmlElToRender
                        .find(
                          `[name="${featureDialogDisplayPayload.fields[0].name}"]`
                        )
                        .focus(),
                    50
                  );
                }
              },
            },
            { width: featureDialogDisplayPayload.dialogWidth }
          ).render(true);
          break;
        case "gmRequestNewHexplorationDay": // This might now be redundant if ahnTriggerNewDayProcedure is used
          if (!game.user?.isGM) return;
          await game.settings.set(
            MODULE_ID,
            SETTING_HEXPLORATION_TIME_ELAPSED_HOURS,
            0
          );
          await game.settings.set(
            MODULE_ID,
            SETTING_HEXPLORATION_KM_TRAVELED_TODAY,
            0
          );
          // The onChange handlers for these settings will broadcast "hexplorationDataUpdated"
          // Make sure those onChange handlers include currentTimeOfDay.
          // Adding an explicit broadcast of time of day after reset
          const worldTimeFormattedOnReset = new Date(
            game.time.worldTime * 1000
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          broadcastToAllIframes("hexplorationDataUpdated", {
            timeElapsedHoursToday: 0,
            kmTraveledToday: 0,
            currentTimeOfDay: worldTimeFormattedOnReset,
            forceCenterOnPartyMarker: true, //
            // Send current time of day too
          });
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ alias: "Hexploration" }),
            content: "Hexploration Day Counters Reset!", // Simpler message if time isn't advanced here
          });
          break;

        case "postChatMessage":
          if (payload && payload.content) {
            const chatData = {
              speaker: ChatMessage.getSpeaker({
                alias: payload.alias || "Hexploration System",
              }),
              content: payload.content,
            };
            if (payload.whisper && game.users.some((u) => u.isGM)) {
              chatData.whisper = ChatMessage.getWhisperRecipients("GM");
            }
            try {
              ChatMessage.create(chatData);
            } catch (chatError) {
              console.error(
                "AHME_BRIDGE: Error creating posted chat message:",
                chatError
              );
            }
          }
          break;
        case "gmPerformedHexplorationAction":
          if (!game.user?.isGM) {
            ui.notifications.warn(
              "Only GMs can perform hexploration actions that modify game state."
            );
            return;
          }
          if (
            !payload ||
            typeof payload.kmCost !== "number" ||
            typeof payload.hoursCost !== "number" ||
            !payload.logEntry
          ) {
            console.error(
              "AHME_BRIDGE: Invalid payload for gmPerformedHexplorationAction.",
              payload
            );
            ui.notifications.error(
              "AHME: Hexploration action aborted due to invalid data from iframe."
            );
            // Optionally send a failure message back to the iframe
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage(
                {
                  type: "hexplorationActionFailed",
                  payload: { error: "Invalid payload received by bridge." },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            }
            return;
          }

          const currentKmTodaySetting =
            game.settings.get(
              MODULE_ID,
              SETTING_HEXPLORATION_KM_TRAVELED_TODAY
            ) || 0;
          const currentHoursTodaySetting =
            game.settings.get(
              MODULE_ID,
              SETTING_HEXPLORATION_TIME_ELAPSED_HOURS
            ) || 0;

          const newKmTraveledToday = currentKmTodaySetting + payload.kmCost;
          const newTimeElapsedToday =
            currentHoursTodaySetting + payload.hoursCost;

          // Update game settings for daily travel
          await game.settings.set(
            MODULE_ID,
            SETTING_HEXPLORATION_KM_TRAVELED_TODAY,
            newKmTraveledToday
          );
          await game.settings.set(
            MODULE_ID,
            SETTING_HEXPLORATION_TIME_ELAPSED_HOURS,
            newTimeElapsedToday
          );
          // The onChange handlers for these settings will broadcast "hexplorationDataUpdated"
          // which now include currentTimeOfDay.

          // Advance game time
          const secondsToAdvance = Math.round(payload.hoursCost * 3600);
          if (game.time?.advance && secondsToAdvance > 0) {
            try {
              await game.time.advance(secondsToAdvance);
              console.log(
                `AHME_BRIDGE: Advanced game time by ${secondsToAdvance} seconds.`
              );
            } catch (e) {
              console.warn("AHME_BRIDGE: Failed to advance game time.", e);
              ui.notifications.warn(
                `AHME: Could not advance game time by ${payload.hoursCost} hours.`
              );
            }
          }

          // Prepare and send chat message
          const log = payload.logEntry;
          const isExploringCurrent = log.type === "exploration_current";
          let chatMessageContent = `<b>Travel Log:</b> `;

          if (isExploringCurrent) {
            chatMessageContent += `Party explored hex <b>${
              log.toHexId
            }</b> (<i>${
              log.terrainNameAtDestination || "Unknown Terrain"
            }</i>).<br>`;
          } else {
            chatMessageContent += `Party ${
              log.directionText || "moved"
            } from <b>${log.fromHexId || "N/A"}</b> to <b>${
              log.toHexId
            }</b> (<i>${
              log.terrainNameAtDestination || "Unknown Terrain"
            }</i>).<br>`;
            if (
              typeof log.distanceValue === "number" &&
              log.distanceValue > 0
            ) {
              chatMessageContent += `Distance: ${log.distanceValue.toFixed(
                1
              )} ${log.distanceUnit || "units"}. `;
            }
          }

          const timeBreakdown = log.timeBreakdown || {};
          let adjustments = [];
          if (
            timeBreakdown.terrainModifier &&
            Math.abs(timeBreakdown.terrainModifier) > 0.01
          )
            adjustments.push(
              `Terrain ${
                timeBreakdown.terrainModifier > 0 ? "+" : ""
              }${timeBreakdown.terrainModifier.toFixed(1)}`
            );
          if (
            timeBreakdown.activityModifier &&
            Math.abs(timeBreakdown.activityModifier) > 0.01
          )
            adjustments.push(
              `Activity ${
                timeBreakdown.activityModifier > 0 ? "+" : ""
              }${timeBreakdown.activityModifier.toFixed(1)}`
            );
          if (
            timeBreakdown.weatherModifier &&
            Math.abs(timeBreakdown.weatherModifier) > 0.01 &&
            log.weatherOnHex
          ) {
            adjustments.push(
              `Weather (${log.weatherOnHex.icon || ""}) ${
                timeBreakdown.weatherModifier > 0 ? "+" : ""
              }${timeBreakdown.weatherModifier.toFixed(1)}`
            );
          }
          if (
            timeBreakdown.elevationPenalty &&
            timeBreakdown.elevationPenalty > 0.01 &&
            typeof log.elevationChange === "number"
          ) {
            adjustments.push(
              `Elevation (${log.elevationChange > 0 ? "+" : ""}${
                log.elevationChange
              }m): +${timeBreakdown.elevationPenalty.toFixed(1)}`
            );
          }

          chatMessageContent += `Time: <b>${log.totalTimeValue.toFixed(1)} ${
            log.timeUnit
          }</b>`;
          if (typeof timeBreakdown.base === "number") {
            chatMessageContent += ` (Base: ${timeBreakdown.base.toFixed(1)}${
              adjustments.length ? "; " + adjustments.join(", ") : ""
            })`;
          }
          chatMessageContent += `<br>`;

          if (log.activitiesActive?.length > 0) {
            const activityNames = log.activitiesActive
              .map((a) => a.activityName || a.id) // Fallback to id if name missing
              .join(", ");
            chatMessageContent += `<i>Active Activities: ${activityNames}</i><br>`;
          }

          if (log.encounterOnEnter?.triggered) {
            let status = log.encounterOnEnter.markedByGM
              ? `Marked as '${log.encounterOnEnter.featureName}' ${log.encounterOnEnter.featureIcon}.`
              : `Skipped by GM (${
                  log.encounterOnEnter.reasonSkipped || "No details"
                }).`;
            chatMessageContent += `<i style="color: orange;">Encounter entering hex: ${status}</i><br>`;
          }

          if (log.encountersOnDiscover?.length > 0) {
            log.encountersOnDiscover.forEach((enc) => {
              if (enc.triggered) {
                let status = enc.markedByGM
                  ? `Marked as '${enc.featureName}' ${enc.featureIcon}.`
                  : `Skipped by GM (${enc.reasonSkipped || "No details"}).`;
                chatMessageContent += `<i style="color: orange;">Discovery at ${enc.hexId}: ${status}</i><br>`;
              }
            });
          }

          if (
            log.newlyDiscoveredHexIds &&
            log.newlyDiscoveredHexIds.length > 0
          ) {
            chatMessageContent += `<i>New Hexes Discovered: ${log.newlyDiscoveredHexIds.join(
              ", "
            )}</i><br>`;
          }

          const worldTimeFormattedAfterAction = new Date(
            game.time.worldTime * 1000
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          chatMessageContent += `<i>Day totals: ${newTimeElapsedToday.toFixed(
            1
          )}h, ${newKmTraveledToday.toFixed(
            1
          )}km. Current time: ${worldTimeFormattedAfterAction}.</i>`;

          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ alias: "Hexploration Log" }),
            content: chatMessageContent,
            // Consider adding whisper: ChatMessage.getWhisperRecipients("GM") if this log is too verbose for players
          });

          // Broadcast updated hexploration data.
          // The onChange handlers for the settings should ideally cover this,
          // but an explicit broadcast ensures the very latest time of day is sent with the new totals.
          broadcastToAllIframes("hexplorationDataUpdated", {
            timeElapsedHoursToday: newTimeElapsedToday,
            kmTraveledToday: newKmTraveledToday,
            currentTimeOfDay: worldTimeFormattedAfterAction,
            forceCenterOnPartyMarker: true, //
            // Crucial: send updated time
          });
          break;

        case "gmSyncTravelAnimationToFoundry":
          console.log(
            `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}): Case "gmSyncTravelAnimationToFoundry". Payload:`,
            "color: #FFA500;",
            payload
          );

          if (game.user?.isGM && event.data.moduleId === MODULE_ID) {
            // 1. Update the GM's own iframe(s) immediately via postMessage
            // This is still useful so the GM's own view is snappy.
            console.log(
              `%cAHME BRIDGE (GM - ${game.user?.id}): Calling broadcastToAllIframes locally for ahnSyncTravelAnimation to update GM's own view.`,
              "color: #FFA500; font-weight: bold;"
            );
            broadcastToAllIframes("ahnSyncTravelAnimation", payload);

            // 2. Trigger players by setting the 'animationTrigger' world setting.
            const triggerData = {
              timestamp: Date.now(),
              payload: payload,
            };
            console.log(
              `%cAHME BRIDGE (GM - ${game.user?.id}): Setting 'animationTrigger' to trigger other clients. Data:`,
              "color: #FF69B4; font-weight: bold;",
              JSON.parse(JSON.stringify(triggerData))
            );
            game.settings.set(MODULE_ID, "animationTrigger", triggerData);

            // The custom socket emit for 'ahme_sync_travel_animation_socket' could be removed here.
          } else if (!game.user?.isGM) {
            console.warn(
              `%cAHME BRIDGE (Player - ${game.user?.id}): Received 'gmSyncTravelAnimationToFoundry' but not GM. Ignoring.`,
              "color: red;"
            );
          }
          break;

        case "ahnGetPartyActivities": // Message from iframe to bridge
          console.log(
            `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}): Case 'ahnGetPartyActivities'.`,
            "color: #20B2AA;"
          );
          if (iframe.contentWindow) {
            const currentActivities =
              game.settings.get(MODULE_ID, "partyActivities") || {};
            console.log(
              `%cAHME BRIDGE (User: ${game.user?.id}): Sending 'ahnInitialPartyActivities' to requesting iframe. Payload:`,
              "color: #20B2AA;",
              JSON.parse(JSON.stringify(currentActivities))
            );
            iframe.contentWindow.postMessage(
              {
                type: "ahnInitialPartyActivities",
                payload: currentActivities,
                moduleId: MODULE_ID,
              },
              "*"
            );
          }
          break;

        case "ahnUpdatePartyActivities": // Message from iframe to its bridge (sent by GM or Player iframe)
          const initiatorUserId = game.user
            ? game.user.id
            : "UNKNOWN_IFRAME_USER";
          const isInitiatorGM = game.user ? game.user.isGM : false;
          console.log(
            `%cAHME BRIDGE (User: ${initiatorUserId}, isGM: ${isInitiatorGM}): Case 'ahnUpdatePartyActivities'. Received from local iframe. Payload:`,
            "color: #FF6347; font-weight: bold;",
            JSON.parse(JSON.stringify(payload))
          );

          if (payload) {
            if (isInitiatorGM) {
              // GM directly sets the world setting
              console.log(
                `%cAHME BRIDGE (GM - ${initiatorUserId}): Is GM. Attempting to save party activities directly to settings. Payload:`,
                "color: #FF6347;",
                JSON.parse(JSON.stringify(payload))
              );
              game.settings
                .set(MODULE_ID, "partyActivities", payload)
                .then(() => {
                  console.log(
                    `%cAHME BRIDGE (GM - ${initiatorUserId}): Party activities successfully set by GM. 'onChange' hook will propagate.`,
                    "color: #32CD32; font-weight: bold;"
                  );
                })
                .catch((err) => {
                  console.error(
                    `%cAHME BRIDGE (GM - ${initiatorUserId}): Error setting party activities:`,
                    "color: red; font-weight: bold;",
                    err
                  );
                });
            } else {
              // Player cannot set world setting directly. Emit socket to GMs.
              if (game.socket) {
                console.log(
                  `%cAHME BRIDGE (Player - ${initiatorUserId}): Is Player. Emitting 'playerRequestsGMToSetPartyActivities' to GMs. Payload:`,
                  "color: #FF8C00; font-weight:bold;",
                  JSON.parse(JSON.stringify(payload))
                );
                game.socket.emit(AHME_SOCKET_NAME, {
                  ahmeEvent: "playerRequestsGMToSetPartyActivities",
                  payload: payload,
                  senderId: initiatorUserId,
                });
              } else {
                console.warn(
                  `%cAHME BRIDGE (Player - ${initiatorUserId}): game.socket not available. Cannot send activity update request to GM.`,
                  "color: orange;"
                );
              }
            }
          } else {
            console.warn(
              `%cAHME BRIDGE (User: ${initiatorUserId}): 'ahnUpdatePartyActivities' received with null/undefined payload. Ignoring.`,
              "color: orange;"
            );
          }
          break;

        default:
          // console.warn(`AHME BRIDGE: Unhandled message type '${type}' from iframe. Payload:`, payload);
          break;
      }
    };
    this._messageHandler = messageHandler.bind(this);
    window.addEventListener("message", this._messageHandler);
  }

  async close(options) {
    if (this._messageHandler) {
      window.removeEventListener("message", this._messageHandler);
      delete this._messageHandler;
    }
    return super.close(options);
  }
}

// New helper function for advancing time
async function advanceTimeToTargetFoundry(
  targetHour,
  targetMinute,
  iframeToRespond
) {
  if (!game.time || !game.time.advance) {
    ui.notifications.warn(
      "AHME: Game time system not available to advance time."
    );
    if (iframeToRespond)
      iframeToRespond.postMessage(
        { type: "timeAdvanceFailed", moduleId: MODULE_ID },
        "*"
      );
    return;
  }
  try {
    const currentWorldTime = game.time.worldTime;
    const currentDate = new Date(currentWorldTime * 1000);

    let targetDate = new Date(currentDate);
    targetDate.setHours(targetHour, targetMinute, 0, 0);

    if (targetDate <= currentDate) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    targetDate.setHours(targetHour, targetMinute, 0, 0);

    const secondsToAdvance = Math.max(
      0,
      Math.floor((targetDate.getTime() - currentDate.getTime()) / 1000)
    );

    if (secondsToAdvance > 0) {
      await game.time.advance(secondsToAdvance);
      ui.notifications.info(
        `Advanced game time to ${targetDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })} for new Hexploration day.`
      );
    } else {
      ui.notifications.info(
        `Game time is already at or past target for the new Hexploration day.`
      );
    }

    // After time advance, always broadcast updated data including the new time of day
    const worldTimeFormatted = new Date(
      game.time.worldTime * 1000
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Reset hexploration day counters in settings
    await game.settings.set(
      MODULE_ID,
      SETTING_HEXPLORATION_KM_TRAVELED_TODAY,
      0
    );
    await game.settings.set(
      MODULE_ID,
      SETTING_HEXPLORATION_TIME_ELAPSED_HOURS,
      0
    );
    // The onChange handlers for these settings will broadcast. Let's ensure timeOfDay is included.
    // To be safe, we can also explicitly broadcast here or ensure onChange includes it.
    // For now, let's rely on the onChange hooks being updated.
    // If they don't pick up the time of day, an explicit broadcast here is needed.
    // Let's add an explicit one here to be certain the iframe gets the ToD with the reset counters.
    broadcastToAllIframes("hexplorationDataUpdated", {
      timeElapsedHoursToday: 0,
      kmTraveledToday: 0,
      currentTimeOfDay: worldTimeFormatted,
      forceCenterOnPartyMarker: true, //
    });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Hexploration" }),
      content: "A new day of hexploration begins!",
    });
  } catch (e) {
    console.error("AHME_BRIDGE: Error advancing game time:", e);
    ui.notifications.error("AHME: Failed to advance game time for new day.");
    if (iframeToRespond)
      iframeToRespond.postMessage(
        { type: "timeAdvanceFailed", moduleId: MODULE_ID },
        "*"
      );
  }
}

function toggleHexMapApplication() {
  const app = Object.values(ui.windows).find(
    (a) => a.id === "hexmap-app" && a instanceof HexMapApplication
  );
  if (app) app.close();
  else new HexMapApplication().render(true);
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_MAP_DATA, {
    name: "AHME Map Data",
    scope: "world",
    config: false,
    type: String,
    default: "{}",
  });

  game.settings.register(MODULE_ID, "partyActivities", {
    name: "Hexploration Party Activities",
    hint: "Stores the current party activities for Hexploration.",
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: (newActivities) => {
      const currentUserId = game.user ? game.user.id : "UNKNOWN_USER";
      const isCurrentUserGM = game.user ? game.user.isGM : false;
      console.log(
        `%cAHME BRIDGE (User: ${currentUserId}, isGM: ${isCurrentUserGM}) - !!! SETTING 'partyActivities' onChange HOOK FIRED !!! New Activities:`,
        "background: #FFFF00; color: black; font-size: 14px; font-weight: bold;",
        JSON.parse(JSON.stringify(newActivities))
      );

      console.log(
        `%cAHME BRIDGE (User: ${currentUserId}, isGM: ${isCurrentUserGM}) - Broadcasting 'ahnInitialPartyActivities' from 'partyActivities' onChange hook. Payload:`,
        "color: #20B2AA; font-weight: bold;",
        JSON.parse(JSON.stringify(newActivities || {}))
      );
      broadcastToAllIframes("ahnInitialPartyActivities", newActivities || {});
    },
  });

  game.settings.register(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID, {
    name: "AHME Active GM Map ID",
    scope: "world",
    config: false,
    type: String,
    default: null,
    onChange: async (newActiveMapId) => {
      console.log(
        `%cAHME BRIDGE Hook SETTING_ACTIVE_GM_MAP_ID onChange. New Active GM Map ID: ${newActiveMapId}`,
        "color: orange;"
      );
      broadcastToAllIframes("activeMapChanged", {
        activeGmMapId: newActiveMapId,
      });
      // Also update the map list for all iframes when the active map changes,
      // as this is a good point to ensure lists are synchronized.
      const currentModuleData = await getModuleData();
      const mapListPayload = {
        mapList: Object.entries(currentModuleData.maps || {}).map(
          ([id, mapInfo]) => ({ id, name: mapInfo.name })
        ),
        newActiveGmMapId: newActiveMapId, // ensure this is part of the payload
      };
      broadcastToAllIframes("mapListUpdated", mapListPayload);
    },
  });

  // At the end of Hooks.once("init", () => { ... game.settings.register(...); ... });
  // ADD THIS NEW SETTING REGISTRATION
  game.settings.register(MODULE_ID, "animationTrigger", {
    name: "AHME Animation Trigger",
    scope: "world", // Must be world to sync
    config: false, // Not user-configurable
    type: Object, // Store a small object like { timestamp: Date.now(), payload: ... }
    default: {},
    onChange: (data) => {
      // This onChange hook will fire on ALL clients (GM and Players)
      console.log(
        `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}) - SETTING 'animationTrigger' onChange. Data:`,
        "background: #FFD700; color: #000; font-weight: bold;",
        data
      );
      if (data && data.payload && data.timestamp) {
        // Avoid GM reprocessing its own trigger if it also has an iframe open
        // And ensure players only process it once (though timestamp helps)
        // The main goal is for PLAYER clients to react to this.
        // The GM's iframe will be updated directly by its bridge via postMessage anyway.

        // Let's check if this client has already processed this specific trigger
        // This is a simple way to avoid re-processing if the setting change somehow fires multiple times rapidly
        if (game.user._ahme_lastAnimationTriggerProcessed !== data.timestamp) {
          console.log(
            `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}) - Processing 'animationTrigger' setting change. Broadcasting 'ahnSyncTravelAnimation' to local iframe(s). Payload:`,
            "color: #9370DB; font-weight: bold;",
            data.payload
          );
          broadcastToAllIframes("ahnSyncTravelAnimation", data.payload);
          game.user._ahme_lastAnimationTriggerProcessed = data.timestamp; // Mark as processed
        } else {
          console.log(
            `%cAHME BRIDGE (User: ${game.user?.id}, isGM: ${game.user?.isGM}) - Already processed 'animationTrigger' for timestamp ${data.timestamp}. Ignoring.`,
            "color: #DAA520;"
          );
        }
      }
    },
  });

  game.settings.register(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS, {
    name: "Hexploration: Hours into Day",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: (value) => {
      const worldTimeFormatted = new Date(
        game.time.worldTime * 1000
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      broadcastToAllIframes("hexplorationDataUpdated", {
        timeElapsedHoursToday: value,
        kmTraveledToday:
          game.settings.get(
            MODULE_ID,
            SETTING_HEXPLORATION_KM_TRAVELED_TODAY
          ) || 0,
        currentTimeOfDay: worldTimeFormatted,
        forceCenterOnPartyMarker: true, //
      });
    },
  });
  game.settings.register(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY, {
    name: "Hexploration: Km Traveled Today",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: (value) => {
      const worldTimeFormatted = new Date(
        game.time.worldTime * 1000
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      broadcastToAllIframes("hexplorationDataUpdated", {
        timeElapsedHoursToday:
          game.settings.get(
            MODULE_ID,
            SETTING_HEXPLORATION_TIME_ELAPSED_HOURS
          ) || 0,
        kmTraveledToday: value,
        currentTimeOfDay: worldTimeFormatted,
        forceCenterOnPartyMarker: true, //
      });
    },
  });
  game.settings.register(MODULE_ID, "partyActivities", {
    name: "Hexploration Party Activities",
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: (newActivities) => {
      // This fires on ALL clients after a GM successfully sets it
      const currentUserId = game.user ? game.user.id : "UNKNOWN_USER";
      const isCurrentUserGM = game.user ? game.user.isGM : false;
      console.log(
        `%cAHME BRIDGE (User: ${currentUserId}, isGM: ${isCurrentUserGM}) - !!! SETTING 'partyActivities' onChange HOOK FIRED !!! New Activities:`,
        "background: #FFFF00; color: black; font-size: 14px; font-weight: bold;",
        JSON.parse(JSON.stringify(newActivities))
      );
      broadcastToAllIframes("ahnInitialPartyActivities", newActivities || {});
    },
  });

  game.keybindings.register(MODULE_ID, "toggleHexMap", {
    name: "Toggle Hex Map Editor",
    hint: "Opens/closes editor.",
    editable: [{ key: "KeyM", modifiers: [] }],
    onDown: () => {
      toggleHexMapApplication();
      return true;
    },
  });
  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api = { toggleHexMap: toggleHexMapApplication };
  }
});

Hooks.once("renderDialog", () => {
  if (!document.getElementById("hexmap-dialog-form-style-global")) {
    const styleElement = document.createElement("style");
    styleElement.id = "hexmap-dialog-form-style-global";
    styleElement.textContent = `.dialog-form-flex .form-group { display: flex; align-items: center; margin-bottom: 8px; } .dialog-form-flex .form-group label { flex: 0 0 150px; margin-right: 10px; text-align: right; white-space: nowrap; } .dialog-form-flex .form-fields { flex: 1; } .dialog-form-flex .form-fields input, .dialog-form-flex .form-fields select { width: 100%; box-sizing: border-box; }`;
    document.head.appendChild(styleElement);
  }
});
