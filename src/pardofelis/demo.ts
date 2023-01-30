const shaderSource: string = /* wgsl */ `
@vertex
fn main_vs(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
    var pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
        vec2<f32>( 0.0, 0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5)
    );
    return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}

@fragment
fn main_fs() -> @location(0) vec4<f32> {
    return vec4<f32>(0.0, 1.0, 0.0, 1.0);
}
`;

export default class PardofelisDemo {
  private adapter: any;
  private device: any;
  private canvas: any;
  private context: any;
  private shaderModule: any;
  private pipeline: any;

  constructor() {}

  public async initDemo() {
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
    this.canvas = document.getElementById("target");
    this.context = this.canvas.getContext("webgpu");

    const format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: format,
      size: { width: this.canvas.width, height: this.canvas.height },
    });

    this.shaderModule = this.device.createShaderModule({ code: shaderSource });
    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.shaderModule,
        entryPoint: "main_vs",
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "main_fs",
        targets: [{ format: format }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
  }

  private frame() {
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
    this.doFrame();
  }

  public doFrame() {
    requestAnimationFrame(() => this.frame());
  }
}
