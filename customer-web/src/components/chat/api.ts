import type { ChatCard, TasteState } from './types';

interface BotResponse {
    message: string;
    chips: string[];
    card: ChatCard | null;
    action?: { type: 'add_to_cart'; taste: TasteState } | { type: 'navigate'; path: string };
}

type Phase = 'welcome' | 'educate' | 'taste_time' | 'taste_milk' | 'bitterness' | 'flavour' | 'roast' | 'grind' | 'recommend' | 'quantity' | 'summary' | 'done';

const match = (input: string, keywords: string[]) =>
    keywords.some(k => input.toLowerCase().includes(k));

const ORDER_INTENT = ['order', 'buy', 'purchase', 'want to', 'add to cart', 'get me', 'i want', 'show me product'];
const BRAND_QS = ['brand', 'company', 'shadow bean', 'who are you', 'about you', 'story'];
const PROCESS_QS = ['salt-air', 'salt air', 'roasting process', 'shade grown', 'shade-grown', 'how do you roast', 'how is it made'];
const PRICE_QS = ['price', 'cost', 'how much', 'expensive', 'cheap', 'rupee'];
const SHIPPING_QS = ['shipping', 'delivery', 'deliver', 'ship', 'how long', 'when will'];
const PAYMENT_QS = ['payment method', 'upi', 'cod', 'cash on delivery', 'qr code'];
const CONTACT_QS = ['contact', 'support', 'email', 'reach out'];
const THANKS = ['thank', 'thanks', 'thx', 'ty'];
const GREETINGS = ['hi', 'hello', 'hey', 'hola', 'sup', 'yo'];
const YES = ['yes', 'yeah', 'sure', 'ok', 'okay', 'yep', 'yea', 'go ahead', 'sounds good', 'perfect', 'let\'s', "let's"];
const NO = ['no', 'nah', 'nope', 'later', 'maybe not'];
const LIGHT_FLAVOUR = ['light', 'fruity', 'bright', 'citrus', 'floral', 'mild'];

const ROAST_OPTIONS = ['Light', 'Medium', 'Balanced'];
const GRIND_OPTIONS = ['Whole Bean', 'Espresso', 'Moka Pot', 'French Press', 'Pour Over', 'Filter'];

function generateSKU(b: number, f: number, r: string, g: string) {
    return `CR-${b}${f}-${r.charAt(0).toUpperCase()}${g.charAt(0).toUpperCase()}`;
}

export function createConversation() {
    const state = {
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
        if (match(lower, GREETINGS) && state.messageCount <= 1) {
            return { message: "Hey! Welcome to Shadow Bean Co. How can I help you today?", chips: ['Tell me about the brand', 'I want to order', 'Just browsing'], card: null };
        }

        // Skip to taste flow on order intent
        if (match(lower, ORDER_INTENT) && !['bitterness', 'flavour', 'roast', 'grind', 'quantity', 'summary'].includes(state.phase)) {
            state.phase = 'bitterness';
            return {
                message: "Let's build your perfect blend! First — how bitter do you like your coffee? (1 = very mild, 5 = bold & strong)",
                chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                card: null,
            };
        }

        // Common questions (check BEFORE phase flow, but use precise patterns)
        if (match(lower, BRAND_QS)) {
            return { message: "Shadow Bean Co is a small-batch coffee brand from India. We source shade-grown beans from Karnataka and Andhra Pradesh and roast them using our unique salt-air technique. Every blend is customised to your taste!", chips: ['Tell me about the process', 'I want to order', "What's the price?"], card: null };
        }
        if (match(lower, PROCESS_QS)) {
            return { message: "Our salt-air roasting preserves the bean's natural oils and reduces bitterness — giving you a cleaner, smoother cup with more character. No additives, no shortcuts.", chips: ['Sounds great!', 'I want to try', "What's the price?"], card: null };
        }
        if (match(lower, PRICE_QS)) {
            return { message: "Each custom 250g bag is ₹799 with free shipping across India!", chips: ['I want to order', 'Tell me more about the coffee'], card: null };
        }
        if (match(lower, SHIPPING_QS)) {
            return { message: "Free shipping across India! Orders typically arrive in 5-7 business days, freshly roasted and packed.", chips: ['I want to order', 'What payment methods?'], card: null };
        }
        if (match(lower, PAYMENT_QS)) {
            return { message: "We accept UPI and Cash on Delivery. For UPI, you'll see a QR code at checkout — scan with any UPI app and we auto-detect your payment!", chips: ['I want to order', 'Tell me more'], card: null };
        }
        if (match(lower, CONTACT_QS)) {
            return { message: "Reach us at contact@shadowbeanco.com — we usually reply within a few hours!", chips: ['I want to order', 'Tell me about the brand'], card: null };
        }
        if (match(lower, THANKS)) {
            return { message: "You're welcome! Happy brewing! I'm here whenever you need.", chips: ['Order again', 'Learn more'], card: null };
        }
        if (match(lower, NO) && ['welcome', 'educate'].includes(state.phase)) {
            return { message: "No worries! Browse around and I'm here whenever you need. You can also reach us at contact@shadowbeanco.com.", chips: ['Tell me about the coffee', "What's the price?"], card: null };
        }

        // Phase flow
        switch (state.phase) {
            case 'welcome': {
                // "Yes help me choose" / "Regular coffee lover" / anything positive
                if (match(lower, [...YES, 'choose', 'help me', 'regular', 'lover', 'daily', 'always', 'love'])) {
                    state.phase = 'educate';
                    return {
                        message: "Awesome! Fun fact — our beans are grown under native tree canopies in South India, which gives them a naturally smoother, sweeter taste. Let me build a custom blend just for you!",
                        chips: ["Let's go!", 'Tell me more first'],
                        card: null,
                    };
                }
                if (match(lower, ['explor', 'just', 'brows', 'new'])) {
                    state.phase = 'educate';
                    return {
                        message: "Great time to explore! Our beans are shade-grown and salt-air roasted — it produces a cleaner, less bitter cup than regular coffee. Want me to help find your perfect blend?",
                        chips: ['Yes, build my blend', 'Tell me about the process'],
                        card: null,
                    };
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
                state.taste.bitterness = numMatch ? parseInt(numMatch[0]) : (match(lower, ['mild', 'light', 'soft']) ? 2 : match(lower, ['bold', 'strong', 'dark']) ? 4 : 3);
                state.phase = 'flavour';
                return {
                    message: `Bitterness set to ${state.taste.bitterness}/5! Now, how flavourful do you want it? (1 = subtle, 5 = intense & aromatic)`,
                    chips: ['2 - Subtle', '3 - Balanced', '5 - Intense'],
                    card: null,
                };
            }

            case 'flavour': {
                const numMatch = lower.match(/[1-5]/);
                state.taste.flavour = numMatch ? parseInt(numMatch[0]) : (match(lower, LIGHT_FLAVOUR) ? 2 : match(lower, ['intense', 'strong', 'aromatic', 'rich']) ? 5 : 3);
                state.phase = 'roast';
                return {
                    message: `Flavour set to ${state.taste.flavour}/5! What roast level would you prefer?`,
                    chips: ROAST_OPTIONS,
                    card: null,
                };
            }

            case 'roast': {
                const roastMatch = ROAST_OPTIONS.find(r => lower.includes(r.toLowerCase()));
                state.taste.roast = roastMatch || (match(lower, ['dark', 'strong', 'bold']) ? 'Balanced' : match(lower, ['light', 'mild']) ? 'Light' : 'Medium');
                state.phase = 'grind';
                return {
                    message: `${state.taste.roast} roast — great choice! Last one — what grind type do you need?`,
                    chips: ['Whole Bean', 'Espresso', 'Pour Over'],
                    card: null,
                };
            }

            case 'grind': {
                const grindMatch = GRIND_OPTIONS.find(g => lower.includes(g.toLowerCase()));
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
                if (match(lower, ['add', 'cart', ...YES, 'buy'])) {
                    state.phase = 'quantity';
                    return {
                        message: "How many bags would you like?",
                        chips: ['1 bag', '2 bags', '3 bags'],
                        card: null,
                    };
                }
                if (match(lower, ['change', 'different', 'modify', 'edit'])) {
                    state.phase = 'bitterness';
                    state.taste = {};
                    return {
                        message: "No problem! Let's start fresh. How bitter do you like your coffee? (1-5)",
                        chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                        card: null,
                    };
                }
                if (match(lower, ['start over', 'reset', 'new'])) {
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
                if (match(lower, ['start over', 'again', 'new', 'another'])) {
                    state.phase = 'bitterness';
                    state.taste = {};
                    return {
                        message: "Let's build another blend! How bitter do you like it? (1-5)",
                        chips: ['1 - Mild', '3 - Balanced', '5 - Bold'],
                        card: null,
                    };
                }
                if (match(lower, ORDER_INTENT)) {
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

            default:
                return {
                    message: "I'm not sure about that — feel free to ask about our coffee, or I can help you build a custom blend!",
                    chips: ['Build my blend', 'Tell me about the brand', 'Contact support'],
                    card: null,
                };
        }
    }

    return { getGreeting, respond, getState: () => state };
}
