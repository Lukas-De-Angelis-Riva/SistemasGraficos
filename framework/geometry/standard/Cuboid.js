import { Object3D } from "./Object3D.js";
var vec3=glMatrix.vec3;

const DELTA = 1e-3;

export class Cuboid extends Object3D {
    constructor(gl, L, H, W, u_scale=1, v_scale=1) {
        // #u = 2*4, #v = 6 (tapa, borde, borde) * 2
        super(gl, 5, 7, u_scale, v_scale);
        this.L = L;
        this.H = H;
        this.W = W;
        this.initBuffers();
    }

    h(v){
        if(v == 0 || v == 1 || v == 2){
            return -this.H/2;
        } else { // v == 3, 4, 5
            return this.H/2;
        }
    }

    cover(v){
        return [0, this.h(v), 0];
    }

    border(u, v){
        const h = this.h(v);
        if(u == 0 || u == 7){
            return [this.L/2, h, this.W/2];
        } else if (u <= 2){
            return [-this.L/2, h, this.W/2];
        } else if (u <= 4){
            return [-this.L/2, h, -this.W/2];
        } else if (u <= 6) {
            return [this.L/2, h, -this.W/2];
        }
        return [0,0,0] // not possible
    }

    getPosition(u, v) {
        u = Math.round(u*7);
        v = Math.round(v*5);
        if (v == 0 || v == 5) {
            return this.cover(v);
        } else { // v == 1, 2, 3, 4
            return this.border(u, v)
        }
    }

    cover_n(v){
        return [0, Math.sign(this.h(v)), 0];
    }

    border_n(u, v){
        if (v == 1 || v == 4) {
            return [0, Math.sign(this.h(v)), 0];
        }

        if (u == 0) {
            return [0, 0, 1];
        } else if (u == 1){
            return [0, 0, 1];
        } else if (u == 2) {
            return [-1, 0, 0];
        } else if (u == 3) {
            return [-1, 0, 0];
        } else if (u == 4) {
            return [0, 0, -1];
        } else if (u == 5) {
            return [0, 0, -1];
        } else if (u == 6) {
            return [1, 0, 0];
        } else if (u == 7) {
            return [1, 0, 0];
        }
    }

    getNormal(u, v) {
        u = Math.round(u*7);
        v = Math.round(v*5);

        if (v == 0 || v == 5) {
            return this.cover_n(v);
        } else { // v == 1, 2, 3, 4
            return this.border_n(u, v)
        }
    }

    getTangent(u, v){
        u = Math.round(u*7);
        v = Math.round(v*5);

        if(u == 0 || u == 1){
            return [-1, 0, 0];
        } else if (u == 2 || u == 3){
            return [0, 0, -1];
        } else if (u == 4 || u == 5){
            return [1, 0, 0];
        } else if (u == 6 || u == 7){
            return [0, 0, 1];
        }
    }

    getBinormal(u, v){
        let tangent = this.getTangent(u, v);
        let normal = this.getNormal(u, v);

        let binormal = vec3.create();
        vec3.cross(binormal, tangent, normal);
        vec3.normalize(binormal, binormal);
        return [binormal[0], binormal[1], binormal[2]];
    }

    uv_upper_border_cover(iu){
        if (iu == 0 || iu == 7) {
            return [0.5 - DELTA, 1/3 - DELTA];
        } else if (iu == 1 || iu == 2){
            return [0.5 - DELTA, 0 + DELTA];
        } else if (iu == 3 || iu == 4){
            return [0.25 + DELTA, 0 + DELTA];
        } else if (iu == 5 || iu == 6){
            return [0.25 + DELTA, 1/3 - DELTA];
        }
    }

    uv_bottom_border_cover(iu){
        if (iu == 0 || iu == 7) {
            return [0.5 - DELTA, 2/3 + DELTA];
        } else if (iu == 1 || iu == 2){
            return [0.5 - DELTA, 1 - DELTA];
        } else if (iu == 3 || iu == 4){
            return [0.25 + DELTA, 1 - DELTA];
        } else if (iu == 5 || iu == 6){
            return [0.25 + DELTA, 2/3 + DELTA];
        }
    }

    uv_border(iu, iv){
        // iv = 2 or 3
        let h = (iv == 2)?1/3+DELTA:2/3-DELTA;

        if(iu == 0 || iu == 7){
            return [0.5, h];
        } else if (iu == 1 || iu == 2){
            return [0.75, h];
        } else if (iu == 3){
            return [1, h];
        } else if (iu == 4) {
            return [0, h];
        }else if (iu == 5 || iu == 6){
            return [0.25, h];
        }
    }

    getTextureCordenates(u, v) {
        let iu = Math.round(u*7);
        let iv = Math.round(v*5);

        if (iv == 0){ // upper center cover 
            return [0.375, 1/6];
        } else if (iv == 5) { // bottom center cover
            return [0.375, 5/6];
        } else if (iv == 1){ // upper border cover
            return this.uv_upper_border_cover(iu);
        } else if (iv == 4 ){ // bottom border cover
            return this.uv_bottom_border_cover(iu);
        } else { // border
            return this.uv_border(iu, iv);
        }
    }
}