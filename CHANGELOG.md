# Changelog

Todas as mudanças relevantes do Vitro ficam aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e as versões seguem o [SemVer](https://semver.org/lang/pt-BR/):

- **MAJOR** (`2.0.0`): mudança que quebra configurações salvas ou remove recursos.
- **MINOR** (`1.2.0`): recurso novo.
- **PATCH** (`1.1.1`): correção de bug ou ajuste visual.

## [Não lançado]

### Adicionado
- Extensão em inglês e português: dicionário próprio em `src/i18n.js` e nome/descrição traduzidos em `_locales/`.
- Seletor de idioma no popup (Automático / English / Português); o editor e a saudação trocam na hora.
- README em inglês (`README.md`) e em português (`README.pt-BR.md`), com links de troca.

### Alterado
- `scripts/release.sh` inclui `_locales/` no zip.

## [1.1.0] - 2026-11-04

### Adicionado
- 11 papéis de parede em imagem (Brasa, Rubi, Lampejo, Anil, Neon azul, Oceano, Prisma, Fluxo, Amanhecer, Lua nascente, Eclipse), com miniaturas no editor.
- Versão exibida no popup.
- Prints do projeto no README e nota de projeto vibecoded com Claude Opus.
- Commits e tags assinados com GPG.

### Alterado
- Papel de parede padrão agora é **Brasa**.
- Ícone do editor na barra superior trocado de pena para raio.
- Ícone e saudação montados sem `innerHTML` (compatível com o Trusted Types do YouTube).

### Corrigido
- Saudação ficava por baixo dos vídeos: as variáveis `--vt-*` eram redefinidas no `ytd-app` e anulavam os ajustes do editor.
- Seta do carrossel de chips com fundo preto sólido.

## [1.0.0] - 2026-11-04

### Adicionado
- Barra superior e menu lateral em vidro flutuante (Vidro / Fosco / Sólido).
- Papéis de parede em SVG (Cor, Ondas, Crepúsculo, Noite, Inverno, Aurora) e imagem própria.
- Saudação por horário com data e nome.
- Cartões translúcidos com opções de título, texto, disposição, largura e bordas.
- Luz que segue o cursor e neve opcional.
- "Sala de cinema" na página de vídeo.
- Limpeza: sem Shorts, anúncios, telas finais e merch; recomendados opcionais.
- Editor visual na página e popup.

[Não lançado]: ../../compare/v1.1.0...HEAD
[1.1.0]: ../../compare/v1.0.0...v1.1.0
[1.0.0]: ../../releases/tag/v1.0.0
