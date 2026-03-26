# Random Student Generator

![Random Student Generator — speaking test schedule](screenshots/Screenshot%202026-03-26%20at%2016.06.10.png)

Single-page web app that randomly assigns students to speaking-test time slots, shows a short animated draw, and downloads a PDF of the schedule.

## Run locally

### Option A — simple HTTP server (recommended)

From the project folder:

```bash
cd "/path/to/Random Student Generator"
python3 -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

Use any free port instead of `8080` if that port is busy.

### Option B — open the file directly

Double-click `index.html` or open it from your browser’s **File → Open**. The app works offline; the PDF library loads from a CDN the first time, so you need an internet connection for that script unless it is already cached.

## What you need

- A modern browser (Chrome, Firefox, Safari, Edge)
- **Python 3** only if you use Option A (usually preinstalled on macOS)
