export type ChemAtom = {
    id: string;
    element: string; // C, H, O, N, Cl
    position: [number, number]; // logical position (not pixels)
};

export type ChemBond = {
    from: string;
    to: string;
    order: 1 | 2 | 3; // single, double, triple
};

export type ChemStructure = {
    atoms: ChemAtom[];
    bonds: ChemBond[];
};

export type ChemReaction = {
    reactants: ChemStructure[];
    products: ChemStructure[];
    arrow?: "forward" | "equilibrium";
};

export type ElectronArrow = {
    from: [number, number];   // start (lone pair or bond)
    to: [number, number];     // end (atom or bond)
};

export type BondChange = {
    from: string; // atom id
    to: string;   // atom id
    change: "break" | "form";
};

export type ChemMechanismStep = {
    stepId: number;
    description?: string;
    arrows?: ElectronArrow[];
    bondChanges?: BondChange[];
};

export type ChemMechanism = {
    baseStructure: ChemStructure;
    steps: ChemMechanismStep[];
};

export type ChemCanvasPayload =
    | { type: "structure"; data: ChemStructure }
    | { type: "reaction"; data: ChemReaction }
    | { type: "mechanism"; data: ChemMechanism };
