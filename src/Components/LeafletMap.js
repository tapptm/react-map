import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  Polyline,
  LayersControl,
  LayerGroup,
  CircleMarker,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import React from "react";
import axios from "axios";
import L from "leaflet";
import "./Style.css";
import mapData from "./mapData.json";
import {
  //   popupContent,
  //   popupHead,
  //   popupText,
  //   okText,
  colors,
} from "./MapStyle/style";
import { Container, Row, Col } from "react-bootstrap";
import styled from "styled-components";

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
      coPolylines: [],
      coProjPolylines: [],
      defaultPosition: [14.9799, 102.0978], // Korat position
    };
  }

  // customMarker =
  //   new L.Icon({
  //     // iconUrl: `https://www.km-innovations.rmuti.ac.th/researcher/images-profile-upload/${img}`,
  //     iconUrl: `https://image.flaticon.com/icons/png/512/219/219983.png`,
  //     iconAnchor: new L.Point(23, 23),
  //     popupAnchor: new L.Point(16, 0),
  //     shadowUrl: null,
  //     shadowSize: null,
  //     shadowAnchor: null,
  //     iconSize: new L.Point(41, 41),
  //     className: "image-icon",
  //   });

  customMarker = new L.DivIcon({
    html: `
        <div class="relative">
          <img class="image-icon" src="https://image.flaticon.com/icons/png/512/1087/1087815.png"/>
          <div class="researcher">
          <a href="http://localhost:3000/googlemap"><img class="image-icon" src="https://image.flaticon.com/icons/png/512/219/219983.png"/></a>
          </div>
          <div class="co-reseacher">
            <img class="image-icon" src="https://www.freeiconspng.com/thumbs/house-png/icones-png-theme-home-19.png"/>
          </div>
          <div class="co-reseacher-group">
            <img class="image-icon" src="https://med.mahidol.ac.th/learningresources/sites/default/files/public/Corporate-Events.png"/>
          </div>
        </div>
        `,
    shadowUrl: null,
    shadowSize: null,
    iconAnchor: new L.Point(23, 23),
    className: "my-div-icon",
  });

  coResearchCustomMarker = (img) =>
    new L.Icon({
      iconUrl: `https://www.km-innovations.rmuti.ac.th/researcher/file-upload/co_researcher-upload/${img}`,
      iconAnchor: new L.Point(23, 23),
      popupAnchor: new L.Point(16, 0),
      shadowUrl: null,
      shadowSize: null,
      shadowAnchor: null,
      iconSize: new L.Point(61, 61),
      className: "image-icon-co",
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
          type: x.project_type,
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
    const group_to_values = markers.reduce((obj, item) => {
      obj[item.cid] = obj[item.cid] || [];
      obj[item.cid].push([item.lat, item.lng]);
      return obj;
    }, {});

    const groups = Object.keys(group_to_values).map((key) => {
      return { group: key, latlng: group_to_values[key] };
    });

    return groups;
  };

  getPolylineCoProject = (mapData) => {
    const latlng = [];
    mapData.map((locat, index) => {
      latlng.push([[locat.lat, locat.lng]]);
      locat.project.map(({ lat, lng }) => {
        latlng[index].push([lat, lng]);
      });
    });
    console.log(latlng);
    return latlng;
  };

  getPolylineCo = (mapData) => {
    const latlng = [];
    mapData.map((locations) => {
      latlng.push([locations.lat, locations.lng]);
    });
    return latlng;
  };

  getOnlyRealValue = (values) => {
    const realRes = values.filter((e) => {
      return e.lat || e.lng != null;
    });
    return realRes;
  };

  //   createClusterCustomIcon = function (cluster) {
  //     return L.divIcon({
  //       html: `<span>${cluster.getChildCount()}</span>`,
  //       className: "marker-cluster-custom",
  //       iconSize: L.point(85, 85, true),
  //     });
  //   };

  createClusterCustomIcon = (cluster) => {
    const count = cluster.getChildCount();
    let size = "LargeXL";
    let iconSize = 70;

    if(cluster && count > 2) {
        L.polygon(cluster.getConvexHull())
    }

    if (count < 10) {
      size = "Small";
      iconSize = 70;
    } else if (count >= 10 && count < 100) {
      size = "Medium";
      iconSize = 80;
    } else if (count >= 100 && count < 500) {
      size = "Large";
      iconSize = 90;
    }
    const options = {
      cluster: `markerCluster${size}`,
      isize: iconSize,
    };

    return L.divIcon({
      html: `<div>
          <span class="markerClusterLabel">${count}</span>
        </div>`,
      className: `${options.cluster}`,
      iconSize: L.point(options.isize, options.isize, true),
    });
  };

  async componentDidMount() {
    const mapMarkers = await this.getMarkers();
    const mapCircles = await this.getCircles();
    const cidCluster = this.getPolylines(mapMarkers);

    console.log(mapMarkers);
    const locations = this.getPolylineCo(mapData);
    // console.log(locations);

    const prolocat = this.getPolylineCoProject(mapData);
    // console.log(prolocat);

    const realCircles = this.getOnlyRealValue(mapCircles);
    // console.log(cidCluster);

    this.setState({
      markers: mapMarkers,
      circleMakers: realCircles,
      cidPolylines: cidCluster,
      coPolylines: locations,
      coProjPolylines: prolocat,
    });
  }

  render() {
    const {
      markers,
      circleMakers,
      cidPolylines,
      coPolylines,
      coProjPolylines,
    } = this.state;
    const limeOptions = { color: "lime" };
    const redOptions = { color: "red" };
    const blueOptions = { color: "blue" };

    return (
      <div>
        <MapContainer
          center={this.state.defaultPosition}
          zoom={6}
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
            <LayersControl.Overlay checked name="Marker with popup">
              <LayerGroup>
                <MarkerClusterGroup
                  iconCreateFunction={this.createClusterCustomIcon}
                  showCoverageOnHover={true}
                  //   spiderLegPolylineOptions={{
                  //     weight: 0,
                  //     opacity: 0,
                  //   }}
                >
                  {markers.map(({ name, img, lat, lng }, index) => {
                    return (
                      <Marker
                        position={[lat, lng]}
                        // icon={this.customMarker(img)}
                        icon={this.customMarker}
                        key={index}
                      >
                        {/* <Tooltip direction="bottom" >{name}</Tooltip> */}
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Circle Marker">
              <LayerGroup>
                {markers.map(({ name, img, lat, lng }, index) => {
                  return (
                    <CircleMarker
                      key={index}
                      center={[lat, lng]}
                      pathOptions={limeOptions}
                      //   radius={10}
                      opacity={0}
                    >
                      <Marker
                        position={[lat, lng]}
                        // icon={this.customMarker(img)}
                        icon={this.customMarker}
                      >
                        {/* <Popup>
                          <Field>
                            {name} <hr /> lat: <strong> {lat} </strong> and lng
                            <strong>{lng}</strong>
                          </Field>
                        </Popup> */}
                      </Marker>
                    </CircleMarker>
                  );
                })}
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Cluster with Researcher">
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
            <LayersControl.Overlay name="Cluster with Co-Researcher">
              <LayerGroup>
                <Polyline pathOptions={redOptions} positions={coPolylines} />
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Cluster with Co-Project-Researcher">
              <LayerGroup>
                <Polyline
                  pathOptions={limeOptions}
                  positions={coProjPolylines}
                />
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Co-Researcher Circle">
              <LayerGroup>
                {mapData.map(
                  ({ co_researcher, co_img, researcher, lat, lng }, index) => {
                    return (
                      <CircleMarker
                        key={index}
                        center={[lat, lng]}
                        pathOptions={redOptions}
                        // radius={30}
                        opacity={0}
                      >
                        <Marker
                          position={[lat, lng]}
                          icon={this.coResearchCustomMarker(co_img)}
                        >
                          <Popup className="request-popup">
                            <Container>
                              <Title> {co_researcher} </Title> <hr />
                              {researcher.map(({ img, name }, index) => {
                                return (
                                  <Row
                                    key={index}
                                    className="justify-content-between align-items-center py-2"
                                  >
                                    <Col>
                                      <GroundImage
                                        src={`https://www.km-innovations.rmuti.ac.th/researcher/images-profile-upload/${img}`}
                                      />
                                    </Col>
                                    <Col>
                                      <Field>
                                        <strong> name </strong> <br /> {name}
                                      </Field>
                                    </Col>
                                  </Row>
                                );
                              })}
                            </Container>
                          </Popup>
                        </Marker>
                        {/* < Popup > Popup in { co_researcher } </Popup >  */}
                      </CircleMarker>
                    );
                  }
                )}
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
                      <Popup> Popup in {name} </Popup>
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

const Field = styled.span`
  font-size: 0.9rem;
  color: ${colors.$black};
`;

const Label = styled.span`
  font-weight: bold;
`;

const Time = styled.div`
  color: ${colors.$grey_mid};
`;

const Title = styled.span`
  display: inline-block;
  color: ${colors.$black};
  margin: 0;
  font-size: 1.3rem;
`;

const GroundImage = styled.img`
  width: 41px;
  height: 41px;
  border-radius: 50%;
  border-color: "#00ff00";
`;

export default Map;
