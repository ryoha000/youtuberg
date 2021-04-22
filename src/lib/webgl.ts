export const setup = (c: HTMLCanvasElement) => {
  const gl = c.getContext('webgl')
  if (!gl) throw 'not work webgl'

  // canvasを黒でクリア(初期化)する
  // gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // gl.clear(gl.COLOR_BUFFER_BIT);
  const vs = createShader(gl, gl.VERTEX_SHADER, vertex)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragment)
  const program = createProgram(gl, vs, fs)
  gl.useProgram(program)
}

const vertex = `
attribute vec3 position;
uniform   mat4 mvpMatrix;

void main(void){
    gl_Position = mvpMatrix * vec4(position, 1.0);
}
`
const fragment = `
void main(void){
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`

const createShader = (gl: WebGLRenderingContext, type: number, raw: string) => {
  const shader = gl.createShader(type)
  gl.VERTEX_SHADER
  if (!shader) throw 'shader is null'
  gl.shaderSource(shader, raw)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // 成功していたらシェーダを返して終了
    return shader;
  } else {
    // 失敗していたらエラーログをアラートする
    console.error(gl.getShaderInfoLog(shader));
    throw 'shader compile failed'
  }
}

const createProgram = (gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) => {
  const program = gl.createProgram()
  if (!program) throw 'program create failed'
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    // 成功していたらプログラムオブジェクトを有効にする
    gl.useProgram(program)
    // プログラムオブジェクトを返して終了
    return program;
  } else {
    // 失敗していたらエラーログをアラートする
    console.error(gl.getProgramInfoLog(program))
    throw 'linkProgram failed'
  }
}

const createVBO = (gl: WebGLRenderingContext, data: number[]) => {
  const vbo = gl.createBuffer()
  if (!vbo) throw 'vbo failed'
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return vbo
}
