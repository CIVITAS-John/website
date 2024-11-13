
import { GetCodebookColor } from "../utils/utils.js";
import { Panel } from "./panel.js";
import { FindOriginalCodes, GetChunks } from "../utils/dataset.js";
import { EvaluatePerCluster } from "../utils/evaluate.js";
import { OwnerFilter } from "../utils/filters.js";
import { RenderExamples, RenderItem } from "../utils/render.js";
import { FilterItemByUser } from "../utils/graph.js";
/** Dialog: The dialog for the visualizer. */
export class Dialog extends Panel {
    /** Constructor: Constructing the dialog. */
    constructor(Container, Visualizer) {
        super(Container, Visualizer);
        Container.children("div.close").on("click", () => this.Hide());
    }
    /** ShowPanel: Show a panel in the dialog. */
    ShowPanel(Panel) {
        // Add a back button
        $(`<a class="back" href="javascript:void(0)">⮜</a>`)
            .on("click", () => window.history.back())
            .prependTo(Panel.children("h3"));
        // Show the panel
        var Content = this.Container.children("div.content");
        Content.get(0).scrollTop = 0;
        Content.children().remove();
        Content.append(Panel);
        this.Show();
    }
    /** ShowCode: Show a dialog for a code. */
    ShowCode(Owner, Original, ...Codes) {
        this.Visualizer.PushState(`code-${encodeURIComponent(Original.Label)}-${Owner}`, () => this.ShowCode(Owner, Original, ...Codes));
        // Check if it's the baseline
        var IsBaseline = Owner == 0;
        if (Codes.length == 0)
            Codes.push(Original);
        // Build the panel
        var Panel = $(`<div class="panel"></div>`);
        for (var Code of Codes) {
            if (Panel.children().length > 0)
                $("<hr>").appendTo(Panel);
            this.InfoPanel.BuildPanelForCode(Panel, Code, true);
        }
        Panel.children("h3").append($(`<span style="color: ${GetCodebookColor(Owner, this.Dataset.Codebooks.length)}">${this.Dataset.Names[Owner]}</span>`));
        // Add a back button if it's not the baseline
        if (!IsBaseline) {
            var Source = $(`<p>Consolidated into: <a href="javascript:void(0)" class="back">←</a></p>`);
            Source.children("a")
                .text(Original.Label)
                .on("click", () => {
                this.ShowCode(0, Original);
            });
            Panel.children("h3").after(Source);
        }
        // Show the dialog
        this.ShowPanel(Panel);
    }
    /** ShowUser: Show a dialog for a user. */
    ShowUser(ID, Owners = [], ScrollTo) {
        this.Visualizer.PushState(`speaker-${ID}`, () => this.ShowUser(ID, Owners, ScrollTo));
        // Build the panel
        var Panel = $(`<div class="panel"></div>`);
        // Add the title
        Panel.append($(`<h3>User ${this.Visualizer.Dataset.UserIDToNicknames?.get(ID) ?? ID}</h3>`));
        Panel.append($(`<hr/>`));
        var Codes = this.GetGraph().Nodes;
        // Show the items
        var List = $(`<ol class="quote"></ol>`).appendTo(Panel);
        var Items = FilterItemByUser(this.Visualizer.Dataset.Source, [ID]);
        var TargetElement;
        Items.forEach((Item) => {
            // Show the item
            var Current = RenderItem(this.Visualizer, Item, Owners).appendTo(List);
            if (Item.ID == ScrollTo) {
                TargetElement = Current;
                Current.addClass("highlighted");
            }
            // Show related codes
            Current.append(RenderExamples(Codes, this.Visualizer, Item, Owners));
        });
        // Show the dialog
        this.ShowPanel(Panel);
        // Scroll to the target element
        if (TargetElement) {
            var Offset = TargetElement.offset().top;
            this.Container.children("div.content")
                .get(0)
                ?.scrollTo(0, Offset - 60);
        }
    }
    /** ShowChunk: Show a dialog for a chunk. */
    ShowChunk(Name, Chunk, Owners = [], ScrollTo) {
        this.Visualizer.PushState(`chunk-${Name}`, () => this.ShowChunk(Name, Chunk, Owners, ScrollTo));
        // Build the panel
        var Panel = $(`<div class="panel"></div>`);
        // Add the title
        Panel.append($(`<h3>Chunk ${Name} (${Chunk.AllItems?.length} Items)</h3>`));
        Panel.append($(`<hr/>`));
        var Codes = this.GetGraph().Nodes;
        // Show the items
        var List = $(`<ol class="quote"></ol>`).appendTo(Panel);
        var Items = Chunk.AllItems ?? [];
        var Orthodox = Items[0].Chunk == Name;
        if (Orthodox)
            $(`<li class="split">Items inside the chunk:</li>`).prependTo(List);
        var TargetElement;
        Items.forEach((Item) => {
            // Show divisors when needed
            if ((Item.Chunk == Name) != Orthodox) {
                $("<hr>").appendTo(List);
                if (!Orthodox) {
                    $(`<li class="split">Items before the chunk:</li>`).prependTo(List);
                    $(`<li class="split">Items inside the chunk:</li>`).appendTo(List);
                }
                else
                    $(`<li class="split">Items after the chunk:</li>`).appendTo(List);
                Orthodox = !Orthodox;
            }
            // Show the item
            var Current = RenderItem(this.Visualizer, Item, Owners).appendTo(List);
            if (Item.ID == ScrollTo) {
                TargetElement = Current;
                Current.addClass("highlighted");
            }
            // Show related codes
            Current.append(RenderExamples(Codes, this.Visualizer, Item, Owners));
        });
        // Show the dialog
        this.ShowPanel(Panel);
        // Scroll to the target element
        if (TargetElement) {
            var Offset = TargetElement.offset().top;
            this.Container.children("div.content")
                .get(0)
                ?.scrollTo(0, Offset - 60);
        }
    }
    /** ShowChunkOf: Show a dialog for a chunk based on the content ID. */
    ShowChunkOf(ID) {
        var Chunks = GetChunks(this.Dataset.Source.Data);
        var Chunk = Chunks.find((Chunk) => Chunk.AllItems?.find((Item) => Item.ID == ID && (!Item.Chunk || Item.Chunk == Chunk.ID)));
        if (Chunk)
            this.ShowChunk(Chunk.ID, Chunk, undefined, ID);
    }
    /** CompareCoverageByClusters: Compare the coverage by clusters. */
    CompareCoverageByClusters() {
        this.Visualizer.PushState(`compare-coverage-by-clusters`, () => this.CompareCoverageByClusters());
        // Build the panel
        var Panel = $(`<div class="panel"></div>`);
        // Add the title
        var Title = $(`<h3>Potential Bias of Codebooks (By Clusters)</h3>`).appendTo(Panel);
        Panel.append($(`<hr/>`));
        // Evaluate the coverage
        var Graph = this.GetGraph();
        var Results = EvaluatePerCluster(this.Dataset, Graph, this.Parameters);
        var Colors = d3.scaleSequential().interpolator(d3.interpolateRdYlGn).domain([-1, 1]);
        // Build the table
        this.BuildTable(Results, (Row, { Component, Coverages, Differences }, Index) => {
            Row.append($(`<td class="actionable"><h4>${Index + 1}. ${Component.Representative.Data.Label}</h4><p class="tips">${Component.Nodes.length} codes</p></td>`).on("click", () => this.SidePanel.ShowPanel("Codes").ShowComponent(Component)));
            Coverages.forEach((Coverage, I) => {
                var Difference = Differences[I];
                var Color = Colors(Math.min(1, Difference));
                var Cell = $(`<td class="metric-cell actionable"></td>`)
                    .text(d3.format("+.1%")(Difference))
                    .css("background", Color)
                    .css("color", d3.lab(Color).l > 70 ? "black" : "white")
                    .on("click", () => {
                    this.Visualizer.SetFilter(false, new OwnerFilter(), I + 1, false);
                    this.SidePanel.ShowPanel("Codes").ShowComponent(Component);
                })
                    .append($(`<p></p>`).text(d3.format(".1%")(Coverage)));
                Row.append(Cell);
            });
        }, ["Cluster", ...this.Dataset.Names.slice(1)]).appendTo(Panel);
        // Copy to clipboard
        Title.append($(`<span><a href="javascript:void(0)" class="copy">Copy to Clipboard</a></span>`).on("click", () => {
            var Table = ["ID\tCluster (Representative Code)\tCodes\t" + this.Dataset.Names.slice(1).join("\t")];
            Results.forEach(({ Component, Coverages, Differences }, Index) => {
                Table.push(`${Index + 1}.\t${Component.Representative.Data.Label}\t${Component.Nodes.length}\t${Differences.map((Difference) => d3.format(".1%")(Difference).replace("−", "-")).join("\t")}`);
            });
            navigator.clipboard.writeText(Table.join("\n"));
        }));
        // Show the dialog
        this.ShowPanel(Panel);
    }
    /** VerifiedOwnerships: Human-verified ownership information. */
    VerifiedOwnerships = new Map();
    /** ValidateCoverageByCodes: Validate the coverage by individual codes. */
    ValidateCoverageByCodes() {
        this.Visualizer.PushState(`validate-coverage-by-codes`, () => this.ValidateCoverageByCodes());
        // Build the panel
        var Panel = $(`<div class="panel"></div>`);
        // Add the title
        var Title = $(`<h3>Ownership of Codes</h3>`).appendTo(Panel);
        Panel.append($(`<hr/>`));
        // Get the codebooks
        var Indexes = this.Visualizer.GetFilter("Owner")?.Parameters ??
            this.Visualizer.Dataset.Weights.map((Weight, Index) => Weight > 0 ? Index : -1).filter(Index => Index >= 0);
        var Names = Indexes.map(Index => this.Dataset.Names[Index]);
        // Get the codes
        var Graph = this.GetGraph();
        var Distances = this.Visualizer.Dataset.Distances;
        var Codes = Graph.Components.flatMap((Component) => Component.Nodes);
        Codes.forEach(Node => {
            if (!this.VerifiedOwnerships.has(Node.ID))
                this.VerifiedOwnerships.set(Node.ID, new Set(Node.NearOwners));
        });
        // Build the table
        this.BuildTable(Codes, (Row, Node, Index) => {
            // Show the label
            Row.append($(`<td class="actionable"><h4>${Index + 1}. ${Node.Data.Label}</h4></td>`).on("click", () => this.ShowCode(0, Node.Data)));
            // Show the description
            var Description = $(`<tr class="description"><td></td><td colspan="100"><p></p></td></tr>`);
            Description.find("p").text(`${Node.Data.Definitions?.join(", ")}`);
            Row.after(Description);
            // Show the ownerships
            for (var Codebook of Indexes) {
                ((Index) => {
                    var Codebook = this.Dataset.Codebooks[Index];
                    var Cell = $(`<td class="codes"></td>`).appendTo(Row);
                    // Checkbox
                    var Checkbox = $(`<input type="checkbox"/>`).appendTo(Cell);
                    Checkbox.on("change", () => {
                        if (Checkbox.prop("checked")) {
                            this.VerifiedOwnerships.get(Node.ID).add(Index);
                        }
                        else {
                            this.VerifiedOwnerships.get(Node.ID).delete(Index);
                        }
                    }).prop("checked", this.VerifiedOwnerships.get(Node.ID).has(Index));
                    // Find the related codes
                    var Related = [];
                    if (Node.Owners.has(Index)) {
                        Related = FindOriginalCodes(Codebook, Node.Data, Index);
                    }
                    else {
                        // Find the closest owned code
                        var Nearest = Codes.filter(Code => Code.Owners.has(Index) &&
                            Distances[Node.Index][Code.Index] <= Graph.MaximumDistance)
                            .sort((A, B) => Distances[A.Index][Node.Index] - Distances[B.Index][Node.Index]);
                        if (Nearest.length > 0)
                            Related = FindOriginalCodes(Codebook, Nearest[0].Data, Index);
                    }
                    // Show the related codes
                    for (var Code of Related) {
                        var Link = $(`<a href="javascript:void(0)"></a>`).text(Code.Label).appendTo(Cell);
                        Link.on("click", () => this.ShowCode(Index, Code));
                    }
                })(Codebook);
            }
        }, ["Label", ...Names]).addClass("code-table").appendTo(Panel);
        // Copy to clipboard
        Title.append($(`<span><a href="javascript:void(0)" class="copy">Save to Clipboard</a></span>`).on("click", () => {
            var Table = ["Label\t" + Names.join("\t")];
            Codes.forEach(Node => {
                var Owners = this.VerifiedOwnerships.get(Node.ID);
                Table.push(`${Node.Data.Label}\t${Indexes.map(Index => Owners.has(Index) ? "Y" : "N").join("\t")}`);
            });
            navigator.clipboard.writeText(Table.join("\n"));
        }));
        // Load from clipboard
        Title.append($(`<span><a href="javascript:void(0)" class="copy">Load from Clipboard</a></span>`).on("click", () => {
            if (!confirm("Are you sure you want to load ownerships from the clipboard?"))
                return;
            navigator.clipboard.readText().then(Text => {
                var Table = Text.split("\n").map(Line => {
                    if (Line.endsWith("\r"))
                        Line = Line.slice(0, -1);
                    return Line.split("\t");
                });
                var Header = Table[0];
                var Indexes = Header.slice(1).map(Name => this.Dataset.Names.indexOf(Name));
                Table.slice(1).forEach(([Label, ...Owners]) => {
                    var Node = Codes.find(Node => Node.Data.Label == Label);
                    if (!Node)
                        return;
                    Owners.forEach((Owner, Index) => {
                        if (Owner.trim() == "Y")
                            this.VerifiedOwnerships.get(Node.ID).add(Indexes[Index]);
                        else
                            this.VerifiedOwnerships.get(Node.ID).delete(Indexes[Index]);
                    });
                });
                this.ValidateCoverageByCodes();
            });
        }));
        // Clear the values
        Title.append($(`<span><a href="javascript:void(0)" class="copy">Clear All</a></span>`).on("click", () => {
            if (!confirm("Are you sure you want to clear all ownerships?"))
                return;
            this.VerifiedOwnerships.forEach(Owners => Owners.clear());
            this.ValidateCoverageByCodes();
        }));
        // Show the dialog
        this.ShowPanel(Panel);
    }
}
