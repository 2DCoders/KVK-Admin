import { useEffect, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { getTrainerApprovalRequests } from "@/services/trainer-approval-api";
import ApprovalRequestsModal from "./approval-requests-modal";

export default function ApprovalRequestsButton({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const refresh = async () => {
    try {
      const requests = await getTrainerApprovalRequests();
      setCount(requests.length);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };
  useEffect(() => {
    let cancelled = false;
    const update = async () => {
      try {
        const requests = await getTrainerApprovalRequests();
        if (!cancelled) { setCount(requests.length); setFailed(false); }
      } catch { if (!cancelled) setFailed(true); }
    };
    void update();
    const onFocus = () => { if (!document.hidden) void update(); };
    const interval = window.setInterval(onFocus, 30000);
    window.addEventListener("focus", onFocus);
    return () => { cancelled = true; window.clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, []);

  return <>
    <button type="button" onClick={() => { setOpen(true); void refresh(); }}
      aria-label={`Trainer Approval Requests, ${failed ? "pending count unavailable" : count === null ? "loading pending count" : `${count} pending`}`}
      title={failed ? "Unable to refresh pending count. Open to view requests." : "View pending trainer approval requests"}
      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50">
      <ClipboardCheck size={16} aria-hidden="true" />
      Trainer Approval Requests
      <span aria-hidden="true" className="flex min-h-6 min-w-6 items-center justify-center rounded-full bg-blue-900 px-1.5 text-xs font-bold text-white">
        {failed ? "?" : count === null ? <Loader2 size={12} className="animate-spin" /> : count}
      </span>
    </button>
    {open && <ApprovalRequestsModal onClose={() => { setOpen(false); void refresh(); }} onApproved={() => { void refresh(); onChanged(); }} />}
  </>;
}
