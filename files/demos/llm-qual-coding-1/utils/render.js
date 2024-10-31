import { FilterNodeByExample, FilterNodeByOwners } from "./graph.js";
import { FindOriginalCodes } from "./dataset.js";
import { FormatDate } from "./utils.js";
/** RenderItem: Render a data item. */
export function RenderItem(Visualizer, Item, Owners = []) {
    var Current = $(`<li class="custom"></li>`).attr("seq", Item.ID);
    var Header = $(`<p><a href="javascript:void(0)"></a> at <i></i></p>`).appendTo(Current);
    Header.children("a").text(Item.Nickname).on("click", () => {
        Visualizer.Dialog.ShowUser(Item.UserID, Owners, Item.ID);
    });
    Header.children("i").text(FormatDate(Item.Time));
    $(`<p></p>`).text(Item.Content).appendTo(Current);
    return Current;
}
/** RenderExamples: Render the examples of a quote. */
export function RenderExamples(Codes, Visualizer, Item, Owners = []) {
    var Examples = Codes.filter((Node) => FilterNodeByExample(Node, [Item.ID]));
    Examples = Examples.filter((Node) => Owners.length == 0 || FilterNodeByOwners(Node, Owners, Visualizer.Parameters.UseNearOwners));
    if (Owners.length == 1) {
        return $(`<p class="codes">Coded as:<span></span></p>`)
            .children("span")
            .text(Examples.map((Code) => Code.Data.Label).join(", "));
    }
    else {
        var CodeList = $(`<ol class="codes"></ol>`);
        var CodeItems = [];
        // Show the codes
        Examples.forEach((Code) => {
            var CodeItem = $(`<li class="owners"><i></i> from </li>`);
            CodeItem.children("i")
                .text(Code.Data.Label)
                .css("cursor", "pointer")
                .on("click", () => Visualizer.Dialog.ShowCode(0, Code.Data));
            // Show the owners
            var RealOwners = 0;
            for (var Owner of Code.Data.Owners) {
                if (Owner == 0)
                    continue;
                var Originals = FindOriginalCodes(Visualizer.Dataset.Codebooks[Owner], Code.Data, Owner, Item.ID);
                // Only show the owner if the code is related to THIS quote
                if (Originals.length > 0) {
                    Visualizer.InfoPanel.BuildOwnerLink(Code.Data, Originals, Owner).appendTo(CodeItem);
                    RealOwners++;
                }
            }
            CodeItem.data("owners", RealOwners);
            // Only show the code if it has owners
            if (RealOwners > 0)
                CodeItems.push(CodeItem);
        });
        // Sort the codes by the number of owners
        CodeItems.sort((A, B) => parseInt(B.data("owners")) - parseInt(A.data("owners")));
        CodeItems.forEach((Item) => Item.appendTo(CodeList));
        return CodeList;
    }
}
