var themeSwitcher = $("#theme-switcher");
var container = $("body");
var header = $("#header");
var footer = $("#footer");
var headerLogo = $("#headerLogo");
var mapShadow = $("#map");
var modalEl = $("#weatherModal");
var spanEl = $(".close")[0];
var toggleColor = $("#toggle");

var mode = "dark";
var directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "imperial",
  profile: "mapbox/driving",
  routePadding: 10,
  interactive: false,
});
var map = {};
var routeWeatherData = new Map();
var latLonKeySeparator = ",";
var localStorageKey = "travelBuddySearchHistory";

$(function () {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiZHNzdGFkMDIiLCJhIjoiY2xpYnl1b3VjMGZ0ZDNwbjFxbmR3ejdqcSJ9.3mwOKhxYibQ9YZdqNZHErQ";
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [-104.9903, 39.7392],
    zoom: 12,
  });

  map.addControl(directions, "top-right");
  moveDirections();

  directions.on("route", handleRoute);
});

function handleSwitchTheme() {
  if (mode === "dark") {
    mode = "light";
    themeSwitcher.attr("class", "switchBox");
    container.attr("class", "light");
    header.attr("class", "lightHeader");
    footer.attr("class", "lightFooter");
    $("#headerLogo").src = "images/logoLight.png";
    mapShadow.addClass("mapLight");
    mapShadow.removeClass("mapDark");
    toggleColor.addClass("toggleLight");
    toggleColor.removeClass("toggleDark");
    $("#modalCont").addClass("modal-content-light");
    $("#modalCont").removeClass("modal-content-dark");
  } else {
    mode = "dark";
    themeSwitcher.attr("class", "switchBoxChecked");
    container.attr("class", "dark");
    header.attr("class", "darkHeader");
    footer.attr("class", "darkFooter");
    $("#headerLogo").src = "images/logoDark.png";
    mapShadow.addClass("mapDark");
    mapShadow.removeClass("mapLight");
    toggleColor.addClass("toggleDark");
    toggleColor.removeClass("toggleLight");
    $("#modalCont").addClass("modal-content-dark");
    $("#modalCont").removeClass("modal-content-light");
  }
}

$("#tempHistory").on("click", handleSearchHistory);
function handleSearchHistory(event) {
  event.preventDefault();
  var alertText = "";
  var searchHistoryArr = JSON.parse(
    localStorage.getItem(localStorageKey) //make global var
  );
  if (Array.isArray(searchHistoryArr)) {
    for (var i = 0; i < searchHistoryArr.length; i++) {
      var origin = searchHistoryArr[i].origin;
      var destination = searchHistoryArr[i].destination;
      alertText +=
        origin.city +
        ", " +
        origin.state +
        " " +
        origin.country +
        " - TO - " +
        destination.city +
        ", " +
        destination.state +
        " " +
        destination.country +
        "\n";
    }
    alert(alertText);
  }
}
function SearchGeocodeResults(origin, destination) {
  this.origin = origin;
  this.destination = destination;
}
function ReverseGeocodeResult(city, state, country, lat, lng) {
  this.city = city;
  this.state = state;
  this.country = country;
  this.lat = lat;
  this.lng = lng;
}
function handleRoute() {
  prepareSearchHistory();
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
    retrieveWeatherFromLocation(routeCoordinates[j][0], routeCoordinates[j][1]);
  }
}
function prepareSearchHistory() {
  var orginLngLatArr = directions.getOrigin().geometry.coordinates;
  fetch(
    "https://api.openweathermap.org/geo/1.0/reverse?lat=" +
      orginLngLatArr[1] +
      "&lon=" +
      orginLngLatArr[0] +
      "&appid=b8fc387331c767a99a233c98e09002f5&units=imperial"
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      console.log(data);
      var reverseGeoOrigin = new ReverseGeocodeResult(
        data[0].name,
        data[0].state,
        data[0].country,
        orginLngLatArr[1],
        orginLngLatArr[0]
      );
      retrieveDestinationAndSaveSearch(reverseGeoOrigin);
    })
    .catch(function (error) {
      console.log(error);
    });
}
function retrieveDestinationAndSaveSearch(reverseGeoOrigin) {
  var destLngLatArr = directions.getDestination().geometry.coordinates;
  fetch(
    "https://api.openweathermap.org/geo/1.0/reverse?lat=" +
      destLngLatArr[1] +
      "&lon=" +
      destLngLatArr[0] +
      "&appid=b8fc387331c767a99a233c98e09002f5&units=imperial"
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      console.log(data);
      var searchHistoryArr = [];
      var reverseGeoDest = new ReverseGeocodeResult(
        data[0].name,
        data[0].state,
        data[0].country,
        destLngLatArr[1],
        destLngLatArr[0]
      );
      var searchHistory = new SearchGeocodeResults(
        reverseGeoOrigin,
        reverseGeoDest
      );
      searchHistoryArr = JSON.parse(
        localStorage.getItem(localStorageKey) //make global var
      );
      if (Array.isArray(searchHistoryArr)) {
        searchHistoryArr.push(searchHistory);
      } else {
        searchHistoryArr = [];
        searchHistoryArr.push(searchHistory);
      }
      localStorage.setItem(localStorageKey, JSON.stringify(searchHistoryArr));
    })
    .catch(function (error) {
      console.log(error);
    });
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
      var weatherToday = data.current;
      var markerEl = $("<div>");
      markerEl.css(
        "backgroundImage",
        'url("https://openweathermap.org/img/wn/' +
          weatherToday.weather[0].icon.replace("n", "d") +
          '@2x.png")'
      );
      markerEl.css("width", 40);
      markerEl.css("height", 40);
      markerEl.css("backgroundSize", "100%");
      markerEl.attr("data-marker", "true");
      markerEl.attr("data-lat", lat);
      markerEl.attr("data-lon", lon);
      markerEl.attr("data-toggle", "modal");
      markerEl.attr("data-target", "#exampleModal");
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

      spanEl.onclick = function () {
        modalEl.css("display", "none");
      };

      window.onclick = function (event) {
        if (event.target == modalEl[0]) {
          modalEl.css("display", "none");
        }
      };

      markerEl.on("click", handleModalCall);
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

function handleModalCall(event) {
  modalEl.css("display", "block");
  event.preventDefault();
  var weatherData = routeWeatherData.get(
    event.target.dataset.lat + latLonKeySeparator + event.target.dataset.lon
  );
  $("#modTemp").html(weatherData.temp + "°");
  var weatherIcon = $("#weather-icon");
  weatherIcon.attr(
    "src",
    "https://openweathermap.org/img/wn/" + weatherData.icon + "@2x.png"
  );
  $("#modTempMin").html(weatherData.min + "°");
  $("#modTempMax").html(weatherData.max + "°");
  $("#weatherDescription").html(weatherData.description);
}
function WeatherData(temp, icon, description, min, max) {
  this.temp = temp;
  this.icon = icon;
  this.description = description;
  this.min = min;
  this.max = max;
}

themeSwitcher.on("click", handleSwitchTheme);

// Justins work
function moveDirections() {
  const output = $("#mapTest");
  output.empty();
  const input = $(".mapboxgl-ctrl");
  output.append(input[0]);
}
