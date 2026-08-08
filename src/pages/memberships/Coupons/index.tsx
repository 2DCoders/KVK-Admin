import { getMembers } from "@/services/members-api";
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  RefreshCcw,
  Search,
  TicketPercent,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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

type CouponMember = Member & {
  couponCode: string;
};

export default function MembershipCoupons() {
  const navigate = useNavigate();

  const [members, setMembers] = useState<CouponMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /*
   * Temporary frontend coupon generator.
   *
   * Example:
   * KVK-DASU-4F72
   *
   * Later, when your backend has a coupon API,
   * replace this function/API mapping with the
   * coupon code returned by the server.
   */
  const generateCouponCode = (member: Member) => {
    const namePart = (member.firstName || "MEMBER")
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 4)
      .toUpperCase()
      .padEnd(4, "X");

    const idSource = member.memberId || member.id;

    const idPart = idSource
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-4)
      .toUpperCase();

    return `KVK-${namePart}-${idPart}`;
  };

  const handleFetchMembers = async () => {
    try {
      setIsLoading(true);

      const res = await getMembers();

      const memberList: Member[] = Array.isArray(res) ? res : [];

      /*
       * Only approved members receive coupons.
       *
       * membershipStatus
       * 1 = Approved
       * 2 = Pending
       */
      const approvedMembers = memberList.filter(
        (member) => String(member.membershipStatus) === "1",
      );

      const couponMembers: CouponMember[] = approvedMembers.map((member) => ({
        ...member,
        couponCode: generateCouponCode(member),
      }));

      setMembers(couponMembers);
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

  /*
   * Search
   */
  const filteredMembers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return members;
    }

    return members.filter((member) => {
      const fullName =
        `${member.firstName ?? ""} ${member.lastName ?? ""}`.toLowerCase();

      return (
        fullName.includes(search) ||
        member.memberId?.toLowerCase().includes(search) ||
        member.userName?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search) ||
        member.phone?.toLowerCase().includes(search) ||
        member.couponCode.toLowerCase().includes(search)
      );
    });
  }, [members, searchTerm]);

  /*
   * Pagination
   */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / itemsPerPage),
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  const showingFrom =
    filteredMembers.length === 0 ? 0 : startIndex + 1;

  const showingTo = Math.min(endIndex, filteredMembers.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /*
   * Copy coupon
   */
  const handleCopyCoupon = async (couponCode: string) => {
    try {
      await navigator.clipboard.writeText(couponCode);

      setCopiedCoupon(couponCode);

      setTimeout(() => {
        setCopiedCoupon((current) =>
          current === couponCode ? null : current,
        );
      }, 2000);
    } catch (error) {
      console.error("Unable to copy coupon:", error);
    }
  };

  /*
   * WhatsApp
   */
  const handleWhatsApp = (member: CouponMember) => {
    if (!member.phone) {
      alert("Phone number not available.");
      return;
    }

    let phone = member.phone.replace(/\D/g, "");

    // Sri Lankan local number → international number
    if (phone.startsWith("0")) {
      phone = "94" + phone.substring(1);
    }

    const message = `Hello ${member.firstName},

Thank you for being a valued KVK Arena member! 🎉

Here is your exclusive member coupon:

🎟 Coupon Code: ${member.couponCode}

You can use this coupon to receive your KVK Arena member discount.

Please present or enter this coupon when using our services.

Thank you,
KVK Arena Team`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) ?? ""}${
      lastName?.charAt(0) ?? ""
    }`.toUpperCase();
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =========================================================
            PAGE HEADER
        ========================================================= */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm">
              <TicketPercent size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Member Coupons
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Generate and share exclusive coupons with approved members.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/main/memberships")}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowLeft size={17} />
              Back to Members
            </button>

            <button
              type="button"
              onClick={handleFetchMembers}
              disabled={isLoading}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />

              Refresh
            </button>
          </div>
        </div>

        {/* =========================================================
            SUMMARY
        ========================================================= */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SummaryCard
            title="Generated Coupons"
            value={members.length}
            icon={<Gift size={20} />}
          />

          <SummaryCard
            title="Eligible Members"
            value={members.length}
            icon={<Users size={20} />}
          />
        </div>

        {/* =========================================================
            DATA GRID
        ========================================================= */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Search */}
          <div className="border-b border-slate-200 p-4">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search member or coupon code..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* =======================================================
              DESKTOP TABLE
          ======================================================= */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Coupon Code
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableLoading />
                ) : paginatedMembers.length > 0 ? (
                  paginatedMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* Member */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt={`${member.firstName} ${member.lastName}`}
                              className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-indigo-600 text-sm font-bold text-white">
                              {getInitials(
                                member.firstName,
                                member.lastName,
                              )}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {member.firstName} {member.lastName}
                            </p>

                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              {member.memberId || "No member ID"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Coupon */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center overflow-hidden rounded-xl border border-blue-100 bg-blue-50">
                          <span className="px-3 py-2 font-mono text-sm font-bold tracking-wider text-blue-900">
                            {member.couponCode}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyCoupon(member.couponCode)
                            }
                            title="Copy coupon"
                            className="flex h-9 w-10 cursor-pointer items-center justify-center border-l border-blue-100 text-blue-700 transition hover:bg-blue-100"
                          >
                            {copiedCoupon === member.couponCode ? (
                              <Check
                                size={16}
                                className="text-emerald-600"
                              />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {member.phone || "Not provided"}
                        </span>
                      </td>

                      {/* WhatsApp */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleWhatsApp(member)}
                          disabled={!member.phone}
                          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FaWhatsapp size={17} />
                          Send
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =======================================================
              MOBILE CARDS
          ======================================================= */}
          <div className="divide-y divide-slate-100 md:hidden">
            {isLoading ? (
              <MobileLoading />
            ) : paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => (
                <article
                  key={member.id}
                  className="p-4"
                >
                  {/* Member */}
                  <div className="mb-4 flex items-center gap-3">
                    {member.profilePicture ? (
                      <img
                        src={member.profilePicture}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-indigo-600 text-sm font-bold text-white">
                        {getInitials(
                          member.firstName,
                          member.lastName,
                        )}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {member.firstName} {member.lastName}
                      </h3>

                      <p className="truncate text-xs font-medium text-slate-500">
                        {member.memberId || "No member ID"}
                      </p>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <p className="mb-1.5 text-xs font-medium text-blue-600">
                      Coupon Code
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <span className="break-all font-mono text-base font-bold tracking-wider text-blue-900">
                        {member.couponCode}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyCoupon(member.couponCode)
                        }
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm transition hover:bg-blue-100"
                      >
                        {copiedCoupon === member.couponCode ? (
                          <Check
                            size={17}
                            className="text-emerald-600"
                          />
                        ) : (
                          <Copy size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="text-xs font-medium text-slate-500">
                      Phone
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {member.phone || "Not provided"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWhatsApp(member)}
                    disabled={!member.phone}
                    className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <FaWhatsapp size={18} />
                    Send Coupon via WhatsApp
                  </button>
                </article>
              ))
            ) : (
              <EmptyState />
            )}
          </div>

          {/* =======================================================
              PAGINATION
          ======================================================= */}
          {!isLoading && filteredMembers.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {showingFrom}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {showingTo}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredMembers.length}
                  </span>{" "}
                  coupons
                </p>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-500">
                    Rows:
                  </label>

                  <select
                    value={itemsPerPage}
                    onChange={(event) => {
                      setItemsPerPage(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(page - 1, 1),
                    )
                  }
                  disabled={currentPage === 1}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  )
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1,
                    )
                    .map((page, index, visiblePages) => {
                      const previousPage =
                        visiblePages[index - 1];

                      const showEllipsis =
                        previousPage !== undefined &&
                        page - previousPage > 1;

                      return (
                        <div
                          key={page}
                          className="flex items-center gap-1"
                        >
                          {showEllipsis && (
                            <span className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">
                              ...
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                              currentPage === page
                                ? "bg-blue-900 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <span className="text-sm font-semibold text-slate-600 sm:hidden">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(page + 1, totalPages),
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =============================================================
   SUMMARY CARD
============================================================= */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <p className="mt-0.5 text-2xl font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =============================================================
   LOADING TABLE
============================================================= */

function TableLoading() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-4">
            <div className="flex animate-pulse items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-slate-200" />

              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-slate-200" />
                <div className="h-2.5 w-20 rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-5 py-4">
            <div className="h-9 w-44 animate-pulse rounded-xl bg-slate-200" />
          </td>

          <td className="px-5 py-4">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
          </td>

          <td className="px-5 py-4">
            <div className="ml-auto h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

/* =============================================================
   MOBILE LOADING
============================================================= */

function MobileLoading() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse p-4"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-slate-200" />

            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="h-2.5 w-24 rounded bg-slate-100" />
            </div>
          </div>

          <div className="mb-3 h-16 rounded-xl bg-blue-50" />
          <div className="mb-3 h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-200" />
        </div>
      ))}
    </>
  );
}

/* =============================================================
   EMPTY STATE
============================================================= */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
        <Gift size={26} />
      </div>

      <h3 className="font-semibold text-slate-900">
        No coupons found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        There are no approved members matching your search.
      </p>
    </div>
  );
}