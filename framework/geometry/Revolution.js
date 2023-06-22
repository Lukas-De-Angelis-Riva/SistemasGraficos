import { Object3D } from "./Object3D.js";
import { SweepCurve } from "./SweepCurve.js";
import { Circumference } from "./curves/Circumference.js";
import { Polygon } from "./polygons/Polygon.js";
import { Vertex } from "./polygons/Vertex.js";
var mat4=glMatrix.mat4;
var vec4=glMatrix.vec4;
var vec3=glMatrix.vec3;

export class Revolution {
    static fromCurve(gl, revolution_div, curve, step, closed=true, u_scale = 1, v_scale = 1){
        let v = curve.discretization(step);
        v.map(p => {
            p.nx *=-1; p.ny *=-1; p.nz *=-1;
            return p;
        });

        let polygon = new Polygon(v);
        return this.fromPolygon(gl, revolution_div, polygon, closed, u_scale, v_scale);
    }

    static fromPolygon(gl, revolution_div, polygon, closed=false, u_scale = 1, v_scale = 1){
        let path = new Circumference(0);

        if(closed){
            // closing the curve
            var bottom; var bottom_center;
            var top; var top_center;

            let first = polygon.vs[0];
            let last = polygon.vs[polygon.vs.length-1];
            if(first.y < last.y){
                bottom = new Vertex(first.x, first.y, first.z, 0, -1, 0);
                bottom_center = new Vertex(0, first.y, 0, 0, -1, 0);
                top = new Vertex(last.x, last.y, last.z, 0, 1, 0);
                top_center = new Vertex(0, last.y, 0, 0, 1, 0);
            } else {
                bottom = new Vertex(last.x, last.y, last.z, 0, -1, 0);
                bottom_center = new Vertex(0, last.y, 0, 0, -1, 0);
                top = new Vertex(first.x, first.y, first.z, 0, 1, 0);
                top_center = new Vertex(0, first.y, 0, 0, 1, 0);
            }

            polygon.vs.unshift(bottom);
            polygon.vs.unshift(bottom_center);
            polygon.vs.push(top);
            polygon.vs.push(top_center);
        }

        return new SweepCurve(gl, polygon, path, 1/revolution_div, false, u_scale, v_scale);
    }
}