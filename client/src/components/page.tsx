import { useEffect } from "react";

export default function Page({ title, element }: { title: string; element: JSX.Element }) {
    useEffect(() => {
    }, [title]);
    document.title = title + " – SwapVid";

    return element;
}