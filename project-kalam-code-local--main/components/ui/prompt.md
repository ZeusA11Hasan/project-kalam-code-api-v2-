✅ PROMPT — Build Whiteboard with LaTeX (Math + Chemistry) Rendering
You are my AI IDE.

Task: Implement a frontend whiteboard for my AI Tutor app that supports:
- smooth freehand drawing (Perfect Freehand)
- vector shapes (pen, line, arrow, rect, ellipse)
- pan + zoom + infinite canvas feel
- undo / redo
- export to PNG / SVG
- add text boxes
- a dedicated LaTeX tool: user types LaTeX (math and chemistry via mhchem `\ce{...}`), the LaTeX is rendered with KaTeX+mhchem into SVG, converted to a raster/vector image and placed as a draggable, scalable node on the canvas
- LaTeX nodes should be editable (double-click to reopen editor), selectable, rotatable, and support z-order
- ensure high quality rendering (no blur at zoom levels)
- no backend changes; all frontend only

Tech stack & packages to use (install these):
- react
- next (if generating pages)
- konva
- react-konva
- perfect-freehand
- katex
- @matejmazur/react-katex (or react-katex) — but primarily use katex.renderToString
- mhchem (enable via KaTeX mhchem option)
- framer-motion (for toolbar micro-animations)
- lucide-react (icons)
- tailwindcss

Create these files/components (full code for each):
1. components/Whiteboard/Whiteboard.tsx
   - main Konva Stage + Layer(s)
   - handle pan/zoom (wheel + pan mode)
   - freehand drawing using Perfect Freehand -> convert strokes to Konva.Line (smooth strokes)
   - shape tools (rect, ellipse, arrow)
   - selection transformer (Konva.Transformer) for nodes (including LaTeX images)
   - undo/redo stack management
   - export functions (exportPNG, exportSVG)
   - keyboard shortcuts: Ctrl+Z, Ctrl+Y, Delete
   - thumbnail snapshot function that returns PNG blob (for AI agent use)

2. components/Whiteboard/Toolbar.tsx
   - tool icons: Select, Pen, Erase, Rect, Ellipse, Arrow, Text, LaTeX, Pan, Undo, Redo, Export
   - when LaTeX tool selected → open LatexInputModal

3. components/Whiteboard/LatexInputModal.tsx
   - modal with textarea input
   - support inline `$...$` and block `$$...$$` but mainly expects raw LaTeX or `\ce{...}`
   - preview area that uses `katex.renderToString` with `{ throwOnError: false, trust: true, output: "html", macros: {}, mhchem: true }` (enable mhchem)
   - on Save → call helper `latexToKonvaImage(svgString)` to create an HTMLImageElement and add it as Konva.Image node to stage at cursor position
   - allow font-size input and color

4. components/Whiteboard/utils/latexToDataURL.ts
   - function `latexToSvg(latex: string): string` using `katex.renderToString(latex, options)`
   - function `svgToDataUrl(svgString: string): string` that wraps svg in proper xmlns and encodes to data URL
   - function `dataUrlToImage(dataUrl): Promise<HTMLImageElement>` to create an image for Konva.Image
   - ensure SVG includes inline CSS to preserve KaTeX font sizes and avoid external dependencies; include katex.min.css content inline or small CSS rules for `.katex` styling

5. components/Whiteboard/TextTool.tsx
   - simple editable text boxes (HTML textarea overlay when editing)
   - supports switching to LaTeX mode (if user types `LaTeX` toggle, show LaTeX preview and create LaTeX node instead)

6. styles/global.css / import katex css
   - include `import 'katex/dist/katex.min.css'` globally
   - small extra CSS for modal preview

Important implementation details to follow:
- For LaTeX rendering pipeline:
   1. Use `katex.renderToString(latex, { displayMode: ... , throwOnError:false, trust: true })` to get HTML string.
   2. Wrap that HTML inside an `<svg>` foreignObject or convert HTML→SVG string by embedding the HTML inside foreignObject; however Safari may fail with foreignObject → as a fallback, convert KaTeX HTML into an SVG by wrapping each element or render to canvas via `canvg`. For simplicity and best cross-browser fidelity, create an SVG with `<foreignObject>` that contains the KaTeX HTML and set width/height derived from temporary DOM measurement.
   3. Convert the final SVG string to a data URL: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
   4. Create an `Image` object from the data URL, then create a Konva.Image node. Set `image.width` and `height` appropriately and set `perfect` scaling (disable image smoothing in Konva layer when drawing images to keep crispness).

- To keep LaTeX crisp on zoom:
   - Store the original SVG/dataURL; on high zoom levels re-render at higher resolution by re-invoking `latexToSvg` with increased font-size param and replacing node image. Or keep the SVG dataURL to export vector SVG.

- For chemistry (`\ce{...}`) support:
   - Ensure KaTeX is initialized with mhchem. If using `katex.renderToString`, ensure mhchem is available — import `katex/contrib/mhchem` or enable `katex` option that recognizes `\ce`. Provide code to register mhchem if necessary.

- Perfect-Freehand strokes:
   - Capture pointer events, build points array, pass to perfect-freehand to compute smoothed polygon, then render as Konva.Line with closed shape.

- Konva Transformer:
   - For selected node(s) attach transformer for resize/rotate; for text/latex nodes, preserve scaling ratio (when scaling the image, update stored scale).

- Accessibility & UX:
   - Make toolbar keyboard accessible
   - Add tooltips
   - Add a small animation for toolbar using framer-motion

- Output:
   - Provide full code for each of the above components, including imports and helper utils
   - Provide Tailwind classes used
   - Provide any small inline CSS required for KaTeX preview in modal
   - Provide README-style usage and developer notes on how to test LaTeX placement, editing LaTeX nodes, and exporting

Constraints:
- DO NOT change backend
- DO NOT add voice or file upload logic
- This is a front-end only feature
- The LaTeX editor must support both inline math and mhchem `\ce{...}` chemistry input
- Keep code ready-to-run for Next.js + TypeScript (if project is JS, convert types to JS)

End.

Extra implementation notes (dev tips you can paste into the IDE or follow)

KaTeX + mhchem

import katex from "katex";
// ensure mhchem is loaded; some installs require:
import "katex/contrib/mhchem";
const html = katex.renderToString(latex, {
  throwOnError: false,
  output: "html",
  displayMode: displayMode,
});


Minimal latexToDataURL approach

function wrapKaTeXHtmlInSvg(katexHtml, width, height) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml">
        ${katexHtml}
      </div>
    </foreignObject>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function latexToImage(latex, fontSize=18) {
  const html = katex.renderToString(latex, { throwOnError:false, displayMode:false });
  // measure width/height: inject temp hidden div into DOM to compute natural size
  const { width, height } = measureKaTeXSize(html, fontSize);
  const dataUrl = wrapKaTeXHtmlInSvg(html, width, height);
  return await dataUrlToImage(dataUrl); // resolves HTMLElement Image
}


Editing LaTeX node

On double-click -> open modal with current latex string -> re-render and replace node image.

Export to SVG

Keep a vector representation of LaTeX nodes (store original SVG strings) and export a combined SVG for final vector download.