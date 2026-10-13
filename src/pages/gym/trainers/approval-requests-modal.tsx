import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Eye, Loader2, X } from "lucide-react";
import {
  decideTrainerRequest,
  getTrainerApprovalRequests,
  type TrainerApprovalRequest,
} from "@/services/trainer-approval-api";
import { notify } from "@/lib/notifications";

export default function ApprovalRequestsModal({
  onClose,
  onApproved,
}: {
  onClose: () => void;
  onApproved: () => void;
}) {
  const titleId = useId();
  const [requests, setRequests] = useState<TrainerApprovalRequest[]>([]);
  const [selected, setSelected] = useState<TrainerApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await getTrainerApprovalRequests());
    } catch {
      setError("Failed to load approval requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [busy, onClose]);
  const decide = async (action: "approve" | "reject") => {
    if (!selected?.trainerId || busy) return;
    setBusy(true);
    setDecision(action);
    setError("");
    try {
      const result = await decideTrainerRequest(selected.trainerId, action);
      setRequests((rows) => rows.filter((row) => row.id !== selected.id));
      setSelected(null);
      notify.success(`Trainer profile changes ${action === "approve" ? "approved" : "rejected"}.`);
      if (result.smsSent === false) notify.warning("The decision was saved, but the SMS could not be sent. Please contact the trainer.");
      onApproved();
    } catch {
      setError(`Failed to ${action} request. Please try again.`);
    } finally {
      setBusy(false);
      setDecision(null);
    }
  };
  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              Trainer Approval Requests
            </h2>
            <p className="text-sm text-slate-500">
              Review profile changes submitted from the gym profile.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close approval requests"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-auto p-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
              {!selected && (
                <button
                  type="button"
                  onClick={() => void load()}
                  className="ml-3 underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 size={18} className="animate-spin" />
              Loading requests...
            </p>
          ) : selected ? (
            <div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setSelected(null);
                  setError("");
                }}
                className="mb-4 text-sm text-blue-900 underline"
              >
                Back to requests
              </button>
              {selected.profilePicture && (
                <img
                  src={`data:image/jpeg;base64,${selected.profilePicture}`}
                  alt="Requested trainer profile"
                  className="mb-4 h-24 w-24 rounded-full object-cover"
                />
              )}
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                {[
                  ["First name", selected.firstName],
                  ["Last name", selected.lastName],
                  ["Username", selected.userName],
                  ["Email", selected.email],
                  ["Phone", selected.phoneNumber],
                  ["Specialization", selected.specialization],
                  ["Experience (years)", selected.yearsOfExperience],
                  ["Role", selected.role],
                  ["Freelance", selected.isFreelance ? "Yes" : "No"],
                  ["Submitted", new Date(selected.createdAt).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words font-medium">
                      {value ?? "-"}
                    </dd>
                  </div>
                ))}
              </dl>
              {!selected.trainerId && (
                <p className="mt-4 text-sm text-red-700">
                  This request has no trainer ID and cannot be processed.
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button type="button" disabled={busy || !selected.trainerId} onClick={() => void decide("reject")} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  {busy && decision === "reject" ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                  {busy && decision === "reject" ? "Rejecting..." : "Reject profile changes"}
                </button>
                <button
                  type="button"
                  disabled={busy || !selected.trainerId}
                  onClick={() => void decide("approve")}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy && decision === "approve" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {busy && decision === "approve" ? "Approving..." : "Approve profile changes"}
                </button>
              </div>
            </div>
          ) : (
            !error &&
            (requests.length ? (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {`${request.firstName} ${request.lastName}`.trim() ||
                          request.userName}
                      </p>
                      <p className="break-all text-sm text-slate-500">
                        {request.email}
                      </p>
                      <p className="text-xs text-amber-700">Pending approval</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(request)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      <Eye size={16} />
                      View request
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                No pending trainer approval requests.
              </p>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
