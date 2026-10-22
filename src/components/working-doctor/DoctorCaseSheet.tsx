import { useState, useEffect } from "react";
import { CompleteOPRecord, VisitCaseSheet, OPImage } from "@/types/op";
import { Doctor } from "@/types/doctor";
import { doctorService } from "@/services/doctorService";
import { VisitHistory } from "./VisitHistory";
import { AppointmentSection } from "./AppointmentSection";
import { ImageGallerySection } from "../op-details/ImageGallerySection";
import { Save } from "lucide-react";

interface DoctorCaseSheetProps {
  opRecord: CompleteOPRecord;
  isEditable: boolean;
  onVisitSaved: () => void;
}

export function DoctorCaseSheet({ opRecord, isEditable, onVisitSaved }: DoctorCaseSheetProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // We show visits in reverse chronological order in history, but keep original array for logic
  const visits = [...opRecord.caseSheets].reverse();
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  // Form State
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignedDoctor, setAssignedDoctor] = useState("");
  const [treatmentDone, setTreatmentDone] = useState("");
  
  // Appt state
  const [nextApptDate, setNextApptDate] = useState("");
  const [nextApptTime, setNextApptTime] = useState("");
  
  // Clinical state
  const [images, setImages] = useState<OPImage[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    doctorService.getDoctors().then(setDoctors);
  }, []);

  useEffect(() => {
    if (selectedVisitId) {
      const visit = opRecord.caseSheets.find(v => v.visitId === selectedVisitId);
      if (visit) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisitDate(visit.date || "");
        setAssignedDoctor(visit.doctorId || "");
        setTreatmentDone(visit.treatmentDone || "");
        setImages(visit.images || []);
        // Load appt if nextAppointmentId exists (mock implementation, skipping fetching full appt for now)
        setNextApptDate("");
        setNextApptTime("");
      }
    } else {
      // New visit
      setVisitDate(new Date().toISOString().split("T")[0]);
      setAssignedDoctor("");
      setTreatmentDone("");
      setImages([]);
      setNextApptDate("");
      setNextApptTime("");
    }
  }, [selectedVisitId, opRecord]);

  const handleSave = async () => {
    if (!assignedDoctor || !visitDate) {
      alert("Assigned Doctor and Visit Date are required.");
      return;
    }
    
    // Check appointment conflict if both provided
    if (nextApptDate && nextApptTime) {
      const isAvailable = await doctorService.checkAvailability(assignedDoctor, nextApptDate, nextApptTime);
      if (!isAvailable) {
        alert("Cannot save: Doctor is not available at the requested appointment time.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const visitIdToSave = selectedVisitId || `visit-${Date.now()}`;
      
      let nextAppointmentId = null;
      if (nextApptDate && nextApptTime) {
        const appt = await doctorService.createAppointment({
          id: `app-${Date.now()}`,
          opNumber: opRecord.patient.opNumber,
          doctorId: assignedDoctor,
          date: nextApptDate,
          time: nextApptTime,
          status: "Scheduled"
        });
        nextAppointmentId = appt.id;
      }

      const visitData: Partial<VisitCaseSheet> = {
        date: visitDate,
        doctorId: assignedDoctor,
        treatmentDone,
        images,
        ...(nextAppointmentId && { nextAppointmentId })
      };

      await doctorService.saveVisitToOP(opRecord.patient.opNumber, visitIdToSave, visitData);
      
      alert("Case sheet saved successfully.");
      onVisitSaved();
      if (!selectedVisitId) {
        setSelectedVisitId(visitIdToSave); // switch to the new visit
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save case sheet.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-8 pt-8 border-t border-[var(--color-border)]">
      <VisitHistory visits={visits} selectedVisitId={selectedVisitId} onSelectVisit={setSelectedVisitId} />
      
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1e40af]">Doctor Case Sheet</h2>
          {isEditable && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save / Submit"}
            </button>
          )}
        </div>

        {/* VISIT INFORMATION */}
        <section className="bg-[#F0F4F8] p-4 rounded-lg border border-[var(--color-border)]">
          <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-4">VISIT INFORMATION</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--color-muted)]">Assigned Doctor <span className="text-red-500">*</span></label>
              <select
                value={assignedDoctor}
                onChange={e => setAssignedDoctor(e.target.value)}
                disabled={!isEditable}
                className="border border-[var(--color-border)] rounded px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] bg-white"
              >
                <option value="">Select Doctor...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--color-muted)]">Visit Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                disabled={!isEditable}
                className="border border-[var(--color-border)] rounded px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] bg-white"
              />
            </div>
          </div>
        </section>

        {/* TREATMENT */}
        <section>
          <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-3">TREATMENT DONE</h3>
          <textarea
            value={treatmentDone}
            onChange={e => setTreatmentDone(e.target.value)}
            disabled={!isEditable}
            rows={4}
            placeholder="Describe the treatment performed during this visit..."
            className="w-full border border-[var(--color-border)] rounded-lg p-3 text-sm outline-none focus:border-[var(--color-primary)] resize-y"
          />
        </section>

        {/* APPOINTMENT */}
        <section className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
          <AppointmentSection
            doctorId={assignedDoctor}
            date={nextApptDate}
            time={nextApptTime}
            onChangeDate={setNextApptDate}
            onChangeTime={setNextApptTime}
            isEditable={isEditable}
          />
        </section>


        {/* CASE SHEET IMAGES */}
        <section>
          <ImageGallerySection
            title="Case Sheet Images (This Visit)"
            images={images.map(img => ({ name: img.filename, date: img.uploadedAt, thumbnailUrl: img.url }))}
            isEditable={isEditable}
          />
        </section>

      </div>
    </div>
  );
}
