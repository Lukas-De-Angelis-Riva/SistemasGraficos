import { Object3D } from "./Object3D.js";

var mat4=glMatrix.mat4;

export class System extends Object3D {
    constructor(gl) {
        super(gl, 0, 0);
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

    initBuffers() {}

    render(shaderProgram, parentMatrix=null, showNormals = false) {
        const gl = this.gl;
        if(!parentMatrix)
            parentMatrix = mat4.identity(mat4.create());

        let m = mat4.create();
        mat4.multiply(m, parentMatrix, this.modelMatrix);
        
        this.childs.forEach((o, i) => o.render(shaderProgram, m, showNormals));
    }

    renderNormal(shaderProgram){}
}