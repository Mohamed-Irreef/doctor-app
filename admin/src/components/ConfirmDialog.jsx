import { AlertCircle } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  variant = "danger",
}) {
  const isDanger = variant === "danger";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isDanger ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}
        >
          <AlertCircle size={24} />
        </div>
        <p className="mb-6 text-sm text-slate-600">{message}</p>
        <div className="flex w-full gap-3">
          <Button onClick={onClose} variant="ghost" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={isDanger ? "danger" : "primary"}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
