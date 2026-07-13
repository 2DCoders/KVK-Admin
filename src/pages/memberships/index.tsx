import { getMembers } from "@/services/members-api";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Mail,
  MoreHorizontal,
  Phone,
  RefreshCcw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

type Member = {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string | null;
  status: string | number;
  gender: number;
  profilePicture: string;
  startDate: string | null;
  endDate: string | null;
  isPaid: boolean;
  membershipStatus: number;
  nicNumber: string | null;
};

type StatusFilter = "all" | "1" | "2";

export default function Memberships() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleFetchMembers = async () => {
    try {
      setIsLoading(true);

      const res = await getMembers();

      setMembers(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchMembers();
  }, []);

  const handleWhatsApp = (member: Member) => {
    if (!member.phone) {
      alert("Phone number not available.");
      return;
    }

    // Convert local Sri Lankan number to international format
    let phone = member.phone.replace(/\D/g, "");

    if (phone.startsWith("0")) {
      phone = "94" + phone.substring(1);
    }

    const message = `Hello ${member.firstName},

      Thank you for registering with KVK Arena! 🎉

      We have received your membership request.

      Our membership features include:

      ✅ Annual Membership Plan
      • Valid for one year
      • Renew after one year

      ✅ Member Benefits
      • 10% discount on every KVK Arena service

      If you have any questions, feel free to reply to this message.

      Thank you,
      KVK Arena Team`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const filteredMembers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const memberStatus = String(member.status);

      const matchesStatus =
        statusFilter === "all" || memberStatus === statusFilter;

      const fullName =
        `${member.firstName ?? ""} ${member.lastName ?? ""}`.toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        member.memberId?.toLowerCase().includes(search) ||
        member.userName?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search) ||
        member.phone?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [members, searchTerm, statusFilter]);

  const pendingCount = members.filter(
    (member) => String(member.status) === "1",
  ).length;

  const approvedCount = members.filter(
    (member) => String(member.status) === "2",
  ).length;

  const handleApproveMember = async (member: Member) => {
    try {
      setApprovingId(member.id);

      /*
       * Replace this section with your approve API call.
       *
       * Example:
       *
       * await approveMember(member.id);
       * await handleFetchMembers();
       */

      // Temporary local update for UI testing.
      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember.id === member.id
            ? {
                ...currentMember,
                status: "2",
              }
            : currentMember,
        ),
      );
    } catch (error) {
      console.error("Failed to approve member:", error);
    } finally {
      setApprovingId(null);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) ?? ""}${
      lastName?.charAt(0) ?? ""
    }`.toUpperCase();
  };

  const getStatusBadge = (status: string | number) => {
    const currentStatus = String(status);

    if (currentStatus === "2") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={13} />
          Approved
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
                <Users size={20} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Memberships
                </h1>
                <p className="text-sm text-slate-500">
                  Review and manage registered arena members.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFetchMembers}
            disabled={isLoading}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Members"
            value={members.length}
            icon={<Users size={20} />}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Pending Approval"
            value={pendingCount}
            icon={<MoreHorizontal size={20} />}
            iconClassName="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Approved Members"
            value={approvedCount}
            icon={<UserCheck size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Table Container */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, ID, username or email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">All statuses</option>
                <option value="1">Pending</option>
                <option value="2">Approved</option>
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Username
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableLoadingRows />
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const isPending = String(member.status) === "1";
                    const isApproving = approvingId === member.id;

                    return (
                      <tr
                        key={member.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {member.profilePicture ? (
                              <img
                                src={member.profilePicture}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                                {getInitials(member.firstName, member.lastName)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {member.firstName} {member.lastName}
                              </p>

                              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                                {member.memberId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            @{member.userName || "N/A"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Mail
                                size={14}
                                className="shrink-0 text-slate-400"
                              />
                              <span className="max-w-[220px] truncate">
                                {member.email || "No email"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Phone
                                size={14}
                                className="shrink-0 text-slate-400"
                              />
                              <span>{member.phone || "Not provided"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {getStatusBadge(member.status)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleWhatsApp(member)}
                              className="inline-flex cursor-pointer h-9 w-9 items-center justify-center rounded-lg bg-green-500 text-white transition hover:bg-green-600"
                              title="Send WhatsApp"
                            >
                              <FaWhatsapp size={18} />
                            </button>

                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleApproveMember(member)}
                                disabled={isApproving}
                                className="inline-flex cursor-pointer h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                              >
                                {isApproving ? (
                                  <>
                                    <RefreshCcw
                                      size={15}
                                      className="animate-spin"
                                    />
                                    Approving
                                  </>
                                ) : (
                                  <>
                                    <Check size={15} />
                                    Approve
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                <CheckCircle2 size={16} />
                                Approved
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {isLoading ? (
              <MobileLoadingCards />
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const isPending = String(member.status) === "1";
                const isApproving = approvingId === member.id;

                return (
                  <article key={member.id} className="p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
                          {getInitials(member.firstName, member.lastName)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-900">
                            {member.firstName} {member.lastName}
                          </h3>

                          <p className="truncate text-xs font-medium text-slate-500">
                            {member.memberId}
                          </p>
                        </div>
                      </div>

                      {getStatusBadge(member.status)}
                    </div>

                    <div className="mb-4 space-y-2 rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          Username
                        </span>

                        <span className="truncate text-sm font-medium text-slate-800">
                          @{member.userName || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          Email
                        </span>

                        <span className="truncate text-sm font-medium text-slate-800">
                          {member.email || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          Phone
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {member.phone || "Not provided"}
                        </span>
                      </div>
                    </div>

                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => handleApproveMember(member)}
                        disabled={isApproving}
                        className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isApproving ? (
                          <>
                            <RefreshCcw size={16} className="animate-spin" />
                            Approving member
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            Approve member
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 size={16} />
                        Membership approved
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Footer */}
          {!isLoading && filteredMembers.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredMembers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {members.length}
                </span>{" "}
                members
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
};

function SummaryCard({ title, value, icon, iconClassName }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function TableLoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-4">
            <div className="flex animate-pulse items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-slate-200" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-slate-200" />
                <div className="h-2.5 w-24 rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-5 py-4">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          </td>

          <td className="px-5 py-4">
            <div className="space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            </div>
          </td>

          <td className="px-5 py-4">
            <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
          </td>

          <td className="px-5 py-4">
            <div className="ml-auto h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

function MobileLoadingCards() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-200" />

            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="h-2.5 w-24 rounded bg-slate-100" />
            </div>
          </div>

          <div className="mb-4 h-28 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-200" />
        </div>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Users size={26} />
      </div>

      <h3 className="font-semibold text-slate-900">No members found</h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        There are no members matching the selected search and status filters.
      </p>
    </div>
  );
}
