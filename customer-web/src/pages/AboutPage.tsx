import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import { AboutSEO } from '../components/SEO';
import { useAsset } from '../contexts/AssetContext';
import './AboutPage.css';

// About page journey icons — PNG assets from Media folder
import iconShadeGrown from '../assets/icons/icon_shade_grown.png';
import iconHandHarvested from '../assets/icons/icon_hand_harvested.png';
import iconSaltAirRoasted from '../assets/icons/icon_salt_air_roasted.png';
import iconShippedFresh from '../assets/icons/icon_shipped_fresh.png';

const JOURNEY_STEPS = [
    { icon: iconShadeGrown, title: 'SHADE GROWN', desc: 'Hand-selected from Karnataka & Andhra Pradesh estates under native tree canopies' },
    { icon: iconHandHarvested, title: 'HAND HARVESTED', desc: 'Each bean carefully picked for quality, grown slow under protective forest shade' },
    { icon: iconSaltAirRoasted, title: 'SALT-AIR ROASTED', desc: 'Small controlled batches, tuned to unlock natural sweetness, aroma and depth' },
    { icon: iconShippedFresh, title: 'SHIPPED FRESH', desc: 'Freshly roasted, packed and delivered — from forest shade to your perfect cup' },
];

export default function AboutPage() {
    const aboutVideo = useAsset('about_hero_video.mp4');
    // aboutPoster removed — using dark background instead of image to avoid flash
    const aboutRoasting = useAsset('assets/about_roasting.png');

    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoReady, setVideoReady] = useState(false);

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;

        const show = () => setVideoReady(true);

        // Already playing (autoplay fired before React mounted)
        if (!el.paused && el.readyState >= 2) {
            show();
            return;
        }

        el.addEventListener('playing', show);
        el.addEventListener('timeupdate', show, { once: true });
        return () => {
            el.removeEventListener('playing', show);
            el.removeEventListener('timeupdate', show);
        };
    }, []);

    return (
        <div className="about-outer">
            <AboutSEO />
            <div className="about-scroll">

                {/* BLOCK 1: Hero Video + Journey Bar */}
                <section className="about-block about-hero-block">
                    <Header variant="dark" />

                    <div className="about-hero">
                        {/* Dark backdrop — visible until video starts playing */}
                        <div className="about-hero-poster" />
                        <video
                            ref={videoRef}
                            className={`about-hero-video${videoReady ? ' playing' : ''}`}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            src={aboutVideo}
                        />
                        <div className="about-hero-overlay" />
                        <div className="about-hero-content">
                            <h1 className="about-hero-title">STORY BEHIND<br />THE BRAND</h1>
                            <p className="about-hero-desc">
                                Born from India's shaded coffee forests, where beans grow slowly
                                under natural tree canopies and develop deep, layered flavor.
                                Pure, small-batch, and crafted with intention.
                            </p>
                        </div>
                    </div>

                    {/* Journey 4-point bar at bottom of hero block */}
                    <div className="about-journey-bar">
                        {JOURNEY_STEPS.map((step, i) => (
                            <div key={i} className="about-journey-item">
                                <img src={step.icon} alt={step.title} className="about-journey-icon" />
                                <span className="about-journey-title">{step.title}</span>
                                <span className="about-journey-desc">{step.desc}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* BLOCK 2: Philosophy + Journey + Footer */}
                <section className="about-block about-content-block">
                    <Header variant="light" />

                    <div className="about-content-inner">
                        {/* Philosophy — image + text split */}
                        <div className="philosophy-section">
                            <div className="philosophy-image-col">
                                <img src={aboutRoasting} alt="Salt-air roasting process" className="philosophy-image" />
                            </div>
                            <div className="philosophy-text-col">
                                <h2 className="about-heading">THE PHILOSOPHY</h2>
                                <p className="about-text">
                                    We believe great coffee needs nothing added — just care, precision, and respect for
                                    the bean. Our process blends shade-grown sourcing, salt-roasting, and
                                    small-batch craftsmanship.
                                </p>
                                <p className="about-text">
                                    Using a unique salt-air roast profile, we reduce bitterness and preserve natural
                                    oils, delivering a cup that's clean, smooth, and full of character. No additives, no
                                    shortcuts, only the true expression of Indian coffee.
                                </p>
                                <p className="about-text">
                                    And because every palate is different, we offer personalized roast profiles based
                                    on acidity, body, and bitterness; roasted just for you.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <footer className="about-footer">
                        <span className="footer-brand">SHADOW BEAN CO.</span>
                        <span className="footer-copyright">&copy; 2025 Shadow Bean Co.</span>
                    </footer>
                </section>

            </div>
        </div>
    );
}
