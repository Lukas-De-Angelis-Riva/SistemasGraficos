export class Path {
    constructor(gl, curves){
        this.gl = gl;
        this.curves = curves;
        this._length = curves.reduce((partial, c) => partial+c.length(), 0);
    }

    evaluate(u){
        let delta = 1e-6;
        let prev = 0;
        for(let i=0; i < this.curves.length; i++){
            let curve_i = this.curves[i];
            if(prev <= u && u <= prev+curve_i.length() + delta){
                return this.curves[i].evaluate(u-prev);
            }else{
                prev+=curve_i.length();
            }
        }
    }

    discretization(step) {
        var points = [];
        for(let u=0; u<=this._length+step/2; u+=step){
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
        return this.curves.reduce((partial, c) => partial+c.length(), 0);
    }

    setBinor(x,y,z){
        this.curves.map(c => c.setBinor(x,y,z));
    }
}