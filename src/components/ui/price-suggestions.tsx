import { Button } from "@/components/ui/button";

interface PriceSuggestionsProps {
  value: string;
  onSelect: (value: string) => void;
}

export function PriceSuggestions({ value, onSelect }: PriceSuggestionsProps) {
  if (!value || isNaN(parseFloat(value))) return null;

  const number = parseFloat(value);
  const suggestions = [
    { label: `${number.toLocaleString('vi-VN')}.000`, value: number.toString() },
    { label: `${(number * 10).toLocaleString('vi-VN')}.000`, value: (number * 10).toString() },
    { label: `${(number * 100).toLocaleString('vi-VN')}.000`, value: (number * 100).toString() }
  ];

  return (
    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 mt-1 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Gợi ý mệnh giá:</p>
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onSelect(suggestion.value)}
            >
              {suggestion.label} VNĐ
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
} 