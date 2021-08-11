import React from "react";
import "./Poster.css";
import ContextMenu, { ContextMenuItem } from "../contextMenu";

export default class Poster extends React.Component {
  state = {
    counter: null,
    watched: false
  };

  onContextMenu(e) {
    e.preventDefault();

    const clickX = e.clientX;
    const clickY = e.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const rootW = this.root.offsetWidth;
    const rootH = this.root.offsetHeight;

    const right = screenW - clickX > rootW;
    const left = !right;
    const top = screenH - clickY > rootH;
    const bottom = !top;

    ContextMenu.add(
      <React.Fragment>
        <ContextMenuItem onClick={(e) => console.log("mark as watched")}>
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
    var className = ["poster", this.state.watched ? "" : "marked"]
      .filter((v) => v)
      .join(" ");

    return (
      <div
        ref={(ref) => (this.root = ref)}
        className={className}
        style={{
          backgroundImage: this.props.image,
          "--card-progress": this.state.progress
        }}
        onContextMenu={this.onContextMenu.bind(this)}
      >
        {this.state.counter !== null || !this.state.watched ? (
          <div className="posterCounter"></div>
        ) : null}
      </div>
    );
  }
}
