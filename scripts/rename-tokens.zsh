#!/bin/zsh
set -eu

DRY="${1:-}"

# 현재 작업 디렉터리 안내
echo "cwd: $PWD"

# 대상 파일 수집 (macOS 호환: -name ... -o -name ... 사용)
files=()
while IFS= read -r f; do
  files+=("$f")
done < <(
  find . -type f \
    \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" -o -name "*.css" -o -name "*.mdx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./dist/*" \
    -not -path "./build/*"
)

echo "탐색된 파일 수: ${#files[@]}"
if [[ ${#files[@]} -eq 0 ]]; then
  echo "대상 파일이 없습니다. (루트에서 실행 중인지, 확장자가 맞는지 확인하세요)"
  exit 0
fi

# FROM:TO 매핑 (긴 → 짧은 순서 + 혼합형 포함)
mapping=(
  "light_primary_hover:light-primary-hover"
  "light_primary:light-primary"
  "light_pink_hover:light-pink-hover"
  "light_pink:light-pink"
  "light_light_mint:light-light-mint"
  "light_mid_mint_25:light-mid-mint-25"
  "light_mid_mint_2:light-mid-mint-2"
  "light_mid_mint:light-mid-mint"
  "light_background:light-background"
  "light_foreground:light-foreground"

  "dark_primary_hover:dark-primary-hover"
  "dark_primary:dark-primary"
  "dark_pink_hover:dark-pink-hover"
  "dark_pink:dark-pink"
  "dark_swap_bg:dark-swap-bg"
  "dark_popup_bg:dark-popup-bg"
  "dark_empty_state:dark-empty-state"
  "dark_green_key:dark-green-key"
  "dark_mid_mint_25:dark-mid-mint-25"
  "dark_mid_mint_4:dark-mid-mint-4"
  "dark_mid_mint_3:dark-mid-mint-3"
  "dark_mid_mint_2:dark-mid-mint-2"
  "dark_mid_mint:dark-mid-mint"
  "dark_background:dark-background"
  "dark_foreground:dark-foreground"

  # 혼합형(앞부분만 이미 하이픈)
  "light-primary_hover:light-primary-hover"
  "light-pink_hover:light-pink-hover"
  "light-mid_mint_25:light-mid-mint-25"
  "light-mid_mint_2:light-mid-mint-2"
  "light-mid_mint:light-mid-mint"

  "dark-primary_hover:dark-primary-hover"
  "dark-pink_hover:dark-pink-hover"
  "dark-swap_bg:dark-swap-bg"
  "dark-popup_bg:dark-popup-bg"
  "dark-empty_state:dark-empty-state"
  "dark-green_key:dark-green-key"
  "dark-mid_mint_25:dark-mid-mint-25"
  "dark-mid_mint_4:dark-mid-mint-4"
  "dark-mid_mint_3:dark-mid-mint-3"
  "dark-mid_mint_2:dark-mid-mint-2"
  "dark-mid_mint:dark-mid-mint"
)

echo
echo "=== 치환 대상 샘플 ==="
grep -R --line-number --color=always -E 'light_.*mint|dark_.*mint|_popup_bg|_swap_bg|_primary(_hover)?|_pink(_hover)?|_foreground|_background' . 2>/dev/null | head -n 20 || true
echo "====================="
echo

changed_pairs=0

for pair in "${mapping[@]}"; do
  FROM="${pair%%:*}"
  TO="${pair#*:}"

  if [[ "$DRY" == "--dry" ]]; then
    matched=()
    for f in "${files[@]}"; do
      if grep -q -E "\\b${FROM}\\b" "$f"; then
        matched+=("$f")
      fi
    done
    if [[ ${#matched[@]} -gt 0 ]]; then
      echo "DRY-RUN: ${FROM} -> ${TO}"
      for m in "${matched[@]}"; do echo "  - $m"; done
      echo
    fi
  else
    hit=0
    for f in "${files[@]}"; do
      if grep -q -E "\\b${FROM}\\b" "$f"; then
        /usr/bin/perl -pi -e "s/\\\\b${FROM}\\\\b/${TO}/g" "$f"
        hit=1
      fi
    done
    if [[ $hit -eq 1 ]]; then
      (( changed_pairs++ ))
      echo "REPLACE: ${FROM} -> ${TO}"
    fi
  fi
done

echo
if [[ "$DRY" == "--dry" ]]; then
  echo "DRY-RUN 완료 (파일 미변경)"
else
  echo "치환 완료 (치환된 토큰쌍 수: $changed_pairs)"
  echo "변경 파일 확인: git status && git diff --name-only"
fi
