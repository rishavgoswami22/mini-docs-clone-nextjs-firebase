"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthService } from "@/lib/services/auth.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await AuthService.login(email, password);
      router.replace("/dashboard");
      toast.success("Logged in");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await AuthService.loginWithGoogle();
      router.replace("/dashboard");
      toast.success("Logged in");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Sign in to your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Or{" "}
          <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
            create a new account
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label className="text-sm font-medium" htmlFor="email-address">Email address</label>
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full" disabled={emailLoading || googleLoading}>
            {emailLoading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
          Sign up here
        </Link>
      </p>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={emailLoading || googleLoading}
          >
            {googleLoading ? "Opening Google..." : "Continue with Google"}
          </Button>
        </div>
      </div>
    </>
  );
}
