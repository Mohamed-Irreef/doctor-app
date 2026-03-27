import {
    CheckCircle2,
    Clock3,
    FileBadge2,
    FileText,
    ShieldCheck,
    Stethoscope,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import { DOCTOR_REQUESTS } from "../data/mockData";

export default function DoctorRequestsPage() {
  const [requests, setRequests] = useState(DOCTOR_REQUESTS);
  const [confirmState, setConfirmState] = useState({
    open: false,
    id: null,
    action: null,
  });
  const [toast, setToast] = useState({ message: "", tone: "info" });

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(
      () => setToast({ message: "", tone: "info" }),
      2500,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "Pending").length,
    [requests],
  );

  const openConfirm = (id, action) =>
    setConfirmState({ open: true, id, action });

  const handleConfirm = () => {
    if (!confirmState.id || !confirmState.action) return;

    if (confirmState.action === "approve") {
      setRequests((prev) =>
        prev.filter((request) => request.id !== confirmState.id),
      );
      setToast({
        message: "Doctor approved and moved to live network.",
        tone: "success",
      });
      return;
    }

    setRequests((prev) =>
      prev.map((request) =>
        request.id === confirmState.id
          ? { ...request, status: "Rejected" }
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
            const isPending = request.status === "Pending";

            return (
              <article
                key={request.id}
                className={`panel-card overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
                  isPending ? "ring-2 ring-amber-200" : ""
                }`}
              >
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
                          {request.specialization}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isPending ? "warning" : "danger"}>
                      {request.status}
                    </Badge>
                  </div>

                  <div className="mb-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                    <p>
                      <span className="font-bold text-slate-800">
                        Experience:
                      </span>{" "}
                      {request.experience}
                    </p>
                    <p>
                      <span className="font-bold text-slate-800">
                        Hospital:
                      </span>{" "}
                      {request.hospital}
                    </p>
                    <p>
                      <span className="font-bold text-slate-800">Degrees:</span>{" "}
                      {request.qualifications}
                    </p>
                  </div>

                  <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                      <FileBadge2 size={14} />
                      Documents Preview
                    </p>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-blue-100">
                        <FileText size={14} />
                        Medical Council Certificate.pdf
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-blue-100">
                        <FileText size={14} />
                        MBBS Degree Scan.pdf
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    <FileText size={16} />
                    View all qualifications
                  </Button>
                </div>

                <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/40">
                  <button
                    type="button"
                    onClick={() => openConfirm(request.id, "reject")}
                    disabled={!isPending}
                    className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Reject request"
                  >
                    <XCircle size={17} />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => openConfirm(request.id, "approve")}
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
    </div>
  );
}
