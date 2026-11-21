import axios from "axios";
import { BarChart3, CalendarDays, ChevronDown, ClipboardList, Download, MessageSquare, Plus, RefreshCw, Search, Send, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getEnv } from "@/env";
import type { SmsReport } from "./report";

type Contact = { id: string; name: string; phone: string };
type Group = { id: string; name: string; memberIds: string[] };
type Recipient = { phone: string; name: string | null; status: string };
type Settings = { price: number; length: number; monthlyLimit: number; maxSegments: number };
type Draft = { message: string; memberIds: string[]; phoneNumbers: string[]; groupId: string | null };
type Preview = {
  token: string;
  quote: {
    message: string; recipients: Recipient[]; groupName: string | null; segments: number;
    used: number; total: number; excess: number; charge: number; settings: Settings; billingMonth: string;
  };
};
type Batch = {
  id: string; adminName: string | null; submittedUtc: string; message: string; groupName: string | null;
  segmentsPerRecipient: number; acceptedSegments: number; maintenanceCharge: number; recipients: Recipient[];
};
type History = {
  settings: Settings; month: string; accepted: number; reserved: number; excess: number;
  charge: number; items: Batch[]; hasMore: boolean;
};

const env = getEnv();
const defaults: Settings = {
  price: env.SMS_PRICE_LKR, length: env.SMS_LENGTH, monthlyLimit: env.SMS_MONTHLY_LIMIT,
  maxSegments: env.SMS_MAX_SEGMENTS_PER_MESSAGE,
};
const api = axios.create({ baseURL: `${env.API_URL}identity/admin-sms/` });
api.interceptors.request.use((request) => {
  const admin = JSON.parse(localStorage.getItem("admin") ?? "null");
  if (admin?.token) request.headers.Authorization = `Bearer ${admin.token}`;
  return request;
});

const gsm = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const extended = "\f^{}\\[~]|€";

function countSegments(message: string, length: number) {
  const characters = Array.from(message.trim());
  const standard = characters.every((char) => gsm.includes(char) || extended.includes(char));
  const sizes = characters.map((char) => standard && extended.includes(char) ? 2 : char.length);
  const units = sizes.reduce((total, size) => total + size, 0);
  if (!units) return 0;
  const single = standard ? Math.max(8, Math.min(160, length)) : 70;
  if (units <= single) return 1;
  const capacity = single - (standard ? 7 : 3);
  let segments = 1;
  let offset = 0;
  for (const size of sizes) {
    if (offset + size > capacity) {
      segments++;
      offset = 0;
    }
    offset += size;
  }
  return segments;
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return "Sign in again to refresh your admin access.";
    return error.response?.data?.message ?? error.response?.data?.title ?? error.message;
  }
  return "The SMS request could not be completed.";
}

const money = (value: number) => `LKR ${value.toFixed(2)}`;
const panel = "surface-panel min-w-0 p-4 sm:p-6";
const field = "field-control mt-2 w-full border bg-white px-3 py-2 text-sm text-slate-900";
const button = "action-secondary";
const primary = "action-primary";
const tabs = [
  { label: "Send SMS", icon: Send },
  { label: "Promotional Groups", icon: Users },
  { label: "History & Usage", icon: ClipboardList },
];
const localMobileNumber = /^07[0-9]{8}$/;
const phoneFormatMessage = "Enter a 10-digit mobile number starting with 07.";
const monthNames = new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" });
const currentBillingPeriod = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Colombo", year: "numeric", month: "2-digit",
}).formatToParts().reduce((period, part) => ({
  year: part.type === "year" ? Number(part.value) : period.year,
  month: part.type === "month" ? Number(part.value) : period.month,
}), { year: 2026, month: 1 });

function ContactPicker({ contacts, selected, change }: {
  contacts: Contact[]; selected: string[]; change: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const matching = contacts.filter((contact) =>
    `${contact.name} ${contact.phone}`.toLowerCase().includes(search.toLowerCase().trim()));
  return <div className="space-y-3">
    <div className="relative">
      <Search size={16} aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 text-slate-400" />
      <input type="search" aria-label="Search coupon contacts" placeholder="Search by name or phone"
        className={`${field} !mt-0 !pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={button} disabled={!matching.length}
        onClick={() => change([...new Set([...selected, ...matching.map((contact) => contact.id)])])}>Select all results</button>
      <button type="button" className={button} disabled={!selected.length} onClick={() => change([])}>Unselect all</button>
      <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{selected.length} selected</span>
    </div>
    <div role="region" aria-label="Contact list" tabIndex={matching.length > 5 ? 0 : undefined}
      className="max-h-60 divide-y divide-slate-200 overflow-y-auto overscroll-y-contain rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      {matching.length === 0 && <p className="p-3 text-sm">No matching coupon contacts.</p>}
      {matching.map((contact) => <label key={contact.id} className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 border-l-2 border-transparent px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 has-[:checked]:border-l-blue-600 has-[:checked]:bg-blue-50/60">
        <input type="checkbox" className="size-4 accent-blue-600" checked={selected.includes(contact.id)} onChange={(event) =>
          change(event.target.checked ? [...selected, contact.id] : selected.filter((id) => id !== contact.id))} />
        <span className="font-medium text-slate-800">{contact.name}</span><span className="ml-auto text-xs tabular-nums text-slate-500">{contact.phone}</span>
      </label>)}
    </div>
  </div>;
}

function BatchDetails({ batch }: { batch: Batch }) {
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const previewLimit = 5;
  const visibleRecipients = showAllRecipients ? batch.recipients : batch.recipients.slice(0, previewLimit);
  const counts = ["Accepted", "Failed", "Skipped", "Unknown", "Pending"].map((status) =>
    ({ status, count: batch.recipients.filter((recipient) => recipient.status === status).length }));
  const Icon = batch.groupName ? Users : MessageSquare;
  return <details className="group rounded-lg border border-slate-200 bg-white open:bg-slate-50/60">
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Icon size={14} aria-hidden="true" /></span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="min-w-0 break-words text-sm font-semibold text-slate-900">{batch.groupName ?? "Direct SMS"}</span>
        <time dateTime={batch.submittedUtc} className="whitespace-nowrap text-xs text-slate-500">
          {new Date(batch.submittedUtc).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" })}
        </time>
        <span className="flex flex-wrap gap-1.5">
          {counts.filter(({ status, count }) => status === "Accepted" || count > 0).map(({ status, count }) =>
            <span key={status} className={`rounded-full px-2 py-0.5 text-xs font-medium ${status === "Failed" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}>
              {count} {status.toLowerCase()}
            </span>)}
        </span>
      </span>
      <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
    </summary>
    <div className="space-y-3 border-t border-slate-200 p-3 sm:p-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <h3 className="text-xs font-semibold text-slate-600">Message</h3>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{batch.message}</p>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {[
            ["Segments per recipient", batch.segmentsPerRecipient],
            ["Accepted segments", batch.acceptedSegments],
            ["Maintenance charge", money(batch.maintenanceCharge)],
          ].map(([label, value]) => <div key={label} className="min-w-0 px-2 py-2.5 sm:px-3">
            <dt className="text-xs text-slate-600">{label}</dt>
            <dd className={`mt-1 break-words text-sm font-semibold tabular-nums ${label === "Maintenance charge" && batch.maintenanceCharge > 0 ? "text-amber-800" : "text-slate-900"}`}>{value}</dd>
          </div>)}
        </dl>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <h3 className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">Recipient outcomes</h3>
        <ul className="max-h-56 divide-y divide-slate-200 overflow-y-auto text-sm">
          {visibleRecipients.map((recipient, index) => <li key={index} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              {recipient.name && <span className="break-all font-medium text-slate-900">{recipient.name}</span>}
              {recipient.phone && <span className="text-xs tabular-nums text-slate-600">{recipient.phone}</span>}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${recipient.status === "Failed" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}>{recipient.status}</span>
          </li>)}
        </ul>
        {batch.recipients.length > previewLimit && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
          <span className="text-xs text-slate-500">{visibleRecipients.length} of {batch.recipients.length} recipients</span>
          <button type="button" className={button} aria-expanded={showAllRecipients}
            onClick={() => setShowAllRecipients((value) => !value)}>
            {showAllRecipients ? "Show fewer" : `View all ${batch.recipients.length} recipients`}
          </button>
        </div>}
      </div>
      <p className="break-words text-xs text-slate-500">Sent by <span className="font-medium text-slate-700">{batch.adminName || "Name unavailable"}</span></p>
    </div>
  </details>;
}

export default function AdminSms() {
  const [tab, setTab] = useState("Send SMS");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [history, setHistory] = useState<History>();
  const [page, setPage] = useState(1);
  const [reportPeriod, setReportPeriod] = useState(currentBillingPeriod);
  const [draft, setDraft] = useState<Draft>({ message: "", memberIds: [], phoneNumbers: [], groupId: null });
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [group, setGroup] = useState<Group>({ id: "", name: "", memberIds: [] });
  const [confirmation, setConfirmation] = useState<(Preview & { id: string; draft: Draft })>();
  const [result, setResult] = useState<Batch>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const settings = history?.settings ?? defaults;
  const segments = countSegments(draft.message, settings.length);

  useEffect(() => {
    Promise.all([api.get<Contact[]>("contacts"), api.get<Group[]>("groups")])
      .then(([directory, saved]) => { setContacts(directory.data); setGroups(saved.data); })
      .catch((failure) => setError(errorMessage(failure)));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    api.get<History>("history", { params: { page: 1 }, signal: controller.signal })
      .then(({ data }) => setHistory(data))
      .catch((failure) => { if (!controller.signal.aborted) setError(errorMessage(failure)); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (confirmation && !dialog.current?.open) dialog.current?.showModal();
    if (!confirmation && dialog.current?.open) dialog.current.close();
  }, [confirmation]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try { await action(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }

  function addPhone() {
    if (!localMobileNumber.test(phone)) {
      setPhoneError(phoneFormatMessage);
      return;
    }
    setDraft({ ...draft, phoneNumbers: [...new Set([...draft.phoneNumbers, phone])] });
    setPhone("");
    setPhoneError("");
  }

  async function refreshHistory(targetPage: number) {
    const { data } = await api.get<History>("history", { params: { page: targetPage } });
    setHistory(data);
    setPage(targetPage);
  }

  function downloadReport() {
    return run(async () => {
      const [{ data }, { downloadSmsReport }] = await Promise.all([
        api.get<SmsReport>("report", { params: reportPeriod }),
        import("./report"),
      ]);
      downloadSmsReport(data);
    });
  }

  function review() {
    if (!draft.groupId && phone && !localMobileNumber.test(phone)) {
      setPhoneError(phoneFormatMessage);
      return;
    }
    const input = { ...draft, phoneNumbers: phone && !draft.groupId
      ? [...draft.phoneNumbers, phone] : draft.phoneNumbers };
    return run(async () => {
      const { data } = await api.post<Preview>("quote", input);
      setConfirmation({ ...data, id: crypto.randomUUID(), draft: input });
    });
  }

  function send() {
    if (!confirmation) return;
    return run(async () => {
      const response = await api.post<Batch | (Preview & { message: string })>("send", {
        id: confirmation.id, quoteToken: confirmation.token, draft: confirmation.draft,
      }, { validateStatus: (status) => status === 200 || status === 409 });
      if ("quote" in response.data) {
        setConfirmation({ ...confirmation, ...response.data });
        setError(response.data.message);
        return;
      }
      setResult(response.data);
      setConfirmation(undefined);
      setDraft({ message: "", memberIds: [], phoneNumbers: [], groupId: null });
      setPhone("");
      setPhoneError("");
      await refreshHistory(1);
    });
  }

  function saveGroup() {
    return run(async () => {
      const id = group.id || crypto.randomUUID();
      const { data } = await api.put<Group>(`groups/${id}`, group);
      setGroups((current) => [...current.filter((item) => item.id !== id), data]
        .sort((a, b) => a.name.localeCompare(b.name)));
      setGroup(data);
      setNotice("Promotional group saved.");
    });
  }

  const usagePercent = settings.monthlyLimit > 0
    ? Math.min(100, ((history?.accepted ?? 0) / settings.monthlyLimit) * 100)
    : 0;
  const currentPeriod = currentBillingPeriod();
  const [billingYear, billingMonth] = history?.month.split("-").map(Number) ?? [currentPeriod.year, currentPeriod.month];
  const billingPeriodLabel = `${monthNames.format(Date.UTC(billingYear, billingMonth - 1, 1))} ${billingYear}`;

  return <section className="min-w-0 space-y-5">
    <div className="surface-panel overflow-hidden">
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
      <div>
        <h1 className="page-heading">SMS</h1>
        <p className="mt-1 text-sm text-slate-500">Send customer messages, manage promotional groups, and track SMS costs.</p>
      </div>
      <div className="ml-auto flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <CalendarDays size={15} aria-hidden="true" />
        </div>
        <div>
          <div className="text-[11px] font-medium leading-tight text-slate-500">Current billing period</div>
          <time dateTime={`${billingYear}-${String(billingMonth).padStart(2, "0")}`} className="mt-0.5 block text-sm font-semibold leading-tight text-slate-900">
            {billingPeriodLabel}
          </time>
        </div>
      </div>
    </header>
    <div className="grid border-t border-slate-200 bg-slate-50/60 sm:grid-cols-3">
      <div className="p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-slate-600"><BarChart3 size={16} aria-hidden="true" className="text-slate-500" /> Monthly usage</h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{history?.accepted ?? "–"} <span className="text-sm font-medium text-slate-500">/ {settings.monthlyLimit} included segments</span></p>
        <div aria-hidden="true" className="mt-3 h-1.5 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[#315bea] transition-all" style={{ width: `${usagePercent}%` }} />
        </div>
        {!!history && history.reserved > history.accepted && <p className="mt-2 text-xs text-slate-600">{history.reserved - history.accepted} segments awaiting an outcome</p>}
      </div>
      <div className="border-t border-slate-200 p-4 sm:border-l sm:border-t-0 sm:p-6">
        <h2 className="text-xs font-semibold text-slate-500">Extra segment rate</h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{money(settings.price)}</p>
        <p className="mt-1 text-xs text-slate-500">Per segment above the allowance</p>
      </div>
      <div className="border-t border-slate-200 p-4 sm:border-l sm:border-t-0 sm:p-6">
        <h2 className="text-xs font-semibold text-slate-500">Maintenance overage</h2>
        <p className={`mt-2 text-2xl font-bold tracking-tight ${history?.excess ? "text-amber-800" : "text-slate-900"}`}>{history ? money(history.charge) : "–"}</p>
        <p className="mt-1 text-xs text-slate-500">{history?.excess
          ? `${history.excess} extra ${history.excess === 1 ? "segment" : "segments"} · Added to your next maintenance fee`
          : "For the current billing month"}</p>
      </div>
    </div>
    </div>
    <nav aria-label="SMS sections" className="flex flex-wrap gap-x-4 border-b border-slate-200 sm:gap-x-6">
      {tabs.map(({ label, icon: Icon }) =>
        <button key={label} type="button" aria-pressed={tab === label}
          className="-mb-px inline-flex min-h-11 items-center gap-1.5 border-b-2 border-transparent px-0.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-700 aria-pressed:border-blue-600 aria-pressed:text-blue-700"
          onClick={() => { setTab(label); setError(""); setNotice(""); }}><Icon size={14} aria-hidden="true" />{label}</button>)}
    </nav>
    {error && !confirmation && <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {tab === "Send SMS" && <div className="grid items-start gap-5 xl:grid-cols-2">
      <div className="surface-panel min-w-0 overflow-hidden shadow-md shadow-slate-200/70">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
          <Users size={18} aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">Recipients</h2>
      </header>
      <div className="space-y-4 p-4 sm:p-6">
      <label className="block text-sm font-medium">Send to
        <select className={field} value={draft.groupId ?? ""} onChange={(event) =>
          setDraft({ ...draft, groupId: event.target.value || null })}>
          <option value="">Individual recipients</option>
          {groups.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.memberIds.length})</option>)}
        </select>
      </label>
      {!draft.groupId && <>
        <ContactPicker contacts={contacts} selected={draft.memberIds}
          change={(memberIds) => setDraft({ ...draft, memberIds })} />
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 sm:flex-nowrap">
          <input type="tel" inputMode="numeric" maxLength={10} aria-label="Mobile number" placeholder="07XXXXXXXX"
            aria-invalid={!!phoneError} aria-describedby={phoneError ? "sms-phone-error" : undefined}
            className={`${field} min-w-0 !mt-0`} value={phone}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^0-9]/g, "").slice(0, 10);
              if (digits && !digits.startsWith("0")) {
                setPhoneError(phoneFormatMessage);
                return;
              }
              setPhone(digits);
              setPhoneError("");
            }}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addPhone(); } }} />
          <button type="button" className={`${button} shrink-0`} onClick={addPhone}><Plus size={15} /> Add number</button>
        </div>
        {phoneError && <p id="sms-phone-error" role="alert" className="text-sm text-red-700">{phoneError}</p>}
        <div className="flex flex-wrap gap-2">
          {draft.phoneNumbers.map((number) => <button type="button" key={number} className={button}
            aria-label={`Remove ${number}`} onClick={() =>
              setDraft({ ...draft, phoneNumbers: draft.phoneNumbers.filter((item) => item !== number) })}>{number} ×</button>)}
        </div>
      </>}
      </div>
      </div>
      <div className={`${panel} space-y-4`}>
      <label className="block">
        <span className="flex items-center gap-2 text-base font-semibold text-slate-900"><MessageSquare size={18} className="text-blue-600" /> Message</span>
        <textarea className={`${field} resize-y !mt-4 !bg-slate-50/60`} placeholder="Write your SMS…" rows={7} maxLength={1500} value={draft.message} onChange={(event) => {
          const message = event.target.value;
          if (countSegments(message, settings.length) <= settings.maxSegments || message.length < draft.message.length)
            setDraft({ ...draft, message });
        }} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-xs tabular-nums text-slate-500" aria-live="polite">{Array.from(draft.message).length} characters · {segments} / {settings.maxSegments} segments</p>
      <button type="button" className={primary} disabled={busy || !segments || segments > settings.maxSegments ||
        !(draft.groupId || draft.memberIds.length || draft.phoneNumbers.length || phone.trim())} onClick={review}><Send size={15} /> Review SMS</button>
      </div>
      </div>
      {result && <div className="space-y-2 xl:col-span-2"><h2 className="font-semibold">Latest send summary</h2><BatchDetails batch={result} /></div>}
    </div>}
    {tab === "Promotional Groups" && <div className={`${panel} space-y-4`}>
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Users size={18} className="text-blue-600" /> Group details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">Saved group
        <select className={field} value={group.id} onChange={(event) =>
          setGroup(groups.find((item) => item.id === event.target.value) ?? { id: "", name: "", memberIds: [] })}>
          <option value="">New group</option>
          {groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">Group name
        <input className={field} maxLength={100} value={group.name}
          onChange={(event) => setGroup({ ...group, name: event.target.value })} />
      </label>
      </div>
      <ContactPicker key={group.id} contacts={contacts} selected={group.memberIds}
        change={(memberIds) => setGroup({ ...group, memberIds })} />
      <button type="button" className={primary} disabled={busy || !group.name.trim()} onClick={saveGroup}>Save group</button>
    </div>}
    {tab === "History & Usage" && <div className="surface-panel min-w-0 overflow-hidden shadow-md shadow-slate-200/70">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100"><ClipboardList size={18} aria-hidden="true" /></span>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Send history</h2>
        </div>
        <button type="button" className={button} disabled={busy} onClick={() => run(() => refreshHistory(page))}><RefreshCw size={15} /> Refresh</button>
      </header>
      <div className="space-y-4 p-4 sm:p-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Monthly SMS report</h3>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-slate-700">Year
          <select className={field} value={reportPeriod.year} disabled={busy} onChange={(event) => {
            const year = Number(event.target.value);
            setReportPeriod({ year, month: year === currentPeriod.year ? Math.min(reportPeriod.month, currentPeriod.month) : reportPeriod.month });
          }}>
            {Array.from({ length: currentPeriod.year - 2026 + 1 }, (_, index) => currentPeriod.year - index)
              .map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">Month
          <select className={field} value={reportPeriod.month} disabled={busy} onChange={(event) =>
            setReportPeriod({ ...reportPeriod, month: Number(event.target.value) })}>
            {Array.from({ length: reportPeriod.year === currentPeriod.year ? currentPeriod.month : 12 }, (_, index) =>
              <option key={index} value={index + 1}>{monthNames.format(Date.UTC(2026, index, 1))}</option>)}
          </select>
        </label>
        <button type="button" className={primary} disabled={busy} onClick={downloadReport}>
          <Download size={15} /> Download PDF report
        </button>
      </div>
      </div>
      {history?.items.length === 0 && <p>No SMS sends recorded yet.</p>}
      <div className="space-y-2">
        {history?.items.map((batch) => <BatchDetails key={batch.id} batch={batch} />)}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <button type="button" className={button} disabled={page <= 1 || busy} onClick={() => run(() => refreshHistory(page - 1))}>Previous</button>
        <span>Page {page}</span>
        <button type="button" className={button} disabled={!history?.hasMore || busy} onClick={() => run(() => refreshHistory(page + 1))}>Next</button>
      </div>
      </div>
    </div>}
    <dialog ref={dialog} aria-labelledby="sms-confirm-title"
      className="surface-panel m-auto max-h-[85vh] w-11/12 max-w-lg p-6 text-slate-900 backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
      onCancel={(event) => { event.preventDefault(); if (!busy) setConfirmation(undefined); }}>
      {confirmation && <div className="space-y-3">
        <h2 id="sms-confirm-title" className="flex items-center gap-2 text-lg font-semibold"><Send size={18} className="text-blue-600" /> Confirm SMS send</h2>
        <p className="whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3">{confirmation.quote.message}</p>
        <p>{confirmation.quote.recipients.filter((recipient) => recipient.status === "Pending").length} recipients · {confirmation.quote.segments} segments each · {confirmation.quote.total} total segments</p>
        <p>{Math.max(0, confirmation.quote.settings.monthlyLimit - confirmation.quote.used)} included segments available before this send.</p>
        <details>
          <summary className="cursor-pointer">Review recipients</summary>
          <ul className="max-h-40 overflow-auto text-sm">
            {confirmation.quote.recipients.map((recipient, index) => <li key={index}>
              {[recipient.name, recipient.phone, recipient.status === "Skipped" ? "Skipped" : ""].filter(Boolean).join(" · ")}
            </li>)}
          </ul>
        </details>
        {confirmation.quote.excess > 0 && <p className="rounded-md bg-amber-50 p-3 text-amber-900">
          {confirmation.quote.excess} extra segments cost an estimated {money(confirmation.quote.charge)}. The additional charge will be added to your next maintenance fee.
        </p>}
        {error && <p role="alert" className="text-red-800">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={button} disabled={busy} onClick={() => setConfirmation(undefined)}>Cancel</button>
          <button type="button" className={primary} disabled={busy} onClick={send}>{busy ? "Sending…" : "Confirm & send"}</button>
        </div>
      </div>}
    </dialog>
  </section>;
}
