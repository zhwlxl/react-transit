#

This demonstrates the use of the Search component.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import OLMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSMSource from 'ol/source/OSM';
import Search from 'react-transit/components/Search';

const map = new OLMap({ controls: [] });
const layers = [
  new Layer({
    name: 'Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
];
const setCenter = ({ geometry }) => {
  map.getView().setCenter(fromLonLat(geometry.coordinates, 'EPSG:3857'));
};

function SearchExample() {
  return (
    <div className="rt-stop-finder-example">
      <BasicMap
        map={map}
        center={[951560, 6002550]}
        zoom={14}
        layers={layers}
      />
      <Search
        onSelect={setCenter}
        apiKey={window.apiKey}
        inputProps={{
          placeholder: 'Search stops',
        }}
      />
    </div>
  );
}

<SearchExample />;
```