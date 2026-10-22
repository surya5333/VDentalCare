import { NewOPForm } from "@/components/front-office/NewOPForm";

export default function NewOPPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">New OP</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Register a new patient with an OP number.
        </p>
      </div>
      <NewOPForm />
    </div>
  );
}
