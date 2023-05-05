import { Object3D } from "./Object3D.js";

export class Plane extends Object3D {
    constructor(gl, h_div, v_div, length, width) {
        super(gl, h_div, v_div);
        this.length = length;
        this.width = width;
        this.initBuffers();
    }

    getPosition(u, v) {
        var x=(u-0.5)*this.width;
        var z=(v-0.5)*this.length;
        return [x,0,z];
    }

    getNormal(u, v) {
        return [0,1,0];
    }
    
    getTextureCordenates(u, v) {
        return [u,v];
    }
}