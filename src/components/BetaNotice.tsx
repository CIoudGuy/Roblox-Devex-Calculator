import type { FC } from "react";
import { AnimatePresence, motion } from "framer-motion";

type BetaNoticeProps = {
  open: boolean;
  onClose: () => void;
  onDisable: () => void;
};

const BetaNotice: FC<BetaNoticeProps> = ({ open, onClose, onDisable }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="beta-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="beta-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="beta-title"
            aria-describedby="beta-desc"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          >
            <div className="beta-head">
              <span className="beta-chip">Beta</span>
              <span className="beta-sub">This calculator is still being polished.</span>
            </div>
            <h3 id="beta-title">We're close to launch and still tuning things</h3>
            <p id="beta-desc" className="beta-body">
              Share feedback or requests on Discord.
            </p>
            <div className="beta-actions">
              <a
                className="beta-link-btn"
                href="https://discord.gg/BE7k9Xxm5z"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Discord
              </a>
              <button type="button" className="icon-btn" onClick={onClose}>
                Continue
              </button>
              <button type="button" className="icon-btn ghost" onClick={onDisable}>
                Don't show again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BetaNotice;
