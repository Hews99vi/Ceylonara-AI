import "./contactPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value
    };
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSubmitStatus("success");
        e.target.reset();
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contactPage">
      <div className="contactContainer">
        <button className="closeButton" onClick={() => navigate("/dashboard")}>×</button>
        <div className="contactHeader">
          <img src="/logo.png" alt="Ceylonara Logo" />
          <h1>Contact Us</h1>
        </div>
        
        <div className="contactLayout">
          <div className="contactFormSection">
            <p className="contactDescription">
              Have questions about tea cultivation or our services? 
              We'd love to hear from you.
            </p>
            
            {submitStatus === "success" && (
              <div className="successMessage">
                Thank you for your message! We'll get back to you soon.
              </div>
            )}
            
            {submitStatus === "error" && (
              <div className="errorMessage">
                Something went wrong. Please try again later.
              </div>
            )}
            
            <form className="contactForm" onSubmit={handleSubmit}>
              <div className="formGroup">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className="formGroup">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="formGroup">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>
              <button 
                type="submit" 
                className="submitButton" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
          
          <div className="contactDetailsSection">
            <h2>Get in Touch</h2>
            <div className="contactDetailsItem">
              <div className="contactIcon">📍</div>
              <div className="contactInfo">
                <h3>Address</h3>
                <p>123 Tea Garden Road<br />Nuwara Eliya<br />Sri Lanka</p>
              </div>
            </div>
            
            <div className="contactDetailsItem">
              <div className="contactIcon">📞</div>
              <div className="contactInfo">
                <h3>Phone</h3>
                <p>+94 77 123 4567</p>
                <p>+94 11 234 5678</p>
              </div>
            </div>
            
            <div className="contactDetailsItem">
              <div className="contactIcon">✉️</div>
              <div className="contactInfo">
                <h3>Email</h3>
                <p>info@ceylonara.com</p>
                <p>support@ceylonara.com</p>
              </div>
            </div>
            
            <div className="contactDetailsItem">
              <div className="contactIcon">🕒</div>
              <div className="contactInfo">
                <h3>Business Hours</h3>
                <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                <p>Saturday: 10:00 AM - 2:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;