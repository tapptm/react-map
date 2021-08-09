import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  LayersControl,
  LayerGroup,
  CircleMarker,
} from "react-leaflet";
import React from "react";
import axios from "axios";
import L, { map } from "leaflet";
import "./Style.css";

const apiUrl = "https://api.rmuti.ac.th/km_api";
const apiUrlLocal = "http://localhost:4000";

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      markers: [],
      circleMakers: [],
      typePolylines: [],
      cidPolylines: [],
      defaultPosition: [14.9799, 102.0978], // Korat position
    };
  }

  customMarker = (img) =>
    new L.Icon({
      iconUrl: `https://www.km-innovations.rmuti.ac.th/researcher/images-profile-upload/${img}`,
      iconAnchor: new L.Point(23, 23),
      popupAnchor: new L.Point(16, 0),
      shadowUrl: null,
      shadowSize: null,
      shadowAnchor: null,
      iconSize: new L.Point(41, 41),
      //   iconAnchor: [10, 41],
      //   popupAnchor: [2, -40],
      className: "image-icon",
    });

  getResponse = async (url) => {
    const { data } = await axios.get(url);
    const response = await Promise.all(data);
    return response;
  };

  getCircles = async () => {
    try {
      const response = await this.getResponse(
        `${apiUrl}/api/get/co-researcher`
      );
      const locations = [];

      response.forEach((x) => {
        locations.push({
          cid: x.co_researcher_id,
          name: x.co_researcher_name_th,
          img: x.co_researcher_image,
          lat: x.co_researcher_latitude,
          lng: x.co_researcher_longitude,
        });
      });
      return locations;
    } catch (e) {
      console.log(e);
    }
  };

  getMarkers = async () => {
    try {
      const response = await this.getResponse(
        `${apiUrlLocal}/api/get/us-project`
      );
      const locations = [];
      response.forEach((x) => {
        locations.push({
          cid: x.user_idcard,
          name: x.project_name,
          img: x.user_image_user,
          lat: x.project_latitude,
          lng: x.project_longitude,
        });
      });
      return locations;
    } catch (e) {
      console.log(e);
    }
  };

  getPolylines = (markers) => {
    // console.log(this.state.markers);
    const group_to_values = markers.reduce((obj, item) => {
      obj[item.cid] = obj[item.cid] || [];
      obj[item.cid].push([item.lat, item.lng]);
      return obj;
    }, {});

    const groups = Object.keys(group_to_values).map((key) => {
      return { group: key, latlng: group_to_values[key] };
      //   return [group_to_values[key]];
    });

    return groups;
  };

  getOnlyRealValue = (values) => {
    const realRes = values.filter((e) => {
      return e.lat || e.lng != null;
    });
    return realRes;
  };

  async componentDidMount() {
    const mapMarkers = await this.getMarkers();
    const mapCircles = await this.getCircles();
    const cidCluster = this.getPolylines(mapMarkers);

    console.log(mapMarkers);
    const realCircles = this.getOnlyRealValue(mapCircles);
    console.log(cidCluster);

    this.setState({
      markers: mapMarkers,
      circleMakers: realCircles,
      cidPolylines: cidCluster,
    });
  }

  render() {
    const { markers, circleMakers, cidPolylines } = this.state;
    const limeOptions = { color: "lime" };
    const redOptions = { color: "red" };

    return (
      <div>
        <MapContainer
          center={this.state.defaultPosition}
          zoom={9}
          style={{ width: "100%", height: "100vh" }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Stadia Maps">
              <TileLayer
                attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Carto Voyager">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.Overlay name="Marker with popup">
              <LayerGroup>
                {markers.map(({ img, lat, lng }, index) => {
                  return (
                    <Marker
                      position={[lat, lng]}
                      icon={this.customMarker(img)}
                      key={index}
                    >
                      <Popup>
                        {index + 1} is for popup with lat: {lat} and lon {lng}
                      </Popup>
                    </Marker>
                  );
                })}
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Circle Marker">
              <LayerGroup>
                {markers.map(({ name, img, lat, lng }, index) => {
                  return (
                    <CircleMarker
                      key={index}
                      center={[lat, lng]}
                      //   pathOptions={limeOptions}
                      //   radius={10}
                      opacity={0}
                    >
                      <Marker
                        position={[lat, lng]}
                        icon={this.customMarker(img)}
                      >
                        <Popup>Popup in {name}</Popup>
                      </Marker>
                    </CircleMarker>
                  );
                })}
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Cluster with Researcher">
              <LayerGroup>
                {cidPolylines.map(({ latlng }, index) => {
                  return (
                    <Polyline
                      key={index}
                      pathOptions={limeOptions}
                      positions={latlng}
                    />
                  );
                })}
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Circle Markers">
              <LayerGroup>
                {circleMakers.map(({ name, lat, lng }, index) => {
                  return (
                    <CircleMarker
                      key={index}
                      center={[lat, lng]}
                      pathOptions={redOptions}
                      radius={30}
                    >
                      <Popup>Popup in {name}</Popup>
                    </CircleMarker>
                  );
                })}
              </LayerGroup>
            </LayersControl.Overlay>
          </LayersControl>
        </MapContainer>
      </div>
    );
  }
}

export default Map;
