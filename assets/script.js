var themeSwitcher = $("#theme-switcher");
var container = $("body");
var header = $("#header");
var footer = $("#footer");
var headerLogo = $("#headerLogo");
var mapShadow = $("#map");
var toggleColor = $("#toggle");

// modal (don't convert to jquery)

var modal = document.getElementById("weatherModal");
var modalDescription = document.getElementById("#modalDescription");
var span = document.getElementsByClassName("close")[0];

//

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
    document.getElementById("headerLogo").src = "images/logoLight.png";
    mapShadow.addClass("mapLight");
    mapShadow.removeClass("mapDark");
    toggleColor.addClass("toggleLight");
    toggleColor.removeClass("toggleDark");
  } else {
    mode = "dark";
    themeSwitcher.attr("class", "switchBoxChecked");
    container.attr("class", "dark");
    header.attr("class", "darkHeader");
    footer.attr("class", "darkFooter");
    document.getElementById("headerLogo").src = "images/logoDark.png";
    mapShadow.addClass("mapDark");
    mapShadow.removeClass("mapLight");
    toggleColor.addClass("toggleDark");
    toggleColor.removeClass("toggleLight");
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
      var weatherToday = data.current;
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
          weatherToday.temp,
          data.daily[0].weather.icon,
          data.daily[0].weather.description,
          data.daily[0].temp.min,
          data.daily[0].temp.max,
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
      new mapboxgl.Marker(el[0]).setLngLat([tweakedLon, tweakedLat]).addTo(map);
    })
    .catch(function (error) {
      console.log(error);
    });
}

function modalCall(event) {
  modal.style.display = "block";
  event.preventDefault();
  var weatherData = routeWeatherData.get(
    event.target.dataset.lat +
      latLonWeatherDataKeySeparator +
      event.target.dataset.lon
  );
  $("#modHumid").html(weatherData.humidity + "%");
  $("#modTemp").html(weatherData.temp + "°");
  $("#modWind").html(weatherData.windGust + "%");
}
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#instance_methods
function WeatherData(temp, icon, description, min, max) {
  this.temp = temp;
  this.icon = icon;
  this.description = description;
  this.min = min;
  this.max = max;
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
