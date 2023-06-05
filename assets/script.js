var themeSwitcher = $("#theme-switcher");
var container = $("body");
var header = $("#header");
var footer = $("#footer");
var headerLogo = $("#headerLogo");
var mapShadow = $("#map");

// modal (don't convert to jquery)

var modal = document.getElementById("weatherModal");
var modalDescription = document.getElementById("#modalDescription");
var span = document.getElementsByClassName("close")[0];

//

var mode = "dark";
var directions;
var map = {};
var routeWeatherData = new Map();
var latLonKeySeparator = ",";

$(function () {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiZHNzdGFkMDIiLCJhIjoiY2xpYnl1b3VjMGZ0ZDNwbjFxbmR3ejdqcSJ9.3mwOKhxYibQ9YZdqNZHErQ";
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [-104.9903, 39.7392],
    zoom: 12,
  });

  directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: "imperial",
    profile: "mapbox/driving",
    routePadding: 10,
    interactive: false,
  });

  map.addControl(directions, "top-right");
  moveDirections();

  directions.on("route", handleRoute);
});

function switchTheme() {
  if (mode === "dark") {
    mode = "light";
    themeSwitcher.attr("class", "switchBox");
    container.attr("class", "light");
    header.attr("class", "lightHeader");
    footer.attr("class", "lightFooter");
    document.getElementById("headerLogo").src = "images/logoLight.png";
    mapShadow.addClass("mapLight");
    mapShadow.removeClass("mapDark");
  } else {
    mode = "dark";
    themeSwitcher.attr("class", "switchBoxChecked");
    container.attr("class", "dark");
    header.attr("class", "darkHeader");
    footer.attr("class", "darkFooter");
    document.getElementById("headerLogo").src = "images/logoDark.png";
    mapShadow.addClass("mapDark");
    mapShadow.removeClass("mapLight");
  }
}
function handleRoute() {
  resetMarkers();
  var steps = $(".mapbox-directions-step");
  var routeDistance = $(".mapbox-directions-route-summary")[0].children[1]
    .textContent;
  var routeLength = routeDistance.substring(0, routeDistance.length - 2);
  var coordinates = organizeCoordsRespectingStandardDeviation(
    routeLength,
    steps
  );
  // Purge the console.log before deploying
  console.log("filtered coords");
  console.log(coordinates);
  coordinates = appendCoordinatesForStepsWithLargeDistance(
    routeLength,
    coordinates
  );
  console.log("coords after appendCoordinatesForStepsWithLargeDistance");
  console.log(coordinates);
  for (var j = 0; j < coordinates.length; j++) {
    console.log(coordinates[j]);
    retrieveWeatherFromLocation(coordinates[j][0], coordinates[j][1]);
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
    console.log(stepLengths.get(latLng));
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
  // coordIndexes coorespond to the relevant index and index +1 in the coordinates array
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
/*  Marlena to swap
    "https://api.openweathermap.org/data/2.5/forecast?lat=" +
      lat +
      "&lon=" +
      lon +
      "&appid=5a5f2543215b0ae09a5dc07887c20551&units=imperial"


      "https://api.openweathermap.org/data/3.0/onecall?lat=" +
      lat +
      "&lon=" +
      lon +
      "&appid=212be1e5713240df908c291b8fbba3f8&units=imperial"
*/
function retrieveWeatherFromLocation(lat, lon) {
  fetch(
    "https://api.openweathermap.org/data/2.5/forecast?lat=" +
      lat +
      "&lon=" +
      lon +
      "&appid=5a5f2543215b0ae09a5dc07887c20551&units=imperial"
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      var weatherToday = data.list[0];
      var markerEl = $("<div>");
      markerEl.css(
        "backgroundImage",
        'url("https://openweathermap.org/img/wn/' +
          weatherToday.weather[0].icon.replace("n", "d") +
          '@2x.png")'
      );
      markerEl.css("width", 40);
      markerEl.css("height", 40);
      markerEl.css("border", "1px solid");
      markerEl.css("backgroundSize", "100%");
      markerEl.attr("data-marker", "true");
      markerEl.attr("data-lat", lat);
      markerEl.attr("data-lon", lon);
      markerEl.attr("data-toggle", "modal");
      markerEl.attr("data-target", "#exampleModal");
      routeWeatherData.set(
        lat + latLonKeySeparator + lon,
        new WeatherData(
          weatherToday.main.humidity,
          weatherToday.main.temp,
          weatherToday.visibility,
          weatherToday.weather[0].description,
          weatherToday.wind.gust
        )
      );

      span.onclick = function () {
        modal.style.display = "none";
      };

      window.onclick = function (event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
      };

      el.on("click", modalCall);
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

function modalCall(event) {
  modal.style.display = "block";
  event.preventDefault();
  var weatherData = routeWeatherData.get(
    event.target.dataset.lat + latLonKeySeparator + event.target.dataset.lon
  );
  $("#modHumid").html(weatherData.humidity + "%");
  $("#modTemp").html(weatherData.temp + "°");
  $("#modWind").html(weatherData.windGust + "%");
}
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#instance_methods
function WeatherData(humidity, temp, visibility, description, windGust) {
  this.humidity = humidity;
  this.temp = temp;
  this.visibility = visibility;
  this.description = description;
  this.windGust = windGust;
}

themeSwitcher.on("click", switchTheme);

// Justins work
function moveDirections() {
  const output = $("#mapTest");
  output.empty();
  const input = $(".mapboxgl-ctrl");
  output.append(input[0]);
}
