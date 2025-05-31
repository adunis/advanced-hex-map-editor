// advanced-hex-map-editor/app/ui.js
import { appState } from "./state.js";
import * as CONST from "./constants.js";
import * as MapLogic from "./map-logic.js";
import * as MapManagement from "./map-management.js";
import * as HexplorationLogic from "./hexploration-logic.js";

let mainTemplateCompiled;
const appContainer = document.getElementById("app-container");

// --- UTILITY FUNCTIONS for UI (lerpColor, getDynamicFillColor) ---
// (These functions remain the same as your provided version)
export function lerpColor(color1Str, color2Str, factor) {
  const parse = (s) => s.match(/\d+/g)?.map(Number);
  const c1 = parse(color1Str);
  const c2 = parse(color2Str);
  if (!c1 || !c2 || c1.length < 3 || c2.length < 3) {
    return "rgb(0,0,0)";
  }
  const r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
  const g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
  const b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
  return `rgb(${r},${g},${b})`;
}

export function getDynamicFillColor(hexData) {
  if (!hexData || !hexData.terrain) {
    const defaultTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
    return defaultTerrainConfig ? defaultTerrainConfig.color : 'rgb(128,128,128)';
  }
  const { terrain, elevation } = hexData;
  const terrainConfig = CONST.TERRAIN_TYPES_CONFIG[terrain];
  if (!terrainConfig) {
    const defaultTerrainConfig = CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE];
    return defaultTerrainConfig ? defaultTerrainConfig.color : 'rgb(128,128,128)';
  }
  if (terrain === CONST.TerrainType.PLAINS) { return elevation >= 0 && elevation < CONST.HILLS_THRESHOLD ? CONST.PLAINS_LOW_ELEV_COLOR : terrainConfig.color; }
  else if (terrain === CONST.TerrainType.HILLS) { if (elevation >= CONST.HILLS_THRESHOLD && elevation < CONST.MOUNTAIN_THRESHOLD) { const factor = (elevation - CONST.HILLS_THRESHOLD) / Math.max(1, CONST.MOUNTAIN_THRESHOLD - 1 - CONST.HILLS_THRESHOLD); return lerpColor(CONST.HILLS_COLOR_LOW, CONST.HILLS_COLOR_HIGH, Math.max(0, Math.min(1, factor))); } return elevation < CONST.HILLS_THRESHOLD ? CONST.HILLS_COLOR_LOW : CONST.HILLS_COLOR_HIGH; }
  else if (terrain === CONST.TerrainType.MOUNTAIN) { if (elevation < CONST.MOUNTAIN_THRESHOLD) return CONST.MOUNTAIN_COLOR_LOW_SLOPE; if (elevation <= CONST.MOUNTAIN_ELEV_MID_SLOPE_END) { const factor = (elevation - CONST.MOUNTAIN_THRESHOLD) / Math.max(1, CONST.MOUNTAIN_ELEV_MID_SLOPE_END - CONST.MOUNTAIN_THRESHOLD); return lerpColor(CONST.MOUNTAIN_COLOR_LOW_SLOPE, CONST.MOUNTAIN_COLOR_MID_SLOPE, Math.max(0, Math.min(1, factor))); } if (elevation < CONST.MOUNTAIN_ELEV_ICE_TRANSITION_START) return CONST.MOUNTAIN_COLOR_SNOW_LINE; const effectivePeakEnd = Math.min(CONST.MOUNTAIN_ELEV_ICE_PEAK_END, CONST.MAX_ELEVATION > CONST.MOUNTAIN_ELEV_ICE_TRANSITION_START ? CONST.MAX_ELEVATION : CONST.MOUNTAIN_ELEV_ICE_PEAK_END); if (elevation >= effectivePeakEnd) return CONST.MOUNTAIN_COLOR_ICE_PEAK; const iceFactor = (elevation - CONST.MOUNTAIN_ELEV_ICE_TRANSITION_START) / Math.max(1, effectivePeakEnd - CONST.MOUNTAIN_ELEV_ICE_TRANSITION_START); return lerpColor(CONST.MOUNTAIN_COLOR_SNOW_LINE, CONST.MOUNTAIN_COLOR_ICE_PEAK, Math.max(0, Math.min(1, iceFactor))); }
  if (typeof terrainConfig.elevationColor === 'function') { return terrainConfig.elevationColor(elevation, terrainConfig.color); }
  return terrainConfig.color;
}

// --- TEMPLATING & RENDERING ---
export async function compileTemplates() {
  try {
    // ... (Template fetching remains the same)
    const responses = await Promise.all([fetch("templates/main.hbs"),fetch("templates/controls.hbs"),fetch("templates/hex-grid.hbs"),fetch("templates/hexagon.hbs"),]);
    for (const res of responses) { if (!res.ok) throw new Error( `Failed to fetch template: ${res.url} (${res.status} ${res.statusText})`); }
    const texts = await Promise.all(responses.map((res) => res.text()));
    mainTemplateCompiled = Handlebars.compile(texts[0]);
    Handlebars.registerPartial("controls", texts[1]);
    Handlebars.registerPartial("hexGrid", texts[2]);
    Handlebars.registerPartial("hexagon", texts[3]);
    // ... (Handlebars helpers remain the same)
    Handlebars.registerHelper({ eq: (a, b) => a === b, capitalize: (s) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "", capitalizeFirst: function (string) { if (!string || typeof string !== "string") return ""; return string.charAt(0).toUpperCase() + string.slice(1); }, typeCapitalized: function(logEntry) { if (logEntry && logEntry.type) { return logEntry.type.charAt(0).toUpperCase() + logEntry.type.slice(1); } return "Event"; }, toPrecise: function (value, precision = 3) { if (typeof value === "number") return value.toFixed(precision); const num = parseFloat(value); if (!isNaN(num)) return num.toFixed(precision); return typeof value === "string" ? value : "0.000"; }, objValues: (o) => Object.values(o || {}), objEntries: (o) => Object.entries(o || {}).map(([k, v]) => ({ key: k, value: v })), filterNoneFeature: (e) => (e || []).filter((i) => i !== CONST.TerrainFeature.NONE), toFixed: (n, d) => n != null ? parseFloat(n).toFixed(d) : (0).toFixed(d), mul: (a, b) => (a != null && b != null ? a * b : 0), add: (a, b) => (a != null && b != null ? a + b : 0), sub: (a, b) => (a != null && b != null ? a - b : 0),  abs: (a) => (a != null ? Math.abs(a) : 0), subtract: (a, b) => (a != null && b != null ? (Number(a) - Number(b)) : 0), isTailwindFill: (s) => typeof s === "string" && s.startsWith("fill-"), replace: (s, f, r) => (s ? s.replace(new RegExp(f, "g"), r) : ""), and: (a, b) => a && b, assign: function(varName, varValue, options) { options.data.root[varName] = varValue; }, gt: (a, b) => a > b, lt: (a, b) => a < b, getUnitLabelByKey: function(key, unitType) { let unitsArray; if (unitType === 'distance') { unitsArray = CONST.DISTANCE_UNITS; } else if (unitType === 'time') { unitsArray = CONST.TIME_UNITS; } else { return key; } const unit = unitsArray.find(u => u.key === key); return unit ? (unit.label.toLowerCase() === key.toLowerCase() || unit.label.length <= 3 ? unit.label : unit.label.toLowerCase()) : key; }, ifCond: function (v1, operator, v2, options) { switch (operator) { case "==": return v1 == v2 ? options.fn(this) : options.inverse(this); case "===": return v1 === v2 ? options.fn(this) : options.inverse(this); case "!=": return v1 != v2 ? options.fn(this) : options.inverse(this); case "!==": return v1 !== v2 ? options.fn(this) : options.inverse(this); case "<": return v1 < v2 ? options.fn(this) : options.inverse(this); case "<=": return v1 <= v2 ? options.fn(this) : options.inverse(this); case ">": return v1 > v2 ? options.fn(this) : options.inverse(this); case ">=": return v1 >= v2 ? options.fn(this) : options.inverse(this); case "&&": return v1 && v2 ? options.fn(this) : options.inverse(this); case "||": return v1 || v2 ? options.fn(this) : options.inverse(this); default: return options.inverse(this); } }, compare: function (v1, operator, v2) { switch (operator) { case "==":  return v1 == v2; case "===": return v1 === v2; case "!=":  return v1 != v2; case "!==": return v1 !== v2; case "<":   return Number(v1) < Number(v2); case "<=":  return Number(v1) <= Number(v2); case ">":   return Number(v1) > Number(v2); case ">=":  return Number(v1) >= Number(v2); case "&&":  return v1 && v2;  case "||":  return v1 || v2;  default:    return false; } } });
    return true;
  } catch (error) {
    if (appContainer) appContainer.innerHTML = `<div class="text-red-500 p-4">Template Error: ${error.message}</div>`;
    console.error("AHME: Template compilation error:", error);
    return false;
  }
}

export function renderApp(options = {}) {
    if (!mainTemplateCompiled || !appContainer) {
        console.error("AHME: Main template not compiled or appContainer not found.");
        return;
    }

    let oldScrollLeft = 0;
    let oldScrollTop = 0;
    const svgScrollContainerPrior = document.getElementById('svg-scroll-container');

    // Capture scroll position if we intend to preserve it
    if (svgScrollContainerPrior && options.preserveScroll && !appState.centerViewOnHexAfterRender && appState.targetScrollLeft === null && appState.targetScrollTop === null) {
        oldScrollLeft = svgScrollContainerPrior.scrollLeft;
        oldScrollTop = svgScrollContainerPrior.scrollTop;
    }

    // --- Hex Grid Data Preparation ---
    // (This large block remains the same as your provided version, preparing hexGridRenderData)
    let hexesToRenderSource = appState.mapInitialized ? appState.hexGridData.flat().filter(Boolean) : [];
    if (appState.viewMode === CONST.ViewMode.THREED && appState.mapInitialized) { /* ... 3D sort ... */ hexesToRenderSource.sort((hexAData, hexBData) => { const hexA = appState.hexDataMap.get(hexAData.id) || hexAData; const hexB = appState.hexDataMap.get(hexBData.id) || hexBData; const visualDepthA = hexA.row * 10000 + hexA.elevation; const visualDepthB = hexB.row * 10000 + hexB.elevation; if (visualDepthA < visualDepthB) return -1; if (visualDepthA > visualDepthB) return 1; if (hexA.col < hexB.col) return -1; if (hexA.col > hexB.col) return 1; return 0; }); }
    const hexGridRenderData = appState.mapInitialized ? hexesToRenderSource.map((hexInMemory) => { let curHex; if ( options.specificallyUpdatedHex && options.specificallyUpdatedHex.id === hexInMemory.id ) { curHex = options.specificallyUpdatedHex; } else { curHex = appState.hexDataMap.get(hexInMemory.id) || hexInMemory; } const tc = CONST.TERRAIN_TYPES_CONFIG[curHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE]; const hexTrueW = CONST.HEX_SIZE * Math.sqrt(3); const hexVOff = CONST.HEX_SIZE * 1.5; const svgPad = CONST.HEX_SIZE; const is3D = appState.viewMode === CONST.ViewMode.THREED; let yShift = 0; let visualDepth = 0; if (is3D) { yShift = curHex.elevation * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT; if (curHex.elevation !== 0) { visualDepth = Math.abs(curHex.elevation * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT); if ( visualDepth > 0 && visualDepth < CONST.HEX_3D_MIN_VISUAL_DEPTH ) { visualDepth = CONST.HEX_3D_MIN_VISUAL_DEPTH; } } } const cx_2d_center = svgPad + hexTrueW / 2 + curHex.col * hexTrueW + (curHex.row % 2 !== 0 ? hexTrueW / 2 : 0); const cy_2d_center = svgPad + CONST.HEX_SIZE + curHex.row * hexVOff; const cx_top_proj = cx_2d_center; const cy_top_proj = cy_2d_center - yShift; const currentYSquashFactor = is3D ? CONST.HEX_3D_Y_SQUASH_FACTOR : 1; const topFacePoints = Array(6).fill(0).map((_, i) => { const angle = (Math.PI / 180) * (60 * i - 90); const x = cx_top_proj + CONST.HEX_SIZE * Math.cos(angle); const y = cy_top_proj + CONST.HEX_SIZE * Math.sin(angle) * currentYSquashFactor; return `${x.toFixed(3)},${y.toFixed(3)}`; }).join(" "); let sideFacesData = []; const baseFillColorForSides = getDynamicFillColor(curHex); if (is3D && visualDepth > 0) { const topVertices = Array(6).fill(0).map((_, i) => { const angle = (Math.PI / 180) * (60 * i - 90); return { x: cx_top_proj + CONST.HEX_SIZE * Math.cos(angle), y: cy_top_proj + CONST.HEX_SIZE * Math.sin(angle) * currentYSquashFactor, }; }); const yOffsetForBottom = curHex.elevation > 0 ? visualDepth : -visualDepth; const bottomVertices = topVertices.map((tv) => ({ x: tv.x, y: tv.y + yOffsetForBottom, })); const finalVisibleSideIndices = curHex.elevation >= 0 ? [2, 3, 4] : [0, 1, 5]; const sideFill = lerpColor( baseFillColorForSides, "rgb(0,0,0)", CONST.HEX_3D_SIDE_COLOR_DARKEN_FACTOR ); for (const i of finalVisibleSideIndices) { const p1 = topVertices[i]; const p2 = topVertices[(i + 1) % 6]; const p3 = bottomVertices[(i + 1) % 6]; const p4 = bottomVertices[i]; sideFacesData.push({ points: `${p1.x.toFixed(3)},${p1.y.toFixed(3)} ${p2.x.toFixed(3)},${p2.y.toFixed(3)} ${p3.x.toFixed(3)},${p3.y.toFixed(3)} ${p4.x.toFixed(3)},${p4.y.toFixed(3)}`, fill: sideFill, isTailwindFill: false, }); } } let fillForTopFace = baseFillColorForSides; let isTW = typeof fillForTopFace === "string" && fillForTopFace.startsWith("fill-"); let txtClr = "fill-white"; if (!isTW) { const rgbMatch = fillForTopFace.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); if (rgbMatch) { const r = parseInt(rgbMatch[1]); const g = parseInt(rgbMatch[2]); const b = parseInt(rgbMatch[3]); const brightness = (r * 299 + g * 587 + b * 114) / 1000; if (brightness > 130) { txtClr = "fill-gray-800"; } if (curHex.terrain === CONST.TerrainType.MOUNTAIN && curHex.elevation >= CONST.MOUNTAIN_ELEV_SNOW_LINE_START) { txtClr = CONST.MOUNTAIN_LIGHT_SURFACE_TEXT_COLOR; } } } else { if ( fillForTopFace.includes("100") || fillForTopFace.includes("200") || fillForTopFace.includes("300") || fillForTopFace.includes("400") || (fillForTopFace.includes("lime")&&!fillForTopFace.includes("900"))||(fillForTopFace.includes("yellow")&&!fillForTopFace.includes("900"))||(fillForTopFace.includes("cyan")&&!fillForTopFace.includes("900")) ) { txtClr = "fill-gray-800"; } } let opacity = "opacity-100"; if (appState.appMode === CONST.AppMode.PLAYER) { if (!appState.playerDiscoveredHexIds.has(curHex.id)) { if (appState.isGM) { fillForTopFace = "rgba(30, 30, 30, 0.75)"; isTW = false; txtClr = "fill-gray-400"; opacity = "opacity-85"; } else { fillForTopFace = CONST.FOG_OF_WAR_COLOR; isTW = false; txtClr = "fill-transparent"; } } else if ( !appState.playerCurrentVisibleHexIds.has(curHex.id) && appState.partyMarkerPosition?.id !== curHex.id ) { opacity = `opacity-${Math.round(CONST.DISCOVERED_DIM_OPACITY * 100)}`; if (appState.isGM) opacity = "opacity-60"; } } const editorLOSActive = appState.editorLosSourceHexId !== null; let strokeClr = "stroke-gray-500"; let strokeW = Math.max( 0.75, Math.min(3, 0.75 + Math.max(0, curHex.elevation) / 500) ); if (curHex.elevation < 0) strokeW = Math.max(0.5, 0.75 + curHex.elevation / 1000); let finalSW = strokeW.toFixed(2); if (appState.appMode === CONST.AppMode.HEX_EDITOR && editorLOSActive) { if (appState.editorLosSourceHexId === curHex.id) { strokeClr = "stroke-yellow-400"; finalSW = "3"; } else if (appState.editorVisibleHexIds.has(curHex.id)) { strokeClr = "stroke-cyan-300"; finalSW = Math.min(4, strokeW + 0.5).toFixed(2); } else { opacity = "opacity-40"; } } if (fillForTopFace === CONST.FOG_OF_WAR_COLOR && appState.appMode === CONST.AppMode.PLAYER && !appState.isGM ) { txtClr = "fill-transparent"; } let featureDisplayIconString = ""; let featureTooltipNameString = "";  let featureAriaLabelString = ""; const currentFeatureLower = curHex.feature ? curHex.feature.toLowerCase() : CONST.TerrainFeature.NONE.toLowerCase(); let featureIconComputedClassString = "fill-transparent"; if (currentFeatureLower === CONST.TerrainFeature.LANDMARK.toLowerCase()) { featureDisplayIconString = curHex.featureIcon || "★"; featureTooltipNameString = curHex.featureName ? ` (${curHex.featureName})` : " (Unnamed Landmark)"; featureAriaLabelString = curHex.featureName || "Landmark"; featureIconComputedClassString = curHex.featureIconColor || CONST.DEFAULT_LANDMARK_ICON_COLOR_CLASS; } else if (currentFeatureLower === CONST.TerrainFeature.SECRET.toLowerCase()) { if (appState.isGM ) { featureDisplayIconString = curHex.featureIcon || "🤫"; featureTooltipNameString = curHex.featureName ? ` (Secret: ${curHex.featureName})` : " (Hidden Secret)"; featureAriaLabelString = curHex.featureName || "Secret"; featureIconComputedClassString = curHex.featureIconColor || CONST.DEFAULT_SECRET_ICON_COLOR_CLASS; } else { featureDisplayIconString = ""; } } const isLandmarkFeatureType = currentFeatureLower === CONST.TerrainFeature.LANDMARK.toLowerCase(); const isSecretFeatureType = (currentFeatureLower === CONST.TerrainFeature.SECRET.toLowerCase()) && appState.isGM && featureDisplayIconString !== ""; const isPlayerPosCurrentHex = appState.partyMarkerPosition?.id === curHex.id; const sight = Math.max(0, curHex.baseVisibility + Math.floor(curHex.elevation / CONST.ELEVATION_VISIBILITY_STEP_BONUS)); let elevTxt = `${curHex.elevation}m`; if (curHex.elevation > 0) elevTxt = `+${curHex.elevation}m`; const effInherent = tc.baseInherentVisibilityBonus + Math.floor(Math.max(0, curHex.elevation) / CONST.ELEVATION_VISIBILITY_STEP_BONUS); const title = `Hex: ${curHex.id}\n` + (appState.appMode === CONST.AppMode.PLAYER && !appState.playerDiscoveredHexIds.has(curHex.id) && !appState.isGM ? "Undiscovered" : `Terrain: ${tc.name} (${tc.symbol || ""})\nElevation: ${elevTxt}\nSpeed: x${tc.speedMultiplier}, VisMod: x${tc.visibilityFactor}\nBase Inh.Vis: ${tc.baseInherentVisibilityBonus}, Elev Bonus: ${Math.floor(Math.max(0, curHex.elevation) / CONST.ELEVATION_VISIBILITY_STEP_BONUS)}\nTotal Inh.Bonus: ${effInherent}\nBase Sight: ${curHex.baseVisibility}\nFeature: ${currentFeatureLower !== CONST.TerrainFeature.NONE.toLowerCase() ? capitalizeFirstLetter(currentFeatureLower) : "None"}${featureTooltipNameString}`); const textYOffset1 = cy_top_proj - CONST.HEX_SIZE * 0.35 * currentYSquashFactor; const textYOffset2 = cy_top_proj + CONST.HEX_SIZE * 0.05 * currentYSquashFactor; const textYOffset3 = cy_top_proj + CONST.HEX_SIZE * 0.45 * currentYSquashFactor; const terrainSymbolYOffset = (elevTxt && elevTxt.length > 0) ? textYOffset3 : textYOffset2; const terrainSymbolFontSize = (tc.symbol && tc.symbol.length > 1 && /\p{Emoji}/u.test(tc.symbol)) ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'; return { ...curHex, cx: cx_top_proj, cy: cy_top_proj, points: topFacePoints, is3DView: is3D, sideFaces: sideFacesData, actualElevation: curHex.elevation, terrainConfig: tc, featureDisplayIconToRender: featureDisplayIconString, featureAriaLabelToRender: featureAriaLabelString, featureIconComputedClassToRender: featureIconComputedClassString, isLandmarkFeature: isLandmarkFeatureType, isSecretFeature: isSecretFeatureType, sightPotential: sight, elevationText: elevTxt, textY1: textYOffset1.toFixed(3), textY2: textYOffset2.toFixed(3), terrainSymbolY: terrainSymbolYOffset.toFixed(3), terrainSymbolFontSize: terrainSymbolFontSize, isPlayerPosition: isPlayerPosCurrentHex, isDiscoveredByPlayer: appState.playerDiscoveredHexIds.has(curHex.id), isCurrentlyVisibleToPlayer: appState.playerCurrentVisibleHexIds.has(curHex.id), isEditorLosSource: appState.editorLosSourceHexId === curHex.id, isVisibleInEditorLos: appState.editorVisibleHexIds.has(curHex.id), isEditorLosActive: editorLOSActive, titleText: title, currentFillColor: fillForTopFace, isTailwindFill: isTW, finalStrokeColor: strokeClr, finalStrokeWidth: finalSW, hexOpacityClass: opacity, finalTextColorClass: txtClr, playerMarkerColor: CONST.PLAYER_MARKER_COLOR, appMode: appState.appMode, isGM: appState.isGM, CONST: CONST, isTextHiddenForPlayer: appState.appMode === CONST.AppMode.PLAYER && !appState.isGM && !appState.playerDiscoveredHexIds.has(curHex.id),}; }) : [];

    // --- SVG Sizing and Context ---
    // (This block remains the same as your provided version)
    const hexTrueW_vb = CONST.HEX_SIZE * Math.sqrt(3); const hexVOff_vb = CONST.HEX_SIZE * 1.5; const svgPad_vb = CONST.HEX_SIZE; let naturalContentWidth = (appState.currentGridWidth || CONST.INITIAL_GRID_WIDTH) * hexTrueW_vb + ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) > 1 ? hexTrueW_vb / 2 : 0) + (2 * svgPad_vb); if ((appState.currentGridWidth || CONST.INITIAL_GRID_WIDTH) === 1 && (appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) === 1) { naturalContentWidth = hexTrueW_vb + (2* svgPad_vb); } else if ((appState.currentGridWidth || CONST.INITIAL_GRID_WIDTH) === 1 ) { naturalContentWidth = hexTrueW_vb + (2* svgPad_vb); } let naturalContentHeight = ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) -1) * hexVOff_vb + (2 * CONST.HEX_SIZE) + (2 * svgPad_vb); if ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) === 0) { naturalContentHeight = 2 * svgPad_vb; } else if ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) === 1) { naturalContentHeight = (2 * CONST.HEX_SIZE) + (2 * svgPad_vb); } if (appState.viewMode === CONST.ViewMode.THREED) { const maxElevationEffect = Math.max( Math.abs(CONST.MAX_ELEVATION * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT), Math.abs(CONST.MIN_ELEVATION * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT) ); const maxDepthEffect = Math.max( Math.abs(CONST.MAX_ELEVATION * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT), Math.abs(CONST.MIN_ELEVATION * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT) ); naturalContentHeight += maxElevationEffect + maxDepthEffect + CONST.HEX_SIZE; } const svgViewBoxWidth = Math.max(naturalContentWidth, 100); const svgViewBoxHeight = Math.max(naturalContentHeight, 100); let hasValidGridDataAndInitialized = appState.mapInitialized && appState.hexGridData && appState.hexGridData.length > 0 && appState.hexGridData[0] && appState.hexGridData[0].length > 0 && appState.currentGridWidth > 0 && appState.currentGridHeight > 0; const renderContext = { ...appState, CONST, hexGridRenderData, svgViewBoxWidth, svgViewBoxHeight, hasValidGridDataAndInitialized };


    // --- DOM Update ---
    appContainer.innerHTML = mainTemplateCompiled(renderContext);

    // --- Post-Render Adjustments (SVG transform, scrolling) ---
    if (hasValidGridDataAndInitialized) {
        const svgElement = document.getElementById("hexGridSvg");
        const newSvgScrollContainer = document.getElementById("svg-scroll-container");

        if (svgElement && newSvgScrollContainer) {
            svgElement.style.width = svgViewBoxWidth + "px";
            svgElement.style.height = svgViewBoxHeight + "px";
            svgElement.style.transform = `scale(${appState.zoomLevel})`;
            svgElement.style.transformOrigin = "0 0";

            // Scroll Handling Logic:
            if (appState.centerViewOnHexAfterRender) {
                MapLogic.calculateAndApplyScrollForHex(appState.centerViewOnHexAfterRender);
                // appState.centerViewOnHexAfterRender = null; // Consumed by calculateAndApplyScrollForHex
            } else if (appState.targetScrollLeft !== null && appState.targetScrollTop !== null) {
                newSvgScrollContainer.scrollLeft = appState.targetScrollLeft;
                newSvgScrollContainer.scrollTop = appState.targetScrollTop;
                // Reset one-time targets if they are not meant to be sticky (e.g., not for zoom)
                // if (options.clearTargetScroll) {
                //     appState.targetScrollLeft = null;
                //     appState.targetScrollTop = null;
                // }
            } else if (options.preserveScroll && svgScrollContainerPrior) {
                newSvgScrollContainer.scrollLeft = oldScrollLeft;
                newSvgScrollContainer.scrollTop = oldScrollTop;
            }
        }
    }
    attachEventListeners(); // Re-attach listeners to the new DOM
}

function capitalizeFirstLetter(string) {
  if (!string || typeof string !== "string") return "";
  const lower = string.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function attachEventListeners() {
  const el = (id) => document.getElementById(id),
    qsa = (sel) => document.querySelectorAll(sel);

     // For Terrain Type Dropdown
  const terrainSelect = el("terrainTypeSelect");
  if (terrainSelect) {
    terrainSelect.onchange = (e) => {
      appState.selectedTerrainType = e.target.value;
      // If you want immediate visual feedback on the control panel (e.g. button style), call renderApp()
      // but it's not strictly necessary for the selection itself.
      // renderApp(); 
    };
  }

  // For Feature Type Dropdown
  const featureSelect = el("featureToggleSelect");
  if (featureSelect) {
    featureSelect.onchange = (e) => {
      appState.selectedFeatureType = e.target.value;
      if (appState.selectedFeatureType === CONST.TerrainFeature.NONE) {
          appState.currentFeatureEditName = "";
          appState.currentFeatureEditIcon = "";
          appState.currentFeatureEditIconColor = CONST.DEFAULT_LANDMARK_ICON_COLOR_CLASS; // Or a generic default
      } else {
          // Potentially pre-fill if editing an existing feature, or set defaults for new
          // For now, let's assume new feature details are blank or default
          appState.currentFeatureEditName = ""; // Clear for new
          appState.currentFeatureEditIcon = (appState.selectedFeatureType === CONST.TerrainFeature.LANDMARK) ? "★" : "🤫";
          appState.currentFeatureEditIconColor = (appState.selectedFeatureType === CONST.TerrainFeature.LANDMARK) ? CONST.DEFAULT_LANDMARK_ICON_COLOR_CLASS : CONST.DEFAULT_SECRET_ICON_COLOR_CLASS;
      }
      renderApp(); // Re-render to show/hide feature detail inputs
    };
  }

  // Feature detail inputs
  const featNameInput = el("featureNameInput");
  if (featNameInput) featNameInput.oninput = (e) => appState.currentFeatureEditName = e.target.value;
  
  const featIconInput = el("featureIconInput");
  if (featIconInput) featIconInput.oninput = (e) => appState.currentFeatureEditIcon = e.target.value;

  const featIconColorSelect = el("featureIconColorSelect");
  if (featIconColorSelect) featIconColorSelect.onchange = (e) => appState.currentFeatureEditIconColor = e.target.value;


  // For Saved Map Dropdown
  const savedMapSelect = el("savedMapSelect");
  const openSelectedMapBtn = el("openSelectedMapButton");
  if (openSelectedMapBtn && savedMapSelect) {
    openSelectedMapBtn.onclick = () => {
      const mapId = savedMapSelect.value;
      if (mapId) {
        MapManagement.handleOpenMap(mapId);
      } else {
        alert("Please select a map to open.");
      }
    };
  }
  const deleteSelectedMapBtn = el("deleteSelectedMapButton");
  if (deleteSelectedMapBtn && savedMapSelect) {
    deleteSelectedMapBtn.onclick = () => {
        const mapId = savedMapSelect.value;
        const selectedOption = savedMapSelect.options[savedMapSelect.selectedIndex];
        const mapName = selectedOption ? selectedOption.text.split(' (')[0] : 'the selected map';
        if (mapId) {
            MapManagement.handleDeleteMap(mapId, mapName);
        } else {
            alert("Please select a map to delete.");
        }
    };
  }


  // GM Mode Toggle
  const gmToggle = el("gmModeToggle");
  if (gmToggle) {
    gmToggle.onchange = (e) => {
      appState.isGM = e.target.checked;
      // Potentially re-calculate visibility or other GM-dependent states
      if (appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition) {
          HexplorationLogic.updatePlayerVisibility(appState.partyMarkerPosition.row, appState.partyMarkerPosition.col);
      }
      renderApp(); // Re-render for UI changes
    };
  }

  qsa('[data-action="change-view-mode"]').forEach(
    (b) =>
      (b.onclick = () => {
        const oldViewMode = appState.viewMode;
        appState.viewMode = b.dataset.mode;
        appState.centerViewOnHexAfterRender = null; // Clear any explicit hex centering
        appState.targetScrollLeft = null;      // Clear specific scroll targets
        appState.targetScrollTop = null;

        if (appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition) {
            MapLogic.requestCenteringOnHex(appState.partyMarkerPosition.id);
        } else if (oldViewMode !== appState.viewMode) {
             // If view mode changed significantly, try to maintain visual center by recalculating scroll
             // This needs the old zoom level, but for simplicity, just use current zoom and let it adjust
            MapLogic.setTargetScrollForHexBasedOnCurrentCenter(appState.zoomLevel, appState.zoomLevel);
        }
        renderApp({ preserveScroll: true }); // Request preserving scroll if no specific centering happens
      })
  );

  if (el("newHexplorationDayBtn")) {
    el("newHexplorationDayBtn").onclick = HexplorationLogic.startNewHexplorationDay;
  }

  // Zoom Controls - These call setTargetScrollForHexBasedOnCurrentCenter and then renderApp
  const zoomInBtn = el("zoomInButton"); if (zoomInBtn) zoomInBtn.onclick = () => { const oldZoom = appState.zoomLevel; appState.zoomLevel = Math.min(appState.maxZoom, appState.zoomLevel + appState.zoomStep); if (el("zoomSlider")) el("zoomSlider").value = appState.zoomLevel; MapLogic.setTargetScrollForHexBasedOnCurrentCenter(oldZoom,appState.zoomLevel); renderApp(); };
  const zoomOutBtn = el("zoomOutButton"); if (zoomOutBtn) zoomOutBtn.onclick = () => { const oldZoom = appState.zoomLevel; appState.zoomLevel = Math.max(appState.minZoom, appState.zoomLevel - appState.zoomStep); if (el("zoomSlider")) el("zoomSlider").value = appState.zoomLevel; MapLogic.setTargetScrollForHexBasedOnCurrentCenter(oldZoom,appState.zoomLevel); renderApp(); };
  const zoomSlider = el("zoomSlider"); if (zoomSlider) zoomSlider.oninput = (e) => { const oldZoom = appState.zoomLevel; appState.zoomLevel = parseFloat(e.target.value); MapLogic.setTargetScrollForHexBasedOnCurrentCenter(oldZoom,appState.zoomLevel); renderApp(); };
  const resetZoomBtn = el("resetZoomButton"); if (resetZoomBtn) resetZoomBtn.onclick = () => { const oldZoom = appState.zoomLevel; appState.zoomLevel = 1.0; if (el("zoomSlider")) el("zoomSlider").value = appState.zoomLevel; MapLogic.setTargetScrollForHexBasedOnCurrentCenter(oldZoom,appState.zoomLevel); renderApp(); };

  // App Mode Change - handleAppModeChange calls renderApp and handles its own centering.
  qsa('[data-action="change-app-mode"]').forEach((b) => { b.onclick = () => { MapLogic.handleAppModeChange(b.dataset.mode); }; });

  // Grid Dimensions - temp values updated, applyResizeButton calls handleGridResize which calls renderApp.
  const gwIn = el("gridWidth"); if (gwIn) gwIn.onchange = (e) => (appState.tempGridWidth = parseInt(e.target.value,10) || CONST.INITIAL_GRID_WIDTH);
  const ghIn = el("gridHeight"); if (ghIn) ghIn.onchange = (e) => (appState.tempGridHeight = parseInt(e.target.value,10) || CONST.INITIAL_GRID_HEIGHT);
  if (el("applyResizeButton")) el("applyResizeButton").onclick = () => { MapLogic.handleGridResize(appState.tempGridWidth, appState.tempGridHeight); };

  // Editor Tool Toggles - these should preserve scroll.
  const createRenderAppWithScrollPreservation = (callback) => {
    return () => {
      if (callback) callback();
      appState.centerViewOnHexAfterRender = null; // Explicitly clear centering flags
      appState.targetScrollLeft = null;
      appState.targetScrollTop = null;
      renderApp({ preserveScroll: true });
    };
  };

  qsa('[data-action="change-paint-mode"]').forEach((b) => (b.onclick = createRenderAppWithScrollPreservation(() => { appState.paintMode = b.dataset.mode; })));
  const bsIn = el("brushSize"); if (bsIn) bsIn.oninput = createRenderAppWithScrollPreservation((e = bsIn.value) => { appState.brushSize = parseInt(e, 10);}); // Pass event or direct value
  qsa('[data-action="change-elevation-mode"]').forEach((b) => (b.onclick = createRenderAppWithScrollPreservation(() => { appState.elevationBrushMode = b.dataset.mode; })));
  qsa('[data-action="change-terrain-type"]').forEach((b) => (b.onclick = createRenderAppWithScrollPreservation(() => { appState.selectedTerrainType = b.dataset.type; })));
  qsa('[data-action="change-feature-type"]').forEach((b) => (b.onclick = createRenderAppWithScrollPreservation(() => { appState.selectedFeatureType = b.dataset.type; })));


  // Map Management Buttons - These usually cause major state changes where scroll reset or specific centering is acceptable.
  const createBtn = el("createNewMapButton"); if (createBtn) createBtn.onclick = () => MapManagement.handleCreateNewMap();
  const saveBtn = el("saveCurrentMapButton"); if (saveBtn) saveBtn.onclick = MapManagement.handleSaveCurrentMap;
  const saveAsBtn = el("saveMapAsButton"); if (saveAsBtn) saveAsBtn.onclick = MapManagement.handleSaveMapAs;
  qsa('[data-action="open-map"]').forEach((b) => (b.onclick = (e) => MapManagement.handleOpenMap(e.target.dataset.mapId)));
  qsa('[data-action="delete-map"]').forEach((b) => (b.onclick = (e) => MapManagement.handleDeleteMap(e.target.dataset.mapId,e.target.dataset.mapName)));
  const lmffBtn = el("loadMapFromFileButton"); const flIn = el("fileLoadInput"); if (lmffBtn && flIn) lmffBtn.onclick = () => flIn.click();
  if (flIn) flIn.onchange = MapManagement.handleLoadMapFileSelected;
  if (el("resetGridButton")) el("resetGridButton").onclick = MapManagement.handleResetGrid;
  if (el("resetExplorationButton")) el("resetExplorationButton").onclick = MapManagement.handleResetExplorationAndMarker;

  // LoS Toggles
  if (el("toggleLosButton")) el("toggleLosButton").onclick = () => { MapLogic.toggleEditorLosSelectMode(); } // Calls renderApp
  if (el("clearLosButton")) el("clearLosButton").onclick = createRenderAppWithScrollPreservation(() => { MapLogic.clearEditorLos(); });


  const hgSvg = el("hexGridSvg");
  if (hgSvg) hgSvg.onclick = (evt) => {
      const g = evt.target.closest("g[data-hex-id]");
      if (g && g.dataset.hexId) {
        const [colStr, rowStr] = g.dataset.hexId.split("-");
        const c = parseInt(colStr, 10);
        const r = parseInt(rowStr, 10);
        if (!isNaN(c) && !isNaN(r)) {
            // For brush clicks or LoS selection in editor mode, ensure scroll preservation is prioritized.
            if (appState.appMode === CONST.AppMode.HEX_EDITOR) {
                appState.centerViewOnHexAfterRender = null;
                appState.targetScrollLeft = null;
                appState.targetScrollTop = null;
                // MapLogic.handleHexClick will call renderApp, which should pick up preserveScroll if passed
            }
            MapLogic.handleHexClick(r, c); // Let handleHexClick decide on render options.
        }
      }
    };
}