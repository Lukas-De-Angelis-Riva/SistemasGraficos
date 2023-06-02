var mat4=glMatrix.mat4;
var vec4=glMatrix.vec4;
var vec3=glMatrix.vec3;

export class FollowerCamera {
    constructor(gl, xyz, followingObject){
        this.gl = gl;
        this.followingObject = followingObject;
        this.xyz = xyz;
        this.up = [0, 1, 0];
    }

    look(shaderProgram){
        const gl = this.gl;
        
        let viewPoint = this.followingObject.relative([0,0,0]);
        let position = this.followingObject.relative(this.xyz);

        let viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix,
            position,
            viewPoint,
            this.up
        );
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
    }

    turnSide(rad){}

    tunrUp(rad){}

    move(movement){}
}

export class DronCamera {
    constructor(gl, xStart = 0, yStart = 0, zStart = 3) {
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

    look(shaderProgram){
        const gl = this.gl;
        const b = this.b;

        let viewDir = vec3.create();
        vec3.scaleAndAdd(viewDir, viewDir, this.front_v, 1);
        vec3.scaleAndAdd(viewDir, viewDir, this.up, Math.sin(b));
        vec3.normalize(viewDir, viewDir);

        let viewPoint = vec3.create();
        vec3.add(viewPoint, this.position, viewDir);

        mat4.lookAt(this.viewMatrix,
            this.position,
            viewPoint,
            this.up
        );

        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, this.viewMatrix);
    }

    moveForward(delta){
        vec3.scaleAndAdd(this.position, this.position, this.front_v, delta);
    }

    moveSide(delta){
        vec3.scaleAndAdd(this.position, this.position, this.left, delta);
    }

    moveUp(delta){
        vec3.scaleAndAdd(this.position, this.position, this.up, delta);
    }

    turnSide(rad){
        let new_front = vec3.create();
        vec3.scale(new_front, this.front_v, Math.cos(rad))
        vec3.scaleAndAdd(new_front, new_front, this.left, Math.sin(rad));

        let new_left = vec3.create();
        vec3.scale(new_left, this.front_v, -Math.sin(rad))
        vec3.scaleAndAdd(new_left, new_left, this.left, Math.cos(rad));

        this.front_v = new_front;
        this.left = new_left;
    }

    tunrUp(rad){
        this.b += rad;
        if(this.b > Math.PI/2){
            this.b = Math.PI/2;
        }else if (this.b < -Math.PI/2){
            this.b = -Math.PI/2
        }
    }

    move(movement){
        let delta = 0.10;
        let rad = 2*Math.PI* delta/10;

        if (movement.front) this.moveForward(delta);
        if (movement.back) this.moveForward(-delta);
        if (movement.left) this.moveSide(delta)
        if (movement.right) this.moveSide(-delta);
        if (movement.up) this.moveUp(delta);
        if (movement.down) this.moveUp(-delta);

        if (movement.turnleft) this.turnSide(rad);
        if (movement.turnright) this.turnSide(-rad);

        if (movement.turnup) this.tunrUp(rad);
        if (movement.turndown) this.tunrUp(-rad);
    }
}

export class OrbitalCamera {
    constructor(gl, r, a, b) {
        this.gl = gl;
        this.r = r;
        this.a = a;
        this.b = b;
        this.up = [0,1,0];
    }

    look(shaderProgram){
        const gl = this.gl;
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

        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
    }

    turnSide(rad){
        this.a += rad;
    }

    tunrUp(rad){
        this.b += rad;
    }

    move(movement){
        let delta = 0.10;
        let rad = 2*Math.PI* delta/10;

        if (movement.turnleft) this.turnSide(rad);
        if (movement.turnright) this.turnSide(-rad);

        if (movement.turnup) this.tunrUp(rad);
        if (movement.turndown) this.tunrUp(-rad);
    }
}