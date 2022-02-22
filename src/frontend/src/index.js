/*
eslint-disable

max-statements,
no-lone-blocks,
no-magic-numbers,
*/



import './index.scss';

import * as THREE from 'three';

import WasmWrapper from '../../../../wasm-wrapper/src/index.js';
import RdtyRenderers from '../../../../renderers-web/src/index.js';

import wasm_code from './cpp/src/entry-wasm32.cpp';

import TestWorker from 'worker-loader!./test.worker.js';



// Use window.navigator.hardwareConcurrency?
const threads = [ ...new Array(2) ].map(() => new TestWorker());



window.addEventListener
(
	'load',

	async () =>
	{
		const wasm_wrapper = new WasmWrapper();

		// 4gb == 65536 pages
		const wasm_memory = new WebAssembly.Memory({ initial: 65536, maximum: 65536, shared: true });

		await wasm_wrapper.init(wasm_code, wasm_memory);

		wasm_wrapper.exports.initTransitionStack();
		wasm_wrapper.exports.constructRenderityWrappers();



		threads.forEach
		((thread, thread_index) => thread.postMessage({ thread_index, wasm_code, wasm_memory }));



		const renderer_addr = wasm_wrapper.Addr(wasm_wrapper.exports.renderer.value);
		const scene_addr = wasm_wrapper.Addr(wasm_wrapper.exports.scene.value);
		const object_addr = wasm_wrapper.Addr(wasm_wrapper.exports._object.value);
		const surface_material_addr = wasm_wrapper.Addr(wasm_wrapper.exports.surface_material.value);
		const surface_object_addr = wasm_wrapper.Addr(wasm_wrapper.exports.surface_object.value);



		{
			const orbit = wasm_wrapper.Addr(wasm_wrapper.exports.orbit.value);

			const RDTY_MATH_Orbit_rotate2 = wasm_wrapper.exports_demangled['RDTY::MATH::Orbit::rotate2(float,float)'];
			const RDTY_MATH_Orbit_update = wasm_wrapper.exports_demangled['RDTY::MATH::Orbit::update()'];

			window.addEventListener
			(
				'mousemove',

				(evt) =>
				{
					RDTY_MATH_Orbit_rotate2(orbit, evt.movementX * 0.01, evt.movementY * 0.01);
					RDTY_MATH_Orbit_update(orbit);


					// wasm_wrapper.exports.startTransition();
				},
			);
		}



		const rdty_renderers = new RdtyRenderers(wasm_wrapper);



		/* eslint-disable */
		let tree_data = null;

		{
			const vsub = (target, a, b) =>
			{
				target[0] = a[0] - b[0];
				target[1] = a[1] - b[1];
				target[2] = a[2] - b[2];
			};

			const testRayBoxIntersection = (ray_origin, ray_direction, box_min, box_max) =>
			{
				let tmin = (box_min[0] - ray_origin[0]) / ray_direction[0];
				let tmax = (box_max[0] - ray_origin[0]) / ray_direction[0];

				if (tmin > tmax)
				{
					const _tmp = tmin;
					tmin = tmax;
					tmax = _tmp;
				}

				let tymin = (box_min[1] - ray_origin[1]) / ray_direction[1];
				let tymax = (box_max[1] - ray_origin[1]) / ray_direction[1];

				if (tymin > tymax)
				{
					const _tmp = tymin;
					tymin = tymax;
					tymax = _tmp;
				}

				if ((tmin > tymax) || (tymin > tmax))
				{
					return false;
				}

				if (tymin > tmin)
				{
					tmin = tymin;
				}

				if (tymax < tmax)
				{
					tmax = tymax;
				}

				let tzmin = (box_min[2] - ray_origin[2]) / ray_direction[2];
				let tzmax = (box_max[2] - ray_origin[2]) / ray_direction[2];

				if (tzmin > tzmax)
				{
					const _tmp = tzmin;
					tzmin = tzmax;
					tzmax = _tmp;
				}

				if ((tmin > tzmax) || (tzmin > tmax))
				{
					return false;
				}

				if (tzmin > tmin)
				{
					tmin = tzmin;
				}

				if (tzmax < tmax)
				{
					tmax = tzmax;
				}

				return ((tmin < 1000) && (tmax > 0));
			};



			const p1 = [ 0, 0, 0 ];
			const p2 = [ 0, 0, 0 ];
			const p3 = [ 0, 0, 0 ];
			const p1p2 = [ 0, 0, 0 ];
			const p1p3 = [ 0, 0, 0 ];
			const p2p1 = [ 0, 0, 0 ];
			const p2p3 = [ 0, 0, 0 ];
			const p3p1 = [ 0, 0, 0 ];
			const p3p2 = [ 0, 0, 0 ];



			class BoxTree
			{
				static level_num = 8;



				constructor (position_data, index_data)
				{
					this.position_data = position_data;
					this.index_data = index_data;

					this.x_min = Infinity;
					this.x_max = -Infinity;
					this.y_min = Infinity;
					this.y_max = -Infinity;
					this.z_min = Infinity;
					this.z_max = -Infinity;

					this.bounding_box = null;



					this._data = new ArrayBuffer(2024 * 1024 * 4);
					this.data_ui32 = new Uint32Array(this._data);
					this.data_f32 = new Float32Array(this._data);



					const _object = this;

					class Box
					{
						static instances = [];



						constructor (center, size)
						{
							this.center = center;
							this.size = size;

							this.min =
							[
								this.center[0] - (this.size * 0.5),
								this.center[1] - (this.size * 0.5),
								this.center[2] - (this.size * 0.5)
							];

							this.max =
							[
								this.center[0] + (this.size * 0.5),
								this.center[1] + (this.size * 0.5),
								this.center[2] + (this.size * 0.5)
							];

							this.boxes = [];
							this.triangles = [];

							Box.instances.push(this);
						}

						testPointInsideBox (point)
						{
							return Boolean
							(
								point[0] <= this.max[0] && point[0] >= this.min[0] &&
								point[1] <= this.max[1] && point[1] >= this.min[1] &&
								point[2] <= this.max[2] && point[2] >= this.min[2],
							);
						}

						split (level)
						{
							if (level === BoxTree.level_num - 1)
							{
								return;
							}



							const child_size = this.size * 0.5;

							const child_center_offset = child_size / 2;

							const child_centers =
							[
								[ this.center[0] + child_center_offset, this.center[1] + child_center_offset, this.center[2] + child_center_offset ],
								[ this.center[0] + child_center_offset, this.center[1] + child_center_offset, this.center[2] - child_center_offset ],
								[ this.center[0] + child_center_offset, this.center[1] - child_center_offset, this.center[2] + child_center_offset ],
								[ this.center[0] + child_center_offset, this.center[1] - child_center_offset, this.center[2] - child_center_offset ],
								[ this.center[0] - child_center_offset, this.center[1] + child_center_offset, this.center[2] + child_center_offset ],
								[ this.center[0] - child_center_offset, this.center[1] + child_center_offset, this.center[2] - child_center_offset ],
								[ this.center[0] - child_center_offset, this.center[1] - child_center_offset, this.center[2] + child_center_offset ],
								[ this.center[0] - child_center_offset, this.center[1] - child_center_offset, this.center[2] - child_center_offset ],
							];

							this.boxes.push(...child_centers.map((center) => new _object.Box(center, child_size, this)));

							this.boxes.forEach((box) => box.split(level + 1));
						}

						pushTriangle (triangle_index, level)
						{
							let boxHasTriangle = false;

							const vertex1_index = _object.index_data[(triangle_index * 3) + 0];
							const vertex2_index = _object.index_data[(triangle_index * 3) + 1];
							const vertex3_index = _object.index_data[(triangle_index * 3) + 2];

							p1[0] = _object.position_data[(vertex1_index * 3) + 0];
							p1[1] = _object.position_data[(vertex1_index * 3) + 1];
							p1[2] = _object.position_data[(vertex1_index * 3) + 2];

							p2[0] = _object.position_data[(vertex2_index * 3) + 0];
							p2[1] = _object.position_data[(vertex2_index * 3) + 1];
							p2[2] = _object.position_data[(vertex2_index * 3) + 2];

							p3[0] = _object.position_data[(vertex3_index * 3) + 0];
							p3[1] = _object.position_data[(vertex3_index * 3) + 1];
							p3[2] = _object.position_data[(vertex3_index * 3) + 2];

							vsub(p1p2, p2, p1);
							vsub(p1p3, p3, p1);

							vsub(p2p1, p1, p2);
							vsub(p2p3, p3, p2);

							vsub(p3p1, p1, p3);
							vsub(p3p2, p2, p3);

							if
							(
								// point inside box
								this.testPointInsideBox(p1) ||
								this.testPointInsideBox(p2) ||
								this.testPointInsideBox(p3) ||

								// edge intersects box
								(testRayBoxIntersection(p1, p1p2, this.min, this.max) && testRayBoxIntersection(p2, p2p1, this.min, this.max)) ||
								(testRayBoxIntersection(p2, p2p3, this.min, this.max) && testRayBoxIntersection(p3, p3p2, this.min, this.max)) ||
								(testRayBoxIntersection(p3, p3p1, this.min, this.max) && testRayBoxIntersection(p1, p1p3, this.min, this.max))
							)
							{
								this.triangles.push(triangle_index);

								boxHasTriangle = true;
							}



							if (level === BoxTree.level_num - 1)
							{
								return;
							}



							if (boxHasTriangle)
							{
								this.boxes.forEach((box) => box.pushTriangle(triangle_index, level + 1));
							}
						}

						serialize (offset)
						{
							let size = 0;

							_object.data_f32[offset + size + 0] = this.min[0];
							_object.data_f32[offset + size + 1] = this.min[1];
							_object.data_f32[offset + size + 2] = this.min[2];

							size += 4;

							_object.data_f32[offset + size + 0] = this.max[0];
							_object.data_f32[offset + size + 1] = this.max[1];
							_object.data_f32[offset + size + 2] = this.max[2];

							size += 4;

							const boxes_with_triangle_count =
								this.boxes.filter((box) => (box.triangles.length !== 0)).length;

							_object.data_ui32[offset + size] = boxes_with_triangle_count;

							++size;

							if (boxes_with_triangle_count)
							{
								const _size = size;

								const boxes_count = this.boxes.length;

								for (let i = 0, _i = 0; i < boxes_count; ++i)
								{
									const box = this.boxes[i];

									if (box.triangles.length !== 0)
									{
										const box_offset = offset + size + boxes_with_triangle_count;

										_object.data_ui32[offset + _size + _i] = box_offset;

										size += box.serialize(box_offset);

										++_i;
									}
								}

								size += boxes_with_triangle_count;
							}
							else if (this.triangles.length !== 0)
							{
								_object.data_ui32[offset + size] = this.triangles.length;

								++size;

								for (let i = 0, i_max = this.triangles.length; i < i_max; ++i)
								{
									// _object.data_ui32[offset + size] = this.triangles[i];
									_object.data_ui32[offset + size] = this.triangles[i] * 3;

									++size;
								}
							}

							return size;
						}
					}

					this.Box = Box;
				}

				makeBoundingBox ()
				{
					for (let i = 0; i < this.position_data.length; i += 3)
					{
						if (this.position_data[i + 0] < this.x_min)
						{
							this.x_min = this.position_data[i + 0];
						}

						if (this.position_data[i + 0] > this.x_max)
						{
							this.x_max = this.position_data[i + 0];
						}

						if (this.position_data[i + 1] < this.y_min)
						{
							this.y_min = this.position_data[i + 1];
						}

						if (this.position_data[i + 1] > this.y_max)
						{
							this.y_max = this.position_data[i + 1];
						}

						if (this.position_data[i + 2] < this.z_min)
						{
							this.z_min = this.position_data[i + 2];
						}

						if (this.position_data[i + 2] > this.z_max)
						{
							this.z_max = this.position_data[i + 2];
						}
					}

					const center =
					[ (this.x_min + this.x_max) * 0.5, (this.y_min + this.y_max) * 0.5, (this.z_min + this.z_max) * 0.5 ];

					const size = Math.max(Math.max(this.x_max - this.x_min, this.y_max - this.y_min), this.z_max - this.z_min);

					this.bounding_box = new this.Box(center, size);

					this.bounding_box.split(0);
				}

				makeTree ()
				{
					for (let i = 0, i_max = this.index_data.length / 3; i < i_max; ++i)
					{
						this.bounding_box.pushTriangle(i, 0);
					}
				}

				serialize ()
				{
					this.bounding_box.serialize(0, 0);
				}
			}



			const sphere = new THREE.SphereGeometry(10, 256, 256);
			LOG(sphere)
			// const sphere = new THREE.SphereGeometry(10, 32, 32);

			const sphere_object = new BoxTree(sphere.attributes.position.array, sphere.index.array);
			sphere_object.makeBoundingBox();
			sphere_object.makeTree();
			sphere_object.serialize();

			tree_data = sphere_object.data_ui32;



			const object_base = rdty_renderers.ObjectBase.getInstance(object_addr);

			object_base.updateVertexData(sphere.attributes.position.array);
			object_base.updateIndexData(sphere.index.array);
		}
		/* eslint-enable */
		/*
		eslint-disable

		max-statements,
		no-lone-blocks,
		no-magic-numbers,
		*/



		wasm_wrapper.exports.constructRenderityWrappers2();



		const webgpu = new rdty_renderers.WebGPU(wasm_wrapper);

		const renderer =
			new webgpu.Renderer
			(
				renderer_addr,

				{
					canvas: document.querySelector('#webgpu'),
				},
			);

		await renderer.init();



		const
			{
				Scene,
				Material,
				UniformBlock,
				StorageBlock2,
				// DescriptorSet,
				Object,
			} = renderer;



		const scene = Scene.getInstance(scene_addr);

		const surface_uniform_block_camera =
			UniformBlock.getInstance
			(wasm_wrapper.Addr(wasm_wrapper.exports.surface_uniform_block_camera.value));

		const tree_buffer =
			renderer.device.createBuffer
			({
				size: tree_data.byteLength,

				usage:
				(
					window.GPUBufferUsage.COPY_DST |
					window.GPUBufferUsage.STORAGE
				),
			});

		renderer.gpu_resources.push(tree_buffer);

		renderer.device.queue.writeBuffer
		(
			tree_buffer,
			0,
			tree_data,
			0,
			tree_data.length,
		);

		const tree_storage_block =
			new StorageBlock2
			(
				tree_buffer,
				3,
				tree_data.byteLength,
			);

		scene.makeDescriptorSet
		([ tree_storage_block, surface_uniform_block_camera ]);

		const surface_material =
			Material.getInstance
			(surface_material_addr, Material.ShaderUsage.GLSL_VULKAN, [ scene.descriptor_set ]);

		LOG(surface_material)

		const surface_object = Object.getInstance(surface_object_addr);

		surface_object.createBuffers();



		let time = Date.now();

		const [ ,, fps ] = document.querySelectorAll('.fps');

		let fps_counter = 0;

		renderer.loop_function = () =>
		{
			const command_encoder = renderer.device.createCommandEncoder();

			const context_texture = renderer._context.getCurrentTexture();

			renderer.render_pass_encoder =
				command_encoder.beginRenderPass
				({
					colorAttachments:
					[
						{
							view: context_texture.createView(),
							// GPUTextureView resolveTarget;

							loadValue: [ 1, 1, 1, 1 ],
							storeOp: 'store',
						},
					],
				});

			renderer.render_pass_encoder.setVertexBuffer
			(0, surface_object.position_buffer, 0, surface_object.original_struct.position_data.byteLength);

			scene.descriptor_set.use(0);

			surface_material.use();

			surface_object.draw2();

			renderer.render_pass_encoder.endPass();

			const command_buffer = command_encoder.finish();

			renderer.device.queue.submit([ command_buffer ]);



			if (Math.floor((Date.now() - time) * 0.001))
			{
				fps.innerHTML = fps_counter;

				fps_counter = 0;

				time = Date.now();
			}

			++fps_counter;
		};

		renderer.canvas.parentNode.style.display = 'block';

		renderer.startLoop();
	},
);
