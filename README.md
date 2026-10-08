# Attraction Manager Lab / 樂園營運決策模擬器

MHO5405 Tourism Studies, Lecture 6: Tourism Attractions — Design and Feasibility. Original bilingual classroom implementation, inspired by the visitor/attraction/queue concepts in the projects credited in [SOURCES.md](SOURCES.md). No source code, visual assets or datasets from those two projects are redistributed.

- Student game: https://sonicygy.github.io/MHO5405-Tourism-Studies/
- Classroom QR and group comparison: https://sonicygy.github.io/MHO5405-Tourism-Studies/classroom.html
- Classroom instructions: [CLASSROOM_GUIDE.md](CLASSROOM_GUIDE.md)
- QR PNG / SVG: `assets/Attraction_Classroom_QR.png` / `.svg`

## Classroom flow

One device per group. Enter a group name, predict the bottleneck, adjust operations, run two simulated hours and explain trade-offs. Complete three independent rounds: regular demand (60/h), peak demand (84/h), and one group-assigned event starting at minute 45: rain, a shared-path complaint or accessibility needs. Allow 10–15 classroom minutes.

繁體中文、English and bilingual views are available. Pause, accelerate, finish immediately or revise and rerun before saving a round. Completed results include started and completed experiences, remaining queue, deferred visits, the garden alternative, waiting time, threshold exceedance and fictional cost. Assumptions are visible in the app.

## Records and privacy

This version runs entirely in the browser. Group progress and imported classroom reports use localStorage on the current browser; private mode, storage restrictions or clearing browser data can remove records. It has no central database or automatic teacher inbox.

At completion, download JSON, CSV, print/save as PDF, or copy a report link to the teacher. A report link carries the group record in its URL fragment (not sent to GitHub Pages). Anyone holding that link can read that group record. Avoid personal or sensitive data in group names and reflections. Teachers can import multiple JSON files or open report links and compare the same round on the classroom page. They can clear imported records from their device. Imported outcomes are recalculated from the plan; supplied result numbers are not trusted.

## Local use

Open `index.html` directly for offline use, or serve this folder with `python -m http.server 8795 --bind 127.0.0.1`. No npm install, external fonts, API keys or network requests are required by the game. The classroom QR always points to the published student URL, including when the classroom page is opened locally.

## Model

The deterministic minute-step FIFO batch model is in `engine.js`. No real tourism demand, crowd safety limit, cost estimate or satisfaction prediction is claimed. Every round starts with an empty queue. The lecture baseline starts 72 participants in two hours and leaves 48 queued. See [SOURCES.md](SOURCES.md) for arrival, timing, booking, resource and event rules.

## Files and licensing

`index.html`, `app.js`, `engine.js`, `ui.js`, `style.css`: student activity. `classroom.html` and `classroom.js`: teacher projection/import/comparison. `assets/qrcode.min.js` is QRCode.js under MIT; its copyright and licence are preserved in `assets/qrcodejs-LICENSE.txt`. All park graphics and the remaining application code were created for this course.
