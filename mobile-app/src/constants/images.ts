// Image assets for Shadow Bean Co App
// All images are served via CloudFront CDN
// URL Format: https://media.shadowbeanco.net/[filename]

const BASE_URL = 'https://media.shadowbeanco.net/';

// Brand images
export const images = {
    // Product
    productBag: { uri: `${BASE_URL}product_bag.png` },

    // Hero & Background
    coffeeFarm: { uri: `${BASE_URL}coffee_farm.png` },
    pourOverBrewing: { uri: `${BASE_URL}pour_over_brewing.png` },

    // Story & About
    farmerHarvesting: { uri: `${BASE_URL}farmer_harvesting.jpg` },
    latteArt: { uri: `${BASE_URL}latte_art.png` },

    // Placeholder for app icons
    iconPlaceholder: { uri: `${BASE_URL}icon.png` },
    splashPlaceholder: { uri: `${BASE_URL}splash-icon.png` },
};

// Image descriptions for accessibility
export const imageDescriptions = {
    productBag: 'Shadow Bean Co. coffee bag with bird logo on coffee beans',
    coffeeFarm: 'Lush green coffee farm in shade-grown forest',
    pourOverBrewing: 'Pour-over coffee brewing with kettle',
    farmerHarvesting: 'Coffee farmer harvesting beans in forest',
    latteArt: 'Beautiful latte art being poured',
};

export default images;
