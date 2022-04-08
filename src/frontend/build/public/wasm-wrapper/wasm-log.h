#ifndef __RDTY_WASM_WRAPPER_WASM_LOG__
#define __RDTY_WASM_WRAPPER_WASM_LOG__



#include <cstddef> // size_t
#include <cstdint>



extern "C" void console_log (size_t);
extern "C" void console_log_c (char);
extern "C" void console_log_s (const char*);
extern "C" void console_log_f (float);

inline void RDTY_WASM_WRAPPER_WASM_LOG (const size_t& x)
{
  console_log(x);
}

inline void RDTY_WASM_WRAPPER_WASM_LOG (const uint32_t& x)
{
  console_log(x);
}

inline void RDTY_WASM_WRAPPER_WASM_LOG (const char& x)
{
  console_log_c(x);
}

inline void RDTY_WASM_WRAPPER_WASM_LOG (const char* x)
{
  console_log_s(x);
}

inline void RDTY_WASM_WRAPPER_WASM_LOG (const float& x)
{
  console_log_f(x);
}

inline void RDTY_WASM_WRAPPER_WASM_LOG (const double& x)
{
  console_log_f(x);
}



#define LOG(x) RDTY_WASM_WRAPPER_WASM_LOG(x);



#endif
