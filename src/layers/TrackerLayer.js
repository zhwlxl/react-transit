import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Layer from 'react-spatial/Layer';
import { buffer, containsCoordinate } from 'ol/extent';
import Tracker from './Tracker';
import {
  getRadius,
  getBgColor,
  getDelayColor,
  getDelayText,
  getTextColor,
  timeSteps,
} from '../config/tracker';

/**
 * Trackerlayer.
 * Responsible for loading tracker data.
 * extents Layer from /react-spatial/layer (https://react-spatial.geops.de/docjs.html)
 * @class
 * @inheritDoc
 * @param {Object} options
 */
class TrackerLayer extends Layer {
  static getDateString(now) {
    const n = now || new Date();
    let month = (n.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;
    let day = n.getDate().toString();
    day = day.length === 1 ? `0${day}` : day;

    return [now.getFullYear(), month, day].join('');
  }

  static getTimeString(time) {
    return [
      time.getHours() - 2,
      time.getMinutes(),
      `${time.getSeconds()}.${time.getMilliseconds()}`,
    ].join(':');
  }

  constructor(options = {}) {
    super({
      name: 'Tracker',
      olLayer: new OLVectorLayer({
        zIndex: 5,
        source: new VectorSource(),
      }),
      ...options,
    });

    this.styleCache = {};

    this.currentOffset = 0;

    this.requestIntervalSeconds = 3;

    this.intervalStarted = false;

    this.hoverVehicleId = null;

    this.currTime = new Date();

    this.lastUpdateTime = new Date();

    this.lastRequestTime = 0;

    this.speed = 1;

    this.fps = 60;

    this.clickCallbacks = [];

    this.delayOutlineColor = options.delayOutlineColor || '#ffffff';
    this.useDelayStyle = true;

    // Add click callback
    if (options.onClick) {
      this.onClick(options.onClick);
    }
  }

  /**
   * Start the Interval
   */
  startInterval() {
    window.clearInterval(this.updateInterval);
    this.updateInterval = window.setInterval(() => {
      this.updateTrajectories();
    }, this.requestIntervalSeconds * 1000);
  }

  /**
   * Start the update time
   */
  startUpdateTime() {
    this.stopUpdateTime();
    this.updateTime = setInterval(() => {
      this.currTime.setMilliseconds(
        this.currTime.getMilliseconds() +
          (new Date() - this.lastUpdateTime) * this.speed,
      );
      this.setCurrTime(this.currTime);
    }, 1000 / this.fps);
  }

  /**
   * Stop the update time
   */
  stopUpdateTime() {
    window.clearInterval(this.updateTime);
  }

  /**
   * Get the current time
   * @returns {Date}
   */
  getCurrTime() {
    return this.currTime;
  }

  /**
   * define the current time
   * @param {dateString | value} time
   */
  setCurrTime(time) {
    const newTime = new Date(time);
    this.currTime = newTime;
    this.lastUpdateTime = new Date();
    this.tracker.renderTrajectory(this.currTime);
  }

  /**
   * get the Speed
   * @returns {number}
   */
  getSpeed() {
    return this.speed;
  }

  /**
   * define speed
   * @param {number} speed
   */
  setSpeed(speed) {
    this.speed = speed;
  }

  fetchTrajectories(url) {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    return fetch(url, { signal }).then(data => data.json());
  }

  /**
   * Returns the vehicle which are at the given coordinates
   * Returns null when no vehicle is located at the given coordinates
   * @param {ol.coordinate} coordinate
   * @returns {ol.feature | null}
   */
  getVehicleAtCoordinate(coordinate) {
    const res = this.map.getView().getResolution();
    const ext = buffer([...coordinate, ...coordinate], 10 * res);
    const trajectories = this.tracker.getTrajectories();

    for (let i = 0; i < trajectories.length; i += 1) {
      if (
        trajectories[i].coordinate &&
        containsCoordinate(ext, trajectories[i].coordinate)
      ) {
        return trajectories[i];
      }
    }

    return null;
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol.map} map ol.map (https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html)
   */
  init(map) {
    super.init(map);

    this.tracker = new Tracker(map, {
      canvas: this.canvas,
    });

    this.map.on('postrender', () => {
      this.tracker.renderTrajectory(this.currTime);
    });

    this.map.on('moveend', () => {
      const z = this.map.getView().getZoom();

      if (z !== this.currentZoom) {
        this.currentZoom = z;
        this.styleCache = {};
        this.fps = Math.round(
          Math.min(20000, Math.max(1000 / 60, timeSteps[z] / this.speed)),
        );
        this.startUpdateTime();
      }
      this.tracker.renderTrajectory(this.currTime);
      this.updateTrajectories();
    });

    this.map.on('pointermove', e => {
      const vehicle = this.getVehicleAtCoordinate(e.coordinate);
      this.map.getTarget().style.cursor = vehicle ? 'pointer' : 'auto';
      this.hoverVehicleId = vehicle ? vehicle.id : null;
    });

    this.updateTrajectories();
    this.startInterval();
    this.startUpdateTime();
    this.tracker.setStyle((props, r) => this.style(props, r));
  }

  /**
   * Define the style of the layer
   * @param {Object} props Properties
   */
  style(props) {
    const { type, name, id, color, textColor, delay } = props;
    const z = Math.min(Math.floor(this.currentZoom || 1), 16);
    const hover = this.hoverVehicleId === id;

    this.styleCache[z] = this.styleCache[z] || {};
    this.styleCache[z][type] = this.styleCache[z][type] || {};
    this.styleCache[z][type][name] = this.styleCache[z][type][name] || {};
    this.styleCache[z][type][name][delay] =
      this.styleCache[z][type][name][delay] || {};

    if (!this.styleCache[z][type][name][delay][hover]) {
      let radius = getRadius(type, z);
      if (hover) {
        radius += 5;
      }
      const margin = 1;
      const radiusDelay = radius + 2;
      const origin = radiusDelay + margin;

      const c = document.createElement('canvas');
      c.width = radiusDelay * 2 + margin * 2 + 100;
      c.height = radiusDelay * 2 + margin * 2;
      const ctx = c.getContext('2d');

      if (this.useDelayStyle) {
        // Draw delay background
        ctx.save();
        ctx.beginPath();
        ctx.arc(origin, origin, radiusDelay, 0, 2 * Math.PI, false);
        ctx.fillStyle = getDelayColor(delay);
        ctx.filter = 'blur(1px)';
        ctx.fill();
        ctx.restore();

        // Draw delay text
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.max(
          14,
          Math.min(17, radius * 1.2),
        )}px arial, sans-serif`;
        ctx.fillStyle = getDelayColor(delay);

        ctx.strokeStyle = this.delayOutlineColor;
        ctx.lineWidth = 1.5;
        ctx.strokeText(getDelayText(delay), origin * 2, origin);
        ctx.fillText(getDelayText(delay), origin * 2, origin);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color || getBgColor(type);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#003300';
      ctx.stroke();

      if (z > 12) {
        const fontSize = Math.max(radius, 10);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = textColor || getTextColor(type);
        ctx.font = `${fontSize}px Arial`;

        const textSize = ctx.measureText(name);

        if (textSize.width < c.width - 6 && fontSize < c.height - 6) {
          ctx.fillText(name, origin, origin);
        }
      }
      this.styleCache[z][type][name][delay][hover] = c;
    }

    return this.styleCache[z][type][name][delay][hover];
  }

  /**
   * Listens to click events on the layer.
   * @param {function} callback Callback function, called with the clicked
   *   features (https://openlayers.org/en/latest/apidoc/module-ol_Feature.html),
   *   the layer instance and the click event.
   */
  onClick(callback) {
    if (typeof callback === 'function') {
      this.clickCallbacks.push(callback);
    } else {
      throw new Error('callback must be of type function.');
    }
  }
}

export default TrackerLayer;
