import { Polygon } from "./Polygon.js";
import { Vertex } from "./Vertex.js";

var mat4=glMatrix.mat4;
var mat3=glMatrix.mat3;
var vec3=glMatrix.vec3;

export class Square extends Polygon {
    constructor(length) {
        super();
        this.vs = [];

        this.vs.push(new Vertex(
            length/2, length/2, 0,
            0, 1, 0
        ));

        this.vs.push(new Vertex(
            -length/2, length/2, 0,
            0, 1, 0
        ));
        this.vs.push(new Vertex(
            -length/2, length/2, 0,
            -1, 0, 0
        ));

        this.vs.push(new Vertex(
            -length/2, -length/2, 0,
            -1, 0, 0
        ));
        this.vs.push(new Vertex(
            -length/2, -length/2, 0,
            0, -1, 0
        ));

        this.vs.push(new Vertex(
            length/2, -length/2, 0,
            0, -1, 0
        ));
        this.vs.push(new Vertex(
            length/2, -length/2, 0,
            1, 0, 0
        ));

        this.vs.push(new Vertex(
            length/2, length/2, 0,
            1, 0, 0
        ));
    }
}