import { createContext, useContext, useRef, useState, ReactNode, useCallback } from "react";
import ConfirmModal, { ConfirmModalOptions } from "../components/common/ConfirmModal";

interface ConfirmContextType {
  /** Two-button confirmation. Resolves true on confirm, false on cancel/escape. Replaces window.confirm(). */
  confirm: (options: ConfirmModalOptions) => Promise<boolean>;
  /** Single-button notice. Resolves once dismissed. Replaces window.alert(). */
  notify: (options: Omit<ConfirmModalOptions, "cancelLabel">) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

/**
 * App-wide replacement for window.confirm()/window.alert(). One modal instance, rendered
 * through ConfirmModal's portal, driven by a promise so call sites read just like the
 * native dialogs did: `if (await confirm({ message: "Delete this?" })) { ... }`.
 */
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<(ConfirmModalOptions & { open: boolean }) | null>(null);
const resolver = useRef<((value: boolean) => void) | undefined>(undefined);

  const confirm = useCallback((options: ConfirmModalOptions) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const notify = useCallback(
    (options: Omit<ConfirmModalOptions, "cancelLabel">) =>
      confirm({ confirmLabel: "OK", ...options }).then(() => undefined),
    [confirm],
  );

  const close = (result: boolean) => {
    resolver.current?.(result);
    setState((prev) => (prev ? { ...prev, open: false } : prev));
  };

  return (
    <ConfirmContext.Provider value={{ confirm, notify }}>
      {children}
      <ConfirmModal
        open={!!state?.open}
        title={state?.title}
        message={state?.message ?? ""}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        danger={state?.danger}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within a ConfirmProvider");
  return context;
};
