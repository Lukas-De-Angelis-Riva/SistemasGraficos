var mat4=glMatrix.mat4;
var mat3=glMatrix.mat3;
var vec3=glMatrix.vec3;

export class BasedCurve {
    constructor(gl, bases, dbases, controlPoints=[]) {
        this.gl = gl;
        this.bases = bases;
        this.dbases = dbases;
        this.controlPoints = controlPoints;
        this.binor = vec3.fromValues(0, 0, 1);
        this._length = 1;
    }

    setBinor(x, y, z){
        this.binor = vec3.fromValues(x,y,z);
    }

    evaluate(u){
        u = u/this.length();
        let pos = vec3.create();
        let tan = vec3.create();
        let binor = this.binor;

        for(let i=0; i < this.controlPoints.length; i++){
            let p = this.controlPoints[i];
            let b = this.bases[i](u);
            vec3.scaleAndAdd(pos, pos, p, b);
            vec3.scaleAndAdd(tan, tan, p, this.dbases[i](u));
        }
        vec3.normalize(tan, tan);

        let nor = vec3.create();
        vec3.cross(nor, binor, tan);
        vec3.normalize(nor, nor);

        let p = new Object();
        p.x = pos[0]; p.y = pos[1]; p.z = pos[2];
        p.tx = tan[0]; p.ty = tan[1]; p.tz = tan[2];
        p.nx = nor[0]; p.ny = nor[1]; p.nz = nor[2];
        p.bx = binor[0]; p.by = binor[1]; p.bz = binor[2];

        return p;
    }

    discretization(step) {
        var points = [];
        for(let u=0; u<=this.length()+step/2; u+=step){
            points.push(this.evaluate(u));
        }
        return points;
    }

    calculate_length(step){
        let points = this.discretization(step);
        let d = 0;
        let prev_x = points[0].x;
        let prev_y = points[0].y;
        let prev_z = points[0].z;

        for(let i = 1; i < points.length; i+=1){
            let x = points[i].x;
            let y = points[i].y;
            let z = points[i].z;

            d += Math.sqrt((x-prev_x)*(x-prev_x) +
                           (y-prev_y)*(y-prev_y) +
                           (z-prev_z)*(z-prev_z));

            prev_x = x;
            prev_y = y;
            prev_z = z;    
        }

        return d;
    }

    cumulative_distance(step){
        let points = this.discretization(step);
        let cumulative = [];
        let d = 0;
        let prev_x = points[0].x;
        let prev_y = points[0].y;
        let prev_z = points[0].z;

        for(let i = 0; i < points.length; i+=1){
            let x = points[i].x;
            let y = points[i].y;
            let z = points[i].z;

            d += Math.sqrt((x-prev_x)*(x-prev_x) +
                           (y-prev_y)*(y-prev_y) +
                           (z-prev_z)*(z-prev_z));

            cumulative.push(d);

            prev_x = x;
            prev_y = y;
            prev_z = z;    
        }
        return cumulative;
    }

    length(){
        return this._length;
    }

    setLength(l){
        this._length = l;
    }
}