const BASE = "/api";

export async function get(path) {
  const r = await fetch(BASE + path);
  return r.json();
}

export async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function put(path, body) {
  const r = await fetch(BASE + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function del(path) {
  const r = await fetch(BASE + path, { method: "DELETE" });
  return r.json();
}
