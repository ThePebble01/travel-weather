var themeSwitcher = $("#theme-switcher");
var container = $("body");
var header = $("#header");
var footer = $("#footer");

var mode = "dark";
var routeWeatherData = new Map();

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

directions.on("route", getCoords);

function switchTheme() {
  if (mode === "dark") {
    mode = "light";
    themeSwitcher.attr("class", "switchBox");
    container.attr("class", "light");
    header.attr("class", "lightHeader");
    footer.attr("class", "lightFooter");
  } else {
    mode = "dark";
    themeSwitcher.attr("class", "switchBoxChecked");
    container.attr("class", "dark");
    header.attr("class", "darkHeader");
    footer.attr("class", "darkFooter");
  }
}

function getCoords() {
  var steps = $(".mapbox-directions-step");
  var coordinates = [];
  for (var i = 0; i < steps.length; i++) {
    //? filter coords?
    coordinates.push([steps[i].dataset.lat, steps[i].dataset.lng]);
  }
  var stepContainer = $(".directions-control-instructions");
  $("#route-instructions-container").append(stepContainer);
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
      var el = $("<div>"); //JQUERY THIS AND DEPENDENCIES
      el.css(
        "backgroundImage",
        'url("https://openweathermap.org/img/wn/' +
          data.list[0].weather[0].icon.replace("n", "d") +
          '@2x.png")'
      );
      el.css("width", 40);
      el.css("height", 40);
      el.css("backgroundSize", "100%");
      el.attr("data-lat", lat);
      el.attr("data-lon", lon);
      routeWeatherData.set(
        lat + "," + lon,
        new WeatherData(
          data.list[0].main.humidity,
          data.list[0].main.temp,
          data.list[0].visibility,
          data.list[0].weather[0].description,
          data.list[0].wind.gust
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
    event.target.dataset.lat + "," + event.target.dataset.lon
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
