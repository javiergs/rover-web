import * as THREE from 'three';
import { init } from './init.js';
import { home, limits, parsePoses } from './ur3e.js';

const get = id => document.getElementById(id);
const container = get('threejs-container');
let viewer;
try {
  viewer = init(container);
} catch (error) {
  console.error(error);
  container.hidden = true;
  get('render-error').hidden = false;
}

const pose = [...home];
const names = ['Base', 'Shoulder', 'Elbow', 'Wrist 1', 'Wrist 2', 'Wrist 3'];
const coordinates = [...document.querySelectorAll('#coordinates dd')];
const trailPoints = [];
const trail = new THREE.Line(new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0xffc37e }));
viewer?.robot.add(trail);

function drawTrail() {
  trail.geometry.dispose();
  trail.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
}

function showPose() {
  if (!viewer) return;
  const flange = viewer.setPose(pose);
  flange.toArray().forEach((metres, i) => {
    coordinates[i].textContent = (metres * 1000).toFixed(1);
  });
  if (trail.visible && (!trailPoints.length || flange.distanceTo(trailPoints.at(-1)) >= 0.001)) {
    trailPoints.push(flange);
    if (trailPoints.length > 1000) trailPoints.shift();
    drawTrail();
  }
}

const inputs = names.map((name, index) => {
  const row = document.createElement('div');
  row.className = 'joint';
  row.innerHTML = `<label for="joint-${index}">${name}</label>
    <input id="joint-${index}" type="range" aria-label="${name} angle in degrees">
    <input type="number" aria-label="${name} angle in degrees">`;
  const [slider, number] = row.querySelectorAll('input');
  for (const input of [slider, number]) {
    input.min = -limits[index];
    input.max = limits[index];
    input.step = input === slider ? '0.1' : 'any';
    input.value = pose[index];
  }
  slider.addEventListener('input', () => {
    pose[index] = Math.round(slider.valueAsNumber * 10) / 10;
    number.value = pose[index];
    showPose();
  });
  number.addEventListener('change', () => {
    const value = number.valueAsNumber;
    if (Number.isFinite(value)) pose[index] = THREE.MathUtils.clamp(value, -limits[index], limits[index]);
    number.value = slider.value = pose[index];
    showPose();
  });
  get('joints').append(row);
  return { slider, number };
});

function applyPose(angles) {
  angles.forEach((angle, index) => {
    pose[index] = angle;
    inputs[index].slider.value = angle;
    inputs[index].number.value = Number(angle.toFixed(3));
  });
  showPose();
}

get('reset-pose').onclick = () => applyPose(home);
get('reset-camera').onclick = () => viewer?.controls.reset();
get('clear-trace').onclick = () => {
  trailPoints.length = 0;
  drawTrail();
};
get('show-trace').onchange = event => {
  trail.visible = event.target.checked;
  trailPoints.length = 0;
  drawTrail();
  showPose();
};

let imported = [];
let importRequest = 0;
const picker = get('pose-row');
get('pose-file').onchange = async event => {
  const request = ++importRequest;
  const file = event.target.files[0];
  imported = [];
  get('pose-picker').hidden = true;
  get('file-status').textContent = '';
  if (!file) return;
  try {
    const rows = parsePoses(await file.text());
    if (request !== importRequest) return;
    imported = rows;
    picker.value = 1;
    picker.max = imported.length;
    get('pose-count').textContent = `of ${imported.length}`;
    get('pose-picker').hidden = false;
    get('file-status').textContent = 'Poses loaded. Choose a row to display it.';
  } catch (error) {
    if (request === importRequest) get('file-status').textContent = error.message;
  }
};
picker.onchange = () => {
  const row = imported[picker.valueAsNumber - 1];
  if (row) applyPose(row);
};
get('pose-picker').insertAdjacentHTML('beforeend', ' <button type="button" id="apply-row">View pose</button>');
get('apply-row').onclick = () => picker.onchange();

showPose();
if (viewer) {
  const animate = () => {
    viewer.render();
    requestAnimationFrame(animate);
  };
  animate();
}
