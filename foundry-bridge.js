// File: foundry-bridge.js

const MODULE_ID = "advanced-hex-map-editor";
const SETTING_MAP_DATA = "hexMapData";
const SETTING_ACTIVE_GM_MAP_ID = "activeGmMapId";
const SETTING_HEXPLORATION_TIME_ELAPSED_HOURS = "hexplorationTimeElapsedHoursToday";
const SETTING_HEXPLORATION_KM_TRAVELED_TODAY = "hexplorationKmTraveledToday";
const AHME_SOCKET_NAME = `module.${MODULE_ID}`;

const DEFAULT_MAP_SETTINGS = {
    hexSizeValue: 5, hexSizeUnit: 'km', hexTraversalTimeValue: 1,
    hexTraversalTimeUnit: 'hour', zoomLevel: 1.0
};
const DEFAULT_LANDMARK_ICON_COLOR_CLASS_BRIDGE = "fill-yellow-200";

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
    data = JSON.parse(savedJson || '{}');
  } catch (e) { data = { maps: {} }; }

  if (!data || typeof data !== "object") data = { maps: {} };
  if (!data.maps) data.maps = {};

  for (const mapId in data.maps) {
    if (data.maps.hasOwnProperty(mapId)) {
      const map = data.maps[mapId];
      if (!map.exploration || typeof map.exploration.discoveredHexIds === "undefined") {
        map.exploration = { discoveredHexIds: [] };
      }
      if (map.partyMarkerPosition === undefined) map.partyMarkerPosition = null;
      if (!Array.isArray(map.eventLog)) map.eventLog = [];
      if (!map.mapSettings) {
        map.mapSettings = { ...DEFAULT_MAP_SETTINGS };
      } else {
        map.mapSettings.hexSizeValue = (typeof map.mapSettings.hexSizeValue === 'number' && !isNaN(map.mapSettings.hexSizeValue)) ? map.mapSettings.hexSizeValue : DEFAULT_MAP_SETTINGS.hexSizeValue;
        map.mapSettings.hexSizeUnit = (typeof map.mapSettings.hexSizeUnit === 'string' && map.mapSettings.hexSizeUnit) ? map.mapSettings.hexSizeUnit : DEFAULT_MAP_SETTINGS.hexSizeUnit;
        map.mapSettings.hexTraversalTimeValue = (typeof map.mapSettings.hexTraversalTimeValue === 'number' && !isNaN(map.mapSettings.hexTraversalTimeValue)) ? map.mapSettings.hexTraversalTimeValue : DEFAULT_MAP_SETTINGS.hexTraversalTimeValue;
        map.mapSettings.hexTraversalTimeUnit = (typeof map.mapSettings.hexTraversalTimeUnit === 'string' && map.mapSettings.hexTraversalTimeUnit) ? map.mapSettings.hexTraversalTimeUnit : DEFAULT_MAP_SETTINGS.hexTraversalTimeUnit;
        map.mapSettings.zoomLevel = (typeof map.mapSettings.zoomLevel === 'number' && !isNaN(map.mapSettings.zoomLevel)) ? map.mapSettings.zoomLevel : DEFAULT_MAP_SETTINGS.zoomLevel;
      }
    }
  }
  return data;
}

async function saveModuleData(data) {
  try {
    const dataToSave = data && typeof data === "object" ? data : { maps: {} };
    await game.settings.set(MODULE_ID, SETTING_MAP_DATA, JSON.stringify(dataToSave));
    return true;
  } catch (e) {
    ui.notifications.error(`CRITICAL: Failed to save ${MODULE_ID} data.`);
    console.error(`AHME_BRIDGE: Error saving module data`, e);
    return false;
  }
}

function broadcastToAllIframes(messageType, messagePayload) {
    Object.values(ui.windows).forEach((appWindow) => {
        if (appWindow.id === "hexmap-app" && appWindow.element?.length && appWindow instanceof HexMapApplication) {
            const iframeInstance = appWindow.element.find("#hexmap-iframe")[0];
            if (iframeInstance && iframeInstance.contentWindow) {
                iframeInstance.contentWindow.postMessage({ type: messageType, payload: messagePayload, moduleId: MODULE_ID }, "*");
            }
        }
    });
}

Hooks.once("ready", () => {
    if (game.socket) {
        game.socket.on(AHME_SOCKET_NAME, (data) => {
            if (!data || !data.ahmeEvent || !data.payload || !game.user || data.senderId === game.user.id) return; // Ignore self-sent

            if (data.ahmeEvent === "ahme_force_player_map_refresh" && !game.user.isGM) { // Players act
                Object.values(ui.windows).forEach((appWindow) => {
                    if (appWindow.id === "hexmap-app" && appWindow.element?.length && appWindow instanceof HexMapApplication) {
                        const iframeInstance = appWindow.element.find("#hexmap-iframe")[0];
                        if (iframeInstance && iframeInstance.contentWindow) {
                            iframeInstance.contentWindow.postMessage({ type: "forceMapReload", payload: { mapId: data.payload.mapId }, moduleId: MODULE_ID }, "*");
                        }
                    }
                });
            }
        });
    } else { console.warn(`AHME_BRIDGE: game.socket not available. Real-time player map updates will be limited.`); }
});

class HexMapApplication extends Application {
  constructor(options = {}) { super(options); this.initialPayloadForIframe = null; }
  static get defaultOptions() { const screenWidth = window.screen.availWidth || window.innerWidth; const screenHeight = window.screen.availHeight || window.innerHeight; return foundry.utils.mergeObject(super.defaultOptions, { id: "hexmap-app", title: "Advanced Hex Map Editor", template: `modules/${MODULE_ID}/templates/hexmap-app.html`, width: Math.min(1800, screenWidth * 0.95), height: Math.min(1000, screenHeight * 0.90), resizable: true, popOut: true, classes: ["hexmap-application-window", "advanced-hex-map-dialog"], }); }
  async getData(options) { const appTemplateData = await super.getData(options); const isGM = game.user?.isGM || false; let currentUserId = game.user?.id || "unknown_user_bridge"; appTemplateData.iframeSrc = `modules/${MODULE_ID}/app/index.html?isGM=${isGM}&moduleId=${MODULE_ID}&userId=${currentUserId}`; const completeModuleData = await getModuleData(); const activeGmMapIdSetting = game.settings.get( MODULE_ID, SETTING_ACTIVE_GM_MAP_ID ); this.initialPayloadForIframe = { mapList: Object.entries(completeModuleData.maps || {}).map( ([id, mapInfo]) => ({ id: id, name: mapInfo.name || "Unnamed Map", }) ), activeGmMapId: activeGmMapIdSetting || null, }; return appTemplateData; }

  activateListeners(html) {
    super.activateListeners(html);
    const iframe = html.find("#hexmap-iframe")[0];
    if (!iframe) { console.error("AHME_BRIDGE: Iframe not found"); return; }

    const messageHandler = async (event) => {
      if (!event.data || typeof event.data !== "object" || event.data.moduleId !== MODULE_ID) return;
      const { type, payload } = event.data;
      if (type === undefined) { console.warn("AHME_BRIDGE: Received message with undefined type", payload); return; }

      let moduleData;
      switch (type) {
        case "jsAppReady":
          if (iframe.contentWindow && this.initialPayloadForIframe) {
            iframe.contentWindow.postMessage( { type: "initialData", payload: this.initialPayloadForIframe, moduleId: MODULE_ID, }, "*" );
          }
          break;
        case "requestMapLoad":
          if (!payload || !payload.mapId) { if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: "mapLoadFailed", payload: { error: "Missing mapId" }, moduleId: MODULE_ID, },"*"); return; }
          moduleData = await getModuleData();
          const mapToLoad = moduleData.maps[payload.mapId];
          if (mapToLoad && iframe.contentWindow) {
            if (!mapToLoad.exploration) mapToLoad.exploration = { discoveredHexIds: [] };
            if (mapToLoad.partyMarkerPosition === undefined) mapToLoad.partyMarkerPosition = null;
            if (!Array.isArray(mapToLoad.eventLog)) mapToLoad.eventLog = [];
            if (!mapToLoad.mapSettings || typeof mapToLoad.mapSettings.zoomLevel !== 'number' || isNaN(mapToLoad.mapSettings.zoomLevel)) {
                mapToLoad.mapSettings = { ...DEFAULT_MAP_SETTINGS, ...(mapToLoad.mapSettings || {}) };
                mapToLoad.mapSettings.zoomLevel = mapToLoad.mapSettings.zoomLevel || DEFAULT_MAP_SETTINGS.zoomLevel;
            }
            iframe.contentWindow.postMessage( { type: "mapDataLoaded", payload: { mapId: payload.mapId, name: mapToLoad.name, gridSettings: mapToLoad.gridSettings, hexes: mapToLoad.hexes, exploration: mapToLoad.exploration, partyMarkerPosition: mapToLoad.partyMarkerPosition, eventLog: mapToLoad.eventLog, mapSettings: mapToLoad.mapSettings }, moduleId: MODULE_ID, }, "*" );
          } else { if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: "mapLoadFailed", payload: { mapId: payload.mapId, error: "Map not found" }, moduleId: MODULE_ID, },"*"); }
          break;

        case "saveMapData":
          if (!game.user?.isGM) { ui.notifications.warn("Only GMs can save map data."); return; }
          let validationError = null;
          if (!payload) validationError = "Payload missing.";
          else if (!payload.mapName || typeof payload.mapName !== 'string' || !payload.mapName.trim()) validationError = "Map name missing or invalid.";
          else if (!payload.mapData || !payload.mapData.gridSettings || !Array.isArray(payload.mapData.hexes)) validationError = "Map data structure invalid.";
          else if (!payload.explorationData || !Array.isArray(payload.explorationData.discoveredHexIds)) validationError = "Exploration data invalid.";
          else if (payload.partyMarkerPosition === undefined) validationError = "Party marker position missing.";
          else if (payload.eventLog === undefined || !Array.isArray(payload.eventLog)) validationError = "Event log invalid.";
          else if (!payload.mapSettings || typeof payload.mapSettings.hexSizeValue !== 'number' || typeof payload.mapSettings.hexSizeUnit !== 'string' || typeof payload.mapSettings.hexTraversalTimeValue !== 'number' || typeof payload.mapSettings.hexTraversalTimeUnit !== 'string' || typeof payload.mapSettings.zoomLevel !== 'number') { validationError = "Map settings invalid."; }

          if (validationError) { ui.notifications.error(`AHME Save Error: ${validationError}`); if (iframe.contentWindow) iframe.contentWindow.postMessage( { type: "mapSaveFailed", payload: { mapId: payload?.mapId, error: `Invalid save data: ${validationError}` }, moduleId: MODULE_ID, }, "*"); return; }

          moduleData = await getModuleData();
          const originalMapIdFromPayload = payload.mapId;
          const mapIdToSave = originalMapIdFromPayload || generateUUID();

          moduleData.maps[mapIdToSave] = { name: payload.mapName.trim(), gridSettings: payload.mapData.gridSettings, hexes: payload.mapData.hexes, exploration: { discoveredHexIds: payload.explorationData.discoveredHexIds, }, partyMarkerPosition: payload.partyMarkerPosition, eventLog: payload.eventLog || [], mapSettings: payload.mapSettings, lastUpdated: Date.now(), };

          const savedSuccessfully = await saveModuleData(moduleData);

          if (savedSuccessfully) {
              if (!payload.isAutoSave) { ui.notifications.info(`Map '${moduleData.maps[mapIdToSave].name}' saved.`); }
              const currentActiveGmMapId = game.settings.get(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID);
              let activeMapIdSettingChangedByThisSaveAction = false;

              if (game.user.isGM && currentActiveGmMapId !== mapIdToSave && !payload.isAutoSave) {
                  await game.settings.set(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID, mapIdToSave); // Triggers onChange
                  activeMapIdSettingChangedByThisSaveAction = true;
              }

              if (currentActiveGmMapId === mapIdToSave) { // Content of the active map was updated
                  let socketAttempted = false;
                  if (game.user.isGM && game.socket) {
                      try {
                          game.socket.emit(AHME_SOCKET_NAME, { ahmeEvent: "ahme_force_player_map_refresh", payload: { mapId: mapIdToSave }, senderId: game.user.id });
                          socketAttempted = true;
                      } catch (socketError) { console.error("AHME_BRIDGE: Error emitting socket event:", socketError); }
                  }

                  // Fallback: Force onChange if not already triggered by making a *different* map active
                  if (!activeMapIdSettingChangedByThisSaveAction) {
                      console.debug("AHME_BRIDGE: Fallback - Toggling active map ID to force update for map:", mapIdToSave);
                      await game.settings.set(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID, null);
                      await game.settings.set(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID, mapIdToSave); // Should trigger onChange twice
                  }
              }

              // Update GM's own iframe immediately
              if (iframe.contentWindow) {
                  const localPartyDataPayload = { mapId: mapIdToSave, partyMarkerPosition: moduleData.maps[mapIdToSave].partyMarkerPosition, discoveredHexIds: moduleData.maps[mapIdToSave].exploration.discoveredHexIds, eventLog: moduleData.maps[mapIdToSave].eventLog };
                  iframe.contentWindow.postMessage({ type: "partyDataUpdated", payload: localPartyDataPayload, moduleId: MODULE_ID }, "*");
                  if (!activeMapIdSettingChangedByThisSaveAction) { // If onChange wasn't triggered by *this save making a new map active*
                      const mapListForThisGM = Object.entries(moduleData.maps).map(([id_entry, mapInfo]) => ({ id: id_entry, name: mapInfo.name }));
                      iframe.contentWindow.postMessage({ type: 'mapListUpdated', payload: { mapList: mapListForThisGM, savedMapId: mapIdToSave, newActiveGmMapId: currentActiveGmMapId }, moduleId: MODULE_ID }, '*');
                  }
              }
          } else { if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: "mapSaveFailed", payload: { mapId: payload.mapId || mapIdToSave, error: "Failed to write to Foundry." }, moduleId: MODULE_ID }, "*"); }
          break;

        case "deleteMap":
          if (!game.user?.isGM) { ui.notifications.warn("Only GMs can delete maps."); return; }
          if (!payload || !payload.mapId) return;
          moduleData = await getModuleData();
          const mapIdToDelete = payload.mapId;
          if (moduleData.maps[mapIdToDelete]) {
            const mapNameToDelete = moduleData.maps[mapIdToDelete].name;
            delete moduleData.maps[mapIdToDelete];
            if (await saveModuleData(moduleData)) {
              ui.notifications.info(`Map '${mapNameToDelete}' deleted.`);
              if (game.settings.get(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID) === mapIdToDelete) {
                await game.settings.set(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID, null); // Triggers onChange
              } else { // Active map didn't change, but list did. Manually inform iframes.
                 const mapListUpdatePayload = { mapList: Object.entries(moduleData.maps).map( ([id, mapInfo]) => ({ id, name: mapInfo.name }) ), deletedMapId: mapIdToDelete, newActiveGmMapId: game.settings.get(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID) };
                 broadcastToAllIframes("mapListUpdated", mapListUpdatePayload);
              }
            }
          } else { ui.notifications.warn(`Map ID '${mapIdToDelete}' not found for deletion.`); }
          break;

        case "requestFormInput":
          if (!game.user?.isGM) { if (iframe.contentWindow) iframe.contentWindow.postMessage( { type: "formInputResponse", payload: { error: "Permission denied", cancelled: true }, moduleId: MODULE_ID, }, "*" ); return; }
          if (!payload || !Array.isArray(payload.fields) || payload.fields.length === 0) { if (iframe.contentWindow) iframe.contentWindow.postMessage( { type: "formInputResponse", payload: { error: "Bridge: Invalid request fields", cancelled: true }, moduleId: MODULE_ID, }, "*" ); return; }
          let formContent = '<form autocomplete="off" class="dialog-form-flex">'; payload.fields.forEach(field => { formContent += `<div class="form-group"><label for="${field.name}">${field.label || field.name}:</label><div class="form-fields">`; if (field.type === 'select' && Array.isArray(field.options)) { formContent += `<select name="${field.name}" id="${field.name}">`; field.options.forEach(opt => { formContent += `<option value="${opt.value}" ${String(opt.value) === String(field.default) ? 'selected' : ''}>${opt.label}</option>`; }); formContent += `</select>`; } else if (field.type === 'number') { formContent += `<input type="number" name="${field.name}" id="${field.name}" value="${field.default || ''}" ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.max !== undefined ? `max="${field.max}"` : ''} ${field.step !== undefined ? `step="${field.step}"` : ''} />`; } else { formContent += `<input type="text" name="${field.name}" id="${field.name}" value="${String(field.default || '')}" />`; } formContent += `</div></div>`; }); formContent += '</form>';
          new Dialog({ title: payload.title || "Input Required", content: formContent, buttons: { ok: { icon: '<i class="fas fa-check"></i>', label: "OK", callback: (htmlEl) => { const formData = {}; payload.fields.forEach(field => { const inputElement = htmlEl.find(`[name="${field.name}"]`); if (inputElement.length) { formData[field.name] = inputElement.val(); if (field.type === 'number') { const parsedVal = parseFloat(inputElement.val()); formData[field.name] = isNaN(parsedVal) ? (typeof field.default === 'number' ? field.default : 0) : parsedVal; } } }); if (iframe.contentWindow) iframe.contentWindow.postMessage( { type: "formInputResponse", payload: { ...formData, cancelled: false }, moduleId: MODULE_ID }, "*"); } }, cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => { if (iframe.contentWindow) iframe.contentWindow.postMessage( { type: "formInputResponse", payload: { cancelled: true }, moduleId: MODULE_ID }, "*"); } } }, default: "ok", render: (htmlEl) => { if (payload.fields.length > 0) { setTimeout(() => htmlEl.find(`[name="${payload.fields[0].name}"]`).focus(), 50); } }, }, {width: payload.dialogWidth || 450} ).render(true);
          break;

        case "gmSetActiveMap": // From iframe when GM loads/creates a map
          if (!game.user?.isGM) return;
          const newActiveMapIdFromIframe = payload && (typeof payload.mapId === "string" || payload.mapId === null) ? payload.mapId : null;
          if (game.settings.get(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID) !== newActiveMapIdFromIframe) {
            await game.settings.set(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID, newActiveMapIdFromIframe); // Triggers onChange
          }
          break;

        case "requestFeatureDetailsInput":
          if (!game.user?.isGM) { if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: "featureDetailsInputResponse", payload: { error: "Permission denied", cancelled: true }, moduleId: MODULE_ID },"*"); return; }
          if (!payload || !payload.hexId || !payload.featureType) { if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: "featureDetailsInputResponse", payload: { error: "Invalid request", cancelled: true }, moduleId: MODULE_ID },"*"); return; }
          const isLandmarkDialogBridge = payload.featureType === "landmark"; const isSecretDialogBridge = payload.featureType === "secret"; let dialogFieldsArray = [];
          dialogFieldsArray.push({ name: "featureName", label: isLandmarkDialogBridge ? "Landmark Name:" : isSecretDialogBridge ? "Secret Note/Name (GM Only):" : "Feature Name:", type: "text", default: payload.currentName || "" });
          if (isLandmarkDialogBridge) { const landmarkIcons = [ { char: "★", name: "Star" }, { char: "⚐", name: "Flag" }, { char: "⌖", name: "Target" }, { char: "📍", name: "Pin" }, { char: "⚜", name: "Fleur-de-lis" }, { char: "⛺", name: "Camp" }, { char: "⚔", name: "Battle" }, { char: "☠", name: "Danger" }, { char: "🏠", name: "House" }, { char: "🏰", name: "Castle" }, { char: "⚓", name: "Anchor" }, { char: "🌲", name: "Tree" }, { char: "⛰️", name: "Mountain" }, { char: "💧", name: "Water Drop" }, { char: "🔥", name: "Fire" } ]; dialogFieldsArray.push({ name: "featureIcon", label: "Icon:", type: "select", default: payload.currentIcon || "★", options: landmarkIcons.map(icon => ({ value: icon.char, label: `${icon.char} (${icon.name})` })) }); }
          if ((isLandmarkDialogBridge || isSecretDialogBridge) && payload.availableIconColors && Array.isArray(payload.availableIconColors)) { dialogFieldsArray.push({ name: "featureIconColor", label: "Icon Color:", type: "select", default: payload.currentIconColor || (payload.availableIconColors.length > 0 ? payload.availableIconColors[0].class : DEFAULT_LANDMARK_ICON_COLOR_CLASS_BRIDGE), options: payload.availableIconColors.map(c => ({ value: c.class, label: c.name })) }); }
          const featureDialogDisplayPayload = { title: `Set ${isLandmarkDialogBridge ? "Landmark" : isSecretDialogBridge ? "Secret" : "Feature"} Details for Hex ${payload.hexId}`, fields: dialogFieldsArray, dialogWidth: 450 }; const originalFeatureRequestFromApp = { ...payload };
          new Dialog({ title: featureDialogDisplayPayload.title, content: (() => { let c = '<form autocomplete="off" class="dialog-form-flex">'; featureDialogDisplayPayload.fields.forEach(field => { c += `<div class="form-group"><label for="${field.name}">${field.label || field.name}:</label><div class="form-fields">`; if (field.type === 'select' && Array.isArray(field.options)) { c += `<select name="${field.name}" id="${field.name}">`; field.options.forEach(opt => { c += `<option value="${opt.value}" ${String(opt.value) === String(field.default) ? 'selected' : ''}>${opt.label}</option>`; }); c += `</select>`; } else { c += `<input type="text" name="${field.name}" id="${field.name}" value="${String(field.default || '')}" />`; } c += `</div></div>`; }); c += '</form>'; return c; })(), buttons: { ok: { icon: '<i class="fas fa-check"></i>', label: "Set Details", callback: (htmlElCb) => { const formData = {}; featureDialogDisplayPayload.fields.forEach(field => { const inputElement = htmlElCb.find(`[name="${field.name}"]`); formData[field.name] = inputElement.length ? inputElement.val() : null; }); if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: "featureDetailsInputResponse", payload: { ...originalFeatureRequestFromApp, ...formData, cancelled: false }, moduleId: MODULE_ID }, "*"); } }, cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => { if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: "featureDetailsInputResponse", payload: { ...originalFeatureRequestFromApp, cancelled: true }, moduleId: MODULE_ID }, "*"); } } }, default: "ok", render: (htmlElToRender) => { if (featureDialogDisplayPayload.fields.length > 0) { setTimeout(() => htmlElToRender.find(`[name="${featureDialogDisplayPayload.fields[0].name}"]`).focus(), 50); } }, }, { width: featureDialogDisplayPayload.dialogWidth }).render(true);
          break;

        case "gmRequestNewHexplorationDay":
          if (!game.user?.isGM) return;
          await game.settings.set(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS, 0);
          await game.settings.set(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY, 0);
          broadcastToAllIframes("hexplorationDataUpdated", { timeElapsedHoursToday: 0, kmTraveledToday: 0 });
          ChatMessage.create({ speaker: ChatMessage.getSpeaker({ alias: "Hexploration" }), content: "A new day of hexploration begins!" });
          break;

 case "gmPerformedHexplorationAction":
          if (!game.user?.isGM) return;
          if (payload && typeof payload.kmCost === 'number' && typeof payload.hoursCost === 'number' && payload.logEntry && typeof payload.logEntry === 'object') {
            // These variables should be fetched and updated correctly
            let currentKmTraveled = game.settings.get(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY) || 0;
            let currentHoursElapsed = game.settings.get(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS) || 0;

            let newKmTraveledToday = currentKmTraveled + payload.kmCost;
            await game.settings.set(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY, newKmTraveledToday);

            let newTimeElapsedToday = currentHoursElapsed + payload.hoursCost;
            await game.settings.set(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS, newTimeElapsedToday);

            const secondsToAdvance = Math.round(payload.hoursCost * 3600);
            if (game.time?.advance && secondsToAdvance > 0) {
              try { await game.time.advance(secondsToAdvance); }
              catch (e) { console.warn("AHME_BRIDGE: Failed to advance game time.", e); }
            }

            const log = payload.logEntry;
            const direction = typeof log.direction === 'string' ? log.direction : '';
            let chatMessageContent = `<b>Travel Log:</b> Party ${direction.includes('exploring') ? 'explored at' : 'moved ' + direction + ' to'} hex ${log.to} (<i>${log.targetTerrain || 'Unknown Terrain'}</i>).<br>`;
            if (!direction.includes('exploring')) {
                chatMessageContent += `Distance: ${log.distanceValue} ${log.distanceUnit || 'units'}. `;
            }
            chatMessageContent += `Base time: ${log.baseTimeValue.toFixed(1)} ${log.baseTimeUnit || 'units'}.<br>`;
            let adjustmentsDetail = "";
            const terrainTimeEffect = (log.terrainModifiedTime || log.baseTimeValue) - log.baseTimeValue;
            if (Math.abs(terrainTimeEffect) > 0.01) {
                if (terrainTimeEffect < 0) { adjustmentsDetail += `Terrain bonus (${log.targetTerrain || 'terrain'}): <span style="color: green;">-${Math.abs(terrainTimeEffect).toFixed(1)} ${log.baseTimeUnit || 'units'}</span>. `; }
                else { adjustmentsDetail += `Terrain penalty (${log.targetTerrain || 'terrain'}): <span style="color: red;">+${terrainTimeEffect.toFixed(1)} ${log.baseTimeUnit || 'units'}</span>. `; }
            }
            if (log.elevationPenalty > 0.01) {
                const elevChangeFormatted = `${log.elevationChange > 0 ? '+' : ''}${log.elevationChange}m`;
                adjustmentsDetail += `Elevation penalty (${elevChangeFormatted}): <span style="color: red;">+${log.elevationPenalty.toFixed(1)} ${log.baseTimeUnit || 'units'}</span>. `;
            }
            if (adjustmentsDetail) { chatMessageContent += `Adjustments: ${adjustmentsDetail.trim()}<br>`; }
            chatMessageContent += `Total time for this leg: <b>${log.totalTimeValue.toFixed(1)} ${log.totalTimeUnit || 'units'}</b>.<br>`;
            // Use the new accumulated values for the chat log
            chatMessageContent += `<i>Day totals: ${newTimeElapsedToday.toFixed(1)}h, ${newKmTraveledToday.toFixed(1)}km.</i>`;
            if(log.encounterStatus && log.encounterStatus !== "No significant event on entering hex." && log.encounterStatus !== "No significant event while exploring current hex.") {
               chatMessageContent += `<br><i>${log.encounterStatus}</i>`;
            }

            try {
                ChatMessage.create({ speaker: ChatMessage.getSpeaker({ alias: "Hexploration Log" }), content: chatMessageContent });
            } catch (chatError) {
                console.error("AHME_BRIDGE: Error creating Hexploration Log chat message:", chatError);
            }

            // Ensure the payload for hexplorationDataUpdated uses the correct, updated variables
            const updatedHexplorationDataForUI = {
                timeElapsedHoursToday: newTimeElapsedToday, // Corrected variable name
                kmTraveledToday: newKmTraveledToday     // Corrected variable name
            };
            broadcastToAllIframes("hexplorationDataUpdated", updatedHexplorationDataForUI);
          } else {
            console.warn("AHME_BRIDGE: Invalid payload for 'gmPerformedHexplorationAction'.", payload);
          }
          break;

        case "postChatMessage":
          if (payload && payload.content) { const chatData = { speaker: ChatMessage.getSpeaker({ alias: payload.alias || "Hexploration System" }), content: payload.content }; if (payload.whisper && game.users.some(u => u.isGM)) { chatData.whisper = ChatMessage.getWhisperRecipients("GM"); }
            try { ChatMessage.create(chatData); } catch (chatError) { console.error("AHME_BRIDGE: Error creating posted chat message:", chatError); }
          }
          break;

        default:
          console.warn(`AHME_BRIDGE: Received unknown message type '${type}' from iframe.`, payload);
      }
    };
    this._messageHandler = messageHandler.bind(this);
    window.addEventListener("message", this._messageHandler);
  }

  async close(options) { if (this._messageHandler) { window.removeEventListener("message", this._messageHandler); delete this._messageHandler; } return super.close(options); }
}

function toggleHexMapApplication() { const app = Object.values(ui.windows).find(a => a.id === "hexmap-app" && a instanceof HexMapApplication); if (app) app.close(); else new HexMapApplication().render(true); }

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_MAP_DATA, { name: "AHME Map Data", scope: "world", config: false, type: String, default: "{}" });
  game.settings.register(MODULE_ID, SETTING_ACTIVE_GM_MAP_ID, { name: "AHME Active GM Map ID", scope: "world", config: false, type: String, default: null,
    onChange: async (newActiveMapId) => {
        console.debug(`AHME_BRIDGE: Setting '${SETTING_ACTIVE_GM_MAP_ID}' onChange hook fired. New Value: ${newActiveMapId}.`);
        broadcastToAllIframes("activeMapChanged", { activeGmMapId: newActiveMapId });
        const currentModuleData = await getModuleData(); // Fetch fresh map list
        const mapListPayload = { mapList: Object.entries(currentModuleData.maps || {}).map(([id, mapInfo]) => ({ id, name: mapInfo.name })), newActiveGmMapId: newActiveMapId };
        broadcastToAllIframes("mapListUpdated", mapListPayload);
    },
  });
  game.settings.register(MODULE_ID, SETTING_HEXPLORATION_TIME_ELAPSED_HOURS, { name: "Hexploration: Hours into Day", scope: "world", config: false, type: Number, default: 0 });
  game.settings.register(MODULE_ID, SETTING_HEXPLORATION_KM_TRAVELED_TODAY, { name: "Hexploration: Km Traveled Today", scope: "world", config: false, type: Number, default: 0 });
  game.keybindings.register(MODULE_ID, "toggleHexMap", { name: "Toggle Hex Map Editor", hint: "Opens/closes editor.", editable: [{ key: "KeyM", modifiers: [] }], onDown: () => { toggleHexMapApplication(); return true; } });
  const mod = game.modules.get(MODULE_ID); if (mod) { mod.api = { toggleHexMap: toggleHexMapApplication }; }
});

Hooks.once('renderDialog', () => {
    if (!document.getElementById('hexmap-dialog-form-style-global')) {
        const styleElement = document.createElement('style'); styleElement.id = 'hexmap-dialog-form-style-global';
        styleElement.textContent = `.dialog-form-flex .form-group { display: flex; align-items: center; margin-bottom: 8px; } .dialog-form-flex .form-group label { flex: 0 0 150px; margin-right: 10px; text-align: right; white-space: nowrap; } .dialog-form-flex .form-fields { flex: 1; } .dialog-form-flex .form-fields input, .dialog-form-flex .form-fields select { width: 100%; box-sizing: border-box; }`;
        document.head.appendChild(styleElement);
    }
});