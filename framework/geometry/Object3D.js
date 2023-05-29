var mat4=glMatrix.mat4;
var mat3=glMatrix.mat3;
var vec3=glMatrix.vec3;

export class Object3D {
    constructor(gl, rows, columns) {
        this.gl = gl;

        this.rows = rows;
        this.columns = columns;

        this.webgl_position_buffer = null;
        this.webgl_normal_buffer = null;
        this.webgl_uvs_buffer = null;
        this.webgl_index_buffer = null;

        this.positionBuffer = [];
        this.normalBuffer = [];
        this.uvBuffer = [];

        this.modelMatrix = mat4.identity(mat4.create());
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

        for (var i=0; i <= rows; i++) {
            for (var j=0; j <= columns; j++) {

                var u=j/columns;
                var v=i/rows;

                var pos=this.getPosition(u,v);

                this.positionBuffer.push(pos[0]);
                this.positionBuffer.push(pos[1]);
                this.positionBuffer.push(pos[2]);

                var nrm=this.getNormal(u,v);

                this.normalBuffer.push(nrm[0]);
                this.normalBuffer.push(nrm[1]);
                this.normalBuffer.push(nrm[2]);

                var uvs=this.getTextureCordenates(u,v);

                this.uvBuffer.push(uvs[0]);
                this.uvBuffer.push(uvs[1]);
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positionBuffer), gl.STATIC_DRAW);
        this.webgl_position_buffer.itemSize = 3;
        this.webgl_position_buffer.numItems = this.positionBuffer.length / 3;

        this.webgl_normal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_normal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalBuffer), gl.STATIC_DRAW);
        this.webgl_normal_buffer.itemSize = 3;
        this.webgl_normal_buffer.numItems = this.normalBuffer.length / 3;

        this.webgl_uvs_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_uvs_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvBuffer), gl.STATIC_DRAW);
        this.webgl_uvs_buffer.itemSize = 2;
        this.webgl_uvs_buffer.numItems = this.uvBuffer.length / 2;


        this.webgl_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.webgl_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuffer), gl.STATIC_DRAW);
        this.webgl_index_buffer.itemSize = 1;
        this.webgl_index_buffer.numItems = indexBuffer.length;
    }

    render(shaderProgram, parentMatrix=null) {
        const gl = this.gl;
        if(!parentMatrix)
            parentMatrix = mat4.identity(mat4.create());

        let m = mat4.create();
        mat4.multiply(m, parentMatrix, this.modelMatrix);

        let normalMatrix = mat4.create();
        mat4.invert(normalMatrix, m);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, m);
        gl.uniformMatrix4fv(shaderProgram.normalMatrixUniform, false, normalMatrix);


        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_position_buffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.webgl_position_buffer.itemSize, gl.FLOAT, false, 0, 0);

//        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_uvs_buffer);
//        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.webgl_uvs_buffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_normal_buffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.webgl_normal_buffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.webgl_index_buffer);

        gl.drawElements(gl.TRIANGLE_STRIP, this.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.drawElements(gl.LINE_STRIP, this.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    renderNormal(){
        const gl = this.gl;

        let normals = []

        console.log
        for(let i=0; i < this.positionBuffer.length;i +=3){
            var line = vec3.create()
            
            var normal_i = vec3.fromValues(
                this.normalBuffer[i]/50,
                this.normalBuffer[i+1]/50,
                this.normalBuffer[i+2]/50);
            var position_i = vec3.fromValues(
                this.positionBuffer[i],
                this.positionBuffer[i+1],
                this.positionBuffer[i+2]);

            vec3.add(line, position_i, normal_i);
        
            normals.push(this.positionBuffer[i]);
            normals.push(this.positionBuffer[i+1]);
            normals.push(this.positionBuffer[i+2]);

            normals.push(line[0]);
            normals.push(line[1]);
            normals.push(line[2]);
        }


        var vertex_buffer = gl.createBuffer( );
        gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( normals ), gl.STATIC_DRAW );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );

        var vertCode = 
            'attribute vec3 coordinates;' +

            'void main(void)' +

            '{' +

                ' gl_Position = vec4(coordinates, 1.0);' +

            '}';

        var vertShader = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShader, vertCode );

        gl.compileShader( vertShader );

        var fragCode = 
            'void main(void)' +
            '{' +
                ' gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);' +
            '}';

        var fragShader = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShader, fragCode );
        gl.compileShader( fragShader );

        var shaderProgram = gl.createProgram( );
        gl.attachShader( shaderProgram, vertShader );
        gl.attachShader( shaderProgram, fragShader );
        gl.linkProgram( shaderProgram );

        gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );

        var coord = gl.getAttribLocation( shaderProgram, "coordinates" );

        gl.vertexAttribPointer( coord, 3, gl.FLOAT, false, 0, 0 );

        gl.enableVertexAttribArray( coord );

        gl.drawArrays( gl.LINES, 0, normals.length/3 );
    }


    ///
    ///
    /// Operations
    ///
    ///

    ///
    /// Scaling
    ///
    scale(xs=1, ys=1, zs=1){
        let s = vec3.fromValues(xs, ys, zs);
        mat4.scale(this.modelMatrix, this.modelMatrix, s);
    }
    /// 
    hscale(s){
        this.scale(s,s,s);
    }

    ///
    /// Rotation
    ///
    rotate(rad, axis){
        mat4.rotate(this.modelMatrix, this.modelMatrix, rad, axis);
    }
    ///
    rotateX(rad){
        mat4.rotateX(this.modelMatrix, this.modelMatrix, rad);
    }
    ///
    rotateY(rad){
        mat4.rotateY(this.modelMatrix, this.modelMatrix, rad);
    }
    ///
    rotateZ(rad){
        mat4.rotateZ(this.modelMatrix, this.modelMatrix, rad);
    }

    ///
    /// Traslation
    ///
    translate(xt, yt, zt){
        let t = vec3.fromValues(xt, yt, zt);
        mat4.translate(this.modelMatrix, this.modelMatrix, t);
    }
}