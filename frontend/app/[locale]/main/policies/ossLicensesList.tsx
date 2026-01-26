"use client";

import clsx from "clsx/lite";
import { Box } from "@/common/box";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DownOne from "@icon-park/react/lib/icons/DownOne.js";
import RightOne from "@icon-park/react/lib/icons/RightOne.js";
import { linkStyle1 } from "@/common/linkStyle";
import Close from "@icon-park/react/lib/icons/Close";
import { ExternalLink } from "@/common/extLink";

// https://github.com/codepunkt/webpack-license-plugin の出力形式
interface LicenseOutput {
  name: string;
  version: string;
  author?: string;
  repository?: string;
  source?: string;
  license?: string;
  licenseText?: string;
  noticeText?: string;
}

export function OSSLicensesList() {
  const t = useTranslations("main.policies.license");
  const [open, setOpen] = useState<boolean>(false);
  const [licenses, setLicenses] = useState<LicenseOutput[] | null>(null);
  useEffect(() => {
    if (open && licenses === null) {
      (async () => {
        const pFrontendLicenses = fetch(
          process.env.ASSET_PREFIX + "/oss-licenses/frontend.json"
        )
          .then((res) => res.json())
          .catch(() => []);
        const pWorkerLicenses = fetch(
          process.env.ASSET_PREFIX + "/oss-licenses/worker.json"
        )
          .then((res) => res.json())
          .catch(() => []);
        const licenses: LicenseOutput[] = await pFrontendLicenses;
        for (const wl of await pWorkerLicenses) {
          if (!licenses.some((fl) => fl.name === wl.name)) {
            licenses.push(wl);
          }
        }
        licenses.sort((a, b) => a.name.localeCompare(b.name));
        setLicenses(licenses);
      })();
    }
  }, [open, licenses]);

  if (open) {
    return (
      <Box className="ml-6 p-4">
        <p className="mb-4">
          <button className={clsx(linkStyle1)} onClick={() => setOpen(false)}>
            <Close className="inline-block align-middle mr-2" />
            {t("closeDetail")}
          </button>
        </p>
        {licenses?.map((lic) => (
          <LicenseDetail key={lic.name} license={lic} />
        ))}
      </Box>
    );
  } else {
    return (
      <button
        className={clsx("ml-6 mt-2", linkStyle1)}
        onClick={() => setOpen(true)}
      >
        {t("showDetail")}
        <RightOne theme="filled" className="inline-block align-middle ml-2" />
      </button>
    );
  }
}

function LicenseDetail(props: { license: LicenseOutput }) {
  const t = useTranslations("main.policies.license");
  const [open, setOpen] = useState<boolean>(false);
  let author: string = props.license.author ?? "";
  // remove email or url
  author = author.replace(/(.*) <.*@.*>/, "$1");
  author = author.replace(/(.*) \(https?:\/\/.*\)/, "$1");
  let repositoryURL: string;
  if (props.license.repository?.startsWith("http")) {
    repositoryURL = props.license.repository;
  } else if (props.license.repository?.startsWith("git+http")) {
    repositoryURL = props.license.repository?.slice(4);
  } else if (props.license.repository?.startsWith("git@")) {
    repositoryURL =
      "https://" +
      props.license.repository
        .slice(4)
        .replace(":", "/")
        .replace(/\.git$/, "");
  } else if (
    props.license.repository &&
    /github:[\w-]+\/[\w-]+/.test(props.license.repository)
  ) {
    repositoryURL = `https://github.com/${props.license.repository.slice(7)}`;
  } else if (
    props.license.repository &&
    /[\w-]+\/[\w-]+/.test(props.license.repository)
  ) {
    // assume github username/repository
    repositoryURL = `https://github.com/${props.license.repository}`;
  } else {
    // fallback to source url
    repositoryURL = props.license.source ?? "";
  }

  return (
    <div className="mb-2">
      <button
        className={clsx("text-left break-all", linkStyle1)}
        onClick={() => setOpen(!open)}
      >
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
      </button>
      {open && (
        <>
          <p className="ml-4 mt-1 text-left">
            <span className="text-sm mr-1">{t("source")}:</span>
            <ExternalLink
              className="text-sm max-w-full break-all"
              href={repositoryURL}
            >
              {repositoryURL}
            </ExternalLink>
          </p>
          <pre
            className={clsx(
              "ml-4 mt-1 p-2 rounded-md",
              "overflow-x-auto text-xs",
              "bg-sky-200/25 dark:bg-orange-800/10"
            )}
          >
            {props.license.licenseText}
            {props.license.noticeText && (
              <>
                {"\n\n"}
                {props.license.noticeText}
              </>
            )}
          </pre>
        </>
      )}
    </div>
  );
}
