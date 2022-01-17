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



extern void initOpengl (void);
extern void initVulkan (const size_t& = 0);



extern RDTY::RENDERERS::Renderer* renderer_native;

extern size_t render_flag;



std::thread* rendering_thread_handle {};

Napi::Value getOpenglVersionString (const Napi::CallbackInfo& info)
{
	return Napi::String::New(info.Env(), RDTY::OPENGL::RendererBase::test());
}

std::vector<size_t> vulkan_physical_device_indices {};

Napi::Value getVulkanVersionString (const Napi::CallbackInfo& info)
{
	std::map<std::string, size_t> physical_devices { RDTY::VULKAN::RendererBase::test() };

	Napi::Object result { Napi::Object::New(info.Env()) };

	for (const auto& [ name, handle ] : physical_devices)
	{
		vulkan_physical_device_indices.push_back(handle);

		result.Set(name, handle);
	}

	return result;
}

Napi::Value testRenderingThread (const Napi::CallbackInfo& info)
{
	return Napi::Boolean::New(info.Env(), rendering_thread_handle);
}

Napi::Value runRenderingThread (const Napi::CallbackInfo& info)
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
		rendering_thread_handle = new std::thread { initVulkan, vulkan_physical_device_indices[1] };
	}

	return Napi::Number::New(info.Env(), vulkan_physical_device_indices[1]);
}

void stopRenderingThread (const Napi::CallbackInfo& info)
{
	if (rendering_thread_handle)
	{
		render_flag = 0;

		rendering_thread_handle->join();

		render_flag = 1;
	}

	delete rendering_thread_handle;
}

Napi::Value getPixelDataStorageIsAllocated (const Napi::CallbackInfo& info)
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
	EXPORT_FUNCTION(runRenderingThread);
	EXPORT_FUNCTION_VOID(stopRenderingThread);
	EXPORT_FUNCTION(getPixelDataStorageIsAllocated);
	EXPORT_FUNCTION(getRendererSize);
	EXPORT_FUNCTION(getPixelDataStorage);
	EXPORT_FUNCTION(getOpenglVersionString);
	EXPORT_FUNCTION(getVulkanVersionString);
	// EXPORT_FUNCTION_VOID(rotateOrbitJs);

	return exports;
}

NODE_API_MODULE(node_api_test, Init)
