import { Curve } from "./Curve.js";

export class QuadraticBSpline extends Curve {
    static B0 = function(u) { return 0.5*(1-u)*(1-u); } // 0.5·(1-u)²
    static B1 = function(u) { return 0.5+u*(1-u); }     // 0.5+u·(1-u)
    static B2 = function(u) { return 0.5*u*u; }         // 0.5·u²

    static dB0 = function(u) { return -1+u; }
    static dB1 = function(u) { return 1-2*u; }
    static dB2 = function(u) { return u; }

    constructor(gl, controlPoints=[]) {
        let bases = [QuadraticBSpline.B0, QuadraticBSpline.B1, QuadraticBSpline.B2];
        let dbases = [QuadraticBSpline.dB0, QuadraticBSpline.dB1, QuadraticBSpline.dB2];
        super(gl, bases, dbases, controlPoints);
    }
}