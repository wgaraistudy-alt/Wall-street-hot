<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>월스트리트 핫! 대본</title>
<!-- 아이폰 홈 화면에 추가하면 앱처럼 전체화면으로 열림 -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
<meta name="apple-mobile-web-app-title" content="월스트리트 핫" />
<style>
  :root {
    --bg: #0b0f14;
    --card: #131a22;
    --accent: #2ee6a6;
    --accent-dim: #1f8f68;
    --text: #eef2f5;
    --sub: #8a97a3;
    --danger: #ff6161;
    --border: #223041;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
    padding-bottom: 40px;
  }
  header {
    padding: 18px 16px 10px;
    position: sticky;
    top: 0;
    background: var(--bg);
    z-index: 10;
    border-bottom: 1px solid var(--border);
  }
  header h1 {
    font-size: 18px;
    margin: 0;
    font-weight: 700;
  }
  main { padding: 16px; max-width: 640px; margin: 0 auto; }
  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .hint {
    font-size: 12px;
    color: var(--sub);
    margin-bottom: 8px;
  }
  textarea {
    width: 100%;
    min-height: 140px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text);
    padding: 12px;
    font-size: 15px;
    resize: vertical;
  }
  button.primary {
    width: 100%;
    margin-top: 14px;
    padding: 15px;
    border: none;
    border-radius: 12px;
    background: var(--accent);
    color: #05130d;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }
  button.primary:disabled {
    background: #2a3540;
    color: var(--sub);
  }
  .status {
    margin-top: 14px;
    font-size: 14px;
    color: var(--sub);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .spinner {
    width: 14px; height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error {
    margin-top: 14px;
    padding: 12px;
    background: rgba(255,97,97,0.1);
    border: 1px solid var(--danger);
    border-radius: 10px;
    color: var(--danger);
    font-size: 13px;
    white-space: pre-wrap;
  }
  .card {
    margin-top: 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    cursor: pointer;
  }
  .card-header h2 {
    font-size: 15px;
    margin: 0;
  }
  .card-actions { display: flex; gap: 8px; align-items: center; }
  .btn-mini {
    font-size: 12px;
    background: #1c2733;
    border: 1px solid var(--border);
    color: var(--text);
    padding: 5px 9px;
    border-radius: 8px;
    cursor: pointer;
  }
  .card-body {
    padding: 0 14px 14px;
    font-size: 14px;
    line-height: 1.65;
    white-space: pre-wrap;
    display: none;
  }
  .card-body.open { display: block; }
  .chevron { transition: transform 0.2s; color: var(--sub); }
  .chevron.open { transform: rotate(180deg); }
</style>
</head>
<body>

<header>
  <h1>📈 제니기자의 월스트리트 핫! — 대본 팩트체크</h1>
</header>

<main>
  <label for="topic">오늘 다룰 이슈 · 확정 데이터</label>
  <div class="hint">원본 소스에서 확인한 확정 수치를 붙여넣으면 정확도가 올라갑니다.</div>
  <textarea id="topic" placeholder="예) 오늘 나스닥 +1.52%, 다우 +0.26% 마감.&#10;ADP 6월 고용, ISM 제조업 PMI 발표. 나이키 실적 …"></textarea>

  <button class="primary" id="runBtn">대본 생성</button>

  <div class="status" id="status" style="display:none;"></div>
  <div class="error" id="errorBox" style="display:none;"></div>

  <div id="results"></div>
</main>

<script>
const $ = (id) => document.getElementById(id);

function setStatus(text, spinning) {
  const el = $("status");
  el.style.display = text ? "flex" : "none";
  el.innerHTML = spinning
    ? `<span class="spinner"></span><span>${text}</span>`
    : `<span>${text}</span>`;
}

function showError(msg) {
  const el = $("errorBox");
  el.style.display = "block";
  el.textContent = msg;
}
function hideError() {
  $("errorBox").style.display = "none";
}

function renderCard(id, title, text, openByDefault) {
  return `
    <div class="card">
      <div class="card-header" onclick="toggleCard('${id}')">
        <h2>${title}</h2>
        <div class="card-actions">
          <button class="btn-mini" onclick="event.stopPropagation(); copyCard('${id}')" id="copybtn-${id}">복사</button>
          <span class="chevron ${openByDefault ? "open" : ""}" id="chev-${id}">▾</span>
        </div>
      </div>
      <div class="card-body ${openByDefault ? "open" : ""}" id="body-${id}">${escapeHtml(text)}</div>
    </div>
  `;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toggleCard(id) {
  $("body-" + id).classList.toggle("open");
  $("chev-" + id).classList.toggle("open");
}

function copyCard(id) {
  const text = $("body-" + id).innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = $("copybtn-" + id);
    const orig = btn.textContent;
    btn.textContent = "복사됨";
    setTimeout(() => (btn.textContent = orig), 1200);
  });
}

async function callApi(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `요청 실패 (${r.status})`);
  return data;
}

$("runBtn").addEventListener("click", async () => {
  const topic = $("topic").value.trim();
  if (!topic) {
    showError("다룰 이슈 / 확정 데이터를 입력하세요.");
    return;
  }

  hideError();
  $("results").innerHTML = "";
  $("runBtn").disabled = true;

  try {
    setStatus("① Claude 초안 작성 중…", true);
    const { draft } = await callApi("/api/draft", { topic });

    setStatus("② Gemini 팩트체크 중…", true);
    const { factCheck } = await callApi("/api/factcheck", { draft });

    setStatus("③ Claude 최종 수정 중…", true);
    const { finalScript } = await callApi("/api/revise", { draft, factCheck });

    setStatus("완료 ✅", false);

    $("results").innerHTML =
      renderCard("final", "✅ 최종 대본", finalScript, true) +
      renderCard("check", "🔎 팩트체크 재검토 리포트", factCheck, false) +
      renderCard("draft", "📝 초안 (검증 전)", draft, false);
  } catch (e) {
    setStatus("", false);
    showError(e.message || String(e));
  } finally {
    $("runBtn").disabled = false;
  }
});
</script>

</body>
</html>
