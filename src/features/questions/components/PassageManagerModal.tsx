"use client";

import { useState } from "react";
import type { PassageRecord } from "@/server/db/types";
import { createPassageAction, deletePassageAction } from "@/features/questions/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { BookOpen, Plus, Trash2, X, Languages } from "lucide-react";

interface PassageManagerModalProps {
  passages: PassageRecord[];
  onClose: () => void;
  onSelectPassage?: (passage: PassageRecord) => void;
}

export function PassageManagerModal({
  passages,
  onClose,
  onSelectPassage,
}: PassageManagerModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentHi, setContentHi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const res = await createPassageAction({
      titleEn,
      titleHi,
      contentEn,
      contentHi,
      languageCode: "both",
    });

    setIsPending(false);
    if (!res.success) {
      setError(res.error || "Failed to create passage.");
    } else {
      setIsCreating(false);
      setTitleEn("");
      setTitleHi("");
      setContentEn("");
      setContentHi("");
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this passage?")) return;
    await deletePassageAction(id);
    window.location.reload();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-700" />
            <h3 className="font-bold text-slate-900">
              Language Reading Passages ({passages.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreating(true)}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Passage
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && <Alert variant="error">{error}</Alert>}

          {isCreating ? (
            <form
              onSubmit={handleCreate}
              className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/30 p-5"
            >
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  New Bilingual Passage
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Title (English)"
                  id="titleEn"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. The Banyan Tree"
                />
                <Input
                  label="Title (Hindi - हिन्दी शीर्षक)"
                  id="titleHi"
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  placeholder="उदा. बरगद का पेड़"
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-semibold text-slate-700"
                  htmlFor="contentEn"
                >
                  Passage Content (English)
                </label>
                <textarea
                  id="contentEn"
                  rows={4}
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  placeholder="Enter full English reading passage..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-semibold text-slate-700"
                  htmlFor="contentHi"
                >
                  Passage Content (Hindi - हिन्दी गद्यांश)
                </label>
                <textarea
                  id="contentHi"
                  rows={4}
                  value={contentHi}
                  onChange={(e) => setContentHi(e.target.value)}
                  placeholder="हिन्दी गद्यांश यहाँ लिखें..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
                  Save Passage
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {passages.length === 0 ? (
                <div className="rounded-xl border border-dashed py-8 text-center text-xs text-slate-500">
                  No passages added yet. Click &quot;Add New Passage&quot; above to create
                  one.
                </div>
              ) : (
                passages.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {p.title_en || p.title_hi || "Untitled Passage"}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({p.title_hi || "No Hindi Title"})
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-600">
                        {p.content_en || p.content_hi}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectPassage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSelectPassage(p);
                            onClose();
                          }}
                          className="text-xs"
                        >
                          Select for Question
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Delete passage"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
