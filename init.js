import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { dh, jointFrame } from './ur3e.js';

const silver = new THREE.MeshStandardMaterial({ color: 0xc9d1da, metalness: 0.34, roughness: 0.3 });
const blue = new THREE.MeshStandardMaterial({ color: 0x65b6de, roughness: 0.32 });
const dark = new THREE.MeshStandardMaterial({ color: 0x283747, roughness: 0.48 });

// Place tapered or straight cylindrical parts along any axis in the parent frame.
function cylinder(parent, from, to, radius, material = silver, endRadius = radius) {
  const start = new THREE.Vector3(...from);
  const axis = new THREE.Vector3(...to).sub(start);
  const part = new THREE.Mesh(new THREE.CylinderGeometry(endRadius, radius, axis.length(), 48), material);
  part.position.copy(start).addScaledVector(axis, 0.5);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
}

function drum(parent, x, z0, z1, radius, capAtStart = false) {
  cylinder(parent, [x, 0, z0], [x, 0, z1], radius);
  const cap = capAtStart ? z0 : z1;
  const direction = capAtStart ? -1 : 1;
  cylinder(parent, [x, 0, cap], [x, 0, cap + direction * 0.003], radius * 0.94, dark);
  cylinder(parent, [x, 0, cap + direction * 0.003], [x, 0, cap + direction * 0.008], radius * 0.86, blue);
}

export function init(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x142333);
  scene.fog = new THREE.Fog(0x142333, 1.4, 3.5);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 8);
  camera.position.set(0.76, 0.52, -0.72);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional UR3e model');
  renderer.domElement.setAttribute('role', 'img');
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-0.12, 0.24, 0);
  controls.enableDamping = true;
  controls.minDistance = 0.25;
  controls.maxDistance = 2.8;
  controls.maxPolarAngle = Math.PI / 2;
  controls.update();
  controls.saveState();

  scene.add(new THREE.HemisphereLight(0xe7f4ff, 0x55697d, 2.6));
  const key = new THREE.DirectionalLight(0xfff0db, 3);
  key.position.set(-0.4, 1.2, -0.7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -0.8, right: 0.8, top: 0.8, bottom: -0.8, near: 0.1, far: 3 });
  key.shadow.normalBias = 0.0015;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9adfff, 2);
  rim.position.set(0.5, 0.6, 0.6);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x25394d }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.002;
  floor.receiveShadow = true;
  scene.add(floor, new THREE.GridHelper(2, 20, 0x577387, 0x354f64));

  // UR base coordinates are Z-up. Rotate the entire assembly into the Y-up scene.
  const robot = new THREE.Group();
  robot.rotation.x = -Math.PI / 2;
  scene.add(robot);

  cylinder(robot, [0, 0, 0], [0, 0, 0.012], 0.064, dark);
  cylinder(robot, [0, 0, 0.012], [0, 0, 0.069], 0.064, silver, 0.052);
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    const x = 0.055 * Math.cos(angle);
    const y = 0.055 * Math.sin(angle);
    cylinder(robot, [x, y, 0.012], [x, y, 0.014], 0.0033, silver);
  }

  // Visual parts are attached to the appropriate rotating link before its DH
  // translation and twist. Axial housing offsets do not move the joint axes.
  const frames = [];
  const links = [];
  let parent = robot;
  for (let i = 0; i < dh.length; i++) {
    const link = new THREE.Group();
    const frame = new THREE.Group();
    frame.matrixAutoUpdate = false;
    parent.add(link, frame);
    links.push(link);
    frames.push(frame);
    parent = frame;
  }
  const [base, shoulder, elbow, wrist1, wrist2, wrist3] = links;
  const [, d1] = dh[0];
  const [a2] = dh[1];
  const [a3] = dh[2];
  const [, d4] = dh[3];
  const [, d5] = dh[4];
  const [, d6] = dh[5];

  cylinder(base, [0, 0, 0.067], [0, 0, d1], 0.050);
  drum(shoulder, 0, -0.047, 0.088, 0.052, true);
  cylinder(shoulder, [-0.025, 0, 0.080], [a2 + 0.021, 0, 0.080], 0.039, silver, 0.034);
  drum(shoulder, a2, 0.046, 0.111, 0.046);
  drum(elbow, 0, -0.012, 0.049, 0.045, true);
  cylinder(elbow, [-0.023, 0, 0.027], [a3 + 0.021, 0, 0.027], 0.031, silver, 0.026);
  drum(elbow, a3, -0.009, 0.061, 0.040, true);
  cylinder(wrist1, [0, 0, 0.054], [0, 0, d4], 0.036);
  drum(wrist2, 0, -0.032, 0.032, 0.036, true);
  cylinder(wrist2, [0, 0, 0.023], [0, 0, d5], 0.031);
  drum(wrist3, 0, -0.033, 0.033, 0.033, true);
  cylinder(wrist3, [0, 0, 0.025], [0, 0, d6 - 0.008], 0.030);
  cylinder(wrist3, [0, 0, d6 - 0.008], [0, 0, d6], 0.0315, dark);
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    const x = 0.025 * Math.cos(angle);
    const y = 0.025 * Math.sin(angle);
    cylinder(wrist3, [x, y, d6 - 0.001], [x, y, d6], 0.003, silver);
  }

  new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(
      Math.tan(THREE.MathUtils.degToRad(20)) / Math.min(1, camera.aspect)));
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }).observe(container);

  return {
    scene, robot, controls,
    setPose(degrees) {
      for (const [i, angle] of degrees.entries()) {
        const radians = THREE.MathUtils.degToRad(angle);
        links[i].rotation.z = radians;
        frames[i].matrix.copy(jointFrame(radians, dh[i]));
        frames[i].matrixWorldNeedsUpdate = true;
      }
      return robot.worldToLocal(frames.at(-1).getWorldPosition(new THREE.Vector3()));
    },
    render() {
      controls.update();
      renderer.render(scene, camera);
    },
  };
}
