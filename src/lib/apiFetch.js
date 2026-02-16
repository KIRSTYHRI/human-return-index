export async function apiFetch(path, options = {}) {
  const opts = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  };

  return fetch(path, opts);
}

export default apiFetch;
