const API_KEY = "44c3a0458afdb054fc3ac6ee4833b71a";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const CASABLANCA_COORDS = { lat: 33.589886, lon: -7.603869 };

let currentUnit = 'celsius';
let weatherData = null;
let forecastData = null;
let currentCoords = CASABLANCA_COORDS; 

const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('errorMessage'),
    weatherContent: document.getElementById('weatherContent'),
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    celsiusBtn: document.getElementById('celsiusBtn'),
    fahrenheitBtn: document.getElementById('fahrenheitBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    cityName: document.getElementById('cityName'),
    countryName: document.getElementById('countryName'),
    mainWeatherIcon: document.getElementById('mainWeatherIcon'),
    currentTemp: document.getElementById('currentTemp'),
    weatherDescription: document.getElementById('weatherDescription'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    visibility: document.getElementById('visibility'),
    pressure: document.getElementById('pressure'),
    hourlyForecast: document.getElementById('hourlyForecast'),
    dailyForecast: document.getElementById('dailyForecast'),
    weatherAlert: document.getElementById('weatherAlert'),
    alertMessage: document.getElementById('alertMessage'),
    updateTime: document.getElementById('updateTime')
};

const weatherIcons = {
    'Clear': 'fas fa-sun',
    'Clouds': 'fas fa-cloud',
    'Rain': 'fas fa-cloud-rain',
    'Drizzle': 'fas fa-cloud-drizzle',
    'Thunderstorm': 'fas fa-bolt',
    'Snow': 'fas fa-snowflake',
    'Mist': 'fas fa-smog',
    'Smoke': 'fas fa-smog',
    'Haze': 'fas fa-smog',
    'Dust': 'fas fa-smog',
    'Fog': 'fas fa-smog',
    'Sand': 'fas fa-smog',
    'Ash': 'fas fa-smog',
    'Squall': 'fas fa-wind',
    'Tornado': 'fas fa-tornado'
};

const kelvinToCelsius = (kelvin) => kelvin - 273.15;
const mpsToKmh = (mps) => mps * 3.6;
const convertTemperature = (celsius) => {
    return currentUnit === 'fahrenheit' ? (celsius * 9/5) + 32 : celsius;
};
const getUnitSymbol = () => currentUnit === 'fahrenheit' ? '°F' : '°C';

const updateBackground = (condition) => {
    const body = document.body;
    const lowerCondition = condition.toLowerCase();
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;

    body.classList.remove('bg-sunny', 'bg-cloudy', 'bg-rainy', 'bg-clear', 'bg-night');

    if (isNight) {
        body.classList.add('bg-night');
    } else if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
        body.classList.add('bg-sunny');
    } else if (lowerCondition.includes('cloud')) {
        body.classList.add('bg-cloudy');
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('storm') || lowerCondition.includes('drizzle')) {
        body.classList.add('bg-rainy');
    } else {
        body.classList.add('bg-clear');
    }
};

const fetchWeatherByCoords = async (lat, lon) => {
    try {
        showLoading();
        hideError();

    
        currentCoords = { lat, lon };

    
        const currentResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=fr`
        );

        if (!currentResponse.ok) {
            throw new Error("Erreur lors de la récupération des données météo");
        }

        const currentData = await currentResponse.json();

        weatherData = {
            city: currentData.name,
            country: currentData.sys.country,
            temperature: kelvinToCelsius(currentData.main.temp),
            condition: currentData.weather[0].main,
            description: currentData.weather[0].description,
            humidity: currentData.main.humidity,
            windSpeed: mpsToKmh(currentData.wind.speed),
            visibility: currentData.visibility,
            pressure: currentData.main.pressure,
            feelsLike: kelvinToCelsius(currentData.main.feels_like),
        };

    
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=fr`
        );

        if (forecastResponse.ok) {
            const forecastDataRaw = await forecastResponse.json();

            
            const hourlyForecast = forecastDataRaw.list.slice(0, 8).map((item) => ({
                time: new Date(item.dt * 1000).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                temperature: kelvinToCelsius(item.main.temp),
                condition: item.weather[0].main,
                humidity: item.main.humidity,
            }));

         
            const dailyForecast = forecastDataRaw.list
                .filter((_, index) => index % 8 === 0)
                .slice(0, 7)
                .map((item) => ({
                    day: new Date(item.dt * 1000).toLocaleDateString('fr-FR', { weekday: 'long' }),
                    date: new Date(item.dt * 1000).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                    }),
                    condition: item.weather[0].main,
                    maxTemp: kelvinToCelsius(item.main.temp_max),
                    minTemp: kelvinToCelsius(item.main.temp_min),
                    humidity: item.main.humidity,
                    windSpeed: mpsToKmh(item.wind.speed),
                }));

            forecastData = {
                hourly: hourlyForecast,
                daily: dailyForecast,
            };
        }

        updateWeatherDisplay();
        hideLoading();

    } catch (err) {
        console.error('Weather fetch error:', err);
        showError(err.message || "Erreur inconnue");
        hideLoading();
    }
};

const fetchWeatherByCityName = async (cityName) => {
    try {
        showLoading();
        hideError();

        const response = await fetch(
            `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&lang=fr`
        );

        if (!response.ok) {
            throw new Error(`Ville '${cityName}' introuvable. Veuillez vérifier l'orthographe.`);
        }

        const data = await response.json();
        const { lat, lon } = data.coord;
        fetchWeatherByCoords(lat, lon);

    } catch (err) {
        console.error('City fetch error:', err);
        showError(err.message);
        hideLoading();
    }
};


const showLoading = () => {
    elements.loading.classList.remove('hidden');
    elements.weatherContent.classList.add('hidden');
    elements.refreshBtn.classList.add('loading');
};

const hideLoading = () => {
    elements.loading.classList.add('hidden');
    elements.weatherContent.classList.remove('hidden');
    elements.refreshBtn.classList.remove('loading');
};

const showError = (message) => {
    elements.errorMessage.textContent = message;
    elements.error.classList.remove('hidden');
    elements.weatherContent.classList.add('hidden');
};

const hideError = () => {
    elements.error.classList.add('hidden');
};

const updateWeatherDisplay = () => {
    if (!weatherData) return;

    
    updateBackground(weatherData.condition);

    
    elements.cityName.textContent = weatherData.city;
    elements.countryName.textContent = weatherData.country;
    elements.mainWeatherIcon.className = weatherIcons[weatherData.condition] || 'fas fa-question';
    elements.currentTemp.textContent = Math.round(convertTemperature(weatherData.temperature));
    elements.weatherDescription.textContent = weatherData.description;
    elements.feelsLike.textContent = `Ressenti ${Math.round(convertTemperature(weatherData.feelsLike))}${getUnitSymbol()}`;

    
    elements.humidity.textContent = `${weatherData.humidity}%`;
    elements.windSpeed.textContent = `${Math.round(weatherData.windSpeed)} km/h`;
    elements.visibility.textContent = `${Math.round(weatherData.visibility / 1000)} km`;
    elements.pressure.textContent = `${weatherData.pressure} hPa`;

   
    document.querySelectorAll('.unit').forEach(el => {
        el.textContent = getUnitSymbol();
    });

    
    updateHourlyForecast();
    updateDailyForecast();
    checkWeatherAlerts();

    
    elements.updateTime.textContent = new Date().toLocaleTimeString('fr-FR');
};

const updateHourlyForecast = () => {
    if (!forecastData) return;

    elements.hourlyForecast.innerHTML = '';

    forecastData.hourly.forEach(forecast => {
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <div class="time">${forecast.time}</div>
            <i class="${weatherIcons[forecast.condition] || 'fas fa-question'}"></i>
            <div class="temp">${Math.round(convertTemperature(forecast.temperature))}°</div>
            <div class="humidity">${forecast.humidity}%</div>
        `;
        elements.hourlyForecast.appendChild(hourlyItem);
    });
};

const updateDailyForecast = () => {
    if (!forecastData) return;

    elements.dailyForecast.innerHTML = '';

    forecastData.daily.forEach(forecast => {
        const dailyItem = document.createElement('div');
        dailyItem.className = 'daily-item';
        dailyItem.innerHTML = `
            <div class="daily-left">
                <i class="${weatherIcons[forecast.condition] || 'fas fa-question'}"></i>
                <div class="daily-date">
                    <div class="day">${forecast.day}</div>
                    <div class="date">${forecast.date}</div>
                </div>
            </div>
            <div class="daily-right">
                <div class="daily-detail">
                    <div class="label">Humidité</div>
                    <div class="value">${forecast.humidity}%</div>
                </div>
                <div class="daily-detail">
                    <div class="label">Vent</div>
                    <div class="value">${Math.round(forecast.windSpeed)} km/h</div>
                </div>
                <div class="daily-temps">
                    <span class="max">${Math.round(convertTemperature(forecast.maxTemp))}°</span>
                    <span class="min">${Math.round(convertTemperature(forecast.minTemp))}°</span>
                </div>
            </div>
        `;
        elements.dailyForecast.appendChild(dailyItem);
    });
};

const checkWeatherAlerts = () => {
    if (!weatherData) return;

    if (weatherData.windSpeed > 50) {
        elements.alertMessage.textContent = `Alerte vent fort: ${Math.round(weatherData.windSpeed)} km/h`;
        elements.weatherAlert.classList.remove('hidden');
    } else {
        elements.weatherAlert.classList.add('hidden');
    }
};


const handleUnitChange = (unit) => {
    currentUnit = unit;

    
    elements.celsiusBtn.classList.toggle('active', unit === 'celsius');
    elements.fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');

    
    updateWeatherDisplay();
};

const handleRefresh = () => {
    showLoading();
    
    fetchWeatherByCoords(currentCoords.lat, currentCoords.lon);
};


elements.celsiusBtn.addEventListener('click', () => handleUnitChange('celsius'));
elements.fahrenheitBtn.addEventListener('click', () => handleUnitChange('fahrenheit'));
elements.refreshBtn.addEventListener('click', handleRefresh);

elements.searchBtn.addEventListener('click', () => {
    const cityName = elements.cityInput.value.trim();
    if (cityName) {
        fetchWeatherByCityName(cityName);
    } else {
        showError("Veuillez entrer une ville.");
    }
});

elements.cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const cityName = elements.cityInput.value.trim();
        if (cityName) {
            fetchWeatherByCityName(cityName);
        } else {
            showError("Veuillez entrer une ville.");
        }
    }
});


document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            () => {
                
                fetchWeatherByCoords(CASABLANCA_COORDS.lat, CASABLANCA_COORDS.lon);
            }
        );
    } else {
        
        fetchWeatherByCoords(CASABLANCA_COORDS.lat, CASABLANCA_COORDS.lon);
    }
});