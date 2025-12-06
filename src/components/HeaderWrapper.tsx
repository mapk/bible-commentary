"use client";

import { useState } from "react";
import Header from "./Header";
import { ChiasmForm } from "./ChiasmForm";
import { createChiasm } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useChiasm } from "@/contexts/ChiasmContext";

export function HeaderWrapper() {
  const { user } = useAuth();
  const { showChiasms, setShowChiasms } = useChiasm();
  const [chiasmFormOpen, setChiasmFormOpen] = useState(false);

  const handleCreateChiasm = () => {
    setChiasmFormOpen(true);
  };

  const handleSaveChiasm = async (chiasm: {
    name: string;
    description: string | null;
    units: { unit_order: number; verse_references: any[] }[];
  }) => {
    await createChiasm(chiasm.name, chiasm.description, chiasm.units);
  };

  return (
    <>
      <Header
        showChiasms={showChiasms}
        onToggleChiasms={setShowChiasms}
        onCreateChiasm={user ? handleCreateChiasm : undefined}
      />
      {user && (
        <ChiasmForm
          open={chiasmFormOpen}
          onOpenChange={setChiasmFormOpen}
          onSave={handleSaveChiasm}
        />
      )}
    </>
  );
}

