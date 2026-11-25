import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export type SmsReport = {
  year: number;
  month: number;
  maintenanceOverage: number;
  acceptedSegments: number;
  system?: {
    accepted: number;
    failed: number;
    pending: number;
    unknown: number;
    acceptedSegments: number;
    maintenanceCharge: number;
  };
  rows: {
    id: string;
    submittedUtc: string;
    promotional: boolean;
    acceptedSegments: number;
    maintenanceCharge: number;
    accepted: number;
    failed: number;
    skipped: number;
    unknown: number;
    pending: number;
  }[];
};

export const reportMonths = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(Date.UTC(2026, index, 1)));

const money = (value: number) => `LKR ${value.toFixed(2)}`;
const sriLankaDateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Colombo",
});

export function downloadSmsReport({ year, month, maintenanceOverage, acceptedSegments, rows, system }: SmsReport) {
  const pdf = new jsPDF();
  const width = pdf.internal.pageSize.getWidth();
  const totals = rows.reduce((sum, row) => ({
    accepted: sum.accepted + row.accepted,
    failed: sum.failed + row.failed,
    skipped: sum.skipped + row.skipped,
    pending: sum.pending + row.pending,
    unknown: sum.unknown + row.unknown,
  }), {
    accepted: system?.accepted ?? 0,
    failed: system?.failed ?? 0,
    skipped: 0,
    pending: system?.pending ?? 0,
    unknown: system?.unknown ?? 0,
  });
  const breakdown = rows.map((row) => [
    sriLankaDateTime.format(new Date(row.submittedUtc)), row.promotional ? "Promotional" : "Direct",
    row.accepted, row.failed, row.skipped, row.pending, row.unknown, row.acceptedSegments,
    row.maintenanceCharge.toFixed(2),
  ]);
  if (system && system.accepted + system.failed + system.pending + system.unknown > 0) {
    breakdown.unshift([
      "Full month", "System", system.accepted, system.failed, 0, system.pending, system.unknown,
      system.acceptedSegments, system.maintenanceCharge.toFixed(2),
    ]);
  }

  pdf.setFontSize(10).setTextColor(49, 91, 234).text("KVK ARENA", 14, 17);
  pdf.setFont("helvetica", "bold").setFontSize(22).setTextColor(15, 23, 42).text("Monthly SMS report", 14, 28);
  pdf.setFont("helvetica", "normal").setFontSize(11).setTextColor(71, 85, 105)
    .text(`${reportMonths[month - 1]} ${year} | Sri Lanka time`, 14, 35);

  pdf.setFillColor(239, 244, 255).roundedRect(14, 42, width - 28, 30, 3, 3, "F");
  pdf.setFontSize(10).setTextColor(30, 64, 175).text("MAINTENANCE OVERAGE", 19, 50);
  pdf.setFont("helvetica", "bold").setFontSize(20).text(money(maintenanceOverage), 19, 59);
  pdf.setFont("helvetica", "normal").setFontSize(9)
    .text("Recorded extra SMS charges for the next maintenance fee.", 19, 66);

  autoTable(pdf, {
    startY: 79,
    theme: "plain",
    head: [["Admin batches", "Accepted segments", "Accepted recipients", "Failed", "Skipped", "Pending", "Unknown"]],
    body: [[rows.length, acceptedSegments, totals.accepted, totals.failed, totals.skipped, totals.pending, totals.unknown]],
    headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontSize: 8 },
    styles: { fontSize: 10, cellPadding: 2.5 },
  });

  pdf.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 23, 42).text("Send breakdown", 14, 106);
  autoTable(pdf, {
    startY: 110,
    head: [["Date / time", "Send type", "Accepted", "Failed", "Skipped", "Pending", "Unknown", "Segments", "Overage (LKR)"]],
    body: breakdown.length
      ? breakdown
      : [[{ content: "No SMS sends were recorded for this month.", colSpan: 9 }]],
    headStyles: { fillColor: [49, 91, 234] },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { bottom: 17 },
  });

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page).setFont("helvetica", "normal").setFontSize(8).setTextColor(100, 116, 139);
    const footer = pdf.internal.pageSize.getHeight() - 8;
    pdf.text(`Generated ${sriLankaDateTime.format(new Date())}`, 14, footer);
    pdf.text(`${page} / ${pages}`, width - 14, footer, { align: "right" });
  }
  pdf.save(`kvk-sms-report-${year}-${String(month).padStart(2, "0")}.pdf`);
}
