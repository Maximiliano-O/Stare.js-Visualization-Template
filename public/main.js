"use strict";

import stare from "../lib/index.js";
import data1 from './data1.json';

(function () {
  const library = document.querySelector("#library");
  const query = document.querySelector("#query");
  const visualization = document.querySelector("#visualization");
  const visualizeBtn = document.querySelector("#visualizeBtn");
  const canvas = document.querySelector("#canvas");

  const visualize = () => {
    const data = data1;
    console.log("Fetched Data:", data);

    if (!data) {
      alert("No data to visualize, you must do a query first");
      return;
    }

    const chart = stare(library.value, visualization.value);

    if (chart) {
      document.querySelector("#canvas").innerHTML = "";

      if (visualization.value === "grid") {
        chart("#canvas", data, {});
      } else if (
        visualization.value === "tiles" ||
        visualization.value === "tiles3"
      ) {
        data.documents.forEach((v, i) => {
          let div = document.createElement("div");
          div.setAttribute("class", "svg-tiles");
          let svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );
          svg.setAttribute("id", "svg-" + i);
          div.appendChild(svg);
          canvas.appendChild(div);
          chart("#svg-" + i, v, {});
        });
      } else {
        let svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        svg.setAttribute("id", "svg");
        canvas.appendChild(svg);
        chart("#svg", data, {});
      }
    }
  };

  visualizeBtn.onclick = () => visualize();
})();
