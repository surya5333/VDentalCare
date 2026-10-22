import { VisitCaseSheet } from "@/types/op";

interface VisitHistoryProps {
  visits: VisitCaseSheet[];
  selectedVisitId: string | null;
  onSelectVisit: (id: string | null) => void;
}

export function VisitHistory({ visits, selectedVisitId, onSelectVisit }: VisitHistoryProps) {
  return (
    <div className="flex flex-col gap-2 w-full md:w-64 shrink-0 border-r border-[var(--color-border)] pr-4">
      <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-2">Visits</h3>
      <button
        onClick={() => onSelectVisit(null)}
        className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedVisitId === null
            ? "bg-[var(--color-primary)] text-white"
            : "bg-white border border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]"
        }`}
      >
        + New Visit
      </button>
      
      <div className="flex flex-col gap-2 mt-2">
        {visits.map((visit, idx) => {
          const isSelected = selectedVisitId === visit.visitId;
          return (
            <button
              key={visit.visitId}
              onClick={() => onSelectVisit(visit.visitId)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                isSelected
                  ? "bg-blue-50 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                  : "bg-white border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span>Visit {visits.length - idx}</span>
                <span className="text-xs font-normal opacity-70">{visit.date}</span>
              </div>
              {visit.treatmentDone && (
                <div className="text-xs opacity-80 truncate max-w-full">
                  {visit.treatmentDone}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
