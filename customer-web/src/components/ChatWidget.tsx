import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

interface Message {
  text: string
  sender: 'bot' | 'user'
}

const KEYWORD_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['hi', 'hello', 'hey'],
    response: 'Hey there! Welcome to Shadow Bean Co. How can I help you today?',
  },
  {
    keywords: ['product', 'coffee', 'blend', 'bean'],
    response:
      "We make custom coffee blends! Head to our Shop page, pick your bitterness & flavour levels, choose a roast and grind — and we'll craft it for you. Each 250g bag is ₹799.",
  },
  {
    keywords: ['price', 'cost', 'how much'],
    response: 'Each custom 250g bag is ₹799 with free shipping across India!',
  },
  {
    keywords: ['cart', 'add'],
    response:
      "To add a blend to your cart, head to the Shop page, customize your taste, and tap 'Add to Cart'.",
  },
  {
    keywords: ['checkout', 'pay', 'payment'],
    response:
      "We accept UPI and Cash on Delivery. At checkout, pick your method — if UPI, just scan the QR code and we'll auto-detect your payment!",
  },
  {
    keywords: ['upi', 'qr', 'scan'],
    response:
      "Select UPI at checkout and you'll see a QR code with the exact amount. Scan it with any UPI app (GPay, PhonePe, Paytm) and we'll detect your payment automatically.",
  },
  {
    keywords: ['cod', 'cash'],
    response:
      'Yes! We offer Cash on Delivery. Just select COD at checkout and pay when your order arrives.',
  },
  {
    keywords: ['order', 'status', 'track', 'where'],
    response:
      'For order updates, check your Profile page. If you need help, share your order ID or UPI ref at contact@shadowbeanco.com and we\'ll look into it.',
  },
  {
    keywords: ['shipping', 'delivery', 'time'],
    response:
      'We offer free shipping across India! Orders typically arrive in 5-7 business days.',
  },
  {
    keywords: ['return', 'refund', 'cancel'],
    response:
      "For returns, refunds, or cancellations, drop us a line at contact@shadowbeanco.com and we'll sort it out.",
  },
  {
    keywords: ['offer', 'coupon', 'discount'],
    response:
      'Got a coupon code? Apply it on the Cart page before checkout to get your discount!',
  },
  {
    keywords: ['contact', 'support', 'help', 'email'],
    response:
      'You can reach us at contact@shadowbeanco.com — we usually reply within a few hours!',
  },
  {
    keywords: ['thank', 'thanks'],
    response: "You're welcome! Happy brewing!",
  },
]

const FALLBACK_RESPONSE =
  "I'm not sure about that — feel free to reach us at contact@shadowbeanco.com for help!"

function getGreeting(pathname: string): string {
  if (pathname === '/shop')
    return "Welcome to our Shop! Need help picking the perfect blend? I'm here to help."
  if (pathname === '/cart')
    return 'Looking at your cart? Let me know if you have questions about checkout or payment.'
  if (pathname === '/checkout')
    return 'Almost there! Need help with payment or have questions about delivery?'
  if (pathname === '/profile')
    return 'Hi! Need help with your orders or account? Just ask.'
  return "Hi! I'm the Shadow Bean Co assistant. Ask me about our coffee, orders, or anything else!"
}

function matchResponse(input: string): string {
  const lower = input.toLowerCase()
  for (const entry of KEYWORD_RESPONSES) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        return entry.response
      }
    }
  }
  return FALLBACK_RESPONSE
}

const COLORS = {
  olive: '#4f5130',
  dark: '#1c0d02',
  bg: '#FAF8F5',
  white: '#ffffff',
  lightGray: '#e8e5e0',
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [hasGreeted, setHasGreeted] = useState(false)
  const [showPulse, setShowPulse] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setShowPulse(false)
    if (!hasGreeted) {
      setMessages([{ text: getGreeting(location.pathname), sender: 'bot' }])
      setHasGreeted(true)
    }
  }, [hasGreeted, location.pathname])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    const userMsg: Message = { text: trimmed, sender: 'user' }
    const botMsg: Message = { text: matchResponse(trimmed), sender: 'bot' }
    setMessages((prev) => [...prev, userMsg, botMsg])
    setInput('')
  }, [input])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSend()
    },
    [handleSend]
  )

  return (
    <>
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes chat-pulse {
          0% { box-shadow: 0 0 0 0 rgba(79, 81, 48, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(79, 81, 48, 0); }
          100% { box-shadow: 0 0 0 0 rgba(79, 81, 48, 0); }
        }
        @keyframes chat-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Chat window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            width: 360,
            maxWidth: 'calc(100vw - 40px)',
            height: 480,
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: COLORS.bg,
            borderRadius: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 10000,
            animation: 'chat-slide-up 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: COLORS.olive,
              color: COLORS.white,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              Shadow Bean Co
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.white,
                fontSize: 22,
                cursor: 'pointer',
                lineHeight: 1,
                padding: '0 2px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf:
                    msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontSize: 14,
                  lineHeight: 1.5,
                  backgroundColor:
                    msg.sender === 'user' ? COLORS.olive : COLORS.lightGray,
                  color: msg.sender === 'user' ? COLORS.white : COLORS.dark,
                  borderBottomRightRadius: msg.sender === 'user' ? 4 : 14,
                  borderBottomLeftRadius: msg.sender === 'bot' ? 4 : 14,
                  wordBreak: 'break-word',
                }}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: `1px solid ${COLORS.lightGray}`,
              display: 'flex',
              gap: 8,
              flexShrink: 0,
              backgroundColor: COLORS.white,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              style={{
                flex: 1,
                border: `1px solid ${COLORS.lightGray}`,
                borderRadius: 20,
                padding: '9px 14px',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              aria-label="Send message"
              style={{
                backgroundColor: COLORS.olive,
                color: COLORS.white,
                border: 'none',
                borderRadius: '50%',
                width: 38,
                height: 38,
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: COLORS.olive,
          color: COLORS.white,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontSize: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          transition: 'transform 0.2s ease',
          animation: showPulse ? 'chat-pulse 2s infinite' : 'none',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  )
}
