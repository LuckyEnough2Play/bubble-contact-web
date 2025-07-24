# Bubble Contact Web - MVP Document

## Overview

Bubble Contact Web is an Electron-based desktop application that manages a local address book. Contacts appear as interactive floating bubbles visualized using D3.js. The program stores contacts in a JSON file in the user's application data directory so it works entirely offline.

## Key Features

- **Bubble Visualization**
  - Each contact is represented as a bubble containing the contact's name.
  - Bubbles gently drift using a force simulation and avoid overlapping.
  - Lines connect contacts that share at least one tag.
  - Users can drag bubbles to reposition them temporarily.

- **Tag Based Filtering**
  - All tags from contacts are listed in a side panel. Clicking tags filters contacts.
  - Matching contacts move toward the center of concentric circles based on match level (all tags match vs. partial).
  - Active tags can be cleared with a dedicated button.

- **Contact Editing**
  - Clicking a bubble opens a sliding side panel form where contact information can be edited.
  - New contacts can be created using the "+" bubble fixed in the corner.
  - Fields include first name, last name, email, phone, address, title, company and free-form tags.
  - Company names are automatically added as a tag if not already present.
  - Changes persist to `contacts.json` immediately after saving.

- **Search and Zoom**
  - A search bar filters contacts by text across all fields and displays quick results in a dropdown.
  - A zoom slider and mouse wheel support zooming in and out of the bubble canvas.

- **Import/Export**
  - CSV import and export options are available through the menu and top buttons.
  - The CSV format uses Outlook style columns (First Name, Last Name, E-mail Address, etc.) so data can round-trip with other contact tools.

- **Theming**
  - On launch the page checks the system `prefers-color-scheme` to enable a dark or light mode.
  - Styles adjust automatically for the chosen theme.

## Usage

1. Install dependencies with `npm install` and start the app using `npm start`.
2. Bubbles will appear for contacts stored in `contacts.json`. If none exist a sample contact is generated.
3. Use the search box, tag filters, or drag to explore contacts. Click the + bubble to create a new entry or click an existing bubble to edit.
4. Use File > Import or Export to load or save a CSV file.

## Current Limitations

- Contacts cannot be deleted through the interface.
- There is no user authentication or encryption; all data is plain JSON on disk.
- The app currently targets Windows but should run anywhere Electron is supported.

## Intentions and Future Possibilities

The implementation lays groundwork for a playful contact manager focusing on visual exploration. Potential future enhancements include adding delete functionality, more detailed contact fields, keyboard shortcuts, packaging for distribution, and advanced layout options.
