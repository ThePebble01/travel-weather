var themeSwitcher = $("#theme-switcher");
var container = $("body");
var header = $("#header");
var footer = $("#footer");
var mapShadow = $("#map");

var mode = "dark";
var routeWeatherData = new Map();
var latLonWeatherDataKeySeparator = ",";

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
mapTest();

directions.on("route", handleRoute);

function switchTheme() {
  if (mode === "dark") {
    mode = "light";
    themeSwitcher.attr("class", "switchBox");
    container.attr("class", "light");
    header.attr("class", "lightHeader");
    footer.attr("class", "lightFooter");
    mapShadow.addClass("mapLight");
    mapShadow.removeClass("mapDark");
  } else {
    mode = "dark";
    themeSwitcher.attr("class", "switchBoxChecked");
    container.attr("class", "dark");
    header.attr("class", "darkHeader");
    footer.attr("class", "darkFooter");
    mapShadow.addClass("mapDark");
    mapShadow.removeClass("mapLight");
  }
}

function handleRoute() {
  var markers = $("div[data-marker]");
  if (markers) markers.remove();
  var steps = $(".mapbox-directions-step");
  var coordinates = [];
  for (var i = 0; i < steps.length; i++) {
    //? filter coords?
    coordinates.push([steps[i].dataset.lat, steps[i].dataset.lng]);
  }
  for (var j = 0; j < coordinates.length; j++) {
    retrieveWeatherFromLocation(coordinates[j][0], coordinates[j][1]);
  }
}
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
      var el = $("<div>");
      el.css(
        "backgroundImage",
        'url("https://openweathermap.org/img/wn/' +
          weatherToday.weather[0].icon.replace("n", "d") +
          '@2x.png")'
      );
      el.attr("data-marker", "true");
      el.css("width", 40);
      el.css("height", 40);
      el.css("backgroundSize", "100%");
      el.attr("data-lat", lat);
      el.attr("data-lon", lon);
      routeWeatherData.set(
        lat + latLonWeatherDataKeySeparator + lon,
        new WeatherData(
          weatherToday.main.humidity,
          weatherToday.main.temp,
          weatherToday.visibility,
          weatherToday.weather[0].description,
          weatherToday.wind.gust
        )
      );

      el.on("click", placeholderModalCall);
      // Add markers to the map.
      var tweakedLon = Number.parseFloat(lon + 0.003);
      var tweakedLat = Number.parseFloat(lat + 0.003);
      new mapboxgl.Marker(el[0]).setLngLat([tweakedLon, tweakedLat]).addTo(map);
    })
    .catch(function (error) {
      console.log(error);
    });
}
function placeholderModalCall(event) {
  event.preventDefault();
  var weatherData = routeWeatherData.get(
    event.target.dataset.lat +
      latLonWeatherDataKeySeparator +
      event.target.dataset.lon
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
function mapTest() {
  const output = $("#mapTest");
  output.empty();
  const input = $(".mapboxgl-ctrl");
  output.append(input[0]);
  console.log(input);
}
