var themeSwitcher = $("#theme-switcher");
var container = $("body");
var header = $("#header");
var footer = $("#footer");
var mapShadow = $("#map");

var mode = "dark";
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

var directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "imperial",
  profile: "mapbox/driving",
  routePadding: 10,
  interactive: false,
});

map.addControl(directions, "top-right");
moveDirections();

directions.on("route", handleRoute);

function switchTheme() {
  if (mode === "dark") {
    mode = "light";
    themeSwitcher.attr("class", "switchBox");
    container.attr("class", "light");
    header.attr("class", "lightHeader");
    footer.attr("class", "lightFooter");
    mapShadow.attr("class", "mapLight");
  } else {
    mode = "dark";
    themeSwitcher.attr("class", "switchBoxChecked");
    container.attr("class", "dark");
    header.attr("class", "darkHeader");
    footer.attr("class", "darkFooter");
    mapShadow.attr("class", "mapDark");
  }
}

function handleRoute() {
  var markers = $("div[data-marker]");
  if (markers) markers.remove();
  var steps = $(".mapbox-directions-step");
  var routeDistance = $(".mapbox-directions-route-summary")[0].children[1]
    .textContent;
  var routeLength = routeDistance.substring(0, routeDistance.length - 2);
  var avgLength = routeLength / steps.length;
  var sumOfLengthDiff = 0;
  var stepLengths = new Map();
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
    //ONLY PUSH RELEVANT POINTS - move out of this loop
    //coordinates.push([stepLat, stepLng]);
  }
  var coordinates = [];
  var stDevLength = Math.pow(sumOfLengthDiff / steps.length, 0.5);
  for (var latLng of stepLengths.keys()) {
    console.log(stepLengths.get(latLng));
    if (stepLengths.get(latLng) > stDevLength) {
      var latLngArr = latLng.split(latLonKeySeparator);
      coordinates.push([latLngArr[0], latLngArr[1]]);
    }
  }
  //rethink adding origin back; may have clustering at start and end
  console.log("all 'safe coords'");
  console.log(coordinates);
  var originLngLatArr = directions.getOrigin().geometry.coordinates;
  var destLngLatArr = directions.getDestination().geometry.coordinates;
  coordinates.push([originLngLatArr[1], originLngLatArr[0]]);
  coordinates.push([destLngLatArr[1], destLngLatArr[0]]);
  for (var j = 0; j < coordinates.length; j++) {
    retrieveWeatherFromLocation(coordinates[j][0], coordinates[j][1]);
  }
}
function retrieveWeatherFromLocation(lat, lon) {
  fetch(
    "https://api.openweathermap.org/data/3.0/onecall?lat=" +
      lat +
      "&lon=" +
      lon +
      "&appid=212be1e5713240df908c291b8fbba3f8&units=imperial"
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
      markerEl.attr("data-marker", "true");
      markerEl.css("width", 40);
      markerEl.css("height", 40);
      markerEl.css("backgroundSize", "100%");
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

      markerEl.on("click", placeholderModalCall);
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
function placeholderModalCall(event) {
  event.preventDefault();
  var weatherData = routeWeatherData.get(
    event.target.dataset.lat + latLonKeySeparator + event.target.dataset.lon
  );
  alert(
    "Humidity: " +
      weatherData.humidity +
      "\nTemp: " +
      weatherData.temp +
      "\nVisibility: " +
      weatherData.visibility +
      "\nDescription: " +
      weatherData.description +
      "\nWind: " +
      weatherData.windGust
  );
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
