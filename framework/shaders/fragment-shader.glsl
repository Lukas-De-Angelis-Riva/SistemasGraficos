precision highp float;
varying vec3 vNormal;
varying vec3 vPosWorld;

// uniform vec3 vColor;

uniform sampler2D texture;

varying highp vec2 vUv;

void main(void) {

    vec3 lightVec=normalize(vec3(0.0,50.0,0.0)-vPosWorld);
    vec3 diffColor=mix(vec3(0.7,0.7,0.7),vNormal,0.4);
    // vec3 color=dot(lightVec,vNormal)*vColor+vec3(0.2,0.2,0.2);

    vec3 color = texture2D(texture, vUv).xyz;
    gl_FragColor = vec4(color,1.0);
}