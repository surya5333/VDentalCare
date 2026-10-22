# V Dental Care - Expenses Module Backend Report

**Status:** PASS ✅

## 1. Existing Models and Services Reused
- **`PatientLedger`**: Used as the definitive source of truth for all `GENERAL` and `ORTHO` income (filtering strictly by `paidAmount > 0` and ensuring no discounts or outstanding balances are double counted).
- **`LabRecord`**: Maintained as the source of truth for lab cost tracking (`labCostSnapshot`).
- **`Lab`**: Lab definitions intact.

## 2. Schema Changes
- Added **`MonthlyFinancialSummary`**: Automatically caches the Monthly Value based strictly on `PatientLedger` records to rapidly serve dashboards while remaining synchronized.
- Added **`ExpenseBudgetSetting`**: Uses integer basis points (e.g. `12.5%` = `1250`) to configure global Manager category budgets, ensuring no floating-point math issues.
- Added **`ExpenseCategory`** enum (`MARKETING`, `SALARIES`, `OFFICE_EXPENSES`).
- Added **`ExpenseEntry`**: Single unified table tracking custom expenses matching the exact categories. Handles negative remaining budgets gracefully.
- Added **`LabExpensePayment`**: Unique 1:1 linked payment tracker bound to `LabRecord` (`labRecordId`), avoiding duplicate lab tracking rows while tracking specific `cashPaid` and `bankPaid` adjustments directly against the true LabCost snapshot.

## 3. New API Endpoints
All protected securely under the `MANAGER` role logic:
- `GET /api/manager-reports/expenses/summary?month=YYYY-MM`: Core calculation endpoint delivering budgets, cash, bank, remaining limits, and lab breakdowns.
- `GET /api/manager-reports/expenses/settings`: Fetches allocations.
- `PUT /api/manager-reports/expenses/settings`: Configures basis point allocations.
- `POST /api/manager-reports/expenses/entries`: Creates new manual Marketing/Salaries/Office expenses.
- `PUT / DELETE /api/manager-reports/expenses/entries/[id]`: Manages specific entries.
- `PUT /api/manager-reports/expenses/lab-payments/[labRecordId]`: Manually updates editable cash/bank entries directly without creating redundant ledger rows.

## 4. New Services and Logic
- **`apiMonthlyFinancialRepository`**: Extracts collection values natively from `PatientLedger`.
- **`expensesService`**: Computes live bounds and merges lab logic with configured global bounds. Calculates Remaining Lab Cost dynamically based on live payments.

## 5. Synchronization
Summaries sync via a recalculation step embedded securely within the `getExpenseSummary` service query. When the API endpoint is hit, it re-queries `PatientLedger` bounding precisely the selected calendar month, updating the cached value, ensuring it never goes stale.

## 6. Lab Costs Representation
Rather than overwriting `LabCostSnapshot` or forcing an automated Settlement logic to duplicate expenses, the new `LabExpensePayment` acts as an editable sidecar to `LabRecord`. The interface aggregates these payments exactly per record (avoiding double counting cash/bank payments). 

## 7. Next Steps / Blockers
- **None**. The backend is completely ready for the React frontend implementation. The database has been cleanly migrated (`npx prisma db push` and `npx prisma generate` executed successfully).
