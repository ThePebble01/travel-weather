var themeSwitcher = document.querySelector("#theme-switcher");
var container = document.querySelector(".container");

var mode = "dark";

themeSwitcher.addEventListener("click", function () {
  if (mode === "dark") {
    mode = "light";
    container.setAttribute("class", "light");
  } else {
    mode = "dark";
    container.setAttribute("class", "dark");
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
