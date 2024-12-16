import React from "react";
import ContextMenu, { ContextMenuItem } from "./contextMenu";

export default class Card extends React.Component<
    React.PropsWithChildren<{
        marked: boolean;
        image?: string;
        progress?: string;
    }>
> {
    static defaultProps = {
        marked: false,
    };

    root: HTMLDivElement | null = null;

    onContextMenu(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        e.preventDefault();

        const clickX = e.clientX;
        const clickY = e.clientY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const rootW = this.root?.offsetWidth ?? 0;
        const rootH = this.root?.offsetHeight ?? 0;

        const right = screenW - clickX > rootW;
        const left = !right;
        const top = screenH - clickY > rootH;
        const bottom = !top;

        ContextMenu.add(
            <>
                <ContextMenuItem
                    onClick={(
                        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
                    ) => console.log("mark as watched")}
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
    }

    render() {
        let className = [
            "card",
            "aspect-video",
            this.props.marked ? "marked" : "",
        ]
            .filter((a) => a)
            .join(" ");

        return (
            <div
                ref={(ref) => (this.root = ref)}
                className={className}
                style={{
                    backgroundImage: this.props.image,
                    //@ts-ignore
                    "--card-progress": this.props.progress,
                }}
                onContextMenu={this.onContextMenu.bind(this)}
            >
                {this.props.children}
            </div>
        );
    }
}
