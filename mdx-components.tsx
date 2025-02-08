import { ExternalLink } from "@/common/extLink";
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h3 className="text-xl font-bold font-title mt-4 first:mt-0 mb-2" {...props} />
    ),
    h2: (props) => (
      <h4 className="text-lg font-bold font-title mt-1 " {...props} />
    ),
    a: (props) => (
      <ExternalLink href={props.href}>{props.children}</ExternalLink>
    ),
    ul: (props) => <ul className="list-disc ml-6 " {...props} />,
    code: (props) => (
      <code
        className={
          "font-mono text-sm px-1 py-0.5 rounded border " +
          "bg-white border-slate-300 " +
          "dark:bg-stone-800 dark:border-slate-600 "
        }
        {...props}
      />
    ),
    ...components,
  };
}
