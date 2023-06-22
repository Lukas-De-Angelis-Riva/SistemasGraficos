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

    calculate_length(step){
        const p1 = this.p1; const p2 = this.p2;
        return Math.sqrt((p1.x-p2.x)*(p1.x-p2.x) +
                         (p1.y-p2.y)*(p1.y-p2.y) +
                         (p1.z-p2.z)*(p1.z-p2.z));
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
        return 1;
    }
}