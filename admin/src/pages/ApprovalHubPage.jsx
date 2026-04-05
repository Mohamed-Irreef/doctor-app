import { Eye, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import {
    approveAdminPackage,
    decideAdminLabApproval,
    decideAdminLabContent,
    decideAdminMedicineContent,
    decideAdminPharmacyApproval,
    getAdminLabApprovalRequests,
    getAdminPendingContent,
    getAdminPendingPackages,
    getAdminPharmacyApprovalRequests,
    rejectAdminPackage,
} from "../services/api";

const TABS = {
  LABS: "labs",
  PHARMACIES: "pharmacies",
  CONTENT_LABS: "content-labs",
  CONTENT_MEDICINES: "content-medicines",
  PACKAGES: "packages",
};

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800 break-words">
        {value || "-"}
      </p>
    </div>
  );
}

function DocumentLinks({ item }) {
  const docs = useMemo(() => {
    if (!item) return [];
    return [
      { label: "Government License", doc: item.governmentLicense },
      { label: "Lab Certification", doc: item.labCertification },
      { label: "Owner ID Proof", doc: item.ownerIdProof },
      { label: "Address Proof", doc: item.addressProof },
      { label: "Drug License", doc: item.drugLicense },
      { label: "GST Certificate", doc: item.gstCertificate },
    ].filter((entry) => entry.doc?.url);
  }, [item]);

  if (!docs.length) {
    return <p className="text-sm text-slate-500">No documents uploaded.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {docs.map((entry) => (
        <a
          key={entry.label}
          href={entry.doc.viewerUrl || entry.doc.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          <FileText size={15} />
          <span>{entry.label}</span>
        </a>
      ))}
    </div>
  );
}

function LabTestDocumentLinks({ item }) {
  const docs = useMemo(() => {
    if (!item) return [];
    return [
      {
        label: "Test Image",
        url:
          item.testImageViewerUrl ||
          item.imageViewerUrl ||
          item.testImage ||
          item.imageUrl,
      },
      {
        label: "Report Sample",
        url: item.reportSampleViewerUrl || item.reportSampleUrl,
      },
      {
        label: "Test Video",
        url: item.testVideoViewerUrl || item.testVideoUrl,
      },
    ].filter((entry) => entry.url);
  }, [item]);

  if (!docs.length) {
    return <p className="text-sm text-slate-500">No documents uploaded.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {docs.map((entry) => (
        <a
          key={entry.label}
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          <FileText size={15} />
          <span>{entry.label}</span>
        </a>
      ))}
    </div>
  );
}

function MedicineDocumentLinks({ item }) {
  const docs = useMemo(() => {
    if (!item) return [];
    return [
      {
        label: "Medicine Image",
        url: item.imageViewerUrl || item.image,
      },
      {
        label: "Medicine Document",
        url: item.pdfViewerUrl || item.pdfUrl,
      },
    ].filter((entry) => entry.url);
  }, [item]);

  if (!docs.length) {
    return <p className="text-sm text-slate-500">No documents uploaded.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {docs.map((entry) => (
        <a
          key={entry.label}
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          <FileText size={15} />
          <span>{entry.label}</span>
        </a>
      ))}
    </div>
  );
}

export default function ApprovalHubPage() {
  const [activeTab, setActiveTab] = useState(TABS.LABS);
  const [labs, setLabs] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [content, setContent] = useState({ labTests: [], medicines: [] });
  const [packages, setPackages] = useState([]);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [contentDetailOpen, setContentDetailOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedContentKind, setSelectedContentKind] = useState("lab-content");
  const [packageDetailOpen, setPackageDetailOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingReject, setPendingReject] = useState(null);

  const pendingLabs = useMemo(
    () => (labs || []).filter((item) => item.approvalStatus === "pending"),
    [labs],
  );
  const pendingPharmacies = useMemo(
    () =>
      (pharmacies || []).filter((item) => item.approvalStatus === "pending"),
    [pharmacies],
  );

  const load = async () => {
    const [l, p, c, pk] = await Promise.all([
      getAdminLabApprovalRequests(),
      getAdminPharmacyApprovalRequests(),
      getAdminPendingContent(),
      getAdminPendingPackages(),
    ]);
    if (l.status === "success") setLabs(l.data || []);
    if (p.status === "success") setPharmacies(p.data || []);
    if (c.status === "success") {
      setContent(c.data || { labTests: [], medicines: [] });
    }
    if (pk.status === "success") setPackages(pk.data || []);
  };

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  const decision = async ({ fn, id, approved, listKey, reason }) => {
    const opKey = `${listKey}-${id}-${approved ? "approve" : "reject"}`;
    setBusyKey(opKey);
    setMessage({ type: "", text: "" });

    const payload = approved ? { approved } : { approved, reason };
    const response = await fn(id, payload);
    setBusyKey("");

    if (response.status === "error") {
      setMessage({
        type: "error",
        text: response.error || "Action failed. Please try again.",
      });
      return;
    }

    setMessage({
      type: "success",
      text: approved
        ? "Request approved successfully."
        : "Request rejected successfully.",
    });

    await load();
  };

  const openRejectModal = (config) => {
    setPendingReject(config);
    setRejectReason("");
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!pendingReject) return;
    if (!rejectReason.trim()) {
      setMessage({ type: "error", text: "Rejection reason is required." });
      return;
    }

    await decision({
      ...pendingReject,
      approved: false,
      reason: rejectReason.trim(),
    });

    setRejectOpen(false);
    setPendingReject(null);
    setRejectReason("");
  };

  const renderPartnerCard = (item, type) => {
    const isLab = type === "lab";
    const id = item._id;
    const approveKey = `${type}-${id}-approve`;
    const rejectKey = `${type}-${id}-reject`;
    const name = isLab ? item.labName : item.pharmacyName;

    return (
      <div
        key={id}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm"
      >
        <div>
          <p className="font-bold text-slate-900">{name}</p>
          <p className="text-slate-500">
            {item.email} • {item.approvalStatus}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSelectedItem(item);
              setDetailOpen(true);
            }}
            title="View details"
          >
            <span className="inline-flex items-center gap-1">
              <Eye size={14} /> View
            </span>
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            disabled={busyKey === approveKey}
            onClick={() =>
              decision({
                fn: isLab
                  ? decideAdminLabApproval
                  : decideAdminPharmacyApproval,
                id,
                approved: true,
                listKey: type,
              })
            }
          >
            {busyKey === approveKey ? "Approving..." : "Approve"}
          </button>
          <button
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            disabled={busyKey === rejectKey}
            onClick={() =>
              openRejectModal({
                fn: isLab
                  ? decideAdminLabApproval
                  : decideAdminPharmacyApproval,
                id,
                listKey: type,
              })
            }
          >
            {busyKey === rejectKey ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    );
  };

  const renderContentCard = (item, kind) => {
    const id = item._id;
    const approveKey = `${kind}-${id}-approve`;
    const rejectKey = `${kind}-${id}-reject`;
    return (
      <div
        key={id}
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm"
      >
        <span className="font-bold">{item.name}</span>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSelectedContent(item);
              setSelectedContentKind(kind);
              setContentDetailOpen(true);
            }}
            title="View details"
          >
            <span className="inline-flex items-center gap-1">
              <Eye size={14} /> View
            </span>
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            disabled={busyKey === approveKey}
            onClick={() =>
              decision({
                fn:
                  kind === "lab-content"
                    ? decideAdminLabContent
                    : decideAdminMedicineContent,
                id,
                approved: true,
                listKey: kind,
              })
            }
          >
            {busyKey === approveKey ? "Approving..." : "Approve"}
          </button>
          <button
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            disabled={busyKey === rejectKey}
            onClick={() =>
              openRejectModal({
                fn:
                  kind === "lab-content"
                    ? decideAdminLabContent
                    : decideAdminMedicineContent,
                id,
                listKey: kind,
              })
            }
          >
            {busyKey === rejectKey ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-slate-900">Approval Hub</h1>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            activeTab === TABS.LABS
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab(TABS.LABS)}
        >
          Lab Partner Requests
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            activeTab === TABS.PHARMACIES
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab(TABS.PHARMACIES)}
        >
          Pharmacy Partner Requests
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            activeTab === TABS.CONTENT_LABS
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab(TABS.CONTENT_LABS)}
        >
          Lab Test Approvals
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            activeTab === TABS.CONTENT_MEDICINES
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab(TABS.CONTENT_MEDICINES)}
        >
          Medicine Approvals
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            activeTab === TABS.PACKAGES
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab(TABS.PACKAGES)}
        >
          Package Approvals
        </button>
      </div>

      {message.text ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            message.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {activeTab === TABS.LABS && (
        <section className="panel-card p-5">
          <h2 className="text-lg font-extrabold">Lab Partner Requests</h2>
          <div className="mt-3 space-y-2">
            {pendingLabs.length ? (
              pendingLabs.map((item) => renderPartnerCard(item, "lab"))
            ) : (
              <p className="text-sm text-slate-500">No lab partner requests.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === TABS.PHARMACIES && (
        <section className="panel-card p-5">
          <h2 className="text-lg font-extrabold">Pharmacy Partner Requests</h2>
          <div className="mt-3 space-y-2">
            {pendingPharmacies.length ? (
              pendingPharmacies.map((item) =>
                renderPartnerCard(item, "pharmacy"),
              )
            ) : (
              <p className="text-sm text-slate-500">
                No pharmacy partner requests.
              </p>
            )}
          </div>
        </section>
      )}

      {activeTab === TABS.CONTENT_LABS && (
        <section className="panel-card p-5">
          <h2 className="text-lg font-extrabold">Lab Test Approvals</h2>
          <div className="mt-2 space-y-2">
            {(content.labTests || []).length ? (
              (content.labTests || []).map((item) =>
                renderContentCard(item, "lab-content"),
              )
            ) : (
              <p className="text-sm text-slate-500">No pending lab tests.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === TABS.CONTENT_MEDICINES && (
        <section className="panel-card p-5">
          <h2 className="text-lg font-extrabold">Medicine Approvals</h2>
          <div className="mt-2 space-y-2">
            {(content.medicines || []).length ? (
              (content.medicines || []).map((item) =>
                renderContentCard(item, "medicine-content"),
              )
            ) : (
              <p className="text-sm text-slate-500">No pending medicines.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === TABS.PACKAGES && (
        <section className="panel-card p-5">
          <h2 className="text-lg font-extrabold">Package Approvals</h2>
          <div className="mt-2 space-y-2">
            {packages.length ? (
              packages.map((pkg) => {
                const id = pkg._id;
                const approveKey = `pkg-${id}-approve`;
                const rejectKey = `pkg-${id}-reject`;
                return (
                  <div
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {pkg.image && (
                        <img src={pkg.image} alt={pkg.name} className="h-14 w-14 rounded-lg object-cover border border-slate-200" />
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{pkg.name}</p>
                        <p className="text-slate-500">{pkg.labName} • {pkg.category}</p>
                        <p className="text-slate-500">
                          {pkg.testCount} tests • ₹{pkg.price?.offer}
                          {pkg.price?.discount > 0 && <span className="ml-1 text-emerald-600 font-semibold">{pkg.price.discount}% off</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        onClick={() => { setSelectedPackage(pkg); setPackageDetailOpen(true); }}
                      >
                        <span className="inline-flex items-center gap-1"><Eye size={14} /> View</span>
                      </button>
                      <button
                        disabled={busyKey === approveKey}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        onClick={async () => {
                          setBusyKey(approveKey);
                          setMessage({ type: "", text: "" });
                          const r = await approveAdminPackage(id);
                          setBusyKey("");
                          setMessage({ type: r.status === "success" ? "success" : "error", text: r.status === "success" ? "Package approved successfully." : r.error || "Failed." });
                          await load();
                        }}
                      >
                        {busyKey === approveKey ? "…" : "Approve"}
                      </button>
                      <button
                        disabled={busyKey === rejectKey}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                        onClick={() => openRejectModal({
                          fn: (pkgId, payload) => rejectAdminPackage(pkgId, payload.reason),
                          id,
                          listKey: "pkg",
                        })}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No pending packages.</p>
            )}
          </div>
        </section>
      )}

      <Modal
        isOpen={packageDetailOpen}
        onClose={() => setPackageDetailOpen(false)}
        title="Package Details"
        className="max-w-4xl"
      >
        {selectedPackage && (
          <div className="space-y-4">
            {selectedPackage.image && (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <img src={selectedPackage.image} alt={selectedPackage.name} className="max-h-64 w-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Package Name" value={selectedPackage.name} />
              <Field label="Code" value={selectedPackage.code} />
              <Field label="Category" value={selectedPackage.category} />
              <Field label="Lab" value={selectedPackage.labName} />
              <Field label="Offer Price" value={selectedPackage.price?.offer ? `INR ${selectedPackage.price.offer}` : "-"} />
              <Field label="Original Price" value={selectedPackage.price?.original ? `INR ${selectedPackage.price.original}` : "-"} />
              <Field label="Discount" value={selectedPackage.price?.discount ? `${selectedPackage.price.discount}%` : "-"} />
              <Field label="GST %" value={selectedPackage.price?.gst ? `${selectedPackage.price.gst}%` : "-"} />
              <Field label="Final Price" value={selectedPackage.price?.final ? `INR ${selectedPackage.price.final}` : "-"} />
              <Field label="Total Tests" value={selectedPackage.testCount} />
              <Field label="Age Range" value={selectedPackage.ageRange ? `${selectedPackage.ageRange.min}-${selectedPackage.ageRange.max} yrs` : "-"} />
              <Field label="Gender" value={selectedPackage.gender} />
              <Field label="Short Description" value={selectedPackage.shortDescription} />
              <Field label="Tags" value={Array.isArray(selectedPackage.tags) ? selectedPackage.tags.join(", ") : "-"} />
              <Field label="Status" value={selectedPackage.status} />
            </div>
            {selectedPackage.brochure && (
              <div>
                <h3 className="mb-2 text-sm font-extrabold text-slate-900">Brochure</h3>
                <a href={selectedPackage.brochure} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  <FileText size={15} /> Download Brochure
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Request"
        className="max-w-lg"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Enter rejection reason. This message will be sent to the partner via
            email.
          </p>
          <textarea
            className="min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-bold text-white"
              onClick={submitReject}
            >
              Submit Rejection
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Partner Registration Details"
        className="max-w-4xl"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Full Name" value={selectedItem.fullName} />
              <Field
                label="Business Name"
                value={selectedItem.labName || selectedItem.pharmacyName}
              />
              <Field label="Email" value={selectedItem.email} />
              <Field label="Phone" value={selectedItem.phone} />
              <Field label="City" value={selectedItem.city} />
              <Field label="State" value={selectedItem.state} />
              <Field label="Pincode" value={selectedItem.pincode} />
              <Field label="Address" value={selectedItem.address} />
              <Field label="Support Email" value={selectedItem.supportEmail} />
              <Field label="Support Phone" value={selectedItem.supportPhone} />
              <Field
                label="Approval Status"
                value={selectedItem.approvalStatus}
              />
              <Field
                label="Years Of Experience"
                value={selectedItem.yearsOfExperience}
              />
              <Field
                label="Registration Number"
                value={selectedItem.registrationNumber}
              />
              <Field
                label="License Number"
                value={selectedItem.licenseNumber}
              />
              <Field label="GST Number" value={selectedItem.gstNumber} />
              <Field label="Lab Type" value={selectedItem.labType} />
              <Field
                label="Available Tests"
                value={
                  Array.isArray(selectedItem.availableTests)
                    ? selectedItem.availableTests.join(", ")
                    : "-"
                }
              />
              <Field
                label="Location"
                value={
                  selectedItem.location
                    ? `${selectedItem.location.latitude}, ${selectedItem.location.longitude}`
                    : "-"
                }
              />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-slate-900">
                Uploaded Documents
              </h3>
              <DocumentLinks item={selectedItem} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={contentDetailOpen}
        onClose={() => setContentDetailOpen(false)}
        title={
          selectedContentKind === "medicine-content"
            ? "Medicine Details"
            : "Lab Test Details"
        }
        className="max-w-4xl"
      >
        {selectedContent && selectedContentKind === "lab-content" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Test Name" value={selectedContent.name} />
              <Field label="Test Code" value={selectedContent.testCode} />
              <Field label="Category" value={selectedContent.category} />
              <Field label="Subcategory" value={selectedContent.subcategory} />
              <Field
                label="Price"
                value={
                  selectedContent.price !== undefined
                    ? `INR ${selectedContent.price}`
                    : "-"
                }
              />
              <Field
                label="Original Price"
                value={
                  selectedContent.originalPrice !== undefined
                    ? `INR ${selectedContent.originalPrice}`
                    : "-"
                }
              />
              <Field label="Sample Type" value={selectedContent.sampleType} />
              <Field
                label="Fasting Hours"
                value={
                  selectedContent.fastingRequired
                    ? selectedContent.fastingHours
                    : "Not Required"
                }
              />
              <Field
                label="Report Time"
                value={selectedContent.reportTime || selectedContent.turnaround}
              />
              <Field label="Method" value={selectedContent.method} />
              <Field label="Department" value={selectedContent.department} />
              <Field
                label="Keywords"
                value={
                  Array.isArray(selectedContent.keywords)
                    ? selectedContent.keywords.join(", ")
                    : "-"
                }
              />
              <Field
                label="Tags"
                value={
                  Array.isArray(selectedContent.tags)
                    ? selectedContent.tags.join(", ")
                    : "-"
                }
              />
              <Field
                label="Collection Slots"
                value={
                  Array.isArray(selectedContent.collectionTimeSlots)
                    ? selectedContent.collectionTimeSlots.join(", ")
                    : "-"
                }
              />
              <Field
                label="Short Description"
                value={selectedContent.shortDescription}
              />
              <Field
                label="Full Description"
                value={selectedContent.fullDescription}
              />
              <Field
                label="Preparation Instructions"
                value={selectedContent.preparationInstructions}
              />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-slate-900">
                Parameters
              </h3>
              {Array.isArray(selectedContent.parameters) &&
              selectedContent.parameters.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedContent.parameters.map((param, index) => (
                    <div
                      key={`${param.name}-${index}`}
                      className="rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <p className="font-semibold text-slate-900">
                        {param.name}
                      </p>
                      <p className="text-slate-500">
                        {param.normalRange || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No parameters added.</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-slate-900">
                Uploaded Documents
              </h3>
              <LabTestDocumentLinks item={selectedContent} />
            </div>
          </div>
        ) : null}

        {selectedContent && selectedContentKind === "medicine-content" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Medicine Name" value={selectedContent.name} />
              <Field label="Generic Name" value={selectedContent.genericName} />
              <Field label="Category" value={selectedContent.category} />
              <Field label="Subcategory" value={selectedContent.subcategory} />
              <Field label="Brand" value={selectedContent.brand} />
              <Field label="Composition" value={selectedContent.composition} />
              <Field label="Dosage Form" value={selectedContent.dosageForm} />
              <Field label="Strength" value={selectedContent.strength} />
              <Field
                label="Manufacturer"
                value={selectedContent.manufacturer}
              />
              <Field label="Pack Size" value={selectedContent.packSize} />
              <Field label="Batch Number" value={selectedContent.batchNumber} />
              <Field
                label="Expiry Date"
                value={
                  selectedContent.expiryDate
                    ? new Date(selectedContent.expiryDate).toLocaleDateString()
                    : "-"
                }
              />
              <Field
                label="Manufacture Date"
                value={
                  selectedContent.manufactureDate
                    ? new Date(
                        selectedContent.manufactureDate,
                      ).toLocaleDateString()
                    : "-"
                }
              />
              <Field
                label="Prescription Required"
                value={selectedContent.prescriptionRequired ? "Yes" : "No"}
              />
              <Field
                label="Cold Storage Required"
                value={selectedContent.requiresColdStorage ? "Yes" : "No"}
              />
              <Field
                label="Schedule Type"
                value={selectedContent.scheduleType}
              />
              <Field
                label="MRP"
                value={
                  selectedContent.mrp !== undefined
                    ? `INR ${selectedContent.mrp}`
                    : "-"
                }
              />
              <Field
                label="Selling Price"
                value={
                  selectedContent.price !== undefined
                    ? `INR ${selectedContent.price}`
                    : "-"
                }
              />
              <Field
                label="Discount %"
                value={
                  selectedContent.discountPercent !== undefined
                    ? `${selectedContent.discountPercent}%`
                    : "-"
                }
              />
              <Field
                label="GST %"
                value={
                  selectedContent.gstPercent !== undefined
                    ? `${selectedContent.gstPercent}%`
                    : "-"
                }
              />
              <Field
                label="Final Price"
                value={
                  selectedContent.finalPrice !== undefined
                    ? `INR ${selectedContent.finalPrice}`
                    : "-"
                }
              />
              <Field
                label="Stock"
                value={
                  selectedContent.stock !== undefined
                    ? selectedContent.stock
                    : "-"
                }
              />
              <Field
                label="Low Stock Threshold"
                value={
                  selectedContent.lowStockThreshold !== undefined
                    ? selectedContent.lowStockThreshold
                    : "-"
                }
              />
              <Field
                label="In Stock"
                value={selectedContent.inStock ? "Yes" : "No"}
              />
              <Field
                label="Min Order Qty"
                value={
                  selectedContent.minOrderQuantity !== undefined
                    ? selectedContent.minOrderQuantity
                    : "-"
                }
              />
              <Field
                label="Max Order Qty"
                value={
                  selectedContent.maxOrderQuantity !== undefined
                    ? selectedContent.maxOrderQuantity
                    : "-"
                }
              />
              <Field
                label="Delivery ETA (Hours)"
                value={
                  selectedContent.deliveryEtaHours !== undefined
                    ? selectedContent.deliveryEtaHours
                    : "-"
                }
              />
              <Field
                label="Approval Status"
                value={selectedContent.approvalStatus}
              />
              <Field label="Description" value={selectedContent.description} />
              <Field
                label="Usage Instructions"
                value={selectedContent.usageInstructions}
              />
              <Field
                label="Storage Instructions"
                value={selectedContent.storageInstructions}
              />
              <Field label="Indications" value={selectedContent.indications} />
              <Field
                label="Dosage Instructions"
                value={selectedContent.dosageInstructions}
              />
              <Field label="Precautions" value={selectedContent.precautions} />
              <Field
                label="Side Effects"
                value={
                  Array.isArray(selectedContent.sideEffects)
                    ? selectedContent.sideEffects.join(", ")
                    : "-"
                }
              />
              <Field
                label="Contraindications"
                value={
                  Array.isArray(selectedContent.contraindications)
                    ? selectedContent.contraindications.join(", ")
                    : "-"
                }
              />
              <Field
                label="Drug Interactions"
                value={
                  Array.isArray(selectedContent.drugInteractions)
                    ? selectedContent.drugInteractions.join(", ")
                    : "-"
                }
              />
              <Field
                label="Tags"
                value={
                  Array.isArray(selectedContent.tags)
                    ? selectedContent.tags.join(", ")
                    : "-"
                }
              />
              <Field
                label="Keywords"
                value={
                  Array.isArray(selectedContent.keywords)
                    ? selectedContent.keywords.join(", ")
                    : "-"
                }
              />
            </div>

            {selectedContent.imageViewerUrl || selectedContent.image ? (
              <div>
                <h3 className="mb-2 text-sm font-extrabold text-slate-900">
                  Uploaded Image
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={
                      selectedContent.imageViewerUrl || selectedContent.image
                    }
                    alt={selectedContent.name || "Medicine"}
                    className="max-h-72 w-full object-contain"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-slate-900">
                Uploaded Documents
              </h3>
              <MedicineDocumentLinks item={selectedContent} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
