const OPTIONS = ["blueCyan", "heat", "neon", "monochrome", "rainbow", "custom"];

function swatchStyle(option, customColor) {
  switch (option) {
    case "blueCyan":
      return { background: "linear-gradient(90deg,#001,#07f,#8ff)" };
    case "heat":
      return { background: "linear-gradient(90deg,#000,#b00,#f80)" };
    case "neon":
      return { background: "linear-gradient(90deg,#f0f,#0ff,#ff0)" };
    case "monochrome":
      return { background: "linear-gradient(90deg,#111,#666,#eee)" };
    case "rainbow":
      return { background: "linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet)" };
    default:
      return { background: customColor };
  }
}

function ColorSchemeSelector({ value, onChange, customColor, onCustomColorChange }) {
  return (
    <section className="control-section">
      <h3>Color Scheme</h3>
      <div className="button-grid">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "active color-option" : "color-option"}
            onClick={() => onChange(option)}
          >
            <span className="swatch" style={swatchStyle(option, customColor)} />
            {option}
          </button>
        ))}
      </div>
      {value === "custom" ? (
        <label className="color-input">
          Custom Color
          <input type="color" value={customColor} onChange={(event) => onCustomColorChange(event.target.value)} />
        </label>
      ) : null}
    </section>
  );
}

export default ColorSchemeSelector;
