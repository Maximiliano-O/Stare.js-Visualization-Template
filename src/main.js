"use strict";

import bubble from "./visualizations/bubble.js";
import network from "./visualizations/network.js";
import treemap from "./visualizations/treemap.js";
import verticalNetwork from "./visualizations/verticalnetwork.js";
import data10 from './response/data10.json';
import data50 from './response/data50.json';
import data100 from './response/data100.json';


(function () {
  const chartSelector = document.querySelector("#chart");
  const chartsMap = { bubble, network, treemap, verticalNetwork };
  const dataset = document.querySelector("#dataset");
  const visualizeBtn = document.querySelector("#visualizeBtn");
  const canvas = document.querySelector("#canvas");

  const visualize = () => {
    let data;
    if (dataset.value === "data10") data = data10;
    else if (dataset.value === "data50") data = data50;
    else data = data100;

    if (!data) {
      alert("No data to visualize, you must do a query first");
      return;
    }

    const chartFunc = chartsMap[chartSelector.value];
    if (!chartFunc) {
      alert("No chart selected or chart function not found");
      return;
    }
    

    canvas.innerHTML = "";
    if (chartSelector.value === "verticalNetwork") {
      chartFunc("#canvas", data, {});
    } else {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("id", "svg");
      svg.setAttribute("width", canvas.clientWidth);
      svg.setAttribute("height", canvas.clientHeight);
      canvas.appendChild(svg);

      chartFunc("#svg", data, {});
}
  };

  visualizeBtn.addEventListener("click", visualize);

  window.onload = visualize;
})();

