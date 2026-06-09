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
var proGL = 0; // Uniform Location
var projection = [ 0.0, 0.0, 0.0, 0.0,
                   0.0, 0.0, 0.0, 0.0,
                   0.0, 0.0, 0.0, 0.0,
                   0.0, 0.0, 0.0, 0.0 ];
var modGL = 0; // Uniform location
// Model View Matrix
var modelView = [ 1.0, 0.0,  0.0, 0.0,
                  0.0, 1.0,  0.0, 0.0,
                  0.0, 0.0,  1.0, 0.0,
                  0.0, 0.0, -1.2, 1.0 ];


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
    gl.disable(gl.CULL_FACE);
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

function CreateGeometryBuffers(program)
{
    // Generate selected geometry and UI
    CreateGeometryUI();
    // Create GPU buffer (VBO)
    CreateVBO(program, new Float32Array(vertices));
    angleGL = gl.getUniformLocation(program, 'Angle');
    proGL = gl.getUniformLocation(program, 'Projection');
    modGL = gl.getUniformLocation(program, 'ModelView');
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

function Render()
{
    gl.clearColor(0.0, 0.4, 0.6, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Dolly Zoom
    const zoom = document.getElementById('zoom').value;
    modelView[14] = -zoom;
    // Perspective Projection
    const fov = document.getElementById('fov').value;
    const aspect = gl.canvas.width / gl.canvas.height;
    Perspective(fov, aspect, 1.0, 2000.0, projection);
    // Draw Geometry
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 11);
}

function CreateGeometryUI()
{
    const ew = document.getElementById('w');
    const w = ew ? ew.value : 1.0;
    const eh = document.getElementById('h');
    const h = eh ? eh.value : 1.0;
    const ed = document.getElementById('d');
    const d = ed ? ed.value : 1.0;
    const es = document.getElementById('s');
    const s = es ? es.value : 1.0;

    document.getElementById('ui').innerHTML =
    'Width: <input type="number" id="w" value="' + w + '" onchange="InitShaders();"><br>' +
    'Height: <input type="number" id="h" value="' + h + '" onchange="InitShaders();"><br>' +
    'Depth: <input type="number" id="d" value="' + d + '" onchange="InitShaders();"><br>' +
    'Subdivisions: <input type="number" id="s" value="' + s + '" onchange="InitShaders();">';

    let e = document.getElementById('shape');
    switch (e.selectedIndex)
    {
        case 0: CreateTrinangle(w, h); break;
        case 1: CreateQuad(w, h); break;
        case 2: CreateCube(w, h, d); break;
        case 3: CreateCylinder(w, h, d, s); break;
        case 4: CreateSubdividedCube(w, h, d, s); break;
    }
}

function CreateVBO(program, vert)
{
    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vert, gl.DYNAMIC_DRAW);

    const s = 11 * Float32Array.BYTES_PER_ELEMENT;

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

    // Create normal attribute: n
    const o3 = 8 * Float32Array.BYTES_PER_ELEMENT;
    let n = gl.getAttribLocation(program, 'Normal');
    gl.vertexAttribPointer(n, 3, gl.FLOAT, gl.FALSE, s, o3);
    gl.enableVertexAttribArray(n);
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
    vertices.length += 11;
    vertices[index + 0] = x;
    vertices[index + 1] = y;
    vertices[index + 2] = z;
    vertices[index + 3] = r;
    vertices[index + 4] = g;
    vertices[index + 5] = b;
    vertices[index + 6] = u;
    vertices[index + 7] = v;
    vertices[index + 8] = nx;
    vertices[index + 9] = ny;
    vertices[index + 10] = nz;
}

function Perspective(fovy, aspect, near, far, matrix)
{
    // Fill array with zeros
    matrix.fill(0);
    // Focal length
    const f = Math.tan(fovy * Math.PI / 360.0);
    // Setup matrix
    matrix[0] = f / aspect;
    matrix[5] = f;
    matrix[10] = (far + near)     / (near - far);
    matrix[11] = (2 * far * near) / (near - far);
    matrix[14] = -1;
    gl.uniformMatrix4fv(proGL, false, new Float32Array(projection));
    gl.uniformMatrix4fv(modGL, false, new Float32Array(modelView));
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
    // Light color (convert hex to RGB)
    const l = document.getElementById('l').value;
    display[0] = parseInt(l.substring(1,3),16) / 255.0;
    display[1] = parseInt(l.substring(3,5),16) / 255.0;
    display[2] = parseInt(l.substring(5,7),16) / 255.0;
    // Update array to graphics card and render
    gl.uniform4fv(displayGL, new Float32Array(display));
    Render();
}

function AddTriangle(x1, y1, z1, r1, g1, b1, u1, v1, 
                     x2, y2, z2, r2, g2, b2, u2, v2,
                     x3, y3, z3, r3, g3, b3, u3, v3,
                     nx, ny, nz)
{
    AddVertex(x1, y1, z1, r1, g1, b1, u1, v1, nx, ny, nz)
    AddVertex(x2, y2, z2, r2, g2, b2, u2, v2, nx, ny, nz) 
    AddVertex(x3, y3, z3, r3, g3, b3, u3, v3, nx, ny, nz)
}

function AddQuad(x1, y1, z1, r1, g1, b1, u1, v1,  
                 x2, y2, z2, r2, g2, b2, u2, v2, 
                 x3, y3, z3, r3, g3, b3, u3, v3, 
                 x4, y4, z4, r4, g4, b4, u4, v4, 
                 nx, ny, nz)
{
    AddTriangle(x1, y1, z1, r1, g1, b1, u1, v1, 
                x2, y2, z2, r2, g2, b2, u2, v2, 
                x3, y3, z3, r3, g3, b3, u3, v3,
                nx, ny, nz);

    AddTriangle(x3, y3, z3, r3, g3, b3, u3, v3, 
                x4, y4, z4, r4, g4, b4, u4, v4, 
                x1, y1, z1, r1, g1, b1, u1, v1,
                nx, ny, nz);
}

function CreateTrinangle(width, height) 
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    AddTriangle(0.0, h, 0.0, 1.0, 0.0, 0.0, 0.5, 1.0,
                -w, -h, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 
                 w, -h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,
                0.0, 0.0, 1.0);
}

function CreateQuad(width, height)
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    AddQuad (-w,  h, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 
             -w, -h, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 
              w, -h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 
              w,  h, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 
              0.0, 0.0, 1.0);
}

function CreateCube(width, height, depth)
{
    vertices.length = 0;
    const w = width * 0.5;
    const h = height * 0.5;
    const d = depth * 0.5;

    //FRONT
    AddQuad (-w,  h, d, 1.0, 0.0, 0.0, 0.0, 1.0, 
              w,  h, d, 1.0, 0.0, 0.0, 1.0, 1.0, 
              w, -h, d, 1.0, 0.0, 0.0, 1.0, 0.0, 
             -w, -h, d, 1.0, 0.0, 0.0, 0.0, 0.0, 
             0.0, 0.0, 1.0);
    //BACK
    AddQuad (-w,  h, -d, 1.0, 0.0, 0.0, 1.0, 1.0, 
             -w, -h, -d, 0.0, 0.0, 0.0, 1.0, 0.0, 
              w, -h, -d, 0.0, 0.0, 0.0, 0.0, 0.0, 
              w,  h, -d, 1.0, 0.0, 0.0, 0.0, 1.0, 
              0.0, 0.0, 1.0,); 
    //TOP
    AddQuad (-w, h, -d, 0.0, 1.0, 0.0, 0.0, 1.0, 
              w, h, -d, 0.0, 0.0, 0.0, 1.0, 1.0,
              w, h,  d, 0.0, 0.0, 0.0, 1.0, 0.0, 
             -w, h,  d, 0.0, 1.0, 0.0, 0.0, 0.0, 
             0.0, 0.0, 1.0,);
    //BOTTOM
    AddQuad (-w, -h,  d, 0.0, 1.0, 0.0, 0.0, 1.0, 
              w, -h,  d, 0.0, 0.0, 0.0, 1.0, 1.0, 
              w, -h, -d, 0.0, 0.0, 0.0, 1.0, 0.0, 
             -w, -h, -d, 0.0, 1.0, 0.0, 0.0, 0.0, 
             0.0, 0.0, 1.0,);
    //LSIDE
    AddQuad (-w,  h,  d, 0.0, 0.0, 1.0, 1.0, 1.0, 
             -w, -h,  d, 0.0, 0.0, 1.0, 1.0, 0.0, 
             -w, -h, -d, 0.0, 0.0, 1.0, 0.0, 0.0, 
             -w,  h, -d, 0.0, 1.0, 1.0, 0.0, 1.0, 
             0.0, 0.0, 1.0,);
    //RSIDE
    AddQuad (w, -h,  d, 0.0, 0.0, 1.0, 0.0, 0.0, 
             w,  h,  d, 0.0, 0.0, 0.0, 0.0, 1.0, 
             w,  h, -d, 0.0, 0.0, 0.0, 1.0, 1.0, 
             w, -h, -d, 0.0, 0.0, 1.0, 1.0, 0.0, 
             0.0, 0.0, 1.0,);
}

function CreateCylinder(width, height, depth, subdivisions)
{
    vertices.length = 0;
    const r = width * 0.5; // Radius
    const h = height * 0.5; // Half the height
    const s = Math.max(3, Math.floor(Number(subdivisions)));

    for (let i = 0; i < s; i++)
    {
        const a0 = (i / s) * Math.PI * 2;
        const a1 = ((i +1) / s) * Math.PI * 2;

        const x0 = Math.cos(a0) * r;
        const z0 = Math.sin(a0) * r;
        const x1 = Math.cos(a1) * r;
        const z1 = Math.sin(a1) * r;

        // SIDE
        AddQuad(x0, h,  z0, 1.0, 0.0, 0.0, i/s,     1.0,
                x1, h,  z1, 0.0, 1.0, 0.0, (i+1)/s, 1.0,
                x1, -h, z1, 1.0, 0.0, 0.0, (i+1)/s, 0.0,
                x0, -h, z0, 1.0, 0.0, 0.0, i/s,     0.0,
                0.0, 0.0, 1.0);

        // TOP
        AddTriangle(
            0.0, h, 0.0, 0.0, 1.0, 0.0, 0.5, 0.5,
            x1,  h, z1, 0.0, 1.0, 0.0, (Math.cos(a1)+1)*0.5, (Math.sin(a1)+1)*0.5,
            x0,  h, z0, 0.0, 1.0, 0.0, (Math.cos(a0)+1)*0.5, (Math.sin(a0)+1)*0.5,
            0.0, 1.0, 0.0);

        // Bottom
        AddTriangle(
            0.0, -h, 0.0, 0.0, 0.0, 1.0, 0.5, 0.5,
            x0,  -h, z0,  0.0, 0.0, 1.0, (Math.cos(a0)+1)*0.5, (Math.sin(a0)+1)*0.5,
            x1,  -h, z1,  0.0, 0.0, 1.0, (Math.cos(a1)+1)*0.5, (Math.sin(a1)+1)*0.5,
            0.0, -1.0, 0.0);
    }
}

function CreateSubdividedCube(width, height, depth, subdivisions)
{
    vertices.length = 0;

    const w = width * 0.5;
    const h = height * 0.5;
    const d = depth * 0.5;

    const s = Math.max(1, Math.floor(Number(subdivisions)));

    function color(i, j)
    {
        const c = ((i + j) % 2 === 0) ? 1.0 : 0.0;
        return [c, c, c];
    }

    // FRONT: z = d
    for (let i = 0; i < s; i++)
    {
        for (let j = 0; j < s; j++)
        {
            const x0 = -w + (2 * w) * i / s;
            const x1 = -w + (2 * w) * (i + 1) / s;
            const y0 = -h + (2 * h) * j / s;
            const y1 = -h + (2 * h) * (j + 1) / s;

            const [r, g, b] = color(i, j);

            AddQuad(
                x0, y1, d, r, g, b, 0, 1, 
                x1, y1, d, r, g, b, 1, 1, 
                x1, y0, d, r, g, b, 1, 0, 
                x0, y0, d, r, g, b, 0, 0, 
                0, 0, 1,
            );
        }
    }

    // BACK: z = -d
    for (let i = 0; i < s; i++)
    {
        for (let j = 0; j < s; j++)
        {
            const x0 = -w + (2 * w) * i / s;
            const x1 = -w + (2 * w) * (i + 1) / s;
            const y0 = -h + (2 * h) * j / s;
            const y1 = -h + (2 * h) * (j + 1) / s;

            const [r, g, b] = color(i, j);

            AddQuad(
                x0, y1, -d, r, g, b, 0, 1, 
                x0, y0, -d, r, g, b, 0, 0, 
                x1, y0, -d, r, g, b, 1, 0, 
                x1, y1, -d, r, g, b, 1, 1, 
                0, 0, 1,
            );
        }
    }

    // TOP: y = h
    for (let i = 0; i < s; i++)
    {
        for (let j = 0; j < s; j++)
        {
            const x0 = -w + (2 * w) * i / s;
            const x1 = -w + (2 * w) * (i + 1) / s;
            const z0 = -d + (2 * d) * j / s;
            const z1 = -d + (2 * d) * (j + 1) / s;

            const [r, g, b] = color(i, j);

            AddQuad(
                x0, h, z0, r, g, b, 0, 1,
                x1, h, z0, r, g, b, 1, 1,
                x1, h, z1, r, g, b, 1, 0,
                x0, h, z1, r, g, b, 0, 0,
                 0, 0, 1,
            );
        }
    }

    // BOTTOM: y = -h
    for (let i = 0; i < s; i++)
    {
        for (let j = 0; j < s; j++)
        {
            const x0 = -w + (2 * w) * i / s;
            const x1 = -w + (2 * w) * (i + 1) / s;
            const z0 = -d + (2 * d) * j / s;
            const z1 = -d + (2 * d) * (j + 1) / s;

            const [r, g, b] = color(i, j);

            AddQuad(
                x0, -h, z1, r, g, b, 0, 1,
                x1, -h, z1, r, g, b, 1, 1,
                x1, -h, z0, r, g, b, 1, 0,
                x0, -h, z0, r, g, b, 0, 0,
                 0, 0, 1,
            );
        }
    }

    // LEFT: x = -w
    for (let i = 0; i < s; i++)
    {
        for (let j = 0; j < s; j++)
        {
            const y0 = -h + (2 * h) * i / s;
            const y1 = -h + (2 * h) * (i + 1) / s;
            const z0 = -d + (2 * d) * j / s;
            const z1 = -d + (2 * d) * (j + 1) / s;

            const [r, g, b] = color(i, j);

            AddQuad(
                -w, y1, z0, r, g, b, 0, 1,
                -w, y1, z1, r, g, b, 1, 1,
                -w, y0, z1, r, g, b, 1, 0,
                -w, y0, z0, r, g, b, 0, 0,
                 0, 0, 1,
            );
        }
    }

    // RIGHT: x = w
    for (let i = 0; i < s; i++)
    {
        for (let j = 0; j < s; j++)
        {
            const y0 = -h + (2 * h) * i / s;
            const y1 = -h + (2 * h) * (i + 1) / s;
            const z0 = -d + (2 * d) * j / s;
            const z1 = -d + (2 * d) * (j + 1) / s;

            const [r, g, b] = color(i, j);

            AddQuad(
                w, y1, z1, r, g, b, 0, 1,
                w, y1, z0, r, g, b, 1, 1, 
                w, y0, z0, r, g, b, 1, 0,
                w, y0, z1, r, g, b, 0, 0,
                 0, 0, 1,
            );
        }
    }

}
