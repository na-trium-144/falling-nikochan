import { ReactNode } from "react";

export function Small(props: { children: ReactNode }) {
  return <span className="text-sm" {...props} />;
}
export function SmallDomainOnly() {
  return (
    <Small>
      nikochan.
      <wbr />
      utcode.
      <wbr />
      net
    </Small>
  );
}
export function SmallDomainShare() {
  return (
    <Small>
      nikochan.
      <wbr />
      utcode.
      <wbr />
      net
      <wbr />
      &#47;
      <wbr />
      share
      <wbr />
      &#47;〜
    </Small>
  );
}
