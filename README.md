# Weather Forecast App 🌦️

This is a responsive weather forecast web application built with vanilla JavaScript, HTML, and CSS. It fetches weather data from Open-Meteo and allows users to search for locations or use their current geolocation to display a 5-day forecast.


## Features ✨

- Current location weather 📍: Uses browser geolocation API to fetch weather for your location.
- Search for locations 🔍: Input a city name to get weather data.
- 5-day forecast 📅: Displays maximum, minimum temperatures, UV index, wind, precipitation probability, sunrise/sunset, and day length.
- Dark mode toggle 🌙: Switch between light and dark themes.
- Details/Overview toggle 🔄: Flip cards to see detailed weather info.
- Loader & error handling ⏳❌: Shows loader while fetching data and handles errors gracefully.
- Responsive design 📱💻: Breakpoints for various screen sizes.


## Usage 🖱️

- Use the search input to find weather for any city.
- Click the GPS button to fetch your current location's weather.
- Use OVERVIEW/DETAILS buttons to flip forecast cards and see more information.
- Toggle dark mode with the moon button 🌙.
- Reset the forecast container with the reset button ✖.


## Technologies used 💻

- Vanilla JavaScript (ES6+)
- HTML5
- CSS3 (Flexbox & Grid)
- Open-Meteo API 🌤️
- BigDataCloud API 🗺️
- Geolocation API 📍


## JavaScript skills used 🛠️

- DOM manipulation (querySelector, insertAdjacentHTML, classList, createElement)
- Event handling (click, submit, DOMContentLoaded)
- Asynchronous programming (async/await, Promises)
- Fetch API & error handling (try/catch, custom error messages)
- Working with third-party APIs (Open-Meteo, BigDataCloud)
- Responsive UI updates (loader, clearing and rendering forecast cards)
- Conditional logic & control flow (if statements, loops, switch cases)
- String and date manipulation (formatting dates, times, and strings)
- Modular code structure (low-level vs top-level functions)


## Code Structure 🏗️

- Low-level functions 🔧: Handle UI updates, DOM manipulation, fetching data, error handling.
- Top-level functions 🎛️: Coordinate workflow, orchestrate fetching, rendering, and clearing UI.


## License 📄

This project is open source and available under the MIT License.


## Acknowledgements 🙏

- Open-Meteo: https://open-meteo.com/
- BigDataCloud: https://www.bigdatacloud.com/
- Geocoding: https://geocode.maps.co
- Weather Icons: https://www.flaticon.com/authors/iconixar
