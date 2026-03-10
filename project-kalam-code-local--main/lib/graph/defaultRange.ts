export function defaultRange(expr: string): [number, number] {
    // Conservative default for JEE-level graphs
    if (expr.includes("^2") || expr.includes("^3")) return [-5, 5];
    if (expr.includes("sin") || expr.includes("cos")) return [-2 * Math.PI, 2 * Math.PI];
    return [-10, 10];
}
