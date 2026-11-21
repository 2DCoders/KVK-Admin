import { X } from "lucide-react";
import { useEffect, useState } from "react";
import Dialog from "@/components/ui/dialog";
import { getMemberBookingDetails, type MemberBookingDetails, type MemberSlipReview } from "@/services/badminton-api";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });

function formatDate(date: string | null) {
  return date ? dateFormat.format(new Date(date)) : "—";
}

export default function BookingDetailsDialog({ booking, onClose }: {
  booking: MemberSlipReview;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<MemberBookingDetails | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getMemberBookingDetails(booking.reference, controller.signal)
      .then(result => { if (!controller.signal.aborted) setDetails(result); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [booking.reference]);

  const sessionsByDate = new Map<string, MemberBookingDetails["sessions"]>();
  for (const session of details?.sessions ?? []) {
    const sessions = sessionsByDate.get(session.date);
    if (sessions) sessions.push(session);
    else sessionsByDate.set(session.date, [session]);
  }

  return <Dialog open onClose={onClose} label="Booking details" className="w-[calc(100%-2rem)] max-w-2xl">
    <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Booking details</h2>
        <p className="mt-1 text-sm text-slate-500">{booking.customerName}</p>
      </div>
      <button type="button" className="action-secondary" onClick={onClose} aria-label="Close booking details"><X size={17} /></button>
    </header>
    {failed ? <p role="alert" className="px-5 py-6 text-sm text-red-700">Could not load booking details. Close and reopen to try again.</p>
      : !details ? <p role="status" className="px-5 py-6 text-sm text-slate-500">Loading booking details...</p>
      : !sessionsByDate.size ? <p className="px-5 py-6 text-sm text-slate-500">No schedule is available for this booking.</p>
      : <div className="max-h-[65svh] overflow-y-auto">
        <dl className="grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:grid-cols-4">
          {[
            ["Start date", formatDate(details.startDate)],
            ["End date", formatDate(details.endDate)],
            ["Booked days", sessionsByDate.size],
            ["Time slots", details.sessions.length],
          ].map(([label, value]) => <div key={label}>
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
          </div>)}
        </dl>
        <table className="data-table text-left">
          <thead><tr>
            <th scope="col" className="px-5">Booked day</th>
            <th scope="col" className="px-5">Time slots (SL time)</th>
          </tr></thead>
          <tbody>
            {Array.from(sessionsByDate, ([date, sessions]) => <tr key={date}>
              <td className="px-5">
                <div className="font-semibold text-slate-900">{weekdayFormat.format(new Date(date))}</div>
                <time dateTime={date} className="text-slate-500">{formatDate(date)}</time>
              </td>
              <td className="px-5">
                <ul className="space-y-1 text-slate-700">
                  {sessions.map(({ startTime, endTime }) => <li key={startTime + endTime}>
                    {startTime.slice(0, 5)}–{endTime.slice(0, 5)}
                  </li>)}
                </ul>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
  </Dialog>;
}
