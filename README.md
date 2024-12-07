A 3D Real-Time Satellite Tracker that runs in the webbrowser on client-side javascript.
Works fine on different resolutions and devices.

Its dependent on three different components:
* CelesTrak API - A public API that provides the latest TLE data on many satellites
* SatelliteJS - A JavaScript library that performs calculations to propagate the TLE data into real-time coordinates
* CesiumJS - A JavaScript library that visualizes a 3D interactable earth with satellite visualization

Most of the heavy lifting is done by these two javascript libraries.

To run the project you have to run index.html on a local server due to security constraints with CesiumJS, for example via the VS Code Live Server Extension.

Right now the project offers:
<h3>* 29 different satellite types</h3>
Example: Space Stations, Russian Navigation Satellites, Starlink Satellites, Space Debris
Some are fetched directly from a CelesTrak API endpoint while some combine different ones
<h3>* NORAD Catalog Selection</h3>
Track a singular satellite by inserting its NORAD Catalog number
<h3>Performant tracking</h3>
If below 50 concurrent satellite objects the tracking has smooth animation tracking.
If over 50, like Starlink (thousands) then there is a 1000ms choppy location tracking loop. Otherwise the browser lags and freezes on many computers.
