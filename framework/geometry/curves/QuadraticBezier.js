import { Curve } from "./Curve.js";

export class QuadraticBezier extends Curve {
    static B0 = function(u) { return (1-u)*(1-u); }     // (1-u)²
    static B1 = function(u) { return 2*u*(1-u); }       // 2u(1-u)
    static B2 = function(u) { return u*u; }             // u²

    static dB0 = function(u) { return -2+2*u; }
    static dB1 = function(u) { return 2-4*u; }
    static dB2 = function(u) { return 2*u; }

    constructor(gl, controlPoints=[]) {
        let bases = [QuadraticBezier.B0, QuadraticBezier.B1, QuadraticBezier.B2];
        let dbases = [QuadraticBezier.dB0, QuadraticBezier.dB1, QuadraticBezier.dB2];
        super(gl, bases, dbases, controlPoints);
    }
}