import { TeethNotation } from "@/types/op";

interface TeethNotationProps {
  value: TeethNotation;
  onChange: (value: TeethNotation) => void;
  isEditable: boolean;
}

export function TeethNotationComponent({ value, onChange, isEditable }: TeethNotationProps) {
  const toggleTooth = (quadrant: keyof TeethNotation, toothId: number, singleDigit: number) => {
    if (!isEditable) return;
    const currentList = value[quadrant] || [];
    const isSelected = currentList.includes(toothId) || currentList.includes(singleDigit);
    const newList = isSelected
      ? currentList.filter(n => n !== toothId && n !== singleDigit)
      : [...currentList, toothId].sort((a, b) => a - b);
    
    onChange({ ...value, [quadrant]: newList });
  };

  const hasSelectedTeeth = (["q1", "q2", "q3", "q4"] as const).some(
    q => (value[q]?.length || 0) > 0
  );

  const clearAll = () => {
    if (!isEditable) return;
    onChange({ q1: [], q2: [], q3: [], q4: [] });
  };

  const renderQuadrant = (quadrant: keyof TeethNotation, startPrefix: number, reverse: boolean) => {
    // Generate tooth numbers 1-8 for the quadrant
    let teeth = Array.from({ length: 8 }, (_, i) => i + 1);
    if (reverse) {
      teeth = teeth.reverse();
    }

    return (
      <div className="flex gap-1">
        {teeth.map(t => {
          const toothId = parseInt(`${startPrefix}${t}`);
          const isSelected = (value[quadrant] || []).includes(toothId) || (value[quadrant] || []).includes(t);
          return (
            <button
              key={toothId}
              type="button"
              onClick={() => toggleTooth(quadrant, toothId, t)}
              disabled={!isEditable}
              aria-label={`Quadrant ${startPrefix} tooth ${t}`}
              className={`w-6 h-8 text-xs font-medium rounded transition-colors flex items-center justify-center
                ${isSelected 
                  ? "bg-[#1e40af] text-white" 
                  : "bg-gray-100 text-[var(--color-muted)] hover:bg-gray-200"}
                ${!isEditable && !isSelected ? "opacity-50 cursor-not-allowed" : ""}
                ${!isEditable && isSelected ? "opacity-100 cursor-default" : ""}
              `}
            >
              {t}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1 items-center mt-2">
      {/* Top Half (Maxillary) */}
      <div className="flex gap-2">
        <div className="border-r border-b border-[var(--color-border)] p-2">
          <div className="text-[10px] text-[var(--color-muted)] mb-1 text-right font-medium">Q1</div>
          {renderQuadrant("q1", 1, true)}
        </div>
        <div className="border-b border-[var(--color-border)] p-2">
          <div className="text-[10px] text-[var(--color-muted)] mb-1 font-medium">Q2</div>
          {renderQuadrant("q2", 2, false)}
        </div>
      </div>
      {/* Bottom Half (Mandibular) */}
      <div className="flex gap-2">
        <div className="border-r border-[var(--color-border)] p-2">
          <div className="text-[10px] text-[var(--color-muted)] mb-1 text-right font-medium">Q3</div>
          {renderQuadrant("q3", 3, true)}
        </div>
        <div className="p-2">
          <div className="text-[10px] text-[var(--color-muted)] mb-1 font-medium">Q4</div>
          {renderQuadrant("q4", 4, false)}
        </div>
      </div>

      {/* Clear selection control */}
      {isEditable && hasSelectedTeeth && (
        <div className="w-full flex justify-end mt-1 px-2">
          <button
            type="button"
            onClick={clearAll}
            className="text-[10px] text-red-600 hover:text-red-700 underline font-medium cursor-pointer"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}
