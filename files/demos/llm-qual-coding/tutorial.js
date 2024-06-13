import { Panel } from './panels/panel.js';

/** Tutorial: The interactive tutorial for the visualizer. */
export class Tutorial extends Panel {
    /** Constructor: Constructing the tutorial. */
    constructor(Container, Visualizer) {
        super(Container, Visualizer);
        driver = window.driver.js.driver || driver;
        // Create the tutorial
        var Tutorial = driver({
            showProgress: true,
            steps: [
                {
                    element: ".side-panel",
                    popover: { title: "Welcome to the Visualizer", description: "" }
                }
            ]
        });
        // Show the tutorial
        Tutorial.drive();
    }
}
