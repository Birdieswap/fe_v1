#!/usr/bin/env bash
set -euo pipefail

# 사용법:
#  - 드라이런(미리보기 로그만): npm run rename:tokens:dry
#  - 실제 치환:              npm run rename:tokens
#  - 되돌리기:               git restore -SW .   (또는 git reset --hard)
#
# 특징:
#  - git 추적 여부와 상관없이 find로 대상 파일을 모두 포함
#  - 단어경계 기반 perl 치환
#  - 혼합형 토큰(light-primary_hover 등)까지 커버

# 대상 파일 찾기 (node_modules/.next/dist/build 제외)
readarray -t FILES < <(find . -type f \
  -regex '.*\.\(tsx\|ts\|jsx\|js\|css\|mdx\)$' \
  -not -path "./node_modules/*" -not -path "./.next/*" \
  -not -path "./dist/*" -not -path "./build/*")

if [ ${#FILES[@]} -eq 0 ]; then
  echo "대상 파일이 없습니다."
  exit 0
fi

echo "대상 파일 수: ${#FILES[@]}"

# FROM:TO 매핑 테이블 (_ → -)
# - 순서는 긴 토큰 → 짧은 토큰(부분 일치 방지)
# - 혼합형(light-primary_* 등) 포함
read -r -d '' MAPPING <<'EOF'
light_primary_hover:light-primary-hover
light_primary:light-primary
light_pink_hover:light-pink-hover
light_pink:light-pink
light_light_mint:light-light-mint
light_mid_mint_25:light-mid-mint-25
light_mid_mint_2:light-mid-mint-2
light_mid_mint:light-mid-mint
light_background:light-background
light_foreground:light-foreground

dark_primary_hover:dark-primary-hover
dark_primary:dark-primary
dark_pink_hover:dark-pink-hover
dark_pink:dark-pink
dark_swap_bg:dark-swap-bg
dark_popup_bg:dark-popup-bg
dark_empty_state:dark-empty-state
dark_green_key:dark-green-key
dark_mid_mint_25:dark-mid-mint-25
dark_mid_mint_4:dark-mid-mint-4
dark_mid_mint_3:dark-mid-mint-3
dark_mid_mint_2:dark-mid-mint-2
dark_mid_mint:dark-mid-mint
dark_background:dark-background
dark_foreground:dark-foreground

# 혼합형(앞부분만 이미 하이픈인 케이스)도 추가
light-primary_hover:light-primary-hover
light-pink_hover:light-pink-hover
light-mid_mint_25:light-mid-mint-25
light-mid_mint_2:light-mid-mint-2
light-mid_mint:light-mid-mint

dark-primary_hover:dark-primary-hover
dark-pink_hover:dark-pink-hover
dark-swap_bg:dark-swap-bg
dark-popup_bg:dark-popup-bg
dark-empty_state:dark-empty-state
dark-green_key:dark-green-key
dark-mid_mint_25:dark-mid-mint-25
dark-mid_mint_4:dark-mid-mint-4
dark-mid_mint_3:dark-mid-mint-3
dark-mid_mint_2:dark-mid-mint-2
dark-mid_mint:dark-mid-mint
EOF

DRY="${1:-}"

# 치환 전 간단 스캔
echo
echo "=== 치환 대상 토큰 존재 여부(샘플) ==="
grep -R --line-number --color=always -E 'light_.*mint|dark_.*mint|_popup_bg|_swap_bg|_primary(_hover)?|_pink(_hover)?|_foreground|_background' . \
  | head -n 20 || true
echo "===================================="
echo

# 실제 치환
CHANGED_COUNT=0

while IFS= read -r pair; do
  [[ -z "$pair" || "$pair" =~ ^# ]] && continue
  FROM="${pair%%:*}"
  TO="${pair#*:}"

  if [ "$DRY" = "--dry" ]; then
    # 변경 발생하는 파일만 미리보기
    MATCHED=$(grep -R -l -E "\\b${FROM}\\b" "${FILES[@]}" || true)
    if [ -n "$MATCHED" ]; then
      echo "DRY-RUN: ${FROM} -> ${TO}"
      echo "$MATCHED" | sed 's/^/  - /'
      echo
    fi
  else
    # perl 단어경계 기반 치환
    # shellcheck disable=SC2068
    perl -pi -e "s/\\b${FROM}\\b/${TO}/g" ${FILES[@]} || true
    # 변경 확인용 카운트(선택)
    CNT=$(grep -R -c -E "\\b${TO}\\b" ${FILES[@]} | awk -F: '{s+=$2} END{print s}' || echo 0)
    if [ "$CNT" != "0" ]; then
      CHANGED_COUNT=$((CHANGED_COUNT + 1))
      echo "REPLACE: ${FROM} -> ${TO}"
    fi
  fi
done <<<"$MAPPING"

echo
if [ "$DRY" = "--dry" ]; then
  echo "DRY-RUN 완료 (실제 파일은 변경되지 않았습니다)"
else
  echo "치환 루프 완료 (치환된 토큰쌍 수: ${CHANGED_COUNT})"
  echo "변경 파일 확인: git status && git diff --name-only"
fi
