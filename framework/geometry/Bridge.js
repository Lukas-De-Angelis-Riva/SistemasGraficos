import { SweepCurve } from "./SweepCurve.js";
import { System } from "./System.js";
import { CubicBezier } from "./curves/CubicBezier.js";
import { QuadraticBezier } from "./curves/QuadraticBezier.js";
import { MovingSweepCurve } from "./MovingSweepCurve.js"

import { Path } from "./curves/Path.js";
import { Polygon } from "./polygons/Polygon.js";
import { Revolution } from "./Revolution.js";
import { Circumference } from "./curves/Circumference.js";

import { Cube } from "./Cube.js";
import { QuadraticBSpline } from "./curves/QuadraticBSpline.js";

let grey =   [.80, .80, .80];
let red =    [.85, .45, .45];
let blue =   [.25, .35, 1.0];
let yellow = [.85, .95, .50];
let green =  [.35, .70, .40];

export class Ship {
    static move(ship){
        let vel = 0.1;
        ship.translate(0, 0, vel);

        let pos = ship.xyz();
        if(pos[2] > 30 /* L */) {
            ship.translate(0, 0, -60);
        }
    }

    constructor(gl, L=1){
        let colors = [grey, red, blue, yellow, green];

        let hull_lower = new CubicBezier(gl, [[1, 0, 0], [1, -1, 0], [-1, -1, 0], [-1, 0, 0]]);
        let hull_upper = new CubicBezier(gl, [[-1, 0, 0], [-0.5, 0, 0], [0.5, 0, 0], [1, 0, 0]]);

        let hull_curve = new Path(gl, [hull_lower, hull_upper]);
        let hull_profile = new Polygon(hull_curve.discretization(0.1));

        let path = new QuadraticBezier(gl, [[0, 0, 0], [0, 0, L/2], [0, 0, L]]);
        path.setBinor(0, 1, 0);

        let hull = new SweepCurve(gl, hull_profile, path, 1);
        hull.setColor(red);

        let diff = 1e-1;
        let size = 0.25;
        for(let j = 0; j < 3; j++){
            for(let i = 0; i < 5; i++){
                if(i > 2 && j > 1) continue;
                let cube = new Cube(gl, size);
                cube.translate((i-2)*size, size/2+1e-4 + j*size, L/4);
                cube.scale(1-diff, 1-diff, 2);
                const random = Math.floor(Math.random() * colors.length);
                cube.setColor(colors[random]);
                hull.addChild(cube);
            }
        }

        let cube1 = new Cube(gl, size);
        cube1.translate(0, 3*size/2+1e-4, L/10);
        cube1.scale(5, 3, 1);
        cube1.setColor([1, 1, 1]);

        hull.addChild(cube1);

        let cube2 = new Cube(gl, size);
        cube2.translate(0, 7*size/2+2e-4, L/10);
        cube2.scale(6, 1, 2);
        cube2.setColor([1, 1, 1]);

        hull.addChild(cube2);
        return hull;
    }
}

export class Bridge {
    constructor(gl){
        let h0 = 2.5;       // distance from startTower to minRoad
        let h1 = 4;         // distance from minRoad to maxCurveRoad
        let h2 = 14;        // Total heigth of the tower
        let h3 = h2-h1-h0;  // Distance from maxCurveRoad to EndTower
        let a = 0.4;        // startCable = a*h1

        let L = 15;
        let r = 0.5;
        let cable_r = 0.1;

        let sys = new System(gl);

        let road = new Road(gl, h1, L);
        road.rotateX(-Math.PI/2);
        sys.addChild(road);


        let us = Road.getLevel(gl, L, h1, a);
        let L_cable = us[1]-us[0];

        let cable1 = new Cable(gl, L_cable, a*h1+0.5, h3+(1-a)*h1-1, cable_r);
        cable1.translate(0, 0, 3-cable_r);
        sys.addChild(cable1);

        let cable2 = new Cable(gl, L_cable, a*h1+0.5, h3+(1-a)*h1-1, cable_r);
        cable2.translate(0, 0, -3+cable_r);
        sys.addChild(cable2);

        let tower1 = new Tower(gl, r, h2);
        tower1.translate(-2*L_cable/10, -2.5, 3-cable_r);
        tower1.rotateX(Math.PI/2);
        sys.addChild(tower1);
    
        let tower2 = new Tower(gl, r, h2);
        tower2.translate(-2*L_cable/10, -2.5, -3+cable_r);
        tower2.rotateX(Math.PI/2);
        sys.addChild(tower2);
    
        let tower3 = new Tower(gl, r, h2);
        tower3.translate(2*L_cable/10, -2.5, 3-cable_r);
        tower3.rotateX(Math.PI/2);
        sys.addChild(tower3);
    
        let tower4 = new Tower(gl, r, h2);
        tower4.translate(2*L_cable/10, -2.5, -3+cable_r);
        tower4.rotateX(Math.PI/2);
        sys.addChild(tower4);
        
        return sys;
    }
}

class MovingCurve extends QuadraticBSpline {
    constructor(gl, controlPoints){
        super(gl, controlPoints);
        this.backup = controlPoints.slice();
        this.i = 0;
    }

    move(p, a, b, c){
        return [p[0]+a, p[1]+b, p[2]+c];
    }

    evaluate(u){
        if(u < 1e-6){ // is 0
            this.i++;
            this.controlPoints = this.backup.slice();
            let a = 2*Math.sin(0.1*this.i+1234);
            let b = 1.5*Math.sin(0.2*this.i+2341)-1;
            let c = 1.7*Math.sin(-0.25*this.i-3412)-1;
            this.controlPoints[3] = this.move(this.controlPoints[3], a, 0, 0);
            this.controlPoints[4] = this.move(this.controlPoints[4], a, c, 0);
            this.controlPoints[5] = this.move(this.controlPoints[5], a, 0, 0);
            this.controlPoints[6] = this.move(this.controlPoints[6], a, b, 0);
            this.controlPoints[7] = this.move(this.controlPoints[7], a, 0, 0);
        }

        return super.evaluate(u);
    }
}

export class Terrain {
    constructor(gl, L=30, L_inner=15, H=3){
        let p0 = [-L, 0, 0];
        let p1 = [-L_inner, 0, 0];
        let p2 = [-L_inner/2, 0, 0];
        let p3 = [-L_inner/4, -H, 0];
        let p4 = [0, -H, 0];
        let p5 = [L_inner/4, -H, 0];
        let p6 = [L_inner/2, 0, 0];
        let p7 = [L_inner, 0, 0];
        let p8 = [L, 0, 0];

        let controlPoints = [p0, p0, p1, p2, p3, p4, p5, p6, p7, p8, p8];
        let terrain_curve = new MovingCurve(gl, controlPoints);

        let line = new QuadraticBezier(gl, [[0, 0, -L], [0, 0, 0], [0, 0, L]]);
        line.setBinor(0, 1, 0);

        let t = new MovingSweepCurve(gl, terrain_curve, 0.05, line, 0.01, false);
        t.setColor(green);
        return t;
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
        this.profile = new Polygon(profile_path.discretization(0.05));

        let path1 = new CubicBezier(gl, [[-2*L, 0, 0], [-2*L+1, 0, 0], [-L-1, 0, 0], [-L, 0, 0]]);
        let path2 = new CubicBezier(gl, [[-L, 0, 0], [-L/2, 0, h1], [L/2, 0, h1], [L, 0, 0]]);
        let path3 = new CubicBezier(gl, [[L, 0, 0], [L+1, 0, 0], [2*L-1, 0, 0], [2*L, 0, 0]]);
        this.path = new Path(gl, [path1, path2, path3]);

        return new SweepCurve(gl, this.profile, this.path, 0.05);
    }

    // h from 0 to 1 (high = h * h1s)
    static getLevel(gl, L, h1, h){
        let path2 = new CubicBezier(gl, [[-L, 0, 0], [-L/2, 0, h1], [L/2, 0, h1], [L, 0, 0]]);

        let u1 = (1-Math.sqrt(1-4*h/3))/2;
        let u2 = (1+Math.sqrt(1-4*h/3))/2;

        let p1 = path2.evaluate(u1);
        let p2 = path2.evaluate(u2);
        return [p1.x, p2.x];
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

        let t = Revolution.fromCurve(gl, 10, path, 0.05);
        t.setColor(red);
        return t;
    }
}

class Cable {
    constructor(gl, L, startY, H, r){
        let curve1 = new QuadraticBezier(gl, [[-L/2, startY, 0], [-3*L/10, startY, 0], [-2*L/10, startY+H, 0]]);

        let curve2 = new QuadraticBezier(gl, [[-2*L/10, startY+H, 0], [0, startY-H/3, 0], [2*L/10, startY+H, 0]]);

        let curve3 = new QuadraticBezier(gl, [[2*L/10, startY+H, 0], [3*L/10, startY, 0], [L/2, startY, 0]]);
        
        let curve = new Path(gl, [curve1, curve2, curve3]);

        let circ = new Circumference(r);
        let circ_profile = new Polygon(circ.discretization(0.25));

        let c = new SweepCurve(gl, circ_profile, curve, 0.01);
        c.setColor(red);
        return c;
    }
}