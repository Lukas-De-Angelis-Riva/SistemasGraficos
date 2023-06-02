import { Object3D } from "./Object3D.js";
import { Vertex } from "./polygons/Vertex.js";
var mat4=glMatrix.mat4;
var vec4=glMatrix.vec4;
var vec3=glMatrix.vec3;

function approx_equals(a, b, delta=1e-6) {
    return (b - delta <= a) && (a <= b + delta);
}

function fix(x){
    return Number.parseFloat(x).toFixed(8);
}

function center(vs) {
    let p = new Object();
    p.x = 0;
    p.y = 0;
    p.z = 0;
    vs.forEach(v => {
        p.x += v.x;
        p.y += v.y;
        p.z += v.z;
    });
    p.x /= vs.length;
    p.y /= vs.length;
    p.z /= vs.length;
    return p;
}

export class MovingSweepCurve extends Object3D {
    constructor(gl, curve, step_curve, path, step_path, closed=false) {
        let h_div = path.length() / step_path + 4*closed;
        let v_div = curve.length() / step_curve;
        super(gl, h_div, v_div);

        this.curve = curve;
        this.path = path;
        this.closed = closed;
        this.initBuffers();
    }

    getPosition(u, v) {
        const closed = this.closed;
        let p;
        let level;

        if(closed)
            v = this.rows/(this.rows-4)*v-2/(this.rows-4);
        
        v = fix(v);

        if (closed && approx_equals(v, -2/(this.rows-4))) {            // v° == 0
            p = center(this.curve.discretization(0.1));
            level = this.path.evaluate(0);
        } else if (closed && approx_equals(v, -1/(this.rows-4))) {     // v° == 1
            p = this.curve.evaluate(u*this.curve.length());
            level = this.path.evaluate(0); 
        } else if (closed && approx_equals(v, 1+1/(this.rows-4))) {    // v° == c-1
            p = this.curve.evaluate(u*this.curve.length());
            level = this.path.evaluate(this.path.length()); 
        } else if (closed && approx_equals(v, 1+2/(this.rows-4))) {    // v° == c
            p = center(this.curve.discretization(0.1));
            level = this.path.evaluate(this.path.length());
        } else {
            p = this.curve.evaluate(u*this.curve.length());
            level = this.path.evaluate(v*this.path.length());
        }

        let x = level.nx * p.x + level.bx * p.y + level.tx * p.z + level.x;
        let y = level.ny * p.x + level.by * p.y + level.ty * p.z + level.y;
        let z = level.nz * p.x + level.bz * p.y + level.tz * p.z + level.z;
        return [x,y,z];
    }

    getNormal(u, v) {
        const closed = this.closed;
        if(closed)
            v = this.rows/(this.rows-4)*v-2/(this.rows-4);

        v = fix(v);

        if (closed && (approx_equals(v, -2/(this.rows-4)) || approx_equals(v, -1/(this.rows-4)))) {            // v° == 0 || v° == 1
            let level = this.path.evaluate(0);
            return [-level.tx, -level.ty, -level.tz];
        } else if (closed && (approx_equals(v, 1+1/(this.rows-4)) || approx_equals(v, 1+2/(this.rows-4)))) {   // v° == c-1
            let level = this.path.evaluate(this.path.length());
            return [level.tx, level.ty, level.tz];
        }

        let p = this.curve.evaluate(u*this.curve.length());
        let normal = vec4.fromValues(p.nx, p.ny, p.nz, 1);

        let level = this.path.evaluate(v*this.path.length());
        let levelMatrix = mat4.fromValues(
            level.nx, level.bx, level.tx, level.x,
            level.ny, level.by, level.ty, level.y,
            level.nz, level.bz, level.tz, level.z,
            0       , 0       , 0       , 1
        );

        let normalMatrix = mat4.create();
        mat4.invert(normalMatrix, levelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        let xn = normalMatrix[0] * normal[0] + normalMatrix[1] * normal[1] + normalMatrix[2] * normal[2] + normalMatrix[3] * normal[3];
        let yn = normalMatrix[4] * normal[0] + normalMatrix[5] * normal[1] + normalMatrix[5] * normal[2] + normalMatrix[7] * normal[3];
        let zn = normalMatrix[8] * normal[0] + normalMatrix[9] * normal[1] + normalMatrix[10] * normal[2] + normalMatrix[11] * normal[3];
        return [xn, yn, zn];
    }
    
    getTextureCordenates(u, v) {
        // TODO
        return [u,v];
    }
}