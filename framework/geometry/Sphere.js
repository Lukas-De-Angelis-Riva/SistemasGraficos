import { Object3D } from "./Object3D.js";

export class Sphere extends Object3D {
    constructor(gl, h_div, v_div, radius) {
        super(gl, h_div, v_div);
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

        // CHECK NORMALIZE
        return [xv,yv,zv];
    }
    
    getTextureCordenates(u, v) {
        return [u,v];
    }
}