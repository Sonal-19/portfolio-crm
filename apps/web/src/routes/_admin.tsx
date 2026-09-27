import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { Logo } from "@/components/common/logo";
import { Spinner } from "@/components/common/states";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-navy">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12" />
          <Spinner className="text-gold" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin-login" replace />;

  return (
    <AdminShell user={user}>
      <Outlet />
    </AdminShell>
  );
}
