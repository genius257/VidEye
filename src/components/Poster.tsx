import React, {
    CSSProperties,
    /*MouseEvent,*/ useCallback,
    useRef,
    useState,
} from "react";
import "./Poster.css";
import ContextMenu, { ContextMenuItem } from "../contextMenu";

type PosterProps = {
    image?: string;
    title?: string;
    marked?: boolean;
};

export default function Poster({ title, image, marked }: PosterProps) {
    const [counter /*, setCounter*/] = useState(null);
    const [progress /*, setProgress*/] = useState(0);

    const ref = useRef<HTMLDivElement>(null);

    const contextMenuCallback = useCallback(
        (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            e.preventDefault();

            const clickX = e.clientX;
            const clickY = e.clientY;
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            const rootW = ref.current?.offsetWidth ?? 0;
            const rootH = ref.current?.offsetHeight ?? 0;

            const right = screenW - clickX > rootW;
            const left = !right;
            const top = screenH - clickY > rootH;
            const bottom = !top;

            ContextMenu.add(
                <>
                    <ContextMenuItem
                        onClick={(e) => console.log("mark as watched")}
                    >
                        Mark as watched
                    </ContextMenuItem>
                    <ContextMenuItem>Mark as unwatched</ContextMenuItem>
                    <ContextMenuItem disabled>Details</ContextMenuItem>
                    <ContextMenuItem>Something else</ContextMenuItem>
                </>,
                e.pageX,
                e.pageY,
            );

            //this.root.style.display = "absolute";

            if (right) {
                //this.root.style.left = `${clickX + 5}px`;
            }

            if (left) {
                //this.root.style.left = `${clickX - rootW - 5}px`;
            }

            if (top) {
                //this.root.style.top = `${clickY + 5}px`;
            }

            if (bottom) {
                //this.root.style.top = `${clickY - rootH - 5}px`;
            }

            //console.log("onContextMenu");
        },
        [],
    );

    var className = ["poster", marked ? "marked" : ""]
        .filter((v) => v)
        .join(" ");

    return (
        <div
            ref={ref}
            className={className}
            style={
                {
                    backgroundImage: image,
                    "--card-progress": progress,
                } as CSSProperties
            }
            onContextMenu={contextMenuCallback}
            title={title}
        >
            {counter !== null || !marked ? (
                <div className="posterCounter"></div>
            ) : null}
        </div>
    );
}
