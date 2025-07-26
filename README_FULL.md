# Bubble Contact Web - Full Overview

## Tech Stack
- **Electron**: main runtime providing the desktop shell.
- **Node.js**: JavaScript runtime used by Electron for the main process.
- **D3.js**: library for rendering and animating the SVG bubble visualization.
- **HTML/CSS/JavaScript**: front‑end technologies used in `index.html` and `renderer.js`.
- **electron-builder**: packaging tool for creating distributable builds.
- **Local JSON storage**: contacts persisted to `contacts.json` inside the user data directory.

## File & Folder Structure
- `index.js` – Electron main process. Creates the application window, handles menu actions, and manages reading/writing `contacts.json`.
- `index.html` – Main web page rendered in the Electron window. Contains inline styles and the DOM structure for the UI.
- `renderer.js` – Runs in the renderer process. Implements the D3 bubble canvas, contact editing logic, tag filtering, search, zoom/pan, and CSV import/export helpers.
- `assets/` – Currently only `marbles.jpg` which is an example asset.
- `package.json` / `package-lock.json` – Node package metadata and dependency lock file.
- `PRD.md` and `PRD_MVP.md` – design documents describing the vision and MVP scope.

The project root contains no additional folders; all source files are located alongside the configuration files.

## Build / Run Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the application in development mode:
   ```bash
   npm start
   ```
   This launches Electron and loads `index.html`.
3. To build a distributable package, run:
   ```bash
   npm run dist
   ```
   which invokes `electron-builder` using the configuration in `package.json`.

Contacts are saved locally in the user's application data directory as `contacts.json`. The app runs completely offline.

## Component Architecture

### Main Process (`index.js`)
- Creates a `BrowserWindow` sized to the user's primary display.
- Defines an application menu with **File > Import/Export** actions and the default **View** menu.
- Handles IPC channels:
  - `load-contacts` – returns the parsed contents of `contacts.json`.
  - `save-contacts` – writes the provided contact array to disk.
  - `import-csv` and `export-csv` – show file dialogs and read/write CSV data.
- Emits `window-resized` events to the renderer when the window is moved or resized so the layout can re-center bubbles.

### Renderer (`renderer.js`)
- Maintains application state: the `contacts` array, selected filter tags, currently focused contact, and zoom/pan parameters.
- Initializes a D3 force simulation to animate bubbles and link contacts with shared tags.
- Provides functions for:
  - Creating bubble gradients and computing bubble radius.
  - Rendering contacts, tag panels, and connecting lines.
  - Handling drag behavior, zooming, and panning.
  - Opening/closing the contact edit form (side panel) and saving/deleting contacts.
  - Importing/exporting CSV via IPC to the main process.
  - Live search dropdown and auto-complete suggestions for tags and company names.

The renderer listens for DOM events from elements defined in `index.html` (buttons, sliders, form fields) and updates the simulation accordingly.

### HTML Structure (`index.html`)
- **Top Bar** – fixed header containing:
  - Search input with drop‑down results.
  - Contacts toggle showing the number of contacts and a dropdown list.
- **Tag Panel** – fixed panel on the left listing all tags with counts and a "Clear Active Tags" button.
- **SVG Bubble Canvas** – central area where contacts are displayed as animated bubbles. Concentric circles appear when tags are selected to indicate match levels.
- **Zoom Control** – slider and reset button in the lower right for adjusting zoom. Mouse wheel zooming and click‑drag panning are also supported.
- **Add Bubble Button** – floating "+" button to create a new contact.
- **Side Panel** – slide‑out form for viewing/editing a contact. Contains standard fields (name, email, phone, address, title, company) and tag management controls with suggestions.
- **Confirm Overlay** – modal dialog shown when deleting a contact or tag.

## UI & UX Flow
1. On launch, the app loads contacts from `contacts.json`. If no file exists, a sample contact is created. The system color scheme is detected and the page toggles dark mode accordingly.
2. Bubbles drift gently in the canvas. Each bubble shows the contact's name; lines connect contacts sharing tags.
3. **Search Box** – typing filters bubbles in real time and shows matching contacts in a dropdown. Selecting a result focuses that contact, opens the side panel for editing, and centers it.
4. **Tag Panel** – clicking a tag filters contacts. Those matching all selected tags move to the center ring, partial matches to an intermediate ring, and non‑matches to the outer ring. Tags can be cleared with the dedicated button.
5. **Add Bubble (+)** – opens the side panel with empty fields to create a new contact. Saving immediately stores data and adds a bubble to the canvas.
6. **Editing a Contact** – clicking a bubble opens the side panel populated with that contact’s details. Tags can be added/removed using the suggestion boxes. Hitting **Save** persists changes; **Delete** asks for confirmation and then removes the contact.
7. **Zoom Slider / Mouse Wheel** – adjusts zoom level of the bubble canvas. The reset button returns to 100% zoom and re‑centers the view.
8. **Import/Export** – via the **File** menu. Importing reads a CSV and converts rows into contacts. Exporting writes the current contacts to a CSV with Outlook‑style headers.

## State Management
All state is kept in memory within `renderer.js`. There is no external state library—arrays and variables track contacts, selected tags, zoom levels, etc. Changes are persisted by sending the full contact list to the main process which writes `contacts.json`.

## Data Flow
- Renderer requests contacts with `ipcRenderer.invoke('load-contacts')` during startup.
- User interactions modify the in-memory list; `ipcRenderer.send('save-contacts', contacts)` persists those changes.
- Import/export operations invoke IPC handlers that open dialogs and read/write CSV files.

## Authentication & Permissions
The application stores data locally and performs no user authentication. There are no roles or permissions; any user of the app has full access to edit or delete contacts.

## Known Issues / Future Work
- The project currently has no automated tests.
- Additional fields and richer customization could be added to contacts.
- Distribution is configured for Windows NSIS installers via electron-builder, but cross‑platform packaging may require further setup.

