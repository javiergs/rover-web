import * as THREE from 'three';
import { init } from './init.js';
import { flangePosition, home, limits, sampleFlangeTrail } from './ur3e.js';
import { poseState, setupPlayground } from './mqtt-playground.js';

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

let xyz;
let previousPose;
function showPose() {
  const flange = viewer ? viewer.setPose(pose) : flangePosition(pose);
  xyz = { x: flange.x * 1000, y: flange.y * 1000, z: flange.z * 1000 };
  flange.toArray().forEach((metres, i) => {
    coordinates[i].textContent = (metres * 1000).toFixed(1);
  });
  if (trail.visible) {
    const intermediate = previousPose ? sampleFlangeTrail(previousPose, pose) : [];
    let changed = false;
    for (const point of [...intermediate, flange]) {
      if (!trailPoints.length || point.distanceTo(trailPoints.at(-1)) >= 0.001) {
        trailPoints.push(point);
        changed = true;
      }
    }
    if (changed) {
      if (trailPoints.length > 1000) trailPoints.splice(0, trailPoints.length - 1000);
      drawTrail();
    }
    previousPose = [...pose];
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
  slider.addEventListener('change', () => publishState());
  number.addEventListener('change', () => {
    const value = number.valueAsNumber;
    if (Number.isFinite(value)) pose[index] = THREE.MathUtils.clamp(value, -limits[index], limits[index]);
    number.value = slider.value = pose[index];
    showPose();
    publishState();
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
  publishState();
}

const publishState = setupPlayground({ applyPose, getState: requestId => poseState(pose, xyz, requestId) });

get('reset-pose').onclick = () => applyPose(home);
get('reset-camera').onclick = () => viewer?.controls.reset();
get('clear-trace').onclick = () => {
  previousPose = undefined;
  trailPoints.length = 0;
  drawTrail();
};
get('show-trace').onchange = event => {
  trail.visible = event.target.checked;
  previousPose = undefined;
  trailPoints.length = 0;
  drawTrail();
  showPose();
};

showPose();
if (viewer) {
  const animate = () => {
    viewer.render();
    requestAnimationFrame(animate);
  };
  animate();
}
