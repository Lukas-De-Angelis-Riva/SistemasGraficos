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
    }
    
    addControlPoint(p){
        if(this.controlPoints.length >= this.bases.length){
            throw new Error('Too many contron points.');
        }
        this.controlPoints.push(p);
    }

    setBinor(x, y, z){
        this.binor = vec3.fromValues(x,y,z);
    }

    evaluate(u){
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
        for(let u=0; u<=1+step/2; u+=step){
            points.push(this.evaluate(u));
            console.log(points);
        }
        return points;
    }

    length(){
        return 1;
    }
}