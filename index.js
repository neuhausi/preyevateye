// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.
// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
function initAutocomplete() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.809, lng: -98.555 },
    zoom: 5.5,
    mapTypeId: "roadmap",
  });
  // Create the search box and link it to the UI element.
  const input = document.getElementById("pac-input");
  const searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  // Bias the SearchBox results towards current map's viewport.
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
    getMarkers(map.getBounds());
  });
  let markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();
    if (places.length == 0) {
      return;
    }
    // Clear out the old markers.
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    markers = [];
    // For each place, get the icon, name and location.
    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }
      const icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };
      // Create a marker for each place.
      markers.push(
        new google.maps.Marker({
          map,
          icon,
          title: place.name,
          position: place.geometry.location,
        })
      );
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });
}

function getMarkers(coords) {
  var sql = "SELECT `x`, `y`, `name`, `description`, `media` FROM `CommunityCam` WHERE `x` BETWEEN " + coords.Ia.lo + " AND " + coords.Ia.hi + " AND `y` BETWEEN " + coords.Ua.lo + " AND " + coords.Ua.hi + ";";
  executeSQL(sql);
}

function placeMarker(location, map) {
  new google.maps.Marker({
    position: location,
    map: map
  });
}

function executeSQL(commands) {
  worker.onmessage = function (event) {
    var results = event.data.results;
    if (!results || !results.length) {
      return;
    } else {
      results[0].values.forEach(function (result) {
        placeMarker({ lat: result[1], lng: result[0] }, map);
      });
    }
  }
  worker.postMessage({ action: 'exec', sql: commands });
}

// Map
var map;

// Test Database to be replace by PostgreSQL
var worker = new Worker("./worker.sql-wasm.js");
worker.postMessage({ action: 'open' });
var xhr = new XMLHttpRequest();
xhr.open('GET', './data.sqlite', true);
xhr.responseType = 'arraybuffer';
xhr.onload = e => {
  var result = new Uint8Array(xhr.response);
  worker.onmessage = function () {
    executeSQL("SELECT `x`, `y`, `name`, `description`, `media` FROM `CommunityCam`;");
  };
  try {
    worker.postMessage({ action: 'open', buffer: result }, [result]);
  }
  catch (exception) {
    worker.postMessage({ action: 'open', buffer: result });
  }
};
xhr.send();

window.initAutocomplete = initAutocomplete;