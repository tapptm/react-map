import React, { Component } from "react";
import { Map, GoogleApiWrapper } from "google-maps-react";

export class Maps extends Component {
  render() {
    return (
      <Map
        google={this.props.google}
        zoom={8}
        style={mapStyles}
        initialCenter={{ lat: 47.444, lng: -122.176 }}
      />
    );
  }
}

const mapStyles = {
  width: '100%',
  height: '100%',
};

export default GoogleApiWrapper({
  apiKey: "AIzaSyCc3tmvADsSF-Gu5C4GapnnGq0yrTCf19s",
})(Maps);
