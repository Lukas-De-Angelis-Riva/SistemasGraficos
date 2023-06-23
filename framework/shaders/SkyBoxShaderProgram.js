import { TexturedShaderProgram } from "./TexturedShaderProgram.js";

export class SkyBoxShaderProgram extends TexturedShaderProgram {
    constructor(gl, src){
        super(gl, src);
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

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Dejamos de hablar de this.texture
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        this.texture.image.src = src;
    }
}