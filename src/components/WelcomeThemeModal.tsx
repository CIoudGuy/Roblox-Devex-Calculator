import { AnimatePresence, motion } from "framer-motion";
import type { Theme } from "./ThemeMenu";
import ThemePreview from "./ThemePreview";

type WelcomeThemeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    setTheme: (theme: Theme) => void;
    currentTheme: Theme;
};

const THEMES: Theme[] = ["default", "white", "dark"];

export default function WelcomeThemeModal({ isOpen, onClose, setTheme, currentTheme }: WelcomeThemeModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="feedback-overlay welcome-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-40%" }}
                        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-40%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="welcome-modal"
                    >
                        <div className="welcome-header">
                            <h2>Welcome!</h2>
                            <p className="muted">
                                Pick the look you prefer. You can change this anytime from the theme menu.
                            </p>
                        </div>

                        <div className="welcome-grid">
                            {THEMES.map((theme) => (
                                <ThemePreview
                                    key={theme}
                                    theme={theme}
                                    active={currentTheme === theme}
                                    onClick={() => setTheme(theme)}
                                />
                            ))}
                        </div>

                        <div className="welcome-actions">
                            <button className="submit-btn" onClick={onClose}>
                                Continue to Calculator
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
