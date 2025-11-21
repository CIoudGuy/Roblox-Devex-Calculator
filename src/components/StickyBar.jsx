export default function StickyBar({ onExport, onCopy }) {
  return (
    <div className="sticky-bar" id="stickyBar">
      <button className="bar-btn" id="stickyExport" type="button" onClick={onExport}>
        Export PNG
      </button>
      <button className="bar-btn ghost" id="copyNumbers" type="button" onClick={onCopy}>
        Copy numbers
      </button>
    </div>
  );
}
