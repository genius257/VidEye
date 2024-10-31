import React from "react";
import "./PosterGrid.css";

export default function PosterGrid({
    children,
    ...props
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
    return (
        <div className="postergrid" {...props}>
            {children}
        </div>
    );
}
