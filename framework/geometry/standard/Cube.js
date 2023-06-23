import { Cuboid } from "./Cuboid";

export class Cube {
    constructor(gl, L) {
        return new Cuboid(gl, L, L, L);
    }
}