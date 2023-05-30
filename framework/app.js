import { Sphere } from './geometry/Sphere.js';
import { Plane } from './geometry/Plane.js';
import { SinTube } from './geometry/SinTube.js';
import { QuadraticBezier } from './geometry/curves/QuadraticBezier.js';
import { CubicBezier } from './geometry/curves/CubicBezier.js';
import { Square } from './geometry/polygons/Square.js';
import { Circle } from './geometry/polygons/Circle.js';
import { SweepCurve } from './geometry/SweepCurve.js';

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
var matrizVista = mat4.create();
var parent = mat4.identity(mat4.create());

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
    mat4.perspective(matrizProyeccion, 30, aspect, 0.1, 100.0);
    mat4.scale(matrizProyeccion,matrizProyeccion,[1,-1,1]); // parche para hacer un flip de Y, parece haber un bug en glmatrix

    // Definimos la ubicación de la camara
    
    mat4.lookAt(matrizVista,
        vec3.fromValues(0,app.alturaCamara,app.distanciaCamara),
        vec3.fromValues(0,0,0),
        vec3.fromValues(0,1,0)
    );

    gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mat4.identity(mat4.create()));
    gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, matrizVista);
    gl.uniformMatrix4fv(shaderProgram.projMatrixUniform, false, matrizProyeccion);

    dibujarGeometria();
}

function tick() {
    requestAnimFrame(tick);
    time+=1/60;

    mat4.rotate(parent, parent,0.03*app.velocidadAngular, [0, 1, 0]); 
 
    drawScene();
}

function crearGeometria(){
    let square = new Square(2);
    let circle = new Circle(0.5, 100);
    let points = [[0, 0, 0], [0, 2, 0], [2, 2, 0], [2, 4, 0]];
    let path = new CubicBezier(gl, points);

    let obj = new SweepCurve(gl, circle, path, 0.05);
    objetos3D.push(obj);

/*    let obj1 = new SinTube(gl, 5, 2.5, 1, 0.5);
    obj1.translate(0, 2.5, 0);
    obj1.scale(0.1,1,0.1);

    let obj2 = new SinTube(gl, 5, 2.5, 1, 0.5);
    obj2.translate(2.5, 0, 0);
    obj2.rotateZ(Math.PI/2);
    obj2.scale(0.1,1,0.1);

    let obj3 = new SinTube(gl, 5, 2.5, 1, 0.5);
    obj3.translate(0, 0, 2.5);
    obj3.rotateX(Math.PI/2);
    obj3.scale(0.1,2,0.1);

    objetos3D.push(obj1);
    objetos3D.push(obj2);
    objetos3D.push(obj3);*/

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

    crearGeometria();

    gl.clearColor(66.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    $(window).on("resize",onResize);
    initMenu();
    tick();
}

// cuando el documento HTML esta completo, iniciamos la aplicación
$(document).ready(function(){
    loadShaders();
})