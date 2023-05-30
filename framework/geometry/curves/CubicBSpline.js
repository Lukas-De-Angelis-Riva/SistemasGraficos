import { BasedCurve } from "./BasedCurve.js";

export class CubicBSpline extends BasedCurve {
    static B0 = function(u) { return (1-3*u+3*u*u-u*u*u)*1/6;}  // (1 -3u +3u² -u³)/6
    static B1 = function(u) { return (4-6*u*u+3*u*u*u)*1/6; }   // (4 -6u² +3u³)/6
    static B2 = function(u) { return (1+3*u+3*u*u-3*u*u*u)*1/6} // (1 +3u +3u² -3u³)/6
    static B3 = function(u) { return (u*u*u)*1/6; }             // u³/6

    static dB0 = function(u) { return (-3 +6*u -3*u*u)/6;}      // d/du B0
    static dB1 = function(u) { return (-12*u+9*u*u)/6; }        // d/du B1
    static dB2 = function(u) { return (3+6*u-9*u*u)/6; }        // d/du B2
    static dB3 = function(u) { return (3*u*u)*1/6; }            // d/du B3

    constructor(gl, controlPoints=[]) {
        let bases = [CubicBSpline.B0, CubicBSpline.B1, CubicBSpline.B2, CubicBSpline.B3];
        let dbases = [CubicBSpline.dB0, CubicBSpline.dB1, CubicBSpline.dB2, CubicBSpline.dB3];
        super(gl, bases, dbases, controlPoints);
    }
}