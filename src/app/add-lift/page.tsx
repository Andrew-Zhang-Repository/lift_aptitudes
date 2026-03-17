"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAvailableLifts, createLiftEntry, getProfile, updateProfile, Lift, ProfileResponse } from "../../lib/api";
import { useGuest } from "../contexts/GuestContext";
import { useAuth } from "../contexts/AuthContext";
import { one_rep_max } from "../../lib/rep-max";

export default function AddLiftPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { guestEntries, addGuestEntry } = useGuest();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unit, setUnit] = useState<"KILOGRAMS" | "POUNDS">("KILOGRAMS");

  const [formData, setFormData] = useState({
    lift_id: "",
    weight: "",
    reps: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (profile?.bodyweight_unit) {
      setUnit(profile.bodyweight_unit);
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const liftsData = await getAvailableLifts();
      setLifts(liftsData);
      
      if (user) {
        const profileData = await getProfile();
        setProfile(profileData);
      }
    } catch (err: any) {
      if (!user) {
        // Guest mode - no profile needed
      } else if (err.message.includes("401") || err.message.includes("Not found")) {
        router.push("/onboarding");
      } else {
        setError("Failed to load data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const liftId = parseInt(formData.lift_id);
    const weight = parseFloat(formData.weight);
    const reps = parseInt(formData.reps);

    if (!liftId || !reps) {
      setError("Please fill in all fields.");
      setSubmitting(false);
      return;
    }

    const selectedLift = lifts.find(l => l.id === liftId);
    const isBodyweight = selectedLift?.name === "Pullups";

    let weightKg = weight;
    if (isBodyweight && profile) {
      weightKg = profile.bodyweight_unit === "KILOGRAMS" 
        ? profile.bodyweight 
        : profile.bodyweight * 0.453592;
    } else if (!isBodyweight && weight > 0) {
      weightKg = unit === "POUNDS" ? weight * 0.453592 : weight;
    }

    if (!isBodyweight && (!weight || weight <= 0)) {
      setError("Weight must be greater than 0.");
      setSubmitting(false);
      return;
    }

    if (reps <= 0) {
      setError("Reps must be greater than 0.");
      setSubmitting(false);
      return;
    }

    try {
      if (user && profile) {
        // Logged in user - save to API
        await createLiftEntry({ lift_id: liftId, weight: isBodyweight ? weightKg : weightKg, reps });
      } else {
        // Guest - save to local state
        const estimated1rm = one_rep_max(isBodyweight ? weightKg : weightKg, reps);
        addGuestEntry({
          lift_id: liftId,
          lift_name: selectedLift?.name || "",
          muscle_group: selectedLift?.muscle_group || "",
          weight: isBodyweight ? weightKg : weightKg,
          reps: reps,
          estimated_1rm: estimated1rm,
          date: new Date(),
        });
      }
      setSuccess("Lift added successfully!");
      setFormData({ lift_id: "", weight: "", reps: "" });
    } catch (err: any) {
      setError(err.message || "Failed to add lift. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setSuccess(null);
    setFormData({ lift_id: "", weight: "", reps: "" });
  };

  const handleUnitToggle = async () => {
    const newUnit = unit === "KILOGRAMS" ? "POUNDS" : "KILOGRAMS";
    setUnit(newUnit);
    
    if (profile) {
      try {
        await updateProfile({
          display_name: profile.display_name,
          gender: profile.gender,
          bodyweight: profile.bodyweight,
          bodyweight_unit: newUnit,
          experience_level: profile.experience_level,
        });
        setProfile({ ...profile, bodyweight_unit: newUnit });
      } catch (err) {
        console.error("Failed to update unit preference:", err);
      }
    }
  };

  const selectedLift = lifts.find(l => l.id === parseInt(formData.lift_id));
  const isBodyweight = selectedLift?.name === "Pullups";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-500 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="8" width="4" height="8" rx="1" />
              <rect x="18" y="8" width="4" height="8" rx="1" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Lift Aptitudes
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Add Lift
          </h1>
          <p className="text-gray-500 dark:text-neutral-400 mb-6">
            Record your lift and track your progress
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-300">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Lift Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Select Lift *
              </label>
              <select
                value={formData.lift_id}
                onChange={(e) => setFormData({ ...formData, lift_id: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
                required
              >
                <option value="">Choose a lift...</option>
                {lifts.map((lift) => (
                  <option key={lift.id} value={lift.id}>
                    {lift.name} ({lift.muscle_group})
                  </option>
                ))}
              </select>
            </div>

            {/* Weight */}
            {!isBodyweight && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">
                    Weight ({unit === "KILOGRAMS" ? "kg" : "lbs"}) *
                  </label>
                  <button
                    type="button"
                    onClick={handleUnitToggle}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    {unit === "KILOGRAMS" ? "Switch to lbs" : "Switch to kg"}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  placeholder="Enter weight"
                  required
                />
              </div>
            )}

            {/* Reps */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Reps *
              </label>
              <input
                type="number"
                min="1"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                placeholder="Enter reps"
                required
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Adding...
                  </span>
                ) : (
                  "Add Lift"
                )}
              </button>

              {success && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddAnother}
                    className="flex-1 py-3 px-4 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Add Another
                  </button>
                  <Link
                    href="/strength-map"
                    className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors text-center"
                  >
                    View Strength Map
                  </Link>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
