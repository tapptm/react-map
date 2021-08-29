import React, { useEffect } from "react";
import { LayerGroup, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as d3 from "d3";
import axios from "axios";
import "./d3.css";

const url = "http://localhost:3000";

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

  function D3Layer() {
    const map = useMap();
    let radius = 19;
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

      let tooltipEl = function (d) {
        const project_url = url + "?project_id=" + d.project_id;
        const co_url = url + "?co_id=" + d.coresearcher_id;
        const user_url = url + "?user_idcard=" + d.user_idcard;

        if (d.project_id)
          return `
        <div class="tip__container">  
          <div class="val"><h6>${d.label}</h6></div>
          <div class="close">
            <button>&times</button>
          </div>
          <hr/>
          <div class="val">${d.project_name}</div>
          <div class="val">lat:${d.lat} </br> lng:${d.lon}</div>
          <hr/>
          <a href="${project_url}" class="btn">รายละเอียดเพิ่มเติม</a> 
        </div>`;

        if (d.coresearcher_id)
          return `
        <div class="tip__container">  
          <div class="val">${d.id} ${d.label}</div>
          <div class="close">
            <button>&times</button>
          </div>
          <hr/>
          <div class="val">${d.coresearcher_id}</div>
          <hr/>
          <a href="${co_url}" class="btn">รายละเอียดเพิ่มเติม</a>
          
        </div>`;

        if (d.user_idcard)
          return `
        <div class="tip__container">  
          <div class="val"><h6>${d.label}</h6></div>
          <div class="close">
            <button>&times</button>
          </div>
          <hr/>
          <div class="val">${d.user_idcard}</div>
          <hr/>
          <a href="${user_url}" class="btn">รายละเอียดเพิ่มเติม</a>         
        </div>`;

        return `
        <div class="tip__container">  
          <div class="val">${d.id}</div>
          <div class="close">
            <button>&times</button>
          </div>  
          <hr/>
          <div class="val">nodata</div>
          <hr/>
          
      </div>`;
      };
      // Tool Tip
      const div = d3
        .select(map.getPanes().overlayPane)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      const links = g
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke", "lime")
        .attr("stroke-opacity", 0.8)
        .attr("stroke-width", 3);

      const nodes = g
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("id", (d) => `node-${d.id}`)
        .attr("r", radius)
        .attr("stroke", "white")
        .attr("stroke-width", 2.5)
        .attr("fill", "#555")
        .attr("fill", (d) => {
          let imgSize = d.radius * 2;
          defs
            .append("svg:pattern")
            .attr("id", `node-img-id${d.id}`)
            .attr("width", imgSize)
            .attr("height", imgSize)
            .append("svg:image")
            .attr("xlink:href", d.img)
            .attr("width", imgSize)
            .attr("height", imgSize)
            .attr("x", 0)
            .attr("y", 0);
          return `url(#node-img-id${d.id})`;
        });

      nodes.on("mouseover", function () {
        d3.select(this)
          .transition()
          .duration("150")
          // .attr("stroke", "blue")
          .attr("r", radius * 1.5);
      });

      // nodes.on("mousemove", (event) => {
      //   const [x, y] = d3.pointer(event);
      //   div.style("top", y - 10 + "px").style("left", x + 10 + "px");
      // });

      nodes.on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration("150")
          // .attr("stroke", "red")
          .attr("r", radius);
      });

      const neighbours = {};

      data.nodes.forEach((node) => {
        neighbours[node.id] = neighbours[node.id] || [];
      });
      // console.log(neighbours);
      data.links.forEach((link) => {
        neighbours[link.source].push(link.source);
        neighbours[link.source].push(link.target);
        neighbours[link.target].push(link.target);
        neighbours[link.target].push(link.source);
      });

      function deHighlight() {
        nodes.style("opacity", 1);
        links.style("opacity", 1);
        label.style("visibility", "hidden");
        links.attr("stroke", (d) => {
          // console.log(d.source.id);
          return `node-${d.source.id}` == d.id || `node-${d.target.id}` == d.id
            ? "red"
            : "lime";
        });
      }

      function highlightNeighbours(d) {
        deHighlight();

        nodes.style("opacity", (n) => {
          return neighbours[d.id].indexOf(n.id) != -1 ? 1 : 0.1;
        });

        links.style("opacity", (n) => {
          return d.id == n.source.id || d.id == n.target.id ? 1 : 0.1;
        });

        label
          .filter((n) => neighbours[d.id].indexOf(n.id) != -1)
          // we can't use display:none with labels because we need to load them in the DOM in order to calculate the background rectangle dimensions with the getBBox function.
          // So we used visibility:hidden instead.
          .style("visibility", "visible");
      }

      nodes
        .on("click", function (event, d) {
          const [x, y] = d3.pointer(event);

          div.html(tooltipEl(d));

          div.select("button").on("click", function () {
            div.style("opacity", 0);
            div.style("visibility", "hidden");
            // deHighlight();
          });

          div
            .transition()
            .duration(200)
            .style("display", "block")
            .style("visibility", "visible")
            .style("opacity", 1);

          div.style("top", y + 30 + "px").style("left", x - 30 + "px");

          // connectedNodes(d);
          highlightNeighbours(d);

          links.attr("stroke", (d) => {
            // console.log(d.source.id);
            return `node-${d.source.id}` == this.id ||
              `node-${d.target.id}` == this.id
              ? "red"
              : "lime";
          });
        })
        .on("dblclick", () => {
          deHighlight();
        });

      map.on("click", function (e) {
        div.style("opacity", 0);
        div.style("visibility", "hidden");
      });

      const label = g
        .selectAll(".mytext")
        .data(data.nodes)
        .enter()
        .append("text")
        .text(function (d) {
          return `${d.label}`;
        })
        .attr("class", "label");

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
      zoom={10}
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
