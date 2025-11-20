// components/shared/dialogs.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

// ============ SUCCESS DIALOG ============
interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Done",
  onAction,
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border border-white/10 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <DialogTitle className="text-primary">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-secondary text-sm">
          {description}
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={() => {
              onAction?.();
              onOpenChange(false);
            }}
            className="w-full bg-primary text-black hover:bg-stone-400"
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ ERROR DIALOG ============
interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Close",
  onAction,
}: ErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border border-white/10 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <DialogTitle className="text-primary">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-secondary text-sm">
          {description}
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={() => {
              onAction?.();
              onOpenChange(false);
            }}
            className="w-full bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ WARNING DIALOG (Confirmation) ============
interface WarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function WarningDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  isLoading = false,
  onConfirm,
}: WarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border border-white/10">
        <AlertDialogTitle className="text-primary flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-secondary text-sm">
          {description}
        </AlertDialogDescription>
        <div className="flex justify-end gap-2 pt-4">
          <AlertDialogCancel
            disabled={isLoading}
            className="border-white/10 text-secondary hover:text-primary hover:bg-stone-800"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30"
          >
            {isLoading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============ DANGER DIALOG (Delete Confirmation) ============
interface DangerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DangerDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  isLoading = false,
  onConfirm,
}: DangerDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border border-white/10">
        <AlertDialogTitle className="text-primary flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-secondary text-sm">
          {description}
        </AlertDialogDescription>
        <div className="flex justify-end gap-2 pt-4">
          <AlertDialogCancel
            disabled={isLoading}
            className="border-white/10 text-secondary hover:text-primary hover:bg-stone-800"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============ INFO DIALOG ============
interface InfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function InfoDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Got it",
  onAction,
}: InfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border border-white/10 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <DialogTitle className="text-primary">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-secondary text-sm">
          {description}
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={() => {
              onAction?.();
              onOpenChange(false);
            }}
            className="w-full bg-primary text-black hover:bg-stone-400"
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
