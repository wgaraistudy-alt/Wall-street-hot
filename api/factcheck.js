// /api/factcheck.js
// Gemini(구글 검색 그라운딩)로 대본을 적대적으로 검증하는 서버리스 함수.

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용됩니다." });
  }

  const { draft } = req.body || {};
  if (!draft || !draft.trim()) {
    return res.status(400).json({ error: "draft가 비어 있습니다." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." });
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const system = `너는 냉정한 팩트체커다. 유튜브 증시 브리핑 대본을 검수한다.
이 대본은 너와 같은 계열의 AI가 쓴 초안이다. 정 붙이지 말고 남의 글처럼
가차없이 의심하며 검토하라. 너의 유일한 임무는 '틀린 것을 찾아내는 것'이다.
대본을 다시 쓰지 마라.

검사 대상:
- 사실과 다른 수치 (지수 등락률, 종가, 지표 값, 실적 등)
- 검증 불가능한 주장
- 오래된/철 지난 데이터
- 날짜 오류
- 논리적 모순

작업 방식:
- 대본 속 모든 구체적 수치·주장을 하나씩 구글 검색으로 새로 대조한다.
  (초안을 쓸 때 이미 검색했다고 믿지 말고, 매번 처음부터 다시 검색한다)
- 관대하게 넘어가지 말고 깐깐하게 잡아낸다.

출력 형식 (각 항목마다):
• [원문 주장] → 판정: (정확 / 오류 / 미확인)
  → 올바른 값: (알면 기입, 출처와 함께)
  → 근거: (검색으로 확인한 사실 요약)

마지막에 '치명적 오류 요약'을 3줄 이내로 정리한다.`;

  const user = `오늘 날짜: ${today}

아래 대본을 팩트체크하라. 대본을 다시 쓰지 말고, 오류만 지적하라.

=====(검수 대상 대본)=====
${draft}
==========================`;

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

    return res.status(200).json({ factCheck: text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
