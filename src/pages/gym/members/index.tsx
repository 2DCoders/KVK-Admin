import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Eye, RotateCcw, Trash2, X } from "lucide-react";
import {
  getMembers,
  reactivateMember,
  permanentlyDeleteMember,
} from "@/services/gym-members-api";

const paymentStatusLabel = (status: number) => {
  switch (status) {
    case 1:
      return "Pending";
    case 2:
      return "Paid";
    case 3:
      return "Overdue";
    case 4:
      return "Completed";
    case 5:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

export default function GymMembers() {
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMember, setViewMember] = useState<any | null>(null);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getMembers(true);

      const rows =
        response?.additionalData?.response ??
        response?.response ??
        response ??
        [];

      const mapped = Array.isArray(rows)
        ? rows
            .filter((member: any) =>
              (member.membershipNumber ?? "").startsWith("GYM-MEM"),
            )
            .map((member: any) => ({
              id: member.id,
              name: `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim(),
              firstName: member.firstName ?? "",
              lastName: member.lastName ?? "",
              membershipNumber: member.membershipNumber ?? "",
              email: member.email ?? "",
              phoneNumber: member.phoneNumber ?? "",
              dateOfBirth: member.dateOfBirth ?? "",
              membershipStatus: member.membershipStatus ?? "",
              membershipPlanTitle: member.membershipPlanTitle ?? "",
              membershipPlanPrice: member.membershipPlanPrice ?? 0,
              paymentStatus: member.paymentStatus ?? 0,
              assignedTrainer: member.assignedTrainer ?? "",
              rewardPoints: member.rewardPoints ?? 0,
              isDeleted: !!member.isDeleted,
              deletedAt: member.deletedAt ?? null,
              createdDate: member.createdDate ?? null,
            }))
        : [];

      setMembers(mapped);
    } catch {
      setMembers([]);
      setError("Failed to load members.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, tab]);

  const tabFiltered = members.filter((member) =>
    tab === "deleted" ? member.isDeleted : !member.isDeleted,
  );

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredMembers = tabFiltered.filter((member) => {
    if (!normalizedSearchTerm) return true;

    return [member.name, member.membershipNumber, member.email, member.phoneNumber]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  const total = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filteredMembers.slice(start, start + pageSize);

  const activeCount = members.filter((member) => !member.isDeleted).length;
  const deletedCount = members.filter((member) => member.isDeleted).length;

  const handleReactivate = async (id: string) => {
    setActionError("");
    setBusyId(id);
    try {
      await reactivateMember(id);
      await loadMembers();
    } catch {
      setActionError("Failed to reactivate member.");
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this member? This cannot be undone.")) {
      return;
    }

    setActionError("");
    setBusyId(id);
    try {
      await permanentlyDeleteMember(id);
      await loadMembers();
    } catch {
      setActionError("Failed to permanently delete member.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Members
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View gym members and manage soft-deleted records
            </p>
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Search by name, membership no, email, or phone..."
              />
            </div>
          </div>
        </div>

        {actionError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              tab === "active"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setTab("deleted")}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              tab === "deleted"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Deleted ({deletedCount})
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-300">
          <div className="px-4 py-3">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-600 border-b border-gray-100">
                    <th className="py-2 px-3">MEMBER</th>
                    <th className="py-2 px-3">MEMBERSHIP NO</th>
                    <th className="py-2 px-3">PLAN</th>
                    <th className="py-2 px-3">PAYMENT</th>
                    <th className="py-2 px-3">STATUS</th>
                    <th className="py-2 px-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        Loading members...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-gray-100 transition-colors duration-300 hover:bg-gray-50/80"
                      >
                        <td className="py-2 px-3 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center text-sm font-semibold">
                              {member.firstName?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {member.name}
                              </div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top text-gray-700">
                          {member.membershipNumber}
                        </td>
                        <td className="py-2 px-3 align-top text-gray-700">
                          {member.membershipPlanTitle || "-"}
                        </td>
                        <td className="py-2 px-3 align-top">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                            {paymentStatusLabel(member.paymentStatus)}
                          </span>
                        </td>
                        <td className="py-2 px-3 align-top">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              member.isDeleted
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {member.isDeleted ? "Deleted" : member.membershipStatus}
                          </span>
                        </td>
                        <td className="py-2 px-3 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="View"
                              onClick={() => setViewMember(member)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                            >
                              <Eye size={14} />
                            </button>

                            {member.isDeleted && (
                              <>
                                <button
                                  type="button"
                                  title="Reactivate"
                                  disabled={busyId === member.id}
                                  onClick={() => handleReactivate(member.id)}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                                >
                                  <RotateCcw size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete permanently"
                                  disabled={busyId === member.id}
                                  onClick={() => handlePermanentDelete(member.id)}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {total === 0 ? 0 : start + 1} to{" "}
              {Math.min(start + pageSize, total)} of {total} entries
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Rows:</label>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:bg-gray-50"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setPage(index + 1)}
                    className={`px-2 py-1 text-sm rounded-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${page === index + 1 ? "bg-gray-900 text-white" : "bg-white border hover:bg-gray-50"}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMember && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewMember(null);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Member Details</h2>
              <button
                type="button"
                onClick={() => setViewMember(null)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{viewMember.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Membership No</p>
                <p className="font-medium text-gray-900">{viewMember.membershipNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{viewMember.email || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{viewMember.phoneNumber || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">{viewMember.dateOfBirth || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Plan</p>
                <p className="font-medium text-gray-900">
                  {viewMember.membershipPlanTitle || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Status</p>
                <p className="font-medium text-gray-900">
                  {paymentStatusLabel(viewMember.paymentStatus)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Membership Status</p>
                <p className="font-medium text-gray-900">
                  {viewMember.isDeleted ? "Deleted" : viewMember.membershipStatus}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Assigned Trainer</p>
                <p className="font-medium text-gray-900">
                  {viewMember.assignedTrainer || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reward Points</p>
                <p className="font-medium text-gray-900">{viewMember.rewardPoints}</p>
              </div>
              {viewMember.isDeleted && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Deleted At</p>
                  <p className="font-medium text-gray-900">
                    {viewMember.deletedAt ? new Date(viewMember.deletedAt).toLocaleString() : "-"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setViewMember(null)}
                className="cursor-pointer rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
