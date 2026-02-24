interface Props {
    chips: string[];
    onSelect: (chip: string) => void;
}

export default function QuickChips({ chips, onSelect }: Props) {
    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-1">
            {chips.map((chip) => (
                <button
                    key={chip}
                    onClick={() => onSelect(chip)}
                    className="px-3.5 py-2 text-xs font-medium rounded-full cursor-pointer transition-colors bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                    {chip}
                </button>
            ))}
        </div>
    );
}
