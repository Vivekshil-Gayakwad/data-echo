import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-bg"></div>
        <div className="home-hero-content animate-in">
          <div className="home-hero-badge">📡 Misinformation Propagation Analyzer</div>
          <h1>Track How <span>Misinformation</span> Spreads</h1>
          <p>Simulate information propagation across social networks, identify critical nodes, and test intervention strategies to limit the spread.</p>
          <div className="home-hero-buttons">
            <Link to="/signin" className="btn-primary">▶ Get Started</Link>
            <Link to="/about" className="btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <section className="safety-section">
        <div className="safety-header">
          <div className="safety-badge">🛡️ Stay Alert. Think Before You Share.</div>
          <h2>Protect Yourself From Misinformation</h2>
          <p>Follow these essential steps to identify and stop the spread of false information.</p>
        </div>

        <div className="safety-grid">
          <div className="safety-card animate-in-delay-1">
            <div className="card-number">01</div>
            <h3>Verify Before You Trust</h3>
            <p>Check whether information comes from a credible and reliable source.</p>
          </div>
          <div className="safety-card animate-in-delay-2">
            <div className="card-number">02</div>
            <h3>Think Before You Share</h3>
            <p>Avoid forwarding unverified news, rumours, or sensational claims.</p>
          </div>
          <div className="safety-card animate-in-delay-3">
            <div className="card-number">03</div>
            <h3>Check the Original Source</h3>
            <p>Look for the original report, official announcement, or evidence behind a claim.</p>
          </div>
          <div className="safety-card animate-in-delay-4">
            <div className="card-number">04</div>
            <h3>Beware of Sensational Headlines</h3>
            <p>Misleading content often uses shocking headlines or emotional language to attract attention.</p>
          </div>
          <div className="safety-card animate-in-delay-5">
            <div className="card-number">05</div>
            <h3>Cross-Check Information</h3>
            <p>Compare claims with multiple trustworthy sources before accepting them as facts.</p>
          </div>
          <div className="safety-card animate-in-delay-6">
            <div className="card-number">06</div>
            <h3>Stop the Spread</h3>
            <p>If you discover that you have shared false information, correct it and share verified information instead.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
