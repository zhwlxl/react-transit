import React from 'react';
import PropTypes from 'prop-types';
import firstStation from '../../images/RouteSchedule/firstStation.png';
import station from '../../images/RouteSchedule/station.png';
import lastStation from '../../images/RouteSchedule/lastStation.png';
import { bgColors } from '../../config/tracker';

/**
 * Returns a paded number (with leading 0 for integer < 10).
 * @param {Number} number number.
 */
const pad = number => {
  return `${number < 10 ? '0' : ''}${number}`;
};

/**
 * Returns a 'hh:mm' string from a time.
 * @param {Number} t time in milliseconds.
 */
const getTimeString = t => {
  if (t === -1) {
    return '';
  }
  const h = Math.floor(t / 36000000);
  const m = Math.floor((t % 36000000) / 600000);
  return `${pad(h)}:${pad(m)}`;
};

/**
 * Returns a color class to display the delay.
 * @param {Number} time Delay time in milliseconds.
 */
const getDelayString = t => {
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor(((t % 3600000) % 60000) / 1000);

  if (s === 0 && h === 0 && m === 0) {
    return '0';
  }
  if (s === 0 && h === 0) {
    return `${pad(m)}m`;
  }
  if (s === 0) {
    return `${pad(h)}h${pad(m)}m`;
  }
  if (m === 0 && h === 0) {
    return `${pad(s)}s`;
  }
  if (h === 0) {
    return `${pad(m)}m${pad(s)}s`;
  }
  return `${pad(h)}h${pad(m)}m${pad(s)}s`;
};

/**
 * Returns a color class to display the delay.
 * @param {Number} time Delay time in milliseconds.
 */
const getDelayColor = time => {
  const secs = Math.round(((time / 1800 / 2) * 3600) / 1000);
  if (secs >= 3600) {
    return 'dark-red';
  }
  if (secs >= 500) {
    return 'middle-red';
  }
  if (secs >= 300) {
    return 'light-red';
  }
  if (secs >= 180) {
    return 'orange';
  }
  return 'green';
};

/**
 * Returns an image for first, middle or last stations.
 * @param {Number} index index of the station in the list.
 * @param {Number} length Length of the stations list.
 */
const renderStationImg = (index, length) => {
  if (index === 0) {
    return (
      <img
        src={firstStation}
        alt="routeScheduleLine"
        className="rt-route-icon"
      />
    );
  }
  if (index === length - 1) {
    return (
      <img
        src={lastStation}
        alt="routeScheduleLine"
        className="rt-route-icon"
      />
    );
  }
  return (
    <img src={station} alt="routeScheduleLine" className="rt-route-icon" />
  );
};

const propTypes = {
  /**
   * CSS class of the route schedule wrapper.
   */
  className: PropTypes.string,

  /**
   * Trajectory stations informations.
   */
  lineInfos: PropTypes.object,

  /**
   * HTML tabIndex attribute
   */
  stationTabIndex: PropTypes.number,

  /**
   * Render Header of the route scheduler.
   */
  renderHeader: PropTypes.func,

  /**
   * Render Body of the route scheduler.
   */
  renderStations: PropTypes.func,

  /**
   * Function triggered on station's click event.
   */
  onStationClick: PropTypes.func,
};

const defaultProps = {
  className: 'rt-route-wrapper',
  lineInfos: null,
  stationTabIndex: 0,
  renderHeader: lineInfos => {
    return (
      <div className="rt-route-header">
        <span
          style={{
            backgroundColor:
              lineInfos.backgroundColor || bgColors[lineInfos.vehiculeType],
            color: lineInfos.color || 'black',
          }}
          className="rt-route-icon"
        >
          {lineInfos.shortName}
        </span>
        <div className="rt-route-title">
          <span className="rt-route-name">{lineInfos.destination}</span>
          <span>{lineInfos.longName}</span>
        </div>
      </div>
    );
  },
  renderStations: (lineInfos, stationTabIndex, onStationClick) => (
    <div className="rt-route-body">
      {lineInfos.stations.map((stop, idx) => (
        <div
          key={stop.stationId}
          role="button"
          className="rt-route-station"
          onClick={e => onStationClick(stop, e)}
          tabIndex={stationTabIndex}
          onKeyPress={e => e.which === 13 && onStationClick(stop, e)}
        >
          <div className="rt-route-delay">
            {stop.arrivalDelay ? (
              <span
                className={`rt-route-delay-arrival${` ${getDelayColor(
                  stop.arrivalDelay,
                )}`}`}
              >
                {`+${getDelayString(stop.arrivalDelay)}`}
              </span>
            ) : null}
            {stop.departureDelay ? (
              <span
                className={`rt-route-delay-arrival${` ${getDelayColor(
                  stop.departureDelay,
                )}`}`}
              >
                {`+${getDelayString(stop.departureDelay)}`}
              </span>
            ) : null}
          </div>
          <div className="rt-route-times">
            <span className="rt-route-time-arrival">
              {getTimeString(stop.arrivalTime)}
            </span>
            <span className="rt-route-time-departure">
              {getTimeString(stop.departureTime)}
            </span>
          </div>
          {renderStationImg(idx, lineInfos.stations.length)}
          <div>{stop.stationName}</div>
        </div>
      ))}
    </div>
  ),
  onStationClick: () => {},
};

/**
 * Displaying all stops of a line, and their informations.
 */

function RouteSchedule({
  className,
  lineInfos,
  renderHeader,
  renderStations,
  stationTabIndex,
  onStationClick,
}) {
  return lineInfos ? (
    <div className={className}>
      {renderHeader(lineInfos)}
      {renderStations(lineInfos, stationTabIndex, onStationClick)}
    </div>
  ) : null;
}

RouteSchedule.propTypes = propTypes;
RouteSchedule.defaultProps = defaultProps;

export default RouteSchedule;
