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

uniform samplerCube reflectMapSampler;
uniform sampler2D normalMapSampler;

uniform vec3 eyePos;
uniform float alpha;

void main(void) {
    vec3 localNormal = 2.0 * texture2D(normalMapSampler, vUv).rgb - 1.0;
    vec3 normal = normalize(mat3(vTangent, vBinormal, vNormal) * localNormal);

    // no normal map texture
    // normal = vNormal;

    vec3 I = normalize(vPosWorld - eyePos).xyz;
    vec3 R = reflect(I, normalize(normal));
    vec3 Rinv = vec3(R.x, -R.y, R.z);

    vec3 color = textureCube(reflectMapSampler, Rinv).rgb;
    gl_FragColor = vec4(color, 1.0);
}
`

export class WaterShaderProgram {
    constructor(gl, srcReflection, srcNormalMap, alpha){
        this.gl = gl;
        this.alpha = alpha;

        this.texture = null;
        this.initReflectMap(srcReflection);

        this.normalMap = null;
        this.initNormalMap(srcNormalMap);

        let vertex = this.initShader(vertex_shader, gl.VERTEX_SHADER);
        let fragment = this.initShader(fragment_shader, gl.FRAGMENT_SHADER);

        this.shaderProgram = this.initShaderProgram(vertex, fragment);
    }

    initReflectMap(src){
        const gl = this.gl;
        const faceInfos = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
                url: src+'/px.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
                url: src+'/nx.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
                url: src+'/ny.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
                url: src+'/py.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
                url: src+'/pz.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
                url: src+'/nz.png',
            },
        ];
        
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        faceInfos.forEach((faceInfo) => {
            const {target, url} = faceInfo;
            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 1024;
            const height = 1024;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

            const image = new Image();
            image.onload = () => {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                // Now that the image has loaded upload it to the texture.
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
                gl.texImage2D(target, level, internalFormat, format, type, image);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.bindTexture(gl.TEXTURE_2D, null);
                console.log("Cargada la textura [\"", url, "\"]")
            }
            image.src = url;
        });
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    initNormalMap(src){
        const gl = this.gl;

        this.normalMap = gl.createTexture();

        this.normalMap.image = new Image();
        this.normalMap.image.onload = () => {
            console.log("Cargando imagen de normales");
            // No se muy bien para que.
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 

            // Empezamos a hablar con this.texture
            gl.bindTexture(gl.TEXTURE_2D, this.normalMap);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.normalMap.image);

            gl.generateMipmap(gl.TEXTURE_2D);

            // Dejamos de hablar de this.texture
            gl.bindTexture(gl.TEXTURE_2D, null);
            console.log("Cargada imagen de normales");
        }
        this.normalMap.image.src = src;
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
        this.textureSamplerUniform = gl.getUniformLocation(shaderProgram, "reflectMapSampler");
        this.normalMapSamplerUniform = gl.getUniformLocation(shaderProgram, "normalMapSampler");

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        gl.uniform1i(this.textureSamplerUniform, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normalMap);
        gl.uniform1i(this.normalMapSamplerUniform, 1);

        // Arguments
        this.aEyePos = gl.getUniformLocation(shaderProgram, "eyePos");
        this.anAlpha = gl.getUniformLocation(shaderProgram, "alpha");
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

        gl.uniform3f(this.aEyePos, eyePos[0], eyePos[1], eyePos[2]);
        gl.uniform1f(this.anAlpha, this.alpha);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
//        gl.uniform1i(this.textureSamplerUniform, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normalMap);
//        gl.uniform1i(this.normalMapSamplerUniform, 1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLE_STRIP, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    drawLines(vertex_buffer){
        const gl = this.gl;
        gl.drawArrays(gl.LINES, 0, vertex_buffer.numItems);
    }
}