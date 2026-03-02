export default function TypingIndicator() {
    return (
        <div className="flex items-end gap-2 mx-1">
            {/* Bot Avatar */}
            <div
                className="shrink-0 flex items-center justify-center"
                style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="4" />
                    <circle cx="9" cy="16" r="1" fill="white" />
                    <circle cx="15" cy="16" r="1" fill="white" />
                </svg>
            </div>

            <div
                className="flex items-center gap-1.5 px-4 py-3"
                style={{
                    borderRadius: '18px 18px 18px 4px',
                    background: '#ffffff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
            >
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{
                            background: '#94a3b8',
                            animation: `dotBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
