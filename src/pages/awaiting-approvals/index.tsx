import axios from "axios";
import { Check, Copy, Download, EllipsisVertical, Eye, RefreshCw, Search, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import PaymentSlipPreview from "./payment-slip-preview";
import BookingDetailsDialog from "./booking-details-dialog";
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
const formatCreatedDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Colombo" });
const formatCreatedTime = new Intl.DateTimeFormat("en-LK", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Colombo" });

const statusLabels: Record<MemberSlipReview["status"], string> = {
  awaiting_payment: "Awaiting payment",
  awaiting_approval: "Awaiting approval",
  retry_payment: "Awaiting replacement slip",
  expired: "Expired",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const canReview = (row: MemberSlipReview) => row.hasSlip && row.status === "awaiting_approval";

const paymentStatusByBookingStatus: Record<MemberSlipReview["status"], "paid" | "pending" | "not_paid"> = {
  approved: "paid",
  awaiting_approval: "pending",
  awaiting_payment: "not_paid",
  retry_payment: "not_paid",
  expired: "not_paid",
  rejected: "not_paid",
  cancelled: "not_paid",
};

const paymentFilters = [
  { value: "all", label: "All bookings" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "not_paid", label: "Not paid" },
] as const;

export default function AwaitingApprovals() {
  const [preview, setPreview] = useState<MemberSlipReview | null>(null);
  const [details, setDetails] = useState<MemberSlipReview | null>(null);
  const [rows, setRows] = useState<MemberSlipReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [rejectReference, setRejectReference] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const query = search.trim().toLowerCase();
  const filteredRows = rows.filter(row => {
    if (paymentFilter !== "all" && paymentStatusByBookingStatus[row.status] !== paymentFilter) return false;
    if (!query) return true;
    return [row.customerName, row.phoneNumber, row.email, row.couponCode, row.reference, row.reference.replaceAll("-", "")]
      .some(value => value?.toLowerCase().includes(query));
  });
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);

  function changePage(nextPage: number) {
    setRejectReference(null);
    setCopyMessage("");
    setPage(nextPage);
  }

  async function copyReference(reference: string) {
    setCopyMessage("");
    try {
      await navigator.clipboard.writeText(reference);
      setCopyMessage("Booking reference copied.");
    } catch {
      setCopyMessage("Could not copy the booking reference.");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void getMemberSlipReview(controller.signal)
      .then(bookings => { if (!controller.signal.aborted) setRows(bookings); })
      .catch(reason => {
        if (controller.signal.aborted) return;
        setRows([]);
        setError(errorMessage(reason));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  async function review(row: MemberSlipReview, approve: boolean) {
    if (!canReview(row)) return;
    const { reference, slipRevision } = row;
    if (approve && !window.confirm("Approve this booking?")) return;
    const reason = approve ? undefined : rejectionReason.trim();
    if (!approve && !reason) return;
    setBusy(true);
    setError("");
    try {
      const result = await reviewMemberSlip(reference, approve, slipRevision, reason);
      setRejectReference(null);
      setRefresh(value => value + 1);
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
          onClick={() => { setError(""); changePage(currentPage); setRefresh(value => value + 1); }}>
          <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div role="status" className={copyMessage ? "text-right text-sm text-slate-600" : "sr-only"}>{copyMessage}</div>

      <section className="surface-panel overflow-hidden" aria-label="Member badminton bookings">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div role="group" aria-label="Payment status" className="order-2 -mb-px flex flex-wrap gap-x-4 sm:gap-x-6 lg:order-1">
            {paymentFilters.map(filter => (
              <button key={filter.value} type="button" aria-pressed={paymentFilter === filter.value} disabled={busy}
                className="inline-flex min-h-12 items-center whitespace-nowrap border-b-2 border-transparent px-0.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-500 disabled:opacity-50 aria-pressed:border-slate-900 aria-pressed:text-slate-950 sm:min-h-14"
                onClick={() => { setPaymentFilter(filter.value); changePage(1); }}>
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative order-1 mt-3 w-full lg:order-2 lg:my-2 lg:max-w-xs">
            <Search aria-hidden="true" size={16} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-slate-500" />
            <input type="search" aria-label="Search bookings by name, phone, email, coupon, or reference"
              className="field-control w-full border bg-slate-50/60 py-2 pr-3 pl-9 text-slate-900 placeholder:text-slate-500"
              value={search} placeholder="Search bookings" disabled={busy}
              onChange={event => { setSearch(event.target.value); changePage(1); }} />
          </div>
        </div>
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
          {loading ? "Member bookings" : `${filteredRows.length} bookings · ${filteredRows.filter(canReview).length} slips awaiting review`}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[920px] text-left">
            <thead>
              <tr>
                <th scope="col" className="px-4">Customer</th>
                <th scope="col" className="px-4">Created (SL time)</th>
                <th scope="col" className="px-4">Coupon</th>
                <th scope="col" className="px-4">Amount</th>
                <th scope="col" className="px-4">Status</th>
                <th scope="col" className="px-4">Payment slip</th>
                <th scope="col" className="px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(loading || filteredRows.length === 0) && <tr>
                <td colSpan={7} className="px-4 text-center text-sm text-gray-500">
                  {loading ? <span role="status">Loading bookings...</span> : rows.length ? "No bookings match your search or filter." : "No member bookings found."}
                </td>
              </tr>}
              {!loading && pageRows.map(row => <Fragment key={row.reference}>
                <tr>
                  <td className="px-4">
                    <div className="font-semibold text-gray-900">{row.customerName}</div>
                    <div className="text-gray-500">{row.phoneNumber}</div>
                    {row.email && <div className="text-gray-500">{row.email}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4">
                    {row.createdAt ? <time dateTime={row.createdAt}>
                      <span className="block font-semibold text-slate-800">{formatCreatedDate.format(new Date(row.createdAt))}</span>
                      <span className="block text-slate-500">{formatCreatedTime.format(new Date(row.createdAt))}</span>
                    </time> : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4">{row.couponCode || "—"}</td>
                  <td className="whitespace-nowrap px-4 font-semibold">{formatAmount.format(row.finalAmount)}</td>
                  <td className="px-4">{statusLabels[row.status]}</td>
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
                      : <span className="whitespace-nowrap text-gray-500">{row.finalAmount === 0 ? "No payment due" : "No slip uploaded"}</span>}
                  </td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="action-secondary whitespace-nowrap" disabled={busy}
                        onClick={() => setDetails(row)}>View booking details</button>
                      <button type="button" className="action-secondary" disabled={busy}
                        aria-label={`Booking actions for ${row.customerName}`} popoverTarget={`booking-actions-${row.reference}`}>
                        <EllipsisVertical size={16} />
                      </button>
                      <div id={`booking-actions-${row.reference}`} popover="auto"
                        className="rounded-lg border border-gray-200 bg-white p-1 shadow-lg [@supports(position-area:bottom):m-0] mt-1"
                        style={{ positionArea: "bottom span-left", positionTryFallbacks: "flip-block" }}>
                        <button type="button" className="action-secondary w-full whitespace-nowrap !justify-start !border-transparent" disabled={busy}
                          onClick={event => {
                            event.currentTarget.parentElement?.hidePopover();
                            void copyReference(row.reference);
                          }}>
                          <Copy size={14} /> Copy reference
                        </button>
                        {canReview(row) && <>
                        <button type="button" className="action-secondary w-full !justify-start !border-transparent" disabled={busy}
                          onClick={event => {
                            event.currentTarget.parentElement?.hidePopover();
                            void review(row, true);
                          }}>
                          <Check size={14} /> Approve
                        </button>
                        <button type="button" className="action-secondary w-full !justify-start !border-transparent !text-red-700" disabled={busy}
                          onClick={event => {
                            event.currentTarget.parentElement?.hidePopover();
                            setRejectReference(row.reference);
                            setRejectionReason("");
                          }}>
                          <X size={14} /> Reject
                        </button>
                        </>}
                      </div>
                    </div>
                  </td>
                </tr>
                {canReview(row) && rejectReference === row.reference && <tr>
                  <td colSpan={7} className="bg-gray-50 px-4">
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
        {!loading && filteredRows.length > 0 && (
          <nav aria-label="Booking pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
            <span>Showing {pageStart + 1}–{Math.min(pageStart + pageSize, filteredRows.length)} of {filteredRows.length} bookings</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                Rows per page
                <select className="field-control rounded-md border border-gray-200 px-2 py-1" value={pageSize} disabled={busy}
                  onChange={event => { setPageSize(Number(event.target.value)); changePage(1); }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </label>
              <button type="button" className="action-secondary" disabled={busy || currentPage === 1}
                onClick={() => changePage(currentPage - 1)}>Previous</button>
              <span>Page {currentPage} of {pageCount}</span>
              <button type="button" className="action-secondary" disabled={busy || currentPage === pageCount}
                onClick={() => changePage(currentPage + 1)}>Next</button>
            </div>
          </nav>
        )}
      </section>
      {preview && <PaymentSlipPreview booking={preview} onClose={() => setPreview(null)} getErrorMessage={errorMessage} />}
      {details && <BookingDetailsDialog key={details.reference} booking={details} onClose={() => setDetails(null)} />}
    </div>
  );
}
