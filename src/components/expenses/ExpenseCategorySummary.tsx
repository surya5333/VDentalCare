"use client";

interface ExpenseCategoryData {
  budget: number;
  spentCash: number;
  spentBank: number;
  totalSpent: number;
  remainingBudget: number;
  totalLabCost?: number;
  remainingLabCost?: number;
}

interface ExpenseSummaryProps {
  data: {
    settings: {
      marketing: number;
      lab: number;
      salaries: number;
      office_expenses: number;
    };
    categories: {
      marketing: ExpenseCategoryData;
      lab: ExpenseCategoryData;
      salaries: ExpenseCategoryData;
      officeExpenses: ExpenseCategoryData;
    };
  };
}

export function ExpenseCategorySummary({ data }: ExpenseSummaryProps) {
  const formatPct = (bp: number) => (bp / 100).toFixed(1) + "%";

  const cards = [
    {
      title: "Marketing",
      color: "blue",
      setting: data.settings.marketing,
      catData: data.categories.marketing
    },
    {
      title: "Lab",
      color: "indigo",
      setting: data.settings.lab,
      catData: data.categories.lab
    },
    {
      title: "Salaries",
      color: "emerald",
      setting: data.settings.salaries,
      catData: data.categories.salaries
    },
    {
      title: "Office Expenses",
      color: "amber",
      setting: data.settings.office_expenses,
      catData: data.categories.officeExpenses
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const isLab = card.title === "Lab";
        return (
          <div key={card.title} className={`bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden`}>
            <div className={`px-4 py-3 bg-gray-50 border-b border-[var(--color-border)] flex justify-between items-center`}>
              <h3 className="font-bold text-gray-900">{card.title}</h3>
              <span className="text-xs font-semibold px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-600">
                {formatPct(card.setting)}
              </span>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">Budget</p>
                  <p className="text-xl font-bold text-gray-900">₹{card.catData.budget.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">Total Spent</p>
                  <p className="text-lg font-semibold text-gray-900">₹{card.catData.totalSpent.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex justify-between items-center text-sm">
                <div className="flex gap-4">
                  <div>
                    <span className="text-[var(--color-muted)] block text-xs">Cash</span>
                    <span className="font-medium">₹{card.catData.spentCash.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted)] block text-xs">Bank</span>
                    <span className="font-medium">₹{card.catData.spentBank.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg flex justify-between items-center ${card.catData.remainingBudget < 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                <span className={`text-xs font-bold uppercase ${card.catData.remainingBudget < 0 ? 'text-red-700' : 'text-green-700'}`}>
                  Remaining Budget
                </span>
                <span className={`text-base font-bold ${card.catData.remainingBudget < 0 ? 'text-red-700' : 'text-green-700'}`}>
                  ₹{card.catData.remainingBudget.toLocaleString('en-IN')}
                </span>
              </div>
              
              {isLab && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center mt-2">
                  <span className="text-xs font-bold uppercase text-indigo-700">Remaining Lab Cost</span>
                  <span className="text-base font-bold text-indigo-700">₹{(card.catData.remainingLabCost ?? 0).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
