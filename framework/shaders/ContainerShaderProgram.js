import { PhongShaderProgram } from "./PhongShaderProgram.js";

var mat4=glMatrix.mat4;

function emptyBuffer(gl){
    let buff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    return buff;
}

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

uniform vec3 baseColor;

varying highp vec2 vUv;

void main(void) {
    vec3 backColor = texture2D(textureSampler, vUv).xyz * baseColor;

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

export class ContainerShaderProgram extends PhongShaderProgram {
    constructor(gl, src, lightDir, lightColor, alpha, specIntensity=1){
        super(gl, src, lightDir, lightColor, alpha, specIntensity);
        this.color = [1.0, 1.0, 1.0];

        this.texture = null;
        this.initTexture(src);

        let vertex = super.initShader(vertex_shader, gl.VERTEX_SHADER);
        let fragment = super.initShader(fragment_shader, gl.FRAGMENT_SHADER);

        this.shaderProgram = this.initShaderProgram(vertex, fragment);
    }

    initTexture(src){
        const gl = this.gl;

        this.texture = gl.createTexture();

        this.texture.image = new Image();
        this.texture.image.onload = () => {
            console.log("Uploading: ", src);
            // No se muy bien para que.
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 

            // Empezamos a hablar con this.texture
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture.image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
            // Dejamos de hablar de this.texture
            gl.bindTexture(gl.TEXTURE_2D, null);
            console.log("Successfully upload: ", src);
        }
        this.texture.image.src = src;
    }

    initShaderProgram(vertex, fragment){
        let shaderProgram = super.initShaderProgram(vertex, fragment);
        this.aColor = this.gl.getUniformLocation(shaderProgram, "baseColor");

        return shaderProgram;
    }


    draw(indexBuffer, eyePos, color){
        this.gl.uniform3f(this.aColor, color[0], color[1], color[2]);
        super.draw(indexBuffer, eyePos);
    }
}