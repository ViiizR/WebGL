var gl = document.getElementById('gl')
         .getContext('webgl') || 
         document.getElementById('gl')
         .getContext('experimental-webgl');

// Global variable
var vertices = [];
var mouseX = 0; var mouseY = 0;
var angle = [0.0, 0.0, 0.0, 1.0];
var angleGL = 0;
var textureGL = 0; // Uniform Location
var display = [0.0, 0.0, 0.0, 0.0];
var displayGL = 0; // Uniform Location


document.getElementById('gl').addEventListener('mousemove', function (e)
{
    if (e.buttons == 1)
    {
        // Left mouse button pressed
        angle[0] -= (mouseY - e.y) * 0.01;
        angle[1] += (mouseX - e.x) * 0.01;
        gl.uniform4fv(angleGL, new Float32Array(angle));
        Render();
    }
    mouseX = e.x;
    mouseY = e.y;
});

function InitWebGL()
{
    if (!gl)
    {
        alert ('webGL is not supported');
        return;
    }

    let canvas = document.getElementById('gl');
    
    if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight)
    {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    
    InitViewport();
}

function InitViewport()
{
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.4, 0.6, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BACK);

    InitShaders();
}

function InitShaders()
{
    const vs = InitVertexShader();
    const fs = InitFragmentShader();

    let program = InitShaderProgram(vs, fs);

    if (!ValidateShaderProgram(program))
    {
        return false;
    }
    return CreateGeometryBuffers(program);
}

function ValidateShaderProgram(p)
{
    gl.validateProgram(p)

    if (!gl.getProgramParameter(p, gl.VALIDATE_STATUS))
    {
        console.error(gl.getProgramInfoLog(p))
        alert('Errors found validating shader program')
        return false;
    }
    return true;
}

function InitVertexShader()
{
    let e = document.getElementById('vs');
    let vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, e.value);
    gl.compileShader(vs);

    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
    {
        let e = gl.getShaderInfoLog(vs);
        console.error('failed init vertex shader: ', e);
        return;
    }
    return vs;
}

function InitFragmentShader()
{
    let e = document.getElementById('fs');
    let fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, e.value);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
    {
        let e = gl.getShaderInfoLog(fs);
        console.error('failed init fragment shader: ', e);
        return;
    }
    return fs;
}

function InitShaderProgram(vs, fs)
{
    let p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);

    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    {
        console.error(gl.getProgramInfoLog(p))
        alert ('Failed linking program');
        return;
    }
    return p;
}

function AddVertex(x, y, z, r, g, b, u, v, nx, ny, nz)
{
    const index = vertices.length;
    vertices.length += 8;
    vertices[index + 0] = x;
    vertices[index + 1] = y;
    vertices[index + 2] = z;
    vertices[index + 3] = r;
    vertices[index + 4] = g;
    vertices[index + 5] = b;
    vertices[index + 6] = u;
    vertices[index + 7] = v;
    // vertices[index + 8] = nx;
    // vertices[index + 9] = ny;
    // vertices[index + 10] = nz;
}

function CreateGeometryUI()
{
    const ew = document.getElementById('w');
    const w = ew ? ew.value : 1.0;
    const eh = document.getElementById('h');
    const h = eh ? eh.value : 1.0;
    const ed = document.getElementById('d');
    const d = ed ? ed.value : 1.0;

    document.getElementById('ui').innerHTML =
    'Width: <input type="number" id="w" value="' + w + '" onchange="InitShaders();"><br>' +
    'Height: <input type="number" id="h" value="' + h + '" onchange="InitShaders();"><br>' +
    'Depth: <input type="number" id="d" value="' + d + '" onchange="InitShaders();">';

    let e = document.getElementById('shape');
    switch (e.selectedIndex)
    {
        case 0: CreateTrinangle(w, h); break;
        case 1: CreateQuad(w, h); break;
        case 2: CreateCube(w, h, d); break;
    }
}

function AddTriangle(x1, y1, z1, r1, g1, b1, u1, v1, 
                     x2, y2, z2, r2, g2, b2, u2, v2,
                     x3, y3, z3, r3, g3, b3, u3, v3)
{
    AddVertex(x1, y1, z1, r1, g1, b1, u1, v1)
    AddVertex(x2, y2, z2, r2, g2, b2, u2, v2) 
    AddVertex(x3, y3, z3, r3, g3, b3, u3, v3)
}

function AddQuad(x1, y1, z1, r1, g1, b1, u1, v1, 
                 x2, y2, z2, r2, g2, b2, u2, v2,
                 x3, y3, z3, r3, g3, b3, u3, v3,
                 x4, y4, z4, r4, g4, b4, u4, v4)
{
    AddTriangle(x1, y1, z1, r1, g1, b1, u1, v1, 
                x2, y2, z2, r2, g2, b2, u2, v2,
                x3, y3, z3, r3, g3, b3, u3, v3);

    AddTriangle(x3, y3, z3, r3, g3, b3, u3, v3,
                x4, y4, z4, r4, g4, b4, u4, v4,
                x1, y1, z1, r1, g1, b1, u1, v1);
}

function CreateTrinangle(width, height) // funktion der generer koordinater baseret på dimensioner
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    AddTriangle(0.0, h, 0.0, 1.0, 0.0, 0.0, 0.5, 1.0,
                -w, -h, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0,
                 w, -h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0);
}

function CreateQuad(width, height) // funktion der generer koordinater baseret på dimensioner
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    AddQuad (-w,  h, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0,
             -w, -h, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0,
              w, -h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,
              w,  h, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0);
}

function CreateCube(width, height, depth)
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    const d = depth * 0.5;



    //FRONT
    AddQuad (-w,  h, d, 1.0, 0.0, 0.0, 0.0, 1.0,
              w,  h, d, 1.0, 0.0, 0.0, 0.0, 0.0,
              w, -h, d, 1.0, 0.0, 0.0, 1.0, 0.0,
             -w, -h, d, 1.0, 0.0, 0.0, 1.0, 1.0);
    //BACK
    AddQuad (-w,  h, -d, 1.0, 0.0, 0.0, 0.0, 1.0,
             -w, -h, -d, 0.0, 0.0, 0.0, 0.0, 0.0,
              w, -h, -d, 0.0, 0.0, 0.0, 1.0, 0.0,
              w,  h, -d, 1.0, 0.0, 0.0, 1.0, 1.0); 
    //TOP
    AddQuad (-w, h, -d, 0.0, 1.0, 0.0, 0.0, 1.0,
              w, h, -d, 0.0, 1.0, 0.0, 0.0, 0.0,
              w, h,  d, 0.0, 1.0, 0.0, 1.0, 0.0,
             -w, h,  d, 0.0, 1.0, 0.0, 1.0, 1.0);
    //BOTTOM
    AddQuad (-w, -h,  d, 0.0, 1.0, 0.0, 0.0, 1.0,
              w, -h,  d, 0.0, 0.0, 0.0, 0.0, 0.0,
              w, -h, -d, 0.0, 0.0, 0.0, 1.0, 0.0,
             -w, -h, -d, 0.0, 1.0, 0.0, 1.0, 1.0);
    //LSIDE
    AddQuad (-w,  h,  d, 0.0, 0.0, 1.0, 0.0, 1.0,
             -w, -h,  d, 0.0, 0.0, 1.0, 0.0, 0.0,
             -w, -h, -d, 0.0, 0.0, 1.0, 1.0, 0.0,
             -w,  h, -d, 0.0, 1.0, 1.0, 1.0, 1.0);
    //RSIDE
    AddQuad (w, -h,  d, 0.0, 0.0, 1.0, 0.0, 1.0,
             w,  h,  d, 0.0, 0.0, 0.0, 0.0, 0.0,
             w,  h, -d, 0.0, 0.0, 0.0, 1.0, 0.0,
             w, -h, -d, 0.0, 0.0, 1.0, 1.0, 1.0);
    
} 

function CreateGeometryBuffers(program)
{
    // Generate selected geometry and UI
    CreateGeometryUI();

    // Create GPU buffer (VBO)
    CreateVBO(program, new Float32Array(vertices));
    angleGL = gl.getUniformLocation(program, 'Angle');
    CreateTexture(program, 'img/texture.jpg');
    // Activate shader program
    gl.useProgram(program);
    // Update view rotation
    gl.uniform4fv(angleGL, new Float32Array(angle));
    // Update display options
    gl.uniform4fv(displayGL, new Float32Array(display));
    // Display geometry on screen
    Render();
} 

function CreateVBO(program, vert)
{
    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vert, gl.DYNAMIC_DRAW);

    const s = 8 * Float32Array.BYTES_PER_ELEMENT;

    // Create shader attribute: Pos
    let p = gl.getAttribLocation(program, 'Pos');
    gl.vertexAttribPointer(p, 3, gl.FLOAT, gl.FALSE, s, 0);
    gl.enableVertexAttribArray(p);

    // Create shader attribute: Color
    const o = 3 * Float32Array.BYTES_PER_ELEMENT;
    let c = gl.getAttribLocation(program, 'Color');
    gl.vertexAttribPointer(c, 3, gl.FLOAT, gl.FALSE, s, o);
    gl.enableVertexAttribArray(c);

    // Create shader attribute: UV
    const o2 = o * 2;
    let u = gl.getAttribLocation(program, 'UV');
    gl.vertexAttribPointer(u, 2, gl.FLOAT, gl.FALSE, s, o2);
    gl.enableVertexAttribArray(u);
}

function Render()
{
    gl.clearColor(0.0, 0.4, 0.6, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);
}

function CreateTexture(prog, url)
{
    // Load texture to graphics card
    const texture = LoadTexture(url);
    // Flip y axis so it fits OpenGL standard
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // Activate texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Add uniform location to fragment shader
    textureGL = gl.getUniformLocation(prog, 'Texture');
    // Add uniform location to fragment shader
    displayGL = gl.getUniformLocation(prog, 'Display');
}

function LoadTexture(url)
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    const image = new Image();
    image.onload = () => 
    {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        SetTextureFilters(image);
    }
    image.src = url;
    return texture;
}

function IsPow2(value)
{
    return (value & (value - 1)) === 0;
}

function SetTextureFilters(image)
{
    if (IsPow2(image.width) && IsPow2(image.height))
    {
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    else
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
}

function Update()
{
    // Show texture (boolean) last element
    const t = document.getElementById('t');
    display[3] = t.checked ? 1.0 : 0.0;
    // Update array to graphics card and render
    gl.uniform4fv(displayGL, new Float32Array(display));
    Render();
}
