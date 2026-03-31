import { Clock3, Droplets, Home, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

const mockTests = [
  {
    _id: "cbc-1",
    name: "Complete Blood Count (CBC)",
    category: "Blood Tests",
    subcategory: "Hematology",
    shortDescription:
      "Comprehensive blood profile for routine health screening.",
    fullDescription:
      "CBC measures hemoglobin, RBC, WBC, platelets and related indices to detect anemia, infections and inflammation.",
    originalPrice: 899,
    price: 499,
    gstPercent: 18,
    reportTime: "24 hrs",
    fastingRequired: false,
    fastingDurationHours: 0,
    sampleType: "Blood",
    homeCollectionAvailable: true,
    labVisitRequired: true,
    collectionTimeSlots: "06:00 AM - 10:00 AM",
    method: "Automated Hematology Analyzer",
    department: "Pathology",
    parameters: [
      { name: "Hemoglobin", normalRange: "13-17", unit: "g/dL" },
      { name: "RBC", normalRange: "4.5-5.9", unit: "million/uL" },
      { name: "WBC", normalRange: "4,000-11,000", unit: "cells/uL" },
    ],
    beforeTestInstructions: "Hydrate well before collection.",
    afterTestInstructions: "Resume normal routine after sample collection.",
    collectionInstructions: "Keep arm relaxed during venipuncture.",
    reportSampleUrl: "",
  },
  {
    _id: "thyroid-1",
    name: "Thyroid Profile (T3, T4, TSH)",
    category: "Hormones",
    subcategory: "Thyroid",
    shortDescription:
      "Checks thyroid hormone levels for metabolism assessment.",
    fullDescription:
      "This panel evaluates thyroid gland function and helps diagnose hypo/hyperthyroidism.",
    originalPrice: 1299,
    price: 799,
    gstPercent: 18,
    reportTime: "18 hrs",
    fastingRequired: true,
    fastingDurationHours: 8,
    sampleType: "Blood",
    homeCollectionAvailable: true,
    labVisitRequired: false,
    collectionTimeSlots: "07:00 AM - 11:00 AM",
    method: "CLIA",
    department: "Biochemistry",
    parameters: [
      { name: "T3", normalRange: "80-200", unit: "ng/dL" },
      { name: "T4", normalRange: "5-12", unit: "ug/dL" },
      { name: "TSH", normalRange: "0.4-4.0", unit: "mIU/L" },
    ],
    beforeTestInstructions: "Overnight fasting preferred.",
    afterTestInstructions: "Continue medications as advised by physician.",
    collectionInstructions: "Morning collection is recommended.",
    reportSampleUrl: "",
  },
];

function money(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

export default function LabTestDetailsPage() {
  const { id } = useParams();
  const test = useMemo(
    () => mockTests.find((item) => item._id === id) || mockTests[0],
    [id],
  );

  const gstPercent = Number(test.gstPercent || 0);
  const discountPercent =
    Number(test.originalPrice || 0) > 0
      ? Math.max(
          0,
          Math.round(
            ((Number(test.originalPrice) - Number(test.price)) /
              Number(test.originalPrice || 1)) *
              100,
          ),
        )
      : 0;
  const finalPrice =
    Number(test.price || 0) + (Number(test.price || 0) * gstPercent) / 100;

  return (
    <section className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-600">
                {test.category} / {test.subcategory || "General"}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
                {test.name}
              </h1>
            </div>
            <button
              type="button"
              className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Book Now
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Pricing</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-xs text-slate-500">Offer Price</p>
                  <p className="mt-1 text-2xl font-extrabold text-blue-600">
                    {money(test.price)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Original Price</p>
                  <p className="mt-1 text-lg font-semibold text-slate-400 line-through">
                    {money(test.originalPrice)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    {discountPercent}% OFF
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">GST</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {gstPercent}%
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Final Price</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {money(finalPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Description</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {test.fullDescription}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Parameters</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-2 py-2">Parameter</th>
                      <th className="px-2 py-2">Normal Range</th>
                      <th className="px-2 py-2">Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(test.parameters || []).map((param) => (
                      <tr
                        key={param.name}
                        className="border-b border-slate-100"
                      >
                        <td className="px-2 py-3 font-semibold text-slate-900">
                          {param.name}
                        </td>
                        <td className="px-2 py-3 text-slate-600">
                          {param.normalRange || "-"}
                        </td>
                        <td className="px-2 py-3 text-slate-600">
                          {param.unit || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Sample Details
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>Sample Type: {test.sampleType}</p>
                  <p>Fasting Required: {test.fastingRequired ? "Yes" : "No"}</p>
                  <p>Fasting Duration: {test.fastingDurationHours || 0} hrs</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">Collection</h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>
                    Home Collection:{" "}
                    {test.homeCollectionAvailable ? "Available" : "No"}
                  </p>
                  <p>
                    Lab Visit:{" "}
                    {test.labVisitRequired ? "Available" : "Not Required"}
                  </p>
                  <p>Slots: {test.collectionTimeSlots || "Morning Slots"}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">Timing</h2>
                <div className="mt-3 text-sm text-slate-600">
                  Report Turnaround: {test.reportTime}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Medical Details
                </h2>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>Method: {test.method || "-"}</p>
                  <p>Department: {test.department || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Instructions</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Before Test</p>
                  <p className="mt-1">{test.beforeTestInstructions || "-"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">After Test</p>
                  <p className="mt-1">{test.afterTestInstructions || "-"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Collection</p>
                  <p className="mt-1">{test.collectionInstructions || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-bold text-slate-900">
                Quick Highlights
              </h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Clock3 size={14} className="text-blue-600" />
                  {test.reportTime} Report Delivery
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Home size={14} className="text-blue-600" />
                  {test.homeCollectionAvailable
                    ? "Home Collection"
                    : "Lab Collection"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Droplets size={14} className="text-blue-600" />
                  {test.sampleType} Sample
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <ShieldCheck size={14} className="text-blue-600" />
                  NABL Process Standard
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-bold text-slate-900">
                Sample Report
              </h3>
              {test.reportSampleUrl ? (
                <a
                  href={test.reportSampleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600"
                >
                  View / Download PDF
                </a>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Sample report will be available soon.
                </p>
              )}
            </div>

            <Link
              to="/lab-tests"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Test Listing
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
