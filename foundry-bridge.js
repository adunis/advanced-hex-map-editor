/**
 * foundry-bridge.js
 * Handles communication between Foundry VTT and the embedded hex map editor iframe.
 */

const MODULE_ID = "advanced-hex-map-editor";
const SETTING_MAP_DATA = "hexMapData";
const SETTING_ACTIVE_GM_MAP_ID = "activeGmMapId";
const SETTING_HEXPLORATION_TIME_ELAPSED_HOURS =
  "hexplorationTimeElapsedHoursToday";
const SETTING_HEXPLORATION_KM_TRAVELED_TODAY = "hexplorationKmTraveledToday";

// --- HELPER FUNCTIONS ---
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
    // ... (parsing logic for savedJson) ...
    data = JSON.parse(savedJson || '{}'); // Ensure data is at least an empty object
  } catch (e) { /* ... error handling ... */ data = {}; }

  if (!data || typeof data !== "object") data = { maps: {} };
  if (!data.maps) data.maps = {};

  // Ensure all maps have the new eventLog structure (for backward compatibility)
  for (const mapId in data.maps) {
    if (data.maps.hasOwnProperty(mapId)) {
      const map = data.maps[mapId]; // This 'map' IS THE OBJECT FROM SAVED DATA
      if (!map.exploration || typeof map.exploration.discoveredHexIds === "undefined") {
        map.exploration = { discoveredHexIds: [] };
      }
      if (map.partyMarkerPosition === undefined) {
        map.partyMarkerPosition = null;
      }
      // THIS IS THE CRITICAL PART:
      // If map.eventLog is undefined (e.g. from an old save before eventLog existed),
      // this ensures it becomes an empty array ON THE OBJECT RETRIEVED FROM SETTINGS.
      if (!Array.isArray(map.eventLog)) { 
        map.eventLog = []; 
        // console.log(`${MODULE_ID} | BRIDGE getModuleData: Initialized eventLog for map ${mapId} as empty array.`);
      }
    }
  }
  return data; // This data.maps[mapId].eventLog should contain the actual saved log
}


async function saveModuleData(data) {
  try {
    const dataToSave = data && typeof data === "object" ? data : { maps: {} };
    await game.settings.set(
      MODULE_ID,
      SETTING_MAP_DATA,
      JSON.stringify(dataToSave)
    );
    console.log(`${MODULE_ID} | BRIDGE: Module data saved successfully.`);
    return true;
  } catch (e) {
    console.error(
      `${MODULE_ID} | BRIDGE CRITICAL: Error saving module data:`,
      e
    );
    ui.notifications.error(`CRITICAL: Failed to save ${MODULE_ID} data.`);
    return false;
  }
}

// --- APPLICATION CLASS ---
class HexMapApplication extends Application {
  constructor(options = {}) {
    super(options);
    this.initialPayloadForIframe = null;
    console.log(`${MODULE_ID} | BRIDGE: HexMapApplication instance created.`);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "hexmap-app",
      title: "Advanced Hex Map Editor",
      template: `modules/${MODULE_ID}/templates/hexmap-app.html`,
      width: window.innerWidth * 0.8,
      height: window.innerHeight * 0.8,
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

    this.initialPayloadForIframe = {
      mapList: Object.entries(completeModuleData.maps || {}).map(
        ([id, mapInfo]) => ({
          id: id,
          name: mapInfo.name || "Unnamed Map",
        })
      ),
      activeGmMapId: activeGmMapIdSetting || null,
    };
    console.log(
      `${MODULE_ID} | BRIDGE getData: Prepared initial payload for iframe.`
    );
    return appTemplateData;
  }

  activateListeners(html) {
    super.activateListeners(html);
    const iframe = html.find("#hexmap-iframe")[0];
    if (!iframe) {
      console.error(
        `${MODULE_ID} | BRIDGE CRITICAL: Iframe #hexmap-iframe not found.`
      );
      return;
    }
    console.log(
      `${MODULE_ID} | BRIDGE: Iframe element found. Attaching message listener.`
    );

    const messageHandler = async (event) => {
      if (!event.data || typeof event.data !== "object") {
        return;
      }
      if (event.data.moduleId !== MODULE_ID) {
        return;
      }
      const { type, payload } = event.data; 

      if (type === undefined) {
        console.error(
          `${MODULE_ID} | BRIDGE ERROR: Message received with UNDEFINED type but CORRECT moduleId. Full event.data:`,
          JSON.parse(JSON.stringify(event.data)),
          "Origin:",
          event.origin
        );
        return; 
      }

      console.log(
        `${MODULE_ID} | BRIDGE MSG FROM IFRAME: Type: '${type}', HasPayload: ${!!payload}`
      );
      let moduleData;
      let mapId;

      switch (type) {
        case "jsAppReady":
          console.log(`${MODULE_ID} | BRIDGE: Iframe reported 'jsAppReady'.`);
          if (iframe.contentWindow && this.initialPayloadForIframe) {
            iframe.contentWindow.postMessage(
              {
                type: "initialData",
                payload: this.initialPayloadForIframe,
                moduleId: MODULE_ID,
              },
              "*"
            );
          } else {
            console.error(
              `${MODULE_ID} | BRIDGE: Cannot send 'initialData': iframe window or payload missing.`
            );
          }
          break;

        case "requestMapLoad":
          if (!payload || !payload.mapId) {
            console.error(
              `${MODULE_ID} | BRIDGE: Invalid 'requestMapLoad', missing mapId.`
            );
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
        moduleData = await getModuleData(); // This retrieves all maps, with eventLogs potentially initialized
          const mapToLoad = moduleData.maps[payload.mapId]; // Get the specific map object

          if (mapToLoad && iframe.contentWindow) {
            // Defaults for safety, though getModuleData should have handled eventLog initialization
            if (!mapToLoad.exploration) mapToLoad.exploration = { discoveredHexIds: [] };
            if (mapToLoad.partyMarkerPosition === undefined) mapToLoad.partyMarkerPosition = null;
            if (!Array.isArray(mapToLoad.eventLog)) {
                 // This log would indicate getModuleData failed to initialize it, or it got corrupted.
                console.warn(`${MODULE_ID} | BRIDGE requestMapLoad: mapToLoad.eventLog for map ${payload.mapId} was not an array. Defaulting to empty. mapToLoad.eventLog was:`, mapToLoad.eventLog);
                mapToLoad.eventLog = []; 
            }

            // LOG WHAT IS ABOUT TO BE SENT
            console.log(`${MODULE_ID} | BRIDGE requestMapLoad: Sending mapDataLoaded for map ${payload.mapId}. EventLog length: ${mapToLoad.eventLog?.length}. First entry (if any):`, mapToLoad.eventLog?.[0]);

            iframe.contentWindow.postMessage(
              { 
                type: "mapDataLoaded", 
                payload: { // Explicitly list properties again for utmost clarity
                    mapId: payload.mapId, 
                    name: mapToLoad.name,
                    gridSettings: mapToLoad.gridSettings,
                    hexes: mapToLoad.hexes,
                    exploration: mapToLoad.exploration,
                    partyMarkerPosition: mapToLoad.partyMarkerPosition,
                    eventLog: mapToLoad.eventLog // This should be the actual saved (or newly initialized empty) log
                }, 
                moduleId: MODULE_ID, 
              }, 
              "*"
            );
          }
          break;

    case "saveMapData":
          if (!game.user?.isGM) { ui.notifications.warn("Only GMs can save map data."); return; }
          
          let validationError = null;
          if (!payload) validationError = "Payload missing.";
          // ... (other validation checks for mapData, mapName, explorationData, partyMarkerPosition) ...
          else if (payload.eventLog === undefined || !Array.isArray(payload.eventLog)) { // Validation for eventLog
            validationError = "Missing or invalid 'eventLog' (must be an array).";
            console.error(`${MODULE_ID} | BRIDGE: saveMapData payload.eventLog is problematic:`, payload.eventLog);
          }


          if (validationError) {
            console.error(`${MODULE_ID} | BRIDGE: Invalid 'saveMapData' payload: ${validationError}. Payload received:`, JSON.parse(JSON.stringify(payload)));
            if (iframe.contentWindow) iframe.contentWindow.postMessage(
                { type: "mapSaveFailed", payload: { mapId: payload?.mapId, error: `Invalid save data: ${validationError}` }, moduleId: MODULE_ID, }, "*");
            return;
          }

          moduleData = await getModuleData(); // Gets current data, possibly with empty eventLogs for maps
          mapId = payload.mapId || generateUUID();

          // LOG WHAT IS BEING RECEIVED FROM IFRAME FOR SAVING
          console.log(`${MODULE_ID} | BRIDGE saveMapData: Payload from iframe for map ${mapId} ('${payload.mapName}'). EventLog length: ${payload.eventLog?.length}. First entry:`, payload.eventLog?.[0]);

          moduleData.maps[mapId] = {
            name: payload.mapName.trim(),
            gridSettings: payload.mapData.gridSettings,
            hexes: payload.mapData.hexes,
            exploration: { discoveredHexIds: payload.explorationData.discoveredHexIds, },
            partyMarkerPosition: payload.partyMarkerPosition,
            eventLog: payload.eventLog || [], // CRITICAL: Use the eventLog from the payload
            lastUpdated: Date.now(),
          };
          
          // LOG WHAT IS ABOUT TO BE SAVED TO SETTINGS
          console.log(`${MODULE_ID} | BRIDGE saveMapData: Data for map ${mapId} being written to settings. EventLog length: ${moduleData.maps[mapId].eventLog?.length}. First entry:`, moduleData.maps[mapId].eventLog?.[0]);


          if (await saveModuleData(moduleData)) { // This calls game.settings.set
            // ... (notifications, active map update, post message 'mapListUpdated') ...
          } else { /* ... mapSaveFailed ... */ }
          break;
        case "deleteMap":
          if (!game.user?.isGM) {
            ui.notifications.warn("Only GMs can delete maps.");
            return;
          }
          if (!payload || !payload.mapId) {
            console.error(
              `${MODULE_ID} | BRIDGE: Invalid 'deleteMap', missing mapId.`
            );
            return;
          }
          moduleData = await getModuleData();
          mapId = payload.mapId;
          if (moduleData.maps[mapId]) {
            const mapNameToDelete = moduleData.maps[mapId].name;
            delete moduleData.maps[mapId];
            if (await saveModuleData(moduleData)) {
              ui.notifications.info(`Map '${mapNameToDelete}' deleted!`);
              if (
                game.settings.get(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID) === mapId
              ) {
                await game.settings.set(
                  MODULE_ID,
                  SETTING_ACTIVE_GM_MAP_ID,
                  null
                );
              }
              if (iframe.contentWindow) {
                const newMapList = Object.entries(moduleData.maps).map(
                  ([id_entry, mapInfo]) => ({
                    id: id_entry,
                    name: mapInfo.name,
                  })
                );
                iframe.contentWindow.postMessage(
                  {
                    type: "mapListUpdated",
                    payload: {
                      mapList: newMapList,
                      deletedMapId: mapId,
                      newActiveGmMapId: game.settings.get(
                        MODULE_ID,
                        SETTING_ACTIVE_GM_MAP_ID
                      ),
                    },
                    moduleId: MODULE_ID,
                  },
                  "*"
                );
              }
            }
          } else {
            ui.notifications.warn(`Map ID '${mapId}' not found for deletion.`);
          }
          break;

        case "requestMapNameInput":
          if (!game.user?.isGM) {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "mapNameInputResponse",
                  payload: { error: "Permission denied" },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }
          new Dialog({
            title: payload.title || "Enter Name",
            content: `<form><div class="form-group"><label>${
              payload.label || "Name:"
            }</label><input type="text" name="mapNameInput" value="${
              payload.defaultName || ""
            }"/></div></form>`,
            buttons: {
              ok: {
                icon: '<i class="fas fa-check"></i>',
                label: "OK",
                callback: (htmlEl) => {
                  const mapName = htmlEl
                    .find('input[name="mapNameInput"]')
                    .val()
                    ?.trim();
                  if (iframe.contentWindow)
                    iframe.contentWindow.postMessage(
                      {
                        type: "mapNameInputResponse",
                        payload: { mapName: mapName || null },
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
                        type: "mapNameInputResponse",
                        payload: { mapName: null, cancelled: true },
                        moduleId: MODULE_ID,
                      },
                      "*"
                    );
                },
              },
            },
            default: "ok",
            render: (htmlEl) => {
              setTimeout(
                () => htmlEl.find('input[name="mapNameInput"]').focus(),
                50
              );
            },
          }).render(true);
          break;

        case "gmSetActiveMap":
          if (!game.user?.isGM) return;
          const newActiveMapId =
            payload &&
            (typeof payload.mapId === "string" || payload.mapId === null)
              ? payload.mapId
              : null;
          if (
            newActiveMapId !==
            game.settings.get(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID)
          ) {
            await game.settings.set(
              MODULE_ID,
              SETTING_ACTIVE_GM_MAP_ID,
              newActiveMapId
            );
          }
          break;

        case "requestFeatureDetailsInput":
          if (!game.user?.isGM) {
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "featureDetailsInputResponse",
                  payload: {
                    error: "Permission denied",
                    hexId: payload?.hexId,
                    featureType: payload?.featureType, // featureType is lowercase here
                  },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }
          if (!payload || !payload.hexId || !payload.featureType) {
            console.error(
              `${MODULE_ID} | BRIDGE: Invalid 'requestFeatureDetailsInput', missing data.`
            );
            if (iframe.contentWindow)
              iframe.contentWindow.postMessage(
                {
                  type: "featureDetailsInputResponse",
                  payload: {
                    error: "Bridge: Invalid request",
                    hexId: payload?.hexId,
                    featureType: payload?.featureType, // featureType is lowercase here
                  },
                  moduleId: MODULE_ID,
                },
                "*"
              );
            return;
          }
          
          // payload.featureType is already lowercase (e.g., "landmark", "secret")
          const isLandmarkDialog = payload.featureType === "landmark";
          const isSecretDialog = payload.featureType === "secret";

          let dialogContentHTML = `<form><div class="form-group"><label for="featureNameInput">${
            isLandmarkDialog
              ? "Landmark Name:"
              : isSecretDialog
              ? "Secret Note/Name (GM Only):"
              : "Feature Name:" // Fallback, though should be landmark or secret
          }</label><input type="text" id="featureNameInput" name="featureNameInput" value="${
            payload.defaultName || ""
          }"/></div>`;
          
          if (isLandmarkDialog) {
            const landmarkIcons = [ // These should match CONST.TerrainFeature if possible, or be independent
              { char: "★", name: "Star" }, { char: "⚐", name: "Flag" },
              { char: "⌖", name: "Target" }, { char: "📍", name: "Pin" },
              { char: "⚜", name: "Fleur-de-lis" }, { char: "⛺", name: "Camp" },
              { char: "⚔", name: "Battle" }, { char: "☠", name: "Danger" },
            ];
            dialogContentHTML += `<div class="form-group"><label for="featureIconSelect">Icon:</label><select name="featureIconSelect" id="featureIconSelect">`;
            const defaultIconForSelect = payload.defaultIcon || "★"; 
            landmarkIcons.forEach((icon) => {
              dialogContentHTML += `<option value="${icon.char}" ${
                icon.char === defaultIconForSelect ? "selected" : ""
              }>${icon.char} (${icon.name})</option>`;
            });
            dialogContentHTML += `</select></div>`;
          }
          dialogContentHTML += `</form>`;

          new Dialog({
            title: `Set ${
              isLandmarkDialog
                ? "Landmark"
                : isSecretDialog
                ? "Secret"
                : "Feature" 
            } Details for Hex ${payload.hexId}`,
            content: dialogContentHTML,
            buttons: {
              ok: {
                icon: '<i class="fas fa-check"></i>',
                label: "Set Details",
                callback: (htmlElCb) => {
                  const featureName =
                    htmlElCb
                      .find('input[name="featureNameInput"]')
                      .val()
                      ?.trim() || "";
                  let featureIcon = null;
                  if (isLandmarkDialog) { // Only get icon if it was a landmark dialog
                    featureIcon = htmlElCb
                      .find('select[name="featureIconSelect"]')
                      .val();
                  }
                  if (iframe.contentWindow)
                    iframe.contentWindow.postMessage(
                      {
                        type: "featureDetailsInputResponse",
                        payload: {
                          hexId: payload.hexId,
                          featureType: payload.featureType, // Pass back the original lowercase featureType
                          featureName: featureName,
                          featureIcon: featureIcon, 
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
                          hexId: payload.hexId,
                          featureType: payload.featureType, // Pass back the original lowercase featureType
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
              setTimeout(
                () =>
                  htmlElToRender.find('input[name="featureNameInput"]').focus(),
                50
              );
            },
          }).render(true);
          break;

        case "gmRequestNewHexplorationDay":
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
          const newDayData = { timeElapsedHoursToday: 0, kmTraveledToday: 0 };
          Object.values(ui.windows).forEach((appWindow) => {
            if (
              appWindow.id === "hexmap-app" &&
              appWindow.element?.length &&
              appWindow instanceof HexMapApplication
            ) {
              const otherIframe = appWindow.element.find("#hexmap-iframe")[0];
              if (otherIframe && otherIframe.contentWindow) {
                otherIframe.contentWindow.postMessage(
                  {
                    type: "hexplorationDataUpdated",
                    payload: newDayData,
                    moduleId: MODULE_ID,
                  },
                  "*"
                );
              }
            }
          });
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ alias: "Hexploration" }),
            content: "A new day of hexploration begins!",
          });
          break;

case "gmPerformedHexplorationAction":
          if (!game.user?.isGM) {
            console.warn(`${MODULE_ID} | Bridge: Non-GM attempted hexploration action.`);
            return;
          }

          if (payload && 
              typeof payload.kmCost === 'number' && 
              typeof payload.hoursCost === 'number' && 
              payload.logEntry && typeof payload.logEntry === 'object') {

            let kmTraveledToday = (game.settings.get(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY) || 0) + payload.kmCost;
            await game.settings.set(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY, kmTraveledToday);
            
            let timeElapsedToday = (game.settings.get(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS) || 0) + payload.hoursCost;
            await game.settings.set(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS, timeElapsedToday);

            const secondsToAdvance = Math.round(payload.hoursCost * 3600);
            if (game.time?.advance && secondsToAdvance > 0) {
              try {
                await game.time.advance(secondsToAdvance);
                // console.log(`${MODULE_ID} | Bridge: Advanced game time by ${secondsToAdvance} seconds.`);
              } catch (e) {
                console.warn(`${MODULE_ID} | Bridge: Failed to advance game time. ${e.message}`);
              }
            } else if (secondsToAdvance <=0) {
                // console.log(`${MODULE_ID} | Bridge: No game time advancement as hoursCost is zero or negative.`);
            }


            const log = payload.logEntry;
            let chatMessageContent = `<b>Travel Log:</b> Party moved ${log.direction || 'in an unknown direction'} to hex ${log.to} (<i>${log.targetTerrain || 'Unknown Terrain'}</i>).<br>`;
            chatMessageContent += `Distance: ${log.distanceKm} km. Base time for hex: ${log.baseTime.toFixed(1)}h.<br>`;
            
            let adjustmentsDetail = "";
            // Calculate terrain effect based on log.terrainModifiedTime and log.baseTime
            const terrainTimeEffect = (log.terrainModifiedTime || log.baseTime) - log.baseTime; 

            if (Math.abs(terrainTimeEffect) > 0.01) { // If terrain had any significant effect
                if (terrainTimeEffect < 0) { // Time saved
                    adjustmentsDetail += `Terrain bonus (${log.targetTerrain || 'terrain'}): <span style="color: green;">-${Math.abs(terrainTimeEffect).toFixed(1)}h</span>. `;
                } else { // Time added
                    adjustmentsDetail += `Terrain penalty (${log.targetTerrain || 'terrain'}): <span style="color: red;">+${terrainTimeEffect.toFixed(1)}h</span>. `;
                }
            }

            if (log.elevationPenalty > 0.01) {
                const elevChangeFormatted = `${log.elevationChange > 0 ? '+' : ''}${log.elevationChange}m`;
                adjustmentsDetail += `Elevation penalty (${elevChangeFormatted}): <span style="color: red;">+${log.elevationPenalty.toFixed(1)}h</span>. `;
            }

            if (adjustmentsDetail) {
                chatMessageContent += `Adjustments: ${adjustmentsDetail.trim()}<br>`;
            }
            chatMessageContent += `Total time for this leg: <b>${log.totalTime.toFixed(1)}h</b>.<br>`;
            // Use the locally updated timeElapsedToday and kmTraveledToday for the summary line
            chatMessageContent += `<i>Day totals: ${timeElapsedToday.toFixed(1)}h, ${kmTraveledToday}km.</i>`;
            
            // Placeholder for encounter status from log.encounterStatus if implemented there
            // This would require HexplorationLogic.checkRandomEncounters to return data to map-logic
            // or for map-logic to update log.encounterStatus before sending.
            // For now, HexplorationLogic.checkRandomEncounters posts its own messages.
            // if(log.encounterStatus && log.encounterStatus !== "No encounters checked by this system yet.") {
            //    chatMessageContent += `<br><i>${log.encounterStatus}</i>`;
            // }


            ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ alias: "Hexploration Log" }), // Or "Party Log"
              content: chatMessageContent,
              // whisper: ChatMessage.getWhisperRecipients("GM") // Optional: GM only
            });

            const updatedHexplorationDataForUI = { 
                kmTraveledToday: kmTraveledToday, 
                timeElapsedHoursToday: timeElapsedToday,
            };

            Object.values(ui.windows).forEach((appWindow) => {
              if (appWindow.id === "hexmap-app" && appWindow.element?.length && appWindow instanceof HexMapApplication) {
                const otherIframe = appWindow.element.find("#hexmap-iframe")[0];
                if (otherIframe && otherIframe.contentWindow) {
                  otherIframe.contentWindow.postMessage( 
                      { type: "hexplorationDataUpdated", payload: updatedHexplorationDataForUI, moduleId: MODULE_ID, }, "*");
                }
              }
            });
          } else {
              console.warn(`${MODULE_ID} | Bridge: gmPerformedHexplorationAction received invalid or incomplete payload. Required: kmCost, hoursCost, logEntry. Payload:`, payload);
          }
          break;
        case "postChatMessage":
          if (payload && payload.content) {
            const chatData = {
              speaker: ChatMessage.getSpeaker({
                alias: payload.alias || "Hexploration System",
              }),
              content: payload.content,
            };
            if (
              payload.whisper &&
              game.users.filter((u) => u.isGM).length > 0
            ) {
              chatData.whisper = ChatMessage.getWhisperRecipients("GM");
            }
            ChatMessage.create(chatData);
          }
          break;

        default:
          console.warn(
            `${MODULE_ID} | BRIDGE: Received unknown message type from iframe: '${type}'`
          );
      }
    };
    this._messageHandler = messageHandler.bind(this); 
    window.addEventListener("message", this._messageHandler);
    iframe.onload = () => {
      console.log(`${MODULE_ID} | BRIDGE: Iframe 'load' event triggered.`);
    };
  }

  async close(options) {
    console.log(`${MODULE_ID} | BRIDGE: HexMapApplication closing.`);
    if (this._messageHandler) {
      window.removeEventListener("message", this._messageHandler);
      delete this._messageHandler;
    }
    return super.close(options);
  }
}

// --- GLOBAL FUNCTIONS & HOOKS ---
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
  game.settings.register(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID, {
    name: "AHME Active GM Map ID",
    scope: "world",
    config: false,
    type: String,
    default: null,
    onChange: (newActiveMapId) => {
      Object.values(ui.windows).forEach((appWindow) => {
        if (
          appWindow.id === "hexmap-app" &&
          appWindow.element?.length &&
          appWindow instanceof HexMapApplication
        ) {
          const iframe = appWindow.element.find("#hexmap-iframe")[0];
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: "activeMapChanged",
                payload: { activeGmMapId: newActiveMapId },
                moduleId: MODULE_ID,
              },
              "*"
            );
          }
        }
      });
    },
  });
  game.settings.register(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS, {
    name: "Hexploration: Hours into Day",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
  });
  game.settings.register(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY, {
    name: "Hexploration: Km Traveled Today",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
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
  } else {
    console.error(
      `${MODULE_ID} | BRIDGE CRITICAL: Cannot get module data for API.`
    );
  }
  console.log(
    `${MODULE_ID} | BRIDGE: Init hook complete. Settings and keybinding registered.`
  );
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | BRIDGE: Ready hook complete.`);
});