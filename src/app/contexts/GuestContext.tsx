"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type GuestEntry = {
  lift_id: number;
  lift_name: string;
  muscle_group: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  date: Date;
};

type GuestRankings = Record<string, {
  tier: string;
  percentile: number;
  color: string;
}>;

type GuestContextType = {
  guestEntries: GuestEntry[];
  addGuestEntry: (entry: GuestEntry) => void;
  clearGuestEntries: () => void;
  getGuestEntries: () => GuestEntry[];
  guestBodyweight: number;
  setGuestBodyweight: (weight: number) => void;
  guestBodyweightUnit: "POUNDS" | "KILOGRAMS";
  setGuestBodyweightUnit: (unit: "POUNDS" | "KILOGRAMS") => void;
  guestGender: "MALE" | "FEMALE";
  setGuestGender: (gender: "MALE" | "FEMALE") => void;
  guestRankings: GuestRankings;
  setGuestRankings: (rankings: GuestRankings) => void;
};

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guestEntries, setGuestEntries] = useState<GuestEntry[]>([]);
  const [guestBodyweight, setGuestBodyweight] = useState<number>(0);
  const [guestBodyweightUnit, setGuestBodyweightUnit] = useState<"POUNDS" | "KILOGRAMS">("KILOGRAMS");
  const [guestGender, setGuestGender] = useState<"MALE" | "FEMALE">("MALE");
  const [guestRankings, setGuestRankings] = useState<GuestRankings>({});

  const addGuestEntry = (entry: GuestEntry) => {
    setGuestEntries((prev) => {
      return [...prev, entry];
    });
    // Clear rankings cache when new lift is added so strength map recalculates
    setGuestRankings({});
  };

  const clearGuestEntries = () => {
    setGuestEntries([]);
    setGuestRankings({});
  };

  const getGuestEntries = () => guestEntries;

  return (
    <GuestContext.Provider value={{ 
      guestEntries, 
      addGuestEntry, 
      clearGuestEntries, 
      getGuestEntries,
      guestBodyweight,
      setGuestBodyweight,
      guestBodyweightUnit,
      setGuestBodyweightUnit,
      guestGender,
      setGuestGender,
      guestRankings,
      setGuestRankings,
    }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error("useGuest must be used within a GuestProvider");
  }
  return context;
}
