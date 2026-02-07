import clsx from "clsx/lite";
import { ExternalLink } from "@/common/extLink";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: "h3",
    h2: "h4",
    a: (props) =>
      props.href.startsWith("http") ? (
        <ExternalLink href={props.href}>{props.children}</ExternalLink>
      ) : (
        <Link
          className={clsx("fn-link-3")}
          href={props.href}
          prefetch={!process.env.NO_PREFETCH}
        >
          {props.children}
        </Link>
      ),
    ul: (props) => <ul className="list-disc ml-6 " {...props} />,
    code: (props) => <code className="fn-code" {...props} />,
    ...components,
  };
}
