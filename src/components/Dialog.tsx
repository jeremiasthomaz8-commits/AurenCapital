import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="legal-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-content">
        <div className="dialog-heading">
          <h2 id="dialog-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
