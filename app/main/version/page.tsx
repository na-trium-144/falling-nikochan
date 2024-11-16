import Markdown from "react-markdown";
import { IndexMain } from "../main";
import fs from "node:fs";
import { ExternalLink } from "@/common/extLink";

export default async function Page() {
  const changeLogMD = await fs.promises.readFile("CHANGELOG.md", "utf-8");

  return (
    <IndexMain tab={4}>
      <div className="mb-2">
        <span className="inline-block">Falling Nikochan</span>
        <span className="inline-block">
          <span className="ml-2">ver.</span>
          <span className="ml-1">{process.env.buildVersion}</span>
          {process.env.buildCommit && (
            <span className="ml-1 text-sm">({process.env.buildCommit})</span>
          )}
        </span>
        <span className="ml-2 text-sm inline-block">
          Build at {process.env.buildDate}.
        </span>
      </div>
      <h3 className="text-xl font-bold font-title">主な更新履歴</h3>
      <Markdown
        components={{
          h2: (props) => (
            <h4 className="text-lg font-bold font-title mt-1 " {...props} />
          ),
          a: (props) => (
            <ExternalLink href={props.href}>{props.children}</ExternalLink>
          ),
          ul: (props) => <ul className="list-disc ml-6 " {...props} />,
        }}
      >
        {changeLogMD}
      </Markdown>
    </IndexMain>
  );
}
