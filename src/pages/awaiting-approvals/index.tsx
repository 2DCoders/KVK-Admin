import axios from "axios";
import { Check, Download, Eye, RefreshCw, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import PaymentSlipPreview from "./payment-slip-preview";
import { downloadMemberSlip, getMemberSlipReview, reviewMemberSlip, type MemberSlipReview } from "@/services/badminton-api";

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 409 && error.response.data instanceof Blob) {
    return "The customer replaced this slip. Refresh and open the latest version.";
  }
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return "Sign in to KVK Admin again to review payment slips.";
  }
  return axios.isAxiosError(error) && error.response?.data?.message
    ? String(error.response.data.message)
    : "The payment slip request failed. Please try again.";
}

const formatAmount = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" });

export default function AwaitingApprovals() {
  const [preview, setPreview] = useState<MemberSlipReview | null>(null);
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

  async function review(row: MemberSlipReview, approve: boolean) {
    const { reference, slipRevision } = row;
    if (approve && !window.confirm("Approve this booking?")) return;
    const reason = approve ? undefined : rejectionReason.trim();
    if (!approve && !reason) return;
    setBusy(true);
    setError("");
    try {
      const result = await reviewMemberSlip(reference, approve, slipRevision, reason);
      setRows(current => current.filter(row => row.reference !== reference));
      if (rejectReference === reference) setRejectReference(null);
      if (result.smsSent === false) setError("The review was saved, but the SMS could not be sent.");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-container space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-heading">Awaiting approvals</h1>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">Badminton</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Review member bookings and their submitted payment slips.</p>
        </div>
        <button type="button" className="action-secondary" disabled={busy || loading}
          onClick={() => setRefresh(value => value + 1)}>
          <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="surface-panel overflow-hidden" aria-label="Bookings awaiting approval">
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
          {loading ? "Awaiting approval" : `${rows.length} awaiting approval`}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[690px] text-left">
            <thead>
              <tr>
                <th scope="col" className="px-4">Booking reference</th>
                <th scope="col" className="px-4">Customer</th>
                <th scope="col" className="px-4">Amount</th>
                <th scope="col" className="px-4">Payment slip</th>
                <th scope="col" className="px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(loading || rows.length === 0) && <tr>
                <td colSpan={5} className="px-4 text-center text-sm text-gray-500">
                  {loading ? <span role="status">Loading bookings...</span> : error ? "No bookings to display." : "No member bookings awaiting approval."}
                </td>
              </tr>}
              {!loading && rows.map(row => <Fragment key={row.reference}>
                <tr>
                  <td className="px-4 font-mono text-xs text-gray-600">{row.reference}</td>
                  <td className="px-4">
                    <div className="font-semibold text-gray-900">{row.customerName}</div>
                    <div className="text-gray-500">{row.phoneNumber}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 font-semibold">{formatAmount.format(row.finalAmount)}</td>
                  <td className="px-4">
                    {row.hasSlip
                      ? <div className="flex gap-2">
                          <button type="button" className="action-secondary whitespace-nowrap" disabled={busy} onClick={() => setPreview(row)}>
                            <Eye size={14} /> View
                          </button>
                          <button type="button" className="action-secondary" disabled={busy} aria-label="Download payment slip" title="Download payment slip"
                            onClick={() => { setError(""); void downloadMemberSlip(row.reference, row.slipRevision).catch(reason => setError(errorMessage(reason))); }}>
                            <Download size={14} />
                          </button>
                        </div>
                      : <span className="whitespace-nowrap text-gray-500">No payment due</span>}
                  </td>
                  <td className="px-4">
                    <div className="flex gap-2">
                      <button type="button" className="action-primary" disabled={busy} onClick={() => void review(row, true)}>
                        <Check size={14} /> Approve
                      </button>
                      <button type="button" className="action-secondary !text-red-700" disabled={busy}
                        onClick={() => { setRejectReference(row.reference); setRejectionReason(""); }}>
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
                {rejectReference === row.reference && <tr>
                  <td colSpan={5} className="bg-gray-50 px-4">
                    <form className="max-w-xl space-y-2" onSubmit={event => {
                      event.preventDefault();
                      void review(row, false);
                    }}>
                      <label className="block text-sm font-semibold" htmlFor={`reason-${row.reference}`}>Rejection reason (sent to the customer)</label>
                      <textarea id={`reason-${row.reference}`} className="field-control w-full rounded-lg border border-gray-200 bg-white p-3 text-sm"
                        rows={3} required maxLength={200} disabled={busy} value={rejectionReason}
                        onChange={event => setRejectionReason(event.target.value)} />
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" className="action-secondary !text-red-700" disabled={busy || !rejectionReason.trim()}>Reject and send SMS</button>
                        <button type="button" className="action-secondary" disabled={busy} onClick={() => setRejectReference(null)}>Cancel</button>
                      </div>
                    </form>
                  </td>
                </tr>}
              </Fragment>)}
            </tbody>
          </table>
        </div>
      </section>
      {preview && <PaymentSlipPreview booking={preview} onClose={() => setPreview(null)} getErrorMessage={errorMessage} />}
    </div>
  );
}
