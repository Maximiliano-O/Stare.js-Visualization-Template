"use strict";

import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { assign, get, isArray } from "lodash";

const defaultOptions = {
  labelField: "metrics.ranking",
  linksField: "metrics.links",
  mainNode: { color: 0xffa500, radius: 6 },
  targetNode: { color: 0x000000, radius: 4 },
  tooltip: {
    style: `
      position: absolute;
      padding: 4px;
      width: 300px;
      background-color: #f9f9f9;
      border: 1px solid #ccc;
      border-radius: 2px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      font-family: sans-serif;
      font-size: 13px;
      max-width: 300px;
      z-index: 1000;
    `,
  },
};

let camera, scene, renderer, controls, raycaster;
let tooltipDiv;
let nodes = [];
let links = [];
let hoveredNode = null;
let mouse = new THREE.Vector2();
let mouseScreen = { x: 0, y: 0 };
let nodeMap = {};
let allLinksMap = {};
let linkToDocsMap = {};

// --- TOOLTIP CONTENT ---
const tooltipContent = (item) => {
  if (!item) return "";
  if (item.type === "document") {
    const allLinks =
      item.data && item.data.metrics && Array.isArray(item.data.metrics.links)
        ? item.data.metrics.links.slice(1)
        : [];

    const displayedLinks = allLinks.slice(0, 7);
    const extra = allLinks.length > 7 ? "<li>...</li>" : "";
    return `
      <div><b>Ranking:</b> ${get(item, "data.metrics.ranking", "N/A")}</div>
      <div><b>Title:</b> ${item.data.title}</div>
      <div><b>Total Refs:</b> ${allLinks.length}</div>
      <div><b>Weight:</b> ${item.weight}</div>
      <ul>${displayedLinks.map((l) => `<li>${l}</li>`).join("")}${extra}</ul>
    `;
  } else if (item.type === "link") {
    const docs = item.linkedDocs || [];
    const displayedDocs = docs.slice(0, 7);
    const extra = docs.length > 7 ? "<li>...</li>" : "";
    return `
      <div><b>Link:</b> ${item.id}</div>
      <div><b>Referenced by:</b> ${docs.length} document(s)</div>
      <div><b>Weight:</b> ${item.weight}</div>
      <ul>${displayedDocs.map((d) => `<li>${d}</li>`).join("")}${extra}</ul>
    `;
  }
  return "";
};

// --- TOOLTIP HANDLERS ---
function createTooltip(tooltipConfig) {
  tooltipDiv = document.createElement("div");
  tooltipDiv.setAttribute("style", tooltipConfig.style);
  document.body.appendChild(tooltipDiv);
}

function showTooltip(node) {
  if (!node || !tooltipDiv) return;
  const data = node.userData;
  tooltipDiv.innerHTML = tooltipContent(data);
  tooltipDiv.style.display = "block";
  tooltipDiv.style.opacity = "1";
}

function hideTooltip() {
  if (tooltipDiv) {
    tooltipDiv.style.opacity = "0";
    tooltipDiv.style.display = "none";
  }
}

function updateTooltipPosition(node) {
  if (!tooltipDiv || !node) return;

  const vector = node.position.clone().project(camera);
  const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
  const y = (-vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;

  let offsetX = 10; // por defecto
  let offsetY = -30;

  if (node.userData.type === "document") {
    // Calculamos la media de las posiciones X de los links conectados
    const connectedLinks = links
      .filter((l) => l.source === node)
      .map((l) => l.target.position.x);

    if (connectedLinks.length > 0) {
      const avgLinkX =
        connectedLinks.reduce((sum, val) => sum + val, 0) /
        connectedLinks.length;
      // Si la mayoría de los links están a la derecha, colocamos tooltip a la izquierda, y viceversa
      offsetX = avgLinkX > node.position.x ? -tooltipDiv.clientWidth - 10 : 10;
    }
  }

  tooltipDiv.style.left = `${x + offsetX}px`;
  tooltipDiv.style.top = `${y + offsetY}px`;
}


// --- DATA PROCESS ---
function processData(data) {
  const formattedData = { links: [], nodes: [] };
  const linkCounts = {};
  allLinksMap = {};
  linkToDocsMap = {};
  const docTitleMap = {};

  // Collect documents
  data.forEach((doc) => {
    if (!isArray(doc.metrics.links)) return;
    const mainHost = doc.metrics.links[0];
    doc.weight = 0;
    docTitleMap[mainHost] = doc.title || mainHost;
    formattedData.nodes.push({ id: mainHost, type: "document", data: doc });
    allLinksMap[mainHost] = doc.metrics.links;

    doc.metrics.links.slice(1).forEach((link) => {
      linkCounts[link] = (linkCounts[link] || 0) + 1;
      if (!linkToDocsMap[link]) linkToDocsMap[link] = [];
      linkToDocsMap[link].push(mainHost);
    });
  });

  // Add link nodes referenced > 1 time
  Object.keys(linkCounts).forEach((link) => {
    if (linkCounts[link] > 1) {
      const docsLinked = (linkToDocsMap[link] || []).map(
        (d) => docTitleMap[d] || d
      );
      formattedData.nodes.push({
        id: link,
        type: "link",
        weight: linkCounts[link],
        linkedDocs: docsLinked,
      });
    }
  });

  // Create doc↔link connections
  data.forEach((doc) => {
    if (!isArray(doc.metrics.links)) return;
    const mainHost = doc.metrics.links[0];
    doc.metrics.links.slice(1).forEach((link) => {
      if (linkCounts[link] > 1) {
        formattedData.links.push({ source: mainHost, target: link });
      }
    });
  });

  // Compute doc weights
  formattedData.nodes.forEach((n) => {
    if (n.type === "document") {
      const docLinks = n.data.metrics.links.slice(1);
      n.weight = docLinks.reduce((acc, l) => {
        const ln = formattedData.nodes.find(
          (x) => x.id === l && x.type === "link"
        );
        return acc + (ln ? ln.weight : 0);
      }, 0);
    }
  });

  formattedData.nodes.sort((a, b) => {
    if (a.type === "document" && b.type === "document")
      return b.weight - a.weight;
    if (a.type === "document") return -1;
    if (b.type === "document") return 1;
    return b.weight - a.weight;
  });

  return { formattedData, linkToDocsMap };
}

// --- NODE CREATION ---
function createNode(nodeData, x, y, opts) {
  const radius =
    nodeData.type === "document"
      ? opts.mainNode.radius + Math.min((nodeData.weight || 0) / 5, 10)
      : opts.targetNode.radius + Math.min((nodeData.weight || 0) / 5, 6);

  const color =
    nodeData.type === "document" ? opts.mainNode.color : opts.targetNode.color;
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshLambertMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.2,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(x, y, 0);
  sphere.userData = { ...nodeData };

  scene.add(sphere);
  nodes.push(sphere);
  const mapKey = `${nodeData.type}:${nodeData.id}`;
  nodeMap[mapKey] = sphere;

  // Label
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontSize = 14;
  ctx.font = `${fontSize}px Arial`;
  const labelText =
    nodeData.type === "document"
      ? (nodeData.data && nodeData.data.title) || nodeData.id
      : nodeData.id;
  const textWidth = ctx.measureText(labelText).width;
  canvas.width = Math.ceil(textWidth + 10);
  canvas.height = Math.ceil(fontSize * 1.4);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillText(labelText, 5, fontSize);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(canvas.width * 0.5, canvas.height * 0.5, 1);
  sprite.position.copy(sphere.position);
  sprite.position.y += radius + 10;
  scene.add(sprite);
  sphere.userData.labelSprite = sprite;
}

// --- MAIN CHART ---
function chart(querySelector, data, opts) {
  const container = document.querySelector(querySelector);
  if (!container) return console.error(`Container not found: ${querySelector}`);
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const finalOpts = assign({}, defaultOptions, opts, { width, height });

  nodes = [];
  links = [];
  hoveredNode = null;
  nodeMap = {};
  if (tooltipDiv) tooltipDiv.remove();
  createTooltip(finalOpts.tooltip);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
  camera.position.z = 600;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0xffffff);
  container.appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);
  controls.noPan = false;
  controls.panSpeed = 0.8;
  controls.rotateSpeed = 4.0;
  controls.zoomSpeed = 1.2;
  controls.dynamicDampingFactor = 0.2;
  controls.minDistance = 200;
  controls.maxDistance = 1500;

  raycaster = new THREE.Raycaster();

  window.addEventListener("mousemove", (e) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
    mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;
    mouseScreen.x = e.clientX;
    mouseScreen.y = e.clientY;
  });

  const { formattedData } = processData(get(data, "documents", []));

  // layout positions
  let docY = 300;
  let linkY = 300;
  const docX = -180;
  const linkX = 180;

  formattedData.nodes
    .filter((n) => n.type === "document")
    .forEach((n) => {
      createNode(n, docX, docY, finalOpts);
      docY -= (Math.min((n.weight || 0) / 5, 10) + 10) * 3;
    });

  formattedData.nodes
    .filter((n) => n.type === "link")
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .forEach((n) => {
      const offsetX = (Math.random() - 0.5) * 40;
      createNode(n, linkX + offsetX, linkY, finalOpts);
      linkY -= (Math.min((n.weight || 0) / 5, 6) + 8) * 2;
    });

  // Draw arcs now that all nodes exist
  // After all nodes are added, schedule links
  setTimeout(() => {
    formattedData.links.forEach((l) => {
      const s = nodeMap[`document:${l.source}`];
      const t = nodeMap[`link:${l.target}`];
      if (!s || !t) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        s.position,
        t.position,
      ]);
      const material = new THREE.LineBasicMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0.22,
      });
      const line = new THREE.Line(geometry, material);
      line.userData = { source: s, target: t, validPair: true };
      scene.add(line);
      links.push({ line, source: s, target: t, validPair: true });
    });
  }, 50); // 50ms delay ensures nodes exist

  scene.add(new THREE.AmbientLight(0x101010, 1));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(1, 1, 1).normalize();
  scene.add(dirLight);

  // Hover interaction
  function handleHover() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodes);
    if (intersects.length > 0) {
      const node = intersects[0].object;
      if (node !== hoveredNode) {
        hoveredNode = node;
        showTooltip(hoveredNode);

        links.forEach(({ line, source, target, validPair }) => {
          if (!validPair) return;
          if (source === hoveredNode || target === hoveredNode) {
            line.material.color.set(0xff6600);
            line.material.opacity = 0.9;
          } else {
            line.material.color.set(0x999999);
            line.material.opacity = 0.08;
          }
        });
      }
    } else {
      if (hoveredNode) {
        links.forEach(({ line }) => {
          line.material.color.set(0x999999);
          line.material.opacity = 0.22;
        });
      }
      hoveredNode = null;
      hideTooltip();
    }
    updateTooltipPosition(hoveredNode);
  }

  window.addEventListener("resize", () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  function animate() {
    requestAnimationFrame(animate);
    handleHover();
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

export default chart;