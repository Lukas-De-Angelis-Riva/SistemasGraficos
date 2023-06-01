import { Plane } from './geometry/Plane.js';
import { Camera } from './Camera.js';
import { Bridge, Ship } from './geometry/Bridge.js';
import { Cube } from './geometry/Cube.js';

var time=0;

var gl;
var mat4=glMatrix.mat4;
var mat3=glMatrix.mat3;
var vec3=glMatrix.vec3;
    
var $canvas=$("#myCanvas");
var aspect=$canvas.width()/$canvas.height();

var app={
    distanciaCamara:3,
    alturaCamara:2,
    velocidadAngular:0.15,
};

var vertexShaderFile="vertex-shader.glsl";
var vertexShaderSource;
var fragmentShaderSource;
var shaderProgram;

var matrizProyeccion = mat4.create();
var parent = mat4.identity(mat4.create());

var camera;

var objetos3D = [];

function loadShaders(){

    $.when(loadVS(), loadFS()).done(function(res1,res2){
        //this code is executed when all ajax calls are done
        webGLStart();
    });

    function loadVS() {
        return  $.ajax({
            url: "shaders/"+vertexShaderFile,
            success: function(result){
                vertexShaderSource=result;
            }
        });
    }

    function loadFS() {
        return  $.ajax({
            url: "shaders/fragment-shader.glsl",
            success: function(result){
                fragmentShaderSource=result;
            }
        });
    }
}

function getShader(gl,code,type) {

    var shader;

    if (type == "fragment") 
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    else // "vertex"
        shader = gl.createShader(gl.VERTEX_SHADER);
    
    gl.shaderSource(shader, code);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }    
    return shader;
}

function initGL(canvas) {

    try {
        gl = canvas.getContext("webgl");
        gl.canvas.width=$canvas.width();
        gl.canvas.height=$canvas.height();
    } catch (e) {
        console.error(e);
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function onResize(){
    gl.canvas.width=$canvas.width();
    gl.canvas.height=$canvas.height();
    aspect=$canvas.width()/$canvas.height();
}
      
function drawScene() {

    // Se configura el viewport dentro del "canvas". 
    // En este caso se utiliza toda el área disponible
    gl.viewport(0, 0, $canvas.width(), $canvas.height());
    
    // Se habilita el color de borrado para la pantalla (Color Buffer) y otros buffers
    gl.clearColor(0.2,0.2,0.2,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Se configura la matriz de proyección
    mat4.identity(matrizProyeccion);
    mat4.perspective(matrizProyeccion, mouse.zoom, aspect, 0.1, 100.0);
    mat4.scale(matrizProyeccion,matrizProyeccion,[1,-1,1]); // parche para hacer un flip de Y, parece haber un bug en glmatrix

    // Definimos la ubicación de la camara
    
    camera.look(shaderProgram);

    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mat4.identity(mat4.create()));
    gl.uniformMatrix4fv(shaderProgram.projMatrixUniform, false, matrizProyeccion);

    dibujarGeometria();
}

function tick() {
    requestAnimFrame(tick);
    time+=1/60;

    if(mouse.prev_x != mouse.x){
        let deltaX =-(mouse.new_x - mouse.prev_x);
        mouse.prev_x = mouse.new_x;
        camera.turnSide(deltaX * 2 * Math.PI * 1/5000);
    }
    if(mouse.prev_y != mouse.y){
        let deltaY = -(mouse.new_y - mouse.prev_y);
        mouse.prev_y = mouse.new_y;
        camera.tunrUp(deltaY * 2 * Math.PI * 1/5000);
    }

    camera.move(movement);
//    mat4.rotate(parent, parent,0.03*app.velocidadAngular, [0, 1, 0]);
 
    drawScene();
}

function crearGeometria(){
    let plano = new Plane(gl, 100, 100);
    plano.translate(0, -4, 0);
    objetos3D.push(plano);
    let bridge = new Bridge(gl);
    objetos3D.push(bridge);

    let ship = new Ship(gl, 4);
    ship.rotateY(Math.PI/2);
    objetos3D.push(ship);
}

function dibujarGeometria(){
    objetos3D.forEach((o, i) => {
        o.render(shaderProgram, parent);
    })
}

function initMenu(){
    var gui = new dat.GUI();
    gui.add(app, "distanciaCamara",0.01,5).step(0.01);
    gui.add(app, "alturaCamara",-4,4).step(0.01);
    gui.add(app, "velocidadAngular",0, 1).step(0.01);
}

function initShaders() {

    var fragmentShader = getShader(gl, vertexShaderSource, "vertex");
    var vertexShader = getShader(gl, fragmentShaderSource, "fragment");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");
    shaderProgram.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "viewMatrix");
    shaderProgram.projMatrixUniform = gl.getUniformLocation(shaderProgram, "projMatrix");
    shaderProgram.normalMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");
}


function webGLStart() {
    var canvas = document.getElementById("myCanvas");
    initGL(canvas);
    
    initShaders();

    camera = new Camera(gl, 16, 13, 24);

    crearGeometria();

    gl.clearColor(66.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    $(window).on("resize",onResize);
    initMenu();
    tick();
}

var mouse = new Object();
mouse.isDown = false;
mouse.prev_x = 0;
mouse.prev_y = 0;
mouse.new_x = 0;
mouse.new_y = 0;
mouse.zoom = 30;

var movement = new Object();
movement.left = false;
movement.back = false;
movement.front = false;
movement.right = false;
movement.up = false;
movement.down = false;

movement.turnup = false;
movement.turndown = false;
movement.turnleft = false;
movement.turnright = false;

document.addEventListener('keydown', function(event) {
    if(event.key == 'a') movement.left = true;
    if(event.key == 's') movement.back = true;
    if(event.key == 'd') movement.right = true;
    if(event.key == 'w') movement.front = true;
    if(event.key == ' ') movement.up = true;
    if(event.key == 'z') movement.down = true;

    if(event.key == 'ArrowRight') movement.turnright = true;
    if(event.key == 'ArrowLeft') movement.turnleft = true;
    if(event.key == 'ArrowUp') movement.turnup = true;
    if(event.key == 'ArrowDown') movement.turndown = true;
});

document.addEventListener('keyup', function(event) {
    if(event.key == 'a') movement.left = false;
    if(event.key == 's') movement.back = false;
    if(event.key == 'd') movement.right = false;
    if(event.key == 'w') movement.front = false;
    if(event.key == ' ') movement.up = false;
    if(event.key == 'z') movement.down = false;

    if(event.key == 'ArrowRight') movement.turnright = false;
    if(event.key == 'ArrowLeft') movement.turnleft = false;
    if(event.key == 'ArrowUp') movement.turnup = false;
    if(event.key == 'ArrowDown') movement.turndown = false;

    if(event.key == 'x') console.log(camera);
});

document.addEventListener('mousedown', function(event) {
    mouse.isDown = true;
});

document.addEventListener('mouseup', function(event) {
    mouse.isDown = false;
});

document.addEventListener('mousemove', function(event) {
    if (mouse.isDown){
        mouse.new_x = event.clientX || event.pageX;
        mouse.new_y = event.clientY || event.pageY;
    } else {
        mouse.new_x = event.clientX || event.pageX;
        mouse.new_y = event.clientY || event.pageY;    
        mouse.prev_x = mouse.new_x;
        mouse.prev_y = mouse.new_y;
    }
});

document.addEventListener('wheel', function(event) {
    console.log(event);
    mouse.zoom -= event.deltaY/1200;
    if(mouse.zoom > 31){
        mouse.zoom = 31;
    }else if(mouse.zoom < 30){
        mouse.zoom = 30;
    }
})

// cuando el documento HTML esta completo, iniciamos la aplicación
$(document).ready(function(){
    loadShaders();
})