type StickyBarProps = {
  onCopy: () => void;
};

export default function StickyBar({ onCopy }: StickyBarProps) {
  return (
    <div className="sticky-bar" id="stickyBar">
      <button className="bar-btn ghost" id="copyNumbers" type="button" onClick={onCopy}>
        Copy numbers
      </button>
    </div>
  );
}
