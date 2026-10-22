import { useState, useEffect } from "react";
import { doctorService } from "@/services/doctorService";

interface AppointmentSectionProps {
  doctorId: string;
  date: string;
  time: string;
  onChangeDate: (date: string) => void;
  onChangeTime: (time: string) => void;
  isEditable: boolean;
}

export function AppointmentSection({ doctorId, date, time, onChangeDate, onChangeTime, isEditable }: AppointmentSectionProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (doctorId && date && time) {
      doctorService.checkAvailability(doctorId, date, time).then(res => setIsAvailable(res));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAvailable(null);
    }
  }, [doctorId, date, time]);

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-3">
        Next Appointment
      </h3>
      <div className="flex gap-4 items-start">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-muted)]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            disabled={!isEditable}
            className="border border-[var(--color-border)] rounded px-2 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-muted)]">Time</label>
          <select
            value={time}
            onChange={(e) => onChangeTime(e.target.value)}
            disabled={!isEditable}
            className="border border-[var(--color-border)] rounded px-2 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Select Time...</option>
            <option value="09:00 AM">09:00 AM</option>
            <option value="09:30 AM">09:30 AM</option>
            <option value="10:00 AM">10:00 AM</option>
            <option value="10:30 AM">10:30 AM</option>
            <option value="11:00 AM">11:00 AM</option>
            <option value="11:30 AM">11:30 AM</option>
            <option value="12:00 PM">12:00 PM</option>
            <option value="02:00 PM">02:00 PM</option>
            <option value="02:30 PM">02:30 PM</option>
            <option value="03:00 PM">03:00 PM</option>
            <option value="03:30 PM">03:30 PM</option>
            <option value="04:00 PM">04:00 PM</option>
          </select>
        </div>
      </div>
      {isAvailable === false && (
        <span className="text-red-500 text-xs font-medium mt-2">
          Doctor is not available at this date and time.
        </span>
      )}
      {isAvailable === true && (
        <span className="text-green-600 text-xs font-medium mt-2">
          Time slot is available.
        </span>
      )}
    </div>
  );
}
