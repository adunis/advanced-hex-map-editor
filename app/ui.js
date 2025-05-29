// advanced-hex-map-editor/app/ui.js
import { appState } from "./state.js";
import * as CONST from "./constants.js";
// Import functions from other modules that UI event handlers will call
import * as MapLogic from "./map-logic.js";
import * as MapManagement from "./map-management.js";
import * as HexplorationLogic from "./hexploration-logic.js";

let mainTemplateCompiled;
const appContainer = document.getElementById("app-container");

// --- UTILITY FUNCTIONS for UI (lerpColor, getDynamicFillColor) ---
export function lerpColor(color1Str, color2Str, factor) {
  const parse = (s) => s.match(/\d+/g)?.map(Number);
  const c1 = parse(color1Str);
  const c2 = parse(color2Str);
  if (!c1 || !c2 || c1.length < 3 || c2.length < 3) {
    return "rgb(0,0,0)"; // Fallback
  }
  const r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
  const g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
  const b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
  return `rgb(${r},${g},${b})`;
}

export function getDynamicFillColor(hexData) {
  if (!hexData || !hexData.terrain) {
    return CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE].color;
  }
  const { terrain, elevation } = hexData;
  const tc = CONST.TERRAIN_TYPES_CONFIG[terrain];
  if (!tc) {
    return CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE].color;
  }

  switch (terrain) {
    case CONST.TerrainType.PLAINS:
      return elevation >= 0 && elevation < CONST.HILLS_THRESHOLD
        ? CONST.PLAINS_LOW_ELEV_COLOR
        : tc.color;
    case CONST.TerrainType.HILLS:
      if (
        elevation >= CONST.HILLS_THRESHOLD &&
        elevation < CONST.MOUNTAIN_THRESHOLD
      ) {
        const f =
          (elevation - CONST.HILLS_THRESHOLD) /
          Math.max(1, CONST.MOUNTAIN_THRESHOLD - 1 - CONST.HILLS_THRESHOLD);
        return lerpColor(
          CONST.HILLS_COLOR_LOW,
          CONST.HILLS_COLOR_HIGH,
          Math.max(0, Math.min(1, f))
        );
      }
      return elevation < CONST.HILLS_THRESHOLD
        ? CONST.HILLS_COLOR_LOW
        : CONST.HILLS_COLOR_HIGH;
    case CONST.TerrainType.MOUNTAIN:
      if (elevation < CONST.MOUNTAIN_THRESHOLD)
        return CONST.MOUNTAIN_COLOR_LOW_SLOPE;
      if (elevation <= CONST.MOUNTAIN_ELEV_MID_SLOPE_END) {
        const f =
          (elevation - CONST.MOUNTAIN_THRESHOLD) /
          Math.max(
            1,
            CONST.MOUNTAIN_ELEV_MID_SLOPE_END - CONST.MOUNTAIN_THRESHOLD
          );
        return lerpColor(
          CONST.MOUNTAIN_COLOR_LOW_SLOPE,
          CONST.MOUNTAIN_COLOR_MID_SLOPE,
          Math.max(0, Math.min(1, f))
        );
      }
      if (elevation < CONST.MOUNTAIN_ELEV_ICE_TRANSITION_START)
        return CONST.MOUNTAIN_COLOR_SNOW_LINE;
      const effPeakEnd = Math.min(
        CONST.MOUNTAIN_ELEV_ICE_PEAK_END,
        CONST.MAX_ELEVATION > CONST.MOUNTAIN_ELEV_ICE_TRANSITION_START
          ? CONST.MAX_ELEVATION
          : CONST.MOUNTAIN_ELEV_ICE_PEAK_END
      );
      if (elevation >= effPeakEnd) return CONST.MOUNTAIN_COLOR_ICE_PEAK;
      const f_ice =
        (elevation - CONST.MOUNTAIN_ELEV_ICE_TRANSITION_START) /
        Math.max(1, effPeakEnd - CONST.MOUNTAIN_ELEV_ICE_TRANSITION_START);
      return lerpColor(
        CONST.MOUNTAIN_COLOR_SNOW_LINE,
        CONST.MOUNTAIN_COLOR_ICE_PEAK,
        Math.max(0, Math.min(1, f_ice))
      );
    default:
      return tc.color;
  }
}

// --- TEMPLATING & RENDERING ---
export async function compileTemplates() {
  try {
    console.log("UI: Compiling templates...");
    const responses = await Promise.all([
      fetch("templates/main.hbs"),
      fetch("templates/controls.hbs"),
      fetch("templates/hex-grid.hbs"),
      fetch("templates/hexagon.hbs"),
    ]);
    for (const res of responses) {
      if (!res.ok)
        throw new Error(
          `Failed to fetch template: ${res.url} (${res.status} ${res.statusText})`
        );
    }
    const texts = await Promise.all(responses.map((res) => res.text()));

    mainTemplateCompiled = Handlebars.compile(texts[0]);
    Handlebars.registerPartial("controls", texts[1]);
    Handlebars.registerPartial("hexGrid", texts[2]);
    Handlebars.registerPartial("hexagon", texts[3]);

    Handlebars.registerHelper({
      eq: (a, b) => a === b,
      capitalize: (s) =>
        s ? s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "",
      capitalizeFirst: function (string) {
        if (!string || typeof string !== "string") return "";
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
            typeCapitalized: function(logEntry) { // New helper for event log
          if (logEntry && logEntry.type) {
              return logEntry.type.charAt(0).toUpperCase() + logEntry.type.slice(1);
          }
          return "Event";
      },
      toPrecise: function (value, precision = 3) {
        if (typeof value === "number") return value.toFixed(precision);
        const num = parseFloat(value);
        if (!isNaN(num)) return num.toFixed(precision);
        return typeof value === "string" ? value : "0.000";
      },
      objValues: (o) => Object.values(o || {}),
      objEntries: (o) =>
        Object.entries(o || {}).map(([k, v]) => ({ key: k, value: v })),
      filterNoneFeature: (e) =>
        (e || []).filter((i) => i.value !== CONST.TerrainFeature.NONE),
      toFixed: (n, d) =>
        n != null ? parseFloat(n).toFixed(d) : (0).toFixed(d),
      mul: (a, b) => (a != null && b != null ? a * b : 0),
      add: (a, b) => (a != null && b != null ? a + b : 0),
      sub: (a, b) => (a != null && b != null ? a - b : 0),  
                 abs: (a) => (a != null ? Math.abs(a) : 0), 
                       subtract: (a, b) => (a != null && b != null ? (Number(a) - Number(b)) : 0), // ADDED HELPER 'subtract'
      isTailwindFill: (s) => typeof s === "string" && s.startsWith("fill-"),
      replace: (s, f, r) => (s ? s.replace(new RegExp(f, "g"), r) : ""),
      and: (a, b) => a && b,
          assign: function(varName, varValue, options) { // Helper to assign variables in template
          options.data.root[varName] = varValue;
      },
      gt: (a, b) => a > b,
      lt: (a, b) => a < b,
      ifCond: function (v1, operator, v2, options) {
        switch (operator) {
          case "==":
            return v1 == v2 ? options.fn(this) : options.inverse(this);
          case "===":
            return v1 === v2 ? options.fn(this) : options.inverse(this);
          case "!=":
            return v1 != v2 ? options.fn(this) : options.inverse(this);
          case "!==":
            return v1 !== v2 ? options.fn(this) : options.inverse(this);
          case "<":
            return v1 < v2 ? options.fn(this) : options.inverse(this);
          case "<=":
            return v1 <= v2 ? options.fn(this) : options.inverse(this);
          case ">":
            return v1 > v2 ? options.fn(this) : options.inverse(this);
          case ">=":
            return v1 >= v2 ? options.fn(this) : options.inverse(this);
          case "&&":
            return v1 && v2 ? options.fn(this) : options.inverse(this);
          case "||":
            return v1 || v2 ? options.fn(this) : options.inverse(this);
          default:
            return options.inverse(this);
        }
      },
            compare: function (v1, operator, v2) {
        switch (operator) {
          case "==":  return v1 == v2;
          case "===": return v1 === v2;
          case "!=":  return v1 != v2;
          case "!==": return v1 !== v2;
          case "<":   return Number(v1) < Number(v2);
          case "<=":  return Number(v1) <= Number(v2);
          case ">":   return Number(v1) > Number(v2);
          case ">=":  return Number(v1) >= Number(v2);
          case "&&":  return v1 && v2; // Note: Handlebars #if already does truthy/falsy for single values
          case "||":  return v1 || v2; // So && and || might be less needed here
          default:    return false;
        }
      }
    });
    console.log("UI: Templates compiled and helpers registered successfully.");
    return true;
  } catch (error) {
    console.error("UI: Error compiling templates:", error);
    if (appContainer)
      appContainer.innerHTML = `<div class="text-red-500 p-4">Template Error: ${error.message}</div>`;
    return false;
  }
}

export function renderApp(options = {}) { 
  if (!mainTemplateCompiled || !appContainer) { 
    console.error("UI: Main template not compiled or appContainer not found. Cannot render."); return; 
  }
  console.log(
    "UI: Preparing data for rendering. CurrentMapName:", appState.currentMapName,
    "MapInit:", appState.mapInitialized, "isDirty:", appState.isCurrentMapDirty,
     "ViewMode:", appState.viewMode,
    "Render Options:", options 
  );

  let hexesToRenderSource = appState.mapInitialized
    ? appState.hexGridData.flat().filter(Boolean)
    : [];

  if (appState.viewMode === CONST.ViewMode.THREED && appState.mapInitialized) {
    hexesToRenderSource.sort((hexAData, hexBData) => {
      const hexA = appState.hexDataMap.get(hexAData.id) || hexAData;
      const hexB = appState.hexDataMap.get(hexBData.id) || hexBData;
      if (hexA.row < hexB.row) return -1;
      if (hexA.row > hexB.row) return 1;
      if (hexA.col < hexB.col) return -1;
      if (hexA.col > hexB.col) return 1;
      if (hexA.elevation < hexB.elevation) return -1;
      if (hexA.elevation > hexB.elevation) return 1;
      return 0;
    });
  }

  const hexGridRenderData = appState.mapInitialized
    ? hexesToRenderSource.map((hexInMemory) => {
        let curHex;
        if (options.specificallyUpdatedHex && options.specificallyUpdatedHex.id === hexInMemory.id) {
            curHex = options.specificallyUpdatedHex;
        } else {
            curHex = appState.hexDataMap.get(hexInMemory.id) || hexInMemory;
        }
        
        const tc =
          CONST.TERRAIN_TYPES_CONFIG[curHex.terrain] ||
          CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];

        const hexTrueW = CONST.HEX_SIZE * Math.sqrt(3);
        const hexVOff = CONST.HEX_SIZE * 1.5;
        const svgPad = CONST.HEX_SIZE;

        const is3D = appState.viewMode === CONST.ViewMode.THREED;
        let yShift = 0;
        let visualDepth = 0;

        if (is3D) {
          yShift =
            curHex.elevation *
            CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT;
          if (curHex.elevation !== 0) {
            visualDepth = Math.abs(
              curHex.elevation * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT
            );
            if (
              visualDepth > 0 &&
              visualDepth < CONST.HEX_3D_MIN_VISUAL_DEPTH
            ) {
              visualDepth = CONST.HEX_3D_MIN_VISUAL_DEPTH;
            }
          }
        }

        const cx_2d_center =
          svgPad +
          hexTrueW / 2 +
          curHex.col * hexTrueW +
          (curHex.row % 2 !== 0 ? hexTrueW / 2 : 0);
        const cy_2d_center = svgPad + CONST.HEX_SIZE + curHex.row * hexVOff;

        const cx_top_proj = cx_2d_center;
        const cy_top_proj = cy_2d_center - yShift;

        const currentYSquashFactor = is3D ? CONST.HEX_3D_Y_SQUASH_FACTOR : 1;

        const topFacePoints = Array(6)
          .fill(0)
          .map((_, i) => {
            const angle = (Math.PI / 180) * (60 * i - 90);
            const x = cx_top_proj + CONST.HEX_SIZE * Math.cos(angle);
            const y =
              cy_top_proj +
              CONST.HEX_SIZE * Math.sin(angle) * currentYSquashFactor;
            return `${x.toFixed(3)},${y.toFixed(3)}`;
          })
          .join(" ");

        let sideFacesData = [];
        const baseFillColorForSides = getDynamicFillColor(curHex);

        if (is3D && visualDepth > 0) {
          const topVertices = Array(6)
            .fill(0)
            .map((_, i) => {
              const angle = (Math.PI / 180) * (60 * i - 90);
              return {
                x: cx_top_proj + CONST.HEX_SIZE * Math.cos(angle),
                y:
                  cy_top_proj +
                  CONST.HEX_SIZE * Math.sin(angle) * currentYSquashFactor,
              };
            });
          const yOffsetForBottom =
            curHex.elevation > 0 ? visualDepth : -visualDepth;
          const bottomVertices = topVertices.map((tv) => ({
            x: tv.x,
            y: tv.y + yOffsetForBottom,
          }));
          const visibleSideIndices =
            curHex.elevation >= 0 ? [2, 3, 4] : [0, 1, 5];
          const sideFill = lerpColor(
            baseFillColorForSides,
            "rgb(0,0,0)",
            CONST.HEX_3D_SIDE_COLOR_DARKEN_FACTOR
          );
          for (const i of visibleSideIndices) {
            const p1 = topVertices[i];
            const p2 = topVertices[(i + 1) % 6];
            const p3 = bottomVertices[(i + 1) % 6];
            const p4 = bottomVertices[i];
            sideFacesData.push({
              points: `${p1.x.toFixed(3)},${p1.y.toFixed(3)} ${p2.x.toFixed(
                3
              )},${p2.y.toFixed(3)} ${p3.x.toFixed(3)},${p3.y.toFixed(
                3
              )} ${p4.x.toFixed(3)},${p4.y.toFixed(3)}`,
              fill: sideFill,
              isTailwindFill: false,
            });
          }
        }

        let fillForTopFace = baseFillColorForSides;
        let isTW =
          typeof fillForTopFace === "string" &&
          fillForTopFace.startsWith("fill-");
        let txtClr = "fill-white";
        let opacity = "opacity-100";

        if (appState.appMode === CONST.AppMode.PLAYER) {
          if (!appState.playerDiscoveredHexIds.has(curHex.id)) {
            if (appState.isGM) {
              fillForTopFace = "rgba(30, 30, 30, 0.75)";
              isTW = false;
              txtClr = "fill-gray-400";
              opacity = "opacity-85";
            } else {
              fillForTopFace = CONST.FOG_OF_WAR_COLOR;
              isTW = false;
              txtClr = "fill-transparent";
            }
          } else if (
            !appState.playerCurrentVisibleHexIds.has(curHex.id) &&
            appState.partyMarkerPosition?.id !== curHex.id
          ) {
            if (appState.isGM) {
              opacity = "opacity-50";
            } else {
              opacity = `opacity-50`;
            }
          }
        }

        const editorLOSActive = appState.editorLosSourceHexId !== null;
        let strokeClr = "stroke-gray-400";
        let strokeW = Math.max(
          1,
          Math.min(4, 1 + Math.max(0, curHex.elevation) / 400)
        );
        if (curHex.elevation < 0)
          strokeW = Math.max(0.75, 1 + curHex.elevation / 800);
        let finalSW = strokeW.toFixed(2);

        if (appState.appMode === CONST.AppMode.HEX_EDITOR && editorLOSActive) {
          if (appState.editorLosSourceHexId === curHex.id) {
            strokeClr = "stroke-yellow-400";
            finalSW = "3.5";
          } else if (appState.editorVisibleHexIds.has(curHex.id)) {
            strokeClr = "stroke-cyan-400";
            finalSW = Math.min(4.5, strokeW + 0.75).toFixed(2);
          } else {
            opacity = "opacity-30";
          }
        }

        if (
          fillForTopFace !== CONST.FOG_OF_WAR_COLOR &&
          curHex.terrain === CONST.TerrainType.MOUNTAIN &&
          curHex.elevation >= CONST.MOUNTAIN_ELEV_SNOW_LINE_START
        ) {
          txtClr = CONST.MOUNTAIN_LIGHT_SURFACE_TEXT_COLOR;
        } else if (
          fillForTopFace === CONST.FOG_OF_WAR_COLOR &&
          appState.appMode === CONST.AppMode.PLAYER &&
          !appState.isGM
        ) {
          txtClr = "fill-transparent";
        }

        // --- Feature Display Logic ---
        let featureDisplayIconString = ""; 
        let featureTooltipNameString = ""; 
        let featureAriaLabelString = "";
        let featureIconComputedClassString = "fill-white"; 

        const currentFeatureLower = curHex.feature ? curHex.feature.toLowerCase() : CONST.TerrainFeature.NONE;
    if (currentFeatureLower !== CONST.TerrainFeature.NONE) {
        featureAriaLabelString = capitalizeFirstLetter(currentFeatureLower);
        if (currentFeatureLower === CONST.TerrainFeature.LANDMARK.toLowerCase()) {
            featureDisplayIconString = curHex.featureIcon || "★";
            featureTooltipNameString = curHex.featureName ? ` (${curHex.featureName})` : " (Unnamed Landmark)";
            // MODIFIED LINE: Added text-2xl (or text-xl, text-3xl, etc.)
            featureIconComputedClassString = "fill-yellow-200"; // <--- MAKE STAR BIGGER HERE

        } else if (currentFeatureLower === CONST.TerrainFeature.SECRET.toLowerCase()) {
            if (appState.isGM) {
                featureDisplayIconString = curHex.featureIcon || "?";
                featureTooltipNameString = curHex.featureName ? ` (GM Note: ${curHex.featureName})` : " (Hidden Secret)";
                featureIconComputedClassString = "fill-purple-400"; // You could make the '?' bigger here too if needed
            }
        }
    }
        const isLandmarkFeatureType = currentFeatureLower === CONST.TerrainFeature.LANDMARK.toLowerCase();
        const isSecretFeatureType = currentFeatureLower === CONST.TerrainFeature.SECRET.toLowerCase() && appState.isGM;
        // --- End Feature Display Logic ---


        const isPlayerPosCurrentHex = appState.partyMarkerPosition?.id === curHex.id;

        // --- DIAGNOSTIC LOGS ---
        // Party Marker Log
        if (isPlayerPosCurrentHex || (curHex.id === appState.partyMarkerPosition?.id && !isPlayerPosCurrentHex)) { 
            // Log if this hex IS the marker, or if it was EXPECTED to be but comparison failed
            console.log(`%cUI.JS - RENDER - PARTY MARKER CHECK - HEX ${curHex.id}:`, 'color: orange; font-weight: bold;', {
                curHex_id: curHex.id,
                appState_partyMarkerPosition_id: appState.partyMarkerPosition?.id,
                appState_partyMarkerPosition_full: appState.partyMarkerPosition ? JSON.parse(JSON.stringify(appState.partyMarkerPosition)) : null,
                calculated_isPlayerPosition_for_template: isPlayerPosCurrentHex,
                template_playerMarkerColor_passed_to_hbs: CONST.PLAYER_MARKER_COLOR,
            });
        }

        // Feature Log (Conditional)
        if ( (options.specificallyUpdatedHex && options.specificallyUpdatedHex.id === curHex.id) || (currentFeatureLower !== CONST.TerrainFeature.NONE && currentFeatureLower !== '') ) {
            console.log(`UI.JS - RENDER - FEATURE INFO - HEX ${curHex.id} (Specifically updated: ${!!(options.specificallyUpdatedHex && options.specificallyUpdatedHex.id === curHex.id)}):`, {
                curHex_feature_from_data: curHex.feature,
                curHex_featureIcon_from_data: curHex.featureIcon,
                curHex_featureName_from_data: curHex.featureName,
                derived_currentFeatureLower: currentFeatureLower,
                template_featureDisplayIconToRender: featureDisplayIconString,
                template_featureAriaLabelToRender: featureAriaLabelString,
                template_featureIconComputedClassToRender: featureIconComputedClassString,
                template_isLandmarkFeature: isLandmarkFeatureType,
                template_isSecretFeature: isSecretFeatureType,
                appMode: appState.appMode, isGM: appState.isGM,
                isTextHiddenForPlayer: appState.appMode === CONST.AppMode.PLAYER && !appState.isGM && !appState.playerDiscoveredHexIds.has(curHex.id)
            });
        }
        // --- END DIAGNOSTIC LOGS ---
        
        const sight = Math.max(
          0,
          curHex.baseVisibility +
            Math.floor(curHex.elevation / CONST.ELEVATION_STEP)
        );
        let elevTxt = `${curHex.elevation}m`;
        if (curHex.elevation > 0) elevTxt = `+${curHex.elevation}m`;
        const effInherent =
          tc.baseInherentVisibilityBonus +
          Math.floor(
            Math.max(0, curHex.elevation) /
              CONST.ELEVATION_VISIBILITY_STEP_BONUS
          );

        const title =
          `Hex: ${curHex.id}\n` +
          (appState.appMode === CONST.AppMode.PLAYER &&
          !appState.playerDiscoveredHexIds.has(curHex.id)
            ? "Undiscovered"
            : `Terrain: ${tc.name} (${
                tc.symbol || ""
              })\nElevation: ${elevTxt}\nSpeed: x${
                tc.speedMultiplier
              }, VisMod: x${tc.visibilityFactor}\nBase Inh.Vis: ${
                tc.baseInherentVisibilityBonus
              }, Elev Bonus: ${Math.floor(
                Math.max(0, curHex.elevation) /
                  CONST.ELEVATION_VISIBILITY_STEP_BONUS
              )}\nTotal Inh.Bonus: ${effInherent}\nBase Sight: ${
                curHex.baseVisibility
              }, Potential: ${sight}\nFeature: ${
                currentFeatureLower !== CONST.TerrainFeature.NONE
                  ? capitalizeFirstLetter(currentFeatureLower)
                  : "None"
              }${featureTooltipNameString}`);

        const textYOffset1 =
          cy_top_proj - CONST.HEX_SIZE * 0.35 * currentYSquashFactor;
        const textYOffset2 =
          cy_top_proj + CONST.HEX_SIZE * 0.05 * currentYSquashFactor;
        const textYOffset3 =
          cy_top_proj + CONST.HEX_SIZE * 0.45 * currentYSquashFactor;

        return {
          ...curHex,
          cx: cx_top_proj,
          cy: cy_top_proj,
          points: topFacePoints,
          is3DView: is3D,
          sideFaces: sideFacesData,
          actualElevation: curHex.elevation,
          terrainConfig: tc,
          featureDisplayIconToRender: featureDisplayIconString, 
          featureAriaLabelToRender: featureAriaLabelString,
          featureIconComputedClassToRender: featureIconComputedClassString,
          isLandmarkFeature: isLandmarkFeatureType,
          isSecretFeature: isSecretFeatureType,
          sightPotential: sight,
          elevationText: elevTxt,
          textY1: textYOffset1.toFixed(3),
          textY2: textYOffset2.toFixed(3),
          textY3: textYOffset3.toFixed(3),
          isPlayerPosition: isPlayerPosCurrentHex, // Pass the calculated value
          isDiscoveredByPlayer: appState.playerDiscoveredHexIds.has(curHex.id),
          isCurrentlyVisibleToPlayer: appState.playerCurrentVisibleHexIds.has(
            curHex.id
          ),
          isEditorLosSource: appState.editorLosSourceHexId === curHex.id,
          isVisibleInEditorLos: appState.editorVisibleHexIds.has(curHex.id),
          isEditorLosActive: editorLOSActive,
          titleText: title,
          currentFillColor: fillForTopFace,
          isTailwindFill: isTW,
          finalStrokeColor: strokeClr,
          finalStrokeWidth: finalSW,
          hexOpacityClass: opacity,
          finalTextColorClass: txtClr,
          playerMarkerColor: CONST.PLAYER_MARKER_COLOR,
          appMode: appState.appMode,
          isGM: appState.isGM,
          CONST: CONST, 
          isTextHiddenForPlayer:
            appState.appMode === CONST.AppMode.PLAYER &&
            !appState.isGM &&
            !appState.playerDiscoveredHexIds.has(curHex.id),
        };
      })
    : [];

  const hexTrueW_vb = CONST.HEX_SIZE * Math.sqrt(3);
  const hexVOff_vb = CONST.HEX_SIZE * 1.5;
  const svgPad_vb = CONST.HEX_SIZE;

  let cW_vb =
    (appState.currentGridWidth || CONST.INITIAL_GRID_WIDTH) === 1
      ? hexTrueW_vb
      : (appState.currentGridWidth || CONST.INITIAL_GRID_WIDTH) * hexTrueW_vb +
        ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) > 1
          ? hexTrueW_vb / 2
          : 0);
  let cH_vb =
    (appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) > 0
      ? ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) - 1) *
          hexVOff_vb +
        2 * CONST.HEX_SIZE
      : 0;

  if (appState.viewMode === CONST.ViewMode.THREED) {
    const maxPositiveElevEffect =
      CONST.MAX_ELEVATION * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT +
      Math.abs(
        CONST.MAX_ELEVATION * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT
      );
    const maxNegativeElevEffect =
      Math.abs(
        CONST.MIN_ELEVATION * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT
      ) +
      Math.abs(
        CONST.MIN_ELEVATION * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT
      );
    cH_vb += Math.max(
      maxPositiveElevEffect,
      maxNegativeElevEffect,
      CONST.HEX_SIZE * 2
    );
  }

  const svgVBW = Math.max(cW_vb + 2 * svgPad_vb, 100);
  const svgVBH = Math.max(cH_vb + 2 * svgPad_vb, 100);

  let hasValidGridDataAndInitialized =
    appState.mapInitialized &&
    appState.hexGridData &&
    appState.hexGridData.length > 0 &&
    appState.hexGridData[0] &&
    appState.hexGridData[0].length > 0 &&
    appState.currentGridWidth > 0 &&
    appState.currentGridHeight > 0;

  const renderContext = {
    ...appState,
    CONST,
    hexGridRenderData,
    svgViewBoxWidth: svgVBW,
    svgViewBoxHeight: svgVBH,
    hasValidGridDataAndInitialized,
  };


if (!appState.isGM) { // Log specifically for player client
    console.log("UI.JS (PLAYER CLIENT): Rendering app. currentMapEventLog in renderContext:", 
        renderContext.currentMapEventLog ? renderContext.currentMapEventLog.length : 'undefined/null',
        JSON.parse(JSON.stringify(renderContext.currentMapEventLog || []))
    );
}

  appContainer.innerHTML = mainTemplateCompiled(renderContext);
  attachEventListeners();
  console.log(
    "UI: App rendered. HasValidGridAndInit:",
    hasValidGridDataAndInitialized
  );
}

function capitalizeFirstLetter(string) {
  if (!string || typeof string !== 'string') return '';
  const lower = string.toLowerCase(); 
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function attachEventListeners() {
  console.log("UI: Attaching event listeners.");
  const el = (id) => document.getElementById(id),
    qsa = (sel) => document.querySelectorAll(sel);

  qsa('[data-action="change-view-mode"]').forEach(
    (b) =>
      (b.onclick = () => {
        appState.viewMode = b.dataset.mode;
        renderApp();
      })
  );

  if (el("newHexplorationDayBtn")) {
    el("newHexplorationDayBtn").onclick =
      HexplorationLogic.startNewHexplorationDay;
  }

  qsa('[data-action="change-app-mode"]').forEach((b) => {
    b.onclick = () => {
      MapLogic.handleAppModeChange(b.dataset.mode);
    };
  });

  const gwIn = el("gridWidth");
  if (gwIn) gwIn.onchange = (e) => (appState.tempGridWidth = e.target.value);
  const ghIn = el("gridHeight");
  if (ghIn) ghIn.onchange = (e) => (appState.tempGridHeight = e.target.value);
  if (el("applyResizeButton"))
    el("applyResizeButton").onclick = () => {
      MapLogic.handleGridResize(
        appState.tempGridWidth,
        appState.tempGridHeight
      );
    };

  qsa('[data-action="change-paint-mode"]').forEach(
    (b) =>
      (b.onclick = () => {
        appState.paintMode = b.dataset.mode;
        renderApp();
      })
  );
  const bsIn = el("brushSize");
  if (bsIn)
    bsIn.oninput = (e) => {
      appState.brushSize = parseInt(e.target.value, 10);
      renderApp(); 
    };

  qsa('[data-action="change-elevation-mode"]').forEach(
    (b) =>
      (b.onclick = () => {
        appState.elevationBrushMode = b.dataset.mode;
        renderApp();
      })
  );
  qsa('[data-action="change-terrain-type"]').forEach(
    (b) =>
      (b.onclick = () => {
        appState.selectedTerrainType = b.dataset.type;
        renderApp();
      })
  );
  qsa('[data-action="change-feature-type"]').forEach(
    (b) =>
      (b.onclick = () => {
        appState.selectedFeatureType = b.dataset.type; 
        renderApp();
      })
  );

  const createBtn = el("createNewMapButton");
  if (createBtn) createBtn.onclick = () => MapManagement.handleCreateNewMap();
  
  const saveBtn = el("saveCurrentMapButton");
  if (saveBtn) saveBtn.onclick = MapManagement.handleSaveCurrentMap;

  const saveAsBtn = el("saveMapAsButton");
  if (saveAsBtn) saveAsBtn.onclick = MapManagement.handleSaveMapAs;

  qsa('[data-action="open-map"]').forEach(
    (b) =>
      (b.onclick = (e) => MapManagement.handleOpenMap(e.target.dataset.mapId))
  );
  qsa('[data-action="delete-map"]').forEach(
    (b) =>
      (b.onclick = (e) =>
        MapManagement.handleDeleteMap(
          e.target.dataset.mapId,
          e.target.dataset.mapName
        ))
  );

  const lmffBtn = el("loadMapFromFileButton");
  const flIn = el("fileLoadInput");
  if (lmffBtn && flIn) lmffBtn.onclick = () => flIn.click();
  
  if (flIn) flIn.onchange = MapManagement.handleLoadMapFileSelected;

  if (el("resetGridButton"))
    el("resetGridButton").onclick = MapManagement.handleResetGrid;
  
  if (el("resetExplorationButton"))
    el("resetExplorationButton").onclick =
      MapManagement.handleResetExplorationAndMarker;

  if (el("toggleLosButton"))
    el("toggleLosButton").onclick = MapLogic.toggleEditorLosSelectMode;
  if (el("clearLosButton"))
    el("clearLosButton").onclick = () => {
      appState.editorLosSourceHexId = null;
      appState.editorVisibleHexIds = new Set();
      appState.isEditorLosSelectMode = false; 
      renderApp();
    };

  const hgSvg = el("hexGridSvg");
  if (hgSvg)
    hgSvg.onclick = (evt) => {
      const g = evt.target.closest("g[data-hex-id]");
      if (g && g.dataset.hexId) {
        const [c, r] = g.dataset.hexId.split("-").map(Number);
        if (!isNaN(c) && !isNaN(r)) MapLogic.handleHexClick(r, c);
      }
    };
  console.log("UI: Event listeners attached.");
}