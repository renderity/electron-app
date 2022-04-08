/**
 * Using TypedArray.subarray() is preferred
 * when accessing to data
 * to avoid extra memory allocation.
 *
 * Strange std::string behavior:
 * if std::string data length <=11, std::string object address is the same with its data;
 * if >11, std::string object name stores address of beginning of the data.
 * So in second case one can use WasmWrapper::CString method to get string bytes.
 * Maybe it's not related to data length, but to dynamic memory allocation.
 *
 *
 *
 * If memory is shared then memory growing is not allowed
 * and maximum memory size is specified at compilation.
 *
 *
 *
 * Passing argument by reference works as passing by pointer.
 * So, functions with reference parameters expect address instead of value.
 *
 *
 *
 * TODO: determination capabiity of what wasm memory type is being used.
 */



//  import Base from './base';



const IDLE_FUNCTION = () => 0;



export default class WasmWrapper
{
	static text_decoder = new TextDecoder('utf-8');
	static text_encoder = new TextEncoder();

	// static convertUint8ArrayToDomString (uint8_array)
	// {
	// 	return WasmWrapper.text_decoder.decode(uint8_array);
	// }

	// Version for shared buffer.
	// Decoding views of shared buffer is not allowed.
	static convertUint8ArrayToDomString (uint8_array)
	{
		return WasmWrapper.text_decoder.decode(uint8_array.slice());
	}

	static convertDomStringToUint8Array (text)
	{
		return WasmWrapper.text_encoder.encode(text);
	}

	constructor ()
	{
		const wasm_wrapper = this;



		this.ADDR_SIZE = 0;
		this.SIZE_SIZE = 0;
		this.UINT32_SIZE = 0;
		this.FLOAT_SIZE = 0;

		this.memory_views =
		{
			UI8: null,
			I8: null,
			UI16: null,
			I16: null,
			UI32: null,
			I32: null,
			// TODO: add 64 bit types.
			F32: null,
			F64: null,
		};



		this.Thread = class Thread
		{
			constructor (function_name, _data = [], js_loop)
			{
				// Should be private.
				this.promise =
					new Promise
					(
						(resolve) =>
						{
							const blob_url =
								URL.createObjectURL
								(
									new Blob
									(
										[
											`onmessage =
												async (message) =>
												{
													const WasmWrapper =
														(await import('http://localhost:8080/public/wasm-wrapper/index.js')).default;

													const wasm_wrapper = new WasmWrapper();

													const { code, memory, _data } = message.data;

													await wasm_wrapper.init(code, memory, false);

													${ js_loop ? `setInterval(wasm_wrapper.exports.${ function_name }, 0, ..._data);` : `wasm_wrapper.exports.${ function_name }(..._data);` }

													postMessage(true);
												};`,
										],

										{ type: 'application/javascript' },
									),
								);

							this.worker = new Worker(blob_url);

							URL.revokeObjectURL(blob_url);

							this.worker.onmessage = resolve;

							const { code, memory } = wasm_wrapper;

							this.worker.postMessage({ code, memory, _data });
						},
					);
			}

			async join ()
			{
				await this.promise;

				this.worker.terminate();
			}

			terminate ()
			{
				this.worker.terminate();
			}
		};
	}

	Char (addr, length = 1)
	{
		return this.memory_views.UI8.subarray(addr, addr + length);
	}

	Uint8 (addr, length = 1)
	{
		return this.memory_views.UI8.subarray(addr, addr + length);
	}

	Addr (addr, length = 1)
	{
		const _addr = addr / this.ADDR_SIZE;

		return this.memory_views.UI32.subarray(_addr, _addr + length);
	}

	Addr2 (name, length = 1)
	{
		return this.Addr(this.exports[name].value, length);
	}

	Uint32 (addr, length = 1)
	{
		const _addr = addr / this.UINT32_SIZE;

		return this.memory_views.UI32.subarray(_addr, _addr + length);
	}

	// size_t may be non UI32, so need to dinamically define view for it.
	Size (addr, length = 1)
	{
		const _addr = addr / this.SIZE_SIZE;

		return this.memory_views.UI32.subarray(_addr, _addr + length);
	}

	Float (addr, length = 1)
	{
		const _addr = addr / this.FLOAT_SIZE;

		return this.memory_views.F32.subarray(_addr, _addr + length);
	}

	CStringLen (addr)
	{
		const _addr = addr;

		for (let vend = 0; ; ++vend)
		{
			if (this.Char(_addr + vend)[0] === 0)
			{
				return vend;
			}
		}
	}

	CString (addr)
	{
		return this.memory_views.UI8.subarray(addr, addr + this.CStringLen(addr));
	}

	CString2 (addr)
	{
		return WasmWrapper.convertUint8ArrayToDomString(this.memory_views.UI8.subarray(addr, addr + this.CStringLen(addr)));
	}

	StdString (addr)
	{
		/**
		 * 	These funcions must be defined:

		 *	extern "C" void* RDTY_WASM_WRAPPER_getStdStringData (std::string& s)
		 *	{
		 *		return s.data();
		 *	}
		 *
		 *	extern "C" size_t RDTY_WASM_WRAPPER_getStdStringSize (std::string& s)
		 *	{
		 *		return s.size();
		 *	}
		 */

		const result =
			this.Char
			(
				this.exports.RDTY_WASM_WRAPPER_getStdStringData(addr),

				this.exports.RDTY_WASM_WRAPPER_getStdStringSize(addr),
			);

		return result;
	}

	/**
	 * 	These funcions must be defined:

	 *	extern "C" void* RDTY_WASM_WRAPPER_getStdVectorData (std::vector<int>& v)
	 *	{
	 *		return v.data();
	 *	}
	 *
	 *	extern "C" size_t RDTY_WASM_WRAPPER_getStdVectorSize (std::vector<int>& v)
	 *	{
	 *		return v.size();
	 *	}
	 */

	StdVector (addr, type)
	{
		const result =
			this[type]
			(
				this.exports.RDTY_WASM_WRAPPER_getStdVectorData(addr),

				this.exports.RDTY_WASM_WRAPPER_getStdVectorSize(addr),
			);

		return result;
	}

	StdVectorUint8 (addr)
	{
		const result =
			this.Uint8
			(
				this.exports.RDTY_WASM_WRAPPER_getStdVectorData(addr),

				this.exports.RDTY_WASM_WRAPPER_getStdVectorSize(addr),
			);

		return result;
	}

	StdVectorSize (addr)
	{
		const result =
			this.Size
			(
				this.exports.RDTY_WASM_WRAPPER_getStdVectorData(addr),

				this.exports.RDTY_WASM_WRAPPER_getStdVectorSize(addr),
			);

		return result;
	}

	StdVectorUint32 (addr)
	{
		const result =
			this.Uint32
			(
				this.exports.RDTY_WASM_WRAPPER_getStdVectorData(addr),

				this.exports.RDTY_WASM_WRAPPER_getStdVectorSize(addr),
			);

		return result;
	}

	StdVectorFloat (addr)
	{
		const result =
			this.Float
			(
				this.exports.RDTY_WASM_WRAPPER_getStdVectorData(addr),

				this.exports.RDTY_WASM_WRAPPER_getStdVectorSize(addr),
			);

		return result;
	}

	StdVectorAddr (addr)
	{
		const result =
			this.Addr
			(
				this.exports.RDTY_WASM_WRAPPER_getStdVectorData(addr),

				this.exports.RDTY_WASM_WRAPPER_getStdVectorSize(addr),
			);

		return result;
	}

	Class (name)
	{
		const wasm_wrapper = this;



		class _Class
		{
			static name = name;

			static overloaded = {};



			constructor (input)
			{
				if (typeof input === 'number')
				{
					this.addr = input;
				}
				else if (typeof input === 'string')
				{
					[ this.addr ] = wasm_wrapper.Addr2(input);
				}
			}
		}

		global.Object.keys(this.exports_demangled)
			.filter
			(
				(member_name) => member_name.includes(name),
			)
			.forEach
			(
				(member_name) =>
				{
					let member_name_trimmed = member_name.replace(`${ name }::`, '').replace(/\((.*)+/g, '');

					// Some objects may be exported twice from wasm. TODO: why does it occur?
					const wasm_object =
						wasm_wrapper.exports_demangled[member_name][0] || wasm_wrapper.exports_demangled[member_name];

					if (typeof wasm_object === 'function')
					{
						const parameters =
							member_name.match(/\((.*)+/g)?.[0].replace(/\(|( )|\)/g, '').split(',');

						if (parameters.length && parameters[0] === '')
						{
							parameters.length = 0;
						}

						// static function
						if (parameters.length === wasm_object.length)
						{
							if (_Class[member_name_trimmed])
							{
								if (!_Class.overloaded[member_name_trimmed])
								{
									_Class.overloaded[member_name_trimmed] = 0;
								}

								++_Class.overloaded[member_name_trimmed];

								member_name_trimmed += `_o${ _Class.overloaded[member_name_trimmed] }`;
							}

							_Class[member_name_trimmed] = wasm_object;
						}

						// non-static function
						else
						{
							if (_Class.prototype[member_name_trimmed])
							{
								if (!_Class.overloaded[member_name_trimmed])
								{
									_Class.overloaded[member_name_trimmed] = 0;
								}

								++_Class.overloaded[member_name_trimmed];

								member_name_trimmed += `_o${ _Class.overloaded[member_name_trimmed] }`;
							}

							_Class.prototype[member_name_trimmed] =
								function (...args)
								{
									return wasm_object(this.addr, ...args);
								};
						}
					}
					else if (typeof wasm_object === 'object')
					{
						_Class[member_name_trimmed] = wasm_object;
					}
				},
			);



		return _Class;
	}

	updateStdVectorData (addr, type, _data)
	{
		this.exports.RDTY_WASM_WRAPPER_StdVector_resize(addr, _data.length);

		this.StdVector(addr, type).set(_data);
	}

	waitThread (Worker, _data)
	{
		const promise =
			new Promise
			(
				(resolve) =>
				{
					const worker = new Worker();

					worker.onmessage = (msg) =>
					{
						console.log(msg.data)

						worker.terminate();

						resolve();
					};

					worker.postMessage({ wasm_code: this.code, wasm_memory: this.memory, ..._data });
				},
			);

		return promise;
	}

	waitThread2 (_function, _data)
	{
		const promise =
			new Promise
			(
				(resolve) =>
				{
					const blob_url =
						URL.createObjectURL
						(
							new Blob
							(
								[ _function ],

								{ type: 'application/javascript' },
							),
						);

					const worker = new Worker(blob_url);

					URL.revokeObjectURL(blob_url);

					worker.onmessage = () =>
					{
						worker.terminate();

						resolve();
					};

					worker.postMessage({ wasm_code: this.code, wasm_memory: this.memory, _data });
				},
			);

		return promise;
	}

	waitThread3 (function_name, _data)
	{
		const promise =
			new Promise
			(
				(resolve) =>
				{
					const blob_url =
						URL.createObjectURL
						(
							new Blob
							(
								[
									`onmessage =
										async (message) =>
										{
											const WasmWrapper =
												(await import('http://localhost:8080/public/wasm-wrapper/index.js')).default;

											const wasm_wrapper = new WasmWrapper();

											const { wasm_code, wasm_memory, _data } = message.data;

											await wasm_wrapper.init(wasm_code, wasm_memory, false);



											wasm_wrapper.exports.${ function_name }(..._data);



											postMessage(true);
										};`,
								],

								{ type: 'application/javascript' },
							),
						);

					const worker = new Worker(blob_url);

					URL.revokeObjectURL(blob_url);

					worker.onmessage = () =>
					{
						worker.terminate();

						resolve();
					};

					const { code, memory } = this;

					worker.postMessage({ code, memory, _data });
				},
			);

		return promise;
	}

	// // Why not working in workers? Because of malloc?
	// demangle (mangled_name)
	// {
	// 	const mangled_name_length = mangled_name.length;
	// 	const mangled_name_addr = this.exports.RDTY_WASM_WRAPPER_malloc(mangled_name_length);

	// 	this.memory_views.UI8.set(WasmWrapper.convertDomStringToUint8Array(mangled_name), mangled_name_addr);

	// 	const demangled_name =
	// 		WasmWrapper.convertUint8ArrayToDomString
	// 		(this.CString(this.exports.RDTY_WASM_WRAPPER_demangleCxxName(mangled_name_addr)));

	// 	this.exports.RDTY_WASM_WRAPPER_free(mangled_name_addr);

	// 	return demangled_name;
	// }

	demangle (name, name_addr)
	{
		this.memory_views.UI8.set(WasmWrapper.convertDomStringToUint8Array(name), name_addr);

		const demangled_name =
			WasmWrapper.convertUint8ArrayToDomString
			(this.CString(this.exports.RDTY_WASM_WRAPPER_demangleCxxName(name_addr)))
				.replace(/, /g, ',');

		return demangled_name;
	}

	async init (code, memory, demangle = true, custom_imports)
	{
		this.code = code;
		this.memory = memory;

		const wasm_module = await WebAssembly.compile(code);

		console.log(wasm_module);

		// this.module = wasm_module;

		const wasm_module_instance =
			await WebAssembly.instantiate
			// await WebAssembly.instantiateStreaming
			(
				wasm_module,

				{
					env:
						Object.assign
						(
							{
								__memory_base: 0,
								__table_base: 0,
								// memory: this.memory,
								memory,
								// memory: memory ? null : this.memory,

								// sin: Math.sin,
								// cos: Math.cos,
								// tan: Math.tan,

								// memmove (dst, src, len)
								// {
								// 	return (_this.memory_views.UI8.copyWithin(dst, src, src + len), dst);
								// },

								// memcpy (dst, src, len)
								// {
								// 	return (_this.memory_views.UI8.copyWithin(dst, src, src + len), dst);
								// },

								// // rename to memnull
								// zero (dst)
								// {
								// 	_this.memory_views.UI8.set(ZERO_64, dst);
								// },

								// // new
								// // Need to be hardly refined!
								// _Znwm (allocated_byte_count)
								// {
								// 	const result = _this.exports.__heap_base + _this.heap_ptr;

								// 	console.log('new', result, allocated_byte_count, _this.heap_ptr)

								// 	_this.heap_ptr += allocated_byte_count;

								// 	return result;
								// },

								// memset: IDLE_FUNCTION,
								// printf: IDLE_FUNCTION,
								// putchar: IDLE_FUNCTION,

								// _ZdlPv: IDLE_FUNCTION, // delete
								// _ZSt20__throw_length_errorPKc: IDLE_FUNCTION,
								// _ZSt17__throw_bad_allocv: () => console.log('_ZSt17__throw_bad_allocv'),
								// __cxa_atexit: IDLE_FUNCTION,

								__multi3: IDLE_FUNCTION,
								console_log: (x) => console.log('WASM:', x),
								console_log_c: (x) => console.log('WASM:', String.fromCharCode(x)),
								console_log_s: (x) => console.log('WASM:', this.CString2(x)),
								console_log_f: (x) => console.log('WASM:', x),
								date_now: () => Date.now(),
							},

							custom_imports,
						),

					// TODO: learn what is wasi_snapshot_preview1.
					wasi_snapshot_preview1:
					{
						fd_seek: IDLE_FUNCTION,
						fd_write: IDLE_FUNCTION,
						fd_close: IDLE_FUNCTION,
						fd_fdstat_get: IDLE_FUNCTION,
						fd_advise: IDLE_FUNCTION,
						fd_allocate: IDLE_FUNCTION,
						fd_datasync: IDLE_FUNCTION,
						fd_fdstat_set_flags: IDLE_FUNCTION,
						fd_fdstat_set_rights: IDLE_FUNCTION,
						fd_filestat_get: IDLE_FUNCTION,
						fd_filestat_set_size: IDLE_FUNCTION,
						fd_filestat_set_times: IDLE_FUNCTION,
						fd_pread: IDLE_FUNCTION,
						fd_prestat_get: IDLE_FUNCTION,
						fd_prestat_dir_name: IDLE_FUNCTION,
						fd_pwrite: IDLE_FUNCTION,
						fd_read: IDLE_FUNCTION,
						fd_readdir: IDLE_FUNCTION,
						fd_renumber: IDLE_FUNCTION,
						fd_sync: IDLE_FUNCTION,
						fd_tell: IDLE_FUNCTION,

						path_create_directory: IDLE_FUNCTION,
						path_filestat_get: IDLE_FUNCTION,
						path_filestat_set_times: IDLE_FUNCTION,
						path_link: IDLE_FUNCTION,
						path_open: IDLE_FUNCTION,
						path_readlink: IDLE_FUNCTION,
						path_remove_directory: IDLE_FUNCTION,
						path_rename: IDLE_FUNCTION,
						path_symlink: IDLE_FUNCTION,
						path_unlink_file: IDLE_FUNCTION,
						poll_oneoff: IDLE_FUNCTION,
						proc_raise: IDLE_FUNCTION,
						sched_yield: IDLE_FUNCTION,
						random_get: IDLE_FUNCTION,
						sock_recv: IDLE_FUNCTION,
						sock_send: IDLE_FUNCTION,
						sock_shutdown: IDLE_FUNCTION,

						proc_exit: IDLE_FUNCTION,

						clock_time_get: IDLE_FUNCTION,

						args_get: IDLE_FUNCTION,
						args_sizes_get: IDLE_FUNCTION,
						environ_get: IDLE_FUNCTION,
						environ_sizes_get: IDLE_FUNCTION,
						clock_res_get: IDLE_FUNCTION,
					},
				},
			);

		console.log(wasm_module_instance);

		this.exports = wasm_module_instance.exports;

		this.ADDR_SIZE = this.exports.RDTY_WASM_WRAPPER_sizeof(0);
		this.SIZE_SIZE = this.exports.RDTY_WASM_WRAPPER_sizeof(1);
		this.UINT32_SIZE = this.exports.RDTY_WASM_WRAPPER_sizeof(2);
		this.FLOAT_SIZE = this.exports.RDTY_WASM_WRAPPER_sizeof(3);

		// imported || exported
		const { buffer } = memory || wasm_module_instance.exports.memory;

		this.memory_views.UI8 = new Uint8Array(buffer);
		this.memory_views.I8 = new Int8Array(buffer);
		this.memory_views.UI16 = new Uint16Array(buffer);
		this.memory_views.I16 = new Int16Array(buffer);
		this.memory_views.UI32 = new Uint32Array(buffer);
		this.memory_views.I32 = new Int32Array(buffer);
		this.memory_views.F32 = new Float32Array(buffer);
		this.memory_views.F64 = new Float64Array(buffer);



		if (demangle)
		{
			const demangled_name_max_length = 1024;
			const demangled_name_addr = this.exports.RDTY_WASM_WRAPPER_malloc(demangled_name_max_length);

			this.exports_demangled =
				Object.keys(this.exports)
					.reduce
					(
						(exports_demangled, _name) =>
						{
							if (_name.startsWith('_Z'))
							{
								const name = `${ _name }\0`;

								const demangled_name = this.demangle(name, demangled_name_addr);

								if (exports_demangled[demangled_name])
								{
									if (Array.isArray(exports_demangled[demangled_name]))
									{
										exports_demangled[demangled_name].push(this.exports[_name]);

										return exports_demangled;
									}

									const first_entry = exports_demangled[demangled_name];

									exports_demangled[demangled_name] = [ first_entry, this.exports[_name] ];

									return exports_demangled;
								}

								exports_demangled[demangled_name] = this.exports[_name];
							}

							return exports_demangled;
						},

						{},
					);

			this.exports.RDTY_WASM_WRAPPER_free(demangled_name_addr);

			console.log(this.exports_demangled);
		}
	}
}
