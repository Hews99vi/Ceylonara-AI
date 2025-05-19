import { Link } from "react-router-dom";
import "./homepage.css";
import { TypeAnimation } from "react-type-animation";
import { useTranslation } from 'react-i18next';
import LanguageSelector from "../../components/LanguageSelector/LanguageSelector";
import { FaLeaf, FaChartLine, FaRobot, FaUsers } from 'react-icons/fa';

const Homepage = () => {
  const { t } = useTranslation();

  return (
    <div className="homepage">
      <nav className="navbar">
        <Link to="/" className="nav-left">
          <img src="/logo.png" alt="Ceylonara Logo" className="nav-logo" />
          <span className="nav-brand">Ceylonara</span>
        </Link>
        <div className="nav-right">
          <LanguageSelector />
          <Link to="/sign-in">Sign In</Link>
          <Link to="/sign-up" className="nav-button">Get Started</Link>
        </div>
      </nav>

      <main className="main-content">
        <div className="hero-section">
          <div className="left">
            <h1>Ceylonara</h1>
            <h2>Unlock the Future of Tea Cultivation</h2>
            <h3>Enhance tea quality and detect diseases instantly with advanced image analysis.</h3>
            <div className="cta-buttons">
              <Link to="/dashboard" className="primary-button">Get Started</Link>
              <Link to="/explore" className="secondary-button">Explore Features</Link>
            </div>
          </div>
          <div className="right">
            <div className="hero-image-wrapper">
              <img src="/bot.png" alt="AI Assistant" className="hero-image" />
              <div className="chat-bubble">
                <TypeAnimation
                  sequence={[
                    "We detect diseases in tea plants",
                    2000,
                    "We ensure the best tea quality",
                    2000,
                    "We help improve tea production",
                    2000,
                  ]}
                  wrapper="span"
                  repeat={Infinity}
                  cursor={true}
                />
              </div>
            </div>
          </div>
        </div>

        <section className="features-section">
          <h2>Why Choose Ceylonara?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaLeaf />
              </div>
              <h3>Tea Analysis</h3>
              <p>Advanced AI-powered analysis of tea leaves for quality assessment and grading.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaRobot />
              </div>
              <h3>Disease Detection</h3>
              <p>Early detection of tea plant diseases using image recognition technology.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaChartLine />
              </div>
              <h3>Quality Metrics</h3>
              <p>Comprehensive quality metrics and detailed reports for tea production.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <h3>Growth Monitoring</h3>
              <p>Track and monitor tea plant growth patterns and health indicators.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo.png" alt="Ceylonara Logo" className="footer-logo" />
            <span>Ceylonara</span>
          </div>
          <div className="footer-links">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Ceylonara. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;