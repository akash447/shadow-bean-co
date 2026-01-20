// import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './AboutPage.css';

const BASE_URL = 'https://yyqoagncaxzpxodwnuax.supabase.co/storage/v1/object/public/media/';

export default function AboutPage() {
    // const navigate = useNavigate();

    return (
        <div className="about-container">
            <Header variant="light" />

            <div className="about-content">
                {/* Section 1: Story Behind The Brand */}
                <section className="about-section story-section">
                    <div className="story-left">
                        <h1 className="about-heading">STORY BEHIND<br />THE BRAND</h1>
                        <p className="about-text">
                            Shadow Bean Co. was born from India's shaded coffee forests, where beans grow
                            slowly under natural tree canopies and develop deep, layered flavor. We set out to
                            honor this heritage by creating coffee that stays true to its origins: pure, small-batch,
                            and crafted with intention. Our name reflects this journey: grown in shadow,
                            nurtured by nature, and roasted to bring out its most honest form.
                        </p>
                    </div>
                    <div className="story-right">
                        <img
                            src={`${BASE_URL}coffee_farm.png`}
                            alt="Coffee Farm"
                            className="story-img-main"
                        />
                        <img
                            src={`${BASE_URL}roasting_process.jpg`}
                            alt="Roasting Process"
                            className="story-img-secondary"
                        />
                    </div>
                </section>

                {/* Section 2: The Philosophy */}
                <section className="about-section philosophy-section">
                    <div className="philosophy-content">
                        <div className="philosophy-left">
                            <h2 className="about-heading">THE<br />PHILOSOPHY</h2>
                        </div>
                        <div className="philosophy-right">
                            <p className="about-text">
                                We believe great coffee needs nothing added - just care, precision, and respect for
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
                </section>

                {/* Section 3: Journey of a Coffee Bean */}
                <section className="about-section journey-section">
                    <div className="journey-icons">
                        <img src='/icons/icon_map_karnataka.png' alt="Karnataka Map" className="journey-icon" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <span className="dashed-line">----------------</span>
                        <img src={`${BASE_URL}product_bag.png`} alt="Coffee Bag" className="journey-icon" />
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
                </section>
            </div>

            {/* Footer */}
            <footer className="about-footer">
                <span className="footer-brand">SHADOW BEAN CO.</span>
                <span className="footer-copyright">© 2024 Shadow Bean Co.</span>
            </footer>
        </div>
    );
}
