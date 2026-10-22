# Front Office OP Provisional API Contract

This document outlines the provisional backend API endpoints required by the Front Office workspace.

**Status:** PROVISIONAL (Frontend Implementation Only)
**Purpose:** To guide future backend development. These endpoints are currently mocked via `opService.ts`.

---

## 1. Get All OPs

Retrieves a list of all patient OP records.

**Endpoint:** `GET /api/op`

**Response:**
```json
[
  {
    "patient": {
      "sectionNo": "1025",
      "opNumber": "OP1024",
      "patientName": "Arun Sharma",
      "age": 35,
      "sex": "Male",
      "phone": "9876543210",
      "date": "2026-09-06",
      "reference": "Walk-in",
      "paidStatus": "Paid"
    },
    "treatmentLab": {
      "egEhsGen": "GEN",
      "crownType": "PFM",
      "numberOfCrowns": 1,
      "lab": "Smile Lab",
      "totalTreatmentCost": "5,000",
      "finalDiscount": "0",
      "netAmount": "5,000"
    },
    "treatmentPlanImages": [],
    "xrayImages": [],
    "caseSheetImages": []
  }
]
```

---

## 2. Get OP by Number

Retrieves a specific OP record by its unique OP Number.

**Endpoint:** `GET /api/op/:opNumber`

**Response:** Single OP Record object (same structure as above).

---

## 3. Create New OP (Front Office)

Creates a new foundational patient record. The backend is responsible for generating the authoritative `sectionNo`.

**Endpoint:** `POST /api/op`

**Request Payload:**
```json
{
  "opNumber": "OP1025",
  "patientName": "Ravi Kumar",
  "age": 42,
  "sex": "Male",
  "phone": "9876543210",
  "date": "2026-09-07",
  "reference": "Google",
  "paidStatus": "Paid"
}
```

**Response:**
```json
{
  "patient": {
    "sectionNo": "1026",
    "opNumber": "OP1025",
    "patientName": "Ravi Kumar",
    ...
  },
  "treatmentLab": { ... },
  "treatmentPlanImages": [],
  "xrayImages": [],
  "caseSheetImages": []
}
```

---

## 4. Search OPs

Retrieves OPs matching a search query.

**Endpoint:** `GET /api/op?search={query}`

**Query Parameters:**
- `search` (string): Text to match against OP Number, Patient Name, or Phone.

**Response:** Array of OP Record objects.

---

## 5. Update OP

Updates fields of an existing OP.

**Endpoint:** `PATCH /api/op/:opNumber`

**Request Payload:**
```json
{
  "patient": {
    "paidStatus": "Free"
  }
}
```

**Response:** Updated OP Record object.
