/**
 * Shadow Bean Co - SEO Component
 * ==============================================
 * Dynamic OpenGraph, Twitter Card, and JSON-LD
 * meta tags for all pages. Handles product pages
 * with structured data for Google rich results.
 * ==============================================
 */

import { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'product' | 'article';
    product?: {
        name: string;
        description: string;
        price: number;
        currency?: string;
        image: string;
        sku?: string;
        availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
        brand?: string;
        ratingValue?: number;
        reviewCount?: number;
    };
    noindex?: boolean;
}

const SITE_NAME = 'Shadow Bean Co';
const DEFAULT_DESCRIPTION = 'Premium shade-grown, salt-roasted coffee beans. Personalised to your taste. Small batch roasted in India.';
const DEFAULT_IMAGE = 'https://media.shadowbeanco.net/og/default-og.webp';
const SITE_URL = 'https://shadowbeanco.net';

export default function SEO({
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    product,
    noindex = false,
}: SEOProps) {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Premium Personalised Coffee`;
    const canonical = url ? `${SITE_URL}${url}` : SITE_URL;

    useEffect(() => {
        // Update document title
        document.title = fullTitle;

        // Helper to set/create meta tags
        const setMeta = (property: string, content: string, isName = false) => {
            const attr = isName ? 'name' : 'property';
            let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, property);
                document.head.appendChild(el);
            }
            el.content = content;
        };

        // Helper to set/create link tags
        const setLink = (rel: string, href: string) => {
            let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
            if (!el) {
                el = document.createElement('link');
                el.rel = rel;
                document.head.appendChild(el);
            }
            el.href = href;
        };

        // Basic meta
        setMeta('description', description, true);
        setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow', true);

        // Canonical URL
        setLink('canonical', canonical);

        // OpenGraph
        setMeta('og:title', fullTitle);
        setMeta('og:description', description);
        setMeta('og:image', image);
        setMeta('og:url', canonical);
        setMeta('og:type', type === 'product' ? 'product' : 'website');
        setMeta('og:site_name', SITE_NAME);
        setMeta('og:locale', 'en_IN');

        // Twitter Card
        setMeta('twitter:card', 'summary_large_image', true);
        setMeta('twitter:title', fullTitle, true);
        setMeta('twitter:description', description, true);
        setMeta('twitter:image', image, true);

        // Product-specific OG tags
        if (product) {
            setMeta('og:type', 'product');
            setMeta('product:price:amount', String(product.price));
            setMeta('product:price:currency', product.currency || 'INR');
            setMeta('product:availability', product.availability === 'InStock' ? 'in stock' : 'out of stock');
            if (product.brand) setMeta('product:brand', product.brand);
        }

        // JSON-LD Structured Data
        const existingJsonLd = document.querySelector('script[data-seo="jsonld"]');
        if (existingJsonLd) existingJsonLd.remove();

        const jsonLdScript = document.createElement('script');
        jsonLdScript.type = 'application/ld+json';
        jsonLdScript.setAttribute('data-seo', 'jsonld');

        if (product) {
            // Product JSON-LD
            const productSchema: Record<string, any> = {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: product.name,
                description: product.description,
                image: product.image,
                brand: {
                    '@type': 'Brand',
                    name: product.brand || SITE_NAME,
                },
                offers: {
                    '@type': 'Offer',
                    price: product.price,
                    priceCurrency: product.currency || 'INR',
                    availability: `https://schema.org/${product.availability || 'InStock'}`,
                    url: canonical,
                    seller: {
                        '@type': 'Organization',
                        name: SITE_NAME,
                    },
                },
            };

            if (product.sku) productSchema.sku = product.sku;

            if (product.ratingValue && product.reviewCount) {
                productSchema.aggregateRating = {
                    '@type': 'AggregateRating',
                    ratingValue: product.ratingValue,
                    reviewCount: product.reviewCount,
                    bestRating: 5,
                    worstRating: 1,
                };
            }

            jsonLdScript.textContent = JSON.stringify(productSchema);
        } else {
            // Organization JSON-LD (default)
            const orgSchema = {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: SITE_NAME,
                url: SITE_URL,
                logo: `${SITE_URL}/icons/logo.webp`,
                description: DEFAULT_DESCRIPTION,
                sameAs: [],
                contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'customer service',
                    availableLanguage: ['English', 'Hindi'],
                },
            };
            jsonLdScript.textContent = JSON.stringify(orgSchema);
        }

        document.head.appendChild(jsonLdScript);

        // Cleanup
        return () => {
            const toClean = document.querySelector('script[data-seo="jsonld"]');
            if (toClean) toClean.remove();
        };
    }, [fullTitle, description, image, canonical, type, product, noindex]);

    return null;
}

// ==============================================
// PREBUILT SEO CONFIGS FOR COMMON PAGES
// ==============================================

export function HomeSEO() {
    return (
        <SEO
            title="Premium Personalised Coffee"
            description="Shadow Bean Co crafts premium shade-grown, salt-roasted coffee beans personalised to your taste. Small batch roasted in India. Order online."
            url="/"
        />
    );
}

export function ShopSEO() {
    return (
        <SEO
            title="Shop Coffee Beans"
            description="Create your personalised coffee blend. Choose bitterness, acidity, roast level, and grind type. Fresh roasted and delivered to your door."
            url="/shop"
        />
    );
}

export function AboutSEO() {
    return (
        <SEO
            title="About Us"
            description="Shadow Bean Co was born from a love for shade-grown coffee. Learn about our salt-roasting process, our farms, and our mission."
            url="/about"
        />
    );
}

export function CartSEO() {
    return (
        <SEO
            title="Your Cart"
            description="Review your personalised coffee selections before checkout."
            url="/cart"
            noindex
        />
    );
}

export function ProductSEO({ name, description, price, image, sku, ratingValue, reviewCount }: {
    name: string;
    description: string;
    price: number;
    image: string;
    sku?: string;
    ratingValue?: number;
    reviewCount?: number;
}) {
    return (
        <SEO
            title={name}
            description={description}
            image={image}
            url={`/shop/${sku || ''}`}
            type="product"
            product={{
                name,
                description,
                price,
                image,
                sku,
                brand: 'Shadow Bean Co',
                availability: 'InStock',
                ratingValue,
                reviewCount,
            }}
        />
    );
}
