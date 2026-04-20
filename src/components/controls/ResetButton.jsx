function ResetButton({ onClick }) {
  return (
    <button type="button" className="reset-button" onClick={onClick}>
      Reset Physics
    </button>
  );
}

export default ResetButton;
