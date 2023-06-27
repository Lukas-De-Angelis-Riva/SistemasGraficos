import { Object3D } from "./standard/Object3D.js";
var mat4=glMatrix.mat4;
var vec4=glMatrix.vec4;
var vec3=glMatrix.vec3;

function approx_equals(a, b, delta=1e-6) {
    return (b - delta <= a) && (a <= b + delta);
}

function fix(x){
    return parseFloat(Number.parseFloat(x).toFixed(8));
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

function border(vs){
    let min_x = Infinity; let max_x = -Infinity;
    let min_y = Infinity; let max_y = -Infinity;
    
    for(let i = 0; i < vs.length; i++){
        let v = vs[i];
        min_x = Math.min(v.x, min_x); max_x = Math.max(v.x, max_x);
        min_y = Math.min(v.y, min_y); max_y = Math.max(v.y, max_y);
    }

    let b = new Object();
    b.min_x = min_x; b.max_x = max_x;
    b.min_y = min_y; b.max_y = max_y;
    return b;
}

export class SweepCurve extends Object3D {
    constructor(gl, profile, path, step, closed=true, u_scale = 1, v_scale = 1) {
        let h_div = path.length() / step + 4*closed;
        let v_div = profile.vs.length-1;
        super(gl, h_div, v_div, u_scale, v_scale);

        this.closed = closed;
        this.profile = profile;
        this.path = path;
        this.cumulative_distance = this.path.cumulative_distance(step);
        this.step = step;
        this.scale_u = 1;
        this.scale_v = 1;
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
            p = center(this.profile.vs);
            level = this.path.evaluate(0);
        } else if (closed && approx_equals(v, -1/(this.rows-4))) {     // v° == 1
            let vertex_n = Math.round(u*(this.profile.vs.length-1));
            p = this.profile.vs[vertex_n];
            level = this.path.evaluate(0); 
        } else if (closed && approx_equals(v, 1+1/(this.rows-4))) {    // v° == c-1
            let vertex_n = Math.round(u*(this.profile.vs.length-1));
            p = this.profile.vs[vertex_n];
            level = this.path.evaluate(this.path.length()); 
        } else if (closed && approx_equals(v, 1+2/(this.rows-4))) {    // v° == c
            p = center(this.profile.vs);
            level = this.path.evaluate(this.path.length());
        } else {
            let vertex_n = Math.round(u*(this.profile.vs.length-1));
            p = this.profile.vs[vertex_n];
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

        let vertex_n = Math.round(u*(this.profile.vs.length-1));
        let p = this.profile.vs[vertex_n];
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

    getTangent(u, v){
        const closed = this.closed;
        if(closed)
            v = this.rows/(this.rows-4)*v-2/(this.rows-4);

        v = fix(v);
        var level;
        if (closed && (approx_equals(v, -2/(this.rows-4)) || approx_equals(v, -1/(this.rows-4)))) {            // v° == 0 || v° == 1
            level = this.path.evaluate(0);
        } else if (closed && (approx_equals(v, 1+1/(this.rows-4)) || approx_equals(v, 1+2/(this.rows-4)))) {   // v° == c-1
            level = this.path.evaluate(this.path.length());
        } else {
            level = this.path.evaluate(v*this.path.length());
        }

        let vertex_n = Math.round(u*(this.profile.vs.length-1));
        let p = this.profile.vs[vertex_n];
        let tangent = vec4.fromValues(-p.ny, p.nx, 0, 1);

        let levelMatrix = mat4.fromValues(
            level.nx, level.bx, level.tx, level.x,
            level.ny, level.by, level.ty, level.y,
            level.nz, level.bz, level.tz, level.z,
            0       , 0       , 0       , 1
        );

        let normalMatrix = mat4.create();
        mat4.invert(normalMatrix, levelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        let xt = normalMatrix[0] * tangent[0] + normalMatrix[1] * tangent[1] + normalMatrix[2] * tangent[2] + normalMatrix[3] * tangent[3];
        let yt = normalMatrix[4] * tangent[0] + normalMatrix[5] * tangent[1] + normalMatrix[5] * tangent[2] + normalMatrix[7] * tangent[3];
        let zt = normalMatrix[8] * tangent[0] + normalMatrix[9] * tangent[1] + normalMatrix[10] * tangent[2] + normalMatrix[11] * tangent[3];
        return [xt, yt, zt];
    }

    getBinormal(u, v){
        let tangent = this.getTangent(u, v);
        let normal = this.getNormal(u, v);

        let binormal = vec3.create();
        vec3.cross(binormal, tangent, normal);
        vec3.normalize(binormal, binormal);
        return [binormal[0], binormal[1], binormal[2]];
    }


    cumulative_perimeter(){
        if(this.profile.cumulative_perimeter){
            return this.profile.cumulative_perimeter;
        }
        const vs = this.profile.vs;
        let cumulative = [];
        let d = 0;
        let prev_x = vs[0].x;
        let prev_y = vs[0].y;
        let prev_z = vs[0].z;
        for(let i = 0; i < vs.length; i+=1){
            const x = vs[i].x; const y = vs[i].y; const z = vs[i].z;

            d += Math.sqrt((x-prev_x)*(x-prev_x) +
                           (y-prev_y)*(y-prev_y) +
                           (z-prev_z)*(z-prev_z));

            cumulative.push(d);

            prev_x = x; prev_y = y; prev_z = z;
        }
        this.profile.cumulative_perimeter = cumulative;
        return this.profile.cumulative_perimeter;
    }

    homogenize_u(u){
        // u recorre el poligono
        const cumulative = this.cumulative_perimeter();
        let vertex_n = Math.round(u*(this.profile.vs.length-1));

        return cumulative[vertex_n] / cumulative[cumulative.length-1];
    }

    homogenize_v(v){
        // v recorre la curva
        const total_length = this.cumulative_distance[this.cumulative_distance.length-1];
        const v_no = Math.round(v * 1/this.step * this.path.length())
        return this.cumulative_distance[v_no] / total_length;
    }
    
    getCoverTextureCordenates(u, v){
        const closed = this.closed;
        let b = border(this.profile.vs);

        if (closed && (approx_equals(v, -1/(this.rows-4)) || approx_equals(v, 1+1/(this.rows-4)))){
            // Borde de la tapa inferior y superior
            let vertex_n = Math.round(u*(this.profile.vs.length-1));
            let p = this.profile.vs[vertex_n];
            return [
                fix((p.x-b.min_x)/(b.max_x-b.min_x)),
                fix((p.y-b.min_y)/(b.max_y-b.min_y))
            ];
        }
        // else if (closed && approx_equals(v, 1+2/(this.rows-4))) {    // v° == c
        // Centro de la tapa inferior y superior
        let c = center(this.profile.vs);
        return [
            fix((c.x-b.min_x)/(b.max_x-b.min_x)),
            fix((c.y-b.min_y)/(b.max_y-b.min_y))
        ];
    }

    is_v_from_cover(v){
        return approx_equals(v, -2/(this.rows-4))  ||
               approx_equals(v, -1/(this.rows-4))  ||
               approx_equals(v, 1+1/(this.rows-4)) ||
               approx_equals(v, 1+2/(this.rows-4));
    }

    getTextureCordenates(u, v) {
        const closed = this.closed;
        if(closed)
            v = this.rows/(this.rows-4)*v-2/(this.rows-4);
        v = fix(v);

        if (closed && this.is_v_from_cover(v)){
            return this.getCoverTextureCordenates(u, v);
        }

        return [this.homogenize_u(fix(u)),
                this.homogenize_v(fix(v))];
    }
}