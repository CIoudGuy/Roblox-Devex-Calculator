import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ExtrasDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function ExtrasDrawer({ open, onClose, children }: ExtrasDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="extras-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.52 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
          <motion.aside
            className="extras-drawer"
            role="dialog"
            aria-modal="true"
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 210, mass: 0.8 }}
          >
            <div className="extras-drawer__head">
              <h3>Extras</h3>
              <button className="icon-btn ghost" type="button" onClick={onClose}>
                Close
              </button>
            </div>
            <div className="extras-drawer__body">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
