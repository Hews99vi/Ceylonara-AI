import "./harvestPlanPage.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { OPENWEATHER_API_KEY } from './api-key';
import { FaLeaf, FaCalendarAlt, FaTools, FaWater } from 'react-icons/fa';

const teaRegions = [
  "Nuwara Eliya",
  "Kandy",
  "Dimbula",
  "Uva",
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

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const HarvestPlanPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState("Nuwara Eliya");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        const coords = regionCoordinates[selectedRegion];
        if (!coords) {
          throw new Error('Region coordinates not found');
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
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

  // Default to Nuwara Eliya if selected region doesn't have data
  const currentRegionData = harvestData[selectedRegion] || harvestData["Nuwara Eliya"];
  const currentMonthData = currentRegionData.find(item => item.month === selectedMonth);

  // Sample AI recommendations based on region and month
  const getAIRecommendations = (region, month) => {
    // Get the current region's harvest data
    const regionData = harvestData[region] || harvestData["Nuwara Eliya"];
    const currentStatus = regionData[month].status;
    const nextMonth = (month + 1) % 12;
    const nextStatus = regionData[nextMonth].status;
    
    // Determine recommendations based on current and next month's status
    const recommendations = {
      upcoming: [
        {
          title: currentStatus === "low" ? "Prepare for Recovery" : 
                 currentStatus === "peak" ? "Maximize Harvest Efficiency" : 
                 "Optimize Growing Conditions",
          description: currentStatus === "low" ? "Plan maintenance and recovery activities for the upcoming season." :
                      currentStatus === "peak" ? "Ensure all harvesting equipment and storage facilities are ready." :
                      "Monitor and maintain optimal growing conditions for tea plants.",
          icon: <FaLeaf />,
          priority: currentStatus === "peak" ? "High" : 
                   currentStatus === "good" ? "Medium" : "Low"
        },
        {
          title: nextStatus === "peak" ? "Prepare for Peak Season" :
                 nextStatus === "low" ? "Plan Maintenance Schedule" :
                 "Adjust Resource Allocation",
          description: nextStatus === "peak" ? `Prepare workforce and equipment for upcoming peak season in ${months[nextMonth]}.` :
                      nextStatus === "low" ? `Schedule maintenance activities for ${months[nextMonth]}'s low season.` :
                      `Plan resource allocation for ${months[nextMonth]}'s regular season.`,
          icon: <FaTools />,
          priority: nextStatus === "peak" ? "High" : "Medium"
        },
        {
          title: region === "Nuwara Eliya" || region === "Uva Highlands" ? "High Altitude Considerations" :
                 region === "Kandy" || region === "Dimbula" ? "Mid-Elevation Management" :
                 "Coastal Region Care",
          description: region === "Nuwara Eliya" || region === "Uva Highlands" ? 
                      "Monitor temperature variations and protect plants from extreme weather." :
                      region === "Kandy" || region === "Dimbula" ? 
                      "Balance irrigation and drainage for optimal mid-elevation growth." :
                      "Implement humidity control measures for coastal conditions.",
          icon: <FaWater />,
          priority: currentStatus === "peak" || nextStatus === "peak" ? "High" : "Medium"
        }
      ],
      preparations: [
        currentStatus === "peak" ? "Optimize plucking intervals for maximum quality" :
        currentStatus === "good" ? "Maintain regular plucking schedule" :
        "Focus on plant maintenance and care",
        
        region === "Nuwara Eliya" || region === "Uva Highlands" ?
        "Check frost protection measures" :
        "Monitor humidity levels",
        
        nextStatus === "peak" ? "Prepare additional storage capacity" :
        "Standard storage maintenance",
        
        currentStatus === "low" ? "Conduct thorough equipment maintenance" :
        "Regular equipment checks",
        
        region === "Nuwara Eliya" || region === "Uva Highlands" ?
        "Train workers on high-altitude harvesting techniques" :
        region === "Kandy" || region === "Dimbula" ?
        "Train workers on mid-elevation harvesting methods" :
        "Train workers on coastal region harvesting practices"
      ],
      timeline: [
        {
          date: "Next Week",
          task: currentStatus === "peak" ? "Intensive Harvesting" :
                currentStatus === "good" ? "Regular Harvesting" :
                "Maintenance Work",
          status: "Pending"
        },
        {
          date: "2 Weeks",
          task: nextStatus === "peak" ? "Peak Season Preparation" :
                nextStatus === "good" ? "Regular Season Planning" :
                "Low Season Planning",
          status: "Scheduled"
        },
        {
          date: "3 Weeks",
          task: region === "Nuwara Eliya" || region === "Uva Highlands" ?
                "High-Altitude Specific Care" :
                region === "Kandy" || region === "Dimbula" ?
                "Mid-Elevation Maintenance" :
                "Coastal Region Maintenance",
          status: "Upcoming"
        }
      ]
    };
    return recommendations;
  };

  const aiRecommendations = getAIRecommendations(selectedRegion, selectedMonth);

  return (
    <div className="harvestPlanPage">
      <div className="harvestPlanContainer">
        <button className="closeButton" onClick={() => navigate("/dashboard")}>×</button>
        
        <div className="harvestPlanHeader">
          <img src="/icons/harvest-icon.svg" alt="Harvest Icon" className="headerIcon" />
          <h1>Harvest Planning</h1>
        </div>

        <div className="harvestPlanLayout">
          <div className="controlPanel">
            <div className="regionSelector">
              <h3>Select Region</h3>
              <select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {teaRegions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="monthSelector">
              <h3>Select Month</h3>
              <div className="monthGrid">
                {months.map((month, index) => (
                  <div
                    key={month}
                    className={`month-item ${selectedMonth === index ? "selected" : ""}`}
                    onClick={() => setSelectedMonth(index)}
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="contentSection">
            <div className="harvestInfoCard">
              <h2>
                Harvest Status for {months[selectedMonth]} in {selectedRegion}
              </h2>
              
              <div className="statusIndicator">
                <div className={`statusDot ${currentMonthData?.status || "average"}`} />
                <span className="statusText">
                  {currentMonthData?.status.charAt(0).toUpperCase() + currentMonthData?.status.slice(1) || "Average"} 
                  Harvest Conditions
                </span>
              </div>
              
              <div className="harvestTip">
                <p>{currentMonthData?.tip || "Standard harvesting conditions. Follow regular protocols."}</p>
              </div>
            </div>

            <div className="weatherForecast">
              <h3>Weather Forecast</h3>
              <div className="forecastGrid">
                {error ? (
                  <div className="error-message">
                    <p>Failed to fetch weather data</p>
                    <button 
                      className="retry-button"
                      onClick={() => {
                        setError(null);
                        setLoading(true);
                        const coords = regionCoordinates[selectedRegion];
                        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`)
                          .then(res => res.json())
                          .then(data => {
                            setWeatherData(data.list);
                            setError(null);
                          })
                          .catch(err => {
                            console.error('Error on retry:', err);
                            setError(err.message);
                          })
                          .finally(() => setLoading(false));
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : loading ? (
                  <div className="loading-message">Loading weather data...</div>
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
                        <div className="condition">{forecast.weather[0].description}</div>
                      </div>
                    ))
                ) : (
                  <div className="no-data-message">No weather data available</div>
                )}
              </div>
            </div>

            <div className="aiRecommendationsSection">
              <h3>
                <FaLeaf className="sectionIcon" />
                Recommendations
              </h3>
              
              <div className="recommendationsGrid">
                <div className="upcomingTasks">
                  <h4>Upcoming Tasks</h4>
                  {aiRecommendations.upcoming.map((task, index) => (
                    <div key={index} className="taskCard">
                      <div className="taskIcon">{task.icon}</div>
                      <div className="taskContent">
                        <h5>{task.title}</h5>
                        <p>{task.description}</p>
                        <span className={`priority ${task.priority.toLowerCase()}`}>
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="preparationSteps">
                  <h4>Preparation Checklist</h4>
                  <ul className="checkList">
                    {aiRecommendations.preparations.map((step, index) => (
                      <li key={index}>
                        <input type="checkbox" id={`prep-${index}`} />
                        <label htmlFor={`prep-${index}`}>{step}</label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="harvestTimeline">
                  <h4>Timeline</h4>
                  <div className="timeline">
                    {aiRecommendations.timeline.map((item, index) => (
                      <div key={index} className="timelineItem">
                        <div className="timelineDate">
                          <FaCalendarAlt />
                          <span>{item.date}</span>
                        </div>
                        <div className="timelineContent">
                          <h5>{item.task}</h5>
                          <span className={`status ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarvestPlanPage;