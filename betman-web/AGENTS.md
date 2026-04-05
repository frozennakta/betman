<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:notion-rules -->
# Notion 업데이트 — 반드시 지킬 것

**Windows bash에서 curl로 한글을 직접 `-d '...'` 문자열로 넣으면 인코딩이 깨진다.**
깨진 노션 항목은 사용자가 직접 수동으로 지워야 하므로 절대 이 방식 쓰지 말 것.

## 올바른 방법 (필수)

1. Write 툴로 JSON 파일 먼저 생성 (예: `C:/Users/fmint/notion_patch.json`)
2. curl에서 `--data-binary "@C:/Users/fmint/notion_patch.json"` 으로 전송
3. 전송 후 임시 파일 삭제

```bash
# ✅ 올바른 방식
curl -s -X PATCH "https://api.notion.com/v1/blocks/PAGE_ID/children" \
  -H "Authorization: Bearer TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary "@C:/Users/fmint/notion_patch.json"

# ❌ 절대 금지 — 한글 깨짐
curl ... -d '{"children": [{"toggle": ...한글...}]}'
```

업로드 전 JSON 파일 내용을 Read 툴로 한 번 더 확인하고 올릴 것.
<!-- END:notion-rules -->
