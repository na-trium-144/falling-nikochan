import { ReactNode } from "react";

export function Small(props: {children: ReactNode}) {
  return <span className="text-sm" {...props} />;
}
export function SmallDomainOnly() {
  return (
    <Small>
      nikochan.
      <wbr />
      natrium
      <wbr />
      144.
      <wbr />
      org
    </Small>
  );
}
export function SmallDomainShare() {
  return (
    <Small>
      nikochan.
      <wbr />
      natrium
      <wbr />
      144.
      <wbr />
      org
      <wbr />
      &#47;
      <wbr />
      share
      <wbr />
      &#47;〜
    </Small>
  );
}
