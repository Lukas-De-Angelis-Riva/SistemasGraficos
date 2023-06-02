import { SweepCurve } from "./SweepCurve.js";
import { System } from "./System.js";
import { CubicBezier } from "./curves/CubicBezier.js";
import { Line } from "./curves/Line.js";
import { QuadraticBezier } from "./curves/QuadraticBezier.js";
import { MovingSweepCurve } from "./MovingSweepCurve.js"
import { Circle } from "./polygons/Circle.js";
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
let seagreen = [46/255, 139/255, 87/255]; 
let brown =  [165/255,42/255,42/255];

export class Ship {
    static move(ship, L=30){
        let vel = 0.075;
        ship.translate(0, 0, vel);

        let pos = ship.xyz();
        if(pos[2] > L) {
            ship.translate(0, 0, -2*L);
        }
    }

    constructor(gl, L=1){
        let colors = [grey, red, blue, yellow, green];

        let hull_lower = new CubicBezier(gl, [[1, 0, 0], [1, -1, 0], [-1, -1, 0], [-1, 0, 0]]);
        let hull_upper = new Line(gl, [-1, 0, 0], [1, 0, 0]);

        let hull_profile = new Polygon([...hull_lower.discretization(0.1), ...hull_upper.discretization(1)]);

        let path = new Line(gl, [0, 0, 0], [0, 0, L]);
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
    constructor(gl, h1=4, h2=14, a=0.4, L_road_line = 15, L_road_curve=30){
        let h0 = 2.5;       // distance from startTower to minRoad
        // h1               // distance from minRoad to maxCurveRoad
        // h2               // Total heigth of the tower
        let h3 = h2-h1-h0;  // Distance from maxCurveRoad to EndTower
        // a                // startCable = a*h1

        // let L_road_line = 15;    // Length of the road
        // let L_road_curve = 30;    // Length of the road
        let W_road = 4;    // Width of the road 

        let r = 0.5;        // radius of towers
        let cable_r = 0.1;  // radius of cable


        let sys = new System(gl);

        let road = new Road(gl, h1, L_road_line, L_road_curve, W_road);
        sys.addChild(road);


        let us = Road.getLevel(gl, L_road_curve, h1, a);
        let L_cable = us[1]-us[0];

        //                                      +0.5 to get into the road.
        let cable1 = new Cable(gl, L_cable, a*h1+0.5, h3+(1-a)*h1-1, cable_r);
        cable1.translate(0, 0, W_road/2-cable_r);
        sys.addChild(cable1);

        let cable2 = new Cable(gl, L_cable, a*h1+0.5, h3+(1-a)*h1-1, cable_r);
        cable2.translate(0, 0, -W_road/2+cable_r);
        sys.addChild(cable2);

        let tower1 = new Tower(gl, r, h2);
        tower1.translate(-2*L_cable/10, -h0, W_road/2-cable_r);
        tower1.rotateX(Math.PI/2);
        sys.addChild(tower1);

        let tower2 = new Tower(gl, r, h2);
        tower2.translate(-2*L_cable/10, -h0, -W_road/2+cable_r);
        tower2.rotateX(Math.PI/2);
        sys.addChild(tower2);

        let tower3 = new Tower(gl, r, h2);
        tower3.translate(2*L_cable/10, -h0, W_road/2-cable_r);
        tower3.rotateX(Math.PI/2);
        sys.addChild(tower3);

        let tower4 = new Tower(gl, r, h2);
        tower4.translate(2*L_cable/10, -h0, -W_road/2+cable_r);
        tower4.rotateX(Math.PI/2);
        sys.addChild(tower4);

        return sys;
    }
}

class TerrainCurve extends QuadraticBSpline {
    constructor(gl, controlPoints){
        super(gl, controlPoints);
        this.backup = controlPoints.slice();
        this.i = 0;
        this.lap = true;
    }

    move(p, a, b, c){
        return [p[0]+a, p[1]+b, p[2]+c];
    }

    evaluate(u){
        if(this.lap && u < 1e-6){ // is 0
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

            this.lap = false;
        } else if (u > 1e-6){
            this.lap = true;
        }

        return super.evaluate(u);
    }
}

export class Terrain {
    constructor(gl, L=30, L_inner=15, H=3){
        let p0 = [-L, 0, 0];
        let p0_ = [-L+1e-6, 0, 0];
        let p1 = [-L_inner, 0, 0];
        let p2 = [-L_inner/2, 0, 0];
        let p3 = [-L_inner/4, -H, 0];
        let p4 = [0, -H, 0];
        let p5 = [L_inner/4, -H, 0];
        let p6 = [L_inner/2, 0, 0];
        let p7 = [L_inner, 0, 0];
        let p8_ = [L-1e-6, 0, 0];
        let p8 = [L, 0, 0];

        let controlPoints = [p0, p0_, p1, p2, p3, p4, p5, p6, p7, p8_, p8];
        let terrain_curve = new TerrainCurve(gl, controlPoints);
        /*
        let right = new Line(gl, [L, 0, 0], [L, -3*H, 0]);
        let bottom = new Line(gl, [L, -3*H, 0], [-L, -3*H, 0]);
        let left = new Line(gl, [-L, -3*H, 0], [-L, 0, 0]);
        let terrain_path = new Path(gl, [terrain_curve, right, bottom, left]);
        */
        let line = new Line(gl, [0, 0, -L], [0, 0, L]);
        line.setBinor(0, 1, 0);

        let t = new MovingSweepCurve(gl, terrain_curve, 0.05, line, 0.01, false);
        t.setColor(green);
        return t;
    }
}

class Road {
    constructor(gl, h1 = 2, L_line=5, L_curve=5, A=6) {
        let m1x = function(p){
            return [-p[0], p[1], p[2]];
        }

        let h = 0.25/6 * A;
        let J = A/2 - h;
        let thickness = 0.5;
        let sidewalk_thickness = 0.25;

        // left
        let pLeftUp = [-A/2, sidewalk_thickness+thickness, 0];
        let pLeftDo = [-A/2, 0, 0];

        // right
        let pRightUp = [A/2, sidewalk_thickness+thickness, 0];
        let pRightDo = [A/2, 0, 0];

        // top
        let pLeft0 = [-(A-h)/2, sidewalk_thickness+thickness, 0];
        let pLeft1 = [-J+h/2, sidewalk_thickness+thickness, 0];
        let pLeft2 = [-J+h/2, thickness, 0];
        let pLeft3 = [-J+h, thickness, 0];
        let pRight0 = m1x(pLeft3);
        let pRight1 = m1x(pLeft2);
        let pRight2 = m1x(pLeft1);
        let pRight3 = m1x(pLeft0);

        let profile_array = [];
        let profile1 = new Line(gl, pLeftUp, pLeft0);
        let profile2 = new CubicBezier(gl, [pLeft0, pLeft1, pLeft2, pLeft3]);
        let profile3 = new Line(gl, pLeft3, pRight0);
        let profile4 = new CubicBezier(gl, [pRight0, pRight1, pRight2, pRight3]);
        let profile5 = new Line(gl, pRight3, pRightUp);
        let profile6 = new Line(gl, pRightUp, pRightDo);
        let profile7 = new Line(gl, pRightDo, pLeftDo);
        let profile8 = new Line(gl, pLeftDo, pLeftUp);

        profile_array = profile_array.concat(profile1.discretization(1));
        profile_array = profile_array.concat(profile2.discretization(0.05));
        profile_array = profile_array.concat(profile3.discretization(1));
        profile_array = profile_array.concat(profile4.discretization(0.05));
        profile_array = profile_array.concat(profile5.discretization(1));
        profile_array = profile_array.concat(profile6.discretization(1));
        profile_array = profile_array.concat(profile7.discretization(1));
        profile_array = profile_array.concat(profile8.discretization(1));
        this.profile = new Polygon(profile_array);

        let path1 = new Line(gl, [-L_line-L_curve/2, 0, 0], [-L_curve/2, 0, 0]);
        let path2 = new CubicBezier(gl, [[-L_curve/2, 0, 0], [-L_curve/4, h1, 0], [L_curve/4, h1, 0], [L_curve/2, 0, 0]]);
        let path3 = new Line(gl, [L_curve/2, 0, 0], [L_line+L_curve/2, 0, 0]);

        this.path = new Path(gl, [path1, path2, path3]);
        this.path.setBinor(0,1,0);
        return new SweepCurve(gl, this.profile, this.path, 0.1, false);
    }

    // h from 0 to 1 (high = h * h1s)
    static getLevel(gl, L, h1, h){
        let path2 = new CubicBezier(gl, [[-L/2, 0, 0], [-L/4, h1, 0], [L/4, h1, 0], [L/2, 0, 0]]);
        path2.setBinor(0, 1, 0);

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
        let curve_h = (1-3*line_h)/2;

        let line1 = new Line(gl, [r, 0, 0], [r, h2*line_h, 0]);
        line1.setBinor(0, 0, -1);

        let curve1 = new CubicBezier(gl, [[r, h2*line_h, 0],
                                        [r, h2*(line_h+curve_h*1/2), 0],
                                        [r/2, h2*(line_h+curve_h*1/2), 0],
                                        [r/2, h2*(line_h+curve_h), 0]]);
        curve1.setBinor(0, 0, -1);

        let line2 = new Line(gl, [r/2, h2*(line_h+curve_h), 0], [r/2, h2*(2*line_h+curve_h), 0]);
        line2.setBinor(0, 0, -1);

        let curve2 = new CubicBezier(gl, [[r/2, h2*(2*line_h+curve_h), 0],
                                        [r/2, h2*(2*line_h+curve_h*3/2), 0],
                                        [r/4, h2*(2*line_h+curve_h*3/2), 0],
                                        [r/4, h2*(2*line_h+2*curve_h), 0]]);
        curve2.setBinor(0, 0, -1);

        let line3 = new Line(gl, [r/4, h2*(2*line_h+2*curve_h), 0], [r/4, h2*(3*line_h+2*curve_h), 0]);
        line3.setBinor(0, 0, -1);

        let profile_array = [];
        profile_array = profile_array.concat(line1.discretization(1));
        profile_array = profile_array.concat(curve1.discretization(0.05));
        profile_array = profile_array.concat(line2.discretization(1));
        profile_array = profile_array.concat(curve2.discretization(0.05));
        profile_array = profile_array.concat(line3.discretization(1));
        let profile = new Polygon(profile_array);

        let t = Revolution.fromPolygon(gl, 10, profile, true);
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

export class Tree {
    constructor(gl, r, h){
        let circ = new Circle(1, 20 /*div*/);
        let trunk_path = new Line(gl, [0,-0.5,0], [0, 0.5, 0]);
        trunk_path.setBinor(0, 0, 1);
        let trunk = new SweepCurve(gl, circ, trunk_path, 1, true);
        trunk.setColor(brown);

        let p0 = [1, 0.5, 0]; let p1 = [3/2, 1, 0]; let p1_ = [3/2+1e-6, 1, 0];
        let p2 = [1, 2, 0];
        let p3 = [1/6, 4, 0]; let p4 = [1/6, 5, 0]; let p5 = [0, 5, 0];

        let curve1 = new CubicBezier(gl, [p0, p1, p1_, p2]);
        let curve2 = new CubicBezier(gl, [p2, p3, p4, p5]);
        let curve = new Path(gl, [curve1, curve2]);

        let crown = Revolution.fromCurve(gl, 20, curve, 0.05, false);
        crown.setColor(seagreen);
        crown.rotateX(Math.PI/2);

        let tree = new System(gl);
        tree.addChild(trunk);
        tree.addChild(crown);
        tree.scale(r, h, r);

        return tree;
    }
}