import type { Theme } from "./ThemeMenu";

type ThemePreviewProps = {
  theme: Theme;
  active: boolean;
  onClick: () => void;
};

export const THEME_CONFIG: Record<
  Theme,
  { bg: string; card: string; text: string; accent: string; label: string; blurb: string; tag?: string }
> = {
  default: {
    bg: "#04050c",
    card: "rgba(10, 12, 20, 0.82)",
    text: "#f1f4ff",
    accent: "#77c5ff",
    label: "Default",
    blurb: "Glass panels with the animated canvas.",
    tag: "Recommended",
  },
  white: {
    bg: "#f5f7fb",
    card: "#ffffff",
    text: "#0f172a",
    accent: "#2563eb",
    label: "Light",
    blurb: "Bright, crisp layout for daylight viewing.",
  },
  dark: {
    bg: "#06070b",
    card: "#10121a",
    text: "#f2f4fa",
    accent: "#f4b740",
    label: "Dark",
    blurb: "Charcoal interface with amber highlights.",
  },
};

export default function ThemePreview({ theme, active, onClick }: ThemePreviewProps) {
  const config = THEME_CONFIG[theme];

  return (
    <button className={`theme-card ${active ? "active" : ""}`} type="button" onClick={onClick}>
      <div className="theme-card__header">
        <div className="theme-card__title">
          <span className="theme-name">{config.label}</span>
          {config.tag ? <span className="theme-tag">{config.tag}</span> : null}
        </div>
        {active ? <span className="theme-badge">Current</span> : null}
      </div>

      <div className="theme-preview-box" style={{ background: config.bg, color: config.text }}>
        <div className="theme-preview-bar" style={{ background: config.card }} />
        <div className="theme-preview-columns">
          <div className="theme-preview-col" style={{ background: config.card }} />
          <div className="theme-preview-col short" style={{ background: config.card }} />
        </div>
        <div className="theme-preview-dot" style={{ background: config.accent }} />
      </div>

      <p className="theme-blurb">{config.blurb}</p>
    </button>
  );
}
