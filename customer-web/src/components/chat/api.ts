import type { ChatCard, TasteState } from './types';

interface BotResponse {
    message: string;
    chips: string[];
    card: ChatCard | null;
    action?: { type: 'add_to_cart'; taste: TasteState } | { type: 'navigate'; path: string };
}

type Phase = 'welcome' | 'educate' | 'taste_time' | 'taste_milk' | 'bitterness' | 'flavour' | 'roast' | 'grind' | 'recommend' | 'quantity' | 'summary' | 'done';

/* ──────────────── Fuzzy intent recognition ──────────────── */

/** Simple Levenshtein distance for short strings */
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
    return dp[m][n];
}

/** Check if a word is close enough to any keyword (strict tolerance to avoid false positives) */
function fuzzyWordMatch(word: string, keyword: string): boolean {
    if (word.length < 3 || keyword.length < 3) return word === keyword;
    // Only allow 1 edit for words up to 6 chars, 2 edits for 7+ chars
    const maxDist = keyword.length <= 6 ? 1 : 2;
    return levenshtein(word, keyword) <= maxDist;
}

/** Check if input fuzzy-matches any keyword in the list */
function fuzzyMatch(input: string, keywords: string[]): boolean {
    const words = input.toLowerCase().split(/\s+/);
    return keywords.some(k => {
        const kLower = k.toLowerCase();
        // Exact substring match first (fast path)
        if (input.toLowerCase().includes(kLower)) return true;
        // Multi-word keyword: check if the phrase is close
        if (kLower.includes(' ')) {
            const kWords = kLower.split(/\s+/);
            // Check if all keyword words fuzzy-match some input word
            return kWords.every(kw => words.some(w => fuzzyWordMatch(w, kw)));
        }
        // Single-word keyword: fuzzy match against any input word
        return words.some(w => fuzzyWordMatch(w, kLower));
    });
}

/** Exact keyword match (original behavior, used as fallback too) */
const match = (input: string, keywords: string[]) =>
    keywords.some(k => input.toLowerCase().includes(k));

/* ──────────────── Intent categories with synonyms ──────────────── */



const ORDER_INTENT = ['order', 'buy', 'purchase', 'want to', 'add to cart', 'get me', 'i want', 'show me product', 'place order', 'checkout', 'gimme', 'grab', 'shop'];
const BRAND_QS = ['brand', 'company', 'shadow bean', 'who are you', 'about you', 'story', 'about', 'your company', 'your brand', 'about the brand', 'what is shadow', 'founded'];
const PROCESS_QS = ['salt-air', 'salt air', 'roasting process', 'shade grown', 'shade-grown', 'how do you roast', 'how is it made', 'process', 'how is it roasted', 'roast method', 'technique', 'how you make'];
const PRICE_QS = ['price', 'cost', 'how much', 'expensive', 'cheap', 'rupee', 'pricing', 'rate', 'afford', 'budget', 'worth', 'value'];
const SHIPPING_QS = ['shipping', 'delivery', 'deliver', 'ship', 'how long', 'when will', 'dispatch', 'tracking', 'transit', 'arrive', 'eta'];
const PAYMENT_QS = ['payment method', 'upi', 'cod', 'cash on delivery', 'razorpay', 'payment', 'pay', 'gpay', 'paytm', 'phonepe', 'credit card', 'debit card', 'card payment', 'online payment', 'netbanking', 'wallet'];
const CONTACT_QS = ['contact', 'support', 'email', 'reach out', 'talk to someone', 'call', 'phone', 'help me', 'customer service', 'complaint', 'issue'];
const THANKS = ['thank', 'thanks', 'thx', 'ty', 'appreciate', 'grateful'];
const GREETINGS = ['hi', 'hello', 'hey', 'hola', 'sup', 'yo', 'good morning', 'good evening', 'good afternoon', 'howdy'];
const YES = ['yes', 'yeah', 'sure', 'ok', 'okay', 'yep', 'yea', 'go ahead', 'sounds good', 'perfect', "let's", 'absolutely', 'definitely', 'of course', 'for sure', 'do it', 'alright'];
const NO = ['no', 'nah', 'nope', 'later', 'maybe not', 'not now', 'not interested', 'pass', 'skip'];
const LIGHT_FLAVOUR = ['light', 'fruity', 'bright', 'citrus', 'floral', 'mild'];

const COFFEE_TYPES = ['espresso', 'latte', 'cappuccino', 'americano', 'mocha', 'macchiato', 'flat white', 'cold brew', 'iced coffee', 'black coffee', 'filter coffee'];
const SUBSCRIPTION_QS = ['subscription', 'subscribe', 'monthly', 'weekly', 'recurring', 'membership', 'plan'];
const GIFT_QS = ['gift', 'present', 'gifting', 'for someone', 'for a friend', 'for my wife', 'for my husband', 'for my mom', 'for my dad', 'surprise'];
const CAFFEINE_QS = ['caffeine', 'decaf', 'decaffeinated', 'caffeine free', 'energy', 'strong coffee'];
const ORIGIN_QS = ['origin', 'where from', 'estate', 'plantation', 'sourced', 'grown where', 'farm', 'region'];
const TASTE_QS = ['taste', 'flavour', 'flavor', 'aroma', 'smell', 'notes', 'tasting notes', 'smooth', 'bitter', 'sweet', 'chocolatey', 'nutty'];

const ROAST_OPTIONS = ['Light', 'Medium', 'Balanced'];
const GRIND_OPTIONS = ['Whole Bean', 'Espresso', 'Moka Pot', 'French Press', 'Pour Over', 'Filter'];

function generateSKU(b: number, f: number, r: string, g: string) {
    return `CR-${b}${f}-${r.charAt(0).toUpperCase()}${g.charAt(0).toUpperCase()}`;
}

/* ──────────────── Smart fallback: find best matching intent ──────────────── */

function findBestIntent(input: string): string | null {
    const intents: { name: string; keywords: string[] }[] = [
        { name: 'order', keywords: ORDER_INTENT },
        { name: 'brand', keywords: BRAND_QS },
        { name: 'process', keywords: PROCESS_QS },
        { name: 'price', keywords: PRICE_QS },
        { name: 'shipping', keywords: SHIPPING_QS },
        { name: 'payment', keywords: PAYMENT_QS },
        { name: 'contact', keywords: CONTACT_QS },
        { name: 'thanks', keywords: THANKS },
        { name: 'greeting', keywords: GREETINGS },
        { name: 'yes', keywords: YES },
        { name: 'no', keywords: NO },
        { name: 'coffee_type', keywords: COFFEE_TYPES },
        { name: 'subscription', keywords: SUBSCRIPTION_QS },
        { name: 'gift', keywords: GIFT_QS },
        { name: 'caffeine', keywords: CAFFEINE_QS },
        { name: 'origin', keywords: ORIGIN_QS },
        { name: 'taste', keywords: TASTE_QS },
    ];

    // First try exact match
    for (const intent of intents) {
        if (match(input, intent.keywords)) return intent.name;
    }

    // Then try fuzzy match
    for (const intent of intents) {
        if (fuzzyMatch(input, intent.keywords)) return intent.name;
    }

    return null;
}

function getIntentResponse(intentName: string): BotResponse | null {
    switch (intentName) {
        case 'brand':
            return { message: "Shadow Bean Co is a small-batch coffee brand from India. We source shade-grown beans from Karnataka and Andhra Pradesh and roast them using our unique salt-air technique. Every blend is customised to your taste!", chips: ['Tell me about the process', 'I want to order', "What's the price?"], card: null };
        case 'process':
            return { message: "Our salt-air roasting preserves the bean's natural oils and reduces bitterness — giving you a cleaner, smoother cup with more character. No additives, no shortcuts.", chips: ['Sounds great!', 'I want to try', "What's the price?"], card: null };
        case 'price':
            return { message: "Each custom 250g bag is ₹799 with free shipping across India!", chips: ['I want to order', 'Tell me more about the coffee'], card: null };
        case 'shipping':
            return { message: "Free shipping across India! Orders typically arrive in 5-7 business days, freshly roasted and packed.", chips: ['I want to order', 'What payment methods?'], card: null };
        case 'payment':
            return { message: "We accept all major payment methods through Razorpay — UPI, credit/debit cards, netbanking, and wallets. We also offer Cash on Delivery!", chips: ['I want to order', 'Tell me more'], card: null };
        case 'contact':
            return { message: "Reach us at contact@shadowbeanco.com — we usually reply within a few hours!", chips: ['I want to order', 'Tell me about the brand'], card: null };
        case 'thanks':
            return { message: "You're welcome! Happy brewing! I'm here whenever you need. ☕", chips: ['Order again', 'Learn more'], card: null };
        case 'coffee_type':
            return { message: "Great taste! At Shadow Bean Co, we let you customise your own blend — choose your bitterness, flavour intensity, roast level, and grind type. It's personalised coffee at its best! Want to create yours?", chips: ['Yes, build my blend!', "What's the price?", 'Tell me more'], card: null };
        case 'subscription':
            return { message: "We're working on a subscription plan! For now, you can re-order anytime through the chat or our website. Want to create a fresh blend?", chips: ['Build my blend', 'Tell me about pricing'], card: null };
        case 'gift':
            return { message: "Coffee makes an amazing gift! 🎁 You can order a custom blend and we'll ship it directly. Want me to help you pick a blend? I can suggest something versatile that most people love.", chips: ['Build a gift blend', 'Tell me about pricing'], card: null };
        case 'caffeine':
            return { message: "Our coffee is naturally caffeinated — shade-grown beans have a smooth, clean energy without the jitters. We don't offer decaf yet, but our lighter roasts have slightly less caffeine. Want to try one?", chips: ['Build a light blend', 'I want to order', 'Tell me more'], card: null };
        case 'origin':
            return { message: "Our beans come from shade-grown estates in Karnataka and Andhra Pradesh, India. The native tree canopy gives the beans a naturally sweeter, richer profile. ☕🌿", chips: ['Tell me about the process', 'I want to order'], card: null };
        case 'taste':
            return { message: "Every blend is unique! You control 4 parameters — bitterness (1-5), flavour intensity (1-5), roast level, and grind type. Let me walk you through it and build your perfect cup!", chips: ['Build my blend', 'Tell me about the process'], card: null };
        default:
            return null;
    }
}

/* ──────────────── Main conversation engine ──────────────── */

export function createConversation() {
    const state: { phase: Phase; taste: TasteState; messageCount: number } = {
        phase: 'welcome' as Phase,
        taste: {} as TasteState,
        messageCount: 0,
    };

    function getGreeting(): BotResponse {
        return {
            message: "Hey there! Welcome to Shadow Bean Co. We craft custom coffee blends from India's shade-grown estates — every bag is roasted to your taste. Are you a regular coffee drinker or exploring something new?",
            chips: ['Regular coffee lover', 'Just exploring', 'I want to order'],
            card: null,
        };
    }

    function respond(input: string): BotResponse {
        state.messageCount++;
        const lower = input.toLowerCase().trim();

        // Greetings (only early)
        if ((match(lower, GREETINGS) || fuzzyMatch(lower, GREETINGS)) && state.messageCount <= 1) {
            return { message: "Hey! Welcome to Shadow Bean Co. How can I help you today?", chips: ['Tell me about the brand', 'I want to order', 'Just browsing'], card: null };
        }

        // Skip to taste flow on order intent (exact or fuzzy)
        if ((match(lower, ORDER_INTENT) || fuzzyMatch(lower, ORDER_INTENT)) && !['bitterness', 'flavour', 'roast', 'grind', 'recommend', 'quantity', 'summary', 'done'].includes(state.phase)) {
            state.phase = 'bitterness';
            return {
                message: "Let's build your perfect blend! First — how bitter do you like your coffee? (1 = very mild, 5 = bold & strong)",
                chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                card: null,
            };
        }

        // Common questions (exact match first, then fuzzy)
        if (match(lower, BRAND_QS) || fuzzyMatch(lower, BRAND_QS)) {
            return getIntentResponse('brand')!;
        }
        if (match(lower, PROCESS_QS) || fuzzyMatch(lower, PROCESS_QS)) {
            return getIntentResponse('process')!;
        }
        if (match(lower, PRICE_QS) || fuzzyMatch(lower, PRICE_QS)) {
            return getIntentResponse('price')!;
        }
        if (match(lower, SHIPPING_QS) || fuzzyMatch(lower, SHIPPING_QS)) {
            return getIntentResponse('shipping')!;
        }
        if (match(lower, PAYMENT_QS) || fuzzyMatch(lower, PAYMENT_QS)) {
            return getIntentResponse('payment')!;
        }
        if (match(lower, CONTACT_QS) || fuzzyMatch(lower, CONTACT_QS)) {
            return getIntentResponse('contact')!;
        }
        if (match(lower, THANKS) || fuzzyMatch(lower, THANKS)) {
            return getIntentResponse('thanks')!;
        }
        // New intents: coffee types, subscription, gifts, caffeine, origin, taste
        if (match(lower, COFFEE_TYPES) || fuzzyMatch(lower, COFFEE_TYPES)) {
            return getIntentResponse('coffee_type')!;
        }
        if (match(lower, SUBSCRIPTION_QS) || fuzzyMatch(lower, SUBSCRIPTION_QS)) {
            return getIntentResponse('subscription')!;
        }
        if (match(lower, GIFT_QS) || fuzzyMatch(lower, GIFT_QS)) {
            return getIntentResponse('gift')!;
        }
        if (match(lower, CAFFEINE_QS) || fuzzyMatch(lower, CAFFEINE_QS)) {
            return getIntentResponse('caffeine')!;
        }
        if (match(lower, ORIGIN_QS) || fuzzyMatch(lower, ORIGIN_QS)) {
            return getIntentResponse('origin')!;
        }
        if (match(lower, TASTE_QS) || fuzzyMatch(lower, TASTE_QS)) {
            return getIntentResponse('taste')!;
        }

        // Phase flow — check BEFORE generic NO so phase-specific matches win
        switch (state.phase) {
            case 'welcome': {
                if (match(lower, [...YES, 'choose', 'help me', 'regular', 'lover', 'daily', 'always', 'love']) || fuzzyMatch(lower, ['regular', 'coffee lover', 'daily drinker', 'everyday', 'love coffee'])) {
                    state.phase = 'educate';
                    return {
                        message: "Awesome! Fun fact — our beans are grown under native tree canopies in South India, which gives them a naturally smoother, sweeter taste. Let me build a custom blend just for you!",
                        chips: ["Let's go!", 'Tell me more first'],
                        card: null,
                    };
                }
                if (match(lower, ['explor', 'just', 'brows', 'new', 'curious']) || fuzzyMatch(lower, ['exploring', 'just browsing', 'new to coffee', 'curious'])) {
                    state.phase = 'educate';
                    return {
                        message: "Great time to explore! Our beans are shade-grown and salt-air roasted — it produces a cleaner, less bitter cup than regular coffee. Want me to help find your perfect blend?",
                        chips: ['Yes, build my blend', 'Tell me about the process'],
                        card: null,
                    };
                }
                // Check NO only after positive-intent matching fails
                if (match(lower, NO) || fuzzyMatch(lower, NO)) {
                    return { message: "No worries! Browse around and I'm here whenever you need. You can also reach us at contact@shadowbeanco.com.", chips: ['Tell me about the coffee', "What's the price?"], card: null };
                }
                state.phase = 'educate';
                return {
                    message: "Nice! Our shade-grown, salt-air roasted beans let you customise bitterness, flavour, roast, and grind — all for ₹799 per 250g bag. Want to build your custom blend?",
                    chips: ['Yes, let\'s do it', 'Tell me more'],
                    card: null,
                };
            }

            case 'educate': {
                state.phase = 'bitterness';
                return {
                    message: "Let's build your perfect blend! First — how bitter do you like your coffee? (1 = very mild, 5 = bold & strong)",
                    chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                    card: null,
                };
            }

            case 'bitterness': {
                const numMatch = lower.match(/[1-5]/);
                state.taste.bitterness = numMatch ? parseInt(numMatch[0]) : (match(lower, ['mild', 'light', 'soft', 'gentle', 'weak']) ? 2 : match(lower, ['bold', 'strong', 'dark', 'intense', 'heavy']) ? 4 : 3);
                state.phase = 'flavour';
                return {
                    message: `Bitterness set to ${state.taste.bitterness}/5! Now, how flavourful do you want it? (1 = subtle, 5 = intense & aromatic)`,
                    chips: ['2 - Subtle', '3 - Balanced', '5 - Intense'],
                    card: null,
                };
            }

            case 'flavour': {
                const numMatch = lower.match(/[1-5]/);
                state.taste.flavour = numMatch ? parseInt(numMatch[0]) : (match(lower, LIGHT_FLAVOUR) || fuzzyMatch(lower, LIGHT_FLAVOUR) ? 2 : match(lower, ['intense', 'strong', 'aromatic', 'rich', 'full']) ? 5 : 3);
                state.phase = 'roast';
                return {
                    message: `Flavour set to ${state.taste.flavour}/5! What roast level would you prefer?`,
                    chips: ROAST_OPTIONS,
                    card: null,
                };
            }

            case 'roast': {
                const roastMatch = ROAST_OPTIONS.find(r => lower.includes(r.toLowerCase()));
                if (roastMatch) {
                    state.taste.roast = roastMatch;
                } else {
                    // Fuzzy match roast options
                    const fuzzyRoast = ROAST_OPTIONS.find(r =>
                        fuzzyMatch(lower, [r.toLowerCase()])
                    );
                    state.taste.roast = fuzzyRoast || (match(lower, ['dark', 'strong', 'bold', 'heavy']) ? 'Balanced' : match(lower, ['light', 'mild', 'gentle']) ? 'Light' : 'Medium');
                }
                state.phase = 'grind';
                return {
                    message: `${state.taste.roast} roast — great choice! Last one — what grind type do you need?`,
                    chips: ['Whole Bean', 'Espresso', 'Pour Over'],
                    card: null,
                };
            }

            case 'grind': {
                let grindMatch = GRIND_OPTIONS.find(g => lower.includes(g.toLowerCase()));
                if (!grindMatch) {
                    // Fuzzy match grind options
                    grindMatch = GRIND_OPTIONS.find(g =>
                        fuzzyMatch(lower, [g.toLowerCase()])
                    ) || undefined;
                }
                state.taste.grind = grindMatch || 'Whole Bean';
                state.phase = 'recommend';

                const sku = generateSKU(state.taste.bitterness!, state.taste.flavour!, state.taste.roast!, state.taste.grind);
                return {
                    message: "Here's your custom blend, crafted just for you:",
                    chips: ['Add to cart', 'Change something', 'Start over'],
                    card: {
                        type: 'product',
                        data: {
                            name: sku,
                            bitterness: state.taste.bitterness!,
                            flavour: state.taste.flavour!,
                            roast: state.taste.roast!,
                            grind: state.taste.grind,
                            price: 799,
                            reason: `Custom blend: Bitterness ${state.taste.bitterness}/5, Flavour ${state.taste.flavour}/5, ${state.taste.roast} roast, ${state.taste.grind} grind.`,
                        },
                    },
                };
            }

            case 'recommend': {
                if (match(lower, ['add', 'cart', ...YES, 'buy']) || fuzzyMatch(lower, ['add to cart', 'buy it', 'take it', 'get it'])) {
                    state.phase = 'quantity';
                    return {
                        message: "How many bags would you like?",
                        chips: ['1 bag', '2 bags', '3 bags'],
                        card: null,
                    };
                }
                if (match(lower, ['change', 'different', 'modify', 'edit', 'adjust']) || fuzzyMatch(lower, ['change something', 'modify', 'adjust', 'tweak'])) {
                    state.phase = 'bitterness';
                    state.taste = {};
                    return {
                        message: "No problem! Let's start fresh. How bitter do you like your coffee? (1-5)",
                        chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                        card: null,
                    };
                }
                if (match(lower, ['start over', 'reset', 'new', 'redo']) || fuzzyMatch(lower, ['start over', 'reset', 'new blend'])) {
                    state.phase = 'bitterness';
                    state.taste = {};
                    return {
                        message: "Let's build a new blend! How bitter do you like your coffee? (1-5)",
                        chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                        card: null,
                    };
                }
                return {
                    message: "What would you like to do with this blend?",
                    chips: ['Add to cart', 'Change something', 'Start over'],
                    card: null,
                };
            }

            case 'quantity': {
                const numMatch = lower.match(/(\d+)/);
                let qty = numMatch ? Math.min(10, Math.max(1, parseInt(numMatch[1]))) : 1;
                if (match(lower, ['one', '1'])) qty = 1;
                if (match(lower, ['two', '2'])) qty = 2;
                if (match(lower, ['three', '3'])) qty = 3;
                state.taste.qty = qty;
                state.phase = 'summary';

                const total = 799 * qty;
                const sku = generateSKU(state.taste.bitterness!, state.taste.flavour!, state.taste.roast!, state.taste.grind!);

                return {
                    message: `${qty} bag${qty > 1 ? 's' : ''} — adding to your cart now!`,
                    chips: [],
                    card: {
                        type: 'summary',
                        data: {
                            items: [{ name: sku, qty, price: 799 }],
                            discount: 0,
                            total,
                            grind: state.taste.grind!,
                        },
                    },
                    action: { type: 'add_to_cart', taste: { ...state.taste } },
                };
            }

            case 'summary':
            case 'done': {
                if (match(lower, ['start over', 'again', 'new', 'another']) || fuzzyMatch(lower, ['start over', 'another blend', 'new blend', 'one more'])) {
                    state.phase = 'bitterness';
                    state.taste = {};
                    return {
                        message: "Let's build another blend! How bitter do you like it? (1-5)",
                        chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                        card: null,
                    };
                }
                if (match(lower, ORDER_INTENT) || fuzzyMatch(lower, ORDER_INTENT)) {
                    state.phase = 'bitterness';
                    state.taste = {};
                    return {
                        message: "Let's build your blend! How bitter do you like your coffee? (1-5)",
                        chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                        card: null,
                    };
                }
                state.phase = 'done';
                return {
                    message: "Anything else I can help with?",
                    chips: ['Build another blend', 'Tell me about the brand', "That's all, thanks!"],
                    card: null,
                };
            }

            default: {
                // Smart fallback: try to find best matching intent via fuzzy matching
                const bestIntent = findBestIntent(lower);
                if (bestIntent) {
                    const intentResp = getIntentResponse(bestIntent);
                    if (intentResp) return intentResp;

                    // Handle intents that map to phase changes
                    if (bestIntent === 'order') {
                        state.phase = 'bitterness';
                        return {
                            message: "Let's build your perfect blend! How bitter do you like your coffee? (1 = mild, 5 = bold)",
                            chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                            card: null,
                        };
                    }
                    if (bestIntent === 'yes') {
                        state.phase = 'educate';
                        return {
                            message: "Great! Let me help you find the perfect coffee blend. Want me to walk you through the customisation process?",
                            chips: ["Let's go!", 'Tell me more first'],
                            card: null,
                        };
                    }
                }

                // Ultimate fallback with helpful suggestions
                return {
                    message: "I'm not sure I understood that — but I'd love to help! Here are some things I can assist with:",
                    chips: ['Build my blend', 'Tell me about the brand', "What's the price?", 'Contact support'],
                    card: null,
                };
            }
        }
    }

    return { getGreeting, respond, getState: () => state };
}
