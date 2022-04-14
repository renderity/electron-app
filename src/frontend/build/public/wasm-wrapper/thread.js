const IDLE_FUNCTION = () => 0;



class WasmWrapper
{
	static text_decoder = new TextDecoder('utf-8');

	static convertUint8ArrayToDomString (uint8_array)
	{
		return WasmWrapper.text_decoder.decode(uint8_array.slice());
	}

	constructor ()
	{
		this.memory_views =
		{
			UI8: null,
		};
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

	CString2 (addr)
	{
		return WasmWrapper.convertUint8ArrayToDomString(this.memory_views.UI8.subarray(addr, addr + this.CStringLen(addr)));
	}

	async init (code, memory)
	{
		this.code = code;
		this.memory = memory;

		const wasm_module = await WebAssembly.compile(code);

		const wasm_module_instance =
			await WebAssembly.instantiate
			(
				wasm_module,

				{
					env:
						Object.assign
						(
							{
								memory,

								__multi3: IDLE_FUNCTION,
								console_log: (x) => console.log('WASM:', x),
								console_log_c: (x) => console.log('WASM:', String.fromCharCode(x)),
								console_log_s: (x) => console.log('WASM:', this.CString2(x)),
								console_log_f: (x) => console.log('WASM:', x),
								date_now: () => Date.now(),
							},
						),

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

		this.exports = wasm_module_instance.exports;

		const { buffer } = memory;

		this.memory_views.UI8 = new Uint8Array(buffer);
	}
}
