import { Object3D } from "./Object3D.js";
var mat4=glMatrix.mat4;
var vec4=glMatrix.vec4;
var vec3=glMatrix.vec3;

export class SweepCurve extends Object3D {
    constructor(gl, profile, path, step) {
        let h_div = path.length() / step;
        let v_div = profile.vs.length-1;
        super(gl, h_div, v_div);

        this.profile = profile;
        this.path = path;
        this.initBuffers();
    }

    getPosition(u, v) {
        let vertex_n = Math.round(u*(this.profile.vs.length-1));
        let p = this.profile.vs[vertex_n];

        let level = this.path.evaluate(v);

        let x = level.nx * p.x + level.bx * p.y + level.tx * p.z + level.x;
        let y = level.ny * p.x + level.by * p.y + level.ty * p.z + level.y;
        let z = level.nz * p.x + level.bz * p.y + level.tz * p.z + level.z;
        return [x,y,z];
    }

    getNormal(u, v) {
        let vertex_n = Math.round(u*(this.profile.vs.length-1));
        let p = this.profile.vs[vertex_n];
        let normal = vec4.fromValues(p.nx, p.ny, p.nz, 1);

        let level = this.path.evaluate(v);
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