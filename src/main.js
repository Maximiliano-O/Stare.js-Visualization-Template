"use strict";

//import chart from "../visualization/my-visualization.js";
import chart from "../visualization/bubble.js";
import data1 from './response/data1.json';
import data10 from './response/data10.json';
import data50 from './response/data50.json';
import data100 from './response/data100.json';

(function () {
  const dataset = document.querySelector("#dataset");
  const visualizeBtn = document.querySelector("#visualizeBtn");
  const canvas = document.querySelector("#canvas");

  const visualize = () => {
    console.log("Dataset: ", dataset.value)
    let data;
    if(dataset.value == 'data10'){
      data = data10;
    } else if(dataset.value == 'data50'){
      data = data50;
    } else {
      data = data100;
    }
    console.log("Fetched Data:", data);

    if (!data) {
      alert("No data to visualize, you must do a query first");
      return;
    }

    if (chart) {
      document.querySelector("#canvas").innerHTML = "";
      let svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svg.setAttribute("id", "svg");
      canvas.appendChild(svg);
      chart("#svg", data, {});
    }
  };

  visualizeBtn.onclick = () => visualize();
})();
