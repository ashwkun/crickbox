import React, { useEffect, useState } from 'react';

// Direct ESPN API call
const NEWS_API = "https://onefeed.fan.api.espn.com/apis/v3/cached/contentEngine/oneFeed/leagues/cricket";

export default function NewsFeed() {
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(NEWS_API)
            .then(res => res.json())
            .then(data => {
                const items = data.feed?.flatMap(entry => entry.data?.now || []) || [];
                setFeed(items.slice(0, 8));
                setLoading(false);
            })
            .catch(err => {
                setError("Failed to load news");
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={styles.loading}>Loading news...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            {feed.map(item => {
                const image = item.images?.[0]?.url;
                return (
                    <div key={item.id} style={styles.card}>
                        {image && <img src={image} alt="" style={styles.image} />}
                        <div style={styles.content}>
                            <h3 style={styles.headline}>{item.headline}</h3>
                            <p style={styles.description}>{item.description}</p>
                            <div style={styles.meta}>
                                <span style={styles.type}>{item.type}</span>
                                <span style={styles.time}>
                                    {new Date(item.published).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '12px' },
    loading: { padding: '16px', color: '#666', textAlign: 'center' },
    error: { padding: '16px', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px' },
    card: {
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    },
    image: {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        flexShrink: 0
    },
    content: {
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minWidth: 0
    },
    headline: {
        margin: 0,
        fontSize: '14px',
        fontWeight: '600',
        color: '#111',
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    },
    description: {
        margin: '6px 0 0',
        fontSize: '12px',
        color: '#666',
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    },
    meta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px'
    },
    type: {
        fontSize: '10px',
        fontWeight: '600',
        color: '#2563eb',
        textTransform: 'uppercase'
    },
    time: {
        fontSize: '10px',
        color: '#999'
    }
};
