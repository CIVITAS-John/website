/** Panel: A panel for the visualizer. */
export class Panel {
    /** Title: The title of the panel. */
    Title = "";
    /** Visualizer: The visualizer in-use. */
    Visualizer;
    /** Container: The container for the side panel. */
    Container;
    /** Dataset: The dataset of the visualizer. */
    get Dataset() { return this.Visualizer.Dataset; }
    /** InfoPanel: The information panel for the visualization. */
    get InfoPanel() { return this.Visualizer.InfoPanel; }
    /** SidePanel: The side panel for the visualization. */
    get SidePanel() { return this.Visualizer.SidePanel; }
    /** Dialog: Dialog for the visualization. */
    get Dialog() { return this.Visualizer.Dialog; }
    /** Constructor: Constructing the side panel. */
    constructor(Container, Visualizer) {
        this.Visualizer = Visualizer;
        this.Container = Container;
    }
    /** Show: Show the panel. */
    Show() {
        this.Container.show();
        this.Render();
    }
    /** Hide: Hide the panel. */
    Hide() {
        this.Container.hide();
    }
    /** Toggle: Toggle the panel. */
    Toggle() {
        this.Container.toggle();
    }
    /** Render: Render the panel. */
    Render() { }
}
