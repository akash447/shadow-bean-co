import Header from '../components/Header';
import { useAsset } from '../contexts/AssetContext';
import './AboutPage.css';

import iconShadow from '../assets/icons/icon_shadow_grown.png';
import iconSalt from '../assets/icons/icon_salt_roasted.png';
import iconSmallBatch from '../assets/icons/icon_small_batch.png';
import iconPersonalized from '../assets/icons/icon_personalised.png';

const JOURNEY_STEPS = [
    { icon: iconShadow, title: 'SHADE GROWN', desc: 'Hand-selected from Karnataka & Andhra Pradesh estates under native tree canopies' },
    { icon: iconSmallBatch, title: 'HAND HARVESTED', desc: 'Each bean carefully picked for quality, grown slow under protective forest shade' },
    { icon: iconSalt, title: 'SALT-AIR ROASTED', desc: 'Small controlled batches, tuned to unlock natural sweetness, aroma and depth' },
    { icon: iconPersonalized, title: 'SHIPPED FRESH', desc: 'Freshly roasted, packed and delivered — from forest shade to your perfect cup' },
];

const JOURNEY_CARDS = [
    { num: '01', title: 'SOURCED', text: 'Hand-selected from shaded estates in Karnataka & Andhra Pradesh' },
    { num: '02', title: 'HARVESTED', text: 'Each cherry picked at peak ripeness under native tree canopies' },
    { num: '03', title: 'ROASTED', text: 'Salt-air roasted in small batches to unlock natural sweetness' },
    { num: '04', title: 'DELIVERED', text: 'Freshly packed and shipped — from forest shade to your cup' },
];

export default function AboutPage() {
    const aboutVideo = useAsset('about_hero_video.mp4');
    const aboutPoster = useAsset('assets/about_poster.png');
    const aboutRoasting = useAsset('assets/about_roasting.png');
    const journeyIllustration = useAsset('assets/journey_illustration.png');

    return (
        <div className="about-outer">
            <div className="about-scroll">

                {/* BLOCK 1: Hero Video + Journey Bar */}
                <section className="about-block about-hero-block">
                    <Header variant="dark" />

                    <div className="about-hero">
                        {/* Poster image shown instantly while video loads */}
                        <div
                            className="about-hero-poster"
                            style={{ backgroundImage: `url(${aboutPoster})` }}
                        />
                        <video
                            className="about-hero-video"
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
                                    Great coffee needs nothing added — just care, precision, and
                                    respect for the bean.
                                </p>
                                <div className="philosophy-points">
                                    <div className="philosophy-point">
                                        <span className="point-label">Shade-Grown</span>
                                        <span className="point-desc">Sourced from estates under native canopies</span>
                                    </div>
                                    <div className="philosophy-point">
                                        <span className="point-label">Salt-Air Roasted</span>
                                        <span className="point-desc">Less bitterness, more natural sweetness</span>
                                    </div>
                                    <div className="philosophy-point">
                                        <span className="point-label">Small Batch</span>
                                        <span className="point-desc">Every roast tuned for clean, smooth character</span>
                                    </div>
                                    <div className="philosophy-point">
                                        <span className="point-label">Personalised</span>
                                        <span className="point-desc">Custom profiles based on your taste preferences</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Journey of a Coffee Bean — illustration + step cards */}
                        <div className="journey-section">
                            <h2 className="journey-heading">JOURNEY OF A COFFEE BEAN</h2>
                            <img src={journeyIllustration} alt="From farm to cup" className="journey-illustration" />
                            <div className="journey-cards">
                                {JOURNEY_CARDS.map((card) => (
                                    <div key={card.num} className="journey-card">
                                        <span className="journey-card-num">{card.num}</span>
                                        <span className="journey-card-title">{card.title}</span>
                                        <span className="journey-card-text">{card.text}</span>
                                    </div>
                                ))}
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
