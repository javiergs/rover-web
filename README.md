# ROVER — Remote Operation and Visualization of Embodied Robots

[Open the live ROVER app](https://javiergs.github.io/rover-web/)

Explore the Universal Robots UR3e in 3D, adjust its joint angles, and inspect recorded poses.

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
