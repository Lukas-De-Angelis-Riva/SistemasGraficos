import { Polygon } from "./Polygon.js";
import { Vertex } from "./Vertex.js";

var mat4=glMatrix.mat4;
var mat3=glMatrix.mat3;
var vec3=glMatrix.vec3;

export class Circle extends Polygon {
    constructor(r, div) {
        super();
        this.vs = [];
        let step = 2*Math.PI/div;
        for(let theta = 0; theta <= 2*Math.PI+step/2; theta+=step){
            this.vs.push(new Vertex(
                r * Math.cos(theta), r * Math.sin(theta), 0,
                Math.cos(theta), Math.sin(theta), 0
            ));
        }
    }
}