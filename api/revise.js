// /api/revise.js
// 팩트체크 리포트를 반영해 Claude가 최종 대본을 완성하는 서버리스 함수.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용됩니다." });
  }

  const { draft, factCheck } = req.body || {};
  if (!draft || !factCheck) {
    return res.status(400).json({ error: "draft 또는 factCheck가 비어 있습니다." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다." });
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const system = `너는 '제니기자의 월스트리트 핫!' 전속 대본 작가다.
초안과 팩트체크 리포트를 받아, 오류를 바로잡은 최종 대본을 완성한다.

규칙:
1. 팩트체크에서 '오류'로 판정된 부분은 올바른 값으로 수정한다.
2. '미확인'으로 남은 항목은 문장에서 [방송 전 확인]으로 명확히 표기한다.
3. 기존 고정 포맷(오프닝/이슈3개/클로징)을 유지한다.
4. 지어낸 수치를 새로 추가하지 않는다.

최종 대본 맨 끝에 [방송 전 필수 확인] 섹션을 붙여,
아직 확정 안 된 수치를 불릿으로 정리한다.`;

  const user = `오늘 날짜: ${today}

=====(원본 초안)=====
${draft}
=====================

=====(팩트체크 리포트)=====
${factCheck}
===========================

위 리포트를 반영해 오류를 고친 최종 대본을 출력하라.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: user }],
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Claude API 오류" });
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    if (!text.trim()) {
      return res.status(502).json({ error: "Claude 응답이 비어 있습니다." });
    }

    return res.status(200).json({ finalScript: text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
