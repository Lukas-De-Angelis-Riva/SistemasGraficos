export class Path {
    constructor(gl, curves){
        this.gl = gl;
        this.curves = curves;
        this._length = curves.reduce((partial, c) => partial+c.length(), 0);
    }

    evaluate(u){
        let prev = 0;
        for(let i=0; i < this.curves.length; i++){
            let curve_i = this.curves[i];
            if(prev <= u && u <= prev+curve_i.length()){
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
            console.log(points);
        }
        return points;
    }

    length(){
        return this._length;
    }
}