var themeSwitcher = $("#theme-switcher");
var container = $("body");
var header = $("#header");
var footer = $("#footer");

var mode = "dark";

// map functionality.
mapboxgl.accessToken =
  "pk.eyJ1IjoiZHNzdGFkMDIiLCJhIjoiY2xpYnl1b3VjMGZ0ZDNwbjFxbmR3ejdqcSJ9.3mwOKhxYibQ9YZdqNZHErQ";
const map = new mapboxgl.Map({
  container: "map",
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
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

function getCoords(event) {
  var steps = $(".mapbox-directions-step");
  var coordinates = [];
  for (var i = 0; i < steps.length; i++) {
    //filter coords
    coordinates.push([steps[i].dataset.lat, steps[i].dataset.lng]);
  }
  console.log(coordinates);
  var stepContainer = $(".directions-control-instructions");
  $("#route-instructions-container").append(stepContainer);
  for (var j = 0; j < coordinates.length; j++) {
    /*
    weather api

    delay until weather retrieved for all coords
    */
    retrieveWeatherFromLocation(coordinates[j][0], coordinates[j][1]);
  }
}
function retrieveWeatherFromLocation(lat, lon) {
  //
  //data/3.0/onecall?
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
      const el = document.createElement("div"); //JQUERY THIS AND DEPENDENCIES
      const width = 40;
      const height = 40;
      el.style.backgroundImage = `url(https://placekitten.com/g/${width}/${height}/)`; //images local; dependent on weather desc
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.backgroundSize = "100%";
      el.setAttribute("data-lat", lat);
      el.setAttribute("data-lon", lon);
      allWeatherData.set(
        lat + "-" + lon,
        new WeatherData(
          data.list[0].main.humidity,
          data.list[0].main.temp,
          data.list[0].visibility,
          data.list[0].weather[0].description,
          data.list[0].wind.gust
        )
      );
      el.addEventListener("click", placeholderModalCall);
      // Add markers to the map.
      var tweakedLon = Number.parseFloat(lon + 0.003);
      var tweakedLat = Number.parseFloat(lat + 0.003);
      console.log(typeof tweakedLat);
      new mapboxgl.Marker(el).setLngLat([tweakedLon, tweakedLat]).addTo(map);
    })
    .catch(function (error) {
      console.log(error);
    });
}
function placeholderModalCall(event) {
  console.log(event.target);
}
// TEMP SPOT
var allWeatherData = new Map(); //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#instance_methods
function WeatherData(humidity, temp, visibility, description, windGust) {
  this.humidity = humidity;
  this.temp = temp;
  this.visibility = visibility;
  this.description = description;
  this.windGust = windGust;
}
directions.on("route", getCoords);

themeSwitcher.on("click", function () {
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
});
