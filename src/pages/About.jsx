function About() {
  const tips = [
    { num: '01', title: 'Verify Before You Trust', desc: 'Check whether information comes from a credible and reliable source.' },
    { num: '02', title: 'Think Before You Share', desc: 'Avoid forwarding unverified news, rumours, or sensational claims.' },
    { num: '03', title: 'Check the Original Source', desc: 'Look for the original report, official announcement, or evidence behind a claim.' },
    { num: '04', title: 'Beware of Sensational Headlines', desc: 'Misleading content often uses shocking headlines or emotional language to attract attention.' },
    { num: '05', title: 'Cross-Check Information', desc: 'Compare claims with multiple trustworthy sources before accepting them as facts.' },
    { num: '06', title: 'Stop the Spread', desc: 'If you discover that you have shared false information, correct it and share verified information instead.' },
  ];

  return (
    <div className="about-page">
      <div className="about-header animate-in">
        <h1>🛡️ Stay Alert. Think Before You Share.</h1>
        <p>Misinformation spreads fast. Understanding how it works and following simple habits can protect you and others from falling for false claims.</p>
      </div>

      <div className="safety-grid">
        {tips.map((tip, i) => (
          <div className={`safety-card animate-in-delay-${i + 1}`} key={i}>
            <div className="card-number">{tip.num}</div>
            <h3>{tip.title}</h3>
            <p>{tip.desc}</p>
          </div>
        ))}
      </div>

      <div className="card animate-in" style={{ marginTop: '40px', textAlign: 'center', padding: '40px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>About Data Echo</h3>
        <p style={{ color: '#a0a0a0', lineHeight: '1.8', maxWidth: '650px', margin: '0 auto', fontSize: '15px' }}>
          Data Echo is a DSA-based project that models how misinformation propagates across social networks. 
          It uses graph algorithms like BFS, degree centrality, and betweenness centrality to identify 
          structurally important nodes and simulate intervention strategies that could reduce the spread 
          of false information.
        </p>
      </div>
    </div>
  );
}

export default About;
