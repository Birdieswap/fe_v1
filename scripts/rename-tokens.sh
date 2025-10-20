#!/usr/bin/env bash
set -euo pipefail

# 사용법:
#  - 실제 치환:    npm run rename:tokens
#  - 드라이런:     npm run rename:tokens:dry
#  - 되돌리기:     git restore -SW .  (또는 git reset --hard)

# 수정 대상 파일 (git 추적중인 파일만)
FILES=$(git ls-files | grep -E '\.(tsx|ts|jsx|js|css|mdx)$' | grep -v -E '^(node_modules/|.next/|dist/|build/)')

if [ -z "${FILES}" ]; then
  echo "대상 파일이 없습니다. (git에 커밋된 파일만 대상으로 합니다)"
  exit 0
fi

# FROM:TO 매핑 테이블 (_ -> -)
read -r -d '' MAPPING <<'EOF'
light_pink:light-pink
light_pink_hover:light-pink-hover
light_primary:light-primary
light_primary_hover:light-primary-hover
light_light_mint:light-light-mint
light_mid_mint:light-mid-mint
light_mid_mint_2:light-mid-mint-2
dark_pink:dark-pink
dark_swap_bg:dark-swap-bg
dark_popup_bg:dark-popup-bg
dark_pink_hover:dark-pink-hover
dark_empty_state:dark-empty-state
dark_green_key:dark-green-key
dark_primary:dark-primary
dark_primary_hover:dark-primary-hover
dark_mid_mint:dark-mid-mint
dark_mid_mint_2:dark-mid-mint-2
dark_mid_mint_25:dark-mid-mint-25
dark_mid_mint_3:dark-mid-mint-3
dark_mid_mint_4:dark-mid-mint-4
light_background:light-background
light_foreground:light-foreground
dark_background:dark-background
dark_foreground:dark-foreground
EOF

DRYRUN="${1:-}"

echo "대상 파일 수: $(echo "${FILES}" | wc -w)"
echo

# macOS / Linux 기본 perl로 동작 (Windows는 WSL 권장)
# \b 단어경계 기반으로 안전 치환
while IFS= read -r pair; do
  [ -z "$pair" ] && continue
  FROM="${pair%%:*}"
  TO="${pair#*:}"

  if [ "${DRYRUN}" = "--dry" ]; then
    echo "DRY-RUN: ${FROM} -> ${TO}"
    # 변경 미리보기 (변경 라인만)
    # shellcheck disable=SC2086
    perl -ne "print if s/\\b${FROM}\\b/${TO}/g" ${FILES} >/dev/null
  else
    echo "REPLACE: ${FROM} -> ${TO}"
    # shellcheck disable=SC2086
    perl -pi -e "s/\\b${FROM}\\b/${TO}/g" ${FILES}
  fi
done <<<"${MAPPING}"

echo
echo "완료!"
echo "변경사항 확인: git status && git diff --name-only"
