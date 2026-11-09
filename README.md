Project:
# Remote Operation and Visualization of Embodied Robots (ROVER)

Module:

## ROVER Web

Explore the Universal Robots UR3e in 3D, adjust its joint angles, and inspect the tool flange position.

[Open the live ROVER app](https://javiergs.github.io/rover-web/)


## Use the viewer

- Drag to orbit, scroll or pinch to zoom, and use **Reset view** to restore the camera.
- Use the sliders or type angles in degrees to inspect a pose. **Reset pose** restores the initial display pose.
- Read the tool flange center in millimetres in the robot’s Z-up base frame. The optional trail connects displayed flange positions.

## Try the MQTT playground

1. Enter your broker’s secure WebSocket URL (`wss://`) and any required credentials, then click **Connect**.
2. Copy the session topic prefix. In your MQTT client, subscribe to `<prefix>/pose/state`.
3. Publish a pose to `<prefix>/pose/set`, or send a request to `<prefix>/pose/get`.

| Topic suffix | Example JSON |
| --- | --- |
| `pose/set` | `{"j1":0,"j2":-1.57,"j3":1.66,"j4":-1.66,"j5":-1.57,"j6":0}` |
| `pose/get` | `{"requestId":"demo-1"}` |
| `pose/state` | `{"j1":0,"j2":0,"j3":0,"j4":0,"j5":0,"j6":0,"xyz":{"x":-456.75,"y":-223.15,"z":66.5},"requestId":"demo-1"}` |

Joint angles are in radians. The state message reports the simulated flange position in base-frame millimetres. ROVER publishes state after connecting, after pose changes, and in response to requests. Only a requested reply echoes the request ID. Publish messages without the retain flag.

Use demo data on shared brokers. Each page load generates a new topic prefix, and anyone with access to those topics can interact with the simulation.
