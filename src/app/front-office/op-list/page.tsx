import { OPList } from "@/components/op/OPList";

export default function OPListPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <OPList baseRoute="/front-office/op-list" />
    </div>
  );
}
