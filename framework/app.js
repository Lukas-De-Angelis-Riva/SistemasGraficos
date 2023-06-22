import { Plane } from './geometry/Plane.js';
import { DronCamera, FollowerCamera, OrbitalCamera } from './Camera.js';
import { Bridge, Ship, Terrain, TreeGenerator } from './geometry/World.js';
import { Cube } from './geometry/Cube.js';
import { SweepCurve } from './geometry/SweepCurve.js';
import { Square } from './geometry/polygons/Square.js';
import { QuadraticBezier } from './geometry/curves/QuadraticBezier.js';
import { Cuboid } from './geometry/standard/Cuboid.js';

var time=0;

var gl;
var mat4=glMatrix.mat4;
var mat3=glMatrix.mat3;
var vec3=glMatrix.vec3;
    
var $canvas=$("#myCanvas");
var aspect=$canvas.width()/$canvas.height();

var app={
    h1: 2,
    h2: 12,
    s1: 0.70,
    a: 0.7,
    L_road_curve: 25,
    L_terrain: 50,
    L_river: 15,
    H_river: 0.5,
    N_trees: 100,
    generar:crearGeometria,
    show_normals:'No'
};

var vertexShaderFile="vertex-shader.glsl";
var vertexShaderSource;
var fragmentShaderSource;
var shaderProgram;

var matrizProyeccion = mat4.create();
var parent = mat4.identity(mat4.create());

var camera;
var dronCamera;
var orbitalCamera;
var followerCamera;

var texture;

function loadTextures(){
    texture = gl.createTexture();
    texture.image = new Image();

    texture.image.onload = function () {
        // Invierte el ejeY (?)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // Activo la textura
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // filtros de mini y magnificación
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        
//        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Comienza el programa.
        webGLStart();
    }
    // Desencadena la carga
    texture.image.src = "textures/uv-grid.png";
}

function loadShaders(){

    $.when(loadVS(), loadFS()).done(function(res1,res2){
        //this code is executed when all ajax calls are done
        var canvas = document.getElementById("myCanvas");
        initGL(canvas);

        loadTextures();
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
    gl.clearColor(0.30,0.65,0.75,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Se configura la matriz de proyección
    mat4.identity(matrizProyeccion);
    mat4.perspective(matrizProyeccion, 30, aspect, 0.1, 450.0);
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
        camera.turnSide(deltaX/10);
    }
    if(mouse.prev_y != mouse.y){
        let deltaY = -(mouse.new_y - mouse.prev_y);
        mouse.prev_y = mouse.new_y;
        camera.tunrUp(deltaY/20);
    }

    camera.move(movement);
 
    //Ship.move(ship, app.L_terrain/2-3.5);
    drawScene();
}

var water;
var terrain;
var bridge;
var ship;
var trees;

var cuboid;
function crearGeometria(){
    cuboid = new Cuboid(gl, 400, 400, 400);
    trees = TreeGenerator.generate(gl, app.N_trees, app.L_terrain/2, 4, 3*app.L_river/4);

    let H = 3*(app.H_river-1);
    water = new Plane(gl, app.L_terrain, app.L_river+2, 1, 1, 1, app.L_terrain/(app.L_river+2));
    water.translate(0, H, 0);
    water.setColor([.33, .70, .93]);

    terrain = new Terrain(gl, app.L_terrain/2, app.L_river);
    terrain.translate(0, 0.25, 0);

    bridge = new Bridge(gl, app.h1, app.h2, 1-app.a, (app.L_terrain/2-app.L_road_curve/2), app.L_road_curve, app.s1);

    ship = new Ship(gl, 4);
    ship.translate(0, H+0.25, app.L_terrain/2-3.5);

    followerCamera = new FollowerCamera(gl, [0, 2, -5], ship);
}

function dibujarGeometria(){
    let showNormals = app.show_normals != "No";
    cuboid.render(shaderProgram, parent, showNormals);
    trees.forEach(t => {
        t.render(shaderProgram, parent, showNormals);
    });
    water.render(shaderProgram, parent, showNormals);
    terrain.render(shaderProgram, parent, showNormals);
    bridge.render(shaderProgram, parent, showNormals);
    ship.render(shaderProgram, parent, showNormals);
}

function initMenu(){
    var gui = new dat.GUI();

    var f1 = gui.addFolder('Puente');
    f1.add(app, 'h1', 1.5, 4).step(0.05).name("Altura h1");
    f1.add(app, 'h2', 8, 16).step(0.5).name("Altura h2");
    f1.add(app, 's1', 0.25, 2).step(0.01).name("S1 tirantes");
    f1.add(app, 'a', 0.30, 0.80).step(0.01).name("Separación torres");
    f1.open();

    var f2 = gui.addFolder('Carretera');
    f2.add(app, 'L_road_curve', 20, 40).step(0.5).name("Largo subida");
    f2.open();

    var f3 = gui.addFolder('Terreno');
    f3.add(app, 'L_terrain', 40, 80).step(0.25).name("Ancho terreno");
    f3.add(app, 'L_river', 10, 20).step(0.25).name("Ancho rio");
    f3.add(app, 'H_river', 0.1, 0.9).step(0.01).name("% Altura rio");
    f3.add(app, 'N_trees', 0, 150).step(1).name("# Árboles");
    f3.open();

    gui.add(app, 'generar').name("Volver a generar");

    var f4 = gui.addFolder('Utils');
    f4.add(app, 'show_normals',["Sí","No"]).name("Mostrar normales: ");
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

    shaderProgram.vertexUv = gl.getAttribLocation(shaderProgram, "aVertexUv");
    gl.enableVertexAttribArray(shaderProgram.vertexUv);

    shaderProgram.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");
    shaderProgram.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "viewMatrix");
    shaderProgram.projMatrixUniform = gl.getUniformLocation(shaderProgram, "projMatrix");
    shaderProgram.normalMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");

    // texturas
    shaderProgram.vColorUniform = gl.getUniformLocation(shaderProgram, "vColor"); // debería irse...
    shaderProgram.texture = gl.getUniformLocation(shaderProgram, "texture");

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.texture, 0);
}

function webGLStart() {

    initShaders();

    dronCamera = new DronCamera(gl, 16, 13, 24);
    orbitalCamera = new OrbitalCamera(gl, 30, Math.PI/4, 3*Math.PI/8);
    
    camera = orbitalCamera;

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

movement.zoomOut = false;
movement.zoomIn = false;

document.addEventListener('keydown', function(event) {
    if(event.key == '1') camera = orbitalCamera;
    if(event.key == '2') camera = dronCamera;
    if(event.key == '3') camera = followerCamera;

    if(event.key == 'a' || event.key == 'A') movement.left = true;
    if(event.key == 's' || event.key == 'S') movement.back = true;
    if(event.key == 'd' || event.key == 'D') movement.right = true;
    if(event.key == 'w' || event.key == 'w') movement.front = true;
    if(event.key == ' ') movement.up = true;
    if(event.key == 'z' || event.key == 'z') movement.down = true;

    if(event.key == 'ArrowRight') movement.turnright = true;
    if(event.key == 'ArrowLeft') movement.turnleft = true;
    if(event.key == 'ArrowUp') movement.turnup = true;
    if(event.key == 'ArrowDown') movement.turndown = true;
});

document.addEventListener('keyup', function(event) {
    if(event.key == 'a' || event.key == 'A') movement.left = false;
    if(event.key == 's' || event.key == 'S') movement.back = false;
    if(event.key == 'd' || event.key == 'D') movement.right = false;
    if(event.key == 'w' || event.key == 'w') movement.front = false;
    if(event.key == ' ') movement.up = false;
    if(event.key == 'z' || event.key == 'z') movement.down = false;

    if(event.key == 'ArrowRight') movement.turnright = false;
    if(event.key == 'ArrowLeft') movement.turnleft = false;
    if(event.key == 'ArrowUp') movement.turnup = false;
    if(event.key == 'ArrowDown') movement.turndown = false;
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
    let mov = Object();
    mov.zoomOut = event.deltaY>0;
    mov.zoomIn = event.deltaY<0;
    camera.move(mov);
})

// cuando el documento HTML esta completo, iniciamos la aplicación
$(document).ready(function(){
    loadShaders();
})