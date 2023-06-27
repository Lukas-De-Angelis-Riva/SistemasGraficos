import { Object3D } from "./Object3D.js";

export class Sphere extends Object3D {
    constructor(gl, radius, h_div=50, v_div=50, u_scale = 1, v_scale = 1) {
        super(gl, h_div, v_div, u_scale, v_scale);
        this.radius = radius;
        this.initBuffers();
    }

    getPosition(u, v) {
        const radius = this.radius;
        let phi = 2*u*Math.PI;
        let theta = v*Math.PI;

        var x = radius*Math.sin(theta)*Math.cos(phi);
        var z = radius*Math.sin(theta)*Math.sin(phi);
        var y = radius*Math.cos(theta);
        return [x,y,z];
    }

    getNormal(u, v) {
        let phi = 2*u*Math.PI;
        let theta = v*Math.PI;

        let xv=Math.sin(theta)*Math.cos(phi);
        let zv=Math.sin(theta)*Math.sin(phi);
        let yv=Math.cos(theta);

        let ret = glMatrix.vec3.fromValues(xv, yv, zv)
        glMatrix.vec3.normalize(ret, ret)
        return ret;
    }

    getTangent(u, v){
        let phi = 2*u*Math.PI;

        let xv=-Math.sin(phi);
        let zv= Math.cos(phi);
        let yv=0;

        let ret = glMatrix.vec3.fromValues(xv, yv, zv)
        glMatrix.vec3.normalize(ret, ret)
        return ret;
    }

    getBinormal(u, v){
        let phi = 2*u*Math.PI;
        let theta = v*Math.PI;

        let xv=Math.cos(theta)*Math.cos(phi);
        let zv=Math.cos(theta)*Math.sin(phi);
        let yv=-Math.sin(theta);

        let ret = glMatrix.vec3.fromValues(xv, yv, zv)
        glMatrix.vec3.normalize(ret, ret)
        return ret;
    }


    getTextureCordenates(u, v) {
        return [u,v];
    }
}