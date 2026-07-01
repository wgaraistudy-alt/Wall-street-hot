// /api/draft.js
// Gemini(구글 검색 그라운딩)로 초안을 생성하는 서버리스 함수.
// 무료 티어로 사용 가능 — GEMINI_API_KEY 하나만 있으면 됨.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용됩니다." });
  }

  const { topic } = req.body || {};
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "topic이 비어 있습니다." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." });
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const system = `너는 유튜브 채널 '제니기자의 월스트리트 핫!'의 전속 대본 작가다.
앵커 '제니'가 읽을, 출근 전 3분짜리 미국 증시 브리핑 대본을 쓴다.

[고정 포맷]
■ 오프닝 (지수 마감 한 줄 요약으로 훅)
■ ⚡ 이슈 1 (제목 + 멘트)
■ ⚡ 이슈 2 (제목 + 멘트)
■ ⚡ 이슈 3 (제목 + 멘트)
■ 💡 클로징 및 실전 전략
각 이슈는 '팩트 → 왜 중요한가 → 리스크' 순으로 짜고, 구어체로 쓴다.

[절대 규칙]
1. 사용자가 준 '확정 데이터'가 있으면 그것을 최우선 진실로 삼는다.
2. 지수·지표·실적 등 모든 구체적 수치는 구글 검색으로 반드시 확인한다.
3. 검색으로도 확인 못 한 수치는 절대 지어내지 말고 [미확인] 태그를 붙인다.
4. 날짜는 오늘 기준으로 정확히 계산한다.
5. 투자 권유 표현을 피하고, 정보 제공 톤을 유지한다.

대본 맨 끝에 반드시 다음 섹션을 붙인다:
---
[확정 필요 수치] — 방송 전 원본 소스에서 재확인할 항목을 불릿으로 나열.
각 항목에 (검색으로 확인함 / 미확인) 표시.`;

  const user = `오늘 날짜: ${today}

아래는 오늘 다룰 이슈와 확정 데이터다. 이걸 진실 앵커로 삼고,
나머지 수치는 구글 검색으로 채우고 검증해서 위 포맷대로 3분 대본을 써라.

=====(확정 데이터 / 다룰 이슈)=====
${topic}
=================================`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          tools: [{ google_search: {} }],
        }),
      }
    );

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Gemini API 오류" });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("\n");

    if (!text.trim()) {
      return res.status(502).json({ error: "Gemini 응답이 비어 있습니다." });
    }

    return res.status(200).json({ draft: text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
