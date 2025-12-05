import { AnimatePresence, motion } from "framer-motion";
import ThemePreview, { THEME_CONFIG } from "./ThemePreview";

export type Theme = "default" | "white" | "dark";

type ThemeMenuProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
};

const THEMES: Theme[] = ["default", "white", "dark"];

export default function ThemeMenu({ isOpen, setIsOpen, currentTheme, setTheme }: ThemeMenuProps) {
  const currentLabel = THEME_CONFIG[currentTheme]?.label || "Theme";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="feedback-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            className="feedback-sidebar theme-menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="feedback-header theme-menu__header">
              <div>
                <p className="eyebrow">Personalize</p>
                <h3>Themes</h3>
                <p className="muted tiny">Currently: {currentLabel}</p>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close theme menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="feedback-content theme-menu__content">
              <div className="theme-grid">
                {THEMES.map((theme) => (
                  <ThemePreview
                    key={theme}
                    theme={theme}
                    active={currentTheme === theme}
                    onClick={() => setTheme(theme)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
