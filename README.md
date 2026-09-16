# ML Visual Lab

ML Visual Lab is an interactive web application for learning core machine-learning concepts through 2D visualizations. Users can adjust parameters, run fitting or training steps, observe changes in plots and metrics, and try predictions on new data points.

The application is designed for classroom teaching, workshops, and self-directed learning. Its goal is to make the mechanics behind each algorithm easier to understand—not to replace production machine-learning libraries such as scikit-learn.

## Features

Available playgrounds:

- **Linear Regression** — adjust the slope and intercept, inspect residuals and MSE, and calculate the ordinary least-squares best fit.
- **Logistic Regression** — explore scores, the sigmoid function, probabilities, thresholds, decision boundaries, and inference.
- **K-Nearest Neighbors** — select `K`, move the query point, and inspect the vote from the nearest neighbors.
- **Linear SVM** — adjust the penalty `C`, view the decision boundary and margin, identify support vectors, and predict new points.
- **Decision Tree** — select the maximum depth, build Gini-based splits, connect the data space to the tree view, and follow an inference path.
- **AdaBoost** — train weighted decision stumps step by step, inspect misclassified observations and stump importance, then combine the stumps with a weighted vote.
- **K-Means** — run the initialize → assign → update phases step by step, monitor WCSS and centroid movement, and try inference after convergence.

Shared interface features:

- responsive SVG visualizations;
- sidebar with playground search;
- URL hash navigation, such as `#knn`;
- a navigation drawer on small screens;
- keyboard-accessible controls;
- state-based dynamic explanations;
- explicit algorithm phases with Previous, Next Step, and bounded Auto Run/Pause where iterative teaching benefits from them;
- `prefers-reduced-motion` support for reducing non-essential animations.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript with ES modules
- SVG for plots and diagrams

There is no backend, database, authentication, Python runtime, build system, or third-party dependency. The application uses small teaching datasets defined directly in the source code. AdaBoost is implemented directly in browser-side JavaScript with depth-1 decision stumps; it does not use Gradient Boosting, Random Forest, or XGBoost.

## Running locally

Because the application uses ES modules, run it through a local web server so that all modules load correctly.

### Option 1: Python

Make sure Python 3 is installed, then run this command from the repository root:

```bash
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in a browser.

### Option 2: XAMPP

1. Place this repository in `htdocs/mlviz`.
2. Start Apache from the XAMPP Control Panel.
3. Open [http://localhost/mlviz/](http://localhost/mlviz/).

### Option 3: PHP built-in server

If PHP is available:

```bash
php -S localhost:8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Repository structure

```text
.
├── index.html                    # Application shell and markup for all playgrounds
├── favicon.svg                   # Minimal ML Visual Lab browser icon
├── css/
│   └── app.css                   # Design tokens, layout, responsive UI, and SVG styling
├── js/
│   ├── app.js                    # Navigation, search, drawer, and playground bootstrap
│   ├── core/
│   │   ├── math.js               # Shared mathematical functions
│   │   ├── adaboost.js           # Weighted stump search, updates, and ensemble voting
│   │   └── plot.js               # SVG scale, frame, tick, and text helpers
│   └── playgrounds/
│       ├── linear-regression.js
│       ├── logistic-regression.js
│       ├── knn.js
│       ├── svm.js
│       ├── decision-tree.js
│       ├── adaboost.js
│       └── k-means.js
├── PRD_ML_Visual_Lab_V1.md       # Product requirements
├── design_ML_Visual_Lab_V1.md    # Design specification
└── task.md                       # Roadmap and verification notes
```

Each playground separates state, algorithm logic, and SVG rendering as appropriate. `js/app.js` handles the application shell and connects the HTML elements to the playground modules.

## Syntax validation

There is no dedicated test runner or build process. To check the syntax of all JavaScript files with Node.js:

```powershell
Get-ChildItem .\js -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

After changing the UI or interactions, run a browser smoke test to confirm that navigation, controls, plots, inference, and responsive layouts still work as expected.

The current quality pass also verifies the XAMPP-served page at `1920×1080` and a `390×844` mobile viewport. The AdaBoost teaching sequence starts with equal sample weights, makes misclassified points more prominent, and ends with a fixed weighted-vote inference mode.

## V1 limitations

- Datasets cannot be uploaded or replaced through the UI.
- The datasets are small and designed for concept demonstrations.
- There is no progress persistence, user account, or model export.
- The implementation is intended for conceptual learning, not production model training or large-scale scientific evaluation.
- Gradient Descent is not included in the current V1 navigation or build.

## License

No open-source license has been specified for this repository yet.
