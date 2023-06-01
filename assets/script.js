var themeSwitcher = document.querySelector("#theme-switcher");
var container = document.querySelector(".container");
var header = document.querySelector("#header");
var footer = document.querySelector("#footer");

var mode = "dark";

themeSwitcher.addEventListener("click", function () {
  if (mode === "dark") {
    mode = "light";
    container.setAttribute("class", "light");
    header.setAttribute("class", "lightHeader");
    footer.setAttribute("class", "lightFooter");
  } else {
    mode = "dark";
    container.setAttribute("class", "dark");
    header.setAttribute("class", "darkHeader");
    footer.setAttribute("class", "darkFooter");
  }
});

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
