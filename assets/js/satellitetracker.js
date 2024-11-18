// https://www.github.com/JohnFlorinus

// 3D display earth
  const viewer = new Cesium.Viewer('cesiumContainer', {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    fullscreenButton: false,
    timeline: false,
    animation: false,
    creditContainer: document.createElement("div"), // ta bort loggan
  });
  viewer.scene.globe.enableLighting = true;


// hämta satellitdata
async function GetCelestrakTLE(type) {
  try {
  console.log(type);
  const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=' + type + '&FORMAT=tle');
  return await response.text();
  }
  catch {
    return false;
  }
}

// Lägg satellitdata i en array
function ParseTLEData(data) {
  const lines = data.trim().split("\n");
  const satellites = [];
  for(let i=0;i<lines.length;i+=3) { // 3 linjer per sat
    console.log(i/3);
    var id = lines[i];
    var tle1 = lines[i+1];
    var tle2 = lines[i+2];
    satellites.push({id,tle1,tle2});    
  }
  return satellites;
}

// rocket science med satellite js
function GetSatellitePosition(sat, date) {
  const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
  const positionAndVelocity = satellite.propagate(satrec, date);

  const gmst = satellite.gstime(date);
  const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

  // få koordinatdegrees med höjd i km
  const latitude = satellite.degreesLat(positionGd.latitude);
  const longitude = satellite.degreesLong(positionGd.longitude);
  const altitude = positionGd.height;

  return { latitude, longitude, altitude };
}

async function LoadSatellites(type) {
  const data = await GetCelestrakTLE(type);
  if (data==false) {
    alert('Unable to get satellite data, service might be down.');
    return;
  }
  const satellites = ParseTLEData(data);

  //ta bort alla sateliiter innan nya selection
  viewer.entities.removeAll();

  const entities = satellites.map((sat) => {
      const entity = viewer.entities.add({
          name: sat.id,
          position: null,
          point: {
              pixelSize: 5,
              color: Cesium.Color.RED
          },
          label: {
              text: sat.id,
              font: "8px sans-serif",
              fillColor: Cesium.Color.YELLOW,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM
          }
      });
      return { sat, entity }; // Koppla varje cesium entity till respektive SAT i entities[] för UpdatePositions()
  });

  function UpdatePositions() {
      entities.forEach(({ sat, entity }) => {
          //const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
          const p = GetSatellitePosition(sat, new Date());
          const pos = Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.altitude * 1000);
          entity.position = pos;
    });
    setTimeout(UpdatePositions, 500); // två gånger per sekund
  }

  UpdatePositions(); // påbörja tracking
}