"use client";

import clsx from "clsx/lite";
import { Box } from "@/common/box";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DownOne from "@icon-park/react/lib/icons/DownOne.js";
import RightOne from "@icon-park/react/lib/icons/RightOne.js";
import Close from "@icon-park/react/lib/icons/Close";
import { ExternalLink } from "@/common/extLink";
import { LicenseEntry, normalizeRepositoryURL } from "next-license-list";

export function OSSLicensesList({
  frontendLicenses,
}: {
  frontendLicenses: LicenseEntry[];
}) {
  const t = useTranslations("main.policies.license");
  const [open, setOpen] = useState<boolean>(false);
  const [workerLicenses, setWorkerLicenses] = useState<LicenseEntry[] | null>(
    null
  );
  useEffect(() => {
    if (workerLicenses === null) {
      fetch(process.env.ASSET_PREFIX + "/oss-licenses/worker.json")
        .then((res) => res.json())
        .then((data) =>
          setWorkerLicenses(
            (data as LicenseEntry[]).map((e) => normalizeRepositoryURL(e))
          )
        )
        .catch(() => []);
    }
  }, [workerLicenses]);
  const licenses: LicenseEntry[] = Array.isArray(frontendLicenses)
    ? frontendLicenses.slice()
    : [];
  if (workerLicenses) {
    for (const wl of workerLicenses) {
      if (
        !licenses.some((fl) => fl.name === wl.name && fl.version === wl.version)
      ) {
        licenses.push(wl);
      }
    }
  }
  licenses.sort((a, b) => a.name.localeCompare(b.name));

  if (open) {
    return (
      <Box classNameOuter="mt-1 p-4">
        <p className="mb-2 text-sm">
          <button className={clsx("fn-link-1")} onClick={() => setOpen(false)}>
            <Close className="inline-block align-middle mr-2" />
            {t("closeDetail")}
          </button>
        </p>
        {licenses?.map((lic, i) => (
          <LicenseDetail key={i} license={lic} />
        ))}
      </Box>
    );
  } else {
    return (
      <button
        className={clsx(
          "block w-full text-left ml-2 my-1 text-sm",
          "fn-link-1"
        )}
        onClick={() => setOpen(true)}
      >
        {t("showDetail")}
        <RightOne theme="filled" className="inline-block align-middle ml-2" />
      </button>
    );
  }
}

function LicenseDetail(props: { license: LicenseEntry }) {
  const t = useTranslations("main.policies.license");
  const [open, setOpen] = useState<boolean>(false);
  let author: string = props.license.author ?? "";
  // remove email or url
  author = author.replace(/(.*) <.*@.*>/, "$1");
  author = author.replace(/(.*) \(https?:\/\/.*\)/, "$1");

  return (
    <details
      className="mb-2 text-sm"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className={clsx("text-left break-all list-none", "fn-link-1")}>
        <span className="font-bold">{props.license.name}</span>
        <span className="inline-block font-bold text-sm ml-1">
          {props.license.version}
        </span>
        <span className="inline-block font-bold ml-1">
          ({props.license.license})
        </span>
        {author && <span className="inline-block ml-2">{author}</span>}
        {open ? (
          <DownOne theme="filled" className="inline-block align-middle ml-2" />
        ) : (
          <RightOne theme="filled" className="inline-block align-middle ml-2" />
        )}
      </summary>
      <div className="pl-4">
        <p className="mt-1 text-left">
          <span className="mr-1">{t("source")}:</span>
          <ExternalLink
            className="max-w-full break-all"
            href={props.license.repository}
          >
            {props.license.repository}
          </ExternalLink>
        </p>
        <LicenseTextBox>
          {(props.license.licenseText ?? "") +
            "\n\n" +
            (props.license.noticeText ?? "")}
        </LicenseTextBox>
      </div>
    </details>
  );
}

function LicenseTextBox(props: { children: string }) {
  return (
    <pre
      className={clsx(
        "mt-1 p-2 rounded-md",
        "overflow-x-auto text-xs",
        "bg-sky-200/25 dark:bg-orange-800/10"
      )}
    >
      {props.children.trim()}
    </pre>
  );
}
