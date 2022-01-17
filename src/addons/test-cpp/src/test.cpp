#define EXPORT_FUNCTION(function_name) exports[#function_name] = Napi::Function::New<Callback>(env, function_name);
#define EXPORT_FUNCTION_VOID(function_name) exports[#function_name] = Napi::Function::New<VoidCallback>(env, function_name);
#define EXPORT_OBJECT(name) exports[#name] = name;



#include <cstddef>
#include <cstdint>
#include <cstring>
#include <string>
#include <vector>
#include <map>
#include <thread>

#include "napi.h"

#include "renderity/renderers/src/base/renderer.h"
#include "renderity/renderers/src/opengl/opengl.h"
#include "renderity/renderers/src/vulkan/vulkan.h"



extern "C" void constructRenderityWrappers (void);

extern void initOpengl (void);
extern void initVulkan (const size_t& = 0);



extern RDTY::RENDERERS::Renderer* renderer_native;

extern size_t render_flag;



std::thread* rendering_thread_handle {};

Napi::Value getApiInfoOpengl (const Napi::CallbackInfo& info)
{
	return Napi::String::New(info.Env(), RDTY::OPENGL::RendererBase::test());
}

Napi::Value getApiInfoVulkan (const Napi::CallbackInfo& info)
{
	std::map<std::string, size_t> physical_devices { RDTY::VULKAN::RendererBase::test() };

	Napi::Object result { Napi::Object::New(info.Env()) };

	for (const auto& [ name, handle ] : physical_devices)
	{
		result.Set(name, handle);
	}

	return result;
}

Napi::Value testRenderingThread (const Napi::CallbackInfo& info)
{
	return Napi::Boolean::New(info.Env(), rendering_thread_handle);
}

void _constructRenderityWrappers (const Napi::CallbackInfo& info)
{
	constructRenderityWrappers();
}

void runRenderingThread (const Napi::CallbackInfo& info)
{
	if (rendering_thread_handle)
	{
		render_flag = 0;

		rendering_thread_handle->join();

		render_flag = 1;
	}

	std::string api = info[0].As<Napi::String>().Utf8Value();

	if (api == "opengl")
	{
		rendering_thread_handle = new std::thread { initOpengl };
	}
	else if (api == "vulkan")
	{
		size_t vulkan_physical_device_index = (size_t) info[1].As<Napi::Number>().Uint32Value();

		rendering_thread_handle = new std::thread { initVulkan, vulkan_physical_device_index };
	}
}

void terminateRenderingThread (const Napi::CallbackInfo& info)
{
	if (rendering_thread_handle)
	{
		render_flag = 0;

		rendering_thread_handle->join();

		render_flag = 1;
	}

	delete rendering_thread_handle;

	rendering_thread_handle = nullptr;
}

Napi::Value testPixelDataStorageIsAllocated (const Napi::CallbackInfo& info)
{
	return Napi::Boolean::New(info.Env(), renderer_native && renderer_native->pixel_data);
}

Napi::Value getRendererSize (const Napi::CallbackInfo& info)
{
	Napi::Object renderer_size { Napi::Object::New(info.Env()) };

	renderer_size["renderer_width"] = Napi::Number::New(info.Env(), renderer_native->wrapper->width);
	renderer_size["renderer_height"] = Napi::Number::New(info.Env(), renderer_native->wrapper->height);

	return renderer_size;
}

Napi::Value getPixelDataStorage (const Napi::CallbackInfo& info)
{
	Napi::ArrayBuffer arraybuffer
	{
		Napi::ArrayBuffer::New
		(
			info.Env(),
			renderer_native->pixel_data,
			renderer_native->wrapper->width * renderer_native->wrapper->height * 4
		),
	};

	Napi::TypedArrayOf<uint8_t> uint8_clamped_array
	{
		Napi::TypedArrayOf<uint8_t>::New
		(
			info.Env(),
			arraybuffer.ByteLength(),
			arraybuffer,
			0,
			napi_uint8_clamped_array
		),
	};

	return uint8_clamped_array;
}

// void rotateOrbitJs (const CallbackInfo& info)
// {
// 	rotateOrbit(info[0].As<Number>(), info[1].As<Number>());
// }

Napi::Object Init (Napi::Env env, Napi::Object exports)
{
	using Callback = Napi::Value (*) (const Napi::CallbackInfo&);
	using VoidCallback = void (*) (const Napi::CallbackInfo&);

	EXPORT_FUNCTION(testRenderingThread);
	EXPORT_FUNCTION_VOID(_constructRenderityWrappers);
	EXPORT_FUNCTION_VOID(runRenderingThread);
	EXPORT_FUNCTION_VOID(terminateRenderingThread);
	EXPORT_FUNCTION(testPixelDataStorageIsAllocated);
	EXPORT_FUNCTION(getRendererSize);
	EXPORT_FUNCTION(getPixelDataStorage);
	EXPORT_FUNCTION(getApiInfoOpengl);
	EXPORT_FUNCTION(getApiInfoVulkan);
	// EXPORT_FUNCTION_VOID(rotateOrbitJs);

	return exports;
}

NODE_API_MODULE(node_api_test, Init)
