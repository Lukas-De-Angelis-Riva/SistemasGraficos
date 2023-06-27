var mat4=glMatrix.mat4;

var vertex_shader = `
precision highp float;

attribute vec3 aVertexPosition;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 normalMatrix;

void main(void) {
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(aVertexPosition, 1.0);
}
`
var fragment_shader = `
precision highp float;

void main(void) {
    vec3 color = vec3(0.2, 0.2, 0.2);
    gl_FragColor = vec4(color,1.0);
}
`

export class SimpleShaderProgram {
    constructor(gl){
        this.gl = gl;

        let vertex = this.initShader(vertex_shader, gl.VERTEX_SHADER);
        let fragment = this.initShader(fragment_shader, gl.FRAGMENT_SHADER);

        this.shaderProgram = this.initShaderProgram(vertex, fragment);
    }

    initShaderProgram(vertex, fragment){
        const gl = this.gl;
        let shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertex);
        gl.attachShader(shaderProgram, fragment);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shaderProgram));
        }

        gl.useProgram(shaderProgram);

        // Buffers
        this.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(this.vertexPositionAttribute);
 
        // Matrixs
        this.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");
        this.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "viewMatrix");
        this.projMatrixUniform = gl.getUniformLocation(shaderProgram, "projMatrix");
        this.normalMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");

        return shaderProgram;
    }

    initShader(code, type){
        const gl = this.gl;

        let shader = gl.createShader(type);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    setUpMatrixs(viewMatrix, projMatrix, modelMatrix){
        const gl = this.gl;
        gl.useProgram(this.shaderProgram);

        let normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix);
        gl.uniformMatrix4fv(this.projMatrixUniform, false, projMatrix);
        gl.uniformMatrix4fv(this.viewMatrixUniform, false, viewMatrix);
    }

    setUpBuffers(positionBuffer, uvsBuffer, normalBuffer, indexBuffer){
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    }

    setUpPositionBuffer(positionBuffer){
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertexPositionAttribute);
    }

    draw(indexBuffer, eyePos){
        const gl = this.gl;

        gl.drawElements(gl.TRIANGLE_STRIP, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    drawLines(vertex_buffer){
        const gl = this.gl;

        gl.drawArrays(gl.LINES, 0, vertex_buffer.numItems);
    }
}