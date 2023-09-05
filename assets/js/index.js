const routeWeatherData = new Map();
const latLonKeySeparator = ",";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZHNzdGFkMDIiLCJhIjoiY2xpYnl1b3VjMGZ0ZDNwbjFxbmR3ejdqcSJ9.3mwOKhxYibQ9YZdqNZHErQ";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-104.9903, 39.7392],
  zoom: 12,
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "imperial",
  profile: "mapbox/driving",
  routePadding: 10,
  interactive: false,
});

map.addControl(directions, "top-right");
const routeInstructions = $("#routeInstructions");
routeInstructions.empty();
const mapboxControls = $(".mapboxgl-ctrl");
routeInstructions.append(mapboxControls[0]);
directions.on("route", retrieveWeatherAlongRoute);

async function retrieveWeatherAlongRoute() {
  resetMarkers();
  const steps = $(".mapbox-directions-step");
  const routeDistance = $(".mapbox-directions-route-summary")[0].children[1]
    .textContent;
  const routeLength = routeDistance.substring(0, routeDistance.length - 2);
  const avgLength = routeLength / steps.length;
  let routeCoordinates = organizeCoordsRespectingStandardDeviation(
    steps,
    avgLength
  );
  for (var j = 0; j < routeCoordinates.length; j++) {
    await retrieveWeatherFromLocation(
      routeCoordinates[j][0],
      routeCoordinates[j][1]
    );
  }
}
function resetMarkers() {
  var markers = $("div[data-marker]");
  if (markers) markers.remove();
}
// This prevents markers from "bunching together" on a route when there are many steps within a certain area.
// Imagine navigating through a city; this function prevents weather markers from appearing at each turn.
function organizeCoordsRespectingStandardDeviation(steps, avgLength) {
  const coordinateResults = [];
  const stepLengthsByLatLng = collectStepLengthsByLatLng(steps);
  const stDevLength = calculateStandardDeviationOfLength(steps, avgLength);
  for (let latLng of stepLengthsByLatLng.keys()) {
    if (stepLengthsByLatLng.get(latLng) > stDevLength) {
      let latLngArr = latLng.split(latLonKeySeparator);
      coordinateResults.push([
        Number.parseFloat(latLngArr[0]),
        Number.parseFloat(latLngArr[1]),
      ]);
    }
  }
  appendOriginAndDestinationToCoordinates(coordinateResults);
  return coordinateResults;
}
function collectStepLengthsByLatLng(routeSteps) {
  const result = new Map();
  for (let i = 0; i < routeSteps.length; i++) {
    if (routeSteps[i].children[2]) {
      let stepLat = routeSteps[i].dataset.lat;
      let stepLng = routeSteps[i].dataset.lng;
      let stepDistance = routeSteps[i].children[2].textContent.trim();
      let stepLength = Number.parseFloat(
        stepDistance.substring(0, stepDistance.length - 2)
      );
      let stepUnit = stepDistance.substring(stepDistance.length - 2);
      if (stepUnit === "mi") {
        result.set(stepLat + latLonKeySeparator + stepLng, stepLength);
      } else if (stepUnit === "ft") {
        result.set(stepLat + latLonKeySeparator + stepLng, stepLength / 5280);
      }
    }
  }
  return result;
}
function calculateStandardDeviationOfLength(routeSteps, avgStepLength) {
  let sumOfLengthDiff = 0;
  for (let i = 0; i < routeSteps.length; i++) {
    if (routeSteps[i].children[2]) {
      let stepDistance = routeSteps[i].children[2].textContent.trim();
      let stepLength = Number.parseFloat(
        stepDistance.substring(0, stepDistance.length - 2)
      );
      let stepUnit = stepDistance.substring(stepDistance.length - 2);
      if (stepUnit === "mi") {
        sumOfLengthDiff += Math.pow(stepLength - avgStepLength, 2);
      } else if (stepUnit === "ft") {
        let stepLengthMi = stepLength / 5280;
        sumOfLengthDiff += Math.pow(stepLengthMi - avgStepLength, 2);
      }
    }
  }
  return Math.pow(sumOfLengthDiff / routeSteps.length, 0.5);
}
function appendOriginAndDestinationToCoordinates(coordinates) {
  let originLngLatArr = directions.getOrigin().geometry.coordinates;
  let destLngLatArr = directions.getDestination().geometry.coordinates;
  coordinates.splice(0, 0, [originLngLatArr[1], originLngLatArr[0]]);
  coordinates.splice(coordinates.length, 0, [
    destLngLatArr[1],
    destLngLatArr[0],
  ]);
  return coordinates;
}

async function retrieveWeatherFromLocation(lat, lon) {
  try {
    const response = await fetch(
      "https://api.openweathermap.org/data/3.0/onecall?lat=" +
        lat +
        "&lon=" +
        lon +
        "&appid=b8fc387331c767a99a233c98e09002f5&units=imperial"
    );
    const data = await response.json();
    buildMarkersForWeatherData(data, lat, lon);
  } catch (error) {
    console.log(error);
  }
}
function buildMarkersForWeatherData(weatherData, lat, lon) {
  let markerEl = $("<div>");
  markerEl.css(
    "backgroundImage",
    'url("https://openweathermap.org/img/wn/' +
      weatherData.current.weather[0].icon.replace("n", "d") +
      '@2x.png")'
  );
  markerEl.css({ width: 40, height: 40, backgroundSize: "100%" });
  markerEl.attr({
    "data-marker": "true",
    "data-lat": lat,
    "data-lon": lon,
    "data-toggle": "modal",
    "data-target": "#exampleModal",
  });
  routeWeatherData.set(
    lat + latLonKeySeparator + lon,
    new WeatherData(
      weatherData.current.temp,
      weatherData.current.weather[0].icon.replace("n", "d"),
      weatherData.current.weather[0].description,
      weatherData.daily[0].temp.min,
      weatherData.daily[0].temp.max
    )
  );
  markerEl.on("click", handleMarkerModalOpen);
  // Add markers to the map, making sure they are not covering the route.
  let adjustedLon = Number.parseFloat(lon + 0.003);
  let adjustedLat = Number.parseFloat(lat + 0.003);
  new mapboxgl.Marker(markerEl[0])
    .setLngLat([adjustedLon, adjustedLat])
    .addTo(map);
}

function handleMarkerModalOpen(event) {
  $("#weatherModal").css("display", "block");
  event.preventDefault();
  const weatherData = routeWeatherData.get(
    event.target.dataset.lat + latLonKeySeparator + event.target.dataset.lon
  );
  $("#tempAvg").html(weatherData.temp + "°");
  const weatherIcon = $("#weatherIcon");
  weatherIcon.attr(
    "src",
    "https://openweathermap.org/img/wn/" + weatherData.icon + "@2x.png"
  );
  $("#tempMin").html(weatherData.min + "°");
  $("#tempMax").html(weatherData.max + "°");
  $("#weatherDescription").html(weatherData.description);
}
$(".close").on("click", handleModalClose);
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

function handleModalClose(event) {
  event.preventDefault();
  $("#weatherModal").css("display", "none");
}

class WeatherData {
  constructor(temp, icon, description, min, max) {
    this.temp = temp;
    this.icon = icon;
    this.description = description;
    this.min = min;
    this.max = max;
  }
}

class SearchGeocodeResults {
  constructor(origin, destination) {
    this.origin = origin;
    this.destination = destination;
  }
}

class ReverseGeocodeResult {
  constructor(city, state, country, lat, lng) {
    this.city = city;
    this.state = state;
    this.country = country;
    this.lat = lat;
    this.lng = lng;
  }
}
