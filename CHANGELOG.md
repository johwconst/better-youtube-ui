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

- Opção **Forçar tema escuro** (ligada por padrão), no painel Vidro e no popup: mantém a paleta escura do YouTube mesmo com a conta no tema claro; desligar devolve o tema original.
- **Fundo:** modos de papel de parede — fixo, dia e noite (18h–6h), um por dia e um por aba — e prévia ao passar o mouse nas miniaturas.
- **Menu lateral:** escolher quais itens e seções aparecem (inscrições, histórico, playlists, assistir mais tarde, curtidos, seus vídeos, downloads, Mais do YouTube, Explorar, configurações, rodapé).
- **Interface** (seção nova): fontes embutidas Inter, Manrope e Outfit (OFL, sem requisição externa), fonte do sistema ou do YouTube; escala da página; sons suaves sintetizados no editor.
- Roadmap no README (pt e en).
- Testes: 45 unitários (`node:test`) e 33 E2E (Playwright no Chromium do sistema com YouTube falso). `npm test`, `npm run test:e2e`.

### Alterado
- `scripts/release.sh` inclui `_locales/` no zip.
- Editor visual virou um **card flutuante centralizado** de vidro: cabeçalho com o raio e "Pronto", seções com ícones na lateral e controles à direita. Abre na primeira seção, pode ser arrastado pelo cabeçalho (sem sair da tela), navega com as setas do teclado e vira faixa de chips em telas estreitas.
- Lógica pura extraída para `src/core.js`.
- Saudação agora fica no fluxo da página, dentro da grade da home e antes dos chips, alinhada aos cartões por `ResizeObserver`. Sem posicionamento absoluto, `padding-top` artificial nem temporizadores; espera a grade quando ela é montada depois.
- Configurações salvas são saneadas (`vitroMerge`): chaves antigas e valores com tipo errado são descartados.

### Corrigido
- Itens condicionais dos painéis do editor podiam aparecer como o texto "false".
- Botão ⚡ do editor podia levar até 3s para aparecer quando a página já chegava pronta (achado pelos testes E2E).

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
