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
});

map.addControl(directions, "top-right");
mapTest();

function getCoords(event) {
  var steps = $(".mapbox-directions-step");
  var coordinates = [];
  for (var i = 0; i < steps.length; i++) {
    //filter coords
    coordinates.push([steps[i].dataset.lat, steps[i].dataset.lng]);
  }
  //! MOVE ROUTE STEPS TO OTHER CONTAINER
  console.log(coordinates);

  for (var j = 0; j < coordinates.length; j++) {
    /*
    weather api

    delay until weather retrieved for all coords
    */
    retrieveWeatherFromLocation(coordinates[j][0], coordinates[j][1]);
  }

  // approx location based on coords
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
      console.log("weather data!");
      console.log(data.list[0]);
      const el = document.createElement("div");
      const width = 40;
      const height = 40;
      el.style.backgroundImage = `url(https://placekitten.com/g/${width}/${height}/)`; //images local; dependent on weather desc
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.backgroundSize = "100%";

      el.addEventListener("click", () => {
        //code to render modal
      });
      // Add markers to the map.
      new mapboxgl.Marker(el).setLngLat([lon, lat]).addTo(map);
    })
    .catch(function (error) {
      console.log(error);
    });
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

// Justins work
function mapTest() {
  const output = $("#mapTest");
  output.empty();
  const input = $(".mapboxgl-ctrl");
  output.append(input[0]);
  console.log(input);
}
