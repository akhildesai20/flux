import { useRef } from "react";

function BottomSheet({ open, onClose, children }) {
  const startYRef = useRef(0);

  const onTouchStart = (event) => {
    startYRef.current = event.touches[0]?.clientY ?? 0;
  };

  const onTouchEnd = (event) => {
    const endY = event.changedTouches[0]?.clientY ?? startYRef.current;
    if (endY - startYRef.current > 80) {
      onClose();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`sheet-overlay ${open ? "open" : ""}`}
        aria-label="Close settings panel"
        onClick={onClose}
      />
      <section
        className={`bottom-sheet ${open ? "open" : ""}`}
        aria-hidden={!open}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="drag-handle" />
        <header className="sheet-header">
          <h2>Settings</h2>
          <button type="button" aria-label="Close settings" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="sheet-content">{children}</div>
      </section>
    </>
  );
}

export default BottomSheet;
