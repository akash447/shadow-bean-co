import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './HomePage.css';

import iconShadow from '../assets/icons/icon_shadow_grown.png';
import iconSalt from '../assets/icons/icon_salt_roasted.png';
import iconSmallBatch from '../assets/icons/icon_small_batch.png';
import iconPersonalized from '../assets/icons/icon_personalised.png';

const BASE_URL = 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/';

const USP_FEATURES = [
    { icon: iconShadow, title: 'SHADE GROWN', desc: 'Naturally grown under shade for richer flavor.' },
    { icon: iconSalt, title: 'SALT ROASTED', desc: 'Signature salt-air roast for smooth, clean taste' },
    { icon: iconSmallBatch, title: 'SMALL BATCH', desc: 'Roasted in small lots for freshness and precision' },
    { icon: iconPersonalized, title: 'PERSONALISED ROASTS', desc: 'Roast profiles tailored to your taste' },
];

const BREW_METHODS = [
    { icon: `${BASE_URL}icon_pour_over_kit.png`, title: 'BREW WITH OUR POUR-OVER KIT', desc: 'Experience café-style clarity and flavor.' },
    { icon: `${BASE_URL}icon_french_press.png`, title: 'USE YOUR OWN BREWER', desc: 'Aeropress, Moka Pot, South Indian filter.' },
    { icon: `${BASE_URL}icon_chhani.png`, title: 'BREW WITH A SIMPLE CHHANI', desc: 'No equipment? No problem. Use a strainer.' },
];

const REVIEWS = [
    { id: '1', comment: "Never tasted coffee this smooth!", author: 'Priya S.' },
    { id: '2', comment: "Coffee that doesn't need sugar.", author: 'Arjun K.' },
    { id: '3', comment: "Custom roast option is amazing.", author: 'Sarah J.' },
];

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            {/* Scroll Snap Container */}
            <div className="scroll-container">
                {/* Block 1: Hero Section */}
                <section className="block hero-block">
                    <Header variant="dark" />

                    <div
                        className="hero-image"
                        style={{ backgroundImage: `url(${BASE_URL}home_hero.png)` }}
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
                                <img src={item.icon} alt={item.title} className="usp-icon" />
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
                            src={`${BASE_URL}product_bag.png`}
                            alt="Coffee Bag"
                            className="product-image"
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
                        <img src={`${BASE_URL}coffee_cherries.jpg`} alt="Coffee Cherries" />
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
                                    <img src={method.icon} alt={method.title} className="brew-icon" />
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
                    style={{ backgroundImage: `url(${BASE_URL}coffee_farmer.jpg)` }}
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
                        <div className="reviews-grid">
                            {REVIEWS.map((review) => (
                                <div key={review.id} className="review-card">
                                    <span className="review-quote">"</span>
                                    <p className="review-text">{review.comment}</p>
                                    <div className="review-footer">
                                        <span className="review-author">{review.author}</span>
                                        <span className="review-stars">★★★★★</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <footer className="home-footer">
                        <span className="footer-brand">SHADOW BEAN CO.</span>
                        <span className="footer-copyright">© 2024 Shadow Bean Co.</span>
                    </footer>
                </section>
            </div>
        </div>
    );
}
