# Working Doctor API (Provisional)

**Note:** This API is provisional and represents the future backend integration for Phase 3. Currently, the frontend uses mock services.

## Overview
The Working Doctor workflow relies heavily on managing Case Sheets (which are tied to specific visits) and subsequent Appointments. It does not create foundational OPs but reads them.

---

## 1. Doctors

### GET `/api/doctors`
Returns a list of doctors available in the clinic.

**Response**
```json
[
  {
    "id": "doc-1",
    "name": "Dr. Smith",
    "specialty": "General Dentist"
  }
]
```

### GET `/api/doctors/:doctorId/availability`
Checks the availability for a specific doctor on a given date.

**Query Parameters**
- `date` (string, YYYY-MM-DD): The date to check.

**Response**
```json
{
  "doctorId": "doc-1",
  "date": "2026-09-10",
  "bookedTimes": ["10:00 AM", "11:00 AM"]
}
```

---

## 2. OP & Case Sheets

### GET `/api/op/:opNumber`
Fetches the foundational OP record, including patient details, global treatment/lab info, and an array of `caseSheets` representing the clinical visits.

**Response**
```json
{
  "patient": { ... },
  "treatmentLab": { ... },
  "caseSheets": [
    {
      "visitId": "visit-123",
      "date": "2026-09-01",
      "doctorId": "doc-1",
      "treatmentDone": "Scaling",
      "teethNotation": { "q1": "11", "q2": "", "q3": "", "q4": "" },
      "images": [...]
    }
  ]
}
```

### POST `/api/op/:opNumber/case-sheets`
Creates a new case-sheet visit record under the patient's OP.

**Body**
```json
{
  "date": "2026-09-10",
  "doctorId": "doc-1",
  "treatmentDone": "Root Canal",
  "teethNotation": { "q1": "", "q2": "21", "q3": "", "q4": "" },
  "egEhsGen": "GEN",
  "crownType": "PFM",
  "numberOfCrowns": 1,
  "lab": "Smile Lab",
  "images": [...]
}
```

### PATCH `/api/case-sheets/:caseSheetId`
Updates an existing case-sheet visit.

---

## 3. Appointments

### GET `/api/op/:opNumber/appointments`
Gets all appointments associated with a specific OP/patient.

### POST `/api/appointments`
Creates a new independent appointment entity.

**Body**
```json
{
  "opNumber": "OP1024",
  "doctorId": "doc-1",
  "date": "2026-09-15",
  "time": "10:00 AM",
  "status": "Scheduled"
}
```

### PATCH `/api/appointments/:appointmentId`
Updates appointment details or status.

---

## 4. Catalogues (Future)

### GET `/api/crown-types`
Returns available crown types.

### GET `/api/labs`
Returns available labs.

### GET `/api/labs/:labId/rates`
Returns rate information for a specific lab.
