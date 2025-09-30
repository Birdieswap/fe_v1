// app/api/legal/[doc]/route.ts
// 원본 GitBook 스타일/번호를 살리되, 본문만 표시하고
// - 리스트 마커(•, 1.)를 같은 줄에 보이도록 교정
// - 하단 Prev/Next 네비 박스 제거
// - “Contact Us” 섹션 제거
// 를 처리합니다.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const MAP = {
  terms: "https://docs.birdieswap.com/legal/terms-of-service",
  privacy: "https://docs.birdieswap.com/legal/privacy-policy",
} as const;

function toAbs(u: string, base: string) {
  try { return new URL(u, base).toString(); } catch { return u; }
}
function absolutize(html: string, base: string) {
  return html
    .replace(/href="(?!https?:\/\/|mailto:|tel:|#)([^"]+)"/gi, (_, p1) => `href="${toAbs(p1, base)}"`)
    .replace(/src="(?!https?:\/\/|data:|#)([^"]+)"/gi,  (_, p1) => `src="${toAbs(p1, base)}"`);
}

/** 특정 텍스트가 들어있는 요소를 찾으면 upLevels 만큼 조상까지 제거 */
function removeAncestorIfContainsText(root: Element, selector: string, texts: string[], upLevels = 2) {
  root.querySelectorAll(selector).forEach((el) => {
    const t = (el.textContent || "").toLowerCase();
    if (texts.some((x) => t.includes(x))) {
      let cur: Element | null = el;
      for (let i = 0; i < upLevels && cur?.parentElement; i++) cur = cur.parentElement;
      (cur || el).remove();
    }
  });
}

/** “Contact Us” 같은 제목부터 다음 같은/더 높은 레벨의 제목 전까지 섹션 제거 */
function removeSectionByHeading(root: Element, matcher: RegExp) {
  const heads = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5")) as HTMLElement[];
  const level = (h: HTMLElement) => Number(h.tagName.slice(1));
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    const text = (h.textContent || "").trim().toLowerCase();
    if (!matcher.test(text)) continue;

    const start = h;
    const startLv = level(h);
    // 다음 섹션 시작(같은/더 높은 레벨)
    let endNode: ChildNode | null = null;
    for (let j = i + 1; j < heads.length; j++) {
      if (level(heads[j]) <= startLv) { endNode = heads[j]; break; }
    }
    // start부터 endNode 바로 전까지 제거
    let node: ChildNode | null = start;
    while (node && node !== endNode) {
      const next: ChildNode | null = node.nextSibling; // ✅ TS 명시
      (node as any).remove?.();
      node = next;
    }
    break; // 한 섹션만 제거
  }
}

/** Prev/Next 네비 블록(속성/클래스/텍스트 기반) 제거 */
function removePrevNextBlocks(root: Element) {
  // 1) 속성/클래스 기반
  root.querySelectorAll([
    'a[rel="prev"]',
    'a[rel="next"]',
    '[data-testid*="pagination"]',
    '[class*="Pagination"]',
    '[class*="prev"]',
    '[class*="Prev"]',
    '[class*="next"]',
    '[class*="Next"]',
    '[class*="navigation"]',
    '[role="navigation"]',
  ].join(",")).forEach((el) => {
    let box: Element = el;
    for (let i = 0; i < 5 && box.parentElement; i++) {
      const p = box.parentElement!;
      if (p.querySelectorAll("a").length >= 2) { box = p; break; }
      box = p;
    }
    box.remove();
  });

  // 2) 텍스트 기반
  const candidates = Array.from(root.querySelectorAll("a,button,div,nav,section,footer"));
  for (const el of candidates) {
    const txt = (el.textContent || "").toLowerCase();
    if (!/\b(previous|next)\b/.test(txt)) continue;
    let box: Element = el as Element;
    for (let i = 0; i < 5 && box.parentElement; i++) {
      const p = box.parentElement!;
      const links = p.querySelectorAll("a");
      if (links.length >= 2) { box = p; break; }
      box = p;
    }
    box.remove();
  }

  // 3) “Last updated …” 같은 하단 메타 제거(있을 경우)
  const metas = Array.from(root.querySelectorAll("small, div, p, footer"));
  for (const m of metas) {
    const t = (m.textContent || "").toLowerCase().trim();
    if (/^last\s+updated\b/.test(t)) {
      (m.parentElement ?? m).remove();
    }
  }
}

/** 제공해 준 GitBook 네비 구조(a.group 2개)의 공통 컨테이너 제거 */
function removeSpecificPrevNext(root: Element) {
  const anchors = Array.from(root.querySelectorAll('a.group')) as HTMLAnchorElement[];
  const prevs = anchors.filter(a => /\bprevious\b/i.test(a.textContent || ""));
  const nexts = anchors.filter(a => /\bnext\b/i.test(a.textContent || ""));
  if (!prevs.length || !nexts.length) return;

  function findBox(el: Element): Element {
    let box: Element = el;
    for (let i = 0; i < 6 && box.parentElement; i++) {
      const p = box.parentElement!;
      if (p.querySelectorAll("a").length >= 2) return p;
      box = p;
    }
    return el;
  }
  const prevBox = findBox(prevs[0]);
  const nextBox = findBox(nexts[0]);
  if (prevBox === nextBox) prevBox.remove();
  else { prevBox.remove(); nextBox.remove(); }
}

/** 하단부 휴리스틱: Previous/Next 텍스트가 함께 있는 큰 블록 제거 */
function removeBottomNavHeuristics(root: Element) {
  const bottoms = Array.from(root.querySelectorAll("section,div,nav,footer,article")).slice(-10);
  for (let i = bottoms.length - 1; i >= 0; i--) {
    const el = bottoms[i];
    const t = (el.textContent || "").toLowerCase();
    if (/\bprevious\b/.test(t) && /\bnext\b/.test(t)) {
      const links = el.querySelectorAll("a");
      if (links.length >= 2) { el.remove(); break; }
    }
  }
}

/** 리스트: <li><p>…</p></li> 구조를 <li>…</li>로 언래핑 → 마커와 문장이 한 줄로 */
function normalizeListItems(root: Element) {
  const items = Array.from(root.querySelectorAll("li"));
  for (const li of items) {
    while (li.firstChild && (li.firstChild as any).tagName === "BR") {
      (li.firstChild as any).remove?.();
    }
    // 1) <li><p>…</p></li>를 언래핑
    let first = li.firstElementChild as HTMLElement | null;
    if (first && first.tagName.toLowerCase() === "p") {
      const kids = Array.from(first.childNodes);
      first.replaceWith(...kids);
      first = li.firstElementChild as HTMLElement | null;
    }
    // 2) <li><div><p>…</p></div></li> 같은 얕은 래퍼도 언래핑
    if (first && ["div","section","article"].includes(first.tagName.toLowerCase())
        && first.childElementCount === 1
        && first.firstElementChild?.tagName.toLowerCase() === "p") {
      const kids = Array.from(first.firstElementChild.childNodes);
      first.replaceWith(...kids);
    }
    // 3) 불릿 문자 단독 노드(•, -, *)만 남아있으면 제거
    while (li.firstChild && li.firstChild.nodeType === 3 &&
           /^\s*[•\-\*]\s*$/.test(li.firstChild.textContent || "")) {
      li.firstChild.remove();
    }
  }
}

/** 부모 div 아래에 a.group 2개(Prev/Next) 형제를 가지는 GitBook 네비 박스 제거 */
function removeGivenPrevNextContainer(root: Element) {
  const divs = Array.from(root.querySelectorAll("div"));
  for (const d of divs) {
    // 자식 중 a.group만 집계 (형제 관계)
    const groupLinks = Array.from(d.children).filter(
      (el) => el.tagName === "A" && (el as Element).classList.contains("group")
    ) as HTMLAnchorElement[];

    if (groupLinks.length >= 2) {
      // 텍스트로 safety check (Previous/Next 둘 중 하나라도 포함)
      const txt = (d.textContent || "").toLowerCase();
      if (/\b(previous|next)\b/.test(txt)) {
        d.remove();
        // 한 블록만 제거하면 충분
        break;
      }
    }
  }
}

function removePrevNextAria(root: Element) {
  const sel = [
    'a[rel="prev"]','a[rel="next"]',
    'a[aria-label*="previous" i]','a[aria-label*="next" i]',
    'a[title*="previous" i]','a[title*="next" i]',
    // 현지화 키워드(예: 한국어)
    'a[aria-label*="이전"]','a[aria-label*="다음"]','a[title*="이전"]','a[title*="다음"]'
  ].join(',');
  const anchors = Array.from(root.querySelectorAll(sel));
  for (const a of anchors) {
    let box: Element = a;
    for (let i = 0; i < 6 && box.parentElement; i++) {
      const p = box.parentElement!;
      if (p.querySelectorAll('a,button').length >= 2) { box = p; break; }
      box = p;
    }
    box.remove();
  }
}

/** NEW: 태그명/role/aria 기반 호스트 블랙리스트 제거 */
function removeNavHosts(root: Element) {
  const tagNameRegex = /(pagination|page[-_ ]?actions?|pager|prev(ious)?|next)/i;
  const hosts = Array.from(root.querySelectorAll<HTMLElement>("*")).filter((el) => {
    const tn = el.tagName.toLowerCase();
    if (tagNameRegex.test(tn)) return true;
    const role = (el.getAttribute("role") || "").toLowerCase();
    if (role === "navigation") return true;
    const aria = ((el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "")).toLowerCase();
    if (/\b(previous|next|이전|다음)\b/i.test(aria)) return true;
    return false;
  });
  hosts.forEach((el) => el.remove());
}

/** NEW: 문서 말미 꼬리자르기(링크 2개 이상 블록 제거) */
function removeTailNavByStructure(root: Element, sameHostHint?: string) {
  // 하단에 가까운 큰 블록을 역순으로 훑는다
  const blocks = Array.from(root.querySelectorAll("div,section,nav,footer,article,aside")).slice(-60);
  for (let i = blocks.length - 1; i >= 0; i--) {
    const el = blocks[i] as HTMLElement;
    // 본문 중요 콘텐츠가 있으면 skip
    if (el.querySelector("h1,h2,h3,pre,code,table,blockquote,figure")) continue;
    const links = Array.from(el.querySelectorAll("a"));
    if (links.length < 2) continue;

    // 내부 링크 비율로 네비 성격 추정
    let internal = 0;
    for (const a of links) {
      const href = a.getAttribute("href") || "";
      if (!href) continue;
      if (href.startsWith("#")) continue; // 본문 내 앵커는 제외
      if (href.startsWith("/")) internal++;
      else if (sameHostHint) {
        try { if (new URL(href).hostname.includes(sameHostHint)) internal++; } catch {}
      }
    }
    if (internal >= 2) { el.remove(); break; }
  }
}

/** NEW: 마지막 안전망 — 본문 마지막 형제들 중 링크 덩어리 제거 */
function removeLastLinkCluster(root: Element) {
  const kids = Array.from(root.children);
  for (let i = kids.length - 1; i >= 0; i--) {
    const el = kids[i] as HTMLElement;
    // 헤딩/문단/리스트가 아닌, 링크 덩어리로만 구성된 노드 제거
    if (el.querySelector("h1,h2,h3,ul,ol,pre,code,table,blockquote,figure")) break;
    const links = el.querySelectorAll("a");
    const textLen = (el.textContent || "").trim().length;
    if (links.length >= 2 && textLen < 160) { el.remove(); break; }
  }
}

/** NEW: Cloudflare email 복호화 */
function cfDecodeEmail(hex: string) {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = "";
  for (let i = 2; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16) ^ key;
    out += String.fromCharCode(byte);
  }
  return out;
}

function revealCloudflareEmails(root: Element) {
  const nodes = Array.from(root.querySelectorAll('a.__cf_email__, a[href^="/cdn-cgi/l/email-protection"]')) as HTMLAnchorElement[];
  for (const a of nodes) {
    let hex = a.getAttribute("data-cfemail") || "";
    if (!hex) {
      const href = a.getAttribute("href") || "";
      const hash = href.split("#")[1] || "";
      if (/^[0-9a-f]+$/i.test(hash)) hex = hash;
    }
    if (!hex) continue;
    const email = cfDecodeEmail(hex);
    a.textContent = email;
    a.setAttribute("href", `mailto:${email}`);
    a.removeAttribute("data-cfemail");
    a.classList.remove("__cf_email__");
  }
}

export async function GET(_req: NextRequest, { params }: { params: { doc: string } }) {
  const kind = params.doc as keyof typeof MAP;
  const url = MAP[kind];
  if (!url) return NextResponse.json({ ok:false, error:"unknown_doc" }, { status: 404 });

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "user-agent": "Birdieswap-Consent-Fetch/1.0" },
    });
    if (!res.ok) return NextResponse.json({ ok:false, error:"fetch_failed" }, { status: 502 });
    const raw = await res.text();

    const jsdomMod: any = await import("jsdom");
    const JSDOMCtor = jsdomMod.JSDOM ?? jsdomMod.default?.JSDOM ?? jsdomMod.default;
    if (typeof JSDOMCtor !== "function") {
      return NextResponse.json({ ok:false, error:"JSDOM export not found" }, { status: 500 });
    }
    const { default: sanitizeHtml }: any = await import("sanitize-html");

    // 1) 파싱
    const document = new JSDOMCtor(raw, { url }).window.document as unknown as Document;

    // 2) 원본 CSS(head) 수집
    const headLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((l) => `<link rel="stylesheet" href="${toAbs(l.getAttribute("href") || "", url)}">`)
      .join("\n");
    const headStyles = Array.from(document.querySelectorAll("style"))
      .map((s) => `<style>${s.textContent || ""}</style>`)
      .join("\n");

    // 3) 본문 컨테이너(main 우선)
    const containers = ["main", "article", "body"];
    let contentEl: Element | null = null;
    for (const sel of containers) {
      const el = document.querySelector(sel);
      if (el && el.querySelector("h1,h2,h3,p,ul,ol,table,pre,code")) { contentEl = el; break; }
    }
    if (!contentEl) contentEl = document.body;

    // 4) 상하단 부가 UI 제거
    contentEl.querySelectorAll([
      // 상단
      "header",
      '[data-testid*="header"]',
      '[aria-label*="header"]',
      '[class*="Header"]',
      '[data-testid*="breadcrumbs"]',
      '[class*="Breadcrumb"]',
      '[data-testid*="toc"]',
      '[class*="TableOfContents"]',
      '[data-testid*="ask"]',
      '[aria-label*="Ask"]',
      '[class*="assistant"]',
    ].join(",")).forEach((n) => n.remove());

    contentEl.querySelectorAll([
      // 하단
      "footer",
      '[data-testid*="pagination"]',
      '[class*="Pagination"]',
      '[data-testid*="page-actions"]',
      '[class*="PageActions"]',
      '[data-testid*="feedback"]',
      '[class*="Feedback"]',
      "nav",
    ].join(",")).forEach((n) => n.remove());

    removePrevNextBlocks(contentEl);
    removePrevNextAria(contentEl);
    removeBottomNavHeuristics(contentEl);
    removeSpecificPrevNext(contentEl);
    removeGivenPrevNextContainer(contentEl);
    
    removeNavHosts(contentEl);                 
    removeTailNavByStructure(contentEl, "docs.birdieswap.com"); 
    removeLastLinkCluster(contentEl); 

    // 독립 버튼 제거(예방)
    contentEl.querySelectorAll("button").forEach((b) => b.remove());

    // 5) “Contact Us” 섹션 제거(숫자 접두 포함 매칭)
    removeSectionByHeading(contentEl, /contact\s*us/i);

    // 6) 리스트 정규화(마커와 문장을 같은 줄로)
    normalizeListItems(contentEl);

    // 6-1) NEW: Cloudflare 이메일 복호화(반드시 sanitize 전에)
    revealCloudflareEmails(contentEl);

    // 7) 상대경로 절대화
    const bodyHtmlAbs = absolutize((contentEl as HTMLElement).innerHTML || "", url);

    // 8) sanitize (CSS 유지 위해 class/data-* 허용)
    const cleanHead = sanitizeHtml(headLinks + "\n" + headStyles, {
      allowedTags: ["link", "style"],
      allowedAttributes: { link: ["rel", "href"], style: ["type", "media"] },
    });
    const cleanBody = sanitizeHtml(bodyHtmlAbs, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img","h1","h2","h3","h4","h5","section","article","header","footer",
        "table","thead","tbody","tr","th","td","pre","code","figure","figcaption",
        "div","span","ul","ol","li"
      ]),
      allowedAttributes: {
        a:   ["href","title","target","rel"],
        img: ["src","alt","title","width","height","loading","srcset","sizes"],
        "*": ["class","id","style","data-*"],
      },
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
      },
    });

    // 9) 최소 보정 CSS (마커/제목)
    const patchCss = `
      html,body{background:transparent;}
      body{margin:0;padding:16px;color:inherit;}

      /* 제목 번호/마커 잘림 방지 */
      h1,h2,h3,h4,h5{
        overflow: visible !important;
        text-indent: 0 !important;
        padding-left: .5em !important;
        position: relative;
      }
      h1::before,h2::before,h3::before,h4::before,h5::before{ margin-right:.25em; }

      /* 리스트: outside + 들여쓰기, 첫 문장과 같은 줄 */
      ul,ol{
        display:block !important;
        list-style-position: outside !important;
        list-style-type: revert !important;
        margin-left: 0 !important;
        padding-left: 1.5rem !important;
        overflow: visible !important;
      }
      li{
        display: list-item !important;
        overflow: visible !important;
      }

      li > p:first-child,
      li > div:first-child,
      li > section:first-child,
      li > article:first-child{
        display:inline !important;
        margin:0 !important;
      }
 
      li > p:not(:first-child),
      li > div:not(:first-child){
        display:block; /* 기본값 복원 */
        margin-top:.5em !important;
      }

      li::before{ content: none !important; }

      li > p{ margin:0 !important; }
      li::marker{
        color: currentColor;
        font-variant-numeric: tabular-nums;
      }

      /* 혹시 남아있는 페이지 네비/피드백 강제 숨김(최후 보루) */
      [data-testid*="pagination"],[class*="Pagination"],
      [data-testid*="page-actions"],[class*="PageActions"],
      [data-testid*="feedback"],[class*="Feedback"]{
        display:none !important;
      }

      /* NEW: CSS :has() 기반 Prev/Next 숨김 (지원 브라우저 한정) */
      @supports selector(:has(a)) {
        nav:has(a[rel="prev"]), nav:has(a[rel="next"]),
        nav:has(a[aria-label*="previous" i]), nav:has(a[aria-label*="next" i]),
        nav:has(a[aria-label*="이전"]), nav:has(a[aria-label*="다음"]),
        div:has(a[rel="prev"]), div:has(a[rel="next"]),
        div:has(a[aria-label*="previous" i]), div:has(a[aria-label*="next" i]),
        div:has(a[aria-label*="이전"]), div:has(a[aria-label*="다음"]),
        section:has(a[rel="prev"]), section:has(a[rel="next"]),
        section:has(a[aria-label*="previous" i]), section:has(a[aria-label*="next" i]),
        section:has(a[aria-label*="이전"]), section:has(a[aria-label*="다음"]) {
          display: none !important;
        }
        a[rel="prev"], a[rel="next"],
        a[aria-label*="previous" i], a[aria-label*="next" i],
        a[aria-label*="이전"], a[aria-label*="다음"] {
          display: none !important;
        }
      }
    `;

    const html =
`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
${cleanHead}
<style>${patchCss}</style>
</head>
<body>
${cleanBody}
</body>
</html>`;

    return NextResponse.json({ ok:true, html });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status: 500 });
  }
}