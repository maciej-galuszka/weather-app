"use strict";

const forecastBox = document.querySelector(".forecast-box");
const searchForm = document.querySelector(".search");
const searchInput = document.querySelector("input");
const geolocationBtn = document.querySelector(".btn-geolocation");
const resetBtn = document.querySelector(".btn-reset");
const detailsBtn = document.querySelectorAll(".btn-details");
const darkModeBtn = document.querySelector(".btn-darkmode");

// LOW LEVEL FUNCTIONS

// function to display loader during data fetching
const displayLoader = () => {
  if (forecastBox.children.length) return;

  // removing potential existing loader
  const existingLoader = forecastBox.querySelector(".loader-wrapper");
  if (existingLoader) existingLoader.remove();

  const container = document.createElement("div");
  const loader = document.createElement("span");
  const message = document.createElement("h1");

  message.insertAdjacentHTML(
    "beforeend",
    `
    Fetching the latest weather forecast<span class="dots">
      <span>.</span><span>.</span><span>.</span>
    </span>
  `
  );
  forecastBox.classList.remove("fade-overlay");
  container.classList.add("loader-wrapper");
  loader.classList.add("loader");
  container.appendChild(loader);
  container.appendChild(message);
  forecastBox.appendChild(container);
};

const hideLoader = () => {
  const loaderContainer = forecastBox.querySelector(".loader-wrapper");
  if (loaderContainer) loaderContainer.remove();
};

const loadError = async (err) => {
  // for unknown errors
  console.error(err?.message || "Unexpected error");

  if (forecastBox.children.length) {
    await clearUI();
  }

  const html = `
  <div class="error-container">
  <img class="error-image" src="images/error-image.png">
     <div class="message-container">
       <h1>Ooops… Something went wrong</h1>
       <p>${err?.message || "Unexpected error"}</p>
       <p>Try searching again.</p>
     </div>
   </div>
   `;

  forecastBox.insertAdjacentHTML("afterbegin", html);
};

// function to check if the user browser is in dark mode
const checkUserDarkmode = () =>
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const toggleDarkmode = () => {
  document.body.classList.toggle("dark-mode");
};

const detailsBtnHandler = (e) => {
  if (!e.target.classList.contains("btn-details")) return;
  e.target.closest(".forecast").classList.toggle("is-flipped");
};

// function to clear the UI from weather forecasts and error messages
const clearUI = () => {
  forecastBox.classList.add("fade-overlay");
  searchInput.value = "";

  // returning promise allows the animation to work properly
  return new Promise((resolve) => {
    setTimeout(() => {
      Array.from(forecastBox.childNodes).forEach((el) => el.remove());
      forecastBox.classList.remove("fade-overlay");
      resolve();
    }, 500);
  });
};

// function to check if the response is a HTTP error
const verifyResponse = (res) => {
  if (!res.ok) {
    switch (res.status) {
      case 404:
        throw new Error("We couldn’t find weather data for this location.");
      case 503:
        throw new Error("Our weather service is temporarily unavailable.");
      case 403:
        throw new Error("Access denied. Please contact support.");
      default:
        throw new Error("Something went wrong. Please try again.");
    }
  }
};

// function to fetch data and return it as a JSON object or throw an error if the timeout happens
const fetchJSON = async (url, timeout = 10000) => {
  try {
    // the first promise fullfiled is returned by Promise.race
    const res = await Promise.race([
      fetch(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeout)
      ),
    ]);

    verifyResponse(res);
    return await res.json();
  } catch (err) {
    hideLoader();
    throw err;
  }
};

const getUserCoordinates = async () => {
  try {
    // getting user's coordinates from the navigator API
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    return position.coords;
  } catch {
    throw new Error(
      "Could not get your location. Please enable geolocation in your browser."
    );
  }
};

// function to get location data (city, country) based on given latitude, longitude
const getLocation = async function (lat, lng) {
  try {
    const location = await fetchJSON(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${"en"}`
    );

    // handling edge cases of country names
    const countryExceptions = {
      "Russian Federation (the)": "Russia",
      "United States of America (the)": "USA",
      "United Kingdom of Great Britain and Northern Ireland (the)": "UK",
      "Czech Republic (the)": "Czech Republic",
      "Netherlands (Kingdom of the)": "Netherlands",
    };

    location.countryName =
      countryExceptions[location.countryName] || location.countryName;

    return location;
  } catch (err) {
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection.");
    }
    throw err;
  }
};

// function to search for location based on query given by user in the input field
const searchLocation = async function (query) {
  try {
    return fetchJSON(
      `https://geocode.maps.co/search?q=${query}&api_key=68a8c7cfe0c8e086635914ijgc7875e`
    );
  } catch (err) {
    // check if the error is caused by a network issue
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection.");
    }
    throw err;
  }
};

// function to get weather data from Open-Meteo and render it in the UI
const getWeather = async function (lat, lng, location) {
  try {
    // calculating date format required by the Open-Meteo API
    const firstDay = new Date();
    const lastDay = new Date(firstDay.getTime() + 4 * 24 * 60 * 60 * 1000);

    const formatAPIDate = (date) =>
      `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    // functions needed to display fetched data properly

    const windDirection = (deg) => {
      const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const index = Math.round(deg / 45) % 8; // 360° / 8 = 45° for each sector
      return directions[index];
    };

    const formatDate = function (date) {
      const weekDays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const dateObj = new Date(date);
      return `${weekDays[dateObj.getDay()]} <span$>${dateObj.getDate()}.${`${
        dateObj.getMonth() + 1
      }`.padStart(2, "0")}</span>`;
    };

    const dayLength = (sunrise, sunset) => {
      const sunriseDate = new Date(sunrise);
      const sunsetDate = new Date(sunset);
      const diff = sunsetDate - sunriseDate;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      return `${hours}h ${minutes}min`;
    };

    const data = await fetchJSON(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset,wind_speed_10m_max,wind_direction_10m_dominant,rain_sum,surface_pressure_mean,relative_humidity_2m_mean&hourly=temperature_2m,weather_code&timezone=auto&start_date=${formatAPIDate(
        firstDay
      )}&end_date=${formatAPIDate(lastDay)}`
    );

    // check if fetched weather data is correct
    if (!data?.daily?.time || !data.daily.time.length) {
      throw new Error(
        "Weather data unavailable for this location. Please try another."
      );
    }

    searchInput.value = `${location.city}, ${location.countryName}`;

    //rendering weather for each day from fetched data
    data.daily.time.forEach((day, i) => {
      //mapping weather code to weather description
      const weatherCode = data.daily.weather_code[i];
      const weatherDescription = {
        0: "Clear sky",
        1: "Partly cloudy",
        2: "Partly cloudy",
        3: "Cloudy",
        45: "Overcast",
        48: "Overcast",
        51: "Sun showers",
        53: "Sun showers",
        55: "Sun showers",
        61: "Sun showers",
        63: "Sun showers",
        65: "Rainy",
        71: "Snowfall",
        73: "Snowfall",
        75: "Snowfall",
        77: "Snowfall",
        80: "Sun showers",
        81: "Sun showers",
        82: "Rainy",
        85: "Snowfall",
        86: "Snowfall",
        95: "Thunderstorm",
        96: "Thunderstorm",
        99: "Thunderstorm",
      };

      const html =
        //prettier-ignore
        `<div class="forecast hidden">
      <div class="forecast__inner">
      <div class="forecast__face forecast__face--front">
      <p class="forecast-date">${formatDate( data.daily.time[i] )}</p>
      <p class="forecast-city">${location.city}, ${ location.countryName }</p>
      <img
      class="forecast-icon"
      src="images/${
        weatherDescription[weatherCode]
            }.png"
        alt=""
      />
      <p class="forecast-max">
      ${data.daily.temperature_2m_max[ i ].toFixed()}°C
      </p>
      <p class="forecast-description">${ weatherDescription[weatherCode] }</p>
      <p class="forecast-details">
      From ${data.daily.temperature_2m_min[ i ].toFixed()}°C to
      ${data.daily.temperature_2m_max[ i ].toFixed()}°C
      </p>
      
      <button class="btn btn-details">DETAILS</button>
      </div>
      <div class="forecast__face forecast__face--back">
      <h2>Weather details</h2>
      <div class="details-box">
      <p>
      <i class="icon-details wi wi-sunrise"></i
      ><span
      >Sunrise: ${data.daily.sunrise[ i
      ].slice(data.daily.sunrise[i].indexOf("T") + 1)}</span
      >
      </p>
      <p>
      <i class="icon-details wi wi-sunset"></i
      ><span
      >Sunset: ${data.daily.sunset[ i
      ].slice(data.daily.sunset[i].indexOf("T") + 1)}</span
          >
        </p>
        <p>
          <i
          class="icon-details wi wi-wind wi-towards-${windDirection( data.daily.wind_direction_10m_dominant[i] ).toLowerCase()}"
          ></i
          ><span
          >Wind direction: ${windDirection(
            data.daily.wind_direction_10m_dominant[i] )}</span
            >
            </p>
            <p>
            <i class="icon-details wi wi-windy"></i
            ><span
            >Wind speed: ${data.daily.wind_speed_10m_max[ i ].toFixed()}
            km/h</span
            >
            </p>
            <p>
            <i class="icon-details wi wi-rain"></i
            ><span
            >Probability: ${data.daily.precipitation_probability_max[ i
            ].toFixed()}%</span
          >
        </p>
        <p>
        <i class="icon-details wi wi-day-sunny"></i
        ><span>UV index: ${data.daily.uv_index_max[ i ].toFixed()}</span>
        </p>
        
        <p>
        <i class="icon-details wi wi-humidity"></i
        ><span
        >Humidity: ${data.daily.relative_humidity_2m_mean[ i
            ].toFixed()}%</span
            >
            </p>
            <p>
            <i class="icon-details wi wi-time-4"></i
            ><span
            >Day length: ${dayLength( data.daily.sunrise[i],
            data.daily.sunset[i] )}</span
            >
            </p>
      </div>
      <button class="btn btn-details">OVERVIEW</button>
      </div>
      </div>
      </div>`;

      forecastBox.insertAdjacentHTML("beforeEnd", html);

      // removing hidden class after 0.15 second for the weather render animation
      setTimeout(() => {
        Array.from(forecastBox.children).forEach((el) =>
          el.classList.remove("hidden")
        );
      }, 150);
    });
  } catch (err) {
    throw err;
  } finally {
    hideLoader();
  }
};

// TOP LEVEL FUNCTIONS

// function to get and render user's location weather forecast
const loadUserWeather = async () => {
  try {
    displayLoader();
    // getting user coordinates from navigator API
    const { latitude: lat, longitude: lng } = await getUserCoordinates();

    // getting user location
    const location = await getLocation(lat, lng);

    // return if the weather associated with the location from the input is already rendered
    if (searchInput.value.split(",")[0] === location.city) return;

    // clear UI if there is any forecast rendered
    if (forecastBox.children.length) {
      await clearUI();
    }

    //render weather for obtained coordinates and location data
    await getWeather(lat, lng, location);
  } catch (err) {
    loadError(err);
  }
};

// function to get and render weather forecast based on user's query from the input field
const searchFormHandler = async (e) => {
  try {
    e.preventDefault();
    const input = searchInput.value;

    // clearing forecasts if they are any
    if (forecastBox.children.length) {
      await clearUI();
    }
    // displaying loader for the time of fetching data
    displayLoader();

    // searching for location which matches with the input
    const [data] = await searchLocation(input);
    if (!data) {
      throw new Error("Location not found. Please check your search input.");
    }
    const { lat, lon } = data;
    // getting location country data based on coordinates
    const location = await getLocation(lat, lon);
    // check if the fetched location is correct
    if (!location.city || !location.countryName)
      throw new Error("Weather data unavailable for this location.");
    // return if the weather assosiated with the location from the input is already rendered
    if (searchInput.value.split(",")[0] === location.city) return;
    await getWeather(lat, lon, location);
  } catch (err) {
    hideLoader();
    loadError(err);
  }
};

/* EVENT HANDLERS */

// loading user weather as soon as the page loads
window.addEventListener("DOMContentLoaded", () => {
  if (checkUserDarkmode()) toggleDarkmode();
  loadUserWeather();
});

// loading user weather when the button is clicked
geolocationBtn.addEventListener("click", loadUserWeather);

// clearing forecasts container
resetBtn.addEventListener("click", clearUI);

// toggling dark mode
darkModeBtn.addEventListener("click", toggleDarkmode);

// searching for location based on user's input
searchForm.addEventListener("submit", searchFormHandler);

// handling details button
forecastBox.addEventListener("click", detailsBtnHandler);
