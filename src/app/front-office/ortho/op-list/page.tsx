import { OPList } from "@/components/op/OPList";

export default function OrthoOPListPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <OPList baseRoute="/front-office/ortho/op-list" workflowType="ORTHO" />
    </div>
  );
}
