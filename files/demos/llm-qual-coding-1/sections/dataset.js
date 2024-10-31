
import { Panel } from "../panels/panel.js";
import { FilterNodeByExample } from "../utils/graph.js";
import { FormatDate } from "../utils/utils.js";
import { ChunkFilter, DatasetFilter } from "../utils/filters.js";
import { GetItemsFromDataset } from "../utils/dataset.js";
/** DatasetSection: The dataset side panel. */
export class DatasetSection extends Panel {
    /** Name: The short name of the panel. */
    Name = "Datasets";
    /** Title: The title of the panel. */
    Title = "Dataset Overview";
    /** Constructor: Constructing the panel. */
    constructor(Container, Visualizer) {
        super(Container, Visualizer);
        this.Visualizer = Visualizer;
        this.Container = $(`<div class="dataset"></div>`).appendTo(Container).hide();
    }
    /** Show: Show the panel. */
    Show() {
        this.Container.show();
        this.ShowDatasets();
    }
    /** RatioColorizer: The colorizer for ratios. */
    RatioColorizer = d3.scaleSequential().interpolator(d3.interpolateViridis).domain([0, 1]);
    /** ShowDatasets: Show all datasets. */
    ShowDatasets() {
        this.SetRefresh(() => {
            this.Container.empty();
            // Basic information
            this.Container.append($(`<h3>Metadata</h3>`));
            this.BuildList([
                { Name: "Title", Value: this.Source.Title },
                { Name: "Description", Value: this.Source.Description },
                { Name: "Research Question", Value: this.Source.ResearchQuestion },
                { Name: "Notes for Coding", Value: this.Source.CodingNotes },
            ], (Item, Data) => {
                Item.append($(`<strong>${Data.Name}:</strong>`));
                Item.append($(`<span></span>`).text(Data.Value));
            }).appendTo(this.Container);
            // Source datasets
            var Nodes = this.GetGraph().Nodes;
            this.Container.append($(`<h3>Datasets</h3>`));
            this.BuildTable(Object.entries(this.Source.Data), (Row, [Key, Value]) => {
                // Interactivity
                Row.toggleClass("chosen", this.Visualizer.IsFilterApplied("Dataset", Key))
                    .on("mouseover", (Event) => this.Visualizer.SetFilter(true, new DatasetFilter(), Key))
                    .on("mouseout", (Event) => this.Visualizer.SetFilter(true, new DatasetFilter()));
                // Show the summary
                var Summary = $(`<td class="dataset-cell actionable"></td>`).attr("id", `dataset-${Key}`).appendTo(Row);
                Summary.append($(`<h4></h4>`).text(Key)).on("click", (Event) => {
                    if (Event.shiftKey)
                        this.Visualizer.SetFilter(false, new DatasetFilter(), Key, Event.shiftKey);
                    else
                        this.ShowDataset(Key, Value);
                });
                // Find the date
                var Items = GetItemsFromDataset(Value);
                var Dates = Items.map((Item) => Item.Time).sort((A, B) => A.getTime() - B.getTime());
                Summary.append($(`<p class="tips"></p>`).text(`From ${FormatDate(Dates[0])}`));
                Summary.append($(`<p class="tips"></p>`).text(`To ${FormatDate(Dates[Dates.length - 1])}`));
                // Show the items
                var IDs = new Set(Items.map((Item) => Item.ID));
                var SizeCell = $(`<td class="number-cell actionable"></td>`).text(`${IDs.size}`).appendTo(Row);
                SizeCell.append($(`<p class="tips"></p>`).text(`${Object.keys(Value).length} Chunks`));
                // Show the codes
                var Codes = Nodes.filter((Node) => FilterNodeByExample(Node, Array.from(IDs)));
                var Currents = Codes.filter((Node) => !Node.Hidden);
                var Color = this.RatioColorizer(Currents.length / Codes.length);
                $(`<td class="metric-cell"></td>`)
                    .css("background-color", Color.toString())
                    .css("color", d3.lab(Color).l > 70 ? "black" : "white")
                    .appendTo(Row)
                    .text(`${Currents.length}`)
                    .append($(`<p></p>`).text(d3.format(".0%")(Currents.length / Codes.length)));
                $(`<td class="number-cell actionable"></td>`).appendTo(Row).text(`${Codes.length}`).append($(`<p></p>`).text(`100%`));
                // Generic click event
                Row.children("td:not(.dataset-cell)").on("click", (Event) => this.Visualizer.SetFilter(false, new DatasetFilter(), Key, Event.shiftKey));
            }, ["Metadata", "Items", "Filtered", "Codes"]);
        });
    }
    /** ShowDataset: Show a specific dataset. */
    ShowDataset(Name, Dataset) {
        // Filter by the dataset, if not already
        if (!this.Visualizer.IsFilterApplied("Dataset", Name))
            this.Visualizer.SetFilter(false, new DatasetFilter(), Name);
        // Show the component
        this.SetRefresh(() => {
            this.Container.empty();
            // Show the title
            this.Container.append($(`<h3>${Name} (${Object.keys(Dataset).length} Chunks)</h3>`).prepend(this.BuildReturn(() => {
                if (this.Visualizer.IsFilterApplied("Dataset", Name))
                    this.Visualizer.SetFilter(false, new DatasetFilter());
                this.ShowDatasets();
            })));
            // Show the chunks
            var Nodes = this.GetGraph().Nodes;
            this.BuildTable(Object.entries(Dataset), (Row, [Key, Chunk], Index) => {
                // Interactivity
                Row.toggleClass("chosen", this.Visualizer.IsFilterApplied("Chunk", Key))
                    .on("mouseover", (Event) => this.Visualizer.SetFilter(true, new ChunkFilter(), Key))
                    .on("mouseout", (Event) => this.Visualizer.SetFilter(true, new ChunkFilter()));
                // Show the summary
                var Summary = $(`<td class="chunk-cell actionable"></td>`).attr("id", `chunk-${Key}`).appendTo(Row);
                Summary.append($(`<h4></h4>`).text(`Chunk ${Key}`));
                // Find the date
                var Items = Chunk.AllItems ?? [];
                Items = Items.filter((Item) => (this.Parameters.UseExtendedChunk ? true : !Item.Chunk || Item.Chunk == Key));
                var Dates = Items.map((Item) => Item.Time).sort((A, B) => A.getTime() - B.getTime());
                Summary.append($(`<p class="tips"></p>`).text(`From ${FormatDate(Dates[0])}`));
                Summary.append($(`<p class="tips"></p>`).text(`To ${FormatDate(Dates[Dates.length - 1])}`));
                Summary.on("click", () => this.Dialog.ShowChunk(Key, Chunk));
                // Show the items
                $(`<td class="number-cell actionable"></td>`).text(Items.length.toString()).appendTo(Row);
                // Show the codes
                var Codes = Nodes.filter((Node) => FilterNodeByExample(Node, Items.map((Item) => Item.ID) ?? []));
                var Currents = Codes.filter((Node) => !Node.Hidden);
                var Color = this.RatioColorizer(Currents.length / Math.max(1, Codes.length));
                $(`<td class="metric-cell"></td>`)
                    .css("background-color", Color.toString())
                    .css("color", d3.lab(Color).l > 70 ? "black" : "white")
                    .appendTo(Row)
                    .text(`${Currents.length}`)
                    .append($(`<p></p>`).text(d3.format(".0%")(Currents.length / Codes.length)));
                $(`<td class="number-cell actionable"></td>`).appendTo(Row).text(`${Codes.length}`).append($(`<p></p>`).text(`100%`));
                // Generic click event
                Row.children("td:not(.chunk-cell)").on("click", (Event) => this.Visualizer.SetFilter(false, new ChunkFilter(), Key, Event.shiftKey));
            }, ["Metadata", "Items", "Filtered", "Codes"]);
        });
    }
}
