const OPTIONS = [14, 21, 32];

function GridSizeSelector({ value, onChange }) {
  return (
    <section className="control-section">
      <h3>Grid Size</h3>
      <div className="button-row">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "active" : ""}
            onClick={() => onChange(option)}
          >
            {option}x{option}
          </button>
        ))}
      </div>
    </section>
  );
}

export default GridSizeSelector;
