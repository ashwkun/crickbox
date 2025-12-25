import React, { useState, useEffect } from 'react';
import { proxyFetch } from '../utils/api';

const NEWS_API = 'https://onefeed.fan.api.espn.com/apis/v3/cached/contentEngine/oneFeed?&page=1&limit=15&sport=cricket';

export default function NewsFeed() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await proxyFetch(NEWS_API);
                const articles = data.feed
                    ?.filter(item => item.data?.now?.[0]?.headline)
                    .slice(0, 10)
                    .map(item => ({
                        id: item.data.now[0].id,
                        headline: item.data.now[0].headline,
                        description: item.data.now[0].description,
                        image: item.data.now[0].images?.[0]?.url,
                        published: item.data.now[0].published,
                        link: item.data.now[0].links?.web?.href
                    })) || [];
                setNews(articles);
            } catch (err) {
                console.error('News fetch error:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000 / 60);
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="news-scroll">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="news-card">
                        <div className="skeleton" style={{ height: 120 }}></div>
                        <div style={{ padding: 12 }}>
                            <div className="skeleton" style={{ height: 14, marginBottom: 8 }}></div>
                            <div className="skeleton" style={{ height: 14, width: '60%' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error || news.length === 0) {
        return <div className="empty-state">Unable to load news</div>;
    }

    return (
        <div className="news-scroll">
            {news.map(article => (
                <div
                    key={article.id}
                    className="news-card"
                    onClick={() => article.link && window.open(article.link, '_blank')}
                >
                    {article.image ? (
                        <img
                            src={article.image}
                            alt=""
                            className="news-image"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="news-image" style={{ background: '#262626' }}></div>
                    )}
                    <div className="news-content">
                        <h4 className="news-title">{article.headline}</h4>
                        <span className="news-meta">{formatTime(article.published)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
