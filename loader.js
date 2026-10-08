// Loads data.enc and decrypts it in the browser. The key travels only in the link's #fragment
// (never sent to GitHub) and is then kept in localStorage on this phone.
window.NS_loadData = async function () {
  const KEY = "netspot-key";
  const m = location.hash.match(/k=([A-Za-z0-9_-]{43})/);
  if (m) { try { localStorage.setItem(KEY, m[1]); } catch (e) {} history.replaceState(null, "", location.pathname); }
  let k = m ? m[1] : null;
  if (!k) { try { k = localStorage.getItem(KEY); } catch (e) {} }
  const fail = (title, msg) => {
    const el = document.getElementById("gate");
    el.querySelector("h2").textContent = title; el.querySelector("p").textContent = msg; el.hidden = false;
    return null;
  };
  if (!k) return fail("ต้องเปิดจากลิงก์ที่ได้รับ", "แอปนี้เปิดได้เฉพาะจากลิงก์ที่เจ้าของเรือส่งให้ เปิดลิงก์นั้นหนึ่งครั้ง แล้วครั้งต่อไปกดไอคอนบนหน้าจอโฮมได้เลย");
  let buf;
  try { const r = await fetch("data.enc", { cache: "no-cache" }); if (!r.ok) throw 0; buf = new Uint8Array(await r.arrayBuffer()); }
  catch (e) { return fail("โหลดข้อมูลไม่ได้", "ยังไม่มีข้อมูลในเครื่อง ลองเปิดอีกครั้งตอนมีสัญญาณ"); }
  try {
    const raw = Uint8Array.from(atob(k.replace(/-/g, "+").replace(/_/g, "/") + "="), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, key, buf.slice(12));
    const text = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    return JSON.parse(text);
  } catch (e) {
    try { localStorage.removeItem(KEY); } catch (e2) {}
    return fail("ลิงก์หมดอายุ", "กุญแจในลิงก์นี้ใช้ไม่ได้แล้ว ขอลิงก์ใหม่จากเจ้าของเรือ");
  }
};
