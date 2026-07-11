// /**
//  * Next.js Instrumentation Hook
//  * Runs once when the server starts. Polyfills browser APIs that some
//  * packages accidentally call during SSR (e.g. framer-motion, recharts).
//  */
// export async function register() {
//   if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.getItem !== "function") {
//     const _store: Record<string, string> = {};
//     globalThis.localStorage = {
//       getItem: (key: string) => _store[key] ?? null,
//       setItem: (key: string, value: string) => { _store[key] = String(value); },
//       removeItem: (key: string) => { delete _store[key]; },
//       clear: () => { Object.keys(_store).forEach((k) => delete _store[k]); },
//       key: (n: number) => Object.keys(_store)[n] ?? null,
//       get length() { return Object.keys(_store).length; },
//     } as Storage;
//   }

//   if (typeof globalThis.sessionStorage === "undefined" || typeof globalThis.sessionStorage.getItem !== "function") {
//     const _store: Record<string, string> = {};
//     globalThis.sessionStorage = {
//       getItem: (key: string) => _store[key] ?? null,
//       setItem: (key: string, value: string) => { _store[key] = String(value); },
//       removeItem: (key: string) => { delete _store[key]; },
//       clear: () => { Object.keys(_store).forEach((k) => delete _store[k]); },
//       key: (n: number) => Object.keys(_store)[n] ?? null,
//       get length() { return Object.keys(_store).length; },
//     } as Storage;
//   }
// }

export async function register() {}
