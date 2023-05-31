import { Object3D } from "./Object3D.js";
import { SweepCurve } from "./SweepCurve.js";
import { Circumference } from "./curves/Circumference.js";
import { Polygon } from "./polygons/Polygon.js";
var mat4=glMatrix.mat4;
var vec4=glMatrix.vec4;
var vec3=glMatrix.vec3;

export class Revolution {
    static fromCurve(gl, revolution_div, curve, step){
        let v = curve.discretization(step);
        v.map(p => {
            p.nx *=-1; p.ny *=-1; p.nz *=-1;
            return p;
        });

        let polygon = new Polygon(v);
        let path = new Circumference(0);
        return new SweepCurve(gl, polygon, path, 1/revolution_div);
    }

    static fromPolygon(gl, revolution_div, polygon){
        let path = new Circumference(0);
        return new SweepCurve(gl, polygon, path, 1/revolution_div);
    }
}