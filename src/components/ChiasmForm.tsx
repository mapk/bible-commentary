"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fetchBibleBooks, type ChiasmWithUnits } from "@/lib/api";
import {
  parseVerseReference,
  normalizeVerseReference,
  type VerseReference,
} from "@/lib/verse-parser";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChiasmUnit {
  id: string;
  unit_order: number;
  verse_references: VerseReference[];
  referenceInput: string; // User input string
  description: string; // Unit description
}

interface ChiasmFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (chiasm: {
    id?: string;
    name: string;
    description: string | null;
    units: { unit_order: number; verse_references: any[]; description?: string | null }[];
  }) => Promise<void>;
  editingChiasm?: ChiasmWithUnits | null;
}

export function ChiasmForm({
  open,
  onOpenChange,
  onSave,
  editingChiasm,
}: ChiasmFormProps) {
  const { toast } = useToast();
  const [books, setBooks] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [units, setUnits] = useState<ChiasmUnit[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBooks = async () => {
      const booksData = await fetchBibleBooks();
      setBooks(booksData);
    };
    loadBooks();
  }, []);

  // Load editing chiasm data when it changes
  useEffect(() => {
    if (editingChiasm && open) {
      setName(editingChiasm.name);
      setDescription(editingChiasm.description || "");
      
      // Convert existing units to form format
      const formUnits: ChiasmUnit[] = editingChiasm.units.map((unit) => {
        const refs = Array.isArray(unit.verse_references)
          ? unit.verse_references
          : [unit.verse_references];
        
        // Format the first reference as input string
        const firstRef = refs[0];
        let referenceInput = "";
        if (firstRef) {
          referenceInput = `${firstRef.book} ${firstRef.chapter}:${firstRef.verse}`;
          if (firstRef.endVerse && !firstRef.endChapter && !firstRef.endBook) {
            // Same chapter range
            referenceInput += `-${firstRef.endVerse}`;
          } else if (firstRef.endChapter && firstRef.endVerse && !firstRef.endBook) {
            // Cross-chapter, same book
            referenceInput += ` - ${firstRef.endChapter}:${firstRef.endVerse}`;
          } else if (firstRef.endBook && firstRef.endChapter && firstRef.endVerse) {
            // Cross-book range
            referenceInput += ` - ${firstRef.endBook} ${firstRef.endChapter}:${firstRef.endVerse}`;
          }
        }

        return {
          id: unit.id,
          unit_order: unit.unit_order,
          verse_references: refs,
          referenceInput,
          description: unit.description || "",
        };
      });

      setUnits(formUnits);
    } else if (!editingChiasm && open) {
      // Reset form for new chiasm
      setName("");
      setDescription("");
      setUnits([]);
    }
  }, [editingChiasm, open]);

  const addUnit = () => {
    const newUnit: ChiasmUnit = {
      id: `unit-${Date.now()}`,
      unit_order: units.length + 1,
      verse_references: [],
      referenceInput: "",
      description: "",
    };
    setUnits([...units, newUnit]);
  };

  const removeUnit = (id: string) => {
    const filtered = units.filter((u) => u.id !== id);
    // Reorder units
    const reordered = filtered.map((u, index) => ({
      ...u,
      unit_order: index + 1,
    }));
    setUnits(reordered);
  };

  const updateUnitReference = async (
    id: string,
    referenceInput: string
  ) => {
    const unit = units.find((u) => u.id === id);
    if (!unit) return;

    // Parse the reference
    const parsed = parseVerseReference(referenceInput, books);
    if (!parsed) {
      // Invalid reference, but keep the input
      setUnits(
        units.map((u) =>
          u.id === id ? { ...u, referenceInput, verse_references: [] } : u
        )
      );
      return;
    }

    // Normalize the reference
    const normalized = await normalizeVerseReference(parsed, books);
    if (!normalized) {
      setUnits(
        units.map((u) =>
          u.id === id ? { ...u, referenceInput, verse_references: [] } : u
        )
      );
      return;
    }

    // Update unit
    setUnits(
      units.map((u) =>
        u.id === id
          ? {
              ...u,
              referenceInput,
              verse_references: [normalized],
            }
          : u
      )
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newUnits = [...units];
    const draggedUnit = newUnits[draggedIndex];
    newUnits.splice(draggedIndex, 1);
    newUnits.splice(index, 0, draggedUnit);

    // Update unit_order
    const reordered = newUnits.map((u, i) => ({
      ...u,
      unit_order: i + 1,
    }));

    setUnits(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the chiasm",
        variant: "destructive",
      });
      return;
    }

    if (units.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one unit to the chiasm",
        variant: "destructive",
      });
      return;
    }

    // Validate all units have valid references
    const invalidUnits = units.filter(
      (u) => u.verse_references.length === 0
    );
    if (invalidUnits.length > 0) {
      toast({
        title: "Error",
        description: "Please ensure all units have valid verse references",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const unitsToSave = units.map((u) => ({
        unit_order: u.unit_order,
        verse_references: u.verse_references,
        description: u.description.trim() || null,
      }));

      await onSave({
        id: editingChiasm?.id,
        name: name.trim(),
        description: description.trim() || null,
        units: unitsToSave,
      });

      // Reset form
      setName("");
      setDescription("");
      setUnits([]);
      onOpenChange(false);

      toast({
        title: "Success",
        description: editingChiasm
          ? "Chiasm updated successfully"
          : "Chiasm created successfully",
      });
    } catch (error) {
      console.error("Error saving chiasm:", error);
      toast({
        title: "Error",
        description: "Failed to save chiasm. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingChiasm ? "Edit Chiasm" : "Create a Chiasm"}
          </DialogTitle>
          <DialogDescription>
            Define the chiastic structure by adding units with verse references.
            Drag units to reorder them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Metadata */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Creation Chiasm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the chiasm"
              rows={3}
            />
          </div>

          {/* Units */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Chiastic Units</Label>
              <Button type="button" onClick={addUnit} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </div>

            {units.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No units added yet. Click "Add Unit" to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {units.map((unit, index) => (
                  <div
                    key={unit.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-start gap-3 p-4 border rounded-lg ${
                      draggedIndex === index ? "opacity-50" : ""
                    } ${
                      unit.verse_references.length > 0
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="cursor-move mt-2">
                      <GripVertical className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">
                          Unit {unit.unit_order}
                        </span>
                        {unit.verse_references.length > 0 && (
                          <span className="text-xs text-green-600">
                            ✓ Valid
                          </span>
                        )}
                      </div>
                      <Input
                        value={unit.referenceInput}
                        onChange={(e) =>
                          updateUnitReference(unit.id, e.target.value)
                        }
                        placeholder="e.g., Genesis 1:1 or Genesis 1:1-3 or Genesis 50:24 - Exodus 1:3"
                        className={
                          unit.referenceInput &&
                          unit.verse_references.length === 0
                            ? "border-red-300"
                            : ""
                        }
                      />
                      {unit.referenceInput &&
                        unit.verse_references.length === 0 && (
                          <p className="text-xs text-red-500">
                            Invalid verse reference format
                          </p>
                        )}
                      <Textarea
                        value={unit.description}
                        onChange={(e) =>
                          setUnits(
                            units.map((u) =>
                              u.id === unit.id
                                ? { ...u, description: e.target.value }
                                : u
                            )
                          )
                        }
                        placeholder="Brief description of this unit (optional)"
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUnit(unit.id)}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading
                ? "Saving..."
                : editingChiasm
                ? "Update Chiasm"
                : "Save Chiasm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

