import { SettingsView } from "@/components/settings/SettingsView";

export default function ManagerSettingsPage() {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <SettingsView isManager={true} />
    </div>
  );
}
