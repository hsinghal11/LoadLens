import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/LoadingState";
import api from "@/api/axios";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const providerBadgeConfig: Record<string, { label: string; color: string }> = {
  LOCAL: { label: "Email & Password", color: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  GOOGLE: { label: "Google", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  GITHUB: { label: "GitHub", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/user/me");
      return data;
    },
    initialData: user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const provider = (me?.provider || "LOCAL").toUpperCase();
  const providerConfig = providerBadgeConfig[provider] || providerBadgeConfig.LOCAL;

  const initials = me?.name
    ? me.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      await api.post("/api/v1/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete("/api/v1/user/me");
      toast.success("Account deleted");
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and account preferences.</p>
      </div>

      {/* Profile Section */}
      <section className="bg-card border rounded-xl p-6 flex flex-col gap-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          Profile
        </h2>

        <div className="flex items-center gap-6">
          {me?.avatarUrl ? (
            <img
              src={me.avatarUrl}
              alt={me.name}
              className="h-20 w-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/20 text-primary text-2xl font-bold flex items-center justify-center border-2 border-primary/30">
              {initials}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{me?.name}</div>
            <div className="text-muted-foreground">{me?.email}</div>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${providerConfig.color}`}
              >
                {providerConfig.label}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Password Section — only for LOCAL accounts */}
      {provider === "LOCAL" ? (
        <section className="bg-card border rounded-xl p-6 flex flex-col gap-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            Change Password
          </h2>
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Current Password</label>
              <input
                type="password"
                {...register("currentPassword")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="••••••••"
              />
              {errors.currentPassword && (
                <span className="text-xs text-red-500">{errors.currentPassword.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                {...register("newPassword")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="••••••••"
              />
              {errors.newPassword && (
                <span className="text-xs text-red-500">{errors.newPassword.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Confirm New Password</label>
              <input
                type="password"
                {...register("confirmPassword")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update Password"}
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <section className="bg-card border rounded-xl p-6 flex items-center gap-4 text-muted-foreground">
          <Lock className="w-5 h-5 shrink-0" />
          <p>
            Your password is managed by <strong className="text-foreground">{providerConfig.label}</strong>.
            To change it, visit your {providerConfig.label} account settings.
          </p>
        </section>
      )}

      {/* Danger Zone */}
      <section className="bg-card border border-red-500/30 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!deleteConfirm ? (
          <div>
            <Button
              variant="destructive"
              onClick={() => setDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </Button>
          </div>
        ) : (
          <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5 flex flex-col gap-4">
            <p className="text-sm font-medium text-red-500">
              Are you absolutely sure? This will permanently delete your account, all test plans, and all run history.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Delete My Account
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
