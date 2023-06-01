var themeSwitcher = document.querySelector("#theme-switcher");
var container = document.querySelector("body");
var header = document.querySelector("#header");
var footer = document.querySelector("#footer");
var cityStart = document.getElementById("cityStart");
var cityEnd = document.getElementById("cityEnd");
var searchButton = document.getElementById("search");

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

function getCoords(event) {
  console.log("ROUTE EVENT!");
  var steps = $(".mapbox-directions-step");
  var coordinates = [];
  for (var i = 0; i < steps.length; i++) {
    console.log(steps[i]);
    var coords = [steps[i].dataset.lng, steps[i].dataset.lat];
    coordinates.push(coords);
  }
  //! MOVE STEPS TO OTHER CONTAINER
  console.log(coordinates);
  // ?Sample coordinates
  //weather api

  //marker build

  // Add markers to the map.
  for (var j = 0; j < coordinates.length; j++) {
    console.log("woot array");
    console.log(coordinates[j]);
    const el = document.createElement("div");
    const width = 40;
    const height = 40;
    el.style.backgroundImage = `url(https://placekitten.com/g/${width}/${height}/)`; //images local; dependent on weather desc
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.backgroundSize = "100%";

    el.addEventListener("click", () => {
      window.alert(marker.properties.message);
    });
    new mapboxgl.Marker(el).setLngLat(coordinates[j]).addTo(map); //dynamically pass in coordinates  [-97.323982, 37.604087]
  }

  // approx location based on coords
}

directions.on("route", getCoords);

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
