import { IndexMain } from "../main";

export default function Page() {
  return (
    <IndexMain tab={4}>
      <div className="mb-2">
        <span className="inline-block">Falling Nikochan</span>
        <span className="inline-block">
          <span className="ml-2">ver.</span>
          <span className="ml-1">{process.env.buildVersion}</span>
          <span className="ml-1 text-sm">({process.env.buildCommit})</span>
        </span>
      <span className="ml-2 text-sm inline-block">
        Build at {process.env.buildDate}.
      </span>
      </div>
      <h3 className="text-xl font-bold font-title mb-2">
        更新履歴
      </h3>
    </IndexMain>
  );
}
