"use client";

import { useState } from "react";
import { DoctorSettings } from "./DoctorSettings";
import { TreatmentSettings } from "./TreatmentSettings";
import { ReferenceSettings } from "./ReferenceSettings";
import { LabSettings } from "./LabSettings";
import { CrownTypeSettings } from "./CrownTypeSettings";
import { ExpenseBudgetSettings } from "./ExpenseBudgetSettings";
import { RegistrationFeeSettings } from "./RegistrationFeeSettings";

type Tab = "Doctors" | "Treatments" | "References" | "Labs" | "Crown Types" | "Registration Fee" | "Expense Budgets";

export function SettingsView({ isManager = false }: { isManager?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("Doctors");

  const tabs: Tab[] = ["Doctors", "Treatments", "References", "Labs", "Crown Types", "Registration Fee"];
  if (isManager) {
    tabs.push("Expense Budgets");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6 min-h-[500px]">
      <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-6">Master Data Settings</h2>

      <div className="flex border-b border-gray-200 mb-6 space-x-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "Doctors" && <DoctorSettings />}
        {activeTab === "Treatments" && <TreatmentSettings />}
        {activeTab === "References" && <ReferenceSettings />}
        {activeTab === "Labs" && <LabSettings />}
        {activeTab === "Crown Types" && <CrownTypeSettings />}
        {activeTab === "Registration Fee" && <RegistrationFeeSettings />}
        {activeTab === "Expense Budgets" && isManager && <ExpenseBudgetSettings />}
      </div>
    </div>
  );
}
