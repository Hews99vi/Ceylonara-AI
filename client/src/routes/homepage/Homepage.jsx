import { Link } from "react-router-dom";
import "./homepage.css";
import { TypeAnimation } from "react-type-animation";
import { useState } from "react";

const Homepage = () => {
  const [typingStatus, setTypingStatus] = useState("human1");

  return (
    <div className="homepage">
      <img src="/orbital.png" alt="" className="orbital" />
      <div className="left">
        <h1>Ceylonara</h1>
        <h2>Unlock the Future of Tea Cultivation</h2>
        <h3>Enhance tea quality and detect diseases instantly with advanced image analysis.</h3>

        <Link to="/dashboard">Get Started</Link>
      </div>
      <div className="right">
        <div className="imgContainer">
          <div className="bgContainer">
            <div className="bg"></div>
          </div>
          <img src="/bot.png" alt="" className="bot" />
          <div className="chat">
            <img
              src={
                typingStatus === "human1"
                  ? "/human1.jpeg"
                  : typingStatus === "human2"
                  ? "/human2.jpeg"
                  : "bot.png"
              }
              alt=""
            />
            <TypeAnimation
              sequence={[
                "Human: We analyze tea leaves for quality",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                "Bot: We detect diseases in tea plants",
                2000,
                () => {
                  setTypingStatus("human2");
                },
                "Human2: We ensure the best tea leaf selection",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                "Bot: We help farmers improve tea production",
                2000,
                () => {
                  setTypingStatus("human1");
                },
              ]
              }
              wrapper="span"
              repeat={Infinity}
              cursor={true}
              omitDeletionAnimation={true}
            />
          </div>
        </div>
      </div>
      <div className="terms">
        <img src="/logo.png" alt="" />
        <div className="links">
          <Link to="/">Terms of Service</Link>
          <span>|</span>
          <Link to="/">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default Homepage;