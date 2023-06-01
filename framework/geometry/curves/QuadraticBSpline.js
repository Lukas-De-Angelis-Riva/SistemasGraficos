import { BasedCurve } from "./BasedCurve.js";

export class QuadraticBSpline extends BasedCurve {
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

    evaluate(u){
        if(this.controlPoints.length == 3){
            return super.evaluate(u);
        }
        let i = Math.floor(u);
        if(i == this.length()){
            i--;
        }
        let points_i = [this.controlPoints[i], this.controlPoints[i+1], this.controlPoints[i+2]];
        let curve_i = new QuadraticBSpline(this.gl, points_i);
        curve_i.setBinor(this.binor[0], this.binor[1], this.binor[2]);
        return curve_i.evaluate(u-i);
    }

    length(){
        return this.controlPoints.length-2;
    }
}