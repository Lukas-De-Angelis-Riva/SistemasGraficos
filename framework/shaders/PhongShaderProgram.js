var mat4=glMatrix.mat4;

var vertex_shader = `
precision highp float;

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 normalMatrix;

varying vec3 vNormal;
varying vec3 vPosWorld;
varying highp vec2 vUv;

void main(void) {
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(aVertexPosition, 1.0);

    vPosWorld=(modelMatrix*vec4(aVertexPosition,1.0)).xyz;    //la posicion en coordenadas de mundo
    vNormal=(normalMatrix*vec4(aVertexNormal,1.0)).xyz;       //la normal en coordenadas de mundo

    vUv = aVertexUv;
}
`
var fragment_shader = `
precision highp float;
varying vec3 vNormal;
varying vec3 vPosWorld;

uniform sampler2D textureSampler;

// Assuming directional light.
uniform vec3 lightDir;
uniform vec3 lightColor;

uniform vec3 eyePos;

uniform float alpha;
uniform float specIntensity;

varying highp vec2 vUv;

void main(void) {
    vec3 backColor = texture2D(textureSampler, vUv).xyz;

    // Ambient
    vec3 ambient = backColor * vec3(0.3, 0.3, 0.3);

    // Diffuse
    vec3 l = -lightDir;
    vec3 n = vNormal;
    vec3 diffuse = backColor * max(dot(n, l), 0.0) * lightColor;

    // Specular
    vec3 v = normalize(eyePos - vPosWorld);
    vec3 r = reflect(lightDir, vNormal);
    vec3 specular = vec3(specIntensity, specIntensity, specIntensity) * pow(max(dot(r,v), 0.0), alpha) * lightColor;

    vec3 color = ambient + diffuse + specular;
    gl_FragColor = vec4(color,1.0);
}
`

export class PhongShaderProgram {
    constructor(gl, src, lightDir, lightColor, alpha, specIntensity=1){
        this.gl = gl;
        this.lightDir = lightDir;
        this.lightColor = lightColor;
        this.alpha = alpha;
        this.specIntensity = specIntensity;

        this.texture = null;
        this.initTexture(src);

        let vertex = this.initShader(vertex_shader, gl.VERTEX_SHADER);
        let fragment = this.initShader(fragment_shader, gl.FRAGMENT_SHADER);

        this.shaderProgram = this.initShaderProgram(vertex, fragment);
    }

    initTexture(src){
        const gl = this.gl;

        this.texture = gl.createTexture();

        this.texture.image = new Image();
        this.texture.image.onload = () => {
            // No se muy bien para que.
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 

            // Empezamos a hablar con this.texture
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture.image);

            gl.generateMipmap(gl.TEXTURE_2D);

            // Dejamos de hablar de this.texture
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        this.texture.image.src = src;
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
 
        this.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(this.vertexNormalAttribute);

        this.vertexUv = gl.getAttribLocation(shaderProgram, "aVertexUv");
        gl.enableVertexAttribArray(this.vertexUv);

        // Matrixs
        this.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");
        this.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "viewMatrix");
        this.projMatrixUniform = gl.getUniformLocation(shaderProgram, "projMatrix");
        this.normalMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");

        // Textures
        this.textureSamplerUniform = gl.getUniformLocation(shaderProgram, "textureSampler");

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.textureSamplerUniforme, 0);

        // Phong
        this.aLightColor = gl.getUniformLocation(shaderProgram, "lightColor");
        this.aLightDir = gl.getUniformLocation(shaderProgram, "lightDir")
        this.aEyePos = gl.getUniformLocation(shaderProgram, "eyePos");
        this.anAlpha = gl.getUniformLocation(shaderProgram, "alpha");
        this.anSpecIntensity = gl.getUniformLocation(shaderProgram, "specIntensity");
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

        gl.bindBuffer(gl.ARRAY_BUFFER, uvsBuffer);
        gl.vertexAttribPointer(this.vertexUv, uvsBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(this.vertexNormalAttribute, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

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

        gl.uniform3f(this.aLightColor, this.lightColor[0], this.lightColor[1], this.lightColor[2]);
        gl.uniform3f(this.aLightDir, this.lightDir[0], this.lightDir[1], this.lightDir[2]);
        gl.uniform3f(this.aEyePos, eyePos[0], eyePos[1], eyePos[2]);
        gl.uniform1f(this.anAlpha, this.alpha);
        gl.uniform1f(this.anSpecIntensity, this.specIntensity);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.textureSamplerUniforme, 0);

        gl.drawElements(gl.TRIANGLE_STRIP, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    drawLines(vertex_buffer){
        const gl = this.gl;
        gl.drawArrays(gl.LINES, 0, vertex_buffer.numItems);
    }
}