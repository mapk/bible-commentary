"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface ChiasmContextType {
  showChiasms: boolean;
  setShowChiasms: (show: boolean) => void;
}

const ChiasmContext = createContext<ChiasmContextType>({
  showChiasms: false,
  setShowChiasms: () => {},
});

export function ChiasmProvider({ children }: { children: ReactNode }) {
  // Initialize from sessionStorage only on client, default to false for SSR
  const [showChiasms, setShowChiasmsState] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("showChiasms");
      return stored === "true";
    }
    return false;
  });

  const setShowChiasms = (show: boolean) => {
    setShowChiasmsState(show);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("showChiasms", String(show));
    }
  };

  return (
    <ChiasmContext.Provider value={{ showChiasms, setShowChiasms }}>
      {children}
    </ChiasmContext.Provider>
  );
}

export const useChiasm = () => useContext(ChiasmContext);

