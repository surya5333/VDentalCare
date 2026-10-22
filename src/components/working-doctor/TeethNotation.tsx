import { VisitTeethNotation } from "@/types/doctor";

interface TeethNotationProps {
  value?: VisitTeethNotation;
  onChange: (value: VisitTeethNotation) => void;
  isEditable: boolean;
}

const defaultNotation: VisitTeethNotation = {
  q1: "", q2: "", q3: "", q4: ""
};

export function TeethNotationComponent({ value = defaultNotation, onChange, isEditable }: TeethNotationProps) {
  const handleChange = (quadrant: keyof VisitTeethNotation, val: string) => {
    onChange({ ...value, [quadrant]: val });
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-3">
        Teeth Notation
      </h3>
      <div className="w-full max-w-sm border-2 border-[var(--color-border)] rounded overflow-hidden">
        <div className="grid grid-cols-2 grid-rows-2">
          {/* Q1 */}
          <div className="border-r-2 border-b-2 border-[var(--color-border)] p-2 bg-white">
            <span className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">Q1</span>
            <input
              type="text"
              value={value.q1}
              onChange={(e) => handleChange("q1", e.target.value)}
              disabled={!isEditable}
              className="w-full text-sm outline-none bg-transparent"
              placeholder="e.g. 11, 12"
            />
          </div>
          {/* Q2 */}
          <div className="border-b-2 border-[var(--color-border)] p-2 bg-white">
            <span className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">Q2</span>
            <input
              type="text"
              value={value.q2}
              onChange={(e) => handleChange("q2", e.target.value)}
              disabled={!isEditable}
              className="w-full text-sm outline-none bg-transparent"
              placeholder="e.g. 21, 22"
            />
          </div>
          {/* Q3 */}
          <div className="border-r-2 border-[var(--color-border)] p-2 bg-white">
            <span className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">Q3</span>
            <input
              type="text"
              value={value.q3}
              onChange={(e) => handleChange("q3", e.target.value)}
              disabled={!isEditable}
              className="w-full text-sm outline-none bg-transparent"
              placeholder="e.g. 31"
            />
          </div>
          {/* Q4 */}
          <div className="p-2 bg-white">
            <span className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">Q4</span>
            <input
              type="text"
              value={value.q4}
              onChange={(e) => handleChange("q4", e.target.value)}
              disabled={!isEditable}
              className="w-full text-sm outline-none bg-transparent"
              placeholder="e.g. 41"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
