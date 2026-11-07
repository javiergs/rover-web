# ROVER — Remote Operation and Visualization of Embodied Robots

[Open the live ROVER app](https://javiergs.github.io/rover-web/)

Explore the Universal Robots UR3e in 3D, adjust its joint angles, and inspect the tool flange position.

## Use the viewer

- Drag to orbit, scroll or pinch to zoom, and use **Reset view** to restore the camera.
- Use the sliders or type angles in degrees to inspect a pose. **Reset pose** restores the initial display pose.
- Read the tool flange center in millimetres in the robot’s Z-up base frame. The optional trail connects displayed flange positions.

The viewer includes an MQTT message reference for UR3e joint telemetry on `/rover/joints`.
