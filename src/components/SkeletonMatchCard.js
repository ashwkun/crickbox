import React from 'react';

const SkeletonMatchCard = () => {
    return (
        <div className="match-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="skeleton" style={{ width: 120, height: 12 }}></div>
                <div className="skeleton" style={{ width: 50, height: 20, borderRadius: 6 }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2].map(i => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }}></div>
                            <div className="skeleton" style={{ width: 80, height: 14 }}></div>
                        </div>
                        <div className="skeleton" style={{ width: 45, height: 14 }}></div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 12 }}>
                <div className="skeleton" style={{ width: 140, height: 28, borderRadius: 8 }}></div>
            </div>
        </div>
    );
};

export default SkeletonMatchCard;
