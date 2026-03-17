"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { lusitana } from "../ui/fonts";
import { getProfile, createProfile } from "../../lib/api";
import { Gender, WeightUnit, ExperienceLevel } from "../../generated/prisma/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    gender: "MALE" as Gender,
    bodyweight: 0,
    bodyweight_unit: "KILOGRAMS" as WeightUnit,
    experience_level: "BEGINNER" as ExperienceLevel,
  });

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const profile = await getProfile();
      // Profile exists, redirect to dashboard
      router.push("/");
    } catch (err: any) {
      if (err.message.includes("401") || err.message.includes("Not found")) {
        // No profile or not authenticated - stay on this page
        setLoading(false);
      } else {
        setError("Failed to check profile. Please try again.");
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!formData.display_name || formData.bodyweight <= 0) {
      setError("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    try {
      await createProfile(formData);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create profile. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-bg flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg flex items-center justify-center px-4 py-8">
      <div className="glass-card w-full max-w-md px-6 py-8 sm:px-8 sm:py-10 animate-fade-slide-up relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 mb-4 shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5h11M6.5 17.5h11" />
              <rect x="2" y="4" width="4" height="6" rx="1" />
              <rect x="18" y="4" width="4" height="6" rx="1" />
              <rect x="2" y="14" width="4" height="6" rx="1" />
              <rect x="18" y="14" width="4" height="6" rx="1" />
              <line x1="12" y1="6.5" x2="12" y2="17.5" />
            </svg>
          </div>
          <h1 className={`${lusitana.className} text-3xl font-bold text-white tracking-tight`}>
            Create Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">Tell us about yourself</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="input-dark w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              placeholder="Your name"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="input-dark w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          {/* Bodyweight & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bodyweight *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.bodyweight || ""}
                onChange={(e) => setFormData({ ...formData, bodyweight: parseFloat(e.target.value) || 0 })}
                className="input-dark w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Unit *
              </label>
              <select
                value={formData.bodyweight_unit}
                onChange={(e) => setFormData({ ...formData, bodyweight_unit: e.target.value as WeightUnit })}
                className="input-dark w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
              >
                <option value="KILOGRAMS">Kilograms</option>
                <option value="POUNDS">Pounds</option>
              </select>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Experience Level *
            </label>
            <select
              value={formData.experience_level}
              onChange={(e) => setFormData({ ...formData, experience_level: e.target.value as ExperienceLevel })}
              className="input-dark w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              <option value="BEGINNER">Beginner (0-1 years)</option>
              <option value="NOVICE">Novice (1-2 years)</option>
              <option value="INTERMEDIATE">Intermediate (2-3 years)</option>
              <option value="ADVANCED">Advanced (3-5 years)</option>
              <option value="ELITE">Elite (5+ years)</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-lg bg-neutral-100 text-neutral-900 font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : (
              "Create Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
