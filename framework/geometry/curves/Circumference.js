var cos=Math.cos;
var sin=Math.sin;

function approx_equals(a, b, delta=1e-6) {
    return (b - delta <= a) && (a <= b + delta);
}

export class Circumference {
    constructor(r) {
        this.r = r;
    }

    evaluate(u){
        const r = this.r;
        let phi = 2*Math.PI * u;

        let p = new Object();
        p.x = r*cos(phi); p.y = r*sin(phi); p.z = 0;
        p.tx = -sin(phi); p.ty = cos(phi); p.tz = 0;
        p.nx = cos(phi); p.ny = sin(phi); p.nz = 0;
        p.bx = 0; p.by = 0; p.bz = -1;

        return p
    }

    discretization(step) {
        var points = [];
        for(let u=0; u<=1+step/2; u+=step){
            points.push(this.evaluate(u));
        }
        return points;
    }

    cumulative_distance(step){
        // In case of revolution
        if(approx_equals(this.r, 0)){
            // return [0, 1, 2, ..., 1/step];
            return [...Array(1/step+1).keys()];
        }

        let cumulative = [];
        for(let u=0; u<=this.length()+step/2; u+=step){
            cumulative.push(u * 2 * Math.PI * this.r);
        }
        return cumulative;
    }

    calculate_length(step){
        // In case of revolution
        if(approx_equals(this.r, 0)){
            return 1/step;
        }

        return 2 * Math.PI * this.r;
    }

    length(){
        return 1;
    }
}