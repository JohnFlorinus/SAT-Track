// https://www.github.com/JohnFlorinus

// inte hemlig nyckel
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YTUxODQ4Ni02NzA3LTRhOGQtOTUxZi1jOTNlYjdjYWIyMGEiLCJpZCI6Mjg2MTExLCJpYXQiOjE3NDI0ODEwMzJ9.AVdgxzqwjpgSIsZnkD9AwV8SODF_3fNfI8ijgcC8SLk';

// Cesium initiera jorden
  const viewer = new Cesium.Viewer('cesiumContainer', {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    fullscreenButton: false,
    animation: false,
    timeline: false,
    creditContainer: document.createElement("div"), // ta bort loggan
  });
  viewer.scene.globe.enableLighting = true;


// INFO BOX VID SATELLIT KLICK
  viewer.screenSpaceEventHandler.setInputAction((click) => {
    try {
    const potentialObj = viewer.scene.pick(click.position);
    // om det finns ett definierat objekt vid klick platsen
    if (Cesium.defined(potentialObj)) {
        const entity = potentialObj.id; // SAT ID
        var position = entity.position.getValue(viewer.clock.currentTime);

          var cartographic = Cesium.Cartographic.fromCartesian(position);
          var longitude = Cesium.Math.toDegrees(cartographic.longitude);
          var latitude = Cesium.Math.toDegrees(cartographic.latitude);
          var altitude = Math.round(cartographic.height/1000); // cartesian sparas i meter pga * 1000 i updatepositions()

          entity.description = `
          <div>
              <p><b>Altitude:</b> ${altitude} km</p>
              <p><b>Longitude:</b> ${longitude}°</p>
              <p><b>Latitude:</b> ${latitude}°</p>
          </div>
      `;
        viewer.selectedEntity = entity; // visa info
    }
  }
  catch(Exception) {
    console.log(Exception);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// Setup av cesium clock för animation
viewer.clock.startTime = Cesium.JulianDate.now();
viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED; // sluta aldrig cesium klockan / animerings loop
viewer.clock.shouldAnimate = true;

// hämta satellitdata
async function GetCelestrakTLE(type) {
  var data = [];
  var catalogNumber = document.getElementById('satelliteCatalogNumber').value;

  try {
  
  if (catalogNumber.length!=0) { // om catalog number har fyllts i - annan api url
    response = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=' + catalogNumber + '&FORMAT=TLE');
    data.push(...ParseTLEData(await response.text()));
    if (data[0].tle2.length==0) { // Om tredje värde inte finns var det inkorrekt feedback - fel catalog number
      return null;
    }
  }
  else {
    var endpoints = [];
    // Vissa satellit typer behöver flera CelesTrak API callss
    if (type=='scientific') {
      endpoints = ['science', 'geodetic', 'engineering', 'education']
    }
    else if (type=='debris') {
      endpoints = ['cosmos-1408-debris','fengyun-1c-debris','iridium-33-debris','cosmos-2251-debris']
    }
    else if (type=='misc') {
      endpoints = ['military','radar','cubesat','other']
    }
    else if (type=='weathersats') {
      endpoints = ['weather','noaa','goes']
    }
    else if (type=='us-nav') {
      endpoints = ['gps-ops', 'nnss']
    }
    else if (type=='ru-nav') {
      endpoints = ['glo-ops', 'musson']
    }
    else if (type=='eu-nav') {
      endpoints = ['galileo', 'sbas']
    }
    else if (type=='global-nav') {
      endpoints = ['gnss', 'sbas', 'musson', 'nnss']
    }
    else {
      endpoints = [type];
    }

    for(let i=0;i<endpoints.length;i++) {
        response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=' + endpoints[i] + '&FORMAT=tle');
        // lägg TXT response in i en array
        data.push(...ParseTLEData(await response.text()));
    }
  }

  }
  catch {
    return null;
  }
  return data;
}

// Sortera satellitdata
function ParseTLEData(data) {
  const lines = data.trim().split("\n");
  const satellites = [];
  for(let i=0;i<lines.length;i+=3) { // 3 linjer per sat
    var id = lines[i];
    var tle1 = lines[i+1];
    var tle2 = lines[i+2];
    satellites.push({id,tle1,tle2});    
  }
  return satellites;
}

// rocket science med satellite js
function GetSatellitePosition(sat, date) {
  try {
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
  catch(error) {
    console.log("Unable to calculate position for: " + sat.id);
  }
  return null;
}

let entities = [];
var alreadyInLoop = false;
var performanceMode = false;

async function LoadSatellites(type) {
  // Ifall användaren spammar knappen
  var loadBtn = document.getElementById('loadSatelliteBtn');  
  loadBtn.disabled=true;
  loadBtn.innerHTML = 'Loading...';

  const data = await GetCelestrakTLE(type);
  if (data==null) {
    if (document.getElementById('satelliteCatalogNumber').value.length!=0) {
    alert('Unable to retrieve satellite position.\n\nThe specified catalog number may be incorrect');
    }
    else {
    alert('Unable to retrieve satellite positions.\n\nYour internet connection may be down');
    }
    loadBtn.disabled=false;
    loadBtn.innerHTML = "Load Satellites";
    return;
  }

  //ta bort alla cesium sateliiter innan nya selection
  viewer.entities.removeAll();
  entities = [];

  if (data.length/3>50) { // över 50 objekt - skippa smooth animation för prestanda
    performanceMode=true;
    entities = data.map((sat) => {
        const entity = viewer.entities.add({
            name: sat.id,
            position: null, // ingen sampledposition
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
        return { sat, entity }; // Koppla varje cesium entity till respektive SAT i entities[]
      });
  }
  else { // få satelliter, kör med smooth sampledposition animation
    performanceMode=false;
    const crntTime = Cesium.JulianDate.now();
    entities = data.map((sat) => {
    const samples = new Cesium.SampledPositionProperty();
    for (let i = -1800; i < 1800; i += 10) { // 30min bakåt och 30min fram för smooth interpolation
      const time = Cesium.JulianDate.addSeconds(crntTime, i, new Cesium.JulianDate());
      const p = GetSatellitePosition(sat, Cesium.JulianDate.toDate(time)); // Propagate till den specifika tiden i loopen
      if (p) {
        const position = Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.altitude * 1000);
        samples.addSample(time, position);
      }
    }
      
      const entity = viewer.entities.add({
          name: sat.id,
          position: samples,
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
      return { sat, entity }; // Koppla varje cesium entity till respektive SAT i entities[]
    });
  }

  if (alreadyInLoop==false && performanceMode==true) {
    UpdatePositions(); // påbörja looped tracking ifall performance mode
    alreadyInLoop=true;
    console.log('starting loop');
  }


// återaktivera
loadBtn.disabled=false;
loadBtn.innerHTML = 'Load Satellites';
}

// Uppdatera satellitpositioner - performance mode
function UpdatePositions() {
if (performanceMode==true) {
  entities = entities.filter((obj) => {
    const p = GetSatellitePosition(obj.sat, new Date());
    if (p != null) {
        const pos = Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.altitude * 1000);
        obj.entity.position = pos;
        return true; // behåll entity i array
    } else {
        viewer.entities.remove(obj.entity); // ta bort cesium entity från viewer
        return false; // ta bort entity i array
    }
  });
  console.log('loop done');
  setTimeout(UpdatePositions, 1000); // två gånger per sekund
}
else {
  // performancemode inte längre true = ny typsökning
  // förhindra dubblade loopar
  alreadyInLoop=false;
}
}