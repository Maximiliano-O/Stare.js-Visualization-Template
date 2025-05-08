# Stare.js-Visualization-Template
StArE.js Template to upload visualizations to the StArE.js Showcase, this is both a template and demo to run a visualization.

This Template is based on [stare.js-client made by d-salazar-se](https://github.com/StArE-js/stare.js-client)

To be more precise it takes the contents of the examples folder, 
adds the lib folder, which contains visualization files and modifies the
way main.js works, instead of doing a search request towards stare.js-server,
it loads the search result example from response.json.

The idea is for this to be as self-contained as possible, so is easy to run
locally, play around with a visualization during dev and then simplify the
process of sharing it on the showcase site.

## Installation

```bash
npm install
```
## How to use

```bash
npm run start
```

Now you can point your browser to

```
http://localhost:3000/
```