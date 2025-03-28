<h2>A 3D Real-Time Satellite Tracker. <a href="https://johnflorinus.github.io/SAT-Track/">Click here for live demo</a></h2>

It is based on three different components:
* <h3>CelesTrak API</h3> - A public API that provides the latest TLE data on many satellites
* <h3>SatelliteJS</h3> - A JavaScript library that performs calculations to propagate the TLE data into real-time coordinates
* <h3>CesiumJS</h3> - A JavaScript library that visualizes a 3D interactable earth with object visualization

The project needs to be ran on a local server because of CesiumJS, for example via the VS Code Live Server Extension.

<h2><u>Features</u></h2>
<h3>* 29 different satellite types</h3>
Example: Space Stations, Russian Navigation Satellites, Starlink Satellites, Space Debris

Some are fetched from a single CelesTrak API endpoint while others combine different endpoints.
There are a few more endpoints from CelesTrak that I didnt bother to include.
<h3>* NORAD Catalog Selection</h3>
Track a singular satellite by inserting its NORAD Catalog number
<h3>* Performant tracking</h3>
If below 50 concurrent satellite objects, the animation is smooth and visually pleasing.
If over 50, like the Starlink Satellite Type (thousands of objects), then there is a 1000ms choppy location tracking loop. Otherwise the browser lags and freezes on many computers.
