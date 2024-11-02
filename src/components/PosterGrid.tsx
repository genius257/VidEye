import { HTMLAttributes, PropsWithChildren } from "react";
import "./PosterGrid.css";

export default function PosterGrid({
    children,
    ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
    return (
        <div className="postergrid" {...props}>
            {children}
        </div>
    );
}
