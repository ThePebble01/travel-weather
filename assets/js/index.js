//make use of async await

var routeWeatherData = new Map();
var latLonKeySeparator = ",";

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
moveDirectionsControl();
directions.on("route", handleRoute);

function moveDirectionsControl() {
  const routeInstructions = $("#routeInstructions");
  routeInstructions.empty();
  const mapboxControls = $(".mapboxgl-ctrl");
  routeInstructions.append(mapboxControls[0]);
}

function handleRoute() {
  resetMarkers();
  var steps = $(".mapbox-directions-step");
  var routeDistance = $(".mapbox-directions-route-summary")[0].children[1]
    .textContent;
  var routeLength = routeDistance.substring(0, routeDistance.length - 2);
  var routeCoordinates = organizeCoordsRespectingStandardDeviation(
    routeLength,
    steps
  );
  routeCoordinates = appendCoordinatesForStepsWithLargeDistance(
    routeLength,
    routeCoordinates
  );
  for (var j = 0; j < routeCoordinates.length; j++) {
    // break down function, consider changing param to an array
    retrieveWeatherFromLocation(routeCoordinates[j][0], routeCoordinates[j][1]);
  }
}
function resetMarkers() {
  var markers = $("div[data-marker]");
  if (markers) markers.remove();
}
function organizeCoordsRespectingStandardDeviation(routeLength, steps) {
  var coordinateResults = [];
  var stepLengths = new Map();
  var avgLength = routeLength / steps.length;
  var sumOfLengthDiff = 0;
  for (var i = 0; i < steps.length; i++) {
    if (steps[i].children[2]) {
      var stepLat = steps[i].dataset.lat;
      var stepLng = steps[i].dataset.lng;
      var stepDistance = steps[i].children[2].textContent.trim();
      var stepLength = Number.parseFloat(
        stepDistance.substring(0, stepDistance.length - 2)
      );
      var stepUnit = stepDistance.substring(stepDistance.length - 2);
      if (stepUnit === "mi") {
        sumOfLengthDiff += Math.pow(stepLength - avgLength, 2);
        stepLengths.set(stepLat + latLonKeySeparator + stepLng, stepLength);
      } else if (stepUnit === "ft") {
        var stepLengthMi = stepLength / 5280;
        sumOfLengthDiff += Math.pow(stepLengthMi - avgLength, 2);
        stepLengths.set(stepLat + latLonKeySeparator + stepLng, stepLengthMi);
      }
    }
  }
  var stDevLength = Math.pow(sumOfLengthDiff / steps.length, 0.5);
  for (var latLng of stepLengths.keys()) {
    if (stepLengths.get(latLng) > stDevLength) {
      var latLngArr = latLng.split(latLonKeySeparator);
      coordinateResults.push([
        Number.parseFloat(latLngArr[0]),
        Number.parseFloat(latLngArr[1]),
      ]);
    }
  }
  var originLngLatArr = directions.getOrigin().geometry.coordinates;
  var destLngLatArr = directions.getDestination().geometry.coordinates;
  coordinateResults.splice(0, 0, [originLngLatArr[1], originLngLatArr[0]]);
  coordinateResults.splice(coordinateResults.length, 0, [
    destLngLatArr[1],
    destLngLatArr[0],
  ]);
  return coordinateResults;
}
function appendCoordinatesForStepsWithLargeDistance(routeLength, coordinates) {
  var priorPoint;
  var stepDistances = [];
  for (var i = 0; i < coordinates.length; i++) {
    if (priorPoint) {
      stepDistances.push(
        calculateEuclideanDistance(
          priorPoint[0],
          priorPoint[1],
          coordinates[i][0],
          coordinates[i][1]
        )
      );
    }
    priorPoint = coordinates[i];
  }
  var avgDistance = routeLength / stepDistances.length;
  var coordIndexes = [];
  for (var i = 0; i < stepDistances.length; i++) {
    if (avgDistance < stepDistances[i]) coordIndexes.push(i);
  }
  // Each coordIndexes element cooresponds to the relevant index and index +1 in the coordinates array
  for (var i = 0; i < coordIndexes.length; i++) {
    var firstCoord = coordinates[coordIndexes[i]];
    var secondCoord = coordinates[coordIndexes[i] + 1];
    if (firstCoord && secondCoord) {
      var midPointCoord = [];
      midPointCoord[0] = (firstCoord[0] + secondCoord[0]) / 2;
      midPointCoord[1] = (firstCoord[1] + secondCoord[1]) / 2;
      coordinates.push(midPointCoord);
    }
  }
  return coordinates;
}
function calculateEuclideanDistance(x1, y1, x2, y2) {
  return Math.pow(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2), 0.5);
}
//review api documentation to see if this can be bulkified....
function retrieveWeatherFromLocation(lat, lon) {
  fetch(
    "https://api.openweathermap.org/data/3.0/onecall?lat=" +
      lat +
      "&lon=" +
      lon +
      "&appid=b8fc387331c767a99a233c98e09002f5&units=imperial"
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      var weatherToday = data.current; // return this, pass data to buildMarker f()
      var markerEl = $("<div>");
      markerEl.css(
        "backgroundImage",
        'url("https://openweathermap.org/img/wn/' +
          weatherToday.weather[0].icon.replace("n", "d") +
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
          data.current.temp,
          weatherToday.weather[0].icon.replace("n", "d"),
          weatherToday.weather[0].description,
          data.daily[0].temp.min,
          data.daily[0].temp.max
        )
      );
      markerEl.on("click", handleMarkerModalOpen);
      // Add markers to the map.
      var tweakedLon = Number.parseFloat(lon + 0.003);
      var tweakedLat = Number.parseFloat(lat + 0.003);
      new mapboxgl.Marker(markerEl[0])
        .setLngLat([tweakedLon, tweakedLat])
        .addTo(map);
    })
    .catch(function (error) {
      console.log(error);
    });
}
function handleModalClose(event) {
  event.preventDefault();
  $("#weatherModal").css("display", "none");
}
function handleMarkerModalOpen(event) {
  $("#weatherModal").css("display", "block");
  event.preventDefault();
  var weatherData = routeWeatherData.get(
    event.target.dataset.lat + latLonKeySeparator + event.target.dataset.lon
  );
  $("#tempAvg").html(weatherData.temp + "°");
  var weatherIcon = $("#weatherIcon");
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
