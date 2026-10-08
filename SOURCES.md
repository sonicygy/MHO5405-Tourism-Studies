# Model, assumptions and project references

## Course alignment

MHO5405 current Lecture 6 teacher script, revised 7 October 2026, slides 18–20: calculate a fictional guided attraction's throughput, examine staffing and space constraints, and link impact evidence, threshold, responsible stakeholder, control and review. Slides 22–24: the eight-field group attraction canvas. No teacher appendix, assessment question or student list is published here.

## Inspected project references (8 October 2026)

1. [mickey1356/sim_project](https://github.com/mickey1356/sim_project), SUTD 40.015 amusement-park simulation. README and `src/agent.js` inspected. Conceptual inspiration: separate moving, queuing, experiencing and leaving states; show visitors in a park; compare operational constraints and waiting outcomes. The original project includes richer spatial pathfinding and visitor preferences. This classroom implementation uses a different deterministic batch model.
2. [Joaquindelahoz03/Theme-Park-Simulation-Python](https://github.com/Joaquindelahoz03/Theme-Park-Simulation-Python), README and `Codigo/sim.py` inspected. Conceptual inspiration: attraction capacity as a limited resource, arrival/service/completion timing and recording waiting outcomes. This app does not depend on Python or SimPy.

Neither repository declared a licence in its GitHub metadata or root listing when inspected. Their code, images and data were not copied or redistributed. This is an original course implementation informed by their published modelling concepts. QRCode.js is the only bundled third-party code: [davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs), MIT, licence retained alongside the asset.

## Reproducible teaching model

- Each round lasts 120 simulated minutes, with an empty initial queue. Regular demand is 60/h; peak/event demand is 84/h. Integer arrivals follow differences of cumulative `floor(minute × rate / 60)`; repeated plans under the same event give the same outcomes. These are fictional scenarios, not empirical forecasts.
- At each minute: current groups complete; new visitors arrive; available guides may start at a configured start window; end-of-minute queue impact is recorded. Starts occur at interval, 2×interval, … up to and including minute 120. Starting at minute 120 counts as starting, but not completing, within the reporting period.
- Default group size is 12, a session lasts 20 minutes, one guide leads one group at a time, and the main venue holds 24 participants simultaneously. A full venue or busy guide can skip a start window. A partial group may start if there is insufficient demand or space for a full group. FIFO visitors do not abandon the queue in this simplified model.
- The displayed throughput is a resource ceiling, not guaranteed realised attendance. For one guide, a session spans `ceil(session duration / window interval)` windows. The app also checks the venue occupancy ceiling. Actual batch and occupancy interactions are simulated separately.
- Baseline: one guide, group size 12, 20-minute interval, no booking or redirection. Six starts × 12 = 72 starters, 60 completions, 12 still experiencing and 48 queued from 120 interested visitors.
- Booking admits up to cumulative `floor(minute × booking rate / 60)`. Excess interested visitors are deferred outside the park; no later return within the same round is simulated. Unused booking allowance can be used later in that round. A smaller on-site queue can coexist with greater deferred demand.
- Garden redirection uses an evenly spaced deterministic fraction of admitted visitors. The self-guided alternative lasts 12 minutes. Unlimited garden capacity is an explicit classroom simplification; real space, supervision, weather and interpretation need evidence. A redirected visitor is not counted as starting the main attraction.
- Third-round event is deterministically assigned from the group name. It is disclosed before students plan; it takes effect at minute 45. Each event round uses peak demand.
- Rain: new main-attraction starts must fit 12 simultaneous places rather than 24; garden redirection stops. Sessions already in progress finish as scheduled. This transition is a modelling convention, not an emergency procedure.
- Shared-path complaint: the illustrative acceptable end-of-minute queue drops from 12 to 6 on the shared path. A separately arranged waiting area permits 40. These are fictional stakeholder agreements, not universal safe capacities. Space, permission and accessibility of that area need verification.
- Accessibility: from minute 45, every fifth newly admitted visitor needs provision. Without an accessible route, those visitors are counted as needs unserved, not queued or served. With provision, new groups have at most 8 participants and last 25 minutes. Existing sessions finish normally. A later booking slot does not automatically satisfy an access need. The garden's accessibility remains a site-verification question.
- Accounting identity: interested = main starters + remaining queue + deferred + garden visitors + accessibility needs unserved. Main starters = completions + active participants. The metrics are mutually exclusive visitor outcomes at the main service allocation level.
- Mean waiting time includes main-experience starters only; currently queued visitors have their own longest wait. Deferred visitors are excluded from mean waiting, not assigned zero waiting. Maximum queue is measured before and after starts; threshold exceedance uses the end-of-minute queue.
- Illustrative costs per two-hour round: HK$180 per guide-hour; waiting area HK$160, accessibility assistance HK$200, booking administration HK$80, garden redirection HK$60. Costs are charged for provision even if an event reduces utilisation. No revenue, profit, capital investment or satisfaction score is estimated.

## Classroom interpretation

Evaluate the evidence and explanation, not a single winning score. Compare groups within the same round and identify different third-round events before interpreting numbers. Ask who benefits, whose needs remain unserved, who accepts a threshold, who acts, and what evidence could invalidate the assumptions. The output supports the operating feasibility and impact-control fields of the project canvas.
