export function FourthNote() {
  return (
    <>
      <img
        className="inline-block dark:hidden"
        src="/note.svg"
        style={{
          transform: "translateY(-0.125em)",
          height: "0.9em",
          width: (13.5 / 41) * 0.9 + "em",
        }}
      />
      <img
        className="hidden dark:inline-block"
        src="/note-white.svg"
        style={{
          transform: "translateY(-0.125em)",
          height: "0.9em",
          width: (13.5 / 41) * 0.9 + "em",
        }}
      />
    </>
  );
}
