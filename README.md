# Advanced Hex Map Editor

A Foundry VTT module that provides an embedded JavaScript and Handlebars application to visually edit elevations, terrain types, and features on a hexagonal grid map. It includes GM editing tools and a player view with fog of war and line of sight.

## Features

*   **Visual Hex Map Editing:** Directly paint terrain, adjust elevation, and place features on a hex grid.
*   **GM Tools:**
    *   Create, save, load, and manage multiple maps.
    *   Import/Export maps from/to JSON files.
    *   Resize grid dimensions.
    *   Fine-tune brush size and paint modes (elevation, terrain, features).
    *   Set map scale (hex size in distance units, traversal time per hex).
    *   Editor Line of Sight simulation tool.
*   **Player View:**
    *   Displays the map based on GM's active selection.
    *   Fog of War: Hexes are initially hidden, then revealed as "discovered" or "currently visible".
    *   Party Marker: GMs can place and move a party marker.
    *   Line of Sight: Visibility is calculated from the party marker's position, considering elevation, terrain type, and features.
*   **Hexploration Support:**
    *   Tracks distance and time traveled for the current "hexploration day".
    *   GM action to start a new hexploration day (resets counters).
    *   Automatic chat log entries for party movement.
    *   Random encounter checks on entering new hexes or discovering hexes (GM prompted to add features).
*   **2D and 3D View Modes:** Toggle between a flat 2D representation and a pseudo-3D projection that visualizes elevation.
*   **Customizable Terrain:** Extensive list of terrain types, each with configurable properties (movement cost, visibility impact, encounter chances, elevation-based coloring).

## Installation

2. Download the module ZIP file from the [releases page](YOUR_MODULE_DOWNLOAD_URL_HERE_OR_REPO_RELEASES) and extract it into your `Data/modules/` folder.
3.  Enable the module in your game world.

## Usage

*   **Accessing the Editor:**
    *   By default, you can use the keybinding `M` (configurable in Foundry's keybinding settings) to open/close the editor.
    * Or create a macro running this code: 'game.modules.get('advanced-hex-map-editor').api.toggleHexMap();'
*   **GM Workflow:**
    1.  Open the editor.
    2.  **Create New Map:** Use the "Create New Map" button. You'll be prompted for a name and initial map scale settings.
    3.  **Edit Map:**
        *   Select `App Mode: Hex Editor`.
        *   Use the controls in the left panel to:
            *   Choose `Paint Mode` (Elevation, Terrain, Feature).
            *   Adjust `Brush Size`.
            *   If painting Elevation, select Increase/Decrease and click hexes.
            *   If painting Terrain, select a `Terrain Type` and click hexes.
            *   If painting Features, select a `Feature Type`. For Landmarks or Secrets, clicking a hex will open a dialog to set its name, icon, and icon color.
    4.  **Save Map:** Use "Save Current Map" or "Save Map As...".
    5.  **Manage Maps:** Use the dropdown to select and "Open Selected Map" or "Delete Selected Map".
    6.  **Set Active for Players:** When a map is opened or saved by the GM, it typically becomes the active map for players.
*   **Player Workflow:**
    1.  Open the editor (if GMs have made it available/instructed players to).
    2.  The view will automatically load the map currently set as active by the GM.
    3.  Players see the map with Fog of War based on their party's exploration.
*   **Hexploration:**
    *   When the GM is in `App Mode: Player View`, clicking a hex will move the party marker to that hex.
    *   Travel time and distance are calculated and logged.
    *   Game time can be advanced automatically by the GM.
    *   The "New Hexploration Day" button (GM only) resets daily travel counters.

## For Developers (App Structure)

The core application (`app/` directory) is a standalone HTML/JS/CSS application that communicates with Foundry VTT via `window.postMessage`.

*   `app/app.js`: Main application logic, message handling with `foundry-bridge.js`.
*   `app/state.js`: Centralized state management for the app.
*   `app/constants.js`: Defines constants like terrain types, modes, default values.
*   `app/map-logic.js`: Handles grid creation, hex manipulation, line of sight calculations, player movement logic.
*   `app/map-management.js`: Manages map creation, saving, loading, import/export operations.
*   `app/hexploration-logic.js`: Handles hexploration-specific features like time/distance tracking and encounter checks.
*   `app/ui.js`: Handles Handlebars templating, rendering, and event listener attachment.
*   `app/hex-utils.js`: Utility functions for hexagonal grid math.
*   `app/templates/`: Contains Handlebars templates.
*   `foundry-bridge.js`: Runs in the Foundry VTT context, manages the iframe, handles communication with the app, and interacts with Foundry settings and APIs.

## Contributing

Bug reports and feature requests can be submitted via the [issue tracker](YOUR_BUG_TRACKER_URL_HERE). Pull requests are welcome.

## License

GNU GPLv3