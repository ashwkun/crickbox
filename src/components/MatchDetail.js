import React from 'react';
import WikiImage from './WikiImage';

const styles = {
    // Detail View
    detailContainer: { animation: 'fadeIn 0.2s ease-in' },
    backBtn: { background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 },

    // Hero Card
    heroCard: {
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.2)'
    },
    heroHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, opacity: 0.9, fontSize: 12 },
    heroStatus: { color: '#ff006e', fontWeight: 700, letterSpacing: '1px' },
    heroTeams: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    heroTeam: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '40%' },
    heroLogo: { width: 56, height: 56, background: 'white', borderRadius: 12, padding: 4 },
    heroTeamName: { fontSize: 16, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 },
    heroScore: { fontSize: 20, fontWeight: 700, fontFamily: 'monospace', marginTop: 4 },
    vs: { fontSize: 14, opacity: 0.5, fontWeight: 900 },
    heroResult: { textAlign: 'center', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, opacity: 0.9 },

    // Scorecard
    scoreContent: { display: 'flex', flexDirection: 'column', gap: 16 },
    inningsCard: { background: 'white', borderRadius: 16, padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
    inningsHeader: { background: '#f8fafc', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' },
    inningsTitle: { fontWeight: 700, color: '#0f172a' },
    inningsTotal: { fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' },

    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9', background: 'white' },
    thNum: { textAlign: 'center', padding: '12px 8px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9', background: 'white' },
    tr: { borderBottom: '1px solid #f8fafc' },
    td: { padding: '12px 16px', verticalAlign: 'middle' },
    tdNum: { textAlign: 'center', padding: '12px 8px', fontFamily: '"SF Mono", monospace', fontWeight: 500, verticalAlign: 'middle' },
    batterName: { fontWeight: 600, color: '#1e293b', fontSize: 13 },
    howout: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    subHeader: { margin: '20px 16px 8px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }
};

const MatchDetail = ({ match, scorecard, onClose }) => {
    return (
        <div style={styles.detailContainer}>
            <button onClick={onClose} style={styles.backBtn}>
                <span style={{ fontSize: 18 }}>←</span> Back
            </button>

            {/* Hero Section */}
            <div style={styles.heroCard}>
                <div style={styles.heroHeader}>
                    <span style={styles.matchStatus}>{match.event_sub_status || match.event_status}</span>
                    <span style={styles.seriesName}>{match.series_name}</span>
                </div>

                <div style={styles.heroTeams}>
                    <div style={styles.heroTeam}>
                        <WikiImage name={match.participants[0]?.name} id={match.participants[0]?.id} style={styles.heroLogo} />
                        <span style={styles.heroTeamName}>{match.participants[0]?.short_name}</span>
                        <span style={styles.heroScore}>{match.participants[0]?.value || ''}</span>
                    </div>
                    <div style={styles.vs}>VS</div>
                    <div style={styles.heroTeam}>
                        <WikiImage name={match.participants[1]?.name} id={match.participants[1]?.id} style={styles.heroLogo} />
                        <span style={styles.heroTeamName}>{match.participants[1]?.short_name}</span>
                        <span style={styles.heroScore}>{match.participants[1]?.value || ''}</span>
                    </div>
                </div>
                <div style={styles.heroResult}>{match.result}</div>
            </div>

            {/* Scorecard Content */}
            {scorecard ? (
                <div style={styles.scoreContent}>
                    {scorecard.Innings?.map((inn, idx) => (
                        <div key={idx} style={styles.inningsCard}>
                            <div style={styles.inningsHeader}>
                                <span style={styles.inningsTitle}>{scorecard.Teams?.[inn.Battingteam]?.Name_Full}</span>
                                <span style={styles.inningsTotal}>{inn.Total}/{inn.Wickets} <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8 }}>({inn.Overs} ov)</span></span>
                            </div>

                            {/* Batting Table - With Player Images */}
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...styles.th, width: '50%' }}>Batter</th>
                                            <th style={styles.thNum}>R</th>
                                            <th style={styles.thNum}>B</th>
                                            <th style={styles.thNum}>4s</th>
                                            <th style={styles.thNum}>6s</th>
                                            <th style={styles.thNum}>SR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inn.Batsmen?.map((bat, i) => {
                                            const pName = scorecard.Teams?.[inn.Battingteam]?.Players?.[bat.Batsman]?.Name_Full || '';
                                            return (
                                                <tr key={i} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <WikiImage name={pName} id={bat.Batsman} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                                            <div>
                                                                <div style={styles.batterName}>{pName}</div>
                                                                <div style={styles.howout}>{bat.Howout_short || 'not out'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={styles.tdNum}>{bat.Runs}</td>
                                                    <td style={styles.tdNum}>{bat.Balls}</td>
                                                    <td style={styles.tdNum}>{bat.Fours}</td>
                                                    <td style={styles.tdNum}>{bat.Sixes}</td>
                                                    <td style={styles.tdNum}>{bat.Strikerate}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bowling Table */}
                            <h4 style={styles.subHeader}>Bowling</h4>
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...styles.th, width: '50%' }}>Bowler</th>
                                            <th style={styles.thNum}>O</th>
                                            <th style={styles.thNum}>M</th>
                                            <th style={styles.thNum}>R</th>
                                            <th style={styles.thNum}>W</th>
                                            <th style={styles.thNum}>ER</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inn.Bowlers?.map((bowl, i) => {
                                            const pName = scorecard.Teams?.[inn.Bowlingteam]?.Players?.[bowl.Bowler]?.Name_Full;
                                            return (
                                                <tr key={i} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <WikiImage name={pName} id={bowl.Bowler} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                                            <div style={styles.batterName}>{pName}</div>
                                                        </div>
                                                    </td>
                                                    <td style={styles.tdNum}>{bowl.Overs}</td>
                                                    <td style={styles.tdNum}>{bowl.Maidens}</td>
                                                    <td style={styles.tdNum}>{bowl.Runs}</td>
                                                    <td style={styles.tdNum}>{bowl.Wickets}</td>
                                                    <td style={styles.tdNum}>{bowl.Economyrate}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading detailed stats...</div>
            )}
        </div>
    );
};

export default MatchDetail;
