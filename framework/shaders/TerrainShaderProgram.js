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
attribute vec3 aVertexTangent;
attribute vec3 aVertexBinormal;
attribute vec2 aVertexUv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 normalMatrix;

varying vec3 vPosWorld;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying highp vec2 vUv;

void main(void) {
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(aVertexPosition, 1.0);

    vPosWorld=(modelMatrix*vec4(aVertexPosition,1.0)).xyz;    //la posicion en coordenadas de mundo
    vNormal=(normalMatrix*vec4(aVertexNormal, 1.0)).xyz;       //la normal ""
    vTangent=(normalMatrix*vec4(aVertexTangent, 1.0)).xyz;    //la tangen ""
    vBinormal=(normalMatrix*vec4(aVertexBinormal, 1.0)).xyz;  //la binorm ""

    vUv = aVertexUv;
}
`
var fragment_shader = `
precision highp float;

varying vec3 vPosWorld;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying highp vec2 vUv;

uniform sampler2D grassSampler;
uniform sampler2D rocksSampler;
uniform sampler2D dirtSampler;
uniform sampler2D rocksNormalMapSampler;

// Assuming directional light.
uniform vec3 lightDir;
uniform vec3 lightColor;

uniform vec3 eyePos;

uniform float alpha;
uniform float specIntensity;

/* ************************************************************************* */
//                             Perlin Noise                                  //
/* ************************************************************************* */                

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
/* ************************************************************************* */
//                                  End                                      //
/* ************************************************************************* */                

/*
 * uniform sampler2D grassSampler;
 * uniform sampler2D rocksSampler;
 * uniform sampler2D dirtSampler;
 * uniform sampler2D rocksNormalMapSampler;
 */

void main(void) {
    // Re-sampling del pasto, para evitar patron repetitivo
    vec3 pasto1=texture2D(grassSampler,vUv*2.0).xyz;
    vec3 pasto2=texture2D(grassSampler,vUv*1.38).xyz;
    vec3 pasto3=texture2D(grassSampler,vUv*1.05).xyz;

    vec3 roca=texture2D(rocksSampler, vUv).xyz;

    vec3 arena=texture2D(dirtSampler, vUv).xyz;

    // Colores mezclados
    vec3 pasto=mix(mix(pasto1,pasto2,0.5),pasto3,0.33);

    float a = (1.0 - smoothstep(-0.5, 0.25, vPosWorld.y));
    float c = smoothstep(-0.5, -1.0, vPosWorld.y);
    float d = 1.0-smoothstep(-1.0, -2.0, vPosWorld.y);
    float b = (1.0 - smoothstep(-1.25, -0.5, vPosWorld.y))-cnoise(vPosWorld*4.)*a*c*d;

    vec3 backColor = mix(mix(pasto, roca, a), arena, b);

    vec3 localNormal = 2.0 * texture2D(rocksNormalMapSampler, vUv).rgb - 1.0;
    vec3 normal_ = normalize(mat3(vTangent, vBinormal, vNormal) * localNormal);

    vec3 normal = mix(mix(vNormal, normal_, a), vNormal, b);

    // Ambient
    vec3 ambient = backColor * vec3(0.3, 0.3, 0.3);

    // Diffuse
    vec3 l = -lightDir;
    vec3 n = normal;
    vec3 diffuse = backColor * max(dot(n, l), 0.0) * lightColor / 1.2;

    // Specular
    vec3 v = normalize(eyePos - vPosWorld);
    vec3 r = reflect(lightDir, normal);
    vec3 specular_ = vec3(specIntensity, specIntensity, specIntensity) * pow(max(dot(r,v), 0.0), alpha) * lightColor;
    vec3 specular = mix(vec3(.0, .0, .0), specular_, a);

    vec3 color = ambient + diffuse + specular;
    gl_FragColor = vec4(color, 1.0);
}
`

export class TerrainShaderProgram {
    constructor(gl, grassSrc, rocksSrc, dirtSrc, rocksNormalMap, lightDir, lightColor, alpha, specIntensity=1){
        this.gl = gl;
        this.lightDir = lightDir;
        this.lightColor = lightColor;
        this.alpha = alpha;
        this.specIntensity = specIntensity;

        this.grassTexture = this.initTexture(grassSrc);
        this.rockTexture = this.initTexture(rocksSrc);
        this.dirtTexture = this.initTexture(dirtSrc);
        this.normalMap = this.initTexture(rocksNormalMap);

        let vertex = this.initShader(vertex_shader, gl.VERTEX_SHADER);
        let fragment = this.initShader(fragment_shader, gl.FRAGMENT_SHADER);

        this.shaderProgram = this.initShaderProgram(vertex, fragment);
    }

    initTexture(src){
        const gl = this.gl;

        var texture = gl.createTexture();

        texture.image = new Image();
        texture.image.onload = () => {
            console.log("Cargando imagen");
            // No se muy bien para que.
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 

            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

            gl.generateMipmap(gl.TEXTURE_2D);

            gl.bindTexture(gl.TEXTURE_2D, null);
            console.log("Cargada imagen");
        }
        texture.image.src = src;
        return texture;
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
        gl.bindBuffer(gl.ARRAY_BUFFER, emptyBuffer(gl));
        gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        this.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(this.vertexNormalAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, emptyBuffer(gl));
        gl.vertexAttribPointer(this.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

        this.vertexTangentAttribute = gl.getAttribLocation(shaderProgram, "aVertexTangent");
        gl.enableVertexAttribArray(this.vertexTangentAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, emptyBuffer(gl));
        gl.vertexAttribPointer(this.vertexTangentAttribute, 3, gl.FLOAT, false, 0, 0);

        this.vertexBinormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexBinormal");
        gl.enableVertexAttribArray(this.vertexBinormalAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, emptyBuffer(gl));
        gl.vertexAttribPointer(this.vertexBinormalAttribute, 3, gl.FLOAT, false, 0, 0);

        this.vertexUv = gl.getAttribLocation(shaderProgram, "aVertexUv");
        gl.enableVertexAttribArray(this.vertexUv);
        gl.bindBuffer(gl.ARRAY_BUFFER, emptyBuffer(gl));
        gl.vertexAttribPointer(this.vertexUv, 2, gl.FLOAT, false, 0, 0);

        // Matrixs
        this.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");
        this.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "viewMatrix");
        this.projMatrixUniform = gl.getUniformLocation(shaderProgram, "projMatrix");
        this.normalMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");

        // Textures
        this.grassSamplerUniform = gl.getUniformLocation(shaderProgram, "grassSampler");
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.grassTexture);
        gl.uniform1i(this.grassSamplerUniform, 0);

        this.rocksSamplerUniform = gl.getUniformLocation(shaderProgram, "rocksSampler");
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.rockTexture);
        gl.uniform1i(this.rocksSamplerUniform, 1);

        this.dirtSamplerUniform = gl.getUniformLocation(shaderProgram, "dirtSampler");
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.dirtTexture);
        gl.uniform1i(this.dirtSamplerUniform, 2);

        this.rocksNormalMapSamplerUniform = gl.getUniformLocation(shaderProgram, "rocksNormalMapSampler");
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.normalMap);
        gl.uniform1i(this.rocksNormalMapSamplerUniform, 3);

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

    setUpBuffers(positionBuffer, uvsBuffer, normalBuffer, tangentBuffer, binormalBuffer){
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, uvsBuffer);
        gl.vertexAttribPointer(this.vertexUv, uvsBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(this.vertexNormalAttribute, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
        gl.vertexAttribPointer(this.vertexTangentAttribute, tangentBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, binormalBuffer);
        gl.vertexAttribPointer(this.vertexBinormalAttribute, binormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
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
        gl.bindTexture(gl.TEXTURE_2D, this.grassTexture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.rockTexture);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.dirtTexture);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.normalMap);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLE_STRIP, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    drawLines(vertex_buffer){
        const gl = this.gl;
        gl.drawArrays(gl.LINES, 0, vertex_buffer.numItems);
    }
}