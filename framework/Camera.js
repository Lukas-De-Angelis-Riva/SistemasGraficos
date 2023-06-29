var mat4=glMatrix.mat4;
var vec4=glMatrix.vec4;
var vec3=glMatrix.vec3;

function limit(x, min, max){
    if(x > max){
        return max;
    } else if (x < min){
        return min;
    }
    return x;
}

export class FollowerCamera {
    constructor(gl, xyz, followingObject){
        this.gl = gl;
        this.followingObject = followingObject;
        this.xyz = xyz;
        this.up = [0, 1, 0];
    }

    look(){        
        let viewPoint = this.followingObject.relative([0,0,0]);
        let position = this.followingObject.relative(this.xyz);

        let viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix,
            position,
            viewPoint,
            this.up
        );
        return viewMatrix;
    }

    turnSide(rad){}

    tunrUp(rad){}

    move(movement){}

    eyePos(){
        return this.followingObject.relative(this.xyz);
    }
}

export class DronCamera {
    static MAX_UP_ANGLE = 7 * Math.PI / 16;
    static DELTA_MOVEMENT = .1;
    static RAD_VEL = 2 * Math.PI * 0.005;

    constructor(gl, xStart = 0, yStart = 0, zStart = 0) {
        this.gl = gl;
        this.viewMatrix = mat4.create();

        this.position = vec3.fromValues(xStart, yStart, zStart);

        this.front_v = vec3.fromValues(0, 0, -1);
        this.up = vec3.fromValues(0, 1, 0);
        this.left = vec3.fromValues(1, 0, 0);

        let viewPoint = vec3.create();
        vec3.add(viewPoint, this.position, this.front_v);

        mat4.lookAt(this.viewMatrix,
            this.position,
            viewPoint,
            this.up
        );

        this.b = 0;
    }

    look(){
        const b = this.b;

        let viewDir = vec3.create();
        vec3.scaleAndAdd(viewDir, viewDir, this.front_v, Math.cos(b));
        vec3.scaleAndAdd(viewDir, viewDir, this.up, Math.sin(b));
        vec3.normalize(viewDir, viewDir);

        let viewPoint = vec3.create();
        vec3.add(viewPoint, this.position, viewDir);

        mat4.lookAt(this.viewMatrix,
            this.position,
            viewPoint,
            this.up
        );

        return this.viewMatrix;
    }

    moveForward(intensity){
        vec3.scaleAndAdd(this.position, this.position, this.front_v, intensity * DronCamera.DELTA_MOVEMENT);
    }

    moveSide(intensity){
        vec3.scaleAndAdd(this.position, this.position, this.left, intensity * DronCamera.DELTA_MOVEMENT);
    }

    moveUp(intensity){
        vec3.scaleAndAdd(this.position, this.position, this.up, intensity * DronCamera.DELTA_MOVEMENT);
    }

    turnSide(intensity){
        let rad = intensity*DronCamera.RAD_VEL;

        let new_front = vec3.create();
        vec3.scale(new_front, this.front_v, Math.cos(rad))
        vec3.scaleAndAdd(new_front, new_front, this.left, Math.sin(rad));

        let new_left = vec3.create();
        vec3.scale(new_left, this.front_v, -Math.sin(rad))
        vec3.scaleAndAdd(new_left, new_left, this.left, Math.cos(rad));

        this.front_v = new_front;
        this.left = new_left;
    }

    tunrUp(intensity){
        this.b = limit(this.b+intensity*DronCamera.RAD_VEL, -DronCamera.MAX_UP_ANGLE, DronCamera.MAX_UP_ANGLE);
    }

    move(movement){
        if (movement.front) this.moveForward(1);
        if (movement.back) this.moveForward(-1);
        if (movement.left) this.moveSide(1)
        if (movement.right) this.moveSide(-1);
        if (movement.up) this.moveUp(1);
        if (movement.down) this.moveUp(-1);

        if (movement.turnleft) this.turnSide(1);
        if (movement.turnright) this.turnSide(-1);

        if (movement.turnup) this.tunrUp(1);
        if (movement.turndown) this.tunrUp(-1);
    }

    eyePos(){
        return this.position;
    }
}

export class OrbitalCamera {
    static MAX_RAD_VEL = 2 * Math.PI * 0.015;
    static RAD_ACCELERATION = 2 * Math.PI * 0.001;
    static DELTA_R = 1;
    static MIN_ZOOM = 5;
    static MAX_ZOOM = 80;
    static MAX_B = Math.PI-Math.PI/12;
    static MIN_B = Math.PI/12;

    constructor(gl, r, a, b) {
        this.gl = gl;
        this.r = limit(r, OrbitalCamera.MIN_ZOOM, OrbitalCamera.MAX_ZOOM);
        this.va = 0;
        this.a = a;
        this.vb = 0;
        this.b = limit(b, OrbitalCamera.MIN_B, OrbitalCamera.MAX_B);
        this.up = [0,1,0];
    }

    look(){
        const a = this.a;
        const b = this.b;
        const r = this.r;

        let x = r * Math.sin(a) * Math.sin(b);
        let y = r * Math.cos(b);
        let z = r * Math.cos(a) * Math.sin(b);

        let viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix,
            [x,y,z],
            [0,0,0],
            this.up
        );

        return viewMatrix;
    }

    turnSide(intensity){
        this.va = limit(this.va+intensity*OrbitalCamera.RAD_ACCELERATION,
                        -OrbitalCamera.MAX_RAD_VEL,
                        OrbitalCamera.MAX_RAD_VEL);
    }

    tunrUp(intensity){
        this.vb = limit(this.vb+intensity*OrbitalCamera.RAD_ACCELERATION,
                        -OrbitalCamera.MAX_RAD_VEL,
                        OrbitalCamera.MAX_RAD_VEL);
    }

    updateVelocity(v, delta){
        if(v > delta)
            return v-delta;
        else if (v < -delta)
            return v+delta;
        return 0;
    }

    move(movement){
        const rad_acc = OrbitalCamera.RAD_ACCELERATION;
        const rad_vel = OrbitalCamera.MAX_RAD_VEL;

        if (movement.turnleft) this.turnSide(1);
        if (movement.turnright) this.turnSide(-1);
        if (movement.turnup) this.tunrUp(1);
        if (movement.turndown) this.tunrUp(-1);
        if (movement.zoomOut) this.zoomOut();
        if (movement.zoomIn) this.zoomIn();

        this.a += this.va;
        this.va = this.updateVelocity(this.va, rad_acc/2);
        this.b = limit(this.b+this.vb, OrbitalCamera.MIN_B, OrbitalCamera.MAX_B);
        this.vb = this.updateVelocity(this.vb, rad_acc/2);
    }

    zoomOut(){
        this.r = limit(this.r+OrbitalCamera.DELTA_R,
                       OrbitalCamera.MIN_ZOOM,
                       OrbitalCamera.MAX_ZOOM);
    }

    zoomIn(){
        this.r = limit(this.r-OrbitalCamera.DELTA_R,
            OrbitalCamera.MIN_ZOOM,
            OrbitalCamera.MAX_ZOOM);
    }

    eyePos(){
        const a = this.a;
        const b = this.b;
        const r = this.r;

        let x = r * Math.sin(a) * Math.sin(b);
        let y = r * Math.cos(b);
        let z = r * Math.cos(a) * Math.sin(b);

        return [x,y,z];
    }
}