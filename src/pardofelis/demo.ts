import { vec3, mat4 } from "gl-matrix";
import PerspectiveCamera from "./camera/perspective";

const shaderSource: string = /* wgsl */ `
struct MtxMVP {
  model : mat4x4<f32>,
  view : mat4x4<f32>,
  proj : mat4x4<f32>,
  modelView : mat4x4<f32>,
  modelViewProj : mat4x4<f32>
}

// struct PointLightParam {
//   worldPos : vec3<f32>,
//   color : vec3<f32>
// }

// struct MaterialParam {
//   color : vec3<f32>,
//   roughness : f32,
//   metallic : f32,
//   ambientOcc : f32
// }

struct VertOutput {
  @builtin(position) Pos : vec4<f32>,
  @location(0) WorldPos : vec3<f32>
}

@group(0) @binding(0) var<uniform> mtxMVP : MtxMVP;

// @group(1) @binding(0)
// var<uniform> pointLights : array<PointLightParam>;

// @group(1) @binding(1)
// var<uniform> material : MaterialParam;

@vertex
fn main_vs(
  @location(0) pos : vec4<f32>
) -> VertOutput {
  var output : VertOutput;
  output.Pos = mtxMVP.modelViewProj * pos;
  output.WorldPos = (mtxMVP.model * pos).xyz;
  return output;
}

@fragment
fn main_fs(
  @location(0) worldPos : vec3<f32>
) -> @location(0) vec4<f32> {
  return vec4<f32>(worldPos, 1.0);
}
`;

const vertices = new Float32Array([
  1, 1, 1, 1,
  1, 1, -1, 1,
  1, -1, -1, 1,
  1, -1, 1, 1,
  -1, 1, 1, 1,
  -1, 1, -1, 1,
  -1, -1, -1, 1,
  -1, -1, 1, 1
]);

const indices = new Uint16Array([
  0, 2, 1,
  0, 3, 2,
  4, 5, 6,
  4, 6, 7,
  0, 5, 4,
  0, 1, 5,
  3, 6, 2,
  3, 7, 6,
  0, 7, 3,
  0, 4, 7,
  1, 6, 5,
  1, 2, 6
]);

export default class PardofelisDemo {
  private adapter: GPUAdapter;
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private shaderModule: GPUShaderModule;
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private uniformBuffer: GPUBuffer;
  private vertUniformBindGroup: GPUBindGroup;
  private depthTexture: GPUTexture;
  private renderPassDesciptor: GPURenderPassDescriptor;
  private pipeline: GPURenderPipeline;

  private camera: PerspectiveCamera;

  private isStopped: boolean;

  constructor() {
    this.isStopped = true;
  }

  public async initDemo() {
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
    this.canvas = document.getElementById("target") as HTMLCanvasElement;
    this.context = this.canvas.getContext("webgpu");

    const format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: format,
      size: { width: this.canvas.width, height: this.canvas.height }
    });

    this.shaderModule = this.device.createShaderModule({ code: shaderSource });

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();

    this.indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.shaderModule,
        entryPoint: "main_vs",
        buffers: [
          {
            arrayStride: 4 * 4, // 4 * float32
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x4",
              }
            ]
          }
        ]
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "main_fs",
        targets: [{ format: format }]
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      }
    });

    this.uniformBuffer = this.device.createBuffer({
      size: 5 * 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.vertUniformBindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
      ],
    });

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.renderPassDesciptor = {
      colorAttachments: [
        {
          view: null,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };

    let camPos = vec3.create();
    vec3.set(camPos, 3, 2, 1);
    let camForward = vec3.create();
    vec3.set(camForward, -3, -2, -1);
    this.camera = PerspectiveCamera.create(camPos, camForward, null, 60,
      this.canvas.width / this.canvas.height);
    console.log(this.camera);
  }

  private frame() {
    if (this.isStopped) return;

    let mtxModel = mat4.create();
    mat4.identity(mtxModel);
    let mtxView = this.camera.getViewMatrix();
    let mtxProj = this.camera.getProjMatrix();
    let mtxMV = mat4.create();
    mat4.mul(mtxMV, mtxView, mtxModel);
    let mtxMVP = mat4.create();
    mat4.mul(mtxMVP, mtxProj, mtxMV);
    let mtxBuffer = new Float32Array(5 * 4 * 4);
    mtxBuffer.set(mtxModel, 0);
    mtxBuffer.set(mtxView, 1 * 4 * 4);
    mtxBuffer.set(mtxProj, 2 * 4 * 4);
    mtxBuffer.set(mtxMV, 3 * 4 * 4);
    mtxBuffer.set(mtxMVP, 4 * 4 * 4);

    this.device.queue.writeBuffer(this.uniformBuffer, 0,
      mtxBuffer.buffer, mtxBuffer.byteOffset, mtxBuffer.byteLength);

    const commandEncoder = this.device.createCommandEncoder();
    const renderPassDescriptor = this.renderPassDesciptor;
    renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.vertUniformBindGroup);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
    passEncoder.drawIndexed(36);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(() => this.frame());
  }

  public startRender() {
    console.log("start render");
    this.isStopped = false;
    requestAnimationFrame(() => this.frame());
  }

  public stopRender() {
    console.log("stop render");
    this.isStopped = true;
  }
}
