import { Object3D } from "./Object3D.js";

export class Plane extends Object3D {
    constructor(gl, length, width, h_div=1, v_div=1, u_scale = 1, v_scale = 1) {
        super(gl, h_div, v_div, u_scale, v_scale);
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

    getTangent(u, v){
        return [1,0,0];
    }

    getBinormal(u, v){
        return [0,0,1];
    }

    getTextureCordenates(u, v) {
        return [u,v];
    }
}