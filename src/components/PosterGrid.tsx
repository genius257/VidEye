import React from "react";
import "./PosterGrid.css";

export default class PosterGrid extends React.Component {
    /**
     * render
     */
    public render() {
        return (
            <div className="postergrid" {...this.props}>
                {this.props.children}
            </div>
        );
    }
}
