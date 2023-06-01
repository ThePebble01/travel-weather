var themeSwitcher = document.querySelector("#theme-switcher");
var container = document.querySelector("body");
var header = document.querySelector("#header");
var footer = document.querySelector("#footer");

var mode = "dark";

themeSwitcher.addEventListener("click", function () {
  if (mode === "dark") {
    mode = "light";
    themeSwitcher.setAttribute("class", "switchBox");
    container.setAttribute("class", "light");
    header.setAttribute("class", "lightHeader");
    footer.setAttribute("class", "lightFooter");
  } else {
    mode = "dark";
    themeSwitcher.setAttribute("class", "switchBoxChecked");
    container.setAttribute("class", "dark");
    header.setAttribute("class", "darkHeader");
    footer.setAttribute("class", "darkFooter");
  }
});

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

map.addControl(
  new MapboxDirections({
    accessToken: mapboxgl.accessToken,
  }),
  "top-left"
);

var cityStart = document.getElementById("cityStart");
var cityEnd = document.getElementById("cityEnd");
var searchButton = document.getElementById("search");

searchButton.addEventListener("click", function (event) {
  var savedTrips = {
    cityStart: cityStart.value,
    cityEnd: cityEnd.value,
  };

  this.localStorage.setItem("savedTrips", JSON.stringify(savedTrips));
  displayTrip();
});

function displayTrip() {
  // add function here
}
