# Comprehensive Plan for Contact Management “Bubble” Application

## Introduction

This plan outlines the creation of a **Windows-only** desktop contact management application with a unique “bubble” visualization interface. The application will run entirely **offline**, storing all data locally, and emphasize a playful, interactive UI. Key features include: an **animated bubble network** of contacts (with gentle drifting motion), **tag-based filtering** (visualized like a solar system of bubbles), a slide-out **contact detail panel** for viewing/editing contacts, **Outlook-compatible import/export**, and dynamic theming (auto-adjusting to Windows light/dark mode). We focus on a **Minimal Viable Product (MVP)** that meets all requirements, with future enhancements noted for later consideration. This plan covers requirements analysis, technology stack selection, system design (data storage, UI/UX design, and feature logic), implementation steps, and testing strategy – providing all details from start to finish for Codex to follow.

## Requirements Overview

Below is a structured summary of the requirements (points 1–34) grouped by category:

* **Platform & Performance:**

  * **Desktop Only & Offline:** Must run as a standalone desktop app on Windows (no web server or internet required), with all data stored locally (Req. 1, 3).
  * **Windows Integration:** Only needs to support Windows OS, and it should **auto-detect the system’s theme** (light or dark) to adapt the UI accordingly (Req. 4). We’ll also allow manual theme selection from a few presets (Req. 17).
  * **Performance & Scale:** Support small (10–20 contacts) up to large (hundreds of contacts) datasets. The bubble visualization should adapt to the number of contacts by scaling bubble sizes and ensuring all bubbles fit on screen without overwhelming the interface (Req. 15). Use efficient rendering (possibly via a canvas/WebGL or optimized UI components) so even a few hundred floating bubbles perform smoothly.

* **Data Management:**

  * **Outlook-Compatible Storage:** Use a data storage format that mimics Outlook contacts for easy import/export (Req. 2, 22). The application should import contacts (e.g. from Outlook’s CSV format) and export back to a similar format so the user can round-trip their data with Outlook. We’ll include standard contact fields (name, email, phone, etc.) consistent with Outlook CSV headers.
  * **Local Storage Only:** All contact data resides locally (no cloud sync or server). We will store contacts in a local file (or lightweight database) on disk. No automated backups are required in MVP (Req. 24), so the user should manually export data for backup when needed.
  * **No Security Layer:** The MVP will not implement encryption or user authentication (Req. 25). The data file will be plain (for example, a CSV or JSON), assuming a trusted single-user environment. (Future versions might add security if needed.)
  * **Duplicate Handling on Import:** When importing, detect if a contact likely duplicates an existing one (e.g. matching email or name). If duplicates are found, prompt the user to resolve conflicts individually – such as skip, merge, or keep both (Req. 23). This ensures no silent overwrites or duplicate entries without user awareness.

* **Contact Fields & Customization:**

  * **Standard Fields:** Each contact will have common fields similar to Outlook contacts for compatibility – e.g. Title, First Name, Last Name, Company, Job Title, Email(s), Phone number(s), Address, Birthday, Notes, etc.. We will decide a subset of essential fields for MVP (perhaps name, company, email, phone, address, notes), and can include others as needed.
  * **Custom Fields per Contact:** Users can add **additional fields** on a per-contact basis (Req. 5). For example, a user might add a field “Favorite Color” or “Nickname” to one contact. The UI will allow adding a new field name and value in the contact’s detail panel. These custom fields are stored with that contact. (Internally, we might store custom fields as key-value pairs attached to the contact entry.) There is **no validation** of field values (Req. 7); any text is allowed, giving users flexibility (e.g. they can enter phone numbers in any format, etc.).
  * **Tags (Categories):** Contacts can be labeled with **tags** (keywords) for organization. Tags are free-form and **non-hierarchical** (Req. 9). They behave like Outlook “Categories” in concept. Users can assign multiple tags to a contact (e.g. “Family”, “Work”, “VIP”). Tags will be used for filtering and visual grouping. We will also implement an **automatic tag suggestion** feature for company domains (Req. 8): if multiple contacts share the same email domain (e.g. `@company.com`), the app can suggest creating a tag for that company and tagging those contacts. This helps create broader groupings easily. (The suggestion would pop up once it detects, for instance, 3 contacts with @example.com but no “Example” tag yet, asking the user if they want to tag them with “Example Corp” or similar.)

* **User Interface (UI) & Visualization:**

  * **Main View – Bubble Network:** The primary interface is a **bubble visualization** where each contact is represented as a circular bubble. The bubbles are arranged in a free-flowing network (like planets in space or molecules in a fluid). Key characteristics (Req. 10, 11, 15, 16, 19, 20):

    * **Appearance:** Bubbles should look playful – akin to *clear colored marbles with color accents* (Req. 19). We’ll use a design with semi-transparent circles (to mimic glassy marbles) and a colored outline or glow as an accent. Each contact’s bubble could have a base color (possibly derived from its tags or a consistent palette). For visual clarity, ensure good contrast: bright colors on a darker background (or vice versa) so bubbles and text don’t blend together (Req. 16).
    * **Labeling:** Each bubble will display the contact’s name or initials. We may show the full name inside the bubble or as a label beneath it for identification. On hover, a tooltip can show the full name (and maybe primary info like company or email). This ensures users can identify contacts in the visualization easily.
    * **Dynamic Sizing:** Bubbles resize based on the total number of contacts to optimally fill the space (Req. 15). If there are very few contacts, we cap the bubble size so they don’t become ridiculously large (e.g. no larger than \~ a quarter of the screen width, perhaps akin to a real coin size). As more contacts are added, each bubble’s radius shrinks to accommodate all bubbles in view without overlap. We’ll define a maximum bubble diameter (for example, \~100px) and a minimum (perhaps 20px) and use a scaling function to interpolate sizes based on count. All bubbles will remain visible on the canvas without needing to scroll.
    * **Physics and Motion:** The bubbles will gently **drift** in place when idle (Req. 11). This will be achieved with a force-directed layout or similar physics simulation where bubbles have a small repulsion force (to avoid overlap) and are constrained within regions. The movement should be subtle – just enough to convey that the interface is alive. Bubbles should not drift too far from their designated area (so the grouping by filters remains apparent). We’ll ensure they **stay within their zone** (using invisible boundaries or restoring forces).
    * **Grouping by Filters (Solar System Layout):** When the user applies tag filters, the bubbles rearrange to reflect filtering results (Req. 10). The interface metaphor is a “solar system”:

      * Contacts that **match all selected tags** (fulfilling the AND logic) will gravitate to the center area – these are the primary focus.
      * Contacts that match **some but not all** of the selected tags (OR logic matches) orbit around the outside of the core group. They are secondary results – relevant but not complete matches.
      * Contacts that **have none** of the selected tags move to the far periphery (outermost orbit) or are deemphasized. They are the least relevant to the filter.
        We will implement this by dividing contacts into groups based on filter criteria and using positional forces or radial placement to cluster them: e.g. full matches within an inner circle, partial matches in an outer ring, others at the outer edges. This creates a concentric layout resembling planets around a sun (the filtered ones being the “sun” cluster). We will also use color accents to highlight this: perhaps **green/gold tint for AND matches**, **blue/purple for OR matches**, and **red/orange for contacts that do not match** (Req. 20). For instance, if the user filters by tags “Client” and “USA”, contacts that have both tags could glow green (indicating full match), contacts that have either tag (Client *or* USA) might glow blue, and those with neither tag could have a subtle red tint to show they fall outside the filter. This color-coding provides instant visual feedback of filtering.
    * **Single Contact Focus Mode:** If a user focuses on a single contact (Req. 12), the visualization will re-filter around that contact’s tags. In practice, this could happen if the user clicks a “focus” button on a contact’s detail or perhaps double-clicks the contact’s bubble. The effect is that the chosen contact becomes the center of a new “solar system”: all tags that contact has are treated as the filter criteria. Thus, other contacts will rearrange such that those sharing **all** of these tags come to the center (likely including the focused contact itself), those sharing some tags stay in an orbit around, and those sharing none move outward. This helps the user visually explore relationships (e.g. see others who work at the same company or share a tag with the focused contact). It’s essentially a shortcut to apply that contact’s tags as a filter. Exiting focus mode will return to the previous view (or no filter view).
    * **Bubble Interaction:** Users can **interact with the bubbles** in intuitive ways. Key interactions include:

      * **Click on a Bubble:** opens the contact’s detail side panel (see below) to view or edit information. The clicked bubble could also be highlighted (e.g. a slight enlargement or halo) to indicate selection.
      * **Hover on a Bubble:** show a tooltip or preview with the contact’s name (if not already labeled) and possibly key fields like email/phone.
      * **Drag and Move:** (Optional nice-to-have) The user might be allowed to click-drag a bubble to reposition it temporarily. In a force layout, dragging a node often “pins” it to the dragged location; once released, it might either stay pinned or slowly drift back. We could allow dragging for fun, with bubbles gently springing back to their zone to maintain the overall layout. This would enhance the playful feel.
      * **Plus “+” Bubble:** A special fixed-position bubble (likely in a corner, as per Req. 14) labeled “+” will always be on screen for adding new contacts. This bubble will be static (not part of the drift simulation) and distinctly styled (perhaps a different color or an icon) so users can easily find it to add a contact.
  * **Side Panel – Contact Details:** When a contact is selected (e.g. by clicking its bubble or via the list/search), a **side panel** slides in from the side of the window (likely right side) showing all contact details (Req. 6). This panel contains:

    * All the standard fields (with labels and values). These should be editable text fields (since there’s no separate edit mode – for simplicity, we can allow in-place editing whenever the detail panel is open).
    * Any custom fields for that contact, listed similarly. Possibly group custom fields under a section.
    * An “Add Field” button or link that lets the user add a new custom field (which would prompt for the field name and then allow entering a value).
    * Tags for the contact: displayed as chips or a comma-separated list. The user can add or remove tags here (e.g. typing a new tag name or selecting from existing tags, and removing via an “x”).
    * Maybe a delete button to remove the contact, and possibly a “focus” or “filter by this contact” button (to trigger the single contact focus mode described).
    * The side panel should match the overall theme (light/dark) and use a simple form-like layout. It opens overlaying the main view (but we ensure it doesn’t completely hide all bubbles – perhaps resizing or overlay semi-transparently). Smooth animation (slide-in/out) should be used (Req. 21). Clicking outside the panel or a close \[X] button will dismiss it.
  * **Search and List View:** In addition to the visual bubble view, a **traditional search and list** interface is available (Req. 30, 31).

    * **Search Bar:** A search input (likely at the top toolbar) allows the user to find contacts by typing text. As the user types, we filter the contacts (in real-time if possible). Matching contacts’ bubbles could be highlighted or isolated (and non-matching could fade out or be temporarily hidden). Also, in list view, it would filter the list results. The search should consider name, email, company, and perhaps all fields text for matches.
    * **List View Toggle:** The user can switch to a more conventional list/table view of contacts (e.g. via a toggle button “List <-> Bubble View”). In list view, contacts are shown in a scrollable list with sortable columns (like Name, Email, Company, etc.). The list view can support filtering by tags as well (e.g. maybe a dropdown to filter by one tag or a column showing tags). This provides an accessible alternative to the bubble view, useful for quickly scanning details or performing bulk actions. (The bubble view is primary, but list view is a useful backup especially for accessibility or if the user needs to precisely select items.)
    * Sorting/Grouping in List: The list could allow sorting by name or grouping by a field (though grouping is not explicitly required, we might include grouping by tag or company as a feature later). For MVP, basic sorting (A–Z by name) is sufficient since the bubble view is the main interface.

* **Visual Design & Theming:**

  * **Playful Bright Aesthetic:** Overall design uses bright, vibrant colors for bubbles and highlights, set against a contrasting background (light or dark depending on theme) so that UI elements are distinct (Req. 16). The style should feel *playful and modern*, in line with the concept of bouncing bubbles.
  * **Dynamic Theming:** The app will **follow the Windows theme** by default – if the user’s OS is in dark mode, the app will use a dark background and appropriate light text/colors; if light mode, the opposite. Many modern UI frameworks or libraries can detect system theme automatically. In our chosen tech stack, we will use either an API or a CSS media query (`prefers-color-scheme`) to apply the matching theme. Additionally, we’ll provide a settings option to switch themes manually or choose from preset color themes (Req. 17). For MVP, we can include a couple of presets (e.g. a default dark theme, a light theme, maybe a playful “blue” theme) that the user can optionally select, and an “auto” setting that uses the OS theme.
  * **Background Customization:** We will keep background customization minimal in the first version (Req. 18). Possibly just use a solid or gradient background provided by the theme. We won’t implement custom background images or complex personalization in MVP. (This can be expanded later if needed, e.g. allowing the user to pick a background color or image).
  * **Animations & Transitions:** To ensure a smooth, polished experience, include subtle animations for state changes (Req. 21). Examples: bubble positions animate when filters change (rather than teleporting, they should glide to new positions over, say, 0.5 seconds, preserving the user’s mental map). The contact detail side panel slides in/out. New bubbles fade/grow into view when added. Filtering highlight (color changes) can fade in smoothly. Idle bubble drift as mentioned provides continuous motion. None of these should be overly flashy or slow down usage, but a consistent use of easing and motion will make the app feel refined.

* **Out-of-Scope for MVP:**

  * **Notifications:** Not included (Req. 32). The app won’t have reminder notifications or alerts (like birthdays, etc.) in this version.
  * **Advanced Security and Backup:** as noted, no encryption or cloud backup in MVP (Req. 24, 25). The user will rely on manual export for backup.
  * **Extensive Accessibility Features:** While we will aim for decent contrast and provide an alternate list view (which aids screen readers or keyboard navigation), a full accessibility review is not explicitly in scope (Req. 33). In future, we’d consider features like keyboard-only operation (e.g. tab through contacts, open detail with Enter), screen reader labels for UI elements (e.g. accessible text for bubbles), high-contrast mode compliance, etc., to improve accessibility.

* **Development Constraints:**

  * **Tooling:** The user will use VS Code for editing and plan to use OpenAI Codex (or a code generation assistant) to implement the project (Req. 26, 27). This suggests choosing technologies that Codex can handle well and that fit within VS Code.
  * **Testing:** The expectation is that Codex (the AI) will also generate tests and ensure the code works, but the user will manually build and test the program as well (Req. 34). So, part of the plan should include testing steps and perhaps even automated tests for critical parts (like import/export functionality, filtering logic). We’ll aim to incorporate basic test cases or at least instructions for the developer to verify each feature as we implement.

## Technology Stack Selection

To satisfy the above requirements and provide a smooth development process, we need to choose an appropriate technology stack for a **Windows desktop GUI application** with rich graphics:

* **Option 1: Native Windows (C# .NET, WPF/WinUI):** Using a native framework like **WPF** or **WinUI 3** with C# would give us direct Windows integration. WinUI 3 in particular can auto-adapt to system light/dark theme and provides modern controls. C# is powerful for handling data and UI, and Visual Studio or VS Code can be used. However, implementing the custom bubble visualization and physics might be complex from scratch (we might need to use XAML `Canvas` with animation or a third-party library). The user has “no knowledge of best frameworks,” which suggests a steep learning curve for WPF/XAML if using Codex to generate it (though Codex can write C#, our UI is unconventional).

* **Option 2: Web Technology (HTML/CSS/JavaScript) in a Desktop Container:** This approach uses web tech for the UI (which is well-suited for dynamic graphics and animations) and packages it as a desktop app. **Electron** is a popular choice here, allowing us to build the app with JavaScript/HTML/CSS and distribute it for Windows. Electron apps run on Windows natively, and we can leverage countless JavaScript libraries for visualization and UI. Given the bubble interface is reminiscent of web visualizations (force-directed graphs, D3.js, etc.), using a web stack could speed up development. The app will still be offline – Electron just loads local files, and data can be stored locally (via filesystem or browser storage). Node.js integration means we can easily handle file I/O for import/export. The downside is Electron apps can be heavy, but for an MVP and a few hundred contacts, performance is manageable. VS Code is actually built with Electron, and many developers are comfortable with web tech. Codex also has strong support for generating HTML/CSS/JS code.

* **Option 3: Python with GUI toolkit:** For example, PyQt or Kivy could be used to build a desktop app with Python. Python is easy to work with and Codex can generate code for it reasonably. PyQt has robust widgets and can draw custom graphics (using QGraphicsScene for example) for the bubble view. However, setting up PyQt might be tricky, and packaging a Python app on Windows is another layer of complexity. Kivy is geared towards graphics and could handle the bubble animation, but it’s less standard. Considering Outlook CSV compatibility, Python’s CSV libraries are fine, but overall this might introduce more complexity than needed for the user.

Given these options, **we recommend Option 2: using web technologies (HTML/CSS/JS) packaged with Electron**. This choice aligns with the requirement for a Windows desktop app (Electron will give us an executable for Windows), and it excels in dynamic visualization. We can leverage **D3.js or a similar library** for the force-directed bubble layout and animations, and standard HTML forms for the side panel and list view. Electron also allows easy file access for reading/writing CSV files using Node’s filesystem API. Using CSS, we can easily implement theme switching (via media queries or the Electron `nativeTheme` API) to respect the Windows theme. The user’s familiarity with VS Code suits this approach, as they can run/test the Electron app easily from VS Code.

We’ll thus proceed with **Electron + HTML/CSS/JS**:

* **Main Process:** Electron’s main process will create a BrowserWindow for the app UI. It can handle OS integration (like detecting system theme via `nativeTheme` or listening for file open dialogs).
* **Renderer (Frontend):** a single-page web application built with plain JS or a lightweight framework. We could use a framework (React, Vue, etc.), but given the dynamic nature and for simplicity, we might do without heavy frameworks. D3.js (for the bubble network) can be used in vanilla JS. We can organize the code into modules (e.g. a module for contact data management, one for rendering the bubbles, one for handling UI interactions).
* **Libraries:**

  * **D3.js** for force simulations – it provides a `d3-force` module that can simulate physical forces (charge repulsion, center gravity, collision detection). We can represent contacts as nodes and possibly use **forceRadial** to constrain different groups at different radii for the solar system effect.
  * Alternatively, **canvas-based** library like [fabric.js](http://fabricjs.com/) or even a game engine (but that’s overkill). D3 is well-suited and can work with SVG or Canvas. SVG might be acceptable for a few hundred nodes; if performance lags, we can move to Canvas.
  * **CSV parsing**: use a JS library or Node’s built-in capabilities (Node has no built-in CSV parser, but we can quickly implement parsing since Outlook CSV is standard). We might use a library like PapaParse for robust CSV handling, or simply handle via string split if format is simple.
  * **File Storage**: We can store the contact list in a JSON file (for internal persistence between runs) and use CSV only for import/export. Alternatively, use a lightweight database like SQLite or NeDB. But simplest: maintain a JSON (or even a CSV) in the user’s app directory. JSON is easy for custom fields (since we can store an object per contact with varying keys). We’ll implement functions to save the JSON file whenever data changes (auto-save) and load it on startup.
  * **UI Components**: Basic HTML for forms (side panel, list view) styled with CSS (maybe using a CSS framework like Bootstrap or Tailwind for quick styling of forms and layout). However, a full CSS framework might not be needed; we can custom-style to achieve the bright marble aesthetic.

**Why Electron:** It provides a familiar environment and flexibility. The **Electron website** highlights that it lets us use web tech to build cross-platform desktop apps, which suits our need to run on Windows and leverage web libraries. Since our user is using Codex to generate code, the copilot will likely produce good results in HTML/CSS/JS and Node.

**Note:** The final distributed application will be an Electron app. For development, we’ll test in the Electron environment. Packaging (creating an installer or exe) can be done with Electron Forge or Builder, but that can be considered at the end (MVP can be run via `npm start` for testing).

## Data Model and Storage Design

We will design a data model that balances **Outlook compatibility** with flexibility for custom fields and tags:

* **Contact Data Structure:**
  Internally, represent each contact as an object/dictionary with key-value pairs for fields. For example (in JSON-like notation):

  ```json
  {
    "id": "uuid-1234", 
    "firstName": "John",
    "lastName": "Doe",
    "company": "Example Corp",
    "jobTitle": "Manager",
    "email": "john.doe@example.com",
    "phone": "555-1234",
    "address": "123 Main St, City",
    "tags": ["Client", "Example Corp"],
    "customFields": {
       "Favorite Color": "Blue"
    },
    "notes": "Met at conference 2021"
  }
  ```

  We include an `id` (could be a GUID or unique string) for internal reference, especially useful if names are not unique. Standard fields like name, company, etc. are direct properties. **Tags** are stored as an array of strings. **CustomFields** can be a sub-object mapping field name -> value (as shown above). This allows each contact to have any number of custom fields without forcing columns for all contacts.
  (If we were to use a relational DB or CSV for internal storage, custom fields are tricky. JSON storage is simpler here.)
  We will keep the list of contacts as an array of such objects in memory.

* **Primary Storage File:**
  We will maintain a **contacts JSON file** in the user’s local application data (or in the app folder for simplicity). For example, `contacts.json` could reside alongside the app’s executable or in `%APPDATA%/BubbleContacts/contacts.json`. This file is read at startup to load all contacts into memory. As the user makes changes (adds/edits/deletes contacts), we update the in-memory data and periodically (or on each change) write out to the JSON file to persist. This way, data is saved locally between sessions.
  *Rationale:* JSON is human-readable and easy for Codex to manipulate, and it supports our flexible schema (custom fields). The size (hundreds of contacts) is small, so performance is fine. No need for a heavy DB. We will not implement versioning or backup, so this single file is the source of truth (the user can export CSV as needed for backup).

* **Import from Outlook CSV:**
  Outlook can export contacts to CSV with specific columns. Our app will provide an “Import CSV” option (likely via a menu or an import button). When triggered, it will open a file chooser (using Electron’s dialog). We then parse the selected CSV file. Key points:

  * We must handle the header row to map columns. Common columns include “First Name”, “Last Name”, “Email Address”, “Business Phone”, “Mobile Phone”, “Company”, “Job Title”, “Address” etc. We’ll map these to our internal fields. (If a CSV header is not recognized, we might ignore that column or treat it as a custom field if it’s unknown to Outlook).
  * Outlook CSV “Categories” column can contain multiple categories (tags) separated by semicolons. We will parse that into our `tags` array if present. This allows tags to round-trip (e.g. a contact categorized in Outlook can carry over).
  * If the CSV contains columns beyond our standard set (for example, “User 1” which Outlook uses for a custom field), we can import those as customFields.
  * After parsing each row into our contact object format, we must check for duplicates. We define a duplicate perhaps as same email (if email exists in both) or same name + company. The safest unique identifier is email address, as typically one email = one person. We’ll implement duplicate detection as: if an incoming contact’s email (non-empty) matches an existing contact’s email, we flag it as potential duplicate. If email is empty or same person has multiple emails, we could also use name matching as secondary (though name matches can be coincidental).
  * For each conflict, prompt the user (maybe in a dialog listing the two entries side by side) to choose: Skip importing this contact, Overwrite existing with imported, or Keep both (perhaps renaming one or adding a suffix). Codex can generate a simple dialog for this or we can handle in the list (but interactive resolution is ideal).
  * Finally, add all new/merged contacts to our data and update the UI (bubbles and list).

* **Export to Outlook CSV:**
  Conversely, we’ll have an “Export to CSV” feature. This will take our contact list and produce a CSV file that Outlook can import. To **mimic Outlook’s format** (Req. 22), we should include the standard headers in the CSV (in the correct language – likely English for us). For example, headers like: First Name, Last Name, Company, Job Title, E-mail Address, Business Phone, Home Phone, Address, Birthday, Notes, Categories, etc.. We fill these columns from our data.

  * Custom fields: Outlook CSV has four generic custom columns “User 1” … “User 4”. If a contact has custom fields, we might map up to four of them to these if we want to preserve some custom data. However, since the user can have arbitrary custom fields, not all can map. In MVP, we might choose not to export custom fields (they would be skipped or maybe appended in the Notes field for reference). We should document that limitation to the user.
  * Tags: We will output our contact’s tags list into the “Categories” column, separated by semicolons (since Outlook’s Categories field supports multiple categories in a single field separated by semi-colon). This way, if the user re-imports the CSV to Outlook, those tags become Outlook categories. Similarly, if they import an Outlook CSV that has categories, we parse them into our tags.
  * The export function will prompt for a save location, then create the CSV with proper encoding (Outlook expects UTF-8 or ANSI depending on locale; we’ll use UTF-8 with a BOM to be safe). After export, the user can import that CSV in Outlook manually.

* **Memory Management:**
  The entire contact list will be loaded in memory (since at most a few hundred or even a thousand contacts, this is trivial for a modern PC). All operations (search, filter, etc.) happen in memory on this list. This gives quick interactivity. We only touch disk on explicit import/export or on saving the JSON periodically.

* **Data Update Flow:**
  When the user adds a new contact (via the “+” bubble and side panel form) or edits an existing contact, those changes reflect immediately in the UI (new bubble appears or bubble’s label updates). We will also call a save routine to update the JSON file on disk. Possibly, we debounce the saves (e.g. wait for a few seconds of inactivity or perform bulk save on application close) to avoid too frequent disk writes. But a straightforward approach is fine given small data sizes.
  Deletion of a contact will remove its bubble and entry, and then save the file as well.

## Application UI/UX Design Details

In this section, we detail how we will implement the UI components and their interactions using our chosen tech (Electron + HTML/CSS/JS):

* **Main Window Layout:**
  We will create a single main window (using `BrowserWindow` in Electron) that is frameless or standard (we can keep standard window frame for simplicity, allowing minimize/close). The content area will be divided conceptually into:

  1. **Top Bar / Controls:** a header area with application title, the search bar, and icons/buttons for toggling list view, opening import/export dialogs, and maybe a settings menu for theme selection. This can be a simple HTML `<div>` at the top with styling.
  2. **Main Content Area:** the majority of the window will be the bubble visualization canvas. We might use an `<svg>` or `<canvas>` element absolutely positioned to fill the area. Over this, the “+” bubble (new contact) can be an HTML element or part of the canvas with a fixed position (e.g. bottom-right corner). If implementing with D3 in SVG, each contact bubble could be an `<circle>` with a text label. If using canvas, we draw circles and handle events differently (we might stick with SVG initially for easier development – D3’s force layout can output SVG circles easily, and SVG allows CSS styling and DOM event handling on each bubble). Given up to a few hundred elements, SVG is acceptable.
  3. **Side Panel:** a collapsible panel (initially hidden) that overlays on one side (right side) for contact details. We can implement this as a `<div id="side-panel">` that is hidden (off-screen to the right) by default, and when activated (open) it slides in (we can use CSS transition for transform property). It will have a close button.

  The layout can be achieved with CSS flex or grid: for instance, a container div that holds the side panel and main area. When the side panel is open, it could push the main area slightly or overlay it – depending on design choice. Perhaps overlay is simpler: main area doesn’t resize, side panel just sits on top with some transparency or a shadow.

* **Bubble Network Implementation:**
  We will use **D3.js force simulation** for positioning the bubbles. The approach:

  * Represent each contact as a node in the simulation. We won’t have explicit links (like a graph) since contacts aren’t directly connected; instead, we use forces to position them.
  * Forces to use: **collision force** (to prevent overlap of bubbles), **center force** (to keep the whole mass centered in the view), and custom positioning forces for grouping. For grouping by filter results, we have a few strategies:

    * Use **forceRadial**: D3’s `forceRadial(radius, x, y)` can pull nodes toward a circle of a given radius centered at (x,y). We can assign different radii for different groups of nodes. For example, if the view radius (half the width) is R, we could set: full-match contacts: forceRadial(R \* 0.3, center) – pulls them to within 30% of radius (the core); partial-match: forceRadial(R \* 0.6) – they orbit further out; non-match: forceRadial(R \* 0.9) near the edges. These radii might be adjusted based on number of nodes in each group to avoid collisions. Alternatively, we run separate simulations for each group in different concentric regions, but simpler is one simulation with a radial categorization.
    * We’ll dynamically adjust these forces whenever the filter criteria changes. D3 simulation supports changing forces on the fly. So when filter tags are selected, we tag each node with a category (0 = none match, 1 = partial, 2 = full match) and set each node’s target radius accordingly. Then restart the simulation briefly so nodes interpolate to new positions. We’ll allow the simulation to run until it stabilizes (or simply keep it running in low-intensity mode for continuous motion).
    * Idle drift: We can leave a tiny residual force (like a very slight random “jitter” force or low intensity force that never fully settles) so that even at equilibrium, there’s a bit of movement. Alternatively, periodically “tick” the simulation with a minor random nudge to each node’s position. This achieves the gentle drift effect.
    * The **collision force** radius will be each bubble’s radius + a small padding, to ensure bubbles don’t overlap.
  * Rendering: If using SVG, each contact is an `<g>` (group) containing a `<circle>` and a `<text>` for the label. The circle’s radius can be proportional to something (e.g. maybe we give slightly larger bubbles for contacts with more tags or simply make all equal size for fairness). Possibly, we could size bubbles by some metric (like how many tags or how often contacted, etc.), but that’s beyond current requirements. MVP likely uniform size (or size by length of name if needed to fit text). We’ll set a max radius and min radius as earlier, possibly adjusting by count.
  * The D3 simulation runs in the background and updates node positions (`x`, `y`). We use D3 to bind the data (our contact list) to the SVG elements, and on each tick of the simulation, we update the `cx`, `cy` of circles (and corresponding text positions). D3 handles the loop efficiently.
  * Colors: Each bubble (circle) will have a base color. We might assign colors by tag or category. For instance, we can have a default color (light blue) for all bubbles when no filter is active. When filter is active, override the stroke or fill color to indicate match level (green/gold for AND, blue/purple for OR, red/orange for none, as discussed in Req. 20). Another idea: use distinct colors per tag category (like all “Work” tag contacts are blue, “Family” red, etc.), but that could conflict with filter highlighting. Better to keep filter highlighting as the primary color logic when filters are on. When no filter, perhaps random or tag-based colors could be used for variety. We’ll need to ensure any text label on bubbles has sufficient contrast (e.g. if bubble fill is bright, use black text, if dark fill, use white text).
  * Interaction implementation:

    * **Click**: We add an event listener to each bubble `<circle>` (or the group) for click events. On click, we retrieve that contact’s data (we have it bound in D3), and call a function to open the side panel with that contact’s info. Also possibly highlight the bubble (we can give it an outline or drop shadow to show it’s selected).
    * **Hover**: We can use the HTML title attribute or a custom tooltip `<div>` that follows the mouse. A simple approach is to set the SVG `<title>` element within the group, which most browsers will show as tooltip with the text content (like “John Doe – 555-1234”). Alternatively, for richer tooltip, handle `onmouseover` to display a floating `<div>` with contact info and `onmouseout` to hide it.
    * **Drag**: D3 has a drag behavior integration for simulation. We can enable `d3.drag` on the nodes which on start will alphaTarget on the simulation and on drag events set the node’s `fx, fy` (fixed positions) to the mouse coordinates, thereby dragging it, and on end maybe release (set `fx,fy` null so simulation can reposition it). This gives the user the ability to tug bubbles around. It’s optional, but including it would enhance the dynamic feel.

* **Side Panel (Contact Detail) Implementation:**
  The side panel is essentially a form. We will generate its content based on the selected contact. Likely structure:

  ```html
  <div id="side-panel">
    <button id="close-btn">X</button>
    <h2>Contact Details</h2>
    <div class="field"><label>First Name:</label> <input id="firstName" value="John"></div>
    <div class="field"><label>Last Name:</label> <input id="lastName" value="Doe"></div>
    ... (other standard fields)
    <div class="field"><label>Tags:</label> <input id="tags" value="Client; Example Corp"></div>
    <div id="custom-fields">
        <h3>Additional Fields</h3>
        <div class="field"><label>Favorite Color:</label> <input data-key="Favorite Color" value="Blue"></div>
        <!-- any other custom fields -->
        <button id="add-field-btn">+ Add Field</button>
    </div>
    <button id="delete-contact-btn">Delete Contact</button>
    <button id="focus-contact-btn">Focus</button>
  </div>
  ```

  We’ll populate this form when opening the panel. The **tags input** could be a simple text input where tags are semi-colon or comma separated. (For nicer UI, could be a tokenizing input, but MVP can do basic text input split by comma/semicolon on save.)
  The **Add Field** button will let the user add a new custom field row. When clicked, we can show a small dialog or prompt (“Enter new field name”), then add a new `<div class="field">` with that label and an empty input. This updates the contact’s `customFields` in memory as well.
  The side panel’s Save mechanism: We might auto-save changes as they are typed (on blur or on closing the panel). Or include an explicit “Save” button (not listed above but we could add at bottom “Save Changes”). Given “no validation” requirement, we don’t need to validate formats, but we should trim spaces, etc.
  If the user edits the name or tags and closes, we should reflect that in the bubble view (update the label text, recalc tags for filtering logic). So we will have an update routine: e.g. after saving, update the D3 data for that node and maybe re-run simulation if tags changed grouping. This dynamic update is important to keep consistency.
  The **Delete** button triggers deletion of the contact: remove from data list and remove bubble (we can fade it out then remove element or just remove immediately). We’ll then close the side panel and save data.
  The **Focus** button (if implemented) will call the filtering function using this contact’s tags (as explained earlier in Single Contact Focus). It will likely also close the side panel (or maybe keep it open but it might be confusing if it stays – probably close it so the user can see the bubble rearrangement).

* **Search Bar:**
  At the top, a search input (`<input type="text" placeholder="Search contacts...">`). We attach `oninput` event to filter the contacts. Implementation: as user types, we take the query (case-insensitive) and filter the contact list for any that have the query substring in name, email, company, or tags. Two ways to reflect results:

  1. **In Bubble View:** We could highlight matching bubbles (e.g. give unmatched bubbles a semi-transparent or gray-out appearance, and highlight matches normally). Or we could temporarily show only matches (hiding others) – but that could disrupt the layout significantly. Perhaps highlighting is better: non-matches could shrink or fade, while matches maybe glow or bounce slightly to attract attention. We will choose a simple method like adjusting opacity of non-matches to 0.2 while search is active. This way all bubbles remain (maintaining layout), but it’s clear which ones match.
  2. **In List View:** If the list view is open, we filter the list items to those matching.
     The search can operate concurrently with tag filters. For example, if tags are selected and the user also types a search term, we combine them (e.g. filter by tags first, then within that filter by search text). Or simply apply search across all and ignore tag filter? Better to combine logically (AND): meaning the user is narrowing down further. We should clarify this to the user via UI (maybe an indicator of active filters).
     Clearing the search (empty box) will restore all bubbles to normal opacity.
     Search should update live as typed; if performance is an issue with many contacts, we can add a small debounce (like 300ms after typing stops).

* **List View:**
  The list view can be a simple `<table>` or a scrollable `<div>` of contact entries. We might design it as a panel that replaces the bubble canvas when activated (or maybe slides in). But simpler is a toggle: if user clicks “List view” button, hide the bubble SVG and show a table of contacts. The table columns: e.g. Name, Email, Company, Tags. Possibly also Phone. We can allow sorting by clicking headers (just sort the array and re-render table). Filtering by tags and search should also apply here: we simply only list contacts that match the current filter criteria (the same subset as shown in bubble view). We’ll ensure the UI indicates that (for example, if tag filters are on, maybe show a sentence “Filtering by \[Tag1, Tag2] – X contacts shown”).
  Each row can have an “Edit” or clickable name to open the side panel too. So list view still connects to detail panel.
  The user can toggle back to Bubble view with the same button (which might say “Visualization view” when in list mode).

* **Theme Application:**
  We will define CSS for light and dark themes (and any other presets). Using Electron’s ability, we will detect system theme on startup: Electron’s `nativeTheme.shouldUseDarkColors` can tell us, or simply use a CSS media query `prefers-color-scheme: dark` in our stylesheet to automatically switch colors. For example, we can have:

  ```css
  body.light {
    --bg-color: #f0f0f0;
    --text-color: #000;
    --bubble-color: rgba(100,150,250,0.7); /* sample */
    ...
  }
  body.dark {
    --bg-color: #121212;
    --text-color: #fff;
    --bubble-color: rgba(100,150,250,0.7);
    ...
  }
  ```

  Then in JS, if system is dark, add class `dark` to body, else `light`. Or use the media query approach:

  ```css
  @media (prefers-color-scheme: dark) {
    body { background: #121212; color: #fff; }
    /* etc... */
  }
  ```

  We will also add a small UI in settings to choose theme: perhaps a gear icon that opens a dropdown with choices “System Default / Light / Dark / Theme X”. Choosing one will override (we can add a class to body or toggle a flag that disables the media query influence). This is a bonus feature given Req.17.
  Ensuring the bubble colors and overall palette are chosen so that both light and dark backgrounds look good (e.g. bright bubble colors might need a dark outline on light mode and light outline on dark mode for contrast).

* **Ensuring Readability & Usability:**
  We keep paragraphs of text short in instructions and label things clearly (the UI copy should be clear – e.g. use “New Contact” as tooltip for the + bubble, etc.).
  Use icons where appropriate (for import/export maybe use 🡇 and 🡅 icons for import/export or a simple text “Import CSV”).
  Provide feedback on actions: e.g. after importing, show a message “Imported 50 contacts” or “3 duplicates found, resolve them.”; after export, “Export successful.” We can do this via small toast messages or an alert.

## Implementation Plan (Step-by-Step)

We will implement the application in logical stages, verifying each part as we go. Below is a proposed sequence of development steps:

1. **Project Setup:**

   * Initialize an Electron project (set up `package.json`, main process script, and an HTML file for the renderer). Install necessary dependencies: Electron, D3.js (can be included via `<script>` from CDN or npm), and perhaps a CSV parse library (optional).
   * Create a basic Electron **main** script that creates a BrowserWindow pointing to our `index.html`. Enable Node integration in the renderer if we want to use `fs` directly in the page (or use IPC to call main for file operations). For simplicity, we might allow Node in renderer for direct file access (but note security considerations; since offline app, it’s okay).
   * Run the app to ensure the window opens and we can load our HTML/CSS.

2. **Design Data Structures:**

   * Define a JavaScript class or functions for managing contacts. Perhaps create a `contacts.js` module that maintains the contact list array and provides methods: `loadContacts()`, `saveContacts()`, `importCSV(filePath)`, `exportCSV(filePath)`, `addContact(contact)`, `updateContact(id, data)`, `deleteContact(id)`. Initially, implement a simple in-memory list and JSON load/save using Node’s `fs`.
   * Decide where to store `contacts.json`. For now, could be in the project directory (for dev) or in user’s home directory. Use `path.join(app.getPath('userData'), 'contacts.json')` for a proper location in production.
   * Implement `loadContacts()` to read the JSON if exists, else start with an empty list. Implement `saveContacts()` to write JSON to disk. Test these by manually adding a dummy contact in code and calling save, then reload.

3. **Basic UI Framework:**

   * Build the **HTML structure** for main interface: a top bar with a search input and buttons, a main area (a div or svg container for bubbles), and a hidden side panel div. Add minimal CSS to position these (e.g. top bar fixed at top, main area fills rest, side panel offscreen).
   * Implement the **“Add Contact” (+ bubble)** as a simple fixed-position element for now (e.g. a button or div in bottom-right with a “+”). Clicking it should open the side panel in “new contact” mode (clear fields). For now, just console-log to ensure the event triggers.
   * Hook up the search input’s event to console-log the query (actual filtering logic will come later).
   * Create the List view section (maybe a `<div id="list-view" style="display:none">` with a basic table structure). Place a toggle button on the top bar for switching view; for now, just make it switch the visibility of bubble area vs list area.
   * At this stage, style the app to roughly match a theme (maybe start with light theme CSS). We’ll refine theming later, but ensure elements are identifiable.
   * Run the app to verify the static UI elements appear as expected and basic interactions (button clicks) work.

4. **Contact Detail Side Panel Functionality:**

   * Design the HTML form inside the side panel. Initially include fields: First Name, Last Name, Email, Phone, Company, Tags, Notes (covering common fields). Also include the Add Field button and a container for custom fields.
   * Use JavaScript to populate this form when opening. Create a function `openContactDetail(contact)` that fills in the inputs with the contact’s data (or blank if new contact). Add event for the close button to hide the panel.
   * Implement adding a new contact: when user clicks the “+” bubble, open the side panel with empty fields. Provide a save mechanism: maybe in this mode, instead of auto-saving on each field, we have a “Save” button (or reuse the panel but need a way to confirm new contact creation). We could simply reuse the same panel and include a “Save” button at bottom for both new and edit modes. Alternatively, auto-save each field might complicate creation (as it would create a contact on first keystroke). So probably better: for new contact, require clicking “Save”.
   * Implement the Save for new contact: gather input values into a contact object, assign a new id (could use Date.now or a UUID generator), push to contact list, update UI (bubble list), and close panel. Also call saveContacts() to persist.
   * Implement Save for editing existing contact: We can auto-save each field on change (since no validation). For simplicity, consider adding a “Save” button for edits as well to commit changes in one go. If auto-saving, we must update bubble label live as name changes – which might be okay (seeing the bubble text change as you type). But this might cause layout shifts while typing; better to wait until done. Perhaps use onblur (lose focus) to commit each field. We can do: on input blur or on pressing Enter in a field, update the contact object and call functions to update visuals and save file. The Save button approach (explicit commit) might be easier conceptually for user and development. We can decide based on preference – maybe adding a Save button for now.
   * Implement Delete contact: when clicked, confirm (maybe a simple `confirm()` dialog “Are you sure?”), then remove from contact list, remove UI elements (or mark for removal and let next re-render handle it), save file, and close panel.
   * Test this by using the side panel to add a couple of contacts and seeing if they appear in the data and presumably (in a placeholder way) in the UI. At this stage, we haven’t done the bubble visual, but we can simulate by maybe listing them in console or adding a temporary list element to verify.

5. **Bubble Visualization Implementation with D3:**

   * Include D3 library. Set up the SVG element in the main area. Write a function `renderBubbles(contactList)` that binds data to SVG circles + labels. Each node can be represented by a circle (with radius r) and a text. We’ll initially position them randomly or in a circle.
   * Initialize a **force simulation**: use `d3.forceSimulation(data)` with forces: `forceCenter(width/2, height/2)` to center them, and `forceCollide(radius+padding)` to avoid overlap. Start with a simple repulsion (`forceManyBody(-30)`) to spread them out. Without filters, this will just distribute them somewhat evenly.
   * On simulation tick, select all circles and set their `cx, cy` attributes to the node’s x,y. Do same for text (set `x=node.x, y=node.y`).
   * Test this basic simulation with the contacts added from step 4. If you had added contacts, now call renderBubbles(contactList) and ensure some circles appear and float around (if everything is correct). You may need to set SVG width/height to fill the container.
   * Next, refine bubble **appearance**: style the circles with a fill (e.g. semi-transparent teal) and a stroke (maybe a brighter outline). Add CSS classes or set styles via D3. Position the text at center of circle and style it (white or black depending on fill). Possibly only show first name or initials to avoid long text overflow. We can do e.g. in render: if name too long, use first name only or first initial of last name. This can be improved later.
   * Implement bubble **enter/exit updates**: if contacts list changes (new or removed), ensure D3 enter/update/exit pattern or use D3 join so that adding a contact creates a new bubble. We should call `renderBubbles` (or a diff function) after any contact change. For deletion, remove the corresponding node from simulation and SVG. D3’s general update pattern will handle removed data if we define `.exit().remove()`.
   * Implement bubble **click and hover** interactions\*\*: using D3, add `.on("click", node => openContactDetail(node.datum))` for example, and `.append("title").text(d => d.firstName+" "+d.lastName)` to show basic tooltip. If we want a custom tooltip, implement with events and a tooltip div as earlier noted.
   * At this point, we have an unfiltered free-floating bubble layout. Test adding a new contact via UI: the new bubble should appear (we might need to reheat the simulation by alpha = 1 on adding). Test editing a name: ensure the label updates (we can simply re-run the render join or directly update the text of that node).

6. **Tag Filtering Logic:**

   * Create UI for selecting tags to filter. Possibly a dropdown or a side list of all tags. For MVP, a simple approach: when the user clicks on a tag name in a contact’s detail, it could trigger filtering by that tag. Or have a filter panel that lists all unique tags (which we can derive from contacts). Perhaps a multi-select checklist in a small sidebar on left or a floating panel. To keep things simple: We can show a **tag cloud or list** in a collapsible sidebar. Given tags could be numerous, maybe a scrollable list with checkboxes.
   * Implementation: maintain a list of all tags (update whenever contacts change). Put a button “Filter” on top bar that toggles a tag filter sidebar. That sidebar lists each tag with a checkbox. The user can select multiple. On selection change, call `applyFilters()`. Alternatively, allow filtering by typing tag names in search (but separate from general search text). To reduce complexity, use the sidebar approach.
   * The `applyFilters()` will do: read all checked tags into an array `activeFilters`. If none selected, clear filters (show all contacts normally). If filters exist, determine for each contact whether it matches fully, partially, or not:

     * Full match (AND): the contact’s tag list contains *all* active filter tags. (If filter tags array is \[A,B], then contact.tags must include A and B both.)
     * Partial match (OR): the contact has at least one of the filter tags, but not all (i.e. intersection is non-empty but not the full set).
     * None: contact has none of the filter tags.
   * Store this classification (maybe add a field on each node like `node.matchLevel = 2/1/0`).
   * Now update the D3 forces: for each contact node, set a target radius or position accordingly: e.g. if matchLevel=2, radial force to inner radius; 1 -> mid; 0 -> outer radius. We might implement separate radial force: D3 allows specifying a *function* for forceRadial’s radius, e.g. `.force("radial", d3.forceRadial(d => { return d.matchLevel===2 ? innerR : d.matchLevel===1 ? midR : outerR; }, centerX, centerY))`.
   * We also update bubble colors: change class or style per matchLevel (so that color accent changes). This can be done by setting a class like `node-full`, `node-partial`, `node-none` and define those in CSS (e.g. node-full outline: gold, node-partial outline: blue, node-none outline: gray). Or directly set style fill/stroke via D3 on update.
   * Restart the simulation (set alpha = 0.9) so that it repositions. Let it run until somewhat settled. The result should group the bubbles. We might want to adjust force strengths: e.g. use a slight center gravity so that even outer ones don’t fly off screen (keep everyone roughly around center). Possibly also reduce repulsion for outer vs inner differently. We can tune as needed.
   * Test this filtering by programmatically or manually creating some tags and selecting them. For example, assign two contacts a tag “TestTag”, then simulate checking “TestTag” filter – those contacts should cluster at center, others move outward and get colored red/gray. Fine-tune radii and forces to achieve a clear separation (maybe inner cluster overlaps is fine if few, but outer ones should form an obvious ring). We might limit the simulation iterations so it doesn’t jitter too much – or keep it running if continuous movement is desired. If continuous, the groups will still hold due to radial constraints but might jiggle around – which is okay as long as they don’t mix groups easily.

7. **Single Contact Focus Implementation:**

   * When user clicks “Focus” on a contact (from side panel) or double-clicks a bubble (if we choose that gesture), perform the following: retrieve that contact’s tag list, and set those as the activeFilters (essentially the same as if the user manually checked those tags in filter UI). Possibly also highlight the focused contact in some special way (like it could remain in center with a distinct marker). But if it has all its own tags (obviously it does), it will be in the center group anyway.
   * We can store a state “focusedContactId” if needed, mostly for UI (maybe to prevent that contact from being deemphasized even if it lacked a tag – which can’t happen, it always matches itself fully).
   * So essentially reuse the filtering logic: it’s just a convenience to set filters = that contact’s tags and applyFilters. We should also perhaps display something like “Filtering by \[Contact Name]’s tags”. The user can then clear filters via the UI to exit focus (or maybe clicking an “x” or the focus button again toggles off).
   * Ensure that if focus initiated, the side panel is closed (so the screen clears to show bubbles).

8. **Import/Export Integration:**

   * Implement the `importCSV(filePath)` function in our data module. Use Node’s `fs.readFileSync` to get file content, then parse. We can do a manual parse: split by newlines, split first line by commas to get headers, then for each subsequent line split by commas (taking care to handle quoted fields with commas). Using a robust library like PapaParse might save time, but Codex can likely handle basic CSV parse of well-formed Outlook CSV (which typically encloses fields in quotes if needed). We have to consider commas within quotes (like in addresses or notes). A library might be safer to avoid parsing bugs. For plan, assume we’ll use a reliable parse (either custom-coded or via library).
   * After parsing to an array of objects (keys by header name), map those to our internal format:

     * e.g. CSV “First Name” -> contact.firstName, “Last Name” -> lastName, “E-mail Address” -> email, “Company” -> company, etc.
     * “Categories” -> a single string of categories separated by semicolon – split it by `;` into array, and assign to tags.
     * Fields in CSV that we don’t explicitly handle, we either skip or put into customFields (maybe skip for now unless we want to capture every piece of data – likely skip extra because Outlook has many fields like Assistant’s Phone, etc., which we don’t model).
   * Once we have an imported contact object, we must integrate it: check duplicate as described. For duplicates, we might show a dialog for each or accumulate and show a summary at end. A simple way: if small number of duplicates, handle one by one with confirm prompts (“Contact John Doe with same email exists. Overwrite? \[Yes/No/Yes to All]”). But a custom dialog listing differences would be more user-friendly. For MVP, a basic confirm loop is acceptable. Alternatively, always import as new (possibly creating duplicates) and note to user – but requirement asks to prompt to resolve, so we’ll do that.
   * After importing, call `renderBubbles` to refresh the visualization with new contacts. Possibly re-initialize simulation or add nodes to existing simulation (D3 allows adding nodes and re-heating). For simplicity, we might recreate simulation from scratch after a bulk import (the performance hit is negligible for a few hundred nodes).
   * Implement `exportCSV(filePath)`: essentially invert of import. We’ll assemble a header line using Outlook’s expected columns (at least those we have data for). Then for each contact, output those fields. Use quotes around fields that contain commas. Ensure line breaks properly. Write to file.
   * Provide UI elements: in the menu or top bar, an “Import CSV” button and “Export CSV” button. Hook them to Electron’s file dialog (use `dialog.showOpenDialog` for import to get a path, and `dialog.showSaveDialog` for export). Then call the respective functions. After import, consider showing a success message like “Imported N contacts” or any errors (we should handle parse errors by alerting the user “Invalid CSV format” if needed). After export, show “Exported successfully to X”.
   * Test the import/export with a small sample CSV (we could prepare a tiny CSV from Outlook or manually). This would be part of testing phase.

9. **Theming and Settings:**

   * Implement theme detection on startup: in the main process, check `nativeTheme.shouldUseDarkColors`. Pass this info to renderer (via `BrowserWindow` webPreferences or via an IPC message on startup). In renderer, apply appropriate class to `<body>` or use the CSS media query approach.
   * Create a simple settings UI (could be a modal or just a dropdown in the top bar). For MVP, maybe a “Theme: \[Auto/Light/Dark]” dropdown in the menu or as an icon with options. When user selects, store that preference (we can save in a small config JSON or localStorage). Apply the theme by adjusting classes or overriding `nativeTheme.themeSource` (Electron API can force dark/light). However, using CSS classes is straightforward: e.g. if user picks “Dark”, add `dark` class and remove `light` class from body, and skip media query. For Auto, remove explicit classes and let media query reflect OS.
   * Provide at least two theme variations (light and dark). If ambitious, maybe a third colorful theme, but not necessary. The bright playful aspect likely comes with whichever accent colors we choose for bubbles, which can remain consistent.
   * Check that in both themes the UI is legible (adjust text color, panel background, etc.).

10. **Polish Bubble Appearance:**

    * Add visual details: maybe a slight drop-shadow on bubbles to give a floating feel, or a radial gradient fill to make them look spherical (clear center, colored edges). We can define an SVG `<defs><radialGradient>` for a bubble and use it for fill. For example, a gradient from a color to a lighter center with some opacity can mimic a marble look. This is a nice-to-have flourish.
    * Ensure the bubble size scaling logic is applied: we should determine bubble radius based on number of contacts: e.g. if N > 100, use smaller radii (maybe a formula like radius = maxRadius \* (50/√N) clamped to \[minRadius, maxRadius]). We can fine-tune by testing with different N.
    * If performance with many bubbles is an issue, consider switching to canvas rendering. But likely for a few hundred, SVG and D3 are fine on modern hardware. We will note that as a future possibility if needed.

11. **Accessibility & List View Touch-ups:**

    * Ensure that all interactive elements are reachable: e.g. you can tab to the search bar, to import/export buttons, etc. (Electron will behave like a browser, so default tab order should work if we use standard controls).
    * For list view, finalize the layout and ensure it updates when data changes (if user adds contact in bubble view and then switches to list, it should show it – we can just regenerate the table on toggling the view, or maintain a single source of truth and update both views at changes).
    * Possibly add keyboard shortcuts (e.g. Ctrl+F for search focus, Esc to close side panel, etc.) for power users. Not required, but small enhancements like Esc closing the panel or clearing search could be added easily.

12. **Testing and Quality Assurance:**

    * **Unit Tests (if feasible):** We can write tests for some logic functions (especially CSV import parsing and export formatting). For example, given a sample CSV line, does our parser create the correct contact object? And does export produce a line with proper commas/quotes? If using Node, we could incorporate a test framework like Mocha or just simple assertions in dev.
    * **Functional Testing:** Manually verify each requirement:

      * Add \~10 sample contacts (mix of different tags, some overlapping email domains, etc.) to simulate a real scenario. Ensure all appear in bubble view, can open detail, edit, and changes persist on restart (test save/load).
      * Test **import** by exporting these to CSV, clearing app data, then importing the CSV to see if all data (including tags) come back correctly. Also test importing a CSV that contains a duplicate of an existing contact to trigger the conflict resolution.
      * Test **export** by importing that CSV into Outlook or a CSV viewer to confirm fields align (e.g. correct columns, values in right place).
      * Test **filtering**: select multiple tags and see that grouping and colors behave as expected (all contacts that have those tags cluster and are colored, etc.). Try edge cases: filter by a tag that no contact has (should result in no full/partial matches, essentially all contacts are “none” – perhaps in that case we should indicate “0 contacts match” and likely just show all with red/orange since none meet criteria). Or filter by a single tag versus multiple. Also test the single contact focus via the Focus button – does it correctly set the filters and show the result?
      * Test **search**: type a name that exists, see the correct bubble highlights. Type a substring of an email or company, ensure those come up. Combine search with tag filter (e.g. filter by “Work” tag then search within that for “John”). Behavior should be logical (should narrow to contacts that are in “Work” and also have “John” in name).
      * Test **UI responsiveness**: resize the application window – do elements adapt? (We should make the SVG container flexible via CSS/vw units or re-calc force center on resize). Possibly add a window resize event to re-center simulation and adjust forces.
      * Test **theme switch**: toggle Windows theme (if possible) to see if our app changes (or simulate by manual toggle in app). Ensure colors and text remain visible in both modes.
      * Test **plus bubble animation**: add a new contact via + and verify the bubble “drifts” from the corner into position. (Implementation detail: after saving new contact, we can animate the “+” bubble icon moving out? But the requirement (Req.14) suggests the new contact’s bubble originates at the + position then moves into the cluster, while a new + bubble appears in the corner. We can cheat by having the new contact’s initial coordinates be at the + bubble’s coordinates, then allowing simulation to pull it into place – that naturally animates it flying into the cloud. Meanwhile, the + bubble element can remain (or we might hide it while dragging out and then show a new one – but easier: don’t hide, just spawn contact at that location)). Test this looks okay.
      * Test with a larger number of contacts (if possible generate 100 dummy contacts with random tags programmatically, load them in JSON) to observe performance and layout. It should still be usable, though maybe cluttered – check that bubbles sized down and still individually visible.

13. **Packaging and Deployment (Post-MVP):**

    * (This step can be done once the app is confirmed working.) Use a tool like **Electron Forge** or **Electron Builder** to package the app into an installer or standalone .exe for Windows. Ensure the `contacts.json` persists in a safe location (if using `app.getPath('userData')`, packaging will automatically use that directory for the live app). Test installing and running on a Windows machine to ensure it works outside of dev environment.
    * Not a requirement explicitly, but important for delivering the app to user.
    * Also, possibly prepare documentation or help file for the user (since there are novel UI interactions, a brief help overlay could be nice – e.g. “Tip: Use tag filters on left to group contacts”).

Throughout development, we will **preserve citations** from this research plan in code comments where relevant (especially for tricky parts like Outlook field mapping), and ensure the code structure follows this detailed plan. By following these steps and verifying each requirement, we will create a comprehensive contact manager application that meets the user’s vision.

## Future Expansion

Although the focus is on an MVP, it’s useful to note features and improvements that can be added after the initial version:

* **Improved Contact Data Features:** Sync with actual Outlook contacts via Outlook API or support vCard format import/export, handling contact photos, more custom fields or mapping all Outlook fields. Add **contact grouping** by company automatically (beyond just suggesting a tag, perhaps auto-tagging or grouping UI for companies).
* **Collaboration/Cloud:** Introduce an option to sync contacts to a cloud service or at least backup the JSON to a cloud storage for safety (since currently no backup).
* **Security:** Add password protection or encryption for the contacts file, in case it contains sensitive data.
* **Notifications & Integration:** Add birthday reminders or integration with email (click email to open mail app, etc.), but these were out-of-scope for MVP.
* **Mobile or Web versions:** Since we built with web tech, we could create a web app or mobile (using something like React Native or Capacitor) in the future, to access contacts on other platforms.
* **Enhanced Visualization:** If the bubble concept is successful, we can refine it further – e.g. show connections between contacts who share tags (draw lines between bubbles?), or allow clustering by multiple attributes (like a 2D grid: tags vs categories). We could also add a 3D mode (with something like Three.js) just as an experiment for visual impact.
* **Hierarchical Tags or Smart Filters:** If user base grows and they need hierarchical tags or advanced filters (e.g. “any of these 3 tags AND none of this other tag”), we could extend the filter logic and UI.
* **Accessibility Improvements:** Eventually ensure full keyboard navigation (arrow keys to move focus between bubbles, etc.), ARIA labels for screen readers describing the bubbles (“John Doe, 2 tags: Client, NYC”), high-contrast mode asset adjustments, etc.
* **Performance Scaling:** If needing to handle thousands of contacts, we might implement dynamic clustering (e.g. collapse contacts by first letter or by tag when zoomed out) or switch to WebGL for drawing many nodes efficiently. For now, hundreds are fine, but if scaling up, we’ll address that.

By focusing on the MVP first – implementing the core functionalities as detailed in this plan – we set a strong foundation that can be iterated upon. The above plan provides a complete roadmap for Codex to generate the code, ensuring that each requirement is met with appropriate technology and design decisions. With careful implementation and testing, the envisioned bubble-based contact manager will come to life as a functional and engaging application.
