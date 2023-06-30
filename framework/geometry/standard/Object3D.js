import { SimpleShaderProgram } from "../../shaders/SimpleShaderProgram.js";

var mat4=glMatrix.mat4;
var mat3=glMatrix.mat3;
var vec3=glMatrix.vec3;
var vec4=glMatrix.vec4;

export class Object3D {
    constructor(gl, rows, columns, u_scale = 1, v_scale = 1) {
        this.gl = gl;

        this.rows = rows;
        this.columns = columns;

        this.webgl_position_buffer = null;
        this.webgl_normal_buffer = null;
        this.webgl_uvs_buffer = null;
        this.webgl_index_buffer = null;

        this.positionBuffer = [];
        this.normalBuffer = [];
        this.tangentBuffer = [];
        this.binormalBuffer = [];
        this.uvBuffer = [];

        this.modelMatrix = mat4.identity(mat4.create());
        this.modelMatrix_withoutScaling = mat4.identity(mat4.create());

        this.color=[0.7, 0.7, 0.7];
        this.childs = [];

        this.u_scale = u_scale;
        this.v_scale = v_scale;

        this.shaderProgram = new SimpleShaderProgram(this.gl);
    }

    /// Override
    getPosition(u, v) {
        return [0, 0, 0]
    }

    /// Override
    getNormal(u, v) {
        return(0, 0, 0)
    }

    /// Override
    getTangent(u, v){
        return(0, 0, 0)
    }

    /// Override
    getBinormal(u, v){
        return(0, 0, 0)
    }

    /// Override
    getTextureCordenates(u, v) {
        return(0, 0)
    }

    /// Override
    setColor(color) {
        this.color = color;
    }

    attach(shaderProgram){
        this.shaderProgram = shaderProgram;
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

                var tng=this.getTangent(u,v);
                this.tangentBuffer.push(tng[0]);
                this.tangentBuffer.push(tng[1]);
                this.tangentBuffer.push(tng[2]);

                var bin=this.getBinormal(u,v);
                this.binormalBuffer.push(bin[0]);
                this.binormalBuffer.push(bin[1]);
                this.binormalBuffer.push(bin[2]);

                var uvs=this.getTextureCordenates(u,v);

                this.uvBuffer.push(uvs[0]*this.u_scale);
                this.uvBuffer.push(uvs[1]*this.v_scale);
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

        this.webgl_tangent_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_tangent_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangentBuffer), gl.STATIC_DRAW);
        this.webgl_tangent_buffer.itemSize = 3;
        this.webgl_tangent_buffer.numItems = this.tangentBuffer.length / 3;

        this.webgl_binormal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.webgl_binormal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.binormalBuffer), gl.STATIC_DRAW);
        this.webgl_binormal_buffer.itemSize = 3;
        this.webgl_binormal_buffer.numItems = this.binormalBuffer.length / 3;

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

    render(viewMatrix, projMatrix, eyePos, parentMatrix=null, showNormals=false) {
        if(!this.shaderProgram)
            throw new Error("No shader-program attached");

        if(!parentMatrix)
            parentMatrix = mat4.identity(mat4.create());

        let m = mat4.create();
        mat4.multiply(m, parentMatrix, this.modelMatrix);

        this.shaderProgram.setUpMatrixs(viewMatrix, projMatrix, m);

        this.shaderProgram.setUpBuffers(
            this.webgl_position_buffer,
            this.webgl_uvs_buffer,
            this.webgl_normal_buffer,
            this.webgl_tangent_buffer,
            this.webgl_binormal_buffer);

        this.shaderProgram.draw(this.webgl_index_buffer, eyePos, this.color);


        // Activar o desactivar si se quieren (o no) ver las normales
        if (showNormals){
            this.renderNormal();
        }
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        this.childs.forEach((o, i) => o.render(viewMatrix, projMatrix, eyePos, m, showNormals));
    }

    renderNormal(){
        const gl = this.gl;

        let normals = []

        for(let i=0; i < this.positionBuffer.length;i +=3){
            let line = vec3.create()
            
            let normal_i = vec3.fromValues(
                this.normalBuffer[i]/5,
                this.normalBuffer[i+1]/5,
                this.normalBuffer[i+2]/5);
            let position_i = vec3.fromValues(
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

        // drawing the normals

        var vertex_buffer = gl.createBuffer( );
        gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( normals ), gl.STATIC_DRAW );
        vertex_buffer.itemSize = 3;
        vertex_buffer.numItems = normals.length/3;

        this.shaderProgram.setUpPositionBuffer(vertex_buffer);
        this.shaderProgram.drawLines(vertex_buffer);
    }

    addChild(anObject3D){
        this.childs.push(anObject3D);
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
        mat4.rotate(this.modelMatrix_withoutScaling, this.modelMatrix_withoutScaling, rad, axis);
    }
    ///
    rotateX(rad){
        mat4.rotateX(this.modelMatrix, this.modelMatrix, rad);
        mat4.rotateX(this.modelMatrix_withoutScaling, this.modelMatrix_withoutScaling, rad);
    }
    ///
    rotateY(rad){
        mat4.rotateY(this.modelMatrix, this.modelMatrix, rad);
        mat4.rotateY(this.modelMatrix_withoutScaling, this.modelMatrix_withoutScaling, rad);
    }
    ///
    rotateZ(rad){
        mat4.rotateZ(this.modelMatrix, this.modelMatrix, rad);
        mat4.rotateZ(this.modelMatrix_withoutScaling, this.modelMatrix_withoutScaling, rad);
    }

    ///
    /// Traslation
    ///
    translate(xt, yt, zt){
        let t = vec3.fromValues(xt, yt, zt);
        mat4.translate(this.modelMatrix, this.modelMatrix, t);
        mat4.translate(this.modelMatrix_withoutScaling, this.modelMatrix_withoutScaling, t);
    }

    xyz(){
        const m = this.modelMatrix;
        return [m[12], m[13], m[14]];
    }

    relative(xyz){
        const m = this.modelMatrix;
        let transform = vec4.create();
        let xyz1 = vec4.fromValues(xyz[0], xyz[1], xyz[2], 1.0);

        vec4.transformMat4(transform, xyz1, m);
    
        return [transform[0], transform[1], transform[2]];
    }
}