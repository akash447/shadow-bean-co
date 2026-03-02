interface Props {
    chips: string[];
    onSelect: (chip: string) => void;
}

export default function QuickChips({ chips, onSelect }: Props) {
    if (!chips.length) return null;

    return (
        <div className="flex flex-col gap-2 mt-1 items-end" style={{ paddingRight: 8 }}>
            {chips.map((chip) => (
                <button
                    key={chip}
                    onClick={() => onSelect(chip)}
                    className="cursor-pointer transition-all"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '14px',
                        lineHeight: '1.45',
                        padding: '10px 16px',
                        borderRadius: '20px 20px 4px 20px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        color: '#3b82f6',
                        border: '1.5px solid rgba(59, 130, 246, 0.3)',
                        maxWidth: '80%',
                        textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                        e.currentTarget.style.color = '#3b82f6';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {chip}
                </button>
            ))}
        </div>
    );
}
