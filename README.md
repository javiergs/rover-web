# ROVER — Remote Operation and Visualization of Embodied Robots

[Open the live ROVER app](https://javiergs.github.io/rover-web/)

ROVER is a standalone browser workspace for visualizing the Universal Robots UR3e. This phase supports local 3D visualization only. The app has no hardware connection, MQTT, teleoperation, automatic playback, or robot command output.

## Use the viewer

- Drag to orbit, scroll or pinch to zoom, and use **Reset view** to restore the camera.
- Use the sliders or type angles in degrees to inspect a pose. **Reset pose** restores the initial display pose.
- Read the tool flange center in millimetres in the robot’s Z-up base frame. The optional trail connects displayed flange positions.
- Import a local CSV and choose **View pose** for the desired row. Files stay in your browser. The legacy format has a header followed by comma-separated numeric rows with two metadata columns and six joint angles in radians.

```csv
index,time,j1,j2,j3,j4,j5,j6
1,0,0,-1.570796,1.658063,-1.658063,-1.570796,0
2,1,0.3,-1.570796,1.658063,-1.658063,-1.570796,0
```

## Model and limitations

The six rotating joints use nominal UR3e Denavit–Hartenberg transforms. The visual model uses a 128 mm base, 63 mm tool flange, tapered links, offset cylindrical housings and blue end caps. The manufacturer's rated reach is 500 mm. Housing profiles and shell offsets are visual approximations. [Universal Robots kinematics table](https://www.universal-robots.com/articles/ur/application-installation/dh-parameters-for-calculations-of-kinematics-and-dynamics/) · [UR3e technical drawing](https://www.universal-robots.com/manuals/EN/TechSheets/UR3e_techsheet_pdf_online/UR3e_techsheet_en.pdf)

The viewer requires WebGL 2. It uses nominal dimensions without per-unit calibration, collision checking, dynamics or safety limits. The trail connects displayed poses without planning or validating a path. The readout is for the bare flange, without a tool offset. The wrist 3 input is bounded to ±360° for display and imported wrist 3 angles are reduced to an equivalent rotation.

## Run and build locally

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

## Repository layout

- `src/` contains the viewer, UR3e model and kinematics, and styles.
- `tests/` contains the kinematics and CSV import tests.
- `index.html` is the Vite entry page.
- `.github/workflows/` contains the GitHub Pages workflow.


## Deploy to GitHub Pages

In the repository’s **Settings → Pages**, set **Source** to **GitHub Actions**. The workflow runs tests and builds on pull requests, then publishes the static `dist/` artifact on pushes to `main`. It can also be run manually from `main`. The build uses relative asset paths so it works under the repository path.

The expected project URL is [javiergs.github.io/rover-web](https://javiergs.github.io/rover-web/). The deployment job reports the published URL. [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Provenance

The Three.js viewer and legacy CSV layout were adapted from the [ASU26-ROVER web app](https://github.com/calhci/ASU26-ROVER/tree/5f5d423c0086dcb6b8b0e4fe0ecfc3e897346fda/legacy/ur-robotic-arm/app-web). The repositories are independent. See [LICENSE](LICENSE) and [LICENSE-legacy](LICENSE-legacy).
