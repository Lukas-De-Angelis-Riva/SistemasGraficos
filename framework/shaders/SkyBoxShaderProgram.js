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

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

varying vec3 vPosWorld;

void main(void) {
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(aVertexPosition, 1.0);

    vec3 p =(modelMatrix*vec4(aVertexPosition,1.0)).xyz;    //la posicion en coordenadas de mundo
    vPosWorld = vec3(p.x, -p.y, p.z);
}
`

var fragment_shader = `
precision highp float;

varying vec3 vPosWorld;

uniform samplerCube skybox;

void main(void) {
    vec3 color = textureCube(skybox, vPosWorld).xyz;
    gl_FragColor = vec4(color, 1.0);
}
`

export class SkyBoxShaderProgram {
    constructor(gl, src){
        this.gl = gl;

        this.texture = null;
        this.initFaces(src);

        let vertex = this.initShader(vertex_shader, gl.VERTEX_SHADER);
        let fragment = this.initShader(fragment_shader, gl.FRAGMENT_SHADER);

        this.shaderProgram = this.initShaderProgram(vertex, fragment);
    }

    initFaces(folder){
        const gl = this.gl;
        const faceInfos = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
                url: folder+'/px.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
                url: folder+'/nx.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
                url: folder+'/ny.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
                url: folder+'/py.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
                url: folder+'/pz.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
                url: folder+'/nz.png',
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

        // Matrixs
        this.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");
        this.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "viewMatrix");
        this.projMatrixUniform = gl.getUniformLocation(shaderProgram, "projMatrix");

        // Textures
        this.textureSamplerUniform = gl.getUniformLocation(shaderProgram, "skybox");

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        gl.uniform1i(this.textureSamplerUniform, 0);

        // Arguments
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

        gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(this.projMatrixUniform, false, projMatrix);
        gl.uniformMatrix4fv(this.viewMatrixUniform, false, viewMatrix);
    }

    setUpBuffers(positionBuffer, uvsBuffer, normalBuffer, tangentBuffer, binormalBuffer){
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }

    setUpPositionBuffer(positionBuffer){
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertexPositionAttribute);
    }

    draw(indexBuffer, eyePos){
        const gl = this.gl;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
//        gl.uniform1i(this.textureSamplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLE_STRIP, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    drawLines(vertex_buffer){
        const gl = this.gl;
        gl.drawArrays(gl.LINES, 0, vertex_buffer.numItems);
    }
}