var themeSwitcher = $("#theme-switcher");
var container = $("body");
var header = $("#header");
var footer = $("#footer");
var headerLogo = $("#headerLogo");
var mapShadow = $("#map");
var weatherModalEl = $("#weatherModal");
var searchHistoryModalEl = $("#searchHistoryModal");
var closeModalEl = $(".close");
var toggleColor = $("#toggle");

var mode = "dark";
var directions;
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

// Justins work
function moveDirections() {
  const output = $("#mapTest");
  output.empty();
  const input = $(".mapboxgl-ctrl");
  output.append(input[0]);
}
function handleSwitchTheme() {
  if (mode === "dark") {
    mode = "light";
    themeSwitcher.addClass("switchBox");
    container.removeClass("dark");
    container.addClass("light");
    header.addClass("lightHeader");
    footer.addClass("lightFooter");
    $("#headerLogo").attr("src", "images/logoLight.png");
    mapShadow.addClass("mapLight");
    mapShadow.removeClass("mapDark");
    toggleColor.addClass("toggleLight");
    toggleColor.removeClass("toggleDark");
    $("#modalCont").addClass("modal-content-light");
    $("#modalCont").removeClass("modal-content-dark");
    document.getElementById("dropdown-menu").style.backgroundColor = "white";
  } else {
    mode = "dark";
    themeSwitcher.addClass("switchBoxChecked");
    container.removeClass("light");
    container.addClass("dark");
    header.addClass("darkHeader");
    footer.addClass("darkFooter");
    $("#headerLogo").attr("src", "images/logoDark.png");
    mapShadow.addClass("mapDark");
    mapShadow.removeClass("mapLight");
    toggleColor.addClass("toggleDark");
    toggleColor.removeClass("toggleLight");
    $("#modalCont").addClass("modal-content-dark");
    $("#modalCont").removeClass("modal-content-light");
    document.getElementById("dropdown-menu").style.backgroundColor = "black";
  }
}
function handleSearchHistorySelect(event) {
  event.preventDefault();
  var orginDestinationNameArr = event.target.textContent.split(" - TO - ");
  var orginLat = Number.parseFloat(event.target.dataset.orginlat);
  var orginLng = Number.parseFloat(event.target.dataset.orginlng);
  var destinationLat = Number.parseFloat(event.target.dataset.destinationlat);
  var destinationLng = Number.parseFloat(event.target.dataset.destinationlng);
  directions.setOrigin([orginLng, orginLat]);
  directions.setDestination([destinationLng, destinationLat]);
  var originInputText = $("#mapbox-directions-origin-input")[0].children[0]
    .children[1];
  originInputText.value = orginDestinationNameArr[0];
  var destinationInputText = $("#mapbox-directions-destination-input")[0]
    .children[0].children[1];
  destinationInputText.value = orginDestinationNameArr[1];
  searchHistoryModalEl.css("display", "none");
}
function handleSearchHistory(event) {
  event.preventDefault();
  var searchResultContainer = $("#dropdown-menu-dark");
  searchHistoryModalEl.css("display", "block");
  var searchHistoryArr = JSON.parse(localStorage.getItem(localStorageKey));
  if (Array.isArray(searchHistoryArr)) {
    for (var i = 0; i < searchHistoryArr.length; i++) {
      var origin = searchHistoryArr[i].origin;
      var destination = searchHistoryArr[i].destination;
      var searchEntry = $("<li>");
      searchEntry.addClass("modalText");
      searchEntry.attr("data-city", origin.city);
      searchEntry.attr("data-state", origin.state);
      searchEntry.attr("data-orginLat", origin.lat);
      searchEntry.attr("data-orginLng", origin.lng);
      searchEntry.attr("data-destinationLat", destination.lat);
      searchEntry.attr("data-destinationLng", destination.lng);
      searchEntry.text(origin.city + " - TO - " + destination.city);
      searchResultContainer.append(searchEntry);
      $("li").on("click", handleSearchHistorySelect);
    }
  } else {
    if (mode == "dark") searchResultContainer.css("color", "white");
    searchResultContainer.text("No search history.");
  }
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
      markerEl.on("click", handleMarkerModalCall);
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
  event.target.parentNode.parentNode.style.setProperty("display", "none");
}
function handleMarkerModalCall(event) {
  weatherModalEl.css("display", "block");
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

closeModalEl.on("click", handleModalClose);
themeSwitcher.on("click", handleSwitchTheme);
$("#searchHistoryModalBtn").on("click", handleSearchHistory);
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};
function WeatherData(temp, icon, description, min, max) {
  this.temp = temp;
  this.icon = icon;
  this.description = description;
  this.min = min;
  this.max = max;
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
