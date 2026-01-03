import React from 'react';

const HowItWorks: React.FC = () => {
  return (
    <div style={{ padding: 20, color: 'white', overflowY: 'auto', height: '100%' }}>
      <h1>TheSportsDB Asset Demo 🎨</h1>
      <p style={{ opacity: 0.7 }}>A showcase of the premium assets available for free via TheSportsDB API.</p>

      <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

      <section>
        <h2>🏆 League: Indian Premier League (IPL)</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 20 }}>
          {/* Badge */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 }}>
            <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.5 }}>Badge (strBadge)</div>
            <img
              src="https://r2.thesportsdb.com/images/media/league/badge/gaiti11741709844.png"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          {/* Trophy */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 }}>
            <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.5 }}>Trophy (strTrophy)</div>
            <img
              src="https://r2.thesportsdb.com/images/media/league/trophy/n40cna1684417361.png"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          {/* Logo */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, gridColumn: 'span 2' }}>
            <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.5 }}>Logo (strLogo)</div>
            <img
              src="https://r2.thesportsdb.com/images/media/league/logo/kvmd941551037675.png"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.5 }}>Banner (strBanner)</div>
          <img
            src="https://r2.thesportsdb.com/images/media/league/banner/kvzios1546529999.jpg"
            style={{ width: '100%', borderRadius: 12 }}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.5 }}>Fanart (strFanart1) - Great for Backgrounds!</div>
          <img
            src="https://r2.thesportsdb.com/images/media/league/fanart/v3ckyf1544174408.jpg"
            style={{ width: '100%', borderRadius: 12 }}
          />
        </div>
      </section>

      <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '40px 0' }} />

      <section>
        <h2>🏏 League: Big Bash League (BBL)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 20 }}>
          {/* Badge */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 }}>
            <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.5 }}>Badge (strBadge)</div>
            <img
              src="https://r2.thesportsdb.com/images/media/league/badge/yko7ny1546635346.png"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          {/* Trophy */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 }}>
            <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.5 }}>Trophy (strTrophy)</div>
            <img
              src="https://r2.thesportsdb.com/images/media/league/trophy/58ryq31546511312.png"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.5 }}>Poster (strPoster)</div>
          <img
            src="https://r2.thesportsdb.com/images/media/league/poster/vp3u1n1546510361.jpg"
            style={{ width: '200px', borderRadius: 12 }}
          />
        </div>
      </section>

      <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '40px 0' }} />

      <section>
        <h2 style={{ color: '#ef4444' }}>❌ Missing: Team Assets</h2>
        <p>Searches for 'Mumbai Indians' or 'Hobart Hurricanes' on the free API tier returned null for assets. It seems Team Badges/Jerseys are restricted or require specific IDs.</p>
      </section>

    </div>
  );
};

export default HowItWorks;
