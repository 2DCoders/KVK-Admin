import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import Dialog from "@/components/ui/dialog";
import { getMemberSlip, type MemberSlipReview } from "@/services/badminton-api";

export default function PaymentSlipPreview({ booking, onClose, getErrorMessage }: {
  booking: MemberSlipReview;
  onClose: () => void;
  getErrorMessage: (error: unknown) => string;
}) {
  const { reference, slipRevision, customerName } = booking;
  const [preview, setPreview] = useState<{ url: string; isPdf: boolean } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let url: string | undefined;
    void getMemberSlip(reference, slipRevision, controller.signal).then(slip => {
      if (controller.signal.aborted) return;
      const isPdf = slip.type === "application/pdf";
      if (!isPdf && slip.type !== "image/png" && slip.type !== "image/jpeg") {
        setError("This payment slip format cannot be previewed.");
        return;
      }
      url = URL.createObjectURL(slip);
      setPreview({ url, isPdf });
    }).catch(reason => {
      if (!controller.signal.aborted) setError(getErrorMessage(reason));
    });

    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [reference, slipRevision, getErrorMessage]);

  return <Dialog open onClose={onClose} label="Payment slip preview" className="w-[calc(100%-2rem)] max-w-5xl">
    <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900">Payment slip</h2>
        <p className="break-all text-sm text-gray-500">{customerName}</p>
      </div>
      <button type="button" className="action-secondary" onClick={onClose} aria-label="Close preview"><X size={17} /></button>
    </header>
    {error ? <p className="px-4 py-5 text-sm text-red-700" role="alert">{error}</p>
      : preview ? <div className="bg-gray-50 p-3 sm:p-4">
        {preview.isPdf
          ? <iframe src={preview.url} title="Payment slip PDF" className="h-[60svh] w-full rounded-lg border border-gray-200 bg-white" />
          : <img src={preview.url} alt="Submitted payment slip" className="mx-auto max-h-[60svh] max-w-full rounded-lg object-contain"
              onError={() => setError("This image could not be previewed.")} />}
        {preview.isPdf && <a className="action-secondary mt-3" href={preview.url} target="_blank" rel="noreferrer">
          Open PDF in new tab <ArrowUpRight size={14} />
        </a>}
      </div> : <p className="px-4 py-5 text-sm text-gray-500" role="status">Loading payment slip...</p>}
  </Dialog>;
}
