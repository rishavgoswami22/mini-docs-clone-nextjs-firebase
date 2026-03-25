"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl px-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          Mini Google Docs
        </h1>
        <p className="text-xl text-muted-foreground">
          A real-time collaborative document editor built with Next.js, Firebase, and Plate.js.
        </p>
        
        <div className="flex gap-4 mt-4">
          {user ? (
            <Link 
              href="/dashboard" 
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Go to Dashboard
            </Link>
          ) : (
             <div className="flex gap-4">
               <Link 
                  href="/login" 
                  className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup" 
                  className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Sign Up
                </Link>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
