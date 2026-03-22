import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { HomeSEO } from '../components/SEO';
import { useAsset } from '../contexts/AssetContext';
import { getReviews } from '../services/api';
import type { Review } from '../services/api';
import './HomePage.css';

import iconShadow from '../assets/icons/icon_shadow_grown.png';
import iconSalt from '../assets/icons/icon_salt_roasted.png';
import iconSmallBatch from '../assets/icons/icon_small_batch.png';
import iconPersonalized from '../assets/icons/icon_personalised.png';

const USP_FEATURES = [
    { icon: iconShadow, title: 'SHADE GROWN', desc: 'Naturally grown under shade for richer flavor.' },
    { icon: iconSalt, title: 'SALT ROASTED', desc: 'Signature salt-air roast for smooth, clean taste' },
    { icon: iconSmallBatch, title: 'SMALL BATCH', desc: 'Roasted in small lots for freshness and precision' },
    { icon: iconPersonalized, title: 'PERSONALISED ROASTS', desc: 'Roast profiles tailored to your taste' },
];

const BREW_METHODS = [
    { iconKey: 'icon_pour_over_kit.png', title: 'BREW WITH OUR POUR-OVER KIT', desc: 'Experience café-style clarity and flavor.' },
    { iconKey: 'icon_french_press.png', title: 'USE YOUR OWN BREWER', desc: 'Aeropress, Moka Pot, South Indian filter.' },
    { iconKey: 'icon_chhani.png', title: 'BREW WITH A SIMPLE CHHANI', desc: 'No equipment? No problem. Use a strainer.' },
];

const FALLBACK_REVIEWS = [
    { id: '1', comment: "Never tasted coffee this smooth!", user_name: 'Priya S.', rating: 5 },
    { id: '2', comment: "Coffee that doesn't need sugar.", user_name: 'Arjun K.', rating: 5 },
    { id: '3', comment: "Custom roast option is amazing.", user_name: 'Sarah J.', rating: 5 },
];

export default function HomePage() {
    const navigate = useNavigate();
    const homeHero = useAsset('home_hero.png');
    const productBag = useAsset('product_bag.png');
    const howToBrew = useAsset('how_to_brew.mp4');
    const coffeeFarmer = useAsset('coffee_farmer.jpg');
    const iconPourOverKit = useAsset('icon_pour_over_kit.png');
    const iconFrenchPress = useAsset('icon_french_press.png');
    const iconChhani = useAsset('icon_chhani.png');

    const [allReviews, setAllReviews] = useState<(Review | typeof FALLBACK_REVIEWS[0])[]>(FALLBACK_REVIEWS);
    const [page, setPage] = useState(0);
    const [fade, setFade] = useState(true);
    const PER_PAGE = 10;

    useEffect(() => {
        getReviews(50)
            .then((data) => {
                if (data && data.length > 0) setAllReviews(data);
            })
            .catch(() => { /* keep fallback reviews */ });
    }, []);

    const totalPages = Math.ceil(allReviews.length / PER_PAGE);

    // Auto-rotate reviews every 8 seconds if we have more than one page
    const nextPage = useCallback(() => {
        if (totalPages <= 1) return;
        setFade(false);
        setTimeout(() => {
            setPage(p => (p + 1) % totalPages);
            setFade(true);
        }, 400);
    }, [totalPages]);

    useEffect(() => {
        if (totalPages <= 1) return;
        const timer = setInterval(nextPage, 8000);
        return () => clearInterval(timer);
    }, [nextPage, totalPages]);

    const visibleReviews = allReviews.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

    const brewMethodIcons: Record<string, string> = {
        'icon_pour_over_kit.png': iconPourOverKit,
        'icon_french_press.png': iconFrenchPress,
        'icon_chhani.png': iconChhani,
    };

    return (
        <div className="home-container">
            <HomeSEO />
            {/* Scroll Snap Container */}
            <div className="scroll-container">
                {/* Block 1: Hero Section */}
                <section className="block hero-block">
                    <Header variant="dark" />

                    <div
                        className="hero-image"
                        style={{ backgroundImage: `url(${homeHero})` }}
                    >
                        <div className="hero-text">
                            <h1 className="hero-title">
                                COFFEE MADE<br />JUST FOR YOU
                            </h1>
                            <span className="hero-literally">(LITERALLY)</span>
                        </div>
                    </div>

                    {/* USP Section - White Background Below Hero */}
                    <div className="usp-section">
                        {USP_FEATURES.map((item, i) => (
                            <div key={i} className="usp-item">
                                <img src={item.icon} alt={item.title} className="usp-icon" loading="lazy" />
                                <span className="usp-title">{item.title}</span>
                                <span className="usp-desc">{item.desc}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Block 2: Product Section */}
                <section className="block product-section">
                    <Header variant="light" />
                    <div className="product-content">
                        <img
                            src={productBag}
                            alt="Coffee Bag"
                            className="product-image"
                            loading="lazy"
                        />
                        <span className="section-label">YOUR PERFECT CUP</span>
                        <h2 className="section-title">
                            HOME OF THE WORLD'S<br />FIRST SALT-ROASTED COFFEE
                        </h2>
                        <button className="cta-button" onClick={() => navigate('/shop')}>
                            PERSONALIZE AND BUY NOW
                        </button>
                    </div>
                </section>

                {/* Block 3: Brewing Section */}
                <section className="block brewing-section">
                    <Header variant="light" />
                    <div className="brewing-images">
                        <video
                            src={howToBrew}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="none"
                            className="brewing-video"
                        />
                    </div>
                    <div className="brewing-content">
                        <h2 className="section-title">HOW TO USE STEPS</h2>
                        <div className="green-underline" />
                        <p className="brewing-subtitle">
                            To experience the full depth of our shade-grown, salt-roasted coffee — brew it black.
                        </p>
                        <div className="brew-methods">
                            {BREW_METHODS.map((method, i) => (
                                <div key={i} className="brew-method">
                                    <img src={brewMethodIcons[method.iconKey]} alt={method.title} className="brew-icon" loading="lazy" />
                                    <span className="brew-title">{method.title}</span>
                                    <span className="brew-desc">{method.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Block 4: Story Section */}
                <section
                    className="block story-section"
                    style={{ backgroundImage: `url(${coffeeFarmer})` }}
                >
                    <Header variant="dark" />
                    <div className="story-overlay" />
                    <div className="story-content">
                        <span className="story-label">OUR JOURNEY</span>
                        <h2 className="story-title">OUR<br />STORY</h2>
                        <p className="story-body">
                            We celebrate India's shade-grown coffee tradition with a unique salt-air roasting method that preserves depth, aroma, and sweetness.
                        </p>
                        <button className="story-button" onClick={() => navigate('/about')}>
                            DISCOVER MORE
                        </button>
                    </div>
                </section>

                {/* Block 5: Testimonials */}
                <section className="block testimonials-section">
                    <Header variant="light" />
                    <div className="testimonials-content">
                        <span className="section-label">TESTIMONIALS</span>
                        <h2 className="testimonials-title">Loved By Coffee Lovers</h2>

                        <div className={`reviews-wall ${fade ? 'fade-in' : 'fade-out'}`}>
                            {visibleReviews.map((review, idx) => {
                                const name = ('user_name' in review ? review.user_name : '') || 'Coffee Lover';
                                const initial = name.charAt(0).toUpperCase();
                                const colors = ['#4f5130', '#6b6d3e', '#8b5c3e', '#5a6650', '#7a6b5a'];
                                const bg = colors[idx % colors.length];
                                return (
                                    <div key={review.id + '-' + page} className="rw-card">
                                        <div className="rw-header">
                                            <div className="rw-avatar" style={{ background: bg }}>{initial}</div>
                                            <div className="rw-meta">
                                                <span className="rw-name">{name}</span>
                                                <span className="rw-stars">{'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}</span>
                                            </div>
                                        </div>
                                        <p className="rw-text">{review.comment}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="rw-dots">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={`rw-dot ${i === page ? 'active' : ''}`}
                                        onClick={() => { setFade(false); setTimeout(() => { setPage(i); setFade(true); }, 300); }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <footer className="home-footer">
                        <span className="footer-brand">SHADOW BEAN CO.</span>
                        <span className="footer-copyright">© 2026 Shadow Bean Co.</span>
                    </footer>
                </section>
            </div>
        </div>
    );
}
