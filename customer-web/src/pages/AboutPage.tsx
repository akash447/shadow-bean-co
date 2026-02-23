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

export default function AboutPage() {
    const aboutVideo = useAsset('about_hero_video.mp4');
    const coffeeFarm = useAsset('coffee_farm.png');
    const productBag = useAsset('product_bag.png');

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
                            style={{ backgroundImage: `url(${coffeeFarm})` }}
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
                        {/* Philosophy */}
                        <div className="philosophy-section">
                            <div className="philosophy-content">
                                <div className="philosophy-left">
                                    <h2 className="about-heading">THE<br />PHILOSOPHY</h2>
                                </div>
                                <div className="philosophy-right">
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

                        {/* Journey of a Coffee Bean */}
                        <div className="journey-section">
                            <div className="journey-icons">
                                <img src='/icons/icon_map_karnataka.png' alt="Karnataka" className="journey-icon" onError={(e) => e.currentTarget.style.display = 'none'} />
                                <span className="dashed-line">----------------</span>
                                <img src={productBag} alt="Coffee Bag" className="journey-icon" />
                                <span className="dashed-line">----------------</span>
                                <img src='/icons/icon_coffee_cup.png' alt="Coffee Cup" className="journey-icon" onError={(e) => e.currentTarget.style.display = 'none'} />
                            </div>

                            <h2 className="journey-heading">JOURNEY OF A COFFEE BEAN</h2>

                            <p className="journey-text">
                                From the shaded estates of Karnataka and Andhra Pradesh, each bean is hand-selected for quality and
                                grown under the protective canopy of native trees. After harvest, the beans travel to our roastery, where we
                                roast them in small, controlled batches using our salt-air technique.
                            </p>
                            <p className="journey-text">
                                Every roast is tuned carefully to unlock the bean's natural sweetness, aroma, and depth. Freshly roasted,
                                packed, and shipped, each bag carries the journey of Indian coffee, from forest shade to your perfect cup.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="about-footer">
                        <span className="footer-brand">SHADOW BEAN CO.</span>
                        <span className="footer-copyright">&copy; 2024 Shadow Bean Co.</span>
                    </footer>
                </section>

            </div>
        </div>
    );
}
