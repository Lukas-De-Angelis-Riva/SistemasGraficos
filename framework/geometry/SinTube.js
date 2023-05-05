import { Object3D } from "./Object3D.js";

export class SinTube extends Object3D {
    constructor(gl, h_div, v_div, c/*=5*/, h/*=2.5*/, Amax /*=1*/, Amin/*=0.5*/) {
        super(gl, h_div, v_div);
        this.c = c;
        this.h = h;
        this.Amax = Amax;
        this.Amin = Amin;
        this.initBuffers();
    }

    getPosition(u, v) {
        const c=this.c;
        const h=this.h;
        const Amax=this.Amax;
        const Amin=this.Amin;

        let A = (Amax-Amin)/2 * Math.cos(2*c*Math.PI*v) + (Amax+Amin)/2;

        let x=A*Math.cos(2*Math.PI*u);
        let z=A*Math.sin(2*Math.PI*u);
        let y = h*(0.5-v);
        return [x,y,z];
    }

    getNormal(u, v) {
        const c=this.c;
        const h=this.h;
        const Amax=this.Amax;
        const Amin=this.Amin;

        let a = (Amax-Amin)/2;
        let b = 2*c*Math.PI;
        let A = a * Math.cos(b*v) + (Amax+Amin)/2;
        let dA = -a*b*Math.sin(b*v);
        let d = 2*Math.PI;

        let xv = h*d*A*Math.cos(d*u);
        let yv = A*d*dA;
        let zv = h*d*A*Math.sin(d*u);

        // CHECK NORMALIZE
        return [xv,yv,zv];
    }

    getTextureCordenates(u, v) {
        // TO DO
        return [0.5, 0];
    }
}