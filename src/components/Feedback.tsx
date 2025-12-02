import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Select from "@radix-ui/react-select";
import confetti from "canvas-confetti";

const FEEDBACK_ENDPOINT = "https://api.devex-calculator.dev/feedback";
const MAX_LEN = 2000;

type FeedbackType = "feedback" | "bug";

export default function Feedback() {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<FeedbackType>("feedback");
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState<string>("feature");
    const [severity, setSeverity] = useState<string>("medium");


    const [steps, setSteps] = useState("");
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);


    const categories = useMemo(() => {
        if (type === "bug") {
            return [
                { value: "ui", label: "UI / Visual" },
                { value: "calc", label: "Calculation Error" },
                { value: "broken", label: "Something's Broken" },
                { value: "other", label: "Other" },
            ];
        }
        return [
            { value: "feature", label: "Feature Request" },
            { value: "design", label: "Design Feedback" },
            { value: "other", label: "Other" },
        ];
    }, [type]);
    const [includeMeta, setIncludeMeta] = useState(true);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    useEffect(() => {
        if (isOpen) {
            setStatus("idle");
            setMessage("");
            setSteps("");
            setScreenshot(null);
            setScreenshotFile(null);
            setCategory("feature");
            setSeverity("medium");
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || typeof window === "undefined") return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const remaining = useMemo(() => Math.max(0, MAX_LEN - message.length), [message]);
    const subtitle =
        type === "bug"
            ? "Found a glitch? Include steps so we can reproduce and fix it fast."
            : "Ideas, rough edges, or friction points - we read every note.";
    const severityLabel = severity === "high" ? "High" : severity === "medium" ? "Medium" : "Low";

    const formVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.06, duration: 0.3, ease: "easeOut" },
        },
        exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 500, damping: 30 } },
    };
    const asideVariants = {
        hidden: { opacity: 0, x: 12 },
        visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 30, delay: 0.1 } },
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    setScreenshotFile(blob);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setScreenshot(event.target?.result as string);
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setScreenshotFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setScreenshot(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed) return;

        setSending(true);
        setStatus("idle");

        const now = new Date();
        const includeUserAgent = includeMeta && typeof navigator !== "undefined";
        const header = type === "bug" ? "### [BUG] Report" : "### [FEEDBACK]";
        const extraSteps =
            type === "bug" && steps.trim().length > 0 ? `\n**Steps to reproduce:**\n${steps.trim()}` : "";

        const formData = new FormData();
        formData.append("type", type);
        formData.append("message", message);
        formData.append("category", category);
        formData.append("source", "devex-calculator");
        formData.append("ts", now.toISOString());
        formData.append("page", typeof window !== "undefined" ? window.location.href : "n/a");

        if (includeMeta && typeof navigator !== "undefined") {
            formData.append("userAgent", navigator.userAgent);
        }

        if (type === "bug") {
            formData.append("severity", severityLabel);
            if (steps.trim()) {
                formData.append("steps", steps.trim());
            }
        }

        if (screenshotFile) {
            formData.append("screenshot", screenshotFile);
        }

        try {
            const response = await fetch(FEEDBACK_ENDPOINT, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                setStatus("success");
                const rect = buttonRef.current?.getBoundingClientRect();
                const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
                const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;

                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { x, y },
                    zIndex: 9999,
                });
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage("");
                    setScreenshot(null);
                    setScreenshotFile(null);
                    setStatus("idle");
                }, 1600);
            } else {
                setStatus("error");
                document.body.classList.add("shake");
                setTimeout(() => {
                    setStatus("idle");
                    document.body.classList.remove("shake");
                }, 2000);
            }
        } catch (err) {
            console.error("Failed to send feedback", err);
            setStatus("error");
            document.body.classList.add("shake");
            setTimeout(() => {
                setStatus("idle");
                document.body.classList.remove("shake");
            }, 2000);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <motion.button
                className="feedback-trigger"
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                layoutId="feedback-trigger"
            >
                <div className="trigger-text">
                    <span className="trigger-title">Feedback</span>
                </div>
            </motion.button>

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
                            className="feedback-sidebar"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="feedback-header">
                                <h3>Send Feedback</h3>
                                <button className="close-btn" onClick={() => setIsOpen(false)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div className="feedback-content">
                                <div className="pill-group" style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                                    <button
                                        className={`pill-btn ${type === "feedback" ? "active" : ""}`}
                                        onClick={() => {
                                            setType("feedback");
                                            setCategory("feature");
                                        }}
                                        style={{ justifyContent: "center" }}
                                    >
                                        General
                                        {type === "feedback" && (
                                            <motion.div
                                                className="pill-bg"
                                                layoutId="feedback-pill-bg"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                    <button
                                        className={`pill-btn ${type === "bug" ? "active" : ""}`}
                                        onClick={() => {
                                            setType("bug");
                                            setCategory("ui");
                                        }}
                                        style={{ justifyContent: "center" }}
                                    >
                                        Bug Report
                                        {type === "bug" && (
                                            <motion.div
                                                className="pill-bg"
                                                layoutId="feedback-pill-bg"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                </div>

                                <div className="form-section">
                                    <label className="section-label">Category</label>
                                    <div className="pill-group" style={{ justifyContent: "flex-start", gap: "8px" }}>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                className={`chip-btn ${category === cat.value ? "active" : ""}`}
                                                onClick={() => setCategory(cat.value)}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-section">
                                    <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <label className="section-label">
                                            {type === "bug" ? "What happened?" : "Your thoughts"}
                                        </label>
                                        <span className="char-count" style={{ fontSize: "11px", color: "var(--muted)", opacity: 0.8 }}>
                                            {message.length}/2000
                                        </span>
                                    </div>
                                    <textarea
                                        className="feedback-textarea"
                                        placeholder={
                                            type === "bug"
                                                ? "Describe the bug and how to reproduce it... (Paste or drop images here)"
                                                : "Share your ideas or suggestions... (Paste or drop images here)"
                                        }
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                                        onPaste={handlePaste}
                                        onDrop={handleDrop}
                                        onDragOver={(e) => e.preventDefault()}
                                        rows={4}
                                        disabled={sending || status === "success"}
                                    />
                                    {screenshot && (
                                        <div className="screenshot-preview" style={{ marginTop: "12px", position: "relative", display: "inline-block" }}>
                                            <img
                                                src={screenshot}
                                                alt="Screenshot preview"
                                                style={{
                                                    maxWidth: "100%",
                                                    maxHeight: "200px",
                                                    borderRadius: "8px",
                                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    setScreenshot(null);
                                                    setScreenshotFile(null);
                                                }}
                                                style={{
                                                    position: "absolute",
                                                    top: "8px",
                                                    right: "8px",
                                                    background: "rgba(0, 0, 0, 0.6)",
                                                    border: "none",
                                                    borderRadius: "50%",
                                                    width: "24px",
                                                    height: "24px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    backdropFilter: "blur(4px)",
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>


                            </div>

                            <div className="feedback-footer">
                                <button
                                    ref={buttonRef}
                                    className={`submit-btn ${status === "success" ? "success" : status === "error" ? "error shake" : ""}`}
                                    onClick={handleSubmit}
                                    disabled={!message.trim() || sending || status === "success"}
                                >
                                    {sending ? (
                                        <span className="spinner" />
                                    ) : status === "success" ? (
                                        "Sent Successfully!"
                                    ) : status === "error" ? (
                                        "Failed to Send"
                                    ) : (
                                        "Send Feedback"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
