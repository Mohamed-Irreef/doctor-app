import { useNavigate } from "react-router-dom";
import PatientTestCard from "../../components/lab/PatientTestCard";

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
    collectionTimeSlots: "06:00 AM - 10:00 AM",
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
    collectionTimeSlots: "07:00 AM - 11:00 AM",
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

export default function LabTestsCatalogPage() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Lab Tests</h1>
          <p className="mt-2 text-sm text-slate-600">
            Book certified diagnostic tests with home collection and fast
            digital reports.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {mockTests.map((test) => (
            <PatientTestCard
              key={test._id}
              test={test}
              onOpenDetails={() => navigate(`/lab-tests/${test._id}`)}
              onBookNow={() => navigate(`/lab-tests/${test._id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
