
import { FilterNodeByExample, FilterNodeByOwner, FilterNodeByOwners } from "./graph.js";
/** FilterBase: The base class for filters. */
export class FilterBase {
    /** Parameters: The parameters of the filter. */
    Parameters = [];
    /** Mode: The mode of the filter. */
    Mode = "";
    /** GetColorizer: Get the colorizer for this filter. */
    GetColorizer(Visualizer) { return; }
    /** GetParameterNames: Get the names of the parameters. */
    GetParameterNames(Visualizer) {
        return this.Parameters.map(Parameter => Parameter.toString());
    }
    /** ToggleParameters: Toggle the parameters of the filter. */
    ToggleParameters(NewParameters, Additive, Mode) {
        if (Mode == this.Mode && this.Parameters.includes(NewParameters)) {
            this.Parameters.splice(this.Parameters.indexOf(NewParameters), 1);
            this.SetParameter(this.Parameters);
            return false;
        }
        else {
            if (!this.Parameters.includes(NewParameters)) {
                if (Additive) {
                    this.Parameters.splice(this.Parameters.length - 1, 0, NewParameters);
                    this.SetParameter(this.Parameters);
                }
                else {
                    this.SetParameter([NewParameters]);
                }
            }
            this.Mode = Mode;
            return true;
        }
    }
    /** SetParameter: Set the parameters of the filter. */
    SetParameter(NewParameters) {
        this.Parameters = NewParameters;
    }
}
/** DatasetFilter: Filter the nodes by their datasets. */
export class DatasetFilter extends FilterBase {
    /** Name: The name of the filter. */
    Name = "Dataset";
    /** ExampleIDs: The IDs of the examples. */
    ExampleIDs = [];
    /** Filter: The filter function. */
    Filter(Visualizer, Node) {
        if (this.ExampleIDs.length == 0) {
            var Sources = Visualizer.Dataset.Source.Data;
            this.ExampleIDs = Array.from(new Set(Object.entries(Sources)
                .filter(([Key, Value]) => this.Parameters.includes(Key))
                .flatMap(([Key, Value]) => Object.values(Value).flatMap(Item => Item.AllItems ?? [])).map(Example => Example.ID)));
        }
        return FilterNodeByExample(Node, this.ExampleIDs);
    }
    /** SetParameter: Set the parameters of the filter. */
    SetParameter(NewParameters) {
        this.Parameters = NewParameters;
        this.ExampleIDs = [];
    }
}
/** ChunkFilter: Filter the nodes by their chunks. */
export class ChunkFilter extends FilterBase {
    /** Name: The name of the filter. */
    Name = "Chunk";
    /** ExampleIDs: The IDs of the examples. */
    ExampleIDs = [];
    /** Filter: The filter function. */
    Filter(Visualizer, Node) {
        if (this.ExampleIDs.length == 0) {
            var Sources = Visualizer.Dataset.Source.Data;
            this.ExampleIDs = Array.from(new Set(Object.values(Sources)
                .flatMap(Chunk => Object.entries(Chunk))
                .filter(([Key, Value]) => this.Parameters.includes(Key))
                .flatMap(([Key, Value]) => Value.AllItems ?? [])
                .map(Example => Example.ID)));
        }
        return FilterNodeByExample(Node, this.ExampleIDs);
    }
    /** SetParameter: Set the parameters of the filter. */
    SetParameter(NewParameters) {
        this.Parameters = NewParameters;
        this.ExampleIDs = [];
    }
}
/** ComponentFilter: Filter the nodes by their components. */
export class ComponentFilter extends FilterBase {
    /** Name: The name of the filter. */
    Name = "Component";
    /** GetParameterNames: Get the names of the parameters. */
    GetParameterNames(Visualizer) {
        return this.Parameters.map(Parameter => Parameter.Representative.Data.Label);
    }
    /** Filter: The filter function. */
    Filter(Visualizer, Node) {
        if (!Node.Component)
            return false;
        return this.Parameters.includes(Node.Component);
    }
}
/** OwnerFilter: Filter the nodes by their owners. */
export class OwnerFilter extends FilterBase {
    /** Name: The name of the filter. */
    Name = "Owner";
    /** Filter: The filter function. */
    Filter(Visualizer, Node) {
        return FilterNodeByOwners(Node, this.Parameters, Visualizer.Parameters.UseNearOwners || this.Parameters.length == 1);
    }
    /** GetParameterNames: Get the names of the parameters. */
    GetParameterNames(Visualizer) {
        return this.Parameters.map(Parameter => Visualizer.Dataset.Names[Parameter]);
    }
    /** GetColorizer: Get the colorizer for this filter. */
    GetColorizer(Visualizer) {
        if (this.Parameters.length == 0) {
            return new OwnerColorizer(Visualizer.Dataset.Names.map((_, Index) => Index).slice(1), Visualizer);
        }
        else if (this.Parameters.length == 1) {
            if (this.Mode == "Novelty" || this.Mode == "Conformity")
                return new NoveltyColorizer(this.Parameters[0]);
            else
                return new CoverageColorizer(this.Parameters[0]);
        }
        else if (this.Parameters.length == 2) {
            return new ComparisonColorizer(this.Parameters[0], this.Parameters[1], Visualizer);
        }
        else {
            return new OwnerColorizer(this.Parameters, Visualizer);
        }
    }
}
/** CoverageColorizer: Colorize the nodes by an owner's coverage. */
export class CoverageColorizer {
    Owner;
    /** Constructor: Create a coverage colorizer. */
    constructor(Owner) {
        this.Owner = Owner;
    }
    /** Colorize: The colorizer function. */
    Colorize(Node) {
        return d3.interpolateCool(Node.Owners.has(this.Owner) ? 1 : Node.NearOwners.has(this.Owner) ? 0.55 : 0.1);
    }
    /** Examples: The examples of the colorizer. */
    Examples = {
        "In the codebook": d3.interpolateCool(1),
        "Has a similar concept": d3.interpolateCool(0.55),
        "Not covered": "#999999"
    };
}
/** NoveltyColorizer: Colorize the nodes by their novelty. */
export class NoveltyColorizer {
    Owner;
    /** Constructor: Create a novelty colorizer. */
    constructor(Owner) {
        this.Owner = Owner;
    }
    /** Colorize: The colorizer function. */
    Colorize(Node) {
        // Not covered
        if (!Node.NearOwners.has(this.Owner))
            return "#999999";
        // Novel
        if (Node.NearOwners.size == (Node.NearOwners.has(0) ? 2 : 1))
            return d3.interpolatePlasma(1);
        // Conform
        if (Node.Owners.has(this.Owner) && Node.Owners.size == (Node.Owners.has(0) ? 2 : 1))
            return d3.interpolatePlasma(0.7);
        else
            return d3.interpolatePlasma(0.35);
    }
    /** Examples: The examples of the colorizer. */
    Examples = {
        "Novel: only in this codebook": d3.interpolatePlasma(1),
        "Conform: in the codebook": d3.interpolatePlasma(0.7),
        "Conform: has a similar concept": d3.interpolatePlasma(0.35),
        "Not covered": "#999999"
    };
}
/** ComparisonColorizer: Colorize the nodes by two owners' coverage. */
export class ComparisonColorizer {
    Owner1;
    Owner2;
    Visualizer;
    /** Constructor: Create a comparison colorizer. */
    constructor(Owner1, Owner2, Visualizer) {
        this.Owner1 = Owner1;
        this.Owner2 = Owner2;
        this.Visualizer = Visualizer;
        this.Examples[`Both codebooks`] = d3.schemeTableau10[5];
        this.Examples[`Only in ${Visualizer.Dataset.Names[Owner1]}`] = d3.schemeTableau10[2];
        this.Examples[`Only in ${Visualizer.Dataset.Names[Owner2]}`] = d3.schemeTableau10[4];
        this.Examples[`Not covered`] = "#999999";
    }
    /** Colorize: The colorizer function. */
    Colorize(Node) {
        var NearOwner = FilterNodeByOwner(Node, this.Owner1, this.Visualizer.Parameters.UseNearOwners);
        var NearOther = FilterNodeByOwner(Node, this.Owner2, this.Visualizer.Parameters.UseNearOwners);
        return NearOwner && NearOther ? d3.schemeTableau10[5] : NearOwner ? d3.schemeTableau10[2] : NearOther ? d3.schemeTableau10[4] : "#999999";
    }
    /** Examples: The examples of the colorizer. */
    Examples = {};
}
/** OwnerColorizer: Colorize the nodes by how many owners they have. */
export class OwnerColorizer {
    Owners;
    Visualizer;
    /** Constructor: Create an owner colorizer. */
    constructor(Owners, Visualizer) {
        this.Owners = Owners;
        this.Visualizer = Visualizer;
        for (var I = 1; I <= Owners.length; I++)
            this.Examples[`In${this.Visualizer.Parameters.UseNearOwners ? " (or near)" : ""} ${I} codebooks`] = d3.interpolateViridis(I / Owners.length);
        this.Examples["Not covered"] = "#999999";
    }
    /** Colorize: The colorizer function. */
    Colorize(Node) {
        var Count = this.Owners.filter(Owner => FilterNodeByOwner(Node, Owner, this.Visualizer.Parameters.UseNearOwners)).length;
        return Count == 0 ? "#999999" : d3.interpolateViridis(Count / this.Owners.length);
    }
    /** Examples: The examples of the colorizer. */
    Examples = {};
}
