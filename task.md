# ML Visual Lab — V1 Task Plan

## Product guardrails

- Static browser application only: HTML, CSS, vanilla JavaScript, and SVG.
- No backend, Python, database, authentication, runtime build system, or ML library.
- Keep the visualization primary and the interface calm, technical, and classroom-ready.
- Use deterministic rule-based explanations; do not generate teaching copy with AI.
- Keep algorithm logic separate from application state and SVG/DOM rendering.
- Do not expose unfinished playgrounds as if they were functional.

## Milestones

### Milestone 0 — Foundation and reference architecture

- [x] Read `PRD_ML_Visual_Lab_V1.md` and `design_ML_Visual_Lab_V1.md`.
- [x] Establish the static file structure and shared design tokens.
- [x] Define the browser-side separation between math logic, playground state, rendering, and shell navigation.
- [x] Create a deterministic verification checklist for the first vertical slice.

### Milestone 1 — Linear Regression vertical slice (current)

Application shell:

- [x] Desktop application shell with persistent sidebar.
- [x] Quiet text wordmark, local search, category navigation, and restrained active state.
- [x] Responsive/mobile top bar, drawer, overlay, Escape handling, and focus return.
- [x] Hide unfinished playgrounds until they are implemented.

Linear Regression playground:

- [x] Predefined positive-trend teaching dataset.
- [x] Responsive SVG scatter plot with readable axes and minimal gridlines.
- [x] Regression line, residual segments, and clear training-observation markers.
- [x] Keyboard-accessible slope and intercept controls with live numeric values.
- [x] Deterministic Reset state.
- [x] Ordinary least-squares Find Best Fit implemented directly in JavaScript.
- [x] Real-time line, residual, and MSE updates.
- [x] Inference X control with fitted-model gating, projection guide, prediction, and distinct diamond marker.
- [x] Current slope, intercept, and MSE metric strip.
- [x] Deterministic, state-based What's Happening? explanation.
- [x] Formula section connecting predictions, residuals, and MSE to the plot.

Milestone 1 acceptance checks:

- [ ] Sidebar search filters the visible navigation item and navigation state remains usable.
- [ ] Drawer opens/closes from the mobile top bar, overlay, and Escape; focus is visible.
- [ ] Layout has no horizontal overflow at desktop, tablet, or mobile widths.
- [ ] Slope/intercept changes update the SVG line, residuals, displayed values, and MSE.
- [ ] Find Best Fit matches the ordinary least-squares slope/intercept for the teaching dataset.
- [ ] Inference shows the selected X, projection, and predicted ŷ without changing model parameters.
- [ ] Reset restores the same parameters, metrics, and disabled inference state every time.
- [ ] SVG resizes without distorting the coordinate system or hiding labels.
- [ ] Controls work with mouse and keyboard and remain readable without hover.
- [ ] `prefers-reduced-motion` suppresses nonessential transitions.
- [ ] Rendered UI passes the anti-AI-slop/design QA review.

### Milestone 2 — Gradient Descent (removed)

- [x] The exploratory Gradient Descent slice was completed during an earlier iteration.
- [x] Removed from the current production UI and codebase at the user's request before continuing to the next milestone.

Gradient Descent is intentionally not exposed in the current navigation and is not loaded by the application.

### Milestone 3 — Classification playgrounds

- [x] Implement Logistic Regression with sigmoid/probability/threshold flow and inference.
- [x] Implement K-Nearest Neighbors with selectable K, query point, highlighted neighbors, and deterministic tie-breaking.
- [x] Implement linear SVM with boundary, margins, support-vector rings, C control, and inference.

Milestone 3 acceptance checks:

- [x] Each classification playground has a responsive SVG visualization, visible training observations, primary current-state metrics, deterministic explanation, formula, and secondary inference section.
- [x] Logistic Regression demonstrates score → sigmoid probability → threshold → class prediction, with fitted/stale model state.
- [x] KNN updates the deterministic majority vote as K or the query point changes, including an explicit tie-break rule.
- [x] Linear SVM renders the decision boundary, unit-margin guides, support-vector rings, C control, and fitted/stale inference state.
- [x] Classification playgrounds are exposed through the sidebar without adding a second visual style or unnecessary dashboard cards.

### Milestone 4 — Decision Tree

- [x] Implement deterministic tree fitting with max-depth control and Gini-based split selection.
- [x] Add linked data-space and tree views with node selection.
- [x] Add animated inference path and leaf prediction without relying on hover.

Milestone 4 acceptance checks:

- [x] Max depth and Build Tree controls produce deterministic recursive splits from the fixed teaching dataset.
- [x] Active node metrics expose split feature, threshold, Gini impurity, and sample count.
- [x] Selecting a tree node highlights its corresponding data-space region and split.
- [x] Inference displays the new point, highlights the root-to-leaf path in sequence, and reports the leaf prediction.
- [x] Data Space and Tree View remain coordinated panels that stack responsively without introducing decorative cards.

### Milestone 5 — K-Means

- [x] Implement explicit Initialize → Assign → Update state machine.
- [x] Add K 2–5, bounded previous-step history, next-step, auto-run/pause, and convergence.
- [x] Visualize centroid movement, WCSS, empty-cluster recovery, and fixed-centroid inference mode.

Milestone 5 acceptance checks:

- [x] Next Step advances one meaningful phase at a time: Initialize Centroids → Assign Points → Update Centroids → Assign Points → Converged.
- [x] K is selectable from 2 through 5; Randomize Centroids and Restart Same Data use deterministic alternate starts while preserving the fixed teaching dataset.
- [x] Previous Step restores bounded state snapshots, and Auto Run is bounded to 30 phase transitions with Pause available while running.
- [x] WCSS, iteration, phase, centroid movement, K, and convergence state update with each committed phase.
- [x] Previous centroid positions, movement lines, and centroid symbols distinguish updates from ordinary observations.
- [x] Empty clusters retain their previous centroid safely instead of producing invalid coordinates.
- [x] Inference is enabled only after convergence, lists distances to every centroid, emphasizes the nearest centroid, and leaves centroids unchanged.

### Milestone 6 — V1 integration and quality pass

- [ ] Expose only completed playgrounds in navigation and keep active navigation consistent.
- [ ] Verify every required primary control, reset state, metric, formula, and explanation.
- [ ] Run responsive, keyboard, reduced-motion, projection-readability, and edge-case checks across all playgrounds.
- [ ] Confirm the complete app deploys as ordinary static files with no backend or build step.

## Current-slice technical decisions

- Use ES modules with no third-party dependencies.
- Keep regression math in `js/core/math.js` and the playground state/rendering in `js/playgrounds/linear-regression.js`.
- Use a viewBox-based SVG so the chart remains responsive while preserving the data coordinate system.
- Treat the initial line as a useful teaching state, but mark inference as available only after an explicit fit action.
- Use a shared diamond inference marker and a separate visual treatment for training observations.

## Milestone 1 completion notes

### Status

Implementation is complete for the requested first vertical slice. The app is a static, dependency-free browser experience with Linear Regression as the only exposed playground.

### Files created/changed

- `index.html` — semantic application shell, sidebar/drawer navigation, and reference playground markup.
- `css/app.css` — shared visual tokens, responsive layout, accessible controls, and restrained SVG styling.
- `js/app.js` — shell navigation, local search, responsive drawer behavior, and playground bootstrap.
- `js/core/math.js` — deterministic dataset, prediction, MSE, OLS, clamping, and formatting helpers.
- `js/playgrounds/linear-regression.js` — isolated playground state, SVG renderer, interactions, fit animation, inference, and deterministic explanations.
- `task.md` — V1 roadmap and current-slice status.

### Checks performed

- JavaScript syntax checks passed for all three modules.
- Static HTTP smoke test returned 200 for the HTML, CSS, and playground module.
- DOM reference check found all 21 required IDs and only `linear-regression` exposed in navigation.
- OLS/MSE assertions passed for the nine-point teaching dataset: initial MSE `0.994444...`, best-fit `m=0.783333...`, `b=1.238888...`, best-fit MSE `0.029506...`, inference prediction at `x=6.5` `ŷ=6.330555...`.
- Source scan found no decorative gradients, backdrop blur, or box shadows.
- Browser preview was attempted, but the available in-app browser blocks local/localhost URLs in this environment. Interactive screenshot verification therefore remains an environment limitation, not an application behavior claim.

### Next milestone

Implement the Decision Tree playground. Preserve the current shell and extract shared patterns only when the next playground provides a real use for them.

## Milestone 2 disposition notes

### Status

Gradient Descent was removed from the current project before Milestone 3 continued, as requested. The current application does not expose, import, or render the playground.

### Additional files/areas changed

- `index.html` — removed the Optimization navigation entry and Gradient Descent screen.
- `css/app.css` — removed Gradient Descent-only styles while preserving shared layout rules.
- `js/app.js` — removed Gradient Descent bootstrap code and its title mapping.
- `js/core/math.js` — removed the unused quadratic loss and gradient helpers.
- `js/playgrounds/gradient-descent.js` — removed from the current project.

### Checks performed

- Production source scan confirms no Gradient Descent navigation, bootstrap, file, or development label remains.
- Existing Linear Regression OLS/MSE assertions remain covered by the Milestone 1 checks.

## Milestone 3 completion notes

### Status

Complete. The current project exposes Linear Regression plus three functional classification playgrounds: Logistic Regression, K-Nearest Neighbors, and Linear SVM.

### Additional files/areas changed

- `index.html` — added the Classification sidebar group and three semantic playground screens.
- `css/app.css` — added shared classification plot primitives for class markers, boundaries, margins, neighbors, and support vectors.
- `js/app.js` — bootstrapped all three classification playgrounds and updated document titles.
- `js/core/math.js` — added sigmoid, logit, and Euclidean-distance helpers.
- `js/core/plot.js` — added shared responsive SVG frame, scale, tick, and text helpers.
- `js/playgrounds/logistic-regression.js` — added sigmoid classifier state, fit action, threshold boundary, inference, and deterministic teaching copy.
- `js/playgrounds/knn.js` — added selectable-K neighborhood visualization, query controls, deterministic voting, and tie handling.
- `js/playgrounds/svm.js` — added linear margin fitting, support-vector detection, C control, inference, and deterministic teaching copy.

### Checks performed

- JavaScript syntax checks passed for the application, shared helpers, Linear Regression, and all three classification playgrounds.
- DOM bootstrap smoke test passed for Logistic Regression, KNN, and Linear SVM using a minimal SVG/DOM test double.
- Static navigation check confirms exactly four exposed playgrounds and matching screen IDs.
- Production source scan confirms no Gradient Descent, `REFERENCE PLAYGROUND`, or `Reference slice · V1` labels remain in HTML, CSS, or JavaScript.
- Classification hierarchy is structured as visualization → current metrics/state → What's Happening? → Formula → secondary Inference.
- Interactive browser screenshot verification remains unavailable because the environment's in-app browser blocks local and localhost URLs.

## Milestone 4 completion notes

### Status

Complete. The current project now includes a deterministic Decision Tree playground with linked data-space and tree views.

### Additional files/areas changed

- `index.html` — added the Decision Tree sidebar entry and two-panel playground screen.
- `css/app.css` — added restrained linked-view, split, region, branch, node, and inference-path styling.
- `js/app.js` — bootstrapped Decision Tree and added its document title mapping.
- `js/core/math.js` — added Gini impurity calculation.
- `js/playgrounds/decision-tree.js` — added deterministic split selection, max-depth fitting, linked SVG rendering, node selection, and animated inference path.

### Checks performed

- JavaScript syntax checks passed for all application, shared helper, and playground modules.
- Gini and Decision Tree state smoke tests passed; the default tree chooses `X₁ < 4.70`, creates balanced child regions, and reaches pure leaves at depth 2.
- Animated inference smoke test passed through the root, child, and leaf nodes.
- Static navigation and hierarchy checks confirm Decision Tree is exposed and ordered as visualization → active node metrics → What's Happening? → Formula → secondary Inference.
- Apache/XAMPP serves the current page successfully at `http://localhost/mlviz/`.

### Next milestone

Complete the V1 integration and quality pass across all exposed playgrounds.

## Milestone 5 completion notes

### Status

Complete. The current project now includes a K-Means playground with explicit phase transitions, bounded history, convergence, and fixed-centroid inference.

### Additional files/areas changed

- `index.html` — added the Clustering sidebar group and K-Means screen with transport, metrics, training/inference mode, and distance detail.
- `css/app.css` — added restrained cluster, centroid, movement, inference, transport, and responsive styling.
- `js/app.js` — bootstrapped K-Means and added its document title mapping.
- `js/playgrounds/k-means.js` — added deterministic data, centroid initialization, assignment/update state machine, history, bounded Auto Run, convergence, and inference rendering.

### Checks performed

- JavaScript syntax checks passed for all application, shared helper, and playground modules.
- K-Means smoke test passed through initialize, assign, update, convergence, Previous Step, and K=5 empty-cluster safety.
- Fixed-centroid inference smoke test passed with distance listing and unchanged centroid coordinates.
- Static integration confirms five exposed playgrounds and matching screen IDs, including the Clustering sidebar item.
- Apache/XAMPP serves the current page and K-Means module successfully at `http://localhost/mlviz/`.

## Linear Regression design refinement review

### Status

Complete. The approved scientific-tool visual direction is preserved; this pass only tightens hierarchy, projection readability, and model-state communication.

### Refinements applied

- [x] Desktop Linear Regression plot is set to a 460px responsive SVG height; mobile returns to intrinsic responsive height.
- [x] MSE is now the first and visually primary item in the existing border-based metric strip, directly below the visualization; it remains computed and updated on every parameter input.
- [x] Teaching order is now controls → visualization → MSE/current state → What's Happening? → Formula → secondary Inference.
- [x] Model status now communicates `Unfitted`, `Fitted`, `Stale`, and `Fitting` with a subtle state marker. Manual parameter changes after fitting mark the OLS result stale while keeping prediction available on the current line.
- [x] Removed `REFERENCE PLAYGROUND`, `Reference playground`, and `Reference slice · V1` from production UI copy.
- [x] Training observations received a small contrast/size lift while retaining the blue outline treatment.
- [x] Teaching dataset metadata remains small, tertiary, and subordinate to the title and plot.

### 1920×1080 check

- [x] Source-level layout check confirms the desktop plot target is 460px and the required content order is present in the document.
- [x] JavaScript syntax checks passed after the refinement pass.
- [x] No gradients, glassmorphism, large shadows, or development labels were introduced.
- [ ] Browser screenshot/interaction verification remains blocked because the available in-app browser rejects local and localhost URLs in this environment.
