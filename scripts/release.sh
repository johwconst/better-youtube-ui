#!/usr/bin/env bash
# Lança uma nova versão do Vitro.
#
#   scripts/release.sh patch|minor|major   # sobe a versão, commita, cria tag e zip
#   scripts/release.sh zip                 # só gera o zip da versão atual
#
# Antes de rodar, escreva as mudanças em "## [Não lançado]" no CHANGELOG.md.
set -euo pipefail
cd "$(dirname "$0")/.."

current=$(jq -r .version manifest.json)

package() {
  local v=$1 out="dist/vitro-v$1.zip"
  mkdir -p dist
  rm -f "$out"
  zip -qr "$out" manifest.json _locales src popup icons assets -x '*.DS_Store'
  echo "Pacote: $out ($(du -h "$out" | cut -f1))"
}

case "${1:-}" in
  zip) package "$current"; exit 0 ;;
  patch|minor|major) ;;
  *) echo "uso: $0 patch|minor|major|zip" >&2; exit 1 ;;
esac

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Há mudanças não commitadas. Commite antes de lançar." >&2
  exit 1
fi

IFS=. read -r MA MI PA <<<"$current"
case "$1" in
  patch) PA=$((PA + 1)) ;;
  minor) MI=$((MI + 1)); PA=0 ;;
  major) MA=$((MA + 1)); MI=0; PA=0 ;;
esac
next="$MA.$MI.$PA"
today=$(date +%F)

# Seção "Não lançado" precisa ter conteúdo
unreleased=$(awk '/^## \[Não lançado\]/{f=1;next} /^## \[/{f=0} f' CHANGELOG.md | grep -c '[^[:space:]]' || true)
if [[ "$unreleased" -eq 0 ]]; then
  echo "A seção [Não lançado] do CHANGELOG.md está vazia." >&2
  exit 1
fi

tmp=$(mktemp)
jq --arg v "$next" '.version = $v' manifest.json >"$tmp" && mv "$tmp" manifest.json

# Renomeia "Não lançado" para a versão nova e atualiza os links do rodapé
sed -i "s/^## \[Não lançado\]$/## [Não lançado]\n\n## [$next] - $today/" CHANGELOG.md
sed -i "s#^\[Não lançado\]: .*#[Não lançado]: ../../compare/v$next...HEAD\n[$next]: ../../compare/v$current...v$next#" CHANGELOG.md

git add manifest.json CHANGELOG.md
git commit -m "release: v$next"
git tag -s "v$next" -m "Vitro v$next"
package "$next"
echo "Lançado v$current → v$next. Para publicar: git push && git push --tags"
