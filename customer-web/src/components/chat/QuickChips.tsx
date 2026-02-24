interface Props {
    chips: string[];
    onSelect: (chip: string) => void;
}

export default function QuickChips({ chips, onSelect }: Props) {
    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
            {chips.map((chip) => (
                <button
                    key={chip}
                    onClick={() => onSelect(chip)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-colors bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                    {chip}
                </button>
            ))}
        </div>
    );
}
