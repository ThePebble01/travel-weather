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
