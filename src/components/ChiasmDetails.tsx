"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getChiasticLevel, getChiasticBackgroundColor } from "@/lib/chiasm-colors";
import type { ChiasmWithUnits, ChiasmUnit } from "@/lib/api";
import type { VerseReference } from "@/lib/verse-parser";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, Trash2 } from "lucide-react";

interface ChiasmDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chiasm: ChiasmWithUnits | null;
  onEdit?: (chiasm: ChiasmWithUnits) => void;
  onDelete?: (chiasmId: string) => void;
}

export function ChiasmDetails({
  open,
  onOpenChange,
  chiasm,
  onEdit,
  onDelete,
}: ChiasmDetailsProps) {
  const { user } = useAuth();
  const isOwner = user && chiasm && user.id === chiasm.user_id;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!chiasm) return null;

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const maxLevel = Math.floor(chiasm.units.length / 2);

  const formatVerseReference = (ref: VerseReference): string => {
    if (!ref) return "";
    
    let result = `${ref.book} ${ref.chapter}:${ref.verse}`;
    
    if (ref.endVerse && !ref.endChapter && !ref.endBook) {
      result += `-${ref.endVerse}`;
    } else if (ref.endBook && ref.endChapter && ref.endVerse) {
      result += ` - ${ref.endBook} ${ref.endChapter}:${ref.endVerse}`;
    } else if (ref.endChapter && ref.endVerse) {
      result += ` - ${ref.chapter === ref.endChapter ? '' : `${ref.endChapter}:`}${ref.endVerse}`;
    }
    
    return result;
  };

  const getChiasticLabel = (unitOrder: number, totalUnits: number): string => {
    const center = Math.ceil(totalUnits / 2);
    
    if (unitOrder === center) {
      // Center unit - use the letter based on position
      const letterIndex = center - 1;
      return String.fromCharCode(65 + letterIndex); // A=65, B=66, etc.
    } else if (unitOrder < center) {
      // Before center: A, B, C, D...
      const letterIndex = unitOrder - 1;
      return String.fromCharCode(65 + letterIndex);
    } else {
      // After center: C', B', A' (in reverse order)
      const distanceFromEnd = totalUnits - unitOrder;
      const letterIndex = distanceFromEnd;
      return String.fromCharCode(65 + letterIndex) + "'";
    }
  };

  const getIndentationLevel = (unitOrder: number, totalUnits: number): number => {
    const center = Math.ceil(totalUnits / 2);
    const distanceFromCenter = Math.abs(unitOrder - center);
    // Maximum indent is at the center (distance = 0), minimum at edges
    // For 7 units: A=3, B=2, C=1, D=0, C'=1, B'=2, A'=3
    // We want: A=0, B=1, C=2, D=3, C'=2, B'=1, A'=0
    return center - 1 - distanceFromCenter;
  };

  const getPrimaryVerseReference = (unit: ChiasmUnit): string => {
    const refs = Array.isArray(unit.verse_references)
      ? unit.verse_references
      : [unit.verse_references];
    
    if (refs.length > 0 && refs[0]) {
      return formatVerseReference(refs[0]);
    }
    return "";
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent side="right" className="flex flex-col h-full">
        <SheetHeader className="mb-4 pb-4 border-b shrink-0">
          <SheetTitle>{chiasm.name}</SheetTitle>
          {chiasm.description && (
            <SheetDescription>{chiasm.description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2 pb-4">
            <h3 className="font-semibold text-lg">Chiastic Structure</h3>
            {chiasm.units.map((unit) => {
              const level = getChiasticLevel(unit.unit_order, chiasm.units.length);
              const bgColor = getChiasticBackgroundColor(level, maxLevel);
              const borderColor = getChiasticBackgroundColor(level, maxLevel, 70, 60);
              const chiasticLabel = getChiasticLabel(unit.unit_order, chiasm.units.length);
              const primaryVerseRef = getPrimaryVerseReference(unit);
              const indentLevel = getIndentationLevel(unit.unit_order, chiasm.units.length);

              const refs = Array.isArray(unit.verse_references)
                ? unit.verse_references
                : [unit.verse_references];

              return (
                <Card
                  key={unit.id}
                  className="py-2"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    marginLeft: `${indentLevel * 1.5}rem`, // 1.5rem per indent level
                  }}
                >
                  <CardHeader className="pb-2 px-4 pt-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: borderColor }}
                      >
                        {chiasticLabel}
                      </span>
                      <span className="font-mono text-slate-900">
                        {primaryVerseRef}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pt-0 pb-2">
                    {refs.length > 1 && (
                      <div className="space-y-0.5 mb-2">
                        {refs.slice(1).map((ref: VerseReference, refIndex: number) => (
                          <div
                            key={refIndex}
                            className="text-xs font-mono text-slate-600"
                          >
                            {formatVerseReference(ref)}
                          </div>
                        ))}
                      </div>
                    )}
                    {unit.description && (
                      <p className="text-xs text-slate-600 italic">
                        {unit.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {isOwner && (onEdit || onDelete) && (
          <div className="border-t pt-4 mt-4 shrink-0 bg-background sticky bottom-0">
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(chiasm)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
    <ConfirmDialog
      open={isDeleteConfirmOpen}
      onOpenChange={setIsDeleteConfirmOpen}
      title={`Delete "${chiasm.name}"?`}
      description="This action cannot be undone."
      confirmLabel="Delete"
      onConfirm={() => onDelete?.(chiasm.id)}
    />
    </>
  );
}

