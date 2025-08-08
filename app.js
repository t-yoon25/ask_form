// ====== 설정 ======
const ENDPOINT = "https://script.google.com/macros/s/AKfycbz63amZ1zT2uSxD8PESsO8PEU4qVtF02oQlFpCVfU7HljgrqWV1yG53XjD5M18b7Lmtsw/exec"; // ★ Apps Script 배포 URL로 교체
const KEY_DRAFT = "consult_draft_v2";

// ====== 유틸 ======
const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));
const nowISO = ()=> {
  const d=new Date(), p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ====== 드래프트 저장 ======
function readDraft(){ try{return JSON.parse(localStorage.getItem(KEY_DRAFT)||"{}");}catch{return{}} }
function saveDraft(form){
  const fd = new FormData(form);
  const o = Object.fromEntries(fd.entries());
  delete o.consent; // 동의는 매번 확인
  localStorage.setItem(KEY_DRAFT, JSON.stringify(o));
}
function applyDraft(form){
  const d = readDraft();
  Object.entries(d).forEach(([k,v])=>{
    const el = form.elements[k];
    if(!el) return;
    if(el.type==='radio') $$(`input[name="${k}"]`).forEach(r=>r.checked=(r.value===v));
    else el.value = v;
  });
}

// ====== 폼 로직 ======
function validate(form){
  const must = ["studentName","guardianName","phone","topic","message","consent"];
  for(const name of must){
    const el = form.elements[name];
    if(el?.type==='checkbox'){ if(!el.checked) return false; }
    else if(!el?.value?.trim()) return false;
  }
  return true;
}
function collect(form){
  const fd = new FormData(form);
  const o = Object.fromEntries(fd.entries());
  o.priority ||= "보통";
  o.createdAt = nowISO();
  return o;
}
function previewText(o){
  return [
    `학생: ${o.studentName}${o.studentId?` (${o.studentId})`:""}`,
    `보호자: ${o.guardianName}`,
    `연락처: ${o.phone}${o.email?` / ${o.email}`:""}`,
    `주제/긴급도: ${o.topic} / ${o.priority}`,
    `희망 연락: ${o.preferredTime || "-"}`,
    "",
    "상세 내용",
    "----------",
    o.message
  ].join("\n");
}

async function postToSheet(payload){
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      ...payload,
      origin: location.origin,
      userAgent: navigator.userAgent
    })
  });
  return res.json();
}

function showDone(token){
  const sec = $("#afterSubmit");
  const url = `${location.origin}${location.pathname.replace(/index\.html?$/,'')}status.html?token=${encodeURIComponent(token)}`;
  $("#statusLink").textContent = url;
  $("#copyLinkBtn").onclick = async ()=>{
    await navigator.clipboard.writeText(url);
    alert("상태조회 링크를 복사했어요. 카톡이나 문자에 붙여넣어 보관하세요.");
  };
  $("#shareBtn").onclick = async ()=>{
    if(navigator.share){
      try{
        await navigator.share({ title:"상담 상태조회", text:"내 상담 상태 확인 링크", url });
      }catch{}
    }else{
      await navigator.clipboard.writeText(url);
      alert("이 기기는 공유 API를 지원하지 않아 복사로 대체했어요.");
    }
  };
  sec.classList.remove("hidden");
  sec.scrollIntoView({behavior:"smooth"});
}

// ====== 초기화 ======
window.addEventListener("DOMContentLoaded", ()=>{
  const form = $("#consultForm");
  applyDraft(form);

  form.addEventListener("input", ()=> saveDraft(form));

  $("#resetDraftBtn").addEventListener("click", ()=>{
    localStorage.removeItem(KEY_DRAFT);
  });

  $("#previewBtn").addEventListener("click", ()=>{
    $("#formError").textContent = "";
    if(!validate(form)){ $("#formError").textContent="필수 항목을 확인해 주세요."; return; }
    $("#previewContent").textContent = previewText(collect(form));
    $("#previewDialog").showModal();
  });

  $("#confirmSubmit").addEventListener("click", async (e)=>{
    e.preventDefault();
    const obj = collect(form);
    try{
      const r = await postToSheet(obj);
      if(!r.ok || !r.token) throw new Error(r.error || "전송 실패");
      form.reset();
      localStorage.removeItem(KEY_DRAFT);
      $("#previewDialog").close();
      showDone(r.token);
    }catch(err){
      $("#formError").textContent = "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      console.error(err);
    }
  });
});



