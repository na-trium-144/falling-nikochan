"use client";

import { useState } from "react";
import { MetaEdit } from "./edit/[cid]/metaTab";
import { Chart, emptyChart } from "./chartFormat/command";
import Button from "./common/button";
import { useRouter } from "next/navigation";

export default function AboutTab() {
  const [chart, setChart] = useState<Chart>(emptyChart());
  const [errorMsg, setErrorMsg] = useState<string>("");
  const router = useRouter();
  return (
    <>
      <MetaEdit chart={chart} setChart={setChart} />
      <p>
      <Button
        text="新規作成"
        onClick={async () => {
          const res = await fetch(`/api/newChartFile/`, {
            method: "POST",
            body: JSON.stringify(chart),
          });
          const resBody = await res.json();
          if (res.ok) {
            if (typeof resBody.cid === "string") {
              router.push(`/edit/${resBody.cid}`);
            } else {
              setErrorMsg("Invalid response");
            }
          } else {
            setErrorMsg(`${res.status}: ${resBody.message}`);
          }
        }}
      />
      <span className="ml-1">{errorMsg}</span>
      </p>
    </>
  );
}
