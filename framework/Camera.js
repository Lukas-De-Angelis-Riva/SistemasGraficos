var mat4=glMatrix.mat4;
var vec4=glMatrix.vec4;
var vec3=glMatrix.vec3;

export class Camera {
    constructor(gl, xStart = 0, yStart = 0, zStart = 3) {
        this.gl = gl;
        this.ViewMatrix = mat4.create();

        this.position = vec3.fromValues(xStart, yStart, zStart);
        this.front_v = vec3.fromValues(0, 0, -1);
        this.up = vec3.fromValues(0, 1, 0);
        this.left = vec3.fromValues(1, 0, 0);

        let viewPoint = vec3.create();
        vec3.add(viewPoint, this.position, this.front_v);

        mat4.lookAt(this.ViewMatrix,
            this.position,
            viewPoint,
            this.up
        );
    }

    look(shaderProgram){
        const gl = this.gl;

        let viewPoint = vec3.create();
        vec3.add(viewPoint, this.position, this.front_v);

        mat4.lookAt(this.ViewMatrix,
            this.position,
            viewPoint,
            this.up
        );
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, this.ViewMatrix);
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
        let new_front = vec3.create();
        vec3.scale(new_front, this.front_v, Math.cos(rad))
        vec3.scaleAndAdd(new_front, new_front, this.up, Math.sin(rad));

        let new_up = vec3.create();
        vec3.scale(new_up, this.front_v, -Math.sin(rad))
        vec3.scaleAndAdd(new_up, new_up, this.up, Math.cos(rad));

        this.front_v = new_front;
        this.up = new_up;
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