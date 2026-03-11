"use client";
import { useAuth } from "./contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const isGuest = !user;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-500 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Guest banner */}
      {isGuest && (
        <div className="guest-banner">
          You&apos;re browsing as a guest — your data won&apos;t be saved.{" "}
          <Link href="/signup">Sign up</Link> or{" "}
          <Link href="/login">log in</Link> to keep your progress!
        </div>
      )}

      {/* Top nav bar */}
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="8" width="4" height="8" rx="1" />
              <rect x="18" y="8" width="4" height="8" rx="1" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
            Lift Aptitudes
          </h1>

          <div className="flex items-center gap-3">
            {isGuest ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-neutral-400">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isGuest ? "Welcome, Guest" : `Welcome back, ${user.email}`}
          </h2>
          <p className="text-gray-500 dark:text-neutral-400 mb-8">
            {isGuest
              ? "Compare your lift stats against strength standards. Sign up to save your results."
              : "Your lift data is saved and ready to compare."}
          </p>

          {/* Placeholder cards for the lift comparison UI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow bg-neutral-50 dark:bg-neutral-900/50">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Strength Standards
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                See how your lifts rank from beginner to elite.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow bg-neutral-50 dark:bg-neutral-900/50">
              <div className="text-3xl mb-3">🏅</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Muscle Group Analysis
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                Breakdown of strengths and weaknesses by muscle group.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow bg-neutral-50 dark:bg-neutral-900/50">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Track Progress
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {isGuest
                  ? "Sign up to track your lifts over time."
                  : "View your lift history and trends."}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}