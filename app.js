// ====== 설정 ======
const ENDPOINT = "https://script.google.com/macros/s/AKfycbxiYmR8P9FbTU-ntIuaYPxKe02LIn4okh00tXNJGpcm8xpmLgUdck7Hq-x4JePdpfogTA/exec"; // 반드시 /exec 로 끝나는 URL

// ====== 유틸 ======
const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));
const nowISO = ()=>{ const d=new Date(), p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };

// ====== 드래프트 ======
const KEY_DRAFT = "consult_draft_v2";
function readDraft(){ try{return JSON.parse(localStorage.getItem(KEY_DRAFT)||"{}");}catch{return{}} }
function saveDraft(form){
  const fd=new FormData(form); const o=Object.fromEntries(fd.entries());
  delete o.consent; localStorage.setItem(KEY_DRAFT, JSON.stringify(o));
}
function applyDraft(form){
  const d=readDraft();
  Object.entries(d).forEach(([k,v])=>{
    const el=form.elements[k]; if(!el) return;
    if(el.type==='radio') $$(`input[name="${k}"]`).forEach(r=>r.checked=(r.value===v));
    else el.value=v;
  });
}

// ====== 폼 로직 ======
function validate(form){
  const must=["studentName","guardianName","phone","topic","message","consent"];
  for(const name of must){
    const el=form.elements[name];
    if(el?.type==='checkbox'){ if(!el.checked) return false; }
    else if(!el?.value?.trim()) return false;
  }
  return true;
}
function collect(form){
  const fd=new FormData(form); const o=Object.fromEntries(fd.entries());
  o.priority ||= "보통"; o.createdAt=nowISO(); return o;
}
function previewText(o){
  return [
    `학생: ${o.studentName}${o.studentId?` (${o.studentId})`:""}`,
    `보호자: ${o.guardianName}`,
    `연락처: ${o.phone}${o.email?` / ${o.email}`:""}`,
    `주제/긴급도: ${o.topic} / ${o.priority}`,
    `희망 연락: ${o.preferredTime || "-"}`,
    "", "상세 내용", "----------", o.message
  ].join("\n");
}

async function postToSheet(payload){
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      // ★ CORS/프리플라이트 회피용: 폼형식으로 보냄
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: new URLSearchParams({
      ...payload,
      origin: location.origin,
      userAgent: navigator.userAgent
    })
  });
  const text = await res.text();
  console.log("RAW response:", text, "status:", res.status);
  try { return JSON.parse(text); } 
  catch { return { ok:false, error:"INVALID_JSON", raw:text, status:res.status }; }
}

function showDone(token){
  const sec=$("#afterSubmit");
  const base=location.origin+location.pathname.replace(/index\.html?$/,'');
  const url=`${base}status.html?token=${encodeURIComponent(token)}`;
  $("#statusLink").textContent=url;
  $("#copyLinkBtn").onclick=async()=>{ await navigator.clipboard.writeText(url); alert("상태조회 링크를 복사했어요."); };
  $("#shareBtn").onclick=async()=>{
    if(navigator.share){ try{ await navigator.share({title:"상담 상태조회", text:"내 상담 상태 확인 링크", url}); }catch{} }
    else{ await navigator.clipboard.writeText(url); alert("공유 API 미지원 기기라 복사로 대체했어요."); }
  };
  sec.classList.remove("hidden"); sec.scrollIntoView({behavior:"smooth"});
}

// ====== 초기화 ======
window.addEventListener("DOMContentLoaded", ()=>{
  const form=$("#consultForm");
  const errorEl=$("#formError");
  applyDraft(form);
  form.addEventListener("input", ()=>saveDraft(form));
  $("#resetDraftBtn").addEventListener("click", ()=> localStorage.removeItem(KEY_DRAFT));

  // ★ (1) “제출” 버튼을 눌러도 기본 제출 막고 → 미리보기로 유도
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    errorEl.textContent="";
    if(!validate(form)){ errorEl.textContent="필수 항목을 확인해 주세요."; return; }
    $("#previewContent").textContent = previewText(collect(form));

    // 다이얼로그 미지원(iOS 구형 사파리 등) 대비
    const dlg=$("#previewDialog");
    if(dlg?.showModal){ dlg.showModal(); }
    else{
      // ★ 폴백: confirm으로 바로 제출
      if(confirm("이 내용으로 제출할까요?")) submitForReal();
    }
  });

  // 기존 미리보기 버튼은 그대로 유지
  $("#previewBtn").addEventListener("click", ()=>{
    errorEl.textContent="";
    if(!validate(form)){ errorEl.textContent="필수 항목을 확인해 주세요."; return; }
    $("#previewContent").textContent = previewText(collect(form));
    const dlg=$("#previewDialog");
    if(dlg?.showModal){ dlg.showModal(); }
    else{ if(confirm("이 내용으로 제출할까요?")) submitForReal(); }
  });

  // ★ (2) 실제 전송 로직을 함수로 분리해서, 둘 다 여기로 오게
  async function submitForReal(){
    const obj=collect(form);
    // 전송 중 버튼 잠금(중복 제출 방지)
    const confirmBtn=$("#confirmSubmit"); confirmBtn?.setAttribute("disabled","true");
    try{
      const r=await postToSheet(obj);
      if(!r.ok || !r.token) throw new Error(r.error || "전송 실패");
      form.reset(); localStorage.removeItem(KEY_DRAFT);
      $("#previewDialog")?.close();
      showDone(r.token);
    }catch(err){
      errorEl.textContent="전송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      console.error(err);
    }finally{
      confirmBtn?.removeAttribute("disabled");
    }
  }

  // 미리보기 다이얼로그에서 “이 내용으로 제출”
  $("#confirmSubmit").addEventListener("click", (e)=>{ e.preventDefault(); submitForReal(); });
});






