"use client";

import { Box } from "@/common/box";
import { useState } from "react";
import AboutTab from "./aboutTab";
import PlayTab from "./playTab";
import EditTab from "./editTab";

export default function MainPage() {
  const [tab, setTab] = useState<number>(undefined);

  return (
    <main className="w-screen h-screen flex flex-col">
      <div className="basis-1/4 flex flex-row items-center justify-center">
        <div className="text-4xl">Falling Nikochan</div>
      </div>
      <div className="flex flex-1 flex-row justify-center p-3">
        <div className="flex flex-col mt-3 justify-center">
          {["Falling Nikochan とは?", "プレイする", "譜面作成"].map(
            (tabName, i) =>
              i === tab ? (
                <Box
                  key={i}
                  className="text-center rounded-r-none py-3 pl-2 pr-1"
                >
                  {tabName}
                </Box>
              ) : (
                <button
                  key={i}
                  className={
                    " text-center hover:bg-sky-200 " +
                    (tab !== undefined
                      ? "rounded-l-lg py-3 pl-2 pr-1"
                      : "rounded-lg p-3")
                  }
                  onClick={() => setTab(i)}
                >
                  {tabName}
                </button>
              )
          )}
        </div>
        {tab !== undefined && (
          <Box className="flex-1 p-3">
            {tab === 0 ? <AboutTab /> : tab === 1 ? <PlayTab /> : <EditTab />}
          </Box>
        )}
      </div>
    </main>
  );
}
