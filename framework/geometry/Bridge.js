import { SweepCurve } from "./SweepCurve.js";
import { System } from "./System.js";
import { CubicBezier } from "./curves/CubicBezier.js";
import { Path } from "./curves/Path.js";
import { Polygon } from "./polygons/Polygon.js";
import { Revolution } from "./Revolution.js";

export class Bridge {
    constructor(gl){
        let sys = new System(gl);

        let road = new Road(gl, 4, 20);
        road.rotateX(-Math.PI/2);
        sys.addChild(road);

        let tower1 = new Tower(gl, 0.5, 14);
        tower1.translate(-20/2, -2.5, 3);
        tower1.rotateX(Math.PI/2);
        sys.addChild(tower1);
    
        let tower2 = new Tower(gl, 0.5, 14);
        tower2.translate(-20/2, -2.5, -3);
        tower2.rotateX(Math.PI/2);
        sys.addChild(tower2);
    
        let tower3 = new Tower(gl, 0.5, 14);
        tower3.translate(20/2, -2.5, 3);
        tower3.rotateX(Math.PI/2);
        sys.addChild(tower3);
    
        let tower4 = new Tower(gl, 0.5, 14);
        tower4.translate(20/2, -2.5, -3);
        tower4.rotateX(Math.PI/2);
        sys.addChild(tower4);
        
        return sys;
    }
}

class Road {
    constructor(gl, h1 = 2, L=10) {
        let profile1 = new CubicBezier(gl, [[-3, 1, 0], [-2.5, 1, 0], [-2.5, 1, 0], [-2, 1, 0]]);
        let profile2 = new CubicBezier(gl, [[-2, 1, 0], [-1.5, 1, 0], [-1.3, 0.5, 0], [-1, 0.5, 0]]);
        let profile3 = new CubicBezier(gl, [[-1, 0.5, 0], [-0.5, 0.5, 0], [0.5, 0.5, 0], [1, 0.5, 0]]);
        let profile4 = new CubicBezier(gl, [[1, 0.5, 0], [1.3, 0.5, 0], [1.5, 1, 0], [2, 1, 0]]);
        let profile5 = new CubicBezier(gl, [[2, 1, 0], [2.5, 1, 0], [2.5, 1, 0], [3, 1, 0]]);
        let profile6 = new CubicBezier(gl, [[3, 1, 0], [3, 0.5, 0], [3, 0.5, 0], [3, 0, 0]]);
        let profile7 = new CubicBezier(gl, [[3, 0, 0], [0, 0, 0], [0, 0, 0], [-3, 0, 0]]);
        let profile8 = new CubicBezier(gl, [[-3, 0, 0], [-3, 0.5, 0], [-3, 0.5, 0], [-3, 1, 0]]);

        let profile_path = new Path(gl, [profile1, profile2, profile3, profile4, profile5, profile6, profile7, profile8]);
        let profile = new Polygon(profile_path.discretization(0.05));

        let path1 = new CubicBezier(gl, [[-2*L, 0, 0], [-2*L+1, 0, 0], [-L-1, 0, 0], [-L, 0, 0]]);
        let path2 = new CubicBezier(gl, [[-L, 0, 0], [-L/2, 0, h1], [L/2, 0, h1], [L, 0, 0]]);
        let path3 = new CubicBezier(gl, [[L, 0, 0], [L+1, 0, 0], [2*L-1, 0, 0], [2*L, 0, 0]]);
        let path = new Path(gl, [path1, path2, path3]);

        return new SweepCurve(gl, profile, path, 0.05);
    }
}

class Tower {
    constructor(gl, r=1, h2=10) {
        let line_h = 0.30;
        let curve_h = 0.05; // (1 - 3·line_h)/2

        let line1 = new CubicBezier(gl, [[r, 0, 0],
                                        [r, 1/3*h2*line_h, 0],
                                        [r, 2/3*h2*line_h, 0],
                                        [r, h2*line_h, 0]]);

        let curve1 = new CubicBezier(gl, [[r, h2*line_h, 0],
                                        [r, h2*(line_h+curve_h*1/2), 0],
                                        [r/2, h2*(line_h+curve_h*1/2), 0],
                                        [r/2, h2*(line_h+curve_h), 0]]);

        let line2 = new CubicBezier(gl, [[r/2, h2*(line_h+curve_h), 0],
                                        [r/2, h2*(line_h*4/3+curve_h), 0],
                                        [r/2, h2*(line_h*5/3+curve_h), 0],
                                        [r/2, h2*(2*line_h+curve_h), 0]]);

        let curve2 = new CubicBezier(gl, [[r/2, h2*(2*line_h+curve_h), 0],
                                        [r/2, h2*(2*line_h+curve_h*3/2), 0],
                                        [r/4, h2*(2*line_h+curve_h*3/2), 0],
                                        [r/4, h2*(2*line_h+2*curve_h), 0]]);

        let line3 = new CubicBezier(gl, [[r/4, h2*(2*line_h+2*curve_h), 0],
                                        [r/4, h2*(line_h*7/3+2*curve_h), 0],
                                        [r/4, h2*(line_h*8/3+2*curve_h), 0],
                                        [r/4, h2*(3*line_h+2*curve_h), 0]]);


        let path = new Path(gl, [line1, curve1, line2, curve2, line3]);

        return Revolution.fromCurve(gl, 10, path, 0.05);
    }
}