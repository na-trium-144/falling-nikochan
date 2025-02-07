import { ExternalLink } from "@/common/extLink";
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props) => (
      <h4 className="text-lg font-bold font-title mt-1 " {...props} />
    ),
    a: (props) => (
      <ExternalLink href={props.href}>{props.children}</ExternalLink>
    ),
    ul: (props) => <ul className="list-disc ml-6 " {...props} />,
    ...components,
  };
}
