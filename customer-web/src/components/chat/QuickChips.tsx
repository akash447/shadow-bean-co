interface Props {
    chips: string[];
    onSelect: (chip: string) => void;
}

export default function QuickChips({ chips, onSelect }: Props) {
    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-2 max-w-[82%]">
            {chips.map((chip) => (
                <button
                    key={chip}
                    onClick={() => onSelect(chip)}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all duration-200 hover:scale-105"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        background: 'rgba(232,169,74,0.15)',
                        color: '#E8A94A',
                        border: '1px solid rgba(232,169,74,0.3)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(232,169,74,0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(232,169,74,0.15)';
                    }}
                >
                    {chip}
                </button>
            ))}
        </div>
    );
}
