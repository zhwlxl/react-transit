const trackerRaduisMapping = {
  0: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 6, 6, 7, 9, 11],
  1: [1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 11, 11],
  2: [1, 1, 1, 1, 1, 2, 3, 4, 4, 5, 5, 5, 7, 8, 11, 12, 12],
  3: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 4, 6, 7, 8],
  4: [1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 5, 7, 8, 10, 11, 11],
  5: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 9, 11],
  6: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 9, 11],
  7: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 9, 11],
  8: [1, 1, 1, 1, 1, 2, 3, 3, 3, 4, 4, 5, 6, 7, 10, 11, 11],
};

export const getRadius = (type, zoom) => {
  try {
    return trackerRaduisMapping[type][zoom];
  } catch (e) {
    return 1;
  }
};

export const types = [
  'Tram',
  'Subway / Metro / S-Bahn',
  'Train',
  'Bus',
  'Ferry',
  'Cable Car',
  'Gondola',
  'Funicular',
  'Long distance bus',
];

export const bgColors = [
  '#ffb400',
  '#ff5400',
  '#ff8080',
  '#ea0000',
  '#3000ff',
  '#ffb400',
  '#41a27b',
  '#00d237',
  '#b5b5b5',
];

export const textColors = [
  '#000000',
  '#ffffff',
  '#000000',
  '#ffffff',
  '#ffffff',
  '#000000',
  '#ffffff',
  '#000000',
  '#000000',
];

export const timeSteps = [
  100000,
  50000,
  40000,
  30000,
  20000,
  15000,
  10000,
  5000,
  2000,
  1000,
  400,
  300,
  250,
  180,
  90,
  60,
  50,
  40,
  30,
  20,
  20,
];

export const getDelayColor = roundedSecs => {
  if (roundedSecs >= 3600) return '#ed004c'; // pink { r: 237, g: 0, b: 76, s: '237,0,76' };
  if (roundedSecs >= 500) return '#e80000'; // red { r: 232, g: 0, b: 0, s: '232,0,0' };
  if (roundedSecs >= 300) return '#ff4a00'; // orange { r: 255, g: 74, b: 0, s: '255,74,0' };
  if (roundedSecs >= 180) return '#f7bf00'; // yellow { r: 247, g: 191, b: 0, s: '247,191,0' };
  return '#00a00c'; // green { r: 0, g: 160, b: 12, s: '0,160,12' };
};

/**
 * Return a rounded delay
 * */
export const roundDelay = secs => {
  if (secs > 3600) {
    const rounded = Math.round(secs / 3600);
    return {
      secs: rounded * 3600,
      string: `${rounded}h`,
    };
  }

  if (secs > 59) {
    const rounded = Math.round(secs / 60);
    return {
      secs: rounded * 60,
      string: `${rounded}m`,
    };
  }

  if (secs > 0) {
    return {
      secs,
      string: `${secs}s`,
    };
  }

  return {
    secs: 0,
    string: '0',
  };
};
