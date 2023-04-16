/*

    Tareas:
    ------

    1) Modificar a función "generarSuperficie" para que tenga en cuenta los parametros filas y columnas al llenar el indexBuffer
       Con esta modificación deberían poder generarse planos de N filas por M columnas

    2) Modificar la funcion "dibujarMalla" para que use la primitiva "triangle_strip"

    3) Crear nuevos tipos funciones constructoras de superficies

        3a) Crear la función constructora "Esfera" que reciba como parámetro el radio

        3b) Crear la función constructora "TuboSenoidal" que reciba como parámetro la amplitud de onda, longitud de onda, radio del tubo y altura.
        (Ver imagenes JPG adjuntas)
        
        
    Entrega:
    -------

    - Agregar una variable global que permita elegir facilmente que tipo de primitiva se desea visualizar [plano,esfera,tubosenoidal]
    
*/


var superficie3D;
var mallaDeTriangulos;

var filas=30;
var columnas=30;

function crearGeometria(){
    if(geometria == "plano"){
        var superficie3D = new Plano(3, 3);
    }else if(geometria ==  "esfera"){
        var superficie3D = new Esfera(2);
    }else if(geometria == "tubo") {
        var superficie3D = new TuboSenoidal();
    }
    mallaDeTriangulos=generarSuperficie(superficie3D,filas,columnas);    
}

function dibujarGeometria(){
    dibujarMalla(mallaDeTriangulos);
}

function TuboSenoidal(c=5, h=2.5, Amax=1, Amin=0.5){
    // u por c/columna; v por c/fila
    this.getPosicion=function(u,v){
        let A = (Amax-Amin)/2 * Math.cos(2*c*Math.PI*v) + (Amax+Amin)/2;

        let x=A*Math.cos(2*Math.PI*u);
        let z=A*Math.sin(2*Math.PI*u);
        let y = h*(0.5-v);
        return [x,y,z];
    }

    this.getNormal=function(u,v){
        let a = (Amax-Amin)/2;
        let b = 2*c*Math.PI;
        let A = a * Math.cos(b*v) + (Amax+Amin)/2;
        let dA = -a*b*Math.sin(b*v);
        let d = 2*Math.PI;
    
        let xv = h*d*A*Math.cos(d*u);
        let yv = A*d*dA;
        let zv = h*d*A*Math.sin(d*u);

        return [xv,yv,zv];
    }

    this.getCoordenadasTextura=function(u,v){
        return [0.5, 0];
    }
}

function Esfera(radio){
    // u por c/columna; v por c/fila
    this.getPosicion=function(u,v){
        let phi = 2*u*Math.PI;
        let theta = v*Math.PI;

        var x = radio*Math.sin(theta)*Math.cos(phi);
        var z = radio*Math.sin(theta)*Math.sin(phi);
        var y = radio*Math.cos(theta);
        return [x,y,z];
    }

    this.getNormal=function(u,v){
        let phi = 2*u*Math.PI;
        let theta = v*Math.PI;

        let xv=Math.sin(theta)*Math.cos(phi);
        let zv=Math.sin(theta)*Math.sin(phi);
        let yv=Math.cos(theta);
        return [xv,yv,zv];
    }

    this.getCoordenadasTextura=function(u,v){
        return [u,v];
    }
}

function Plano(ancho,largo){

    this.getPosicion=function(u,v){

        var x=(u-0.5)*ancho;
        var z=(v-0.5)*largo;
        return [x,0,z];
    }

    this.getNormal=function(u,v){
        return [0,1,0];
    }

    this.getCoordenadasTextura=function(u,v){
        return [u,v];
    }
}




function generarSuperficie(superficie,filas,columnas){
    
    positionBuffer = [];
    normalBuffer = [];
    uvBuffer = [];

    for (var i=0; i <= filas; i++) {
        for (var j=0; j <= columnas; j++) {

            var u=j/columnas;
            var v=i/filas;

            var pos=superficie.getPosicion(u,v);

            positionBuffer.push(pos[0]);
            positionBuffer.push(pos[1]);
            positionBuffer.push(pos[2]);

            var nrm=superficie.getNormal(u,v);

            normalBuffer.push(nrm[0]);
            normalBuffer.push(nrm[1]);
            normalBuffer.push(nrm[2]);

            var uvs=superficie.getCoordenadasTextura(u,v);

            uvBuffer.push(uvs[0]);
            uvBuffer.push(uvs[1]);

        }
    }

    // Buffer de indices de los triángulos
    
    indexBuffer=[];
    for (i=0; i < filas; i++) {
        for (j=0; j <= columnas; j++) {
            let a = i*(columnas+1) + j;         ///  a --- b
            let b = i*(columnas+1) + j + 1;     ///  |  /  |
            let c = (i+1)*(columnas+1) + j;     ///  c --- d
            indexBuffer.push(a);
            indexBuffer.push(c);
        }
        if(i<filas-1){
            indexBuffer.push((i+1)*(columnas+1)+columnas)
            indexBuffer.push((i+1)*(columnas+1))
        }
    }

    console.info(indexBuffer);
    // Creación e Inicialización de los buffers

    webgl_position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionBuffer), gl.STATIC_DRAW);
    webgl_position_buffer.itemSize = 3;
    webgl_position_buffer.numItems = positionBuffer.length / 3;

    webgl_normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalBuffer), gl.STATIC_DRAW);
    webgl_normal_buffer.itemSize = 3;
    webgl_normal_buffer.numItems = normalBuffer.length / 3;

    webgl_uvs_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_uvs_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvBuffer), gl.STATIC_DRAW);
    webgl_uvs_buffer.itemSize = 2;
    webgl_uvs_buffer.numItems = uvBuffer.length / 2;


    webgl_index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuffer), gl.STATIC_DRAW);
    webgl_index_buffer.itemSize = 1;
    webgl_index_buffer.numItems = indexBuffer.length;

    return {
        webgl_position_buffer,
        webgl_normal_buffer,
        webgl_uvs_buffer,
        webgl_index_buffer
    }
}

function dibujarMalla(mallaDeTriangulos){
    
    // Se configuran los buffers que alimentaron el pipeline
    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_position_buffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mallaDeTriangulos.webgl_position_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_uvs_buffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mallaDeTriangulos.webgl_uvs_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_normal_buffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mallaDeTriangulos.webgl_normal_buffer.itemSize, gl.FLOAT, false, 0, 0);
       
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mallaDeTriangulos.webgl_index_buffer);

    if(modo=="points") {
        gl.uniform1i(shaderProgram.useLightingUniform,(lighting=="true"));
        gl.drawElements(gl.POINTS, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    } else if (modo=="edges") {
        gl.uniform1i(shaderProgram.useLightingUniform,(lighting=="true"));
        gl.drawElements(gl.TRIANGLE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
        gl.uniform1i(shaderProgram.useLightingUniform,false);
        gl.drawElements(gl.LINE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }else if (modo=="wireframe") {
        gl.uniform1i(shaderProgram.useLightingUniform,false);
        gl.drawElements(gl.LINE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }else if (modo=="smooth") {
        gl.uniform1i(shaderProgram.useLightingUniform,(lighting=="true"));
        gl.drawElements(gl.TRIANGLE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    } 
}

