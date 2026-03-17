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

type GuestContextType = {
  guestEntries: GuestEntry[];
  addGuestEntry: (entry: GuestEntry) => void;
  clearGuestEntries: () => void;
  getGuestEntries: () => GuestEntry[];
};

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guestEntries, setGuestEntries] = useState<GuestEntry[]>([]);

  const addGuestEntry = (entry: GuestEntry) => {
    setGuestEntries((prev) => {
      // Check if entry exists for this lift, update if so
      const existingIndex = prev.findIndex((e) => e.lift_id === entry.lift_id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  };

  const clearGuestEntries = () => {
    setGuestEntries([]);
  };

  const getGuestEntries = () => guestEntries;

  return (
    <GuestContext.Provider value={{ guestEntries, addGuestEntry, clearGuestEntries, getGuestEntries }}>
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
