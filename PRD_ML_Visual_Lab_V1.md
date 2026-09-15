# PRD --- ML Visual Lab

**Status:** Draft V1\
**Product type:** Interactive educational web application\
**Platform:** Web, desktop-first and responsive\
**Technology constraint:** HTML, CSS, and JavaScript only; no
Python/backend required for V1

## 1. Product Overview

ML Visual Lab is an interactive machine-learning visualization
application designed primarily as a teaching aid. Instead of only
showing formulas, code, or final model outputs, the application lets
learners manipulate parameters and observe how machine-learning
algorithms work step by step.

The product is not intended to replace scikit-learn, notebooks, or a
full machine-learning platform. V1 focuses on conceptual understanding
through small, controlled 2D datasets and interactive visualizations.

Core learning loop:

**Play → Observe → Explain**

Users manipulate a parameter or algorithm step, observe the
visualization change, and receive a concise explanation of what is
happening.

## 2. Problem Statement

Machine-learning concepts are often taught through formulas and code.
This creates several recurring problems:

-   Learners can run an algorithm without understanding what happens
    internally.
-   Concepts such as residuals, decision boundaries, margins, nearest
    neighbors, centroid updates, and gradient descent are difficult to
    imagine from formulas alone.
-   Libraries abstract important steps behind methods such as `fit()`
    and `predict()`.
-   During live teaching, instructors often need notebooks, slides,
    drawings, and code simultaneously to explain one concept.

ML Visual Lab provides a browser-based visual environment where these
concepts can be demonstrated interactively without requiring Python or a
notebook environment.

## 3. Goals

V1 must:

1.  Help an instructor visually explain the mechanics of core ML
    algorithms.
2.  Allow users to manipulate meaningful model parameters.
3.  Show algorithm changes in real time or step by step.
4.  Clearly distinguish fitting/training from prediction/inference where
    applicable.
5.  Run entirely in a modern browser.
6.  Require no login, backend, database, or Python installation.
7.  Be practical for live classroom presentation.

## 4. Non-Goals

V1 will not provide:

-   production ML training;
-   arbitrary CSV/Excel upload;
-   large datasets;
-   Python execution;
-   backend APIs;
-   user accounts;
-   saved learning progress;
-   quizzes or LMS features;
-   AI-generated explanations;
-   model export;
-   RBF/kernel SVM;
-   Random Forest;
-   DBSCAN;
-   PCA;
-   neural networks;
-   ROC/AUC or full model-evaluation suite;
-   class-imbalance playground;
-   custom course authoring.

These may be considered after the teaching experience of the core
playgrounds is validated.

## 5. Target Users

### Primary

Instructors, lecturers, trainers, and mentors teaching introductory
machine learning.

### Secondary

Students and self-learners who want to understand ML algorithms visually
before or alongside implementation in Python.

## 6. Product Principles

### Visualization first

The main visualization must dominate the page. UI decoration must not
compete with the concept being demonstrated.

### Show the process, not only the answer

Where an algorithm is iterative, users must be able to inspect
meaningful intermediate states.

### Interactions must have teaching value

Controls should correspond to concepts worth explaining. Avoid exposing
parameters merely because an implementation supports them.

### Progressive complexity

The default state must immediately demonstrate the basic concept. More
detailed information may be shown contextually.

### Explain the current state

Each playground includes a dynamic **What's Happening?** explanation
based on the current interaction or algorithm state.

### Fit vs Predict

Where applicable, the application should make the difference between
learning model parameters and using the fitted model on unseen points
explicit.

## 7. Information Architecture

Desktop navigation uses a persistent left sidebar.

``` text
ML VISUAL LAB

Search visualizations

REGRESSION
  Linear Regression

OPTIMIZATION
  Gradient Descent

CLASSIFICATION
  Logistic Regression
  K-Nearest Neighbors
  Support Vector Machine
  Decision Tree

CLUSTERING
  K-Means
```

Only implemented V1 modules should appear. Do not show a long list of
disabled "coming soon" modules.

On narrow/mobile screens, the sidebar becomes a drawer.

## 8. Shared Playground Structure

Each module should follow a recognizable structure:

``` text
Algorithm Name
Short learning objective

Interactive Controls

Main Visualization

Current State / Key Metrics

What's Happening?
Dynamic contextual explanation

Formula / Concept
Relevant mathematical definition
```

Shared actions may include **Reset**, **Randomize Data**, **Step**,
**Auto Run**, and **Predict**, but only when meaningful to that
algorithm.

The exact UI does not need to be mechanically identical across
algorithms.

------------------------------------------------------------------------

# 9. V1 Playground Requirements

## 9.1 Linear Regression

### Learning objective

Understand how slope and intercept define a regression line and how
residuals contribute to mean squared error.

### Visualization

-   2D scatter plot.
-   Regression line.
-   Residual lines from observations to predictions.
-   Axes and readable coordinates.

### Controls

-   Slope `m`.
-   Intercept `b`.
-   Reset.
-   Find Best Fit.
-   Optional predefined/randomized teaching dataset.

### Dynamic metrics

-   Current slope.
-   Current intercept.
-   MSE.

### Behavior

Changing slope or intercept updates the regression line, residuals, and
MSE immediately.

**Find Best Fit** calculates the ordinary least-squares solution in
JavaScript and updates the visualization.

### Inference

After a fitted line is available, the user can provide/select a new X
value and see:

-   the new input on the plot;
-   predicted `ŷ`;
-   its projection onto the regression line.

### Concepts

-   `ŷ = mx + b`
-   residual;
-   squared error;
-   MSE;
-   best-fit line;
-   fitting versus prediction.

------------------------------------------------------------------------

## 9.2 Gradient Descent

### Learning objective

Understand how iterative optimization moves model parameters toward a
lower-loss solution and how learning rate affects convergence.

### Visualization

A clear loss curve or simple loss landscape showing:

-   current parameter position;
-   direction/size of the next update;
-   path/history of previous steps;
-   minimum/reference optimum when pedagogically appropriate.

### Controls

-   Learning rate.
-   Step.
-   Auto Run / Pause.
-   Reset.

### Dynamic metrics

-   Iteration.
-   Current parameter value(s).
-   Gradient.
-   Current loss.

### Behavior

**Step** performs one optimization update.

**Auto Run** repeatedly executes bounded steps with visible animation
until convergence, pause, maximum iteration, or divergence.

The playground must make the following behaviors observable:

-   learning rate too small → slow convergence;
-   reasonable learning rate → stable convergence;
-   learning rate too large → overshooting and potentially divergence.

### Dynamic explanation

The What's Happening? section should recognize these broad conditions
and explain them concisely.

------------------------------------------------------------------------

## 9.3 Logistic Regression

### Learning objective

Understand how a linear score is converted into probability and then
into a classification using a threshold.

### Visualization

-   Two-class 2D dataset.
-   Decision boundary.
-   Class regions where practical.
-   Selected/new point and its predicted probability.

### Controls

-   Relevant weights/bias or simplified boundary controls.
-   Classification threshold.
-   Reset.
-   Fit/Best Fit if the V1 implementation supports browser-side
    optimization.

### Dynamic metrics

-   Threshold.
-   Probability for selected inference point.
-   Predicted class.

### Inference

User can add/select a new point after fitting.

Display the conceptual pipeline:

`linear score → sigmoid → probability → threshold → predicted class`

The inference point must not automatically retrain the model.

### Concepts

-   sigmoid;
-   probability;
-   threshold;
-   decision boundary;
-   fitting versus inference.

------------------------------------------------------------------------

## 9.4 K-Nearest Neighbors

### Learning objective

Understand how KNN classifies a new observation based on nearby labeled
examples.

### Visualization

-   Two-class 2D training points.
-   Query/inference point.
-   Highlighted K nearest neighbors.
-   Distance/radius cues where useful.

### Controls

-   K selector.
-   Add/move query point.
-   Reset.
-   Randomize Data.

### Dynamic metrics

-   K.  
-   Neighbor class counts.
-   Predicted class.

### Inference

Clicking the plot in inference mode creates or moves a query point.

The application:

1.  calculates distance from the query point to training observations;
2.  identifies the K nearest observations;
3.  highlights them;
4.  performs majority voting;
5.  displays the prediction.

Adding an inference point must not alter the training dataset.

### Edge cases

A deterministic tie-breaking rule must be defined and communicated when
relevant.

------------------------------------------------------------------------

## 9.5 Support Vector Machine

### Learning objective

Understand maximum-margin classification, support vectors, soft-margin
behavior, and the role of C.

### V1 constraint

**Linear SVM only.** RBF and other kernels are out of scope.

### Visualization

-   Two-class 2D dataset.
-   Linear decision boundary/hyperplane.
-   Margin boundaries.
-   Visually distinct support vectors.
-   Inference point when used.

### Controls

-   C.  
-   Fit/Reset.
-   Randomize Data where appropriate.
-   Add/select inference point.

### Dynamic metrics

-   C.  
-   Margin-related information where reliably computed.
-   Number of support vectors.
-   Prediction for the inference point.

### Behavior

Changing C and refitting should make the trade-off between wider
margin/tolerance and stronger training-error penalty observable on
suitable teaching datasets.

### Inference

After fitting, the user can add a new point and see:

-   which side of the hyperplane it falls on;
-   predicted class;
-   its position relative to the decision boundary.

Inference must not refit the SVM.

### Concepts

-   hyperplane;
-   margin;
-   support vectors;
-   soft margin;
-   regularization parameter C;
-   fit versus predict.

------------------------------------------------------------------------

## 9.6 Decision Tree

### Learning objective

Understand how a decision tree recursively divides feature space and how
an observation travels through the resulting tree.

### Visualization

The playground should show two linked views:

1.  **Data Space** --- 2D observations and current decision splits.
2.  **Tree View** --- nodes, split conditions, branches, and leaves.

Selecting a tree node should make its corresponding split/region
understandable in the data-space view.

### Controls

-   Max depth.
-   Step/build progression if feasible.
-   Reset.
-   Randomize Data.
-   Inference point.

### Dynamic metrics

For the active node/split:

-   split feature;
-   threshold;
-   Gini impurity;
-   sample count where useful.

### Inference

After the tree is fitted, adding a new point should:

1.  display the point in data space;
2.  highlight the root node;
3.  visually follow the decision path;
4.  end at a leaf;
5.  display the predicted class.

This is a key V1 teaching interaction.

### Concepts

-   recursive splitting;
-   Gini impurity;
-   feature threshold;
-   max depth;
-   leaf;
-   decision path;
-   over-complex trees as an introduction to overfitting.

------------------------------------------------------------------------

## 9.7 K-Means

### Learning objective

Understand K-Means as an iterative process of assigning observations to
the nearest centroid and recomputing centroid positions.

### Visualization

-   2D unlabeled dataset.
-   Distinct cluster assignments.
-   Clearly distinguishable centroids.
-   Previous centroid positions/movement during update steps.
-   Optional distance lines during assignment/inference when they
    improve explanation.

### Controls

-   K selector, V1 range: 2--5.
-   Randomize Centroids.
-   Restart with Same Data.
-   Reset.
-   Previous Step.
-   Next Step.
-   Auto Run / Pause.
-   Training / Inference mode after convergence.

### Algorithm state machine

The teaching sequence must explicitly represent:

`Initialize Centroids → Assign Points → Update Centroids → Assign Points → ... → Converged`

A single **Next Step** should advance one meaningful teaching phase
rather than hiding a complete iteration.

### Assign Points phase

For each training point, assign it to the nearest centroid.

When a point is selected, the UI may show its distance to each centroid
and identify the minimum.

### Update Centroids phase

Recalculate each centroid as the mean position of its assigned
observations.

The UI should show:

-   previous centroid location;
-   new centroid location;
-   movement direction/distance.

Centroid movement should be animated when motion is enabled.

### Dynamic metrics

-   Iteration.
-   Current phase.
-   K.  
-   WCSS/inertia.
-   Centroid movement.
-   Convergence state.

### Previous Step

The application stores bounded state history so the instructor can move
backward through recent algorithm phases without recomputing an
ambiguous state.

### Convergence

A clear visual indicator is shown when centroids no longer move beyond
the chosen tolerance or assignments stabilize.

### Inference Mode

After convergence, users can switch to **Inference** and click the plot
to create a new point.

For the new point, the application:

1.  calculates distance to every fitted centroid;
2.  shows the distances;
3.  identifies the nearest centroid;
4.  assigns the point to that cluster;
5.  visually emphasizes the nearest-centroid relationship.

Conceptually:

`predicted cluster = arg min distance(new point, centroid k)`

### Critical behavior

Centroids are **fixed during inference**.

The UI must explicitly distinguish:

**Training point** --- becomes part of the dataset and requires
clustering to be run/refit.

**Inference point** --- is assigned using existing centroids and does
not change centroid positions.

### Initial-centroid demonstration

**Restart with Same Data** preserves observations but changes initial
centroids. This allows instructors to demonstrate sensitivity to
initialization.

------------------------------------------------------------------------

# 10. Data Interaction

V1 uses small synthetic/predefined 2D datasets optimized for
explanation.

Depending on the module, users may be allowed to:

-   randomize a dataset;
-   add training points;
-   remove training points;
-   add/move an inference point.

Any interaction that changes training data must visibly mark the fitted
model as stale and require/retrigger fitting as appropriate.

Inference observations must remain visually distinct from training
observations.

## 11. Dynamic Explanation System

Each playground contains **What's Happening?**

This is rule-based JavaScript, not AI-generated text.

Examples:

-   Linear Regression: "Increasing the slope moved the line closer to
    several points, reducing MSE."
-   Gradient Descent: "The learning rate is causing the optimizer to
    overshoot the minimum."
-   KNN: "Three of the five nearest neighbors belong to Class B."
-   SVM: "These points are closest to the margin and act as support
    vectors."
-   K-Means: "Centroid 2 moved toward the mean position of its assigned
    points."

Explanations should describe observable state and avoid claiming causal
interpretations that cannot be determined reliably from the current
state.

## 12. Formula Display

Each module provides the minimum mathematics needed to connect the
visual behavior with the formal concept.

Formulas should:

-   use readable mathematical notation;
-   define symbols;
-   remain secondary to the visualization;
-   update values dynamically when this adds teaching value.

The application is not intended to be a mathematical derivation
textbook.

## 13. Visual and UX Direction

Desired character:

-   clean;
-   minimal;
-   technical/scientific;
-   presentation-friendly;
-   generous whitespace;
-   strong chart readability;
-   restrained use of accent colors;
-   minimal unnecessary cards or decorative elements.

Avoid generic AI-generated SaaS aesthetics, excessive gradients,
glassmorphism, decorative metrics, and dashboard clutter.

The visualization should remain the visual focal point.

## 14. Responsive Behavior

### Desktop

Persistent sidebar and large visualization area. This is the primary
teaching experience.

### Tablet

Sidebar may collapse while retaining comfortable visualization controls.

### Mobile

Navigation becomes a drawer. Controls stack vertically. Visualizations
remain functional, although desktop/tablet is the primary presentation
target.

## 15. Accessibility

V1 should include:

-   keyboard-accessible controls;
-   visible focus states;
-   labels for sliders and inputs;
-   sufficient contrast;
-   non-color cues for important states where possible;
-   pause controls for automatic animation;
-   support for reduced-motion preferences;
-   readable numerical values alongside purely visual representations.

## 16. Technical Requirements

### Stack

-   HTML5
-   CSS3
-   Vanilla JavaScript
-   SVG and/or Canvas for visualizations

A lightweight visualization library such as D3.js may be used if it
materially simplifies scales, axes, transitions, or interaction. Core ML
calculations should remain understandable and implemented locally rather
than delegating the educational logic to a black-box ML service.

### Architecture

All V1 computation runs client-side.

``` text
Browser
 ├── UI controls
 ├── Algorithm state
 ├── ML/math calculations
 ├── Visualization renderer
 └── Teaching/explanation rules
```

### No V1 dependencies on

-   Python;
-   Flask/FastAPI;
-   Node server at runtime;
-   database;
-   external ML API;
-   authentication.

The resulting build must be deployable as static files on ordinary
shared hosting.

## 17. Suggested Code Organization

``` text
ml-visual-lab/
├── index.html
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── core/
│   │   ├── math.js
│   │   ├── plot.js
│   │   └── state.js
│   └── playgrounds/
│       ├── linear-regression.js
│       ├── gradient-descent.js
│       ├── logistic-regression.js
│       ├── knn.js
│       ├── svm.js
│       ├── decision-tree.js
│       └── kmeans.js
└── assets/
```

Final organization may change during technical design.

## 18. State Requirements

Each playground owns its state independently.

State may include:

-   training dataset;
-   fitted parameters;
-   current algorithm phase;
-   selected point;
-   inference point;
-   visualization settings;
-   history for step-back functionality.

Reset must return the active playground to a valid deterministic default
state.

No persistence across browser sessions is required in V1.

## 19. Performance Requirements

Because datasets are intentionally small:

-   normal parameter interactions should feel immediate;
-   animations should remain smooth on typical modern laptops;
-   Auto Run loops must be bounded;
-   expensive work must not freeze the page;
-   visualization updates should avoid unnecessary full-page DOM
    reconstruction.

## 20. Error and Edge-Case Handling

The UI must gracefully handle educational edge cases such as:

-   K larger than available KNN training observations;
-   empty K-Means clusters;
-   identical centroid positions;
-   perfectly or poorly separable SVM datasets;
-   degenerate regression data;
-   tied KNN votes;
-   tree splits with no useful gain;
-   numerical divergence in Gradient Descent.

No interaction should expose `NaN`, `Infinity`, broken SVG, or an
unusable page.

## 21. Success Criteria

V1 is successful if an instructor can:

1.  open the application without setup;
2.  select an algorithm from the sidebar;
3.  manipulate its core parameters;
4.  show the resulting visual change immediately;
5.  step through iterative algorithms;
6.  explain key algorithm concepts using the visualization;
7.  demonstrate fit/training versus inference where relevant;
8.  reset the demonstration quickly for the next explanation.

A learner should be able to answer "what is the algorithm doing?" more
clearly after interacting with a playground.

## 22. V1 Definition of Done

V1 is considered complete when all seven playgrounds are functional:

-   Linear Regression
-   Gradient Descent
-   Logistic Regression
-   K-Nearest Neighbors
-   Linear Support Vector Machine
-   Decision Tree
-   K-Means

And when:

-   sidebar navigation works;
-   each playground has a useful default teaching state;
-   all primary controls work;
-   key metrics update correctly;
-   iterative algorithms support their specified step behavior;
-   relevant algorithms provide inference interactions;
-   K-Means clearly separates training and inference;
-   Decision Tree can visualize an inference decision path;
-   dynamic What's Happening? explanations work;
-   Reset is reliable;
-   responsive behavior is usable;
-   the project runs as static HTML/CSS/JS files without a backend.

## 23. Post-V1 Candidates

Potential future modules/features, subject to validation:

-   Polynomial Regression
-   RBF/kernel SVM
-   DBSCAN
-   PCA
-   Random Forest
-   bias--variance / overfitting
-   regularization
-   confusion matrix and classification threshold
-   ROC/AUC
-   class imbalance
-   neural-network forward/backpropagation visualization
-   custom dataset import
-   shareable playground state
-   presentation mode
-   instructor-created examples

These are explicitly not required for V1.
