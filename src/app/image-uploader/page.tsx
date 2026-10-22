"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, User, Calendar, ChevronRight, AlertCircle, ArrowLeft, Stethoscope } from "lucide-react";
import { MobileImageCard } from "@/components/uploader/MobileImageCard";

interface OPItem {
  id: string;
  opNumber: string;
  patientName: string;
  date: string;
  createdAt: string;
}

interface VisitImage {
  id: string;
  fileUrl: string;
  originalFilename?: string;
  uploadedAt: string;
}

interface DoctorVisitItem {
  id: string;
  visitDate: string;
  treatmentDone?: string;
  doctor?: {
    id: string;
    name: string;
  };
  images: VisitImage[];
}

interface FullOPDetails {
  patient: {
    opNumber: string;
    patientName: string;
    date: string;
  };
  xrayImages: Array<{ id: string; url: string; filename: string; uploadedAt: string }>;
  treatmentPlanImages: Array<{ id: string; url: string; filename: string; uploadedAt: string }>;
}

export default function ImageUploaderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentOps, setRecentOps] = useState<OPItem[]>([]);
  const [searchResults, setSearchResults] = useState<OPItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecents, setIsLoadingRecents] = useState(true);

  // Selected OP State
  const [selectedOp, setSelectedOp] = useState<OPItem | null>(null);
  const [opDetails, setOpDetails] = useState<FullOPDetails | null>(null);
  const [doctorVisits, setDoctorVisits] = useState<DoctorVisitItem[]>([]);
  const [isLoadingOpData, setIsLoadingOpData] = useState(false);

  // Selected visit for visit photos
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  // 1. Initial Load of Recent 5 OPs
  useEffect(() => {
    let isMounted = true;
    fetch("/api/uploader/ops")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setRecentOps(data.ops || []);
      })
      .catch((err) => console.error("Failed to fetch recent OPs:", err))
      .finally(() => {
        if (isMounted) setIsLoadingRecents(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Search Debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/uploader/ops?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data.ops || []))
        .catch((err) => console.error("Search failed:", err))
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Load full OP data (X-rays, Treatment plans, Doctor Visits)
  const loadOpData = useCallback(async (opNumber: string) => {
    setIsLoadingOpData(true);
    try {
      // Load foundational OP (contains existing X-rays & treatment plan images)
      const opRes = await fetch(`/api/op/${opNumber}`);
      if (opRes.ok) {
        const opData = await opRes.json();
        setOpDetails(opData);
      }

      // Load doctor visits
      const visitsRes = await fetch(`/api/op/${opNumber}/doctor-visits`);
      if (visitsRes.ok) {
        const visitsData = await visitsRes.json();
        setDoctorVisits(visitsData);
        if (visitsData.length > 0 && !selectedVisitId) {
          setSelectedVisitId(visitsData[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load OP details:", err);
    } finally {
      setIsLoadingOpData(false);
    }
  }, [selectedVisitId]);

  const handleSelectOp = (op: OPItem) => {
    setSelectedOp(op);
    setSelectedVisitId(null);
    loadOpData(op.opNumber);
  };

  const handleClearSelection = () => {
    setSelectedOp(null);
    setOpDetails(null);
    setDoctorVisits([]);
    setSelectedVisitId(null);
    fetch("/api/uploader/ops")
      .then((res) => res.json())
      .then((data) => setRecentOps(data.ops || []))
      .catch((err) => console.error("Failed to refresh recent OPs:", err));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 1: SEARCH & RECENT OPs (When no OP is selected)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!selectedOp) {
    const displayList = searchQuery.trim() ? searchResults : recentOps;
    const isShowingSearch = Boolean(searchQuery.trim());

    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-white p-3 rounded-xl border border-[var(--color-border)] shadow-xs">
          <label className="block text-xs font-semibold text-[var(--color-muted)] mb-1.5 uppercase tracking-wide">
            Select Patient OP
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by OP Number or Patient Name..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all text-[var(--color-foreground)]"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* List Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            {isShowingSearch ? "Search Results" : "Recent Registrations (Last 5)"}
          </h2>
          {isSearching && (
            <span className="text-[11px] text-[var(--color-primary)] animate-pulse">
              Searching...
            </span>
          )}
        </div>

        {/* List of OPs */}
        {isLoadingRecents ? (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center text-xs text-[var(--color-muted)]">
            Loading recent records...
          </div>
        ) : displayList.length > 0 ? (
          <div className="space-y-2">
            {displayList.map((op) => (
              <button
                key={op.id}
                onClick={() => handleSelectOp(op)}
                className="w-full bg-white hover:bg-blue-50/50 active:bg-blue-100/50 border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-xl p-3.5 flex items-center justify-between text-left transition-all shadow-xs group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0F3157] text-white tracking-wide">
                      {op.opNumber}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                      {op.patientName}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)] flex items-center gap-1">
                    <span>Registered:</span>
                    <span className="font-medium text-gray-600">{op.date}</span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-[var(--color-primary)] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center space-y-2">
            <User className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              {isShowingSearch ? "No matching patients found" : "No recent registrations found"}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {isShowingSearch
                ? "Try searching with a different OP number or name."
                : "New OP registrations from Front Office will appear here automatically."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 2: ACTIVE OP STUDIO (Upload Sections)
  // ─────────────────────────────────────────────────────────────────────────────
  const latestXRay = opDetails?.xrayImages?.[opDetails.xrayImages.length - 1];
  const latestTreatmentPlan = opDetails?.treatmentPlanImages?.[opDetails.treatmentPlanImages.length - 1];
  const activeVisit = doctorVisits.find((v) => v.id === selectedVisitId);

  return (
    <div className="space-y-4">
      {/* Patient Summary Card */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-xs p-3.5 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0EA5E9] text-white">
              {selectedOp.opNumber}
            </span>
            <span className="text-sm font-bold text-[var(--color-foreground)]">
              {selectedOp.patientName}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-muted)]">
            Date: <span className="text-gray-700 font-medium">{selectedOp.date}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearSelection}
          className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[#0b8ec7] bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch</span>
        </button>
      </div>

      {isLoadingOpData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs p-2.5 rounded-lg text-center animate-pulse">
          Refreshing clinical media records...
        </div>
      )}

      {/* SECTION A: X-RAY (Single Slot) */}
      <MobileImageCard
        title="1. Patient X-Ray"
        subtitle="Single slot per OP (replaces previous X-ray)"
        category="x-ray"
        opNumber={selectedOp.opNumber}
        existingImageUrl={latestXRay?.url}
        existingFilename={latestXRay?.filename}
        existingUploadedAt={latestXRay?.uploadedAt}
        onUploadSuccess={() => loadOpData(selectedOp.opNumber)}
      />

      {/* SECTION B: CLINIC HEAD TREATMENT PLAN (Single Slot) */}
      <MobileImageCard
        title="2. Treatment Plan Image"
        subtitle="Clinic Head treatment plan documentation (single slot)"
        category="treatment-plan"
        opNumber={selectedOp.opNumber}
        existingImageUrl={latestTreatmentPlan?.url}
        existingFilename={latestTreatmentPlan?.filename}
        existingUploadedAt={latestTreatmentPlan?.uploadedAt}
        onUploadSuccess={() => loadOpData(selectedOp.opNumber)}
      />

      {/* SECTION C: WORKING DOCTOR VISIT PHOTOS */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-xs p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--color-foreground)] flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-[#0F3157]" />
              <span>3. Working Doctor Visit Photos</span>
            </h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Attach clinical procedure photos to actual doctor visits
            </p>
          </div>
        </div>

        {doctorVisits.length === 0 ? (
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3.5 text-center space-y-1">
            <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
            <p className="text-xs font-semibold text-amber-900">
              No Clinical Visits Recorded Yet
            </p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Doctor visits are created by the Working Doctor during patient consultations. Once a visit is saved in the case sheet, you can attach procedure photos here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visit Selector Pills */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-muted)] mb-1.5 uppercase tracking-wide">
                Select Visit ({doctorVisits.length} recorded)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {doctorVisits.map((visit, idx) => {
                  const isSelected = visit.id === selectedVisitId;
                  const visitDateStr = new Date(visit.visitDate).toLocaleDateString("en-IN");
                  return (
                    <button
                      key={visit.id}
                      type="button"
                      onClick={() => setSelectedVisitId(visit.id)}
                      className={`shrink-0 px-3 py-2 rounded-lg text-left text-xs transition-all border ${
                        isSelected
                          ? "bg-[#0F3157] text-white border-[#0F3157] shadow-xs"
                          : "bg-gray-50 border-[var(--color-border)] text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Visit {doctorVisits.length - idx}</span>
                        {visit.images && visit.images.length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"}`}>
                            {visit.images.length} {visit.images.length === 1 ? "photo" : "photos"}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                        {visitDateStr}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Visit Info */}
            {activeVisit && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs space-y-1">
                <div className="flex justify-between font-medium text-blue-900">
                  <span>Doctor: {activeVisit.doctor?.name || "Assigned Doctor"}</span>
                  <span>{new Date(activeVisit.visitDate).toLocaleDateString("en-IN")}</span>
                </div>
                {activeVisit.treatmentDone && (
                  <p className="text-[11px] text-blue-800">
                    <span className="font-semibold">Treatment:</span> {activeVisit.treatmentDone}
                  </p>
                )}
              </div>
            )}

            {/* Active Visit Existing Photos Gallery */}
            {activeVisit && activeVisit.images && activeVisit.images.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                  Existing Visit Photos ({activeVisit.images.length})
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {activeVisit.images.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-24 rounded-lg overflow-hidden border border-[var(--color-border)] bg-gray-100 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.fileUrl}
                        alt={img.originalFilename || "Visit photo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] p-0.5 truncate text-center">
                        {img.originalFilename || "photo"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visit Photo Upload Component */}
            {selectedVisitId && (
              <MobileImageCard
                title="Add Photo to this Visit"
                subtitle="Support multiple clinical photos per visit"
                category="doctor-visit"
                opNumber={selectedOp.opNumber}
                visitId={selectedVisitId}
                onUploadSuccess={() => loadOpData(selectedOp.opNumber)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
