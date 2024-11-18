A 3D Real-Time Satellite Tracker that runs in the webbrowser on client-side javascript.
Works fine on different resolutions and devices.

Its dependent on three different components:
* CelesTrak API - A public API that provides the latest TLE data on many satellites
* SatelliteJS - A JavaScript library that performs calculations to propagate the TLE data into real-time coordinates
* CesiumJS - A JavaScript library that visualizes a 3D interactable earth with satellite visualization

Most of the heavy lifting is done by these two javascript libraries, this project combines them.

To run the project you cannot just launch the satellitetracker.html due to security constraints regarding CesiumJS.
To bypass this all you have to do is run a local server, for example via the VS Code Live Server Extension.

Right now there are many improvements to be made to this project that I didnt have the interest in doing like:
* Adding more satellite type options for the user - all API endpoints can be found on the <a href='https://celestrak.org/NORAD/elements/'>CelesTrak API website</a>
* Utilizing the .addSample() function in CesiumJS to add a much more smooth satellite animation, right now it loops every half second giving a very choppy look
* Various performance improvements, right now it can get very laggy when loading in a lot of objects at once (like the communications satellite option)
