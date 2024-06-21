
/** Parameters: The parameters for the visualizer. */
export class Parameters {
    // For the semantic graph
    /** LinkMinimumDistance: The minimum distance to create links between codes. */
    LinkMinimumDistance = 0.65;
    /** LinkMaximumDistance: The maximum distance to create links between codes. */
    LinkMaximumDistance = 0.9;
    /** ClosestNeighbors: The number of closest neighbors to guarantee links regardless of the threshold. */
    ClosestNeighbors = 3;
    /** UseNearOwners: Whether to visualize the near-owners in place of owners. */
    UseNearOwners = true;
    /** UseExtendedChunk: Whether to consider the extended part of data chunks when filtering. */
    UseExtendedChunk = false;
}
/** Lerp: Linearly interpolate between two values. */
export function InverseLerp(a, b, t, clamp = true) {
    var result = (t - a) / (b - a);
    if (clamp)
        return Math.min(1, Math.max(0, result));
    return result;
}
/** GetCodebookColor: Get the color of a codebook. */
export function GetCodebookColor(Number, Codebooks) {
    if (Codebooks <= 10)
        return d3.schemeTableau10[Number];
    else
        return d3.interpolateSinebow(Number / Codebooks);
}
/** FormatDate: Format a date. */
export function FormatDate(Date) {
    return Date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
}
