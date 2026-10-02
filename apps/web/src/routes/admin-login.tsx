import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Lock, LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { Logo } from "@/components/common/logo";
import { Spinner } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authQueryOptions } from "@/hooks/use-auth";
import { api, call } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

// Credentials configured in apps/api/src/db/seed/index.ts
const SEED_ADMIN_EMAIL = "admin@shimlawale.com";
const SEED_ADMIN_PASSWORD = "ChangeMe123!";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const fillTestCredentials = () => {
    setEmail(SEED_ADMIN_EMAIL);
    setPassword(SEED_ADMIN_PASSWORD);
    toast.info("Filled test admin credentials", {
      description: SEED_ADMIN_EMAIL,
    });
  };

  const login = useMutation({
    mutationFn: () => call(api.auth.login.post({ email, password })),
    onSuccess: (user) => {
      qc.setQueryData(authQueryOptions.queryKey, user);
      setUser(user);
      toast.success(`Welcome back, ${user.name.split(" ")[0]} ji`);
      navigate({ to: "/admin" });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="grid min-h-screen place-items-center bg-navy bg-mandala px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="h-14" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
          className="space-y-5 rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8"
        >
          <div className="text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-accent text-primary">
              <Lock className="size-6" />
            </div>
            <h1 className="font-display text-2xl text-navy">Admin Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage leads, kirtan bookings & content.
            </p>
          </div>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>
          <Button
            type="submit"
            className="h-11 w-full rounded-full"
            disabled={login.isPending}
          >
            {login.isPending ? <Spinner className="text-white" /> : <LogIn />}{" "}
            Sign in
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={fillTestCredentials}
            className="h-8 border-0 bg-white px-3 text-xs font-semibold text-primary underline cursor-pointer"
          >
            Auto-fill
          </Button>
        </form>
        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-1 text-sm text-cream/60 hover:text-cream"
        >
          <ArrowLeft className="size-4" /> Back to website
        </Link>
      </div>
    </div>
  );
}
