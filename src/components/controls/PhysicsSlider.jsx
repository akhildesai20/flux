function PhysicsSlider({ label, value, min, max, step, onChange }) {
  return (
    <label className="slider-control">
      <span>
        {label} <strong>{value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}</strong>
      </span>
      <input
        aria-label={`${label} slider`}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default PhysicsSlider;
