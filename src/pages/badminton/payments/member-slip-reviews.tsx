import axios from "axios";
import { useEffect, useState } from "react";
import { downloadMemberSlip, getMemberSlipReview, reviewMemberSlip, type MemberSlipReview } from "@/services/badminton-api";

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return "Sign in to KVK Admin again to review payment slips.";
  }
  return axios.isAxiosError(error) && error.response?.data?.message
    ? String(error.response.data.message)
    : "The payment slip request failed. Please try again.";
}

export default function MemberSlipReviews({ onApproved }: { onApproved: () => void }) {
  const [rows, setRows] = useState<MemberSlipReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [rejectReference, setRejectReference] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void getMemberSlipReview(controller.signal)
      .then(setRows)
      .catch(reason => { if (!controller.signal.aborted) setError(errorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  async function review(reference: string, approve: boolean) {
    if (approve && !window.confirm("Approve this booking?")) return;
    const reason = approve ? undefined : rejectionReason.trim();
    if (!approve && !reason) return;
    setBusy(true);
    setError("");
    try {
      const result = await reviewMemberSlip(reference, approve, reason);
      setRows(current => current.filter(row => row.reference !== reference));
      if (approve) onApproved();
      if (rejectReference === reference) setRejectReference(null);
      if (result.smsSent === false) setError("The review was saved, but the SMS could not be sent.");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return <section className="mb-6 space-y-3 rounded-md border border-gray-200 bg-white p-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Member badminton bookings awaiting approval</h2>
      <button type="button" className="rounded border px-3 py-1" disabled={busy || loading}
        onClick={() => setRefresh(value => value + 1)}>Refresh</button>
    </div>
    {loading && <p role="status">Loading bookings...</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!loading && !error && rows.length === 0 && <p>No bookings awaiting approval.</p>}
    {rows.map(row => <div key={row.reference} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
      <div>
        <p className="font-medium">{row.customerName} ? {row.phoneNumber}</p>
        <p className="text-sm">Ref {row.reference} ? LKR {row.finalAmount.toFixed(2)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {row.hasSlip ? <button type="button" className="rounded border px-3 py-1" disabled={busy}
          onClick={() => { setError(""); void downloadMemberSlip(row.reference).catch(reason => setError(errorMessage(reason))); }}>Download slip</button>
          : <span>No payment due</span>}
        <button type="button" className="rounded border px-3 py-1 text-green-800" disabled={busy}
          onClick={() => void review(row.reference, true)}>Approve</button>
        <button type="button" className="rounded border px-3 py-1 text-red-700" disabled={busy}
          onClick={() => { setRejectReference(row.reference); setRejectionReason(""); }}>Reject</button>
      </div>
      {rejectReference === row.reference && <form className="w-full space-y-2" onSubmit={event => {
        event.preventDefault();
        void review(row.reference, false);
      }}>
        <label className="block text-sm font-medium" htmlFor={`reason-${row.reference}`}>Rejection reason (sent to the customer)</label>
        <textarea id={`reason-${row.reference}`} className="w-full rounded border p-2" rows={3} required maxLength={200}
          disabled={busy} value={rejectionReason} onChange={event => setRejectionReason(event.target.value)} />
        <div className="flex gap-2">
          <button type="submit" className="rounded border px-3 py-1 text-red-700" disabled={busy || !rejectionReason.trim()}>Reject and send SMS</button>
          <button type="button" className="rounded border px-3 py-1" disabled={busy} onClick={() => setRejectReference(null)}>Cancel</button>
        </div>
      </form>}
    </div>)}
  </section>;
}
