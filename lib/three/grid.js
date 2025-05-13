'use strict';

const _ = require('lodash');

import * as THREE from 'three';
// TODO: Improve importing for non-existen modules.
import TWEEN from '@tweenjs/tween.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';


var camera, scene, renderer;
var controls;

var objects = [];
var targets = [];

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.screenshot',
  width: 100,
  height: 100,
  fillColor: 'steelblue',
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  numberOfLines: 50,
  messages: {
    'no_data': 'Data not available.'
  }
};

function chart(querySelector, data, opts) {

  const finalOptions = _.assign(defaultOptions, opts);

  camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  for (var i = 0; i < data.documents.length; i++) {
    var element = document.createElement('div');
    element.className = 'three-grid-element';
    element.style.backgroundColor = 'rgba(0,127,127,' + ( Math.random() * 0.5 + 0.25 ) + ')';

    const base64Image = _.get(data.documents[i], finalOptions.valueField);
    let image = document.createElement('img');
    image.className = 'three-grid-image';
    image.setAttribute('src', base64Image);
    image.setAttribute('width', '100px');
    image.setAttribute('height', '100px');

    element.appendChild( image );

    var object = new CSS3DObject( element );
    object.position.x = Math.random() * 4000 - 2000;
    object.position.y = Math.random() * 4000 - 2000;
    object.position.z = Math.random() * 4000 - 2000;
    scene.add( object );

    objects.push( object );
  }
  
  for ( var i = 0; i < objects.length; i ++ ) {
    var object = new THREE.Object3D();

    object.position.x = ( ( i % 5 ) * 400 ) - 800;
    object.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 400 ) + 800;
    object.position.z = ( Math.floor( i / 25 ) ) * 100;
    // object.position.z = ( Math.floor( i / 25 ) ) * 1000 - 2000;

    targets.push( object );
  }

  //

  renderer = new CSS3DRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.querySelector(querySelector).appendChild( renderer.domElement );

  //

  controls = new TrackballControls( camera, renderer.domElement );
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener( 'change', render );

  transform( targets, 2000 );

  window.addEventListener( 'resize', onWindowResize, false );
  animate();
}

function transform( targets, duration ) {

  TWEEN.removeAll();

  for ( var i = 0; i < objects.length; i ++ ) {
    var object = objects[ i ];
    var target = targets[ i ];

    new TWEEN.Tween( object.position )
      .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
      .easing( TWEEN.Easing.Exponential.InOut )
      .start();

    new TWEEN.Tween( object.rotation )
      .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
      .easing( TWEEN.Easing.Exponential.InOut )
      .start();
  }

  new TWEEN.Tween( this )
    .to( {}, duration * 2 )
    .onUpdate( render )
    .start();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame( animate );
  TWEEN.update();
  controls.update();
}

function render() {
  renderer.render( scene, camera );
}

module.exports = exports = chart;