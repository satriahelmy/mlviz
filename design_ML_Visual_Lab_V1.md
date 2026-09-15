# Design Specification --- ML Visual Lab

**Version:** V1\
**Companion document:** `PRD_ML_Visual_Lab_V1.md`\
**Design goal:** A serious, calm, classroom-ready machine-learning
visualization tool that feels intentionally designed rather than
generated from a generic SaaS template.

------------------------------------------------------------------------

## 1. Design Thesis

ML Visual Lab should feel closer to a well-designed scientific
instrument, textbook diagram, or interactive technical reference than a
startup dashboard.

The interface exists to frame the algorithm visualization. It should
disappear when the instructor begins explaining.

The visual hierarchy is:

1.  **Algorithm visualization**
2.  **Interactive parameter controls**
3.  **Current state / metrics**
4.  **Contextual explanation**
5.  **Formula and supporting detail**
6.  Navigation

The product must not visually compete with its own teaching material.

### Core design qualities

-   precise;
-   quiet;
-   technical;
-   readable from a classroom screen;
-   high information clarity;
-   restrained;
-   consistent;
-   tactile enough to invite experimentation.

### Explicit anti-goal

Do not make the interface look like an AI-generated SaaS landing page or
analytics dashboard.

------------------------------------------------------------------------

# 2. Anti-AI-Slop Rules

These rules are requirements, not suggestions.

## 2.1 No gratuitous gradients

Do not use decorative gradients on:

-   page backgrounds;
-   cards;
-   buttons;
-   headings;
-   sidebars;
-   chart backgrounds.

A gradient is allowed only if it carries actual quantitative meaning,
such as a continuous probability surface.

## 2.2 No glassmorphism

Do not use:

-   translucent floating cards;
-   backdrop blur;
-   frosted panels;
-   glowing borders.

## 2.3 No card-everything layout

Do not wrap every control, metric, explanation, and formula inside
separate rounded cards.

Use spacing, typography, rules, and alignment to establish hierarchy.

Cards/panels are reserved for content that genuinely needs a bounded
region, especially the visualization canvas or a compact explanatory
callout.

## 2.4 Restrained corner radius

Default radius should be subtle.

Recommended:

``` css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
```

Avoid pill-shaped containers except where the interaction itself calls
for a compact segmented control/status.

## 2.5 Minimal shadows

Avoid large blurred shadows.

Most surfaces should be separated using:

-   border;
-   background tone;
-   spacing.

If a shadow is necessary for an overlay/drawer, keep it subtle.

## 2.6 No decorative blobs or abstract AI ornaments

No:

-   glowing spheres;
-   mesh gradients;
-   random floating geometry;
-   sparkles;
-   decorative neural-network nodes unrelated to the active
    visualization.

## 2.7 No oversized marketing typography

This is an application, not a landing page.

Algorithm headings should be clear but restrained.

## 2.8 No fake metrics

Never add decorative KPI cards such as:

``` text
Accuracy 98%
Performance +24%
AI Score 94
```

unless the value is actually relevant and computed by the active
playground.

## 2.9 No unnecessary icons

Icons must communicate an action or concept. Do not put an icon in every
heading or button.

Prefer text labels when they are clearer.

## 2.10 Avoid excessive instructional prose

The product is for live teaching. Keep explanations compact and
contextual.

------------------------------------------------------------------------

# 3. Visual Language

## 3.1 Overall theme

Default theme: **light, neutral, technical**.

The visual atmosphere should resemble:

-   graph paper without visible graph-paper decoration;
-   scientific plotting software with better typography;
-   modern technical documentation;
-   an interactive textbook figure.

Do not imitate a specific third-party product.

## 3.2 Color system

Use neutral surfaces for the application shell.

Suggested semantic tokens:

``` css
--bg: #F7F7F5;
--surface: #FFFFFF;
--surface-subtle: #F1F1EE;

--text: #171717;
--text-secondary: #5F5F5A;
--text-tertiary: #898983;

--border: #D9D9D4;
--border-strong: #B8B8B1;

--accent: #2563EB;
--accent-subtle: #EAF0FF;

--danger: #B42318;
--warning: #A15C00;
--success: #287A4B;
```

These values are starting points, not an invitation to create many
colors.

### Algorithm colors

Visualization colors have semantic jobs.

For two-class classification:

``` text
Class A → muted blue
Class B → muted orange
```

For clustering, use a small qualitative palette with enough distinction
for K=2--5.

Do not reuse the application accent color indiscriminately for every
data series.

### Color accessibility

Important states must not rely on color alone.

Examples:

-   support vectors: ring + color;
-   centroids: distinct symbol + color;
-   inference point: star/diamond + label;
-   selected observation: outline + color;
-   previous centroid: hollow/dashed symbol.

------------------------------------------------------------------------

# 4. Typography

Use a restrained sans-serif UI font with strong numeric readability.

Preferred approach:

``` css
font-family:
  Inter,
  "IBM Plex Sans",
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Do not require a custom font download for V1.

For formulas and selected technical values, a mathematical/monospace
fallback may be used sparingly.

Suggested scale:

``` text
App/sidebar title       15–16px / 600
Algorithm title         26–30px / 600
Section heading         12–13px / 600 / uppercase optional
Body                    14–16px / 400
Secondary               13–14px
Metric value            20–28px / 500
Axis labels             11–13px
Formula                  16–20px
```

Avoid excessive bold text.

Uppercase is acceptable for tiny structural labels such as
`CLASSIFICATION` or `CURRENT STEP`, not for body copy.

------------------------------------------------------------------------

# 5. Layout

## 5.1 Desktop application shell

Target desktop composition:

``` text
┌────────────────────┬──────────────────────────────────────────────┐
│                    │                                              │
│ ML VISUAL LAB      │  Support Vector Machine                      │
│                    │  Understand maximum-margin classification.   │
│ Search...          │                                              │
│                    │  C                                           │
│ REGRESSION         │  ─────────●────────────────── 1.0            │
│ Linear Regression  │                                              │
│                    │  [ Reset ]                    [ Fit Model ]   │
│ OPTIMIZATION       │                                              │
│ Gradient Descent   │  ┌────────────────────────────────────────┐  │
│                    │  │                                        │  │
│ CLASSIFICATION     │  │          MAIN VISUALIZATION            │  │
│ Logistic Regression│  │                                        │  │
│ KNN                │  └────────────────────────────────────────┘  │
│ SVM                │                                              │
│ Decision Tree      │  Margin 1.42        Support vectors 3        │
│                    │                                              │
│ CLUSTERING         │  WHAT'S HAPPENING?                           │
│ K-Means            │  The highlighted observations define...     │
│                    │                                              │
│                    │  FORMULA                                     │
│                    │  ...                                         │
└────────────────────┴──────────────────────────────────────────────┘
```

### Sidebar

Recommended width: **220--240px**.

Sidebar should:

-   remain visually quiet;
-   use a slightly differentiated neutral background or a right border;
-   remain fixed/sticky on desktop;
-   avoid floating-card styling;
-   support enough vertical space without feeling dense.

### Main content

Recommended readable maximum width:

``` text
~1000–1180px
```

Do not stretch teaching content infinitely across ultrawide displays.

The plot itself may use most of the available main-content width.

------------------------------------------------------------------------

# 6. Sidebar Navigation

## 6.1 Header

Use a simple text wordmark:

**ML Visual Lab**

No oversized logo is required for V1.

A small geometric mark may be added later, but the application should
not depend on branding artwork.

## 6.2 Search

Search is a compact input:

``` text
⌕ Search visualizations
```

Search filters algorithm names locally.

Do not implement command-palette complexity in V1.

## 6.3 Categories

Categories:

-   Regression
-   Optimization
-   Classification
-   Clustering

Category labels are visually subordinate.

## 6.4 Active item

Active navigation should be recognizable through:

-   slightly stronger text;
-   subtle background;
-   thin left marker or equivalent restrained indicator.

Do not use a large glowing/pill navigation item.

## 6.5 Mobile

At narrow widths:

-   sidebar becomes an off-canvas drawer;
-   top bar shows product name and menu button;
-   visualization retains maximum possible width.

------------------------------------------------------------------------

# 7. Playground Header

Each playground starts with:

``` text
Support Vector Machine
Understand how SVM finds a separating hyperplane with maximum margin.
```

The description should be one sentence.

Do not add:

-   breadcrumbs unless later proven necessary;
-   hero illustrations;
-   badges such as "AI POWERED";
-   decorative algorithm icons.

Optional utility actions such as **Reset** may sit at the right edge of
the header on wide screens.

------------------------------------------------------------------------

# 8. Control Design

Controls should feel like parameters of an experiment.

## 8.1 Sliders

Every slider shows:

-   parameter name;
-   current numerical value;
-   sensible min/max;
-   keyboard support.

Example:

``` text
Learning rate                                      0.10
|──────────────●────────────────────────────|
0.001                                           1.00
```

Do not make the slider oversized.

## 8.2 Buttons

Hierarchy:

**Primary** Used for the main algorithm action:

-   Fit Model
-   Next Step
-   Predict

**Secondary** Used for:

-   Reset
-   Randomize
-   Restart with Same Data

**Transport** For iterative simulations:

``` text
Previous    Next Step    Auto Run / Pause
```

Avoid icon-only controls for primary teaching actions.

## 8.3 Segmented controls

Use for mutually exclusive modes:

``` text
[ Training | Inference ]
```

Keep segmentation flat and compact.

## 8.4 Disabled state

If inference requires a fitted model, show the mode/action disabled with
a concise reason:

> Fit the model first.

Do not silently fail.

------------------------------------------------------------------------

# 9. Visualization Canvas

The visualization is the central product surface.

## 9.1 Plot container

Use a white or near-white plotting surface with a thin border.

Avoid decorative shadows.

Recommended minimum desktop height:

``` text
460–560px
```

depending on algorithm.

## 9.2 Axes

Axes should be understated:

-   neutral stroke;
-   concise tick labels;
-   minimal gridlines;
-   no heavy bounding box.

Gridlines should help spatial judgment without becoming the dominant
visual element.

## 9.3 Data points

Points must remain large enough for projection in a classroom and direct
manipulation.

Suggested diameter:

``` text
10–14px
```

Selected/interactive points may be slightly larger.

## 9.4 Direct manipulation

When supported:

-   clicking empty plot space adds/moves a point;
-   selected point receives a clear persistent selection state;
-   cursor communicates click/drag capability;
-   dragging must not be the only available way to perform an essential
    interaction.

## 9.5 Animation

Animation exists to explain state transition.

Good animation:

-   centroid moves from old mean to new mean;
-   gradient-descent point travels to next parameter value;
-   decision-tree inference path highlights one node after another.

Bad animation:

-   panels floating in on every click;
-   bouncing buttons;
-   decorative chart entrance animations.

Recommended transition duration:

``` text
250–500ms
```

Algorithm transitions may be slower during Auto Run if that improves
explanation.

Respect `prefers-reduced-motion`.

------------------------------------------------------------------------

# 10. Metrics

Metrics should sit near the visualization, not in a row of generic
dashboard cards.

Example:

``` text
Iteration        Current step          WCSS
3                Update centroids      124.8 ↓
```

Use alignment and spacing rather than three separate floating cards.

When a metric changes, a subtle textual indicator may show direction if
meaningful.

Do not animate numbers theatrically.

------------------------------------------------------------------------

# 11. What's Happening?

This is a key teaching component.

Visual treatment:

``` text
WHAT'S HAPPENING?

Centroid 2 moved toward the mean position of the
points currently assigned to Cluster 2.
```

It should generally use plain text on the page, perhaps separated by a
thin top rule.

Do not turn this into:

-   chatbot bubbles;
-   AI assistant cards;
-   speech bubbles;
-   glowing "insight" panels.

The explanation is part of the teaching interface, not an AI feature.

------------------------------------------------------------------------

# 12. Formula Section

Formula appears below contextual explanation.

Example:

``` text
CENTROID UPDATE

μₖ = (1 / |Cₖ|) Σ xᵢ

The centroid is the mean position of all points
currently assigned to cluster k.
```

Use proper mathematical symbols where browser support allows.

Keep derivations out of V1.

------------------------------------------------------------------------

# 13. Fit / Training vs Inference Language

This distinction should be visually and linguistically consistent across
relevant modules.

Recommended labels:

``` text
Training
Inference
```

or actions:

``` text
Fit Model
Predict Point
```

Do not mix inconsistent terminology such as Train / Test / Simulation /
Try Model for the same conceptual distinction.

### Training data

Use normal class/cluster markers.

### Inference point

Use a consistent distinct symbol, preferably:

``` text
◆ or ★
```

with a small `New point` label when selected.

The same conceptual symbol should be reused across KNN, SVM, Decision
Tree, Logistic Regression, and K-Means where practical.

------------------------------------------------------------------------

# 14. Algorithm-Specific Design

## 14.1 Linear Regression

### Primary visual elements

-   observations;
-   regression line;
-   residual segments;
-   selected prediction point.

Residual lines should be visually lighter than the fitted line.

### Interaction sequence

1.  Default line and observations visible immediately.
2.  User adjusts slope/intercept.
3.  Line moves continuously.
4.  Residuals update.
5.  MSE updates.
6.  What's Happening? reflects whether the latest change
    increased/decreased error.
7.  Find Best Fit animates to the least-squares solution.

### Inference

New X is shown with a vertical guide to the fitted line and a labeled
`ŷ`.

------------------------------------------------------------------------

## 14.2 Gradient Descent

This playground should visually emphasize movement through optimization
space.

### Required states

-   start;
-   current position;
-   previous path;
-   next step direction;
-   optimum/reference;
-   converged/diverged.

History path should become visually quieter than the current point.

### Auto Run

Auto Run should visibly advance one iteration at a teaching-friendly
pace.

Recommended default:

``` text
~600–900ms per step
```

A speed control is optional and should only be added if classroom
testing shows it is needed.

### Divergence

Do not use dramatic red flashing.

Use a restrained warning and explain:

> Loss is increasing. The learning rate may be too large.

------------------------------------------------------------------------

## 14.3 Logistic Regression

Keep probability and classification visually connected.

When an inference point is selected, show:

``` text
Score       Probability       Threshold       Prediction
1.42   →       0.81      >       0.50     →    Class B
```

This should read as a process, not four KPI cards.

Decision boundary is strong enough to identify but should not obscure
observations.

------------------------------------------------------------------------

## 14.4 KNN

When a query point is placed:

-   query point uses inference marker;
-   K nearest observations receive rings/outlines;
-   non-neighbors become slightly quieter;
-   optional thin distance lines connect query point to selected
    neighbors.

Show voting compactly:

``` text
Nearest 5
Class A  ● ●
Class B  ● ● ●

Prediction → Class B
```

Avoid a large pie chart for voting.

------------------------------------------------------------------------

## 14.5 SVM

This should be one of the visually strongest playgrounds.

Visual hierarchy inside the plot:

1.  observations;
2.  decision boundary;
3.  margins;
4.  support-vector rings;
5.  inference point when present.

Suggested line semantics:

``` text
Decision boundary → solid
Margins           → dashed
```

Support vectors use an outer ring rather than a completely different
color.

### C interaction

C control should be positioned close enough to the plot that changing it
feels directly connected to margin behavior.

Do not imply that C always causes a monotonic visual margin change for
every arbitrary dataset. Teaching datasets should be designed so the
intended trade-off is observable.

------------------------------------------------------------------------

## 14.6 Decision Tree

Desktop uses a linked two-panel visualization:

``` text
┌───────────────────────────┬───────────────────────────┐
│ DATA SPACE                │ TREE                      │
│                           │                           │
│ ● ● │ ○ ○                 │        x1 < 4.2?         │
│ ● ● │ ○ ○                 │        /      \          │
│ ────┼────                 │      leaf    x2 < 2.8?   │
│ ● ● │ ○ ○                 │               /    \     │
│                           │             leaf   leaf   │
└───────────────────────────┴───────────────────────────┘
```

Avoid making each side a decorative card. They are two coordinated views
inside one visualization region.

### Node selection

Selected tree node:

-   receives a restrained outline/background;
-   highlights corresponding region/split in data space.

### Inference

When predicting a point:

1.  inference point appears in data space;
2.  root node highlights;
3.  selected branch highlights;
4.  next node highlights;
5.  leaf highlights;
6.  prediction appears.

Animation should be slow enough to narrate.

------------------------------------------------------------------------

## 14.7 K-Means

K-Means needs the clearest state-machine design in V1.

### Top controls

``` text
K  [ 2  3  4  5 ]

[ Randomize Centroids ] [ Restart Same Data ]
```

### Algorithm transport

``` text
← Previous       Next Step →       ▶ Auto Run
```

### Phase indicator

Do not use a large multi-step wizard.

Use compact text:

``` text
Iteration 3 · Update Centroids
```

Optionally show the cycle subtly:

``` text
Assign Points  →  Update Centroids
                    ^ current
```

### Centroids

Centroids must not look like ordinary observations.

Recommended symbol:

``` text
×
```

with heavier stroke.

Previous centroid position:

-   hollow/low-opacity `×`;
-   thin movement line from old to new position.

### Assign Points phase

Cluster colors update only after assignment is committed.

If an observation is selected, show distance to each centroid in a
compact local detail area.

### Update Centroids phase

Animate centroid movement.

Do not animate all observations unnecessarily.

### WCSS

Place WCSS near iteration/phase status:

``` text
Iteration 3       Update Centroids       WCSS 124.8
```

### Convergence

On convergence:

``` text
✓ Converged after 6 iterations
```

Use a restrained success state, not confetti.

Then make **Inference** available.

### Inference mode

Mode switch:

``` text
[ Training | Inference ]
```

Instruction:

> Click the plot to place a new point.

New point uses the shared inference symbol.

When placed:

-   centroids remain fixed;
-   thin lines may connect the new point to all centroids;
-   nearest line becomes visually stronger;
-   distances are listed;
-   assigned cluster is shown.

Example:

``` text
NEW POINT (5.2, 4.7)

Centroid 1     4.21
Centroid 2     1.37   ← nearest
Centroid 3     3.82

Assigned to Cluster 2
```

This state must make it visually obvious that no centroid moved.

------------------------------------------------------------------------

# 15. Teaching Dataset Design

Default datasets are part of the product design.

They should not be purely random on first load.

Each playground should open with a carefully selected dataset that
demonstrates its core concept.

Examples:

-   Linear Regression: visible positive trend with imperfect residuals.
-   Logistic Regression: mostly separable classes with useful
    probability ambiguity near boundary.
-   KNN: local neighborhood where changing K can alter a prediction.
-   SVM: dataset where support vectors and the C trade-off are visible.
-   Decision Tree: geometry requiring multiple meaningful axis-aligned
    splits.
-   K-Means: three visually plausible groups with centroid movement
    across several iterations.

`Randomize Data` is secondary.

The first-load experience must always be pedagogically useful.

------------------------------------------------------------------------

# 16. Empty, Stale, and Error States

## Model stale

If training data changes after fitting:

``` text
Training data changed.
Fit the model again to update the boundary.
```

Inference is temporarily disabled.

## Invalid K

Clamp or prevent invalid values instead of showing an error after the
fact.

## K-Means empty cluster

Explain the chosen deterministic recovery behavior.

Do not silently produce NaN centroid coordinates.

## Gradient divergence

Stop bounded Auto Run and show a concise warning.

------------------------------------------------------------------------

# 17. Classroom / Presentation Considerations

The application should work well when projected.

Therefore:

-   important point markers cannot be tiny;
-   primary labels need adequate contrast;
-   hover must never be required to understand a state;
-   key values should remain visible without tooltips;
-   interactions should be usable with a mouse/trackpad from a distance;
-   reset should be quick and reliable;
-   the page should not unexpectedly scroll during an algorithm
    animation.

A dedicated presentation mode is not required in V1, but the base layout
should already be presentation-friendly.

------------------------------------------------------------------------

# 18. Responsive Rules

## ≥ 1024px

-   persistent sidebar;
-   controls can use horizontal rows;
-   large visualization;
-   Decision Tree uses side-by-side linked views.

## 768--1023px

-   collapsible sidebar;
-   controls may wrap;
-   visualization remains primary.

## \< 768px

-   drawer navigation;
-   controls stack;
-   metrics wrap;
-   Decision Tree views stack vertically;
-   no horizontal page overflow.

Mobile support is functional, but V1 design decisions should prioritize
laptop/projector teaching.

------------------------------------------------------------------------

# 19. Interaction Feedback

Use subtle feedback.

Allowed:

-   active control state;
-   selected point outline;
-   short algorithm transition;
-   small state label change;
-   cursor changes;
-   concise inline status.

Avoid:

-   toast notifications for normal algorithm actions;
-   celebratory animations;
-   modal dialogs for ordinary actions;
-   excessive hover transformations;
-   scale-on-hover buttons.

------------------------------------------------------------------------

# 20. Accessibility Details

-   Native buttons, inputs, ranges, and selects wherever possible.
-   Every slider has a programmatic and visible label.
-   Plot interactions should have a non-pointer alternative when
    necessary.
-   Do not encode class identity solely by color.
-   Focus outlines must remain visible.
-   Auto Run has Pause.
-   Respect reduced motion.
-   Text remains legible at browser zoom.
-   SVG elements used interactively receive appropriate accessible
    labeling.

------------------------------------------------------------------------

# 21. Suggested Design Tokens

``` css
:root {
  --bg: #F7F7F5;
  --surface: #FFFFFF;
  --surface-subtle: #F1F1EE;

  --text: #171717;
  --text-secondary: #5F5F5A;
  --text-tertiary: #898983;

  --border: #D9D9D4;
  --border-strong: #B8B8B1;

  --accent: #2563EB;
  --accent-subtle: #EAF0FF;

  --danger: #B42318;
  --warning: #A15C00;
  --success: #287A4B;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  --sidebar-width: 232px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
}
```

Exact palette should be tested against the actual plots before
finalizing.

------------------------------------------------------------------------

# 22. Component Inventory

Keep the component vocabulary small.

Core components:

-   App Sidebar
-   Mobile Top Bar
-   Playground Header
-   Parameter Row
-   Range Control
-   Segmented Control
-   Primary Button
-   Secondary Button
-   Algorithm Transport
-   Plot / Visualization Surface
-   Metric Strip
-   State/Phase Label
-   What's Happening Section
-   Formula Section
-   Inline Warning
-   Point Detail
-   Inference Detail

Do not create a bespoke visual component for every piece of text.

------------------------------------------------------------------------

# 23. Implementation Guidance

Prefer:

-   semantic HTML for application structure;
-   CSS Grid/Flexbox for layout;
-   CSS custom properties for tokens;
-   SVG for most 2D algorithm visualizations;
-   vanilla JavaScript modules;
-   requestAnimationFrame/CSS transitions for bounded animations.

SVG is preferred over Canvas for most V1 modules because:

-   individual points/nodes remain addressable;
-   accessibility is easier;
-   labels and selections are easier;
-   classroom-scale diagrams are relatively small;
-   debugging is simpler.

D3 may be used for:

-   scales;
-   axes;
-   coordinate transforms;
-   transitions;
-   tree layout.

Do not let D3 own algorithm logic. The model calculations should remain
separated from rendering.

Recommended separation:

``` text
Algorithm logic
      ↓
Serializable state
      ↓
Visualization renderer
      ↓
DOM / SVG
```

This makes step-back, reset, testing, and explanation generation
substantially easier.

------------------------------------------------------------------------

# 24. Animation State Architecture

Iterative playgrounds should update through explicit state snapshots.

Example K-Means:

``` js
{
  iteration: 3,
  phase: "update",
  points: [...],
  centroids: [...],
  previousCentroids: [...],
  assignments: [...],
  inertia: 124.8,
  converged: false
}
```

Store bounded snapshots for **Previous Step**.

Do not attempt to reverse an animation mathematically.

Render the previous snapshot instead.

------------------------------------------------------------------------

# 25. Design QA Checklist

Before a playground is considered visually complete, verify:

### Hierarchy

-   Is the visualization the most prominent element?
-   Can the algorithm name and current state be found immediately?
-   Are controls clearly associated with their visual effect?

### Restraint

-   Is any card unnecessary?
-   Is any icon unnecessary?
-   Is any color decorative rather than semantic?
-   Is any animation decorative?
-   Is any rounded container unnecessarily pill-shaped?

### Teaching

-   Can the instructor explain the concept without relying on hover?
-   Is the current algorithm phase obvious?
-   Can a learner see why the output changed?
-   Are training and inference visually distinct?

### Accuracy

-   Does the graphic match the underlying numerical state?
-   Do labels and formulas use correct terminology?
-   Are algorithm-specific edge cases handled?

### Projection

-   Are points, lines, labels, and metrics readable on a classroom
    display?
-   Is contrast sufficient?
-   Does the important information survive when viewed from several
    meters away?

### Responsiveness

-   Does the visualization resize without distortion?
-   Does navigation remain usable?
-   Is there no page-level horizontal overflow?

------------------------------------------------------------------------

# 26. Reference Screen Philosophy

When implementing the first playground, do not begin by building a
universal dashboard shell full of generic components.

Start with **Linear Regression as the reference screen**.

Make that screen excellent first:

1.  sidebar;
2.  header;
3.  controls;
4.  plot;
5.  metric strip;
6.  What's Happening?;
7.  formula.

Then extract only the patterns genuinely shared by the other
playgrounds.

This prevents premature componentization and reduces the generic
"template" appearance that often causes AI-generated interfaces to feel
interchangeable.

------------------------------------------------------------------------

# 27. V1 Visual Definition of Done

The design is ready when:

-   all seven algorithms fit naturally into one visual system;
-   the interface feels like one teaching instrument rather than seven
    mini websites;
-   no primary concept depends on hover;
-   iterative state changes are visually understandable;
-   training and inference are consistently distinguished;
-   K-Means centroid movement is clear;
-   Decision Tree's data-space/tree relationship is clear;
-   SVM margin and support vectors are immediately identifiable;
-   the interface remains calm despite interactive complexity;
-   there are no gratuitous gradients, glass panels, oversized cards,
    fake metrics, decorative AI motifs, or generic SaaS hero patterns;
-   an instructor can project the application and begin teaching with
    minimal UI explanation.

------------------------------------------------------------------------

## Final Design Principle

> **The interface should look designed around the mathematics, not like
> mathematics placed inside a dashboard template.**

When deciding between visual polish and conceptual clarity, choose
conceptual clarity.
