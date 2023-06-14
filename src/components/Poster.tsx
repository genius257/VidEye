import React from "react";
import "./Poster.css";
import ContextMenu, { ContextMenuItem } from "../contextMenu";

type PosterProps = {
    image?: string;
    title?: string;
    marked?: boolean;
};

type PosterState = {
    counter: null;
    //watched: boolean;
    progress?: number;
};

export default class Poster extends React.Component<PosterProps, PosterState> {
    state: PosterState = {
        counter: null
        //watched: false
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
            <React.Fragment>
                <ContextMenuItem
                    onClick={(e) => console.log("mark as watched")}
                >
                    Mark as watched
                </ContextMenuItem>
                <ContextMenuItem>Mark as unwatched</ContextMenuItem>
                <ContextMenuItem disabled>Details</ContextMenuItem>
                <ContextMenuItem>Something else</ContextMenuItem>
            </React.Fragment>,
            e.pageX,
            e.pageY
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
        var className = ["poster", this.props.marked ? "marked" : ""]
            .filter((v) => v)
            .join(" ");

        return (
            <div
                ref={(ref) => (this.root = ref)}
                className={className}
                style={
                    {
                        backgroundImage: this.props.image,
                        "--card-progress": this.state.progress
                    } as React.CSSProperties
                }
                onContextMenu={this.onContextMenu.bind(this)}
                title={this.props.title}
            >
                {this.state.counter !== null || !this.props.marked ? (
                    <div className="posterCounter"></div>
                ) : null}
            </div>
        );
    }
}
