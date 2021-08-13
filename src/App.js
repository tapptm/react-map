import logo from "./logo.svg";
import "./App.css";
import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import LeafletMap from "../src/Components/LeafletMap";
import GoogleMap from "../src/Components/GoogleMap";

import { Container, Navbar, NavDropdown, Nav } from "react-bootstrap";

function App() {
  return (
    // <div className="App">
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>React-Map</Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <LinkContainer to="/">
                <Nav.Link>Map</Nav.Link>
              </LinkContainer>
              {/* <LinkContainer to="/googlemap">
                <Nav.Link>Google Map</Nav.Link>
              </LinkContainer> */}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Switch>
        <Route exact path="/">
          <LeafletMap />
        </Route>
        <Route path="/googlemap">
          <GoogleMap />
        </Route>
      </Switch>
    </Router>
    // </div>
  );
}

export default App;
