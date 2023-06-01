import { SweepCurve } from "./SweepCurve.js";
import { QuadraticBezier } from "./curves/QuadraticBezier.js";
import { Square } from "./polygons/Square.js";

export class Cube {
    constructor(gl, L) {
        let square = new Square(L);

        let path = new QuadraticBezier(gl, [[-L/2, 0, 0], [0, 0, 0], [L/2, 0, 0]]);
        path.setBinor(0, 1, 0);

        return new SweepCurve(gl, square, path, 1);
    }
}