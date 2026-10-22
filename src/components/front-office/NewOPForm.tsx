"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { opService } from "@/services/opService";

export function NewOPForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [defaultFee, setDefaultFee] = useState(200);
  const [formData, setFormData] = useState({
    opNumber: "",
    patientName: "",
    age: "",
    sex: "Male" as "Male" | "Female" | "Others",
    phone: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    paidStatus: "Paid" as "Paid" | "Free",
    paymentMode: "Cash",
  });

  const [references, setReferences] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch('/api/references')
      .then(res => res.json())
      .then(data => {
        setReferences(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, reference: data[0].name }));
        }
      })
      .catch(err => console.error("Failed to load references", err));

    fetch('/api/settings/registration-fee')
      .then(res => res.json())
      .then(data => {
        if (typeof data.fee === 'number') {
          setDefaultFee(data.fee);
        }
      })
      .catch(err => console.error("Failed to load registration fee setting", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const isPaid = formData.paidStatus === "Paid";
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
        registrationFee: isPaid ? defaultFee : 0,
        paymentMode: isPaid ? formData.paymentMode : undefined,
      };

      if (!payload.patientName || isNaN(payload.age) || !payload.phone || !formData.opNumber) {
        throw new Error("Please fill in all required fields.");
      }

      if (isPaid && !payload.paymentMode) {
        throw new Error("Please select a Payment Mode for Paid OP registration.");
      }

      await opService.createOP(payload);
      router.push("/front-office/op-list");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create OP.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6">
      <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-6">Patient Information</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
              Section Number
            </label>
            <input
              type="text"
              value="Auto-generated"
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              OP Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="opNumber"
              value={formData.opNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
              placeholder="Enter OP Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
              placeholder="Full Name"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="1"
              max="120"
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Sex <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4 py-1">
              {["Male", "Female", "Others"].map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value={option}
                    checked={formData.sex === option}
                    onChange={handleChange}
                    className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300"
                  />
                  <span className="text-sm text-[var(--color-foreground)]">{option}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Phone / WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
              placeholder="Mobile Number"
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Reference <span className="text-red-500">*</span>
            </label>
            <select
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all bg-white"
            >
              {references.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Paid / Free <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4 py-1">
              {["Paid", "Free"].map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paidStatus"
                    value={option}
                    checked={formData.paidStatus === option}
                    onChange={handleChange}
                    className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300"
                  />
                  <span className="text-sm text-[var(--color-foreground)]">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Registration Fee & Payment Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-[var(--color-border)]">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              OP Registration Fee
            </label>
            <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-semibold">
              ₹{formData.paidStatus === "Paid" ? defaultFee : 0}
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {formData.paidStatus === "Paid" ? "Standard clinic registration fee" : "No fee charged for Free OP"}
            </p>
          </div>

          {formData.paidStatus === "Paid" ? (
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Payment Mode
              </label>
              <input
                type="text"
                disabled
                value="Not Applicable (Free OP)"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
              />
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[#0b8ec7] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create OP"}
          </button>
        </div>
      </form>
    </div>
  );
}
