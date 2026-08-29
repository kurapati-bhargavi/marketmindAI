import "./LandingPage.css";

function LandingPage({ onRegister, onLogin }) {
  return (
    <div className="landing-page">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">M</div>

          <div>
            <div className="brand-name">MarketMind</div>
            <div className="brand-ai">AI</div>
          </div>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">Why MarketMind</a>
        </div>

        <div className="nav-buttons">
          <button
            className="login-button"
            onClick={onLogin}
          >
            Login
          </button>

          <button
            className="register-button"
            onClick={onRegister}
          >
            Get Started
          </button>
        </div>
      </nav>


      {/* ================= HERO ================= */}

      <section className="hero">

        <div className="hero-content">

          <div className="hero-badge">
            ✦ AI-Powered Business Intelligence
          </div>

          <h1>
            Turn Your Business Data
            <span> Into Smarter Decisions.</span>
          </h1>

          <p className="hero-description">
            MarketMind AI transforms your business sales data into
            actionable insights, forecasts, customer intelligence,
            anomaly detection, recommendations and alerts — all from
            a single platform.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-hero-button"
              onClick={onRegister}
            >
              Get Started Free
              <span>→</span>
            </button>

            <button
              className="secondary-hero-button"
              onClick={onRegister}
            >
              Upload Business Data
              <span>↗</span>
            </button>

          </div>

          <div className="hero-trust">
            <span>✓</span>
            Upload your business CSV
            <span>✓</span>
            AI-powered insights
            <span>✓</span>
            One intelligent dashboard
          </div>

        </div>


        {/* ================= HERO DASHBOARD PREVIEW ================= */}

        <div className="hero-visual">

          <div className="dashboard-window">

            <div className="window-header">
              <div className="window-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="window-title">
                MarketMind AI
              </div>
            </div>

            <div className="mini-dashboard">

              <div className="mini-title">
                Business Overview
              </div>

              <div className="mini-cards">

                <div className="mini-card">
                  <span>Total Revenue</span>
                  <strong>₹12.4L</strong>
                  <small className="positive">↑ 18.4%</small>
                </div>

                <div className="mini-card">
                  <span>Orders</span>
                  <strong>1,284</strong>
                  <small className="positive">↑ 12.7%</small>
                </div>

                <div className="mini-card">
                  <span>Customers</span>
                  <strong>846</strong>
                  <small className="positive">↑ 9.3%</small>
                </div>

              </div>

              <div className="chart-container">

                <div className="chart-heading">
                  <span>Sales Performance</span>
                  <span className="chart-period">Last 30 days</span>
                </div>

                <div className="chart">

                  <div className="chart-line line-one"></div>
                  <div className="chart-line line-two"></div>
                  <div className="chart-line line-three"></div>

                  <div className="chart-bars">
                    <div style={{ height: "38%" }}></div>
                    <div style={{ height: "52%" }}></div>
                    <div style={{ height: "44%" }}></div>
                    <div style={{ height: "68%" }}></div>
                    <div style={{ height: "61%" }}></div>
                    <div style={{ height: "80%" }}></div>
                    <div style={{ height: "92%" }}></div>
                  </div>

                </div>

              </div>

              <div className="insight-box">
                <div className="insight-icon">✦</div>

                <div>
                  <strong>AI Insight</strong>

                  <p>
                    Sales are trending upward. Revenue is
                    expected to increase next week.
                  </p>
                </div>
              </div>

            </div>

          </div>

          <div className="floating-card forecast-card">
            <div className="floating-icon">⌁</div>

            <div>
              <span>AI Forecast</span>
              <strong>₹3.5L</strong>
              <small>Next 7 Days</small>
            </div>
          </div>

          <div className="floating-card alert-card">
            <div className="alert-icon">!</div>

            <div>
              <span>Business Alert</span>
              <strong>Low Inventory</strong>
              <small>3 products need attention</small>
            </div>
          </div>

        </div>

      </section>


      {/* ================= STATS ================= */}

      <section className="stats-section">

        <div className="stat">
          <strong>01</strong>
          <span>CSV Upload</span>
        </div>

        <div className="stat">
          <strong>02</strong>
          <span>AI Processing</span>
        </div>

        <div className="stat">
          <strong>03</strong>
          <span>Smart Insights</span>
        </div>

        <div className="stat">
          <strong>04</strong>
          <span>Better Decisions</span>
        </div>

      </section>


      {/* ================= FEATURES ================= */}

      <section
        className="features-section"
        id="features"
      >

        <div className="section-heading">

          <div className="section-label">
            POWERFUL INTELLIGENCE
          </div>

          <h2>
            Everything You Need
            <span> To Understand Your Business</span>
          </h2>

          <p>
            MarketMind AI brings your business data, analytics and
            artificial intelligence together in one place.
          </p>

        </div>


        <div className="features-grid">

          <div className="feature-card">

            <div className="feature-icon">◈</div>

            <h3>Sales Analytics</h3>

            <p>
              Understand revenue, orders, products and sales
              performance through interactive analytics.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">⌁</div>

            <h3>AI Sales Forecasting</h3>

            <p>
              Predict future sales and revenue so you can plan
              inventory and business decisions with confidence.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">◎</div>

            <h3>Customer Intelligence</h3>

            <p>
              Automatically understand customer behavior through
              segmentation and churn prediction.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">△</div>

            <h3>Anomaly Detection</h3>

            <p>
              Detect unusual sales patterns and business activity
              before they become bigger problems.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">✦</div>

            <h3>Recommendations</h3>

            <p>
              Receive intelligent recommendations based on your
              business data and discovered patterns.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">!</div>

            <h3>Alerts</h3>

            <p>
              Get important alerts about sales, inventory,
              customers and potential business risks.
            </p>

          </div>

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}

      <section
        className="how-section"
        id="how-it-works"
      >

        <div className="section-heading">

          <div className="section-label">
            SIMPLE WORKFLOW
          </div>

          <h2>
            From Business Data
            <span> To Business Intelligence</span>
          </h2>

        </div>


        <div className="workflow">

          <div className="workflow-step">

            <div className="step-number">01</div>

            <h3>Register Your Business</h3>

            <p>
              Create your account and select your role in the
              organization.
            </p>

          </div>


          <div className="workflow-arrow">→</div>


          <div className="workflow-step">

            <div className="step-number">02</div>

            <h3>Upload Business Data</h3>

            <p>
              Upload your business sales CSV through the
              Upload Business Data option.
            </p>

          </div>


          <div className="workflow-arrow">→</div>


          <div className="workflow-step">

            <div className="step-number">03</div>

            <h3>AI Analyzes Your Data</h3>

            <p>
              MarketMind AI processes your sales and customer
              information automatically.
            </p>

          </div>


          <div className="workflow-arrow">→</div>


          <div className="workflow-step">

            <div className="step-number">04</div>

            <h3>Take Smarter Decisions</h3>

            <p>
              View insights, forecasts, anomalies, recommendations
              and alerts from your dashboard.
            </p>

          </div>

        </div>

      </section>


      {/* ================= WHY MARKETMIND ================= */}

      <section
        className="why-section"
        id="about"
      >

        <div className="why-content">

          <div className="section-label">
            BUILT FOR BUSINESS OWNERS
          </div>

          <h2>
            Stop Managing Data.
            <span> Start Understanding It.</span>
          </h2>

          <p>
            You shouldn't need to manually calculate revenue,
            analyze customers, predict sales or search for
            unusual business activity.
          </p>

          <p>
            Upload your business data once and let MarketMind AI
            transform it into meaningful business intelligence.
          </p>

          <button
            className="primary-hero-button"
            onClick={onRegister}
          >
            Start Using MarketMind AI →
          </button>

        </div>


        <div className="why-points">

          <div className="why-point">
            <div>✓</div>
            <span>One CSV. Multiple insights.</span>
          </div>

          <div className="why-point">
            <div>✓</div>
            <span>Automatic customer intelligence.</span>
          </div>

          <div className="why-point">
            <div>✓</div>
            <span>AI-powered predictions.</span>
          </div>

          <div className="why-point">
            <div>✓</div>
            <span>Real-time business alerts.</span>
          </div>

          <div className="why-point">
            <div>✓</div>
            <span>Actionable recommendations.</span>
          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}

      <section className="cta-section">

        <div className="cta-content">

          <div className="section-label">
            MAKE YOUR DATA WORK FOR YOU
          </div>

          <h2>
            Your Business Has The Data.
            <span> MarketMind Has The Intelligence.</span>
          </h2>

          <p>
            Start turning your business data into smarter decisions.
          </p>

          <button
            className="cta-button"
            onClick={onRegister}
          >
            Create Your Account →
          </button>

        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="footer">

        <div className="footer-brand">

          <div className="brand">
            <div className="brand-icon">M</div>

            <div>
              <div className="brand-name">
                MarketMind
              </div>

              <div className="brand-ai">
                AI
              </div>
            </div>
          </div>

          <p>
            AI-powered sales intelligence for smarter businesses.
          </p>

        </div>


        <div className="footer-links">

          <div>
            <strong>Platform</strong>
            <span>Sales Analytics</span>
            <span>Forecasting</span>
            <span>Customer Intelligence</span>
          </div>

          <div>
            <strong>Insights</strong>
            <span>Anomalies</span>
            <span>Recommendations</span>
            <span>Alerts</span>
          </div>

          <div>
            <strong>Account</strong>
            <span>Register</span>
            <span>Login</span>
            <span>Profile</span>
          </div>

        </div>

      </footer>


      <div className="copyright">
        © 2026 MarketMind AI. Sales Intelligence Platform.
      </div>

    </div>
  );
}

export default LandingPage;