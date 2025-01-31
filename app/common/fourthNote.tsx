export function FourthNote() {
  return (
    <>
      <img
        className="inline-block dark:hidden"
        src={process.env.ASSET_PREFIX + "/assets/note.svg"}
        style={{
          transform: "translateY(-0.125em)",
          height: "0.9em",
          width: (13.5 / 41) * 0.9 + "em",
        }}
      />
      <img
        className="hidden dark:inline-block"
        src={process.env.ASSET_PREFIX + "/assets/note-white.svg"}
        style={{
          transform: "translateY(-0.125em)",
          height: "0.9em",
          width: (13.5 / 41) * 0.9 + "em",
        }}
      />
    </>
  );
}
