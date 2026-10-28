# BEAM Infotech Calculator Website

## Open the project later

The project folder is:

`C:\Users\dell 3050\website-rebuild`

In Windows File Explorer, paste that path into the address bar and press Enter. To edit the project, open that folder in Visual Studio Code using **File > Open Folder**.

## Run the website on your computer

1. Open the project folder in VS Code.
2. Open the built-in terminal with **Terminal > New Terminal**.
3. Run `npm run dev`.
4. Open the local address printed in the terminal, usually `http://localhost:5173/`.
5. In the website sidebar, select **Inductors**. The Inductor Design Calculator appears in that category with the other inductor calculators.

Keep the terminal running while you use the local website. Press **Ctrl+C** in that terminal to stop the development server.

If dependencies have not been installed on that computer (or `node_modules` is missing), run `npm install` once from this project folder, then run `npm run dev`.

## Where to make changes

- `src/InductorDesignCalculator.jsx` — calculator form, displayed outputs, materials, instructions, assumptions, and reference links.
- `src/inductorDesign.js` — calculation formulas, unit conversions, input validation, and warnings.
- `src/inductorDesign.test.js` — calculation tests. Add or update tests when changing formulas or validation.
- `src/App.jsx` — connects the calculator to the existing **Inductors** category. Keep this integration if editing the calculator so it remains in that category.
- `src/App.css` — calculator layout and responsive styles.

For formula changes, update the formula notes shown in the calculator as well as the tests. Core properties must come from the actual manufacturer's datasheet; do not fill in guessed specifications.

## Check changes before sharing

Run these commands from the project folder:

- `npm test` — runs the calculator tests.
- `npm run lint` — checks source code.
- `npm run build` — creates the production website in `dist` and reports build errors.

To preview the production build locally, run `npm run build` and then `npm run preview`; open the local address it prints.
