var vec3=glMatrix.vec3;

export class Line {
    constructor(gl, p1, p2){
        this.p1 = vec3.fromValues(p1[0], p1[1], p1[2]);
        this.p2 = vec3.fromValues(p2[0], p2[1], p2[2]);

        this.tangent = vec3.create();
        vec3.subtract(this.tangent, p2, p1);
        vec3.normalize(this.tangent, this.tangent);

        this.binormal = vec3.fromValues(0, 0, 1);

        this.normal = vec3.create();
        vec3.cross(this.normal, this.binormal, this.tangent);
        vec3.normalize(this.normal, this.normal);
     }

     setBinor(x, y, z){
        this.binormal = vec3.fromValues(x,y,z);
        this.normal = vec3.create();
        vec3.cross(this.normal, this.binormal, this.tangent);
        vec3.normalize(this.normal, this.normal);
    }

    evaluate(u){
        let pos = vec3.create();
        vec3.scale(pos, this.p1, 1-u);
        vec3.scaleAndAdd(pos, pos, this.p2, u);

        let p = new Object();
        p.x = pos[0]; p.y = pos[1]; p.z = pos[2];
        p.tx = this.tangent[0]; p.ty = this.tangent[1]; p.tz = this.tangent[2];
        p.nx = this.normal[0]; p.ny = this.normal[1]; p.nz = this.normal[2];
        p.bx = this.binormal[0]; p.by = this.binormal[1]; p.bz = this.binormal[2];

        return p;
    }

    discretization(step=1) {
        var points = [];
        for(let u=0; u<=1+step/2; u+=step) {
            points.push(this.evaluate(u));
        }
        return points;
    }

    length(){
        return 1;
    }
}