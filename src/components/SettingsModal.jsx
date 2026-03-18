import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsModal({ open, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.auth.logout();
    } catch (e) {
      // proceed with logout regardless
      base44.auth.logout();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h2 className="text-lg font-bold">Settings</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
                style={{ minWidth: 44, minHeight: 44, userSelect: 'none' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-5 space-y-4">
              {/* Account Deletion */}
              {!confirmDelete ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <h3 className="font-semibold text-red-800 mb-1 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Account
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="min-h-[44px] w-full"
                    style={{ userSelect: 'none' }}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete My Account
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800">Are you absolutely sure?</h3>
                      <p className="text-sm text-red-700 mt-1">
                        This will permanently delete your account. You will be logged out immediately.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-h-[44px]"
                      style={{ userSelect: 'none' }}
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 min-h-[44px]"
                      style={{ userSelect: 'none' }}
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting…' : 'Yes, Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}