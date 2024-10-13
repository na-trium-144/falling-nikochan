import { ReactNode } from "react";

export const metadata = {
    openGraph: {
        url: "/",
    }
};

export default function Page(props: { children: ReactNode[] }) {
    return props.children;
}
