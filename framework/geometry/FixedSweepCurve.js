import { SweepCurve } from "./SweepCurve.js";
import { Line } from "./curves/Line.js";

function approx_equals(a, b, delta=1e-6) {
    return (b - delta <= a) && (a <= b + delta);
}

export class FixedExtrudeCurve extends SweepCurve {
    static FREQ = 6*Math.PI;
    static AMPLITUDE = 3;

    /*
     * Tanto el primero, como el segundo punto del perfil se quedan fijos.
     * Los demas se mueven con una SIN de frecuencia f y amplitud A
     */
    constructor(gl, profile, step, L, u_scale = 1, v_scale = 1){
        let path = new Line(gl, [0, 0, -L], [0, 0, L]);
        path.setBinor(0, 1, 0);
        super(gl, profile, path, step, false, u_scale, v_scale);
    }

    shift(v){
        const f = FixedExtrudeCurve.FREQ; const A = FixedExtrudeCurve.AMPLITUDE;
        const a = A/2 * Math.sin(v*f);
        const b = A/3 * Math.sin(v*f/2);
        const c = A/6 * Math.sin(v*f/4);
        return a+b+c; 
    }

    getPosition(u, v){
        let pos = super.getPosition(u, v);

        let vertex_n = Math.round(u*(this.profile.vs.length-1));
        if(vertex_n == 0 || vertex_n == this.profile.vs.length-1)
            return pos;
        return [pos[0]+this.shift(v), pos[1], pos[2]];
    }
}