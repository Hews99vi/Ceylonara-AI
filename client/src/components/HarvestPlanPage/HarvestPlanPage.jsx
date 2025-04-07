import "./harvestPlanPage.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

const teaRegions = [
  "Uva",
  "Dimbula",
  "Nuwara Eliya",
  "Kandy",
  "Ruhuna",
  "Uva Highlands",
  "Central Highlands"
];

// Add coordinates for Sri Lankan tea regions
const regionCoordinates = {
  "Uva": { lat: 6.8841, lon: 81.2700 },
  "Dimbula": { lat: 6.8964, lon: 80.6687 },
  "Nuwara Eliya": { lat: 6.9697, lon: 80.7785 },
  "Kandy": { lat: 7.2906, lon: 80.6337 },
  "Ruhuna": { lat: 6.0535, lon: 80.2210 },
  "Uva Highlands": { lat: 6.8750, lon: 81.0570 },
  "Central Highlands": { lat: 7.0000, lon: 80.7500 }
};

const HarvestPlanPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState("Nuwara Eliya");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  // Add state for showing the data input form
  const [showDataForm, setShowDataForm] = useState(false);
  // Add state for form data
  const [formData, setFormData] = useState({
    estateName: "",
    elevation: "",
    teaType: "Black",
    yield: "",
    rainfall: "",
    temperature: "",
    humidity: "",
    notes: ""
  });
  
  // Add these state variables inside the component
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Add useEffect for weather data fetching inside the component
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        const coords = regionCoordinates[selectedRegion];
        if (!coords) {
          throw new Error('Region coordinates not found');
        }
  
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`
        );
  
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
  
        const data = await response.json();
        setWeatherData(data.list);
        setError(null);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [selectedRegion]);
  
  const regions = ["Nuwara Eliya", "Kandy", "Galle", "Ratnapura", "Matara"];
  const months = ["January", "February", "March", "April", "May", "June", 
                 "July", "August", "September", "October", "November", "December"];
  
  // Sample data for demonstration
  const harvestData = {
    "Nuwara Eliya": [
      { month: 0, status: "peak", tip: "Peak harvest season. Pluck leaves every 7 days for premium quality." },
      { month: 1, status: "peak", tip: "Peak harvest season. Pluck leaves every 7 days for premium quality." },
      { month: 2, status: "good", tip: "Good harvesting conditions. Focus on quality over quantity." },
      { month: 3, status: "good", tip: "Good harvesting conditions. Monitor rainfall patterns." },
      { month: 4, status: "average", tip: "Average yield expected. Consider supplemental irrigation." },
      { month: 5, status: "low", tip: "Low season. Focus on maintenance and pruning." },
      { month: 6, status: "low", tip: "Low season. Good time for field maintenance." },
      { month: 7, status: "average", tip: "Yields beginning to improve. Monitor closely." },
      { month: 8, status: "good", tip: "Good harvesting conditions returning. Prepare workforce." },
      { month: 9, status: "peak", tip: "Peak harvest season approaching. Maximize labor efficiency." },
      { month: 10, status: "peak", tip: "Peak harvest season. Pluck leaves every 7 days for premium quality." },
      { month: 11, status: "peak", tip: "Peak harvest season. Pluck leaves every 7 days for premium quality." }
    ],
    "Kandy": [
      { month: 0, status: "good", tip: "Good harvesting conditions. Focus on quality over quantity." },
      { month: 1, status: "good", tip: "Good harvesting conditions. Monitor rainfall patterns." },
      { month: 2, status: "average", tip: "Average yield expected. Consider supplemental irrigation." },
      { month: 3, status: "average", tip: "Average yield expected. Monitor pest activity." },
      { month: 4, status: "low", tip: "Low season. Focus on maintenance and pruning." },
      { month: 5, status: "low", tip: "Low season. Good time for field maintenance." },
      { month: 6, status: "average", tip: "Yields beginning to improve. Monitor closely." },
      { month: 7, status: "good", tip: "Good harvesting conditions returning. Prepare workforce." },
      { month: 8, status: "peak", tip: "Peak harvest season approaching. Maximize labor efficiency." },
      { month: 9, status: "peak", tip: "Peak harvest season. Pluck leaves every 7 days for premium quality." },
      { month: 10, status: "good", tip: "Good harvesting conditions. Focus on quality over quantity." },
      { month: 11, status: "good", tip: "Good harvesting conditions. Monitor rainfall patterns." }
    ],
    "Galle": [
      { month: 0, status: "average", tip: "Average yield expected. Consider supplemental irrigation." },
      { month: 1, status: "average", tip: "Average yield expected. Monitor pest activity." },
      { month: 2, status: "low", tip: "Low season. Focus on maintenance and pruning." },
      { month: 3, status: "low", tip: "Low season. Good time for field maintenance." },
      { month: 4, status: "average", tip: "Yields beginning to improve. Monitor closely." },
      { month: 5, status: "good", tip: "Good harvesting conditions returning. Prepare workforce." },
      { month: 6, status: "peak", tip: "Peak harvest season approaching. Maximize labor efficiency." },
      { month: 7, status: "peak", tip: "Peak harvest season. Pluck leaves every 7 days for premium quality." },
      { month: 8, status: "good", tip: "Good harvesting conditions. Focus on quality over quantity." },
      { month: 9, status: "good", tip: "Good harvesting conditions. Monitor rainfall patterns." },
      { month: 10, status: "average", tip: "Average yield expected. Consider supplemental irrigation." },
      { month: 11, status: "average", tip: "Average yield expected. Monitor pest activity." }
    ],
    "Ratnapura": [
      { month: 0, status: "low", tip: "Low season. Focus on maintenance and pruning." },
      { month: 1, status: "low", tip: "Low season. Good time for field maintenance." },
      { month: 2, status: "average", tip: "Yields beginning to improve. Monitor closely." },
      { month: 3, status: "good", tip: "Good harvesting conditions returning. Prepare workforce." },
      { month: 4, status: "peak", tip: "Peak harvest season approaching. Maximize labor efficiency." },
      { month: 5, status: "peak", tip: "Peak harvest season. Pluck leaves every 7 days for premium quality." },
      { month: 6, status: "good", tip: "Good harvesting conditions. Focus on quality over quantity." },
      { month: 7, status: "good", tip: "Good harvesting conditions. Monitor rainfall patterns." },
      { month: 8, status: "average", tip: "Average yield expected. Consider supplemental irrigation." },
      { month: 9, status: "average", tip: "Average yield expected. Monitor pest activity." },
      { month: 10, status: "low", tip: "Low season. Focus on maintenance and pruning." },
      { month: 11, status: "low", tip: "Low season. Good time for field maintenance." }
    ],
    "Matara": [
      { month: 0, status: "average", tip: "Average yield expected. Consider supplemental irrigation." },
      { month: 1, status: "good", tip: "Good harvesting conditions returning. Prepare workforce." },
      { month: 2, status: "peak", tip: "Peak harvest season approaching. Maximize labor efficiency." },
      { month: 3, status: "peak", tip: "Peak harvest season. Pluck leaves every 7 days for premium quality." },
      { month: 4, status: "good", tip: "Good harvesting conditions. Focus on quality over quantity." },
      { month: 5, status: "good", tip: "Good harvesting conditions. Monitor rainfall patterns." },
      { month: 6, status: "average", tip: "Average yield expected. Consider supplemental irrigation." },
      { month: 7, status: "average", tip: "Average yield expected. Monitor pest activity." },
      { month: 8, status: "low", tip: "Low season. Focus on maintenance and pruning." },
      { month: 9, status: "low", tip: "Low season. Good time for field maintenance." },
      { month: 10, status: "average", tip: "Yields beginning to improve. Monitor closely." },
      { month: 11, status: "good", tip: "Good harvesting conditions returning. Prepare workforce." }
    ]
  };
  
  // Default to Nuwara Eliya if selected region doesn't have data
  const currentRegionData = harvestData[selectedRegion] || harvestData["Nuwara Eliya"];
  const currentMonthData = currentRegionData.find(item => item.month === selectedMonth);
  
  // Weather forecast data (sample)
  const weatherForecast = [
    { date: "Mon, 15", icon: "☀️", temp: "24°C" },
    { date: "Tue, 16", icon: "🌤️", temp: "23°C" },
    { date: "Wed, 17", icon: "🌧️", temp: "21°C" },
    { date: "Thu, 18", icon: "🌧️", temp: "20°C" },
    { date: "Fri, 19", icon: "🌤️", temp: "22°C" },
    { date: "Sat, 20", icon: "☀️", temp: "25°C" },
    { date: "Sun, 21", icon: "☀️", temp: "26°C" }
  ];
  
  // Yield prediction (sample)
  const yieldPrediction = {
    current: "85%",
    trend: "increasing",
    recommendation: "Optimal harvesting time approaching. Schedule labor for next week."
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmitData = (e) => {
    e.preventDefault();
    
    // Here you would typically send this data to your backend
    console.log("Submitting harvest data:", {
      region: selectedRegion,
      month: selectedMonth,
      ...formData
    });
    
    // For now, just close the form and show a success message
    alert("Data submitted successfully! This will improve your yield predictions.");
    setShowDataForm(false);
    
    // Reset form
    setFormData({
      estateName: "",
      elevation: "",
      teaType: "Black",
      yield: "",
      rainfall: "",
      temperature: "",
      humidity: "",
      notes: ""
    });
  };

  return (
    <div className="harvestPlanPage">
      <div className="harvestPlanContainer">
        <button className="closeButton" onClick={() => navigate("/dashboard")}>×</button>
        <div className="harvestPlanHeader">
          <img src="/logo.png" alt="Ceylonara Logo" />
          <h1>{t('harvestPlan.title')}</h1>
        </div>
        
        <div className="harvestPlanLayout">
          <div className="controlPanel">
            <div className="regionSelector">
              <h3>{t('harvestPlan.selectRegion')}</h3>
              <select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {teaRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="monthSelector">
              <h3>{t('harvestPlan.selectMonth')}</h3>
              <div className="monthGrid">
                {months.map((month, index) => (
                  <div
                    key={month}
                    className={selectedMonth === index ? "selected" : ""}
                    onClick={() => setSelectedMonth(index)}
                  >
                    {month.slice(0, 3)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="contentSection">
            <div className="harvestInfoCard">
              <h2>{t('harvestPlan.harvestStatus')} {months[selectedMonth]} {t('harvestPlan.in')} {selectedRegion}</h2>
              <div className="statusIndicator">
                <div className={`statusDot ${harvestData[selectedRegion]?.[selectedMonth]?.status || "average"}`}></div>
                <span className="statusText">{harvestData[selectedRegion]?.[selectedMonth]?.status || "Average"} {t('harvestPlan.harvestConditions')}</span>
              </div>
              <div className="harvestTip">
                <p>{harvestData[selectedRegion]?.[selectedMonth]?.tip || "Standard harvesting conditions. Follow regular protocols."}</p>
              </div>
            </div>

            <div className="weatherForecast">
              <h3>{t('harvestPlan.weatherForecast')}</h3>
              <div className="forecastGrid">
                {error ? (
                  <div className="error-message">{t('harvestPlan.loading')}: {error}</div>
                ) : loading ? (
                  <div className="loading-message">{t('harvestPlan.loading')}</div>
                ) : weatherData ? (
                  weatherData
                    .filter((item, index) => index % 8 === 0)
                    .slice(0, 5)
                    .map((forecast, index) => (
                      <div className="forecastDay" key={index}>
                        <div className="date">
                          {new Date(forecast.dt * 1000).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="icon">
                          <img 
                            src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`}
                            alt={forecast.weather[0].description}
                          />
                        </div>
                        <div className="temp">{Math.round(forecast.main.temp)}°C</div>
                      </div>
                    ))
                ) : (
                  <div>{t('harvestPlan.noWeatherData')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarvestPlanPage;