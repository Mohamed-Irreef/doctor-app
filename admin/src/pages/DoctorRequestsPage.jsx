import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileBadge2,
    FileText,
    Hospital,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Stethoscope,
    UserRound,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import {
    API_BASE_URL,
    approveAdminDoctor,
    getAdminDoctorRequests,
} from "../services/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const toDocumentLinks = (documents = [], files = [], urls = []) => {
  const fromDocuments = Array.isArray(documents)
    ? documents
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          if (typeof entry.url !== "string" || !entry.url.trim()) return null;
          return {
            url: entry.url,
            viewerUrl:
              typeof entry.viewerUrl === "string" && entry.viewerUrl.trim()
                ? entry.viewerUrl
                : entry.url,
            name: typeof entry.name === "string" ? entry.name : "",
          };
        })
        .filter(Boolean)
    : [];

  const fromFiles = Array.isArray(files)
    ? files
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          if (typeof entry.url !== "string" || !entry.url.trim()) return null;
          return {
            url: entry.url,
            viewerUrl: entry.url,
            name: typeof entry.name === "string" ? entry.name : "",
          };
        })
        .filter(Boolean)
    : [];

  const fromUrls = Array.isArray(urls)
    ? urls
        .map((entry) => {
          if (typeof entry === "string") {
            return { url: entry, viewerUrl: entry, name: "" };
          }
          if (
            entry &&
            typeof entry === "object" &&
            typeof entry.url === "string"
          ) {
            return {
              url: entry.url,
              viewerUrl: entry.url,
              name: typeof entry.name === "string" ? entry.name : "",
            };
          }
          return null;
        })
        .filter(Boolean)
    : [];

  const sourceEntries = fromDocuments.length
    ? fromDocuments
    : fromFiles.length
      ? fromFiles
      : fromUrls;

  return sourceEntries
    .map((entry) => {
      const trimmedUrl = entry.url.trim();
      const trimmedViewerUrl = entry.viewerUrl.trim();

      const rawHref = /^https?:\/\//i.test(trimmedUrl)
        ? trimmedUrl
        : `${API_ORIGIN}${trimmedUrl.startsWith("/") ? "" : "/"}${trimmedUrl}`;
      const viewerHref = /^https?:\/\//i.test(trimmedViewerUrl)
        ? trimmedViewerUrl
        : `${API_ORIGIN}${trimmedViewerUrl.startsWith("/") ? "" : "/"}${trimmedViewerUrl}`;

      let name = entry.name?.trim() || "";
      try {
        if (!name) {
          const parsed = new URL(rawHref);
          const fileName = parsed.pathname.split("/").pop();
          if (fileName) name = decodeURIComponent(fileName);
        }
      } catch {
        if (!name) {
          const fallbackName = rawHref.split("?")[0].split("/").pop();
          if (fallbackName) name = decodeURIComponent(fallbackName);
        }
      }

      const extension = (name.split(".").pop() || "").toLowerCase();

      return {
        id: `${viewerHref}-${name || "doc"}`,
        href: rawHref,
        viewerHref,
        name: name || "Document",
        extension,
      };
    })
    .filter((entry) => Boolean(entry.viewerHref));
};

const formatSubmittedDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function DoctorRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [confirmState, setConfirmState] = useState({
    open: false,
    id: null,
    action: null,
  });
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    doctor: null,
    documents: [],
  });
  const [toast, setToast] = useState({ message: "", tone: "info" });

  useEffect(() => {
    const load = async () => {
      const response = await getAdminDoctorRequests();
      if (response.data) setRequests(response.data);
    };
    load();
  }, []);

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(
      () => setToast({ message: "", tone: "info" }),
      2500,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const pendingCount = useMemo(
    () =>
      requests.filter((request) => request.doctorApprovalStatus === "pending")
        .length,
    [requests],
  );

  const openConfirm = (id, action) =>
    setConfirmState({ open: true, id, action });

  const openDetailsModal = (request, documents) => {
    setDetailsModal({
      isOpen: true,
      doctor: request,
      documents,
    });
  };

  const closeDetailsModal = () => {
    setDetailsModal({
      isOpen: false,
      doctor: null,
      documents: [],
    });
  };

  const handleConfirm = async () => {
    if (!confirmState.id || !confirmState.action) return;

    if (confirmState.action === "approve") {
      await approveAdminDoctor(confirmState.id, true);
      setRequests((prev) =>
        prev.filter((request) => request._id !== confirmState.id),
      );
      setToast({
        message: "Doctor approved and moved to live network.",
        tone: "success",
      });
      return;
    }

    await approveAdminDoctor(confirmState.id, false);
    setRequests((prev) =>
      prev.map((request) =>
        request._id === confirmState.id
          ? { ...request, doctorApprovalStatus: "rejected" }
          : request,
      ),
    );
    setToast({ message: "Request rejected and archived.", tone: "danger" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Approvals"
        description="Review and action doctor onboarding requests with compliance visibility."
      />

      <div className="panel-card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <Clock3 size={16} className="text-amber-500" />
          <p className="text-sm font-semibold text-slate-600">
            Pending review queue
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
              {pendingCount}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck size={14} />
          Compliance checks enabled
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {requests.length === 0 ? (
          <div className="col-span-full panel-card flex flex-col items-center gap-3 py-14 text-center">
            <Stethoscope size={28} className="text-slate-300" />
            <p className="text-base font-bold text-slate-700">
              No pending doctor requests
            </p>
            <p className="text-sm text-slate-500">
              New applications will appear here automatically.
            </p>
          </div>
        ) : (
          requests.map((request) => {
            const isPending = request.doctorApprovalStatus === "pending";
            const statusLabel =
              request.doctorApprovalStatus.charAt(0).toUpperCase() +
              request.doctorApprovalStatus.slice(1);
            const documents = toDocumentLinks(
              request.profile?.documents || [],
              request.profile?.certificateFiles || [],
              request.profile?.certificateUrls || [],
            );
            const visibleDocuments = documents.slice(0, 2);

            return (
              <article
                key={request._id}
                className={`panel-card overflow-hidden border transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10 ${
                  isPending
                    ? "border-amber-300 bg-linear-to-b from-amber-50/70 via-white to-white"
                    : "border-slate-200"
                }`}
              >
                <div className="h-1 w-full bg-linear-to-r from-sky-500 via-blue-500 to-teal-400" />
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={request.image}
                        alt={request.name}
                        className="h-14 w-14 rounded-full border-2 border-slate-100 object-cover"
                      />
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {request.name}
                        </h3>
                        <p className="text-sm font-semibold text-blue-600">
                          {request.profile?.specialization || "Doctor"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isPending ? "warning" : "danger"}>
                      {statusLabel}
                    </Badge>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-600 md:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <UserRound size={13} />
                        Experience
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {request.profile?.experienceYears || 0} years
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <Hospital size={13} />
                        Hospital
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {request.profile?.hospital || "-"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 md:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Qualifications
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {(request.profile?.qualifications || []).join(", ") ||
                          "-"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 md:col-span-2">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <CalendarDays size={13} />
                        Submitted On
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {formatSubmittedDate(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl border border-sky-100 bg-linear-to-b from-sky-50 to-white p-3 shadow-sm shadow-sky-100/60">
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
                      <FileBadge2 size={14} />
                      Documents Preview
                    </p>
                    {documents.length === 0 ? (
                      <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-500 ring-1 ring-slate-200">
                        No documents uploaded yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {visibleDocuments.map((document) => (
                          <a
                            key={document.id}
                            href={document.viewerHref}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-sky-100 transition hover:ring-sky-300"
                            title={document.name}
                          >
                            <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                              <FileText size={14} className="text-sky-600" />
                              <span className="block truncate font-medium">
                                {document.name}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-sky-600">
                              Preview
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      openDetailsModal(request, documents);
                    }}
                  >
                    <FileText size={16} />
                    View doctor details
                  </Button>
                </div>

                <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/40">
                  <button
                    type="button"
                    onClick={() => openConfirm(request._id, "reject")}
                    disabled={!isPending}
                    className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Reject request"
                  >
                    <XCircle size={17} />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => openConfirm(request._id, "approve")}
                    disabled={!isPending}
                    className="flex items-center justify-center gap-2 border-l border-slate-100 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Approve request"
                  >
                    <CheckCircle2 size={17} />
                    Approve
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        onClose={() => setConfirmState({ open: false, id: null, action: null })}
        onConfirm={handleConfirm}
        title={
          confirmState.action === "approve"
            ? "Approve doctor request?"
            : "Reject doctor request?"
        }
        message={
          confirmState.action === "approve"
            ? "This doctor will be moved to the active provider network immediately."
            : "This request will be marked as rejected and removed from the pending queue."
        }
        confirmText={confirmState.action === "approve" ? "Approve" : "Reject"}
        variant={confirmState.action === "approve" ? "primary" : "danger"}
      />

      <Toast
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast({ message: "", tone: "info" })}
      />

      <Modal
        isOpen={detailsModal.isOpen}
        onClose={closeDetailsModal}
        title="Doctor Request Details"
        className="max-w-6xl"
      >
        {detailsModal.doctor && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100">
                <img
                  src={detailsModal.doctor.image}
                  alt={detailsModal.doctor.name}
                  className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {detailsModal.doctor.name}
                  </h3>
                  <p className="text-sm font-semibold text-blue-600">
                    {detailsModal.doctor.profile?.specialization || "Doctor"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
                <p className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail size={14} className="text-slate-400" />
                  {detailsModal.doctor.email || "-"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone size={14} className="text-slate-400" />
                  {detailsModal.doctor.phone || "-"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-700">
                  <Hospital size={14} className="text-slate-400" />
                  {detailsModal.doctor.profile?.hospital || "-"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin size={14} className="text-slate-400" />
                  {detailsModal.doctor.profile?.clinicAddress ||
                    "Clinic address not provided"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-700">
                  <CalendarDays size={14} className="text-slate-400" />
                  Submitted {formatSubmittedDate(detailsModal.doctor.createdAt)}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Documents
                </p>
                <div className="space-y-2">
                  {detailsModal.documents.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No documents uploaded.
                    </p>
                  ) : (
                    detailsModal.documents.map((document) => (
                      <a
                        key={document.id}
                        href={document.viewerHref}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full rounded-lg bg-white px-3 py-2 text-left text-sm text-slate-700 ring-1 ring-slate-200 transition hover:ring-sky-300"
                        title={document.name}
                      >
                        <span className="block truncate font-medium">
                          {document.name}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-sky-600">
                          Open in new tab
                        </span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 p-6">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Registered Details
              </h4>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Gender
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {detailsModal.doctor.profile?.gender || "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    License Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {detailsModal.doctor.profile?.licenseNumber || "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Clinic Name
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {detailsModal.doctor.profile?.clinicName || "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Availability Type
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {detailsModal.doctor.profile?.availabilityType || "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Bio
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {detailsModal.doctor.profile?.bio || "No bio provided"}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                Click any document name from the left panel or card preview to
                open the PDF in a new tab.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
