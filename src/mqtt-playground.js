import { MathUtils } from 'three';
import { limits } from './ur3e.js';

const keys = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'];

export function decodeMessage(suffix, payload) {
  if (payload.length > 2048) return;
  let message;
  try {
    message = JSON.parse(payload);
  } catch {
    return;
  }
  if (!message || typeof message !== 'object' || Array.isArray(message)) return;
  if (suffix === 'pose/get') {
    const { requestId } = message;
    if (typeof requestId === 'string' && requestId.trim() && requestId.length <= 128) {
      return { requestId };
    }
  }
  if (suffix === 'pose/set') {
    const angles = keys.map((key, i) => {
      const radians = message[key];
      if (!Number.isFinite(radians)) return NaN;
      const degrees = MathUtils.radToDeg(i === 5 ? radians % (2 * Math.PI) : radians);
      if (Math.abs(degrees) > limits[i] + 1e-9) return NaN;
      return MathUtils.clamp(degrees, -limits[i], limits[i]);
    });
    if (angles.every(Number.isFinite)) return { angles };
  }
}

export function poseState(angles, xyz, requestId) {
  const joints = Object.fromEntries(keys.map((key, i) => [key, MathUtils.degToRad(angles[i])]));
  return { ...joints, xyz, ...(requestId === undefined ? {} : { requestId }) };
}

export function setupPlayground({ applyPose, getState }) {
  const get = id => document.getElementById(id);
  const form = get('mqtt-form');
  const status = get('mqtt-status');
  const button = get('mqtt-toggle');
  const broker = get('mqtt-broker');
  const username = get('mqtt-username');
  const password = get('mqtt-password');
  const prefix = `rover/play/${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
  const setTopic = `${prefix}/pose/set`;
  const getTopic = `${prefix}/pose/get`;
  get('mqtt-prefix').value = prefix;
  get('mqtt-state-topic').textContent = `${prefix}/pose/state`;
  get('mqtt-set-topic').textContent = setTopic;
  get('mqtt-get-topic').textContent = getTopic;
  get('mqtt-copy').onclick = async () => {
    const field = get('mqtt-prefix');
    field.select();
    try {
      await navigator.clipboard.writeText(prefix);
      get('mqtt-copy').textContent = 'Copied';
    } catch {
      status.textContent = 'Prefix selected. Use your keyboard to copy it.';
    }
  };

  let connection;
  let ready = false;
  function publishState(requestId) {
    if (!ready || !connection.client.connected) return;
    connection.client.publish(`${prefix}/pose/state`, JSON.stringify(getState(requestId)),
      { qos: 0, retain: false });
  }

  function disconnect(message) {
    const client = connection?.client;
    connection = undefined;
    ready = false;
    client?.end(true);
    button.textContent = 'Connect';
    status.textContent = message;
  }

  form.onsubmit = async event => {
    event.preventDefault();
    if (connection) {
      disconnect('Disconnected');
      return;
    }

    let url;
    try {
      url = new URL(broker.value.trim());
      if (url.protocol !== 'wss:' || url.username || url.password || url.hash) throw new Error();
    } catch {
      status.textContent = 'Enter a secure WebSocket broker URL (wss://) without embedded credentials.';
      return;
    }

    const attempt = {};
    connection = attempt;
    button.textContent = 'Disconnect';
    status.textContent = 'Connecting…';
    const options = {
      clean: true, connectTimeout: 8000, reconnectPeriod: 0, queueQoSZero: false,
      username: username.value || undefined,
      password: password.value || undefined,
    };

    try {
      const { default: mqtt } = await import('mqtt');
      if (connection !== attempt) return;
      const client = mqtt.connect(url.href, options);
      attempt.client = client;
      client.on('error', () => {
        if (connection === attempt) disconnect('Connection failed. Check the broker URL and credentials.');
      });
      client.on('close', () => {
        if (connection === attempt) disconnect('Broker connection closed.');
      });
      client.on('message', (topic, payload, packet) => {
        if (connection !== attempt || !ready || packet.retain) return;
        const suffix = topic === setTopic ? 'pose/set' : topic === getTopic ? 'pose/get' : '';
        const message = decodeMessage(suffix, payload);
        if (!message) return;
        if (message.angles) applyPose(message.angles);
        else publishState(message.requestId);
      });
      client.on('connect', () => {
        client.subscribe([setTopic, getTopic], { qos: 0 }, (error, grants) => {
          if (connection !== attempt) return;
          if (error || grants?.length !== 2 || grants.some(({ qos }) => qos !== 0)) {
            disconnect('The broker did not accept the playground subscriptions.');
            return;
          }
          ready = true;
          status.textContent = 'Connected';
          publishState();
        });
      });
    } catch {
      if (connection === attempt) disconnect('Unable to start the MQTT connection.');
    }
  };

  window.addEventListener('pagehide', () => disconnect('Disconnected'));
  return publishState;
}
