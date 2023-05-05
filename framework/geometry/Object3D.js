export class Object3D {
    constructor(gl, rows, columns) {
        this.gl = gl;

        this.rows = rows;
        this.columns = columns;

        this.webgl_position_buffer = null;
        this.webgl_normal_buffer = null;
        this.webgl_uvs_buffer = null;
        this.webgl_index_buffer = null;
    }

    getPosition(u, v) {
        return [0, 0, 0]
    }

    getNormal(u, v) {
        return(0, 0, 0)
    }
    
    getTextureCordenates(u, v) {
        return(0, 0)
    }

    initBuffers() {
        const gl = this.gl;
        const rows = this.rows;
        const columns = this.columns;

        let positionBuffer = [];
        let normalBuffer = [];
        let uvBuffer = [];

        for (var i=0; i <= rows; i++) {
            for (var j=0; j <= columns; j++) {

                var u=j/columns;
                var v=i/rows;

                var pos=this.getPosition(u,v);

                positionBuffer.push(pos[0]);
                positionBuffer.push(pos[1]);
                positionBuffer.push(pos[2]);

                var nrm=this.getNormal(u,v);

                normalBuffer.push(nrm[0]);
                normalBuffer.push(nrm[1]);
                normalBuffer.push(nrm[2]);

                var uvs=this.getTextureCordenates(u,v);

                uvBuffer.push(uvs[0]);
                uvBuffer.push(uvs[1]);
            }
        }

        // Index buffers of triangles

        let indexBuffer=[];
        for (i=0; i < rows; i++) {
            for (j=0; j <= columns; j++) {
                let a = i*(columns+1) + j;         ///  a --- b
                let b = i*(columns+1) + j + 1;     ///  |  /  |
                let c = (i+1)*(columns+1) + j;     ///  c --- d
                indexBuffer.push(a);
                indexBuffer.push(c);
            }
            if(i<rows-1){
                indexBuffer.push((i+1)*(columns+1)+columns)
                indexBuffer.push((i+1)*(columns+1))
            }
        }

        this.webgl_position_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_position_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionBuffer), gl.STATIC_DRAW);
        this.webgl_position_buffer.itemSize = 3;
        this.webgl_position_buffer.numItems = positionBuffer.length / 3;

        this.webgl_normal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_normal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalBuffer), gl.STATIC_DRAW);
        this.webgl_normal_buffer.itemSize = 3;
        this.webgl_normal_buffer.numItems = normalBuffer.length / 3;

        this.webgl_uvs_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_uvs_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvBuffer), gl.STATIC_DRAW);
        this.webgl_uvs_buffer.itemSize = 2;
        this.webgl_uvs_buffer.numItems = uvBuffer.length / 2;


        this.webgl_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.webgl_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuffer), gl.STATIC_DRAW);
        this.webgl_index_buffer.itemSize = 1;
        this.webgl_index_buffer.numItems = indexBuffer.length;
    }

    render(shaderProgram, lighting) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_position_buffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.webgl_position_buffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_uvs_buffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.webgl_uvs_buffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_normal_buffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.webgl_normal_buffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.webgl_index_buffer);


        gl.uniform1i(shaderProgram.useLightingUniform,(lighting=="true"));
        gl.drawElements(gl.TRIANGLE_STRIP, this.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.uniform1i(shaderProgram.useLightingUniform,false);
        gl.drawElements(gl.LINE_STRIP, this.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
}