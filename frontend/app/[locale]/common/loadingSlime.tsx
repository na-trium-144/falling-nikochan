import "./loadingSlime.css";

export function LoadingSlime() {
  return (
    <span className="inline-block relative mx-1 ">
      <img
        src={process.env.ASSET_PREFIX + "/assets/slime.svg"}
        className="h-4 origin-bottom "
        style={{
          animationName: "loading-slime",
          animationIterationCount: "infinite",
          animationDuration: "0.8s",
          animationTimingFunction: "linear",
        }}
      />
      <img
        src={process.env.ASSET_PREFIX + "/assets/slime2.svg"}
        className="absolute inset-0 origin-bottom "
        style={{
          animationName: "loading-slime2",
          animationIterationCount: "infinite",
          animationDuration: "0.8s",
          animationTimingFunction: "linear",
        }}
      />
    </span>
  );
}
