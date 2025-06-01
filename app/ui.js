// File: app/ui.js
import { appState } from "./state.js";
import * as CONST from "./constants.js";
import * as MapLogic from "./map-logic.js";
import * as MapManagement from "./map-management.js";
import * as HexplorationLogic from "./hexploration-logic.js";

let mainTemplateCompiled;
const appContainer = document.getElementById("app-container");

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
  if (typeof terrainConfig.elevationColor === 'function') { 
    return terrainConfig.elevationColor(elevation, terrainConfig.color); 
  }
  return terrainConfig.color || 'rgb(128,128,128)'; 
}

export async function compileTemplates() {
  try {
    const responses = await Promise.all([
        fetch("templates/main.hbs"),
        fetch("templates/controls.hbs"),
        fetch("templates/hex-grid.hbs"),
        fetch("templates/hexagon.hbs"),
    ]);
    for (const res of responses) { 
        if (!res.ok) throw new Error( `Failed to fetch template: ${res.url} (${res.status} ${res.statusText})`); 
    }
    const texts = await Promise.all(responses.map((res) => res.text()));
    mainTemplateCompiled = Handlebars.compile(texts[0]);
    Handlebars.registerPartial("controls", texts[1]);
    Handlebars.registerPartial("hexGrid", texts[2]);
    Handlebars.registerPartial("hexagon", texts[3]);
    Handlebars.registerHelper({ 
        eq: (a, b) => a === b, 
        capitalize: (s) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "", 
        capitalizeFirst: function (string) { if (!string || typeof string !== "string") return ""; return string.charAt(0).toUpperCase() + string.slice(1); }, 
        typeCapitalized: function(logEntry) { if (logEntry && logEntry.type) { return logEntry.type.charAt(0).toUpperCase() + logEntry.type.slice(1); } return "Event"; }, 
        toPrecise: function (value, precision = 1) { 
            if (typeof value === "number") return value.toFixed(precision); 
            const num = parseFloat(value); 
            if (!isNaN(num)) return num.toFixed(precision); 
            return typeof value === "string" ? value : (0).toFixed(precision); 
        }, 
        objValues: (o) => Object.values(o || {}), 
        objEntries: (o) => Object.entries(o || {}).map(([k, v]) => ({ key: k, value: v })), 
        filterNoneFeature: (e) => (e || []).filter((i) => i !== CONST.TerrainFeature.NONE), 
        toFixed: (n, d) => n != null ? parseFloat(n).toFixed(d) : (0).toFixed(d), 
        mul: (a, b) => (a != null && b != null ? a * b : 0), 
        add: (a, b) => (a != null && b != null ? a + b : 0), 
        sub: (a, b) => (a != null && b != null ? a - b : 0),  
        abs: (a) => (a != null ? Math.abs(a) : 0), 
        subtract: (a, b) => (a != null && b != null ? (Number(a) - Number(b)) : 0), 
        isTailwindFill: (s) => typeof s === "string" && s.startsWith("fill-"), 
        replace: (s, f, r) => (s ? s.replace(new RegExp(f, "g"), r) : ""), 
        and: (a, b) => a && b, 
        assign: function(varName, varValue, options) { if(options && options.data && options.data.root) { options.data.root[varName] = varValue;} }, 
        gt: (a, b) => a > b, 
        lt: (a, b) => a < b, 
        getUnitLabelByKey: function(key, unitType) { 
            let unitsArray; 
            if (unitType === 'distance') { unitsArray = CONST.DISTANCE_UNITS; } 
            else if (unitType === 'time') { unitsArray = CONST.TIME_UNITS; } 
            else { return key; } 
            const unit = unitsArray.find(u => u.key === key); 
            return unit ? (unit.label.toLowerCase() === key.toLowerCase() || unit.label.length <= 3 ? unit.label : unit.label.toLowerCase()) : key; 
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
                case "&&":  return v1 && v2;  
                case "||":  return v1 || v2;  
                default:    return false; 
            } 
        },
        div: (a, b) => (b !== 0 && a != null && b != null ? (Number(a) / Number(b)) : (b === 0 ? '∞' : 0))

    });
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

    if (svgScrollContainerPrior && options.preserveScroll && !appState.centerViewOnHexAfterRender && appState.targetScrollLeft === null && appState.targetScrollTop === null) {
        oldScrollLeft = svgScrollContainerPrior.scrollLeft;
        oldScrollTop = svgScrollContainerPrior.scrollTop;
    }

    let hexesToRenderSource = appState.mapInitialized ? appState.hexGridData.flat().filter(Boolean) : [];
    if (appState.viewMode === CONST.ViewMode.THREED && appState.mapInitialized) { 
        hexesToRenderSource.sort((hexAData, hexBData) => { 
            const hexA = appState.hexDataMap.get(hexAData.id) || hexAData; 
            const hexB = appState.hexDataMap.get(hexBData.id) || hexBData; 
            const visualDepthA = hexA.row * 10000 + hexA.elevation; 
            const visualDepthB = hexB.row * 10000 + hexB.elevation; 
            if (visualDepthA < visualDepthB) return -1; 
            if (visualDepthA > visualDepthB) return 1; 
            if (hexA.col < hexB.col) return -1; 
            if (hexA.col > hexB.col) return 1; 
            return 0; 
        }); 
    }
    
    const hexGridRenderData = appState.mapInitialized ? hexesToRenderSource.map((hexInMemory) => { 
        let curHex; 
        if ( options.specificallyUpdatedHex && options.specificallyUpdatedHex.id === hexInMemory.id ) { 
            curHex = options.specificallyUpdatedHex; 
        } else { 
            curHex = appState.hexDataMap.get(hexInMemory.id) || hexInMemory; 
        } 
        const tc = CONST.TERRAIN_TYPES_CONFIG[curHex.terrain] || CONST.TERRAIN_TYPES_CONFIG[CONST.DEFAULT_TERRAIN_TYPE]; 
        const hexTrueW = CONST.HEX_SIZE * Math.sqrt(3); 
        const hexVOff = CONST.HEX_SIZE * 1.5; 
        const svgPad = CONST.HEX_SIZE; 
        const is3D = appState.viewMode === CONST.ViewMode.THREED; 
        let yShift = 0; 
        let visualDepth = 0; 
        if (is3D) { 
            yShift = curHex.elevation * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT; 
            if (curHex.elevation !== 0) { 
                visualDepth = Math.abs(curHex.elevation * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT); 
                if ( visualDepth > 0 && visualDepth < CONST.HEX_3D_MIN_VISUAL_DEPTH ) { 
                    visualDepth = CONST.HEX_3D_MIN_VISUAL_DEPTH; 
                } 
            } 
        } 
        const cx_2d_center = svgPad + hexTrueW / 2 + curHex.col * hexTrueW + (curHex.row % 2 !== 0 ? hexTrueW / 2 : 0); 
        const cy_2d_center = svgPad + CONST.HEX_SIZE + curHex.row * hexVOff; 
        const cx_top_proj = cx_2d_center; 
        const cy_top_proj = cy_2d_center - yShift; 
        const currentYSquashFactor = is3D ? CONST.HEX_3D_Y_SQUASH_FACTOR : 1; 
        const topFacePoints = Array(6).fill(0).map((_, i) => { 
            const angle = (Math.PI / 180) * (60 * i - 90); 
            const x = cx_top_proj + CONST.HEX_SIZE * Math.cos(angle); 
            const y = cy_top_proj + CONST.HEX_SIZE * Math.sin(angle) * currentYSquashFactor; 
            return `${x.toFixed(3)},${y.toFixed(3)}`; 
        }).join(" "); 
        
        let sideFacesData = []; 
        const baseFillColorForSides = getDynamicFillColor(curHex); 
        if (is3D && visualDepth > 0) { 
            const topVertices = Array(6).fill(0).map((_, i) => { 
                const angle = (Math.PI / 180) * (60 * i - 90); 
                return { x: cx_top_proj + CONST.HEX_SIZE * Math.cos(angle), y: cy_top_proj + CONST.HEX_SIZE * Math.sin(angle) * currentYSquashFactor, }; 
            }); 
            const yOffsetForBottom = curHex.elevation > 0 ? visualDepth : -visualDepth; 
            const bottomVertices = topVertices.map((tv) => ({ x: tv.x, y: tv.y + yOffsetForBottom, })); 
            const finalVisibleSideIndices = curHex.elevation >= 0 ? [2, 3, 4] : [0, 1, 5]; 
            const sideFill = lerpColor( baseFillColorForSides, "rgb(0,0,0)", CONST.HEX_3D_SIDE_COLOR_DARKEN_FACTOR ); 
            for (const i of finalVisibleSideIndices) { 
                const p1 = topVertices[i]; 
                const p2 = topVertices[(i + 1) % 6]; 
                const p3 = bottomVertices[(i + 1) % 6]; 
                const p4 = bottomVertices[i]; 
                sideFacesData.push({ points: `${p1.x.toFixed(3)},${p1.y.toFixed(3)} ${p2.x.toFixed(3)},${p2.y.toFixed(3)} ${p3.x.toFixed(3)},${p3.y.toFixed(3)} ${p4.x.toFixed(3)},${p4.y.toFixed(3)}`, fill: sideFill, isTailwindFill: false, }); 
            } 
        } 
        
        let fillForTopFace = baseFillColorForSides; 
        let isTW = typeof fillForTopFace === "string" && fillForTopFace.startsWith("fill-"); 
        let txtClr = "fill-white"; 
        if (!isTW) { 
            const rgbMatch = fillForTopFace.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); 
            if (rgbMatch) { 
                const r = parseInt(rgbMatch[1]); 
                const g = parseInt(rgbMatch[2]); 
                const b = parseInt(rgbMatch[3]); 
                const brightness = (r * 299 + g * 587 + b * 114) / 1000; 
                if (brightness > 130) { txtClr = "fill-gray-800"; } 
                if (curHex.terrain === CONST.TerrainType.MOUNTAIN && curHex.elevation >= CONST.MOUNTAIN_ELEV_SNOW_LINE_START) { txtClr = CONST.MOUNTAIN_LIGHT_SURFACE_TEXT_COLOR; } 
            } 
        } else { 
            if ( fillForTopFace.includes("100") || fillForTopFace.includes("200") || fillForTopFace.includes("300") || fillForTopFace.includes("400") || (fillForTopFace.includes("lime")&&!fillForTopFace.includes("900"))||(fillForTopFace.includes("yellow")&&!fillForTopFace.includes("900"))||(fillForTopFace.includes("cyan")&&!fillForTopFace.includes("900")) ) { txtClr = "fill-gray-800"; } 
        } 
        
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
            } else if ( !appState.playerCurrentVisibleHexIds.has(curHex.id) && (!appState.partyMarkerPosition || appState.partyMarkerPosition.id !== curHex.id) ) { 
                opacity = `opacity-${Math.round(CONST.DISCOVERED_DIM_OPACITY * 100)}`; 
                if (appState.isGM) opacity = "opacity-60"; 
            } 
        } 
        
        const editorLOSActive = appState.editorLosSourceHexId !== null; 
        let strokeClr = "stroke-gray-500"; 
        let strokeW = Math.max( 0.75, Math.min(3, 0.75 + Math.max(0, curHex.elevation) / 500) ); 
        if (curHex.elevation < 0) strokeW = Math.max(0.5, 0.75 + curHex.elevation / 1000); 
        let finalSW = strokeW.toFixed(2); 
        
        if (appState.appMode === CONST.AppMode.HEX_EDITOR && editorLOSActive) { 
            if (appState.editorLosSourceHexId === curHex.id) { 
                strokeClr = "stroke-yellow-400"; finalSW = "3"; 
            } else if (appState.editorVisibleHexIds.has(curHex.id)) { 
                strokeClr = "stroke-cyan-300"; finalSW = Math.min(4, strokeW + 0.5).toFixed(2); 
            } else { 
                opacity = "opacity-40"; 
            } 
        } 
        
        if (fillForTopFace === CONST.FOG_OF_WAR_COLOR && appState.appMode === CONST.AppMode.PLAYER && !appState.isGM ) { 
            txtClr = "fill-transparent"; 
        } 
        
        let featureDisplayIconString = ""; 
        let featureTooltipNameString = "";  
        let featureAriaLabelString = ""; 
        const currentFeatureLower = curHex.feature ? curHex.feature.toLowerCase() : CONST.TerrainFeature.NONE.toLowerCase(); 
        let featureIconComputedClassString = "fill-transparent"; 
        
        if (currentFeatureLower === CONST.TerrainFeature.LANDMARK.toLowerCase()) { 
            featureDisplayIconString = curHex.featureIcon || "★"; 
            featureTooltipNameString = curHex.featureName ? ` (${curHex.featureName})` : " (Unnamed Landmark)"; 
            featureAriaLabelString = curHex.featureName || "Landmark"; 
            featureIconComputedClassString = curHex.featureIconColor || CONST.DEFAULT_LANDMARK_ICON_COLOR_CLASS; 
        } else if (currentFeatureLower === CONST.TerrainFeature.SECRET.toLowerCase()) { 
            if (appState.isGM ) { 
                featureDisplayIconString = curHex.featureIcon || "🤫"; 
                featureTooltipNameString = curHex.featureName ? ` (Secret: ${curHex.featureName})` : " (Hidden Secret)"; 
                featureAriaLabelString = curHex.featureName || "Secret"; 
                featureIconComputedClassString = curHex.featureIconColor || CONST.DEFAULT_SECRET_ICON_COLOR_CLASS; 
            } else { 
                featureDisplayIconString = ""; 
            } 
        } 
        
        const isLandmarkFeatureType = currentFeatureLower === CONST.TerrainFeature.LANDMARK.toLowerCase(); 
        const isSecretFeatureType = (currentFeatureLower === CONST.TerrainFeature.SECRET.toLowerCase()) && appState.isGM && featureDisplayIconString !== ""; 
        const isPlayerPosCurrentHex = appState.partyMarkerPosition?.id === curHex.id; 
        const sight = Math.max(0, (curHex.baseVisibility || 0) + Math.floor(Math.max(0, curHex.elevation) / CONST.ELEVATION_VISIBILITY_STEP_BONUS)); 
        let elevTxt = `${curHex.elevation}m`; 
        if (curHex.elevation > 0) elevTxt = `+${curHex.elevation}m`; 
        
        const effInherent = (tc.baseInherentVisibilityBonus || 0) + Math.floor(Math.max(0, curHex.elevation) / CONST.ELEVATION_VISIBILITY_STEP_BONUS);
        const title = `Hex: ${curHex.id}\n` + 
            (appState.appMode === CONST.AppMode.PLAYER && !appState.playerDiscoveredHexIds.has(curHex.id) && !appState.isGM ? "Undiscovered" : 
            `Terrain: ${tc.name} (${tc.symbol || ""})\nElevation: ${elevTxt}\nSpeed: x${tc.speedMultiplier}, VisMod: x${tc.visibilityFactor}\nBase Inh.Vis: ${tc.baseInherentVisibilityBonus || 0}, Elev Bonus: ${Math.floor(Math.max(0, curHex.elevation) / CONST.ELEVATION_VISIBILITY_STEP_BONUS)}\nTotal Inh.Bonus: ${effInherent}\nBase Sight: ${curHex.baseVisibility || 0}\nFeature: ${currentFeatureLower !== CONST.TerrainFeature.NONE.toLowerCase() ? capitalizeFirstLetter(currentFeatureLower) : "None"}${featureTooltipNameString}`);
        
        const textYOffset1 = cy_top_proj - CONST.HEX_SIZE * 0.35 * currentYSquashFactor; 
        const textYOffset2 = cy_top_proj + CONST.HEX_SIZE * 0.05 * currentYSquashFactor; 
        const textYOffset3 = cy_top_proj + CONST.HEX_SIZE * 0.45 * currentYSquashFactor; 
        const terrainSymbolYOffset = (elevTxt && elevTxt.length > 0) ? textYOffset3 : textYOffset2; 
        const terrainSymbolFontSize = (tc.symbol && tc.symbol.length > 1 && /\p{Emoji}/u.test(tc.symbol)) ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'; 
        
        return { 
            ...curHex, 
            cx: cx_top_proj, cy: cy_top_proj, points: topFacePoints, 
            is3DView: is3D, sideFaces: sideFacesData, 
            actualElevation: curHex.elevation, terrainConfig: tc, 
            featureDisplayIconToRender: featureDisplayIconString, 
            featureAriaLabelToRender: featureAriaLabelString, 
            featureIconComputedClassToRender: featureIconComputedClassString, 
            isLandmarkFeature: isLandmarkFeatureType, isSecretFeature: isSecretFeatureType, 
            sightPotential: sight, elevationText: elevTxt, 
            textY1: textYOffset1.toFixed(3), textY2: textYOffset2.toFixed(3), 
            terrainSymbolY: terrainSymbolYOffset.toFixed(3), 
            terrainSymbolFontSize: terrainSymbolFontSize, 
            isPlayerPosition: isPlayerPosCurrentHex, 
            isDiscoveredByPlayer: appState.playerDiscoveredHexIds.has(curHex.id), 
            isCurrentlyVisibleToPlayer: appState.playerCurrentVisibleHexIds.has(curHex.id), 
            isEditorLosSource: appState.editorLosSourceHexId === curHex.id, 
            isVisibleInEditorLos: appState.editorVisibleHexIds.has(curHex.id), 
            isEditorLosActive: editorLOSActive, 
            titleText: title, currentFillColor: fillForTopFace, isTailwindFill: isTW, 
            finalStrokeColor: strokeClr, finalStrokeWidth: finalSW, 
            hexOpacityClass: opacity, finalTextColorClass: txtClr, 
            playerMarkerColor: CONST.PLAYER_MARKER_COLOR, 
            appMode: appState.appMode, isGM: appState.isGM, CONST: CONST, 
            isTextHiddenForPlayer: appState.appMode === CONST.AppMode.PLAYER && !appState.isGM && !appState.playerDiscoveredHexIds.has(curHex.id),
        }; 
    }) : [];

    const hexTrueW_vb = CONST.HEX_SIZE * Math.sqrt(3); 
    const hexVOff_vb = CONST.HEX_SIZE * 1.5; 
    const svgPad_vb = CONST.HEX_SIZE; 
    let naturalContentWidth = (appState.currentGridWidth || CONST.INITIAL_GRID_WIDTH) * hexTrueW_vb + ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) > 1 ? hexTrueW_vb / 2 : 0) + (2 * svgPad_vb); 
    if ((appState.currentGridWidth || CONST.INITIAL_GRID_WIDTH) === 1 && (appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) === 1) { naturalContentWidth = hexTrueW_vb + (2* svgPad_vb); } 
    else if ((appState.currentGridWidth || CONST.INITIAL_GRID_WIDTH) === 1 ) { naturalContentWidth = hexTrueW_vb + (2* svgPad_vb); } 
    
    let naturalContentHeight = ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) -1) * hexVOff_vb + (2 * CONST.HEX_SIZE) + (2 * svgPad_vb); 
    if ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) === 0) { naturalContentHeight = 2 * svgPad_vb; } 
    else if ((appState.currentGridHeight || CONST.INITIAL_GRID_HEIGHT) === 1) { naturalContentHeight = (2 * CONST.HEX_SIZE) + (2 * svgPad_vb); } 
    
    if (appState.viewMode === CONST.ViewMode.THREED) { 
        const maxElevationEffect = Math.max( Math.abs(CONST.MAX_ELEVATION * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT), Math.abs(CONST.MIN_ELEVATION * CONST.HEX_3D_PROJECTED_Y_SHIFT_PER_ELEVATION_UNIT) ); 
        const maxDepthEffect = Math.max( Math.abs(CONST.MAX_ELEVATION * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT), Math.abs(CONST.MIN_ELEVATION * CONST.HEX_3D_PROJECTED_DEPTH_PER_ELEVATION_UNIT) ); 
        naturalContentHeight += maxElevationEffect + maxDepthEffect + CONST.HEX_SIZE; 
    } 
    
    const svgViewBoxWidth = Math.max(naturalContentWidth, 100); 
    const svgViewBoxHeight = Math.max(naturalContentHeight, 100); 
    let hasValidGridDataAndInitialized = appState.mapInitialized && 
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
        svgViewBoxWidth, 
        svgViewBoxHeight, 
        hasValidGridDataAndInitialized,
        activePartyActivitiesCount: appState.activePartyActivities.size, 
        isActivePartyActivity: (id) => appState.activePartyActivities.has(id) 
    };

    appContainer.innerHTML = mainTemplateCompiled(renderContext);

    if (hasValidGridDataAndInitialized) {
        const svgElement = document.getElementById("hexGridSvg");
        const newSvgScrollContainer = document.getElementById("svg-scroll-container");

        if (svgElement && newSvgScrollContainer) {
            svgElement.style.width = svgViewBoxWidth + "px";
            svgElement.style.height = svgViewBoxHeight + "px";
            svgElement.style.transform = `scale(${appState.zoomLevel})`;
            svgElement.style.transformOrigin = "0 0";

            let scrollSet = false;

            if (appState.centerViewOnHexAfterRender) {
                MapLogic.calculateAndApplyScrollForHex(appState.centerViewOnHexAfterRender, newSvgScrollContainer.id);
                appState.centerViewOnHexAfterRender = null; 
                scrollSet = true;
            }
            
            if (!scrollSet && 
                appState.appMode === CONST.AppMode.PLAYER &&
                appState.partyMarkerPosition) {
                MapLogic.calculateAndApplyScrollForHex(appState.partyMarkerPosition.id, newSvgScrollContainer.id);
                scrollSet = true;
                appState.targetScrollLeft = null;
                appState.targetScrollTop = null;
            }

            if (!scrollSet && appState.targetScrollLeft !== null && appState.targetScrollTop !== null) {
                newSvgScrollContainer.scrollLeft = appState.targetScrollLeft;
                newSvgScrollContainer.scrollTop = appState.targetScrollTop;
                appState.targetScrollLeft = null; 
                appState.targetScrollTop = null;  
                scrollSet = true;
            }
            
            if (!scrollSet && options.preserveScroll && svgScrollContainerPrior) {
                newSvgScrollContainer.scrollLeft = oldScrollLeft;
                newSvgScrollContainer.scrollTop = oldScrollTop;
                scrollSet = true;
            }

            if (!scrollSet && !svgScrollContainerPrior && appState.mapInitialized) { 
                 const firstHex = appState.hexDataMap.values().next().value;
                 if(firstHex) MapLogic.calculateAndApplyScrollForHex(firstHex.id, newSvgScrollContainer.id);
                 scrollSet = true; 
            }
        }
    }
    attachEventListeners();
}

function capitalizeFirstLetter(string) {
  if (!string || typeof string !== "string") return "";
  const lower = string.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function attachEventListeners() {
  const el = (id) => document.getElementById(id);
  const qsa = (sel) => document.querySelectorAll(sel);

  const terrainSelect = el("terrainTypeSelect");
  if (terrainSelect) {
    terrainSelect.onchange = (e) => {
      appState.selectedTerrainType = e.target.value;
    };
  }

  const featureSelect = el("featureToggleSelect");
  if (featureSelect) {
    featureSelect.onchange = (e) => {
      appState.selectedFeatureType = e.target.value;
    };
  }

  const savedMapSelect = el("savedMapSelect");
  if (savedMapSelect) {
    savedMapSelect.onchange = (event) => {
      const mapId = event.target.value;
      if (mapId) { 
        MapManagement.handleOpenMap(mapId, false); 
      }
    };
  }

  const openSelectedMapBtn = el("openSelectedMapButton");
  if (openSelectedMapBtn && savedMapSelect) { 
    openSelectedMapBtn.onclick = () => {
      const mapId = savedMapSelect.value;
      if (mapId) {
        MapManagement.handleOpenMap(mapId, false);
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
        const mapName = selectedOption && selectedOption.value ? selectedOption.text.split(' (')[0] : 'the selected map';
        if (mapId) {
            MapManagement.handleDeleteMap(mapId, mapName);
        } else {
            alert("Please select a map to delete.");
        }
    };
  }

  qsa('[data-action="change-view-mode"]').forEach((b) => {
      b.onclick = () => {
        const oldViewMode = appState.viewMode;
        appState.viewMode = b.dataset.mode;
        appState.centerViewOnHexAfterRender = null;
        appState.targetScrollLeft = null;
        appState.targetScrollTop = null;

        if (appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition) {
             // Rely on renderApp's new default player mode centering
        } else if (oldViewMode !== appState.viewMode) {
            MapLogic.setTargetScrollForHexBasedOnCurrentCenter(appState.zoomLevel, appState.zoomLevel);
        }
        renderApp(); 
      };
  });

  if (el("newHexplorationDayBtn")) {
    el("newHexplorationDayBtn").onclick = HexplorationLogic.startNewHexplorationDay;
  }

  const zoomInBtn = el("zoomInButton"); 
  if (zoomInBtn) zoomInBtn.onclick = () => { 
      const oldZoom = appState.zoomLevel; 
      appState.zoomLevel = Math.min(appState.maxZoom, appState.zoomLevel + appState.zoomStep); 
      if (el("zoomSlider")) el("zoomSlider").value = appState.zoomLevel; 
      if (!(appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition)) {
        MapLogic.setTargetScrollForHexBasedOnCurrentCenter(oldZoom,appState.zoomLevel); 
      }
      renderApp(); 
  };
  const zoomOutBtn = el("zoomOutButton"); 
  if (zoomOutBtn) zoomOutBtn.onclick = () => { 
      const oldZoom = appState.zoomLevel; 
      appState.zoomLevel = Math.max(appState.minZoom, appState.zoomLevel - appState.zoomStep); 
      if (el("zoomSlider")) el("zoomSlider").value = appState.zoomLevel; 
      if (!(appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition)) {
        MapLogic.setTargetScrollForHexBasedOnCurrentCenter(oldZoom,appState.zoomLevel); 
      }
      renderApp(); 
  };
  const zoomSlider = el("zoomSlider"); 
  if (zoomSlider) zoomSlider.oninput = (e) => { 
      const oldZoom = appState.zoomLevel; 
      appState.zoomLevel = parseFloat(e.target.value); 
      if (!(appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition)) {
        MapLogic.setTargetScrollForHexBasedOnCurrentCenter(oldZoom,appState.zoomLevel); 
      }
      renderApp(); 
  };
  const resetZoomBtn = el("resetZoomButton"); 
  if (resetZoomBtn) resetZoomBtn.onclick = () => { 
      const oldZoom = appState.zoomLevel; 
      appState.zoomLevel = 1.0; 
      if (el("zoomSlider")) el("zoomSlider").value = appState.zoomLevel; 
      if (!(appState.appMode === CONST.AppMode.PLAYER && appState.partyMarkerPosition)) {
        MapLogic.setTargetScrollForHexBasedOnCurrentCenter(oldZoom,appState.zoomLevel); 
      }
      renderApp(); 
  };

  qsa('[data-action="change-app-mode"]').forEach((b) => { 
      b.onclick = () => { MapLogic.handleAppModeChange(b.dataset.mode); }; 
  });

  const createRenderAppWithScrollPreservation = (callback) => {
    return (...args) => {
      if (callback) callback(...args);
      appState.centerViewOnHexAfterRender = null; 
      appState.targetScrollLeft = null;
      appState.targetScrollTop = null;
      renderApp({ preserveScroll: true });
    };
  };

  qsa('[data-action="change-paint-mode"]').forEach((b) => (b.onclick = createRenderAppWithScrollPreservation(() => { appState.paintMode = b.dataset.mode; })));
  
  const bsIn = el("brushSize"); 
  if (bsIn) bsIn.oninput = createRenderAppWithScrollPreservation((e) => { 
      appState.brushSize = parseInt(e.target.value, 10);
      const brushSizeValueDisplay = el("brushSizeValue");
      if (brushSizeValueDisplay) brushSizeValueDisplay.textContent = appState.brushSize;
  });
  
  qsa('[data-action="change-elevation-mode"]').forEach((b) => (b.onclick = createRenderAppWithScrollPreservation(() => { appState.elevationBrushMode = b.dataset.mode; })));

  const createBtn = el("createNewMapButton"); if (createBtn) createBtn.onclick = () => MapManagement.handleCreateNewMap();
  
  const saveBtn = el("saveCurrentMapButton"); 
  if (saveBtn) {
      saveBtn.onclick = (event) => MapManagement.handleSaveCurrentMap(event); 
  }

  const saveAsBtn = el("saveMapAsButton"); if (saveAsBtn) saveAsBtn.onclick = MapManagement.handleSaveMapAs;
  
  const lmffBtn = el("loadMapFromFileButton"); 
  const flIn = el("fileLoadInput"); 
  if (lmffBtn && flIn) lmffBtn.onclick = () => flIn.click();
  if (flIn) flIn.onchange = MapManagement.handleLoadMapFileSelected;
  
  if (el("resetGridButton")) el("resetGridButton").onclick = MapManagement.handleResetGrid;
  if (el("resetExplorationButton")) el("resetExplorationButton").onclick = MapManagement.handleResetExplorationAndMarker;

  if (el("toggleLosButton")) el("toggleLosButton").onclick = () => { MapLogic.toggleEditorLosSelectMode(); } 
  if (el("clearLosButton")) {
    el("clearLosButton").onclick = createRenderAppWithScrollPreservation(() => {
        if (appState.appMode === CONST.AppMode.HEX_EDITOR) {
            appState.editorLosSourceHexId = null;
            appState.editorVisibleHexIds = new Set();
        }
    });
  }

  const hgSvg = el("hexGridSvg");
  if (hgSvg) hgSvg.onclick = (evt) => {
      const g = evt.target.closest("g[data-hex-id]");
      if (g && g.dataset.hexId) {
        const [colStr, rowStr] = g.dataset.hexId.split("-");
        const c = parseInt(colStr, 10);
        const r = parseInt(rowStr, 10);
        if (!isNaN(c) && !isNaN(r)) {
            appState.centerViewOnHexAfterRender = null; 
            appState.targetScrollLeft = null;
            appState.targetScrollTop = null;
            MapLogic.handleHexClick(r, c); 
        }
      }
    };

  const rightPanel = el("right-panel");
  if (rightPanel) {
      rightPanel.addEventListener('change', (event) => {
          if (event.target.matches('input[type="checkbox"][data-activity-id]')) {
              const activityId = event.target.dataset.activityId;
              if (event.target.checked) {
                  appState.activePartyActivities.add(activityId);
              } else {
                  appState.activePartyActivities.delete(activityId);
              }
              renderApp({ preserveScroll: true }); 
          }
      });
      rightPanel.addEventListener('click', (event) => {
          if (event.target.id === 'exploreCurrentHexBtn' || event.target.closest('#exploreCurrentHexBtn')) {
              if (appState.partyMarkerPosition && appState.isGM && appState.appMode === CONST.AppMode.PLAYER) {
                  MapLogic.handleHexClick(appState.partyMarkerPosition.row, appState.partyMarkerPosition.col, true); 
              }
          }
      });
  }
}