# Migrating Bubble Contact Web to a Lightweight Framework

The current project uses **Electron** to package and run the HTML/JS/CSS interface. While Electron provides a consistent desktop runtime, it bundles a full Chromium instance which can result in large binary sizes. A more lightweight alternative is **Tauri**, which embeds the system WebView and has a very small Rust-based backend. Tauri is well-suited because the UI is already written in plain HTML/JavaScript and only requires limited filesystem access for persisting contacts and importing/exporting CSV files.

Below are the high-level steps to transition the application from Electron to Tauri while retaining existing functionality.

## 1. Install Tauri prerequisites

1. Install Rust and Cargo (https://www.rust-lang.org/tools/install).
2. Install the Tauri CLI globally:
   ```bash
   cargo install tauri-cli
   ```
3. Ensure Node.js and npm are available (already used by the project).

## 2. Create a Tauri project skeleton

1. From the project root, initialize a new Tauri application:
   ```bash
   npx tauri init
   ```
   - Choose `src-tauri` as the Rust backend directory.
   - Set the front-end directory to the existing `web` folder.
2. The command creates a `src-tauri` directory containing Rust source code and a `tauri.conf.json` configuration file.

## 3. Move existing front-end files

1. Keep `web/index.html`, `web/app.js`, and `web/style.css` as the main UI assets.
2. Update any paths in `index.html` that reference the old Electron structure if necessary. Tauri will serve these files directly.
3. Remove the unused Electron packaging scripts from `package.json` once Tauri is working.

## 4. Replace Electron-specific APIs

1. Tauri does not expose Node.js APIs directly, so replace Node-based `fs` calls with Tauri commands.
2. In `web/app.js`:
   - Replace `ipcRenderer.invoke('load-contacts')` with `window.__TAURI__.invoke('load_contacts')`.
   - Replace `ipcRenderer.send('save-contacts', data)` with `window.__TAURI__.invoke('save_contacts', { contacts: data })`.
   - Replace CSV import/export IPC calls in the same manner (`import_csv`, `export_csv`).
3. Implement the matching Rust commands in `src-tauri/src/main.rs` using Tauri's filesystem APIs to read and write `contacts.json` and show file dialogs for CSV operations.
4. Update the zoom or window-resize events to use Tauri's window API (`tauri::Window`) if needed.

## 5. Adjust build configuration

1. Edit `tauri.conf.json` to set the app name, identifier, and window properties to mirror the Electron configuration.
2. Configure the output directory for the built assets (`../web`) so Tauri bundles the existing HTML/JS files without additional tooling.
3. Remove Electron-specific build tools (like `electron-builder`) from `package.json` and add Tauri build scripts:
   ```json
   "scripts": {
     "dev": "tauri dev",
     "build": "tauri build"
   }
   ```

## 6. Test locally

1. Run `npm run dev` (or `tauri dev`) to launch the application using the system webview.
2. Verify that contacts load, save, and CSV import/export continue to operate correctly.
3. Check that the window resizing and zoom controls behave as before.

## 7. Update packaging and CI

1. Use `tauri build` to create distributable binaries for Windows, macOS, and Linux. The resulting binaries will be significantly smaller than the Electron equivalents.
2. If mobile deployment is required, evaluate Tauri's experimental mobile targets or retain the existing Capacitor setup for iOS/Android builds using the same `web` directory.
3. Update any CI scripts or documentation to reference the new Tauri commands.

## 8. Clean up

1. Remove the `electron/` directory and `dist-electron/` output once Tauri-based builds are confirmed.
2. Delete unused Electron dependencies from `package.json` and run `npm install` to refresh `package-lock.json`.
3. Update `README_FULL.md` with new build and run instructions referencing Tauri.

Following these steps will migrate the project to Tauri without rewriting the existing front-end code, resulting in smaller binary sizes and a more lightweight runtime while preserving all current functionality.

