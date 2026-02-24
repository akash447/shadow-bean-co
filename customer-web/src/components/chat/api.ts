import type { ChatCard } from './types';

/** Conversation phase tracking */
type Phase = 'welcome' | 'educate' | 'taste_time' | 'taste_milk' | 'taste_flavour' | 'recommend' | 'quantity' | 'grind' | 'summary' | 'done';

interface BotResponse {
    message: string;
    chips: string[];
    card: ChatCard | null;
}

interface TasteProfile {
    time?: 'morning' | 'evening';
    milk?: boolean;
    flavour?: 'rich' | 'light';
    qty?: number;
    grind?: string;
}

interface ConversationState {
    phase: Phase;
    taste: TasteProfile;
    messageCount: number;
}

// Pattern matchers
const match = (input: string, keywords: string[]) =>
    keywords.some(k => input.toLowerCase().includes(k));

const GREETINGS = ['hi', 'hello', 'hey', 'hola', 'sup', 'yo'];
const ORDER_INTENT = ['order', 'buy', 'purchase', 'shop', 'want to', 'add to cart', 'get me', 'i want', 'show me product'];
const BRAND_QS = ['brand', 'company', 'shadow bean', 'who are you', 'about you', 'story'];
const PROCESS_QS = ['salt', 'roast', 'shade', 'process', 'how do you', 'how is'];
const PRICE_QS = ['price', 'cost', 'how much', 'expensive', 'cheap', '₹', 'rupee'];
const SHIPPING_QS = ['shipping', 'delivery', 'deliver', 'ship', 'time', 'how long', 'when will'];
const PAYMENT_QS = ['pay', 'payment', 'upi', 'cod', 'cash', 'qr'];
const CONTACT_QS = ['contact', 'support', 'help', 'email', 'reach'];
const THANKS = ['thank', 'thanks', 'thx', 'ty'];
const YES = ['yes', 'yeah', 'sure', 'ok', 'okay', 'yep', 'yea', 'let\'s go', 'go ahead', 'sounds good', 'perfect'];
const NO = ['no', 'nah', 'not', 'nope', 'later', 'maybe'];
const EVENING = ['evening', 'afternoon', 'relax', 'wind down', 'chill', 'calm'];
const WITH_MILK = ['milk', 'latte', 'cappuccino', 'creamy', 'with milk'];
const BLACK = ['black', 'straight', 'no milk', 'without milk', 'plain'];
const LIGHT = ['light', 'fruity', 'bright', 'citrus', 'floral', 'mild', 'smooth'];

function buildRecommendation(taste: TasteProfile): { name: string; desc: string; notes: string; bitterness: number; flavour: number; roast: string; reason: string } {
    const isMorning = taste.time === 'morning';
    const isMilk = taste.milk === true;
    const isRich = taste.flavour === 'rich';

    if (isRich && isMorning) {
        return {
            name: 'The Dark Roast Kickstart',
            desc: 'Bold, deep, and full-bodied — designed to power your mornings with rich chocolate undertones.',
            notes: 'Dark Chocolate, Caramel, Bold',
            bitterness: 4, flavour: 3, roast: 'Dark',
            reason: 'Perfect for your morning ritual — bold enough to wake you up, smooth enough to enjoy.',
        };
    }
    if (isRich && !isMorning) {
        return {
            name: 'The Evening Velvet',
            desc: 'Smooth, rich, and comforting — like a warm hug in a cup for those slow evenings.',
            notes: 'Cocoa, Hazelnut, Smooth',
            bitterness: 3, flavour: 4, roast: 'Medium-Dark',
            reason: 'Rich but not overpowering — ideal for unwinding after a long day.',
        };
    }
    if (!isRich && isMorning) {
        return {
            name: 'The Sunrise Brew',
            desc: 'Bright, fruity, and refreshing — a gentle wake-up call with citrus and floral notes.',
            notes: 'Citrus, Berry, Floral',
            bitterness: 2, flavour: 5, roast: 'Light',
            reason: 'Light and energising — starts your day on a bright note without heaviness.',
        };
    }
    // Light + evening
    return {
        name: 'The Sunset Sip',
        desc: 'Delicate, fruity, and aromatic — a soothing cup that lets you savour the moment.',
        notes: 'Stone Fruit, Honey, Floral',
        bitterness: 2, flavour: 4, roast: 'Medium',
        reason: isMilk
            ? 'Pairs beautifully with milk — honey sweetness with a clean finish.'
            : 'Clean and delicate — perfect for sipping straight and appreciating every note.',
    };
}

const GRIND_OPTIONS = ['Whole Bean', 'French Press', 'Pour Over', 'Filter', 'Espresso'];

export function createConversation() {
    const state: ConversationState = {
        phase: 'welcome',
        taste: {},
        messageCount: 0,
    };

    function getGreeting(): BotResponse {
        state.phase = 'welcome';
        return {
            message: "Hey there! Welcome to Shadow Bean Co. We craft custom coffee blends from India's shade-grown estates using a unique salt-air roasting process. Are you a regular coffee drinker or exploring something new?",
            chips: ["Regular coffee lover", "Just exploring", "I want to order"],
            card: null,
        };
    }

    function respond(input: string): BotResponse {
        state.messageCount++;
        const lower = input.toLowerCase().trim();

        // --- Greetings at any phase ---
        if (match(lower, GREETINGS) && state.messageCount <= 1) {
            return {
                message: "Hey there! Welcome to Shadow Bean Co. How can I help you today?",
                chips: ["Tell me about the brand", "I want to order", "Just browsing"],
                card: null,
            };
        }

        // --- "No" / disengagement ---
        if (match(lower, NO) && (state.phase === 'educate' || state.phase === 'welcome')) {
            return {
                message: "No worries at all! Feel free to browse, and I'm here whenever you need help. You can also reach us at contact@shadowbeanco.com.",
                chips: ["Tell me about the coffee", "What's the price?", "That's all, thanks!"],
                card: null,
            };
        }

        // --- Skip to order if user wants to buy immediately ---
        if (match(lower, ORDER_INTENT) && state.phase !== 'quantity' && state.phase !== 'grind' && state.phase !== 'summary') {
            state.phase = 'taste_time';
            return {
                message: "Love the enthusiasm! Let me find the perfect blend for you. Quick question — do you usually reach for coffee to kick-start your morning or to wind down later in the day?",
                chips: ["Morning energy", "Afternoon/evening chill"],
                card: null,
            };
        }

        // --- Handle common questions at any phase ---
        if (match(lower, BRAND_QS)) {
            return {
                message: "Shadow Bean Co is a small-batch coffee brand from India. We source shade-grown beans from Karnataka and Andhra Pradesh and roast them using our unique salt-air technique — it reduces bitterness and brings out natural sweetness. Every blend is customised to your taste!",
                chips: ["Tell me about the process", "I want to try some", "What's the price?"],
                card: null,
            };
        }
        if (match(lower, PROCESS_QS)) {
            return {
                message: "Our salt-air roasting is what makes us unique — instead of traditional roasting, we use a controlled salt-air environment that preserves the bean's natural oils and reduces bitterness. The result? A cleaner, smoother cup with more character.",
                chips: ["Sounds interesting!", "I want to try", "What's the price?"],
                card: null,
            };
        }
        if (match(lower, PRICE_QS)) {
            return {
                message: "Each custom 250g bag is ₹799 with free shipping across India! And if you order 2+ bags, you get 5% off — 4+ bags get 10% off.",
                chips: ["I want to order", "Tell me about the coffee", "How does shipping work?"],
                card: null,
            };
        }
        if (match(lower, SHIPPING_QS)) {
            return {
                message: "We offer free shipping across India! Orders typically arrive in 5-7 business days. Every bag is freshly roasted and packed just before shipping.",
                chips: ["I want to order", "What payment methods?"],
                card: null,
            };
        }
        if (match(lower, PAYMENT_QS)) {
            return {
                message: "We accept UPI and Cash on Delivery. For UPI, you'll see a QR code at checkout with the exact amount — scan with any UPI app (GPay, PhonePe, Paytm) and we auto-detect your payment!",
                chips: ["I want to order", "Tell me about the coffee"],
                card: null,
            };
        }
        if (match(lower, CONTACT_QS)) {
            return {
                message: "You can reach us at contact@shadowbeanco.com — we usually reply within a few hours! Happy to help with anything.",
                chips: ["I want to order", "Tell me about the brand"],
                card: null,
            };
        }
        if (match(lower, THANKS)) {
            return {
                message: "You're welcome! Happy brewing! If you ever want to try a new blend or reorder, I'm right here.",
                chips: ["Order again", "Learn more"],
                card: null,
            };
        }

        // --- Phase-based flow ---
        switch (state.phase) {
            case 'welcome': {
                state.phase = 'educate';
                if (match(lower, ['regular', 'daily', 'every day', 'love coffee', 'lover', 'always'])) {
                    return {
                        message: "A fellow coffee enthusiast! Here's something cool — our beans are grown under native tree canopies, which makes them develop flavour slower and richer than sun-grown coffee. Do you usually go for a strong, bold cup or something lighter?",
                        chips: ["Bold and strong", "Light and smooth", "Show me what you've got"],
                        card: null,
                    };
                }
                return {
                    message: "Great time to explore! Fun fact — our beans are shade-grown under native tree canopies in south India, which gives them a naturally smoother, sweeter taste than regular coffee. Would you like me to help find a blend that suits you?",
                    chips: ["Yes, help me choose", "Tell me more about the process", "Just browsing"],
                    card: null,
                };
            }

            case 'educate': {
                state.phase = 'taste_time';
                return {
                    message: "Let me find the perfect match for you! First — do you usually need coffee to kick-start your morning or do you enjoy it more as an afternoon/evening thing?",
                    chips: ["Morning energy", "Afternoon/evening chill", "Both, honestly!"],
                    card: null,
                };
            }

            case 'taste_time': {
                state.taste.time = match(lower, EVENING) ? 'evening' : 'morning';
                state.phase = 'taste_milk';
                return {
                    message: state.taste.time === 'morning'
                        ? "Nice, a morning person! One more thing — do you usually have your coffee with milk or prefer it straight up?"
                        : "Love a good evening cup! Do you usually take it with milk or enjoy it black?",
                    chips: ["With milk", "Black / straight", "Depends on my mood"],
                    card: null,
                };
            }

            case 'taste_milk': {
                state.taste.milk = match(lower, BLACK) ? false : match(lower, WITH_MILK) || match(lower, ['depends', 'mood']);
                state.phase = 'taste_flavour';
                return {
                    message: "Last one — do you lean more towards a chocolatey, rich depth or something lighter and fruity?",
                    chips: ["Chocolatey & rich", "Light & fruity", "Surprise me"],
                    card: null,
                };
            }

            case 'taste_flavour': {
                state.taste.flavour = match(lower, LIGHT) ? 'light' : 'rich';
                state.phase = 'recommend';
                const rec = buildRecommendation(state.taste);
                return {
                    message: `Based on what you've told me, I think you'd love this:`,
                    chips: ["Add to cart", "Tell me more", "Show another"],
                    card: {
                        type: 'product',
                        data: {
                            name: rec.name,
                            description: rec.desc,
                            tastingNotes: rec.notes,
                            price: 799,
                            bitterness: rec.bitterness,
                            flavour: rec.flavour,
                            roast: rec.roast,
                            grind: 'whole_bean',
                            reason: rec.reason,
                        },
                    },
                };
            }

            case 'recommend': {
                if (match(lower, ['add', 'cart', 'yes', 'sure', 'ok', 'buy', 'order', 'want', 'get'])) {
                    state.phase = 'quantity';
                    return {
                        message: "Great choice! How many bags would you like? Remember — 2+ bags get 5% off, and 4+ bags get 10% off!",
                        chips: ["1 bag (₹799)", "2 bags (₹1,518)", "4 bags (₹2,876)"],
                        card: null,
                    };
                }
                if (match(lower, ['more', 'tell'])) {
                    const rec = buildRecommendation(state.taste);
                    return {
                        message: `${rec.name} is roasted using our salt-air technique which preserves natural oils and reduces bitterness. The ${rec.roast.toLowerCase()} roast brings out ${rec.notes.toLowerCase()} notes. Each 250g bag is freshly roasted and shipped — ₹799 with free delivery!`,
                        chips: ["Add to cart", "Show another blend"],
                        card: null,
                    };
                }
                if (match(lower, ['another', 'different', 'else', 'other'])) {
                    // Flip the flavour preference
                    state.taste.flavour = state.taste.flavour === 'rich' ? 'light' : 'rich';
                    const rec = buildRecommendation(state.taste);
                    return {
                        message: "How about this one instead?",
                        chips: ["Add to cart", "Tell me more", "Go back"],
                        card: {
                            type: 'product',
                            data: {
                                name: rec.name,
                                description: rec.desc,
                                tastingNotes: rec.notes,
                                price: 799,
                                bitterness: rec.bitterness,
                                flavour: rec.flavour,
                                roast: rec.roast,
                                grind: 'whole_bean',
                                reason: rec.reason,
                            },
                        },
                    };
                }
                return {
                    message: "What would you like to do? I can add this to your cart, tell you more about it, or show you a different blend.",
                    chips: ["Add to cart", "Tell me more", "Show another"],
                    card: null,
                };
            }

            case 'quantity': {
                const numMatch = lower.match(/(\d+)/);
                state.taste.qty = numMatch ? Math.min(10, Math.max(1, parseInt(numMatch[1]))) : 1;
                if (match(lower, ['1 bag', 'one'])) state.taste.qty = 1;
                if (match(lower, ['2 bag', 'two'])) state.taste.qty = 2;
                if (match(lower, ['4 bag', 'four'])) state.taste.qty = 4;

                state.phase = 'grind';
                return {
                    message: `${state.taste.qty} bag${state.taste.qty > 1 ? 's' : ''} — nice! What grind would you prefer?`,
                    chips: GRIND_OPTIONS.slice(0, 3),
                    card: null,
                };
            }

            case 'grind': {
                const grindMatch = GRIND_OPTIONS.find(g => lower.includes(g.toLowerCase()));
                state.taste.grind = grindMatch || 'Whole Bean';
                state.phase = 'summary';

                const qty = state.taste.qty || 1;
                const unitPrice = 799;
                const discountPct = qty >= 4 ? 10 : qty >= 2 ? 5 : 0;
                const subtotal = unitPrice * qty;
                const discount = Math.round(subtotal * discountPct / 100);
                const total = subtotal - discount;
                const rec = buildRecommendation(state.taste);

                return {
                    message: "Here's your order summary:",
                    chips: ["Proceed to checkout", "Change quantity", "Start over"],
                    card: {
                        type: 'summary',
                        data: {
                            items: [{ name: rec.name, qty, price: unitPrice }],
                            discount,
                            total,
                            grind: state.taste.grind,
                        },
                    },
                };
            }

            case 'summary': {
                if (match(lower, ['checkout', 'proceed', 'pay', ...YES])) {
                    state.phase = 'done';
                    return {
                        message: "Awesome! Head to the Shop page to customise and add your blend to cart, then proceed to checkout. I'll be here if you need anything!",
                        chips: ["Go to Shop", "Start over"],
                        card: null,
                    };
                }
                if (match(lower, ['change', 'quantity', 'different'])) {
                    state.phase = 'quantity';
                    return {
                        message: "No problem! How many bags would you like?",
                        chips: ["1 bag", "2 bags", "4 bags"],
                        card: null,
                    };
                }
                if (match(lower, ['start over', 'reset', 'new'])) {
                    state.phase = 'taste_time';
                    state.taste = {};
                    return {
                        message: "Let's start fresh! Do you usually need coffee to kick-start your morning or wind down in the evening?",
                        chips: ["Morning energy", "Evening chill"],
                        card: null,
                    };
                }
                return {
                    message: "Would you like to proceed to checkout, change something, or start fresh?",
                    chips: ["Proceed to checkout", "Change quantity", "Start over"],
                    card: null,
                };
            }

            case 'done': {
                if (match(lower, ['shop', 'go to'])) {
                    return {
                        message: "Head over to the Shop page — you can customise your blend there and add it to cart!",
                        chips: ["Go to Shop", "Ask something else"],
                        card: null,
                    };
                }
                if (match(lower, ['start over', 'again', 'new', 'another'])) {
                    state.phase = 'taste_time';
                    state.taste = {};
                    return {
                        message: "Let's find you another perfect blend! Morning energy or evening relaxation?",
                        chips: ["Morning energy", "Evening chill"],
                        card: null,
                    };
                }
                return {
                    message: "Is there anything else I can help you with? Feel free to ask about our coffee, process, or anything else!",
                    chips: ["Tell me about the brand", "I want to order", "That's all, thanks!"],
                    card: null,
                };
            }

            default: {
                return {
                    message: "I'm not sure about that — feel free to reach us at contact@shadowbeanco.com for help! Or I can help you find the perfect coffee blend.",
                    chips: ["Find my blend", "Tell me about the brand", "Contact support"],
                    card: null,
                };
            }
        }
    }

    return { getGreeting, respond };
}
