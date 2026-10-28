import clsx from "clsx/lite";
import { ExternalLink /*, isExternalLink*/ } from "@/common/extLink";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";

function isExternalLink(href: string) {
  return !href.startsWith("/") || href.startsWith("/api");
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: "h3",
    h2: "h4",
    a: (props) =>
      isExternalLink(props.href) ? (
        <ExternalLink href={props.href}>{props.children}</ExternalLink>
      ) : (
        <Link
          className={clsx("fn-link-3")}
          href={props.href}
          prefetch={process.env.PREFETCH as "auto"}
        >
          {props.children}
        </Link>
      ),
    ul: (props) => <ul className="list-disc ml-6 " {...props} />,
    code: (props) => <code className="fn-code" {...props} />,
    ...components,
  };
}
