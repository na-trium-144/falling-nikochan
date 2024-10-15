import "./loadingSlime.css";

export function LoadingSlime() {
  return (
    <img
      src="/slime.svg"
      className="inline-block h-4 origin-bottom mx-1 "
      style={{
        animationName: "loading-slime",
        animationIterationCount: "infinite",
        animationDuration: "0.8s",
        animationTimingFunction: "linear",
      }}
    />
  );
}
