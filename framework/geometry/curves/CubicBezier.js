import { Curve } from "./Curve.js";

export class CubicBezier extends Curve {
    static B0 = function(u) { return (1-u)*(1-u)*(1-u); }   //   u⁰(1-u)³
    static B1 = function(u) { return 3*(1-u)*(1-u)*u; }     // 3 u¹(1-u)² 
    static B2 = function(u) { return 3*(1-u)*u*u; }         // 3 u²(1-u)¹
    static B3 = function(u) { return u*u*u; }               //   u³(1-u)⁰

    static dB0 = function(u) { return -3*(1-u)*(1-u);}      // d/du u⁰(1-u)³
    static dB1 = function(u) { return 9*u*u-12*u+3; }       // d/du (3 u¹(1-u)²)
    static dB2 = function(u) { return -9*u*u+6*u; }         // d/du 3 u²(1-u)¹
    static dB3 = function(u) { return 3*u*u; }              // d/du u³(1-u)⁰

    constructor(gl, controlPoints=[]) {
        let bases = [CubicBezier.B0, CubicBezier.B1, CubicBezier.B2, CubicBezier.B3];
        let dbases = [CubicBezier.dB0, CubicBezier.dB1, CubicBezier.dB2, CubicBezier.dB3];
        super(gl, bases, dbases, controlPoints);
    }
}