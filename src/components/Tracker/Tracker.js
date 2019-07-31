/**
 * Tracker for OpenLayers.
 */
export default class Tracker {
  constructor(map, options) {
    const opts = options || {};

    this.interpolate =
      typeof opts.interpolate === 'undefined' ? true : opts.interpolate;

    this.map = map;
    this.trajectories = [];
    this.rotationCache = {};
    this.renderFps = 60;
    this.speed = 1;

    this.renderTrajectory();

    this.map.on('change:size', () => {
      [this.canvas.width, this.canvas.height] = this.map.getSize();
    });

    // we draw directly on the canvas since openlayers is too slow
    this.canvas = document.createElement('canvas');
    this.canvas.style = [
      'position: absolute',
      'top: 0',
      'bottom: 0',
      'right: 0',
      'left: 0',
      'pointer-events: none',
    ].join(';');

    this.canvasContext = this.canvas.getContext('2d');

    this.map.once('postrender', () => {
      this.map.getTarget().appendChild(this.canvas);
    });

    this.map.on('postrender', () => {
      this.renderTrajectory();
    });

    this.map.on('moveend', () => {
      // this.renderFps = this.map.getView().getZoom();
    });
  }

  setTrajectories(trajectories) {
    this.trajectories = trajectories;
  }

  getTrajectories() {
    return this.trajectories;
  }

  getSpeed() {
    return this.speed;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  getCurrTime() {
    return this.currTime;
  }

  setCurrTime(time) {
    this.currTime = time;
  }

  /**
   * Add a feature to the tracker.
   * @param {Number} id The feature id
   * @param {ol.Feature} feature The tracker feature.
   * @param {Boolean} addOnTop If true, the trajectory is added on top of
   *   the trajectory object. This affects the draw order. If addOnTop is
   *   true, the trajectory is drawn first and appears on bottom.
   */
  addTrajectory(id, traj, addOnTop) {
    const trajectory = { ...traj, id };

    if (addOnTop) {
      this.trajectories.unshift(trajectory);
    } else {
      this.trajectories.push(trajectory);
    }
  }

  /**
   * Remove a trajectory with a given id.
   * @param {Number} id The trajectory id
   */
  removeTrajectory(id) {
    for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
      if (this.trajectories[i].id === id) {
        this.trajectories.splice(i, 1);
        break;
      }
    }
  }

  /**
   * Remove a trajectory by attribute
   * @param {string} attributeName Name of the attribute.
   * @param {*} value Attribute value.
   */
  removeTrajectoryByAttribute(attributeName, value) {
    for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
      if (this.trajectories[i][attributeName] === value) {
        this.removeTrajectory(this.trajectories[i].id);

        /* eslint-disable */
        console.log(`Deleted trajectory with ${attributeName} = ${value}.`);
        /* eslint-enable */
      }
    }
  }

  /**
   * Clear the tracker layer.
   */
  clear() {
    if (this.canvas) {
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Set the filter for tracker features.
   * @param {Function} filter Filter function.
   */
  setFilter(filter) {
    this.filter = filter;
  }

  /**
   * Set the tracker style.
   * @param {Function} s OpenLayers style function.
   */
  setStyle(s) {
    this.style = s;
  }

  renderTrajectory() {
    this.startRenderTime = new Date();
    window.clearTimeout(this.updateTimeout);
    if (!this.currTime) {
      return;
    }
    const currTime = this.currTime || Date.now();
    this.clear();

    for (let i = this.trajectories.length - 1; i >= 0; i -= 1) {
      const traj = this.trajectories[i];
      const intervals = traj.time_intervals;
      let now = currTime - (traj.timeOffset || 0);

      // the time interval will never start in the future
      if (intervals[0][0] > now) {
        [[now]] = intervals;
      }

      // find adjacent times in the interval list
      let j = 0;
      let start = 0;
      let end = 0;
      let startFrac = 0;
      let endFrac = 0;

      for (j = 0; j < intervals.length - 1; j += 1) {
        [start, startFrac] = intervals[j];
        [end, endFrac] = intervals[j + 1];

        if (start <= now && now <= end) {
          break;
        } else {
          start = null;
          end = null;
        }
      }

      if (start && end) {
        // interpolate position based on the temporal fraction
        const timeFrac = Math.min((now - start) / (end - start), 1);
        const geomFrac = this.interpolate
          ? timeFrac * (endFrac - startFrac) + startFrac
          : 0;

        traj.coordinate = traj.geom.getCoordinateAt(geomFrac);
        const px = this.map.getPixelFromCoordinate(traj.coordinate);
        const vehicleImg = this.style(traj, this.map.getView().getResolution());

        this.canvasContext.drawImage(
          vehicleImg,
          px[0] - vehicleImg.width / 2,
          px[1] - vehicleImg.width / 2,
        );
      } else {
        this.removeTrajectory(traj.id);
      }
    }
    const nextTickInMs = 1000 / this.renderFps;
    this.updateTimeout = window.setTimeout(() => {
      this.currTime.setMilliseconds(
        this.currTime.getMilliseconds() + (new Date() - this.startRenderTime),
      );
      this.renderTrajectory();
    }, nextTickInMs);
  }

  /**
   * Kill the tracker.
   */
  destroy() {
    this.clear();
    this.map.removeLayer(this.layer);
    window.clearTimeout(this.renderTimeout);
  }
}
