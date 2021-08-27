import React, { useEffect } from "react";
import { LayerGroup, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as d3 from "d3";
import axios from "axios";
import "./d3.css";

const MapComponent = () => {
  const mapData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/get/us-project-map"
      );
      return response.data;
    } catch (e) {
      console.log(e);
    }
  };

  var tooltipEl = function (d) {
    return (
      '<div class="tip__container">' +
      '<div class="val">' +
      d.id +
      "</div>" +
      '<div class="close">' +
      "<button>&times</button>" +
      "</div>" +
      "</div>"
    );
  };
  function D3Layer() {
    const map = useMap();
    let radius = 15;
    useEffect(async () => {
      const svgLayer = L.svg({ clickable: true });
      svgLayer.addTo(map);

      // get map data from api
      const data = await mapData();

      data.nodes.forEach((d, i) => {
        d.latLong = new L.LatLng(d.lat, d.lon);
        d.layerPoint = map.latLngToLayerPoint(d.latLong);
        d.radius = radius;
      });

      data.links.forEach((d) => {
        d.source = d.from;
        d.target = d.to;
      });

      // set d3 to use svg layer in leaflet and config it to enable interaction with svg element.
      const svg = d3
        .select(map.getPanes().overlayPane)
        .select("svg")
        .attr("pointer-events", "auto");

      const g = svg.select("g").attr("class", "leaflet-zoom-hide");
      const defs = svg.append("svg:defs");

      const links = g
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke", "red")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", 5);

      const nodes = g
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("id", (d) => `node-${d.id}`)
        .attr("r", radius)
        .attr("stroke", "white");
      // .attr("fill", "#555")
      // .attr("fill", (d) => {
      //   let imgSize = d.radius * 2;
      //   defs
      //     .append("svg:pattern")
      //     .attr("id", `node-img-id${d.id}`)
      //     .attr("width", imgSize)
      //     .attr("height", imgSize)
      //     .append("svg:image")
      //     .attr("xlink:href", d.img)
      //     .attr("width", imgSize)
      //     .attr("height", imgSize)
      //     .attr("x", 0)
      //     .attr("y", 0);
      //   return `url(#node-img-id${d.id})`;
      // });

      // nodes.on("mouseover", function () {
      //   d3.select(this)
      //     .transition()
      //     .duration("150")
      //     .attr("stroke", "blue")
      //     .attr("r", radius * 2);
      // });

      // nodes.on("mouseout", function () {
      //   d3.select(this)
      //     .transition()
      //     .duration("150")
      //     // .attr("stroke", "red")
      //     .attr("r", radius);
      // });

      nodes.on("click", function () {
        d3.select(this).attr("stroke", (d) => {
          console.log(d);
          // here you can access data of node using d.key
          alert("You clicked on node " + d.name);
        });

        links.attr("stroke", (d) => {
          return `node-${d.source.id}` == this.id ||
            `node-${d.target.id}` == this.id
            ? "blue"
            : "red";
        });
      });

      const label = g
        .selectAll(".mytext")
        .data(data.nodes)
        .enter()
        .append("text")
        .text(function (d) {
          return `${d.id} ${d.type}`;
        })
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-family", "Arial")
        .style("font-size", 12);

      const drawAndUpdate = () => {
        links
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        label
          .attr("x", function (d) {
            return d.x;
          })
          .attr("y", function (d) {
            return d.y + 29;
          });

        nodes
          .each((d) => {
            d.layerPoint = map.latLngToLayerPoint(d.latLong);
            // fix parent node position by set fx and fy, unfix by set it to null
            if (d.type === "parent") {
              d.fx = d.layerPoint.x;
              d.fy = d.layerPoint.y;
            }
          })
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y);

        // simulation.force('x').initialize(nodes.data())
        // simulation.force('y').initialize(nodes.data())
        // simulation.alpha(1).restart();
      };

      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3
            .forceLink()
            .links(data.links)
            .id((d) => d.id)
        )
        .force(
          "link",
          d3
            .forceLink()
            .links(data.links)
            .id((d) => d.id)
            .distance(50)
        )
        .force("charge", d3.forceManyBody())
        .force("charge", d3.forceManyBody().strength(-400))
        .force(
          "collision",
          d3.forceCollide().radius((d) => d.radius * 1.5)
        )
        .force(
          "x",
          d3.forceX().x((d) => d.layerPoint.x)
        )
        .force(
          "y",
          d3.forceY().y((d) => d.layerPoint.y)
        )
        // .force('x', d3.forceX().x(d => d.x).strength(0.06))
        // .force('y', d3.forceY().y(d => d.y).strength(0.04))
        .on("tick", () => {
          drawAndUpdate();
        });

      // update force center position of all child nodes when the zooming end
      map.on("zoomend", () => {
        simulation.force("x").initialize(nodes.data());
        simulation.force("y").initialize(nodes.data());
        simulation.alpha(1).restart();
      });
    }, []);
    return null;
  }

  const center = [15.222, 102.491];

  return (
    <MapContainer
      center={center}
      zoom={9}
      // minZoom={6}
      // scrollWheelZoom={true}
      // zoomControl={false}
      style={{ height: "100vh", width: "100%" }}
      // maxBounds={[
      //   [58.619777025081675, -10.437011718750002],
      //   [49.66762782262194, 3.3618164062500004]
      // ]}
    >
      <LayerGroup>
        <D3Layer />
      </LayerGroup>
      {/* <MyMapEvents /> */}
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* <NavBar mapZoom={mapSettings.zoom} activeNav={activeNav} navClick={navClick} show={show} /> */}
      {/* <Overlay show={show} /> */}
    </MapContainer>
  );
};

export default MapComponent;
