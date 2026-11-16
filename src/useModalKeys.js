import { useEffect } from 'react';
import { trapTab } from './trapTab';

// Capture-phase key handling for modal dialogs: focus the close button on
// open, keep Tab inside the dialog, swallow keys so nothing behind reacts,
// Escape closes, and focus goes back to the opener on unmount.
export function useModalKeys(closeRef, onClose) {
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Tab') { trapTab(e, closeRef.current?.closest('[role="dialog"]')); return; }
      e.stopPropagation();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      opener?.focus?.();
    };
  }, [closeRef, onClose]);
}
