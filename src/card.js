import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import ContextMenu, { ContextMenuItem } from "./contextMenu";
import History from "./history";

/*const [
  bindMenu,
  bindMenuItem,
  useContextTrigger,
  { data, coords, setVisible }
] = useContextMenu();*/

/*const [bindTrigger] = useContextTrigger({
  // those are the default values
  disable: false, // disable the trigger
  holdToDisplay: 1000, // time in ms after which the context menu will appear when holding the touch
  posX: 0, // distance in pixel from which the context menu will appear related to the right click X coord
  posY: 0, // distance in pixel from which the context menu will appear related to the right click y coord
  mouseButton: useContextTrigger.MOUSE_BUTTON.RIGHT, // set to 0 for triggering the context menu with the left click
  disableIfShiftIsPressed: false, // Self explanatory 😺
  collect: () => "useContextMenu is cool!" // collect data to be passed to the context menu, see the example to see this in action
});*/

export default class Card extends React.Component {
  /*const [
    bindMenu,
    bindMenuItem,
    useContextTrigger,
    { data, coords, setVisible }
  ] = useContextMenu();*/

  static propTypes = {
    marked: PropTypes.bool,
    image: PropTypes.string,
    progress: PropTypes.string
  };

  static defaultProps = {
    marked: false
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
        <ContextMenuItem onClick={e => console.log("mark as watched")}>
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
    let className = ["card", this.props.marked ? "marked" : ""]
      .filter(a => a)
      .join(" ");

    return (
      <div
        ref={ref => (this.root = ref)}
        className={className}
        style={{
          backgroundImage: this.props.image,
          "--card-progress": this.props.progress
        }}
        onContextMenu={this.onContextMenu.bind(this)}
      >
        {this.props.children}
      </div>
    );
  }
}
