import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Alert from "@/components/ui/alert";

import { login } from "@/services/auth-api";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [pageAlert, setPageAlert] = useState<{
    visible: boolean;
    variant?: "success" | "error" | "warning" | "info";
    title?: string;
    description?: string;
  }>({
    visible: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    setPageAlert({
      visible: false,
    });

    setLoading(true);

    try {
      const admin = await login(formData.userId, formData.password);

      localStorage.setItem("cashier", JSON.stringify(admin));

      navigate("/bookings");
    } catch (error) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to sign in",
        description:
          "The user ID or password you entered is incorrect. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setForgotLoading(true);

    try {
      // Replace this with your real password reset API.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setForgotSuccess(true);

      setTimeout(() => {
        closeForgotModal();
      }, 2500);
    } catch (error) {
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Request failed",
        description:
          "We could not submit your password reset request. Please try again.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail("");
    setForgotSuccess(false);
    setForgotLoading(false);
  };

  return (
    <main className="relative h-screen max-h-screen overflow-hidden bg-[#f5f8fc]">
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_26%)]" />

        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="absolute -right-32 bottom-4 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(#0f172a_1px,transparent_1px),linear-gradient(90deg,#0f172a_1px,transparent_1px)] [background-size:46px_46px]" />
      </div>

      <div className="relative mx-auto grid h-screen max-h-screen max-w-[1500px] lg:grid-cols-[1fr_0.95fr]">
        {/* Left panel */}
        <section className="relative hidden h-full overflow-hidden bg-gradient-to-br from-[#103f91] via-[#1556c0] to-[#2876e8] px-10 py-8 text-white lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.22),transparent_30%)]"
          />

          <div
            aria-hidden="true"
            className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="absolute -right-6 top-36 h-48 w-48 rounded-full border border-white/10"
          />

          <div className="relative z-10">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-xl">
                <Building2 className="h-6 w-6" strokeWidth={2.2} />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight">
                  KVK Arena
                </h1>

                <p className="mt-0.5 text-xs font-medium text-blue-100">
                  Central Administration System
                </p>
              </div>
            </div>

            {/* Main content */}
            <div className="mt-10 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-50 backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" />
                Arena Operations
              </div>

              <h2 className="mt-5 max-w-lg text-4xl font-black leading-[1.12] tracking-tight xl:text-[42px]">
                Manage the entire arena from one secure portal.
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100/90 xl:text-base">
                Access bookings, memberships, payments, customers and daily
                operations through one centralized administration dashboard.
              </p>

              <div className="mt-7 grid gap-3">
                <FeatureItem
                  icon={LayoutDashboard}
                  title="Centralized Management"
                  description="Manage all arena modules from one place."
                />

                <FeatureItem
                  icon={Users}
                  title="Customer Management"
                  description="Handle members, customers and bookings."
                />

                <FeatureItem
                  icon={ShieldCheck}
                  title="Secure Access"
                  description="Protected access for authorized staff."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-5 text-xs text-blue-100/80">
            <p>
              Developed by{" "}
              <span className="font-semibold text-white">2D-Coders</span>
            </p>

            <p>© 2026 KVK Arena</p>
          </div>
        </section>

        {/* Login panel */}
        <section className="flex h-full max-h-screen items-center justify-center overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)]">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-950">
                  KVK Arena
                </h1>

                <p className="text-[11px] font-medium text-slate-500">
                  Administration System
                </p>
              </div>
            </div>

            {/* Alert */}
            {pageAlert.visible && (
              <div className="mb-4">
                <Alert
                  variant={pageAlert.variant as any}
                  title={pageAlert.title}
                  description={pageAlert.description}
                  onClose={() =>
                    setPageAlert((previous) => ({
                      ...previous,
                      visible: false,
                    }))
                  }
                />
              </div>
            )}

            {/* Login card */}
            <div className="rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.10)] sm:p-7 xl:p-8">
              <div className="mb-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Lock className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                  Admin Portal
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Welcome back
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                  Enter your credentials to access the administration
                  dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User ID */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="userId"
                    className="text-sm font-semibold text-slate-700"
                  >
                    User ID
                  </Label>

                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />

                    <Input
                      id="userId"
                      name="userId"
                      type="text"
                      autoComplete="username"
                      placeholder="Enter your user ID"
                      value={formData.userId}
                      onChange={handleChange}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 shadow-none transition placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Password
                    </Label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="cursor-pointer text-[11px] font-semibold text-blue-600 transition hover:text-blue-800"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />

                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-900 shadow-none transition placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-100"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="group mt-1 h-11 w-full cursor-pointer rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_34px_rgba(37,99,235,0.30)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to dashboard

                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                <p className="text-[11px] leading-5 text-slate-500">
                  Need access?{" "}
                  <button
                    type="button"
                    className="cursor-pointer font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    Contact the system administrator
                  </button>
                </p>
              </div>
            </div>

            {/* Security note */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />

              <span>Secure and encrypted administrative access</span>
            </div>
          </div>
        </section>
      </div>

      {/* Forgot password modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForgotModal();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
            {/* Modal header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5 text-white">
              <div
                aria-hidden="true"
                className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10"
              />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15">
                    <Lock className="h-[18px] w-[18px]" />
                  </div>

                  <h3
                    id="forgot-password-title"
                    className="text-lg font-bold"
                  >
                    Reset password
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-blue-100">
                    Submit a reset request using your registered email or user
                    ID.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Close password reset modal"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {!forgotSuccess ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="forgotEmail"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Email or user ID
                    </Label>

                    <div className="group relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />

                      <Input
                        id="forgotEmail"
                        type="text"
                        placeholder="Enter your email or user ID"
                        value={forgotEmail}
                        onChange={(event) =>
                          setForgotEmail(event.target.value)
                        }
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm text-slate-900 shadow-none transition placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-100"
                        required
                      />
                    </div>

                    <p className="text-[11px] leading-5 text-slate-500">
                      Reset instructions will be sent to your registered email
                      address.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="h-10 flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {forgotLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Send request
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-3 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>

                  <h4 className="mt-4 text-lg font-bold text-slate-950">
                    Request submitted
                  </h4>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-slate-500">
                    Your reset request has been submitted. Check your registered
                    email for further instructions.
                  </p>

                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] leading-5 text-blue-700">
                    Check both your inbox and spam folder.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

type FeatureItemProps = {
  icon: React.ElementType;
  title: string;
  description: string;
};

function FeatureItem({
  icon: Icon,
  title,
  description,
}: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-xl transition duration-300 hover:bg-white/[0.12]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </div>

      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>

        <p className="mt-0.5 text-xs leading-5 text-blue-100/80">
          {description}
        </p>
      </div>
    </div>
  );
}