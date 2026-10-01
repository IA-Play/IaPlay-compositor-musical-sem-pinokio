export type VocalCategoryKey =
    | 'all'
    | 'texture'
    | 'distortion'
    | 'melisma'
    | 'sustained'
    | 'vibrato'
    | 'dynamic'
    | 'belting'
    | 'register'
    | 'transition'
    | 'onset'
    | 'ending'
    | 'slide'
    | 'emotion'
    | 'phrasing'
    | 'articulation'
    | 'adlib'
    | 'harmony'
    | 'doubles'
    | 'whisper_fry'
    | 'cry_sob'
    | 'ornament'
    | 'genre'
    | 'production'
    | 'climax';

export interface SectionRuleEffect {
    id: string;
    title: string;
    tag: string;
    inlineTag?: string;
    category: VocalCategoryKey;
    badge: string;
    badgeColor: string;
    description: string;
    aiBehavior: string;
    example: string;
    supportsWordTarget?: boolean;
    defaultPlacement?: 'header' | 'before_line' | 'after_line' | 'adlib';
}

export const VOCAL_CATEGORIES: { id: VocalCategoryKey; label: string; count?: number }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'texture', label: 'Texturas Vocais' },
    { id: 'distortion', label: 'Drive & Rasp' },
    { id: 'melisma', label: 'Melismas & Riffs' },
    { id: 'sustained', label: 'Notas Longas' },
    { id: 'vibrato', label: 'Vibrato' },
    { id: 'dynamic', label: 'Dinâmica' },
    { id: 'belting', label: 'Belting & Potência' },
    { id: 'register', label: 'Registros & Falsete' },
    { id: 'transition', label: 'Transições Vocais' },
    { id: 'onset', label: 'Ataques' },
    { id: 'ending', label: 'Finalizações' },
    { id: 'slide', label: 'Portamento & Slides' },
    { id: 'emotion', label: 'Interpretação' },
    { id: 'phrasing', label: 'Fraseado & Tempo' },
    { id: 'articulation', label: 'Articulação' },
    { id: 'adlib', label: 'Ad-libs Cantados ( )' },
    { id: 'harmony', label: 'Coros & Backing' },
    { id: 'doubles', label: 'Dobras & Camadas' },
    { id: 'whisper_fry', label: 'Sussurro & Fry' },
    { id: 'cry_sob', label: 'Voz de Choro' },
    { id: 'ornament', label: 'Ornamentações' },
    { id: 'genre', label: 'Estilos (Gospel, Rock, R&B)' },
    { id: 'production', label: 'Espaço & Reverb' },
    { id: 'climax', label: 'Clímax & Combos' },
];

export const VOCAL_EFFECTS_CATALOG: SectionRuleEffect[] = [
    // ==========================================
    // 1. TEXTURAS VOCAIS (VOCAL TEXTURES)
    // ==========================================
    {
        id: 'clean_vocal',
        title: 'Voz Limpa (Clean Vocal)',
        tag: 'clean vocal',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        description: 'Vocal limpo, cristalino e sem distorções ou rouquidão.',
        aiBehavior: 'A IA foca na pureza harmônica e estabilidade tonal da voz.',
        example: '[clean vocal]\nEu ainda espero por você',
        defaultPlacement: 'before_line'
    },
    {
        id: 'raspy_voice',
        title: 'Voz Rouca / Rasgada (Raspy Voice)',
        tag: 'raspy voice',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        description: 'Voz rouca e rasgada, transmitindo intensidade, dor ou pegada crua.',
        aiBehavior: 'A IA introduz aspereza e aridez na ressonância laríngea.',
        example: '[raspy voice]\nNão consigo mais fingir',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gritty_vocal',
        title: 'Voz Áspera & Agressiva (Gritty Vocal)',
        tag: 'gritty vocal',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
        description: 'Voz áspera, com textura arenosa e pegada agressiva.',
        aiBehavior: 'Gera harmônicos saturados com sensação de borda cortante no vocal.',
        example: '[gritty vocal]\nQuebrando as correntes',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gravelly_voice',
        title: 'Voz Grave & Cascalhenta (Gravelly Voice)',
        tag: 'gravelly voice',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-stone-500/10 text-stone-300 border-stone-500/20',
        description: 'Voz extremamente áspera, pesada e de baixa frequência (estilo Tom Waits/Johnny Cash).',
        aiBehavior: 'Aprofunda a resposta de graves e insere textura rouca constante.',
        example: '[gravelly voice]\nNo final daquela estrada vazia',
        defaultPlacement: 'before_line'
    },
    {
        id: 'husky_voice',
        title: 'Voz Rouca & Sensual (Husky Voice)',
        tag: 'husky voice',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        description: 'Voz rouca encorpada, aveludada e quente.',
        aiBehavior: 'Adiciona presença encorpada com leve aspereza suave e intimista.',
        example: '[husky voice]\nVem mais perto agora',
        defaultPlacement: 'before_line'
    },
    {
        id: 'breathy_vocal',
        title: 'Voz Soprada / Com Ar (Breathy Vocal)',
        tag: 'breathy vocal',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        description: 'Voz cantada com fluxo de ar audível (estilo Billie Eilish).',
        aiBehavior: 'Aumenta as frequências de sopro e reduz o fechamento completo das pregas vocais.',
        example: '[breathy vocal]\nSegredos no silêncio',
        defaultPlacement: 'before_line'
    },
    {
        id: 'airy_vocal',
        title: 'Voz Leve & Aérea (Airy Vocal)',
        tag: 'airy vocal',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        description: 'Voz leve, flutuante e etérea, como se estivesse suspensa no ar.',
        aiBehavior: 'Reduz o ataque dos graves, dando sensação espacial e sonhadora.',
        example: '[airy vocal]\nFlutuando nas nuvens',
        defaultPlacement: 'before_line'
    },
    {
        id: 'whispery_vocal',
        title: 'Voz Quase Sussurrada (Whispery Vocal)',
        tag: 'whispery vocal',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        description: 'Voz muito suave, quase sem tom fechado, no limite do sussurro.',
        aiBehavior: 'Estimula mixagem íntima com alta proximidade ao microfone.',
        example: '[whispery vocal]\nNão conte pra ninguém',
        defaultPlacement: 'before_line'
    },
    {
        id: 'smoky_voice',
        title: 'Voz Aveludada & Enfumaçada (Smoky Voice)',
        tag: 'smoky voice',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
        description: 'Voz típica de jazz club: aveludada, escura e com leve rouquidão.',
        aiBehavior: 'Suaviza agudos estridentes e ressalta médios-graves quentes.',
        example: '[smoky voice]\nMais um café da madrugada',
        defaultPlacement: 'before_line'
    },
    {
        id: 'warm_vocal',
        title: 'Voz Quente & Confortável (Warm Vocal)',
        tag: 'warm vocal',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-amber-600/10 text-amber-300 border-amber-600/20',
        description: 'Voz doce, cheia de médios reconfortantes e ressonância acolhedora.',
        aiBehavior: 'Equilibra o timbre para soar amigável e envolvente.',
        example: '[warm vocal]\nTudo vai ficar bem',
        defaultPlacement: 'before_line'
    },
    {
        id: 'dark_vocal_tone',
        title: 'Timbre Escuro (Dark Vocal Tone)',
        tag: 'dark vocal tone',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-indigo-900/30 text-indigo-300 border-indigo-700/30',
        description: 'Voz sombria, reflexiva, com ressonância faríngea rebaixada.',
        aiBehavior: 'Enfatiza nuances graves e melancólicas na performance.',
        example: '[dark vocal tone]\nAs sombras me alcançaram',
        defaultPlacement: 'before_line'
    },
    {
        id: 'bright_vocal_tone',
        title: 'Timbre Brilhante & Solar (Bright Vocal Tone)',
        tag: 'bright vocal tone',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
        description: 'Voz clara, aberta e luminosa, com projeção frontal.',
        aiBehavior: 'Destaca harmônicos superiores e dicção viva para músicas pop e animadas.',
        example: '[bright vocal tone]\nO sol nasceu de novo',
        defaultPlacement: 'before_line'
    },
    {
        id: 'raw_vocal',
        title: 'Voz Crua & Orgânica (Raw Vocal)',
        tag: 'raw vocal',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        description: 'Voz sem polimento artificial, humana, vulnerável e crua.',
        aiBehavior: 'Evita afinação perfeita sintética, trazendo pequenas imperfeições emotivas.',
        example: '[raw vocal]\nCom todo o coração',
        defaultPlacement: 'before_line'
    },
    {
        id: 'fragile_vocal',
        title: 'Voz Frágil & Delicada (Fragile Vocal)',
        tag: 'fragile vocal',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-pink-400/10 text-pink-300 border-pink-400/20',
        description: 'Voz fina e comovente, soando à beira das lágrimas ou vulnerável.',
        aiBehavior: 'Reduz a compressão e a força das consoantes.',
        example: '[fragile vocal]\nEu quase não me aguento em pé',
        defaultPlacement: 'before_line'
    },
    {
        id: 'cracked_emotional_voice',
        title: 'Voz Quebrada por Emoção (Cracked Emotional Voice)',
        tag: 'cracked emotional voice',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-red-400/10 text-red-300 border-red-400/20',
        description: 'Voz que falha ligeiramente pelo impacto dramático do sentimento.',
        aiBehavior: 'Insere micro-quebras de registro expressivas e humanas no verso.',
        example: '[cracked emotional voice]\nPor que você se foi?',
        defaultPlacement: 'before_line'
    },
    {
        id: 'slightly_broken_voice',
        title: 'Leves Falhas Emocionais (Slightly Broken Voice)',
        tag: 'slightly broken voice',
        category: 'texture',
        badge: 'Textura',
        badgeColor: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
        description: 'Voz que perde o ar e trinca sutilmente ao expressar dor.',
        aiBehavior: 'Adiciona pequenas oscilações de pitch e ar no ataque das notas.',
        example: '[slightly broken voice]\nNão consigo dizer adeus',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 2. DISTORÇÃO / DRIVE / RASP
    // ==========================================
    {
        id: 'vocal_drive',
        title: 'Drive Vocal (Vocal Drive)',
        tag: 'vocal drive',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-red-600/10 text-red-400 border-red-600/20',
        description: 'Distorção laríngea musical que confere pegada e peso rock/blues.',
        aiBehavior: 'Ativa drive expressivo na emissão das notas.',
        example: '[vocal drive]\nGritando contra o vento',
        defaultPlacement: 'before_line'
    },
    {
        id: 'light_vocal_drive',
        title: 'Drive Leve (Light Vocal Drive)',
        tag: 'light vocal drive',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-orange-600/10 text-orange-400 border-orange-600/20',
        description: 'Uma leve aspereza de drive aplicada sem exageros.',
        aiBehavior: 'Mantém a melodia clara adicionando uma camada sutil de distorção.',
        example: '[light vocal drive]\nSinto a força em mim',
        defaultPlacement: 'before_line'
    },
    {
        id: 'heavy_vocal_drive',
        title: 'Drive Intenso & Pesado (Heavy Vocal Drive)',
        tag: 'heavy vocal drive',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-rose-700/20 text-rose-300 border-rose-600/30',
        description: 'Drive rasgado muito forte para trechos de altíssima tensão ou raiva.',
        aiBehavior: 'Aumenta significativamente a saturação harmônica vocal.',
        example: '[heavy vocal drive]\nNada vai me deter!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'raspy_belt',
        title: 'Belting Rouco / Rasgado (Raspy Belt)',
        tag: 'raspy belt',
        category: 'distortion',
        badge: 'Drive & Belt',
        badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
        description: 'Voz de peito projetada no agudo com textura rasgada simultânea.',
        aiBehavior: 'Combina potência máxima no agudo com distorção de drive emocionante.',
        example: '[raspy belt]\nEu sei que Tu vais me levantar!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gritty_belt',
        title: 'Belting Áspero (Gritty Belt)',
        tag: 'gritty belt',
        category: 'distortion',
        badge: 'Drive & Belt',
        badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
        description: 'Agudo potente com pegada áspera e suja, estilo Southern Rock ou Hard Rock.',
        aiBehavior: 'Impulsiona projeção vocal forte com textura arenosa cortante.',
        example: '[gritty belt]\nQueima o meu coração!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'controlled_distortion',
        title: 'Distorção Controlada (Controlled Distortion)',
        tag: 'controlled distortion',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-zinc-600/20 text-zinc-300 border-zinc-500/30',
        description: 'Distorção precisa, sem soar desafinada ou descontrolada.',
        aiBehavior: 'Garante que as notas continuem perfeitamente afinadas mesmo saturadas.',
        example: '[controlled distortion]\nA verdade que não se cala',
        defaultPlacement: 'before_line'
    },
    {
        id: 'vocal_distortion',
        title: 'Distorção Vocal Perceptível (Vocal Distortion)',
        tag: 'vocal distortion',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-red-600/10 text-red-300 border-red-600/20',
        description: 'Efeito saturado nítido em toda a frase.',
        aiBehavior: 'Aplica corte de frequências com distorção evidente.',
        example: '[vocal distortion]\nRevolução agora!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'growling_texture',
        title: 'Textura de Growl (Growling Texture)',
        tag: 'growling texture',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-purple-900/30 text-purple-300 border-purple-700/30',
        description: 'Rosnado gutural característico de metal ou soul agressivo.',
        aiBehavior: 'Gera rugido harmônico profundo na garganta.',
        example: '[growling texture]\nDas cinzas eu renasço',
        defaultPlacement: 'before_line'
    },
    {
        id: 'light_growl',
        title: 'Growl Leve (Light Growl)',
        tag: 'light growl',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-purple-700/20 text-purple-300 border-purple-600/20',
        description: 'Growl rápido e sutil antes de abrir a voz.',
        aiBehavior: 'Pequena mordida de rosnado no início da estrofe.',
        example: '[light growl]\nNão há volta',
        defaultPlacement: 'before_line'
    },
    {
        id: 'raspy_growl',
        title: 'Growl Rouco (Raspy Growl)',
        tag: 'raspy growl',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-red-900/30 text-red-300 border-red-700/30',
        description: 'Mistura de voz rouca com técnica gutural de growl.',
        aiBehavior: 'Produz um timbre rasgado e visceral simultâneo.',
        example: '[raspy growl]\nRugindo na escuridão',
        defaultPlacement: 'before_line'
    },
    {
        id: 'distorted_high_note',
        title: 'Nota Aguda com Distorção (Distorted High Note)',
        tag: 'distorted high note',
        category: 'distortion',
        badge: 'Drive',
        badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
        description: 'Nota no teto do alcance cantada com drive estourado.',
        aiBehavior: 'Faz a nota mais alta da frase rasgar com brilho e energia.',
        example: 'E o céu vai se abrir\n[distorted high note on "abrir"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 3. MELISMAS / RUNS / RIFFS
    // ==========================================
    {
        id: 'melisma',
        title: 'Melisma Padrão (Melisma)',
        tag: 'melisma',
        category: 'melisma',
        badge: 'Agilidade',
        badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
        description: 'Várias notas cantadas em uma única sílaba ou vogal.',
        aiBehavior: 'Gera ondulações melódicas contínuas na palavra.',
        example: 'Eu te amo tanto\n[melisma on "tanto"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'short_melisma',
        title: 'Melisma Curto (Short Melisma)',
        tag: 'short melisma',
        category: 'melisma',
        badge: 'Agilidade',
        badgeColor: 'bg-pink-600/10 text-pink-300 border-pink-600/20',
        description: 'Pequena ondulação rápida de 2 a 4 notas sem prolongar demais.',
        aiBehavior: 'Insere floreio melódico conciso no final da palavra.',
        example: 'Vem cá [short melisma on "cá"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'extended_melisma',
        title: 'Melisma Longo & Virtuoso (Extended Melisma)',
        tag: 'extended melisma',
        category: 'melisma',
        badge: 'Virtuosismo',
        badgeColor: 'bg-pink-700/20 text-pink-300 border-pink-500/30',
        description: 'Curva melódica longa e cheia de notas sucessivas (diva pop / gospel).',
        aiBehavior: 'A IA prolonga a sílaba com curvas expressivas de pitch.',
        example: 'Minha salvação\n[extended melisma on "salvação"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'complex_melisma',
        title: 'Melisma Complexo (Complex Melisma)',
        tag: 'complex melisma',
        category: 'melisma',
        badge: 'Virtuosismo',
        badgeColor: 'bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/30',
        description: 'Desenho melódico com saltos de escala elaborados e precisos.',
        aiBehavior: 'Estimula arabescos vocais de alta complexidade melódica.',
        example: '[complex melisma on "Senhor"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'gospel_melisma',
        title: 'Melisma Gospel / Louvor (Gospel Melisma)',
        tag: 'gospel melisma',
        category: 'melisma',
        badge: 'Gospel',
        badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        description: 'Melisma típico de adoração gospel afro-americana e pentecostal.',
        aiBehavior: 'Combina dinâmica crescente e intervalos pentatônicos gospel.',
        example: 'Ele vive!\n[extended gospel melisma on "vive"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'rnb_melisma',
        title: 'Melisma R&B / Soul (R&B Melisma)',
        tag: 'R&B melisma',
        category: 'melisma',
        badge: 'R&B / Soul',
        badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        description: 'Ondulação aveludada, sensual e rápida típica de R&B clássico e contemporâneo.',
        aiBehavior: 'Executa transições suaves com afinação ágil e aveludada.',
        example: 'Baby don\'t go\n[R&B melisma on "go"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'vocal_run',
        title: 'Vocal Run / Escala Rápida (Vocal Run)',
        tag: 'vocal run',
        category: 'melisma',
        badge: 'Agilidade',
        badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        description: 'Escala rápida de notas descendo ou subindo em sequência ágil.',
        aiBehavior: 'Produz uma cascata melódica veloz sem pausas entre as notas.',
        example: '[vocal run]\nOh yeah, oh yeah...',
        defaultPlacement: 'before_line'
    },
    {
        id: 'fast_vocal_run',
        title: 'Run Rápido e Preciso (Fast Vocal Run)',
        tag: 'fast vocal run',
        category: 'melisma',
        badge: 'Agilidade',
        badgeColor: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
        description: 'Vocal run em alta velocidade técnica.',
        aiBehavior: 'Aumenta a cadência de notas por segundo nos floreios da voz.',
        example: '[fast vocal run on "coração"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'descending_vocal_run',
        title: 'Run Descendente (Descending Vocal Run)',
        tag: 'descending vocal run',
        category: 'melisma',
        badge: 'Agilidade',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        description: 'A voz corre de uma nota aguda para um grave em cascata límpida.',
        aiBehavior: 'Direciona o pitch em queda melódica ornamental gradual.',
        example: 'Até o fim...\n[descending vocal run]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'ascending_vocal_run',
        title: 'Run Ascendente (Ascending Vocal Run)',
        tag: 'ascending vocal run',
        category: 'melisma',
        badge: 'Agilidade',
        badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        description: 'A voz escala rapidamente do grave até um clímax agudo.',
        aiBehavior: 'Dispara uma subida rápida de escala em direção à nota principal.',
        example: '[ascending vocal run]\nEu vou subir!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'vocal_riff',
        title: 'Riff Vocal (Vocal Riff)',
        tag: 'vocal riff',
        category: 'melisma',
        badge: 'Agilidade',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        description: 'Padrão melódico rítmico e memorável cantado em repetição.',
        aiBehavior: 'Desenha um desenho rítmico com notas pontuadas pela voz.',
        example: '[vocal riff]\n(Na-na-na-na)',
        defaultPlacement: 'before_line'
    },
    {
        id: 'ornamental_vocal_run',
        title: 'Ornamentação Vocal Completa (Ornamental Vocal Run)',
        tag: 'ornamental vocal run',
        category: 'melisma',
        badge: 'Virtuosismo',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        description: 'Florilégio vocal com trilos e bordaduras elegantes.',
        aiBehavior: 'Enriquece a linha com ornamentos ao redor da nota guia.',
        example: 'Tua glória me envolve\n[ornamental vocal run on "envolve"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 4. NOTAS SUSTENTADAS (SUSTAINED NOTES)
    // ==========================================
    {
        id: 'sustained_note',
        title: 'Nota Sustentada (Sustained Note)',
        tag: 'sustained note',
        category: 'sustained',
        badge: 'Sustentação',
        badgeColor: 'bg-blue-600/10 text-blue-400 border-blue-600/20',
        description: 'Segura a nota com estabilidade por vários tempos do compasso.',
        aiBehavior: 'Evita cortes secos e estende a duração da vogal.',
        example: 'Pra sempre [sustained note on "sempre"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'long_sustained_note',
        title: 'Nota Longa (Long Sustained Note)',
        tag: 'long sustained note',
        category: 'sustained',
        badge: 'Sustentação',
        badgeColor: 'bg-blue-700/20 text-blue-300 border-blue-500/30',
        description: 'Nota segurada por tempo prolongado sem oscilar ou cair.',
        aiBehavior: 'Mantém o fôlego e o suporte vocal ativo por compassos adicionais.',
        example: 'Teu amor não falha\n[long sustained note on "falha"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'very_long_sustained_note',
        title: 'Nota Ultra-Longa (Very Long Sustained Note)',
        tag: 'very long sustained note',
        category: 'sustained',
        badge: 'Sustentação',
        badgeColor: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
        description: 'Nota segurada ao limite do fôlego, gerando enorme tensão dramática.',
        aiBehavior: 'Estende a vogal pelo tempo máximo da cadência musical.',
        example: 'Aleluiaaaaa...\n[very long sustained note on "Aleluia"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'sustained_high_note',
        title: 'Nota Aguda Sustentada (Sustained High Note)',
        tag: 'sustained high note',
        category: 'sustained',
        badge: 'Sustentação',
        badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        description: 'Segura uma nota no topo do alcance vocal com brilho e projeção.',
        aiBehavior: 'Mantém o agudo firme e ressonante no ponto alto do arranjo.',
        example: '[sustained high note]\nEu sei que Tu és Deus!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'sustained_low_note',
        title: 'Nota Grave Sustentada (Sustained Low Note)',
        tag: 'sustained low note',
        category: 'sustained',
        badge: 'Sustentação',
        badgeColor: 'bg-stone-600/20 text-stone-300 border-stone-500/30',
        description: 'Nota grave sustentada e aveludada no fim da estrofe.',
        aiBehavior: 'Desce a afinação e preserva a ressonância no peito por mais tempo.',
        example: 'No mais profundo abismo [sustained low note]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'hold_final_syllable',
        title: 'Segure a Última Sílaba (Hold Final Syllable)',
        tag: 'hold final syllable',
        category: 'sustained',
        badge: 'Sustentação',
        badgeColor: 'bg-teal-600/20 text-teal-300 border-teal-500/30',
        description: 'A última sílaba da linha não é interrompida, ela é mantida no ar.',
        aiBehavior: 'Impede finalizações abruptas de frase.',
        example: 'Eu vou te amar [hold final syllable on "amar"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'long_held_vibrato',
        title: 'Nota Longa com Vibrato (Long Held Note with Vibrato)',
        tag: 'long held note with vibrato',
        category: 'sustained',
        badge: 'Sustentação & Vibrato',
        badgeColor: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
        description: 'Segura a nota e fecha com oscilação elegante de vibrato.',
        aiBehavior: 'Mantém a nota reta e abre o vibrato na cauda.',
        example: 'Meu coração [long held note with vibrato on "coração"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'intensifying_sustained_note',
        title: 'Nota Sustentada com Crescendo (Gradually Intensifying Sustained Note)',
        tag: 'gradually intensifying sustained note',
        category: 'sustained',
        badge: 'Sustentação',
        badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
        description: 'A nota começa contida e vai crescendo em volume e força.',
        aiBehavior: 'Aplica dinâmica crescente progressiva enquanto a nota é mantida.',
        example: 'Vem reinar...\n[gradually intensifying sustained note on "reinar"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 5. VIBRATO
    // ==========================================
    {
        id: 'natural_vibrato',
        title: 'Vibrato Natural (Natural Vibrato)',
        tag: 'natural vibrato',
        category: 'vibrato',
        badge: 'Vibrato',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        description: 'Oscilação suave e orgânica de afinação, típica de canto treinado.',
        aiBehavior: 'Insere modulação de pitch natural sem parecer eletrônica.',
        example: '[natural vibrato]\nOnde o rio encontra o mar',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gentle_vibrato',
        title: 'Vibrato Leve / Delicado (Gentle Vibrato)',
        tag: 'gentle vibrato',
        category: 'vibrato',
        badge: 'Vibrato',
        badgeColor: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
        description: 'Oscilação discreta e suave, ideal para baladas lentas.',
        aiBehavior: 'Controla a profundidade da oscilação para manter a delicadeza.',
        example: 'Sempre serás [gentle vibrato]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'wide_vibrato',
        title: 'Vibrato Amplo / Dramático (Wide Vibrato)',
        tag: 'wide vibrato',
        category: 'vibrato',
        badge: 'Vibrato',
        badgeColor: 'bg-purple-700/20 text-purple-300 border-purple-500/30',
        description: 'Vibrato largo e operístico, transmitindo drama e peso teatral.',
        aiBehavior: 'Aumenta a excursão de pitch nas notas finais.',
        example: 'Nunca mais vou voltar [wide vibrato on "voltar"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'slow_vibrato',
        title: 'Vibrato Lento (Slow Vibrato)',
        tag: 'slow vibrato',
        category: 'vibrato',
        badge: 'Vibrato',
        badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        description: 'Oscilação com ciclos lentos e profundos.',
        aiBehavior: 'Reduz a velocidade em Hz do vibrato.',
        example: '[slow vibrato]\nO tempo parou',
        defaultPlacement: 'before_line'
    },
    {
        id: 'fast_vibrato',
        title: 'Vibrato Rápido / Nervoso (Fast Vibrato)',
        tag: 'fast vibrato',
        category: 'vibrato',
        badge: 'Vibrato',
        badgeColor: 'bg-pink-600/10 text-pink-300 border-pink-600/20',
        description: 'Vibrato veloz com sensação de urgência ou trêmulo emocional.',
        aiBehavior: 'Acelera a oscilação das notas finais.',
        example: '[fast vibrato]\nMeu peito estremece',
        defaultPlacement: 'before_line'
    },
    {
        id: 'emotional_vibrato',
        title: 'Vibrato Emocional (Emotional Vibrato)',
        tag: 'emotional vibrato',
        category: 'vibrato',
        badge: 'Vibrato',
        badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        description: 'Vibrato expressivo que reflete o ápice do sentimento na canção.',
        aiBehavior: 'Une vibrato a nuances de ar e calor na voz.',
        example: 'Tu és meu refúgio [emotional vibrato on "refúgio"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'delayed_vibrato',
        title: 'Vibrato Tardio (Delayed Vibrato)',
        tag: 'delayed vibrato',
        category: 'vibrato',
        badge: 'Vibrato',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        description: 'Começa a nota reta (straight tone) e só aplica vibrato nos últimos instantes.',
        aiBehavior: 'Produz efeito moderno de pop contemporâneo e worship.',
        example: 'Eu nunca vou esquecer\n[long sustained note, delayed vibrato on "esquecer"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 6. DINÂMICA (DYNAMICS)
    // ==========================================
    {
        id: 'very_soft',
        title: 'Muito Suave (Very Soft)',
        tag: 'very soft',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
        description: 'Volume extremamente baixo, no limiar da audição (pianíssimo).',
        aiBehavior: 'Reduz a projeção e a intensidade sonora do vocal.',
        example: '[very soft]\nBem devagar',
        defaultPlacement: 'before_line'
    },
    {
        id: 'soft_vocal',
        title: 'Vocal Suave (Soft Vocal)',
        tag: 'soft vocal',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        description: 'Interpretação suave e descontraída sem forçar a voz.',
        aiBehavior: 'Mantém nível moderadamente baixo e relaxado.',
        example: '[soft vocal]\nA noite vem chegando',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gentle_delivery',
        title: 'Interpretação Delicada (Gentle Delivery)',
        tag: 'gentle delivery',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        description: 'Ataques leves e tom doce, cuidando de cada palavra cantada.',
        aiBehavior: 'Suaviza as transições silábicas e arredonda o timbre.',
        example: '[gentle delivery]\nComo uma brisa mansa',
        defaultPlacement: 'before_line'
    },
    {
        id: 'intimate_vocal',
        title: 'Vocal Íntimo (Intimate Vocal)',
        tag: 'intimate vocal',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        description: 'Voz cantada como uma conversa particular ao pé do ouvido.',
        aiBehavior: 'Foca no microfone próximo com ambiência seca e pessoal.',
        example: '[intimate vocal]\nSó nós dois sabemos',
        defaultPlacement: 'before_line'
    },
    {
        id: 'restrained_vocal',
        title: 'Voz Contida (Restrained Vocal)',
        tag: 'restrained vocal',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-stone-500/10 text-stone-300 border-stone-500/20',
        description: 'Segurando a força propositalmente, criando expectativa de explosão futura.',
        aiBehavior: 'Mantém a energia interna alta sem explodir em decibéis.',
        example: '[restrained vocal]\nGuardando as palavras',
        defaultPlacement: 'before_line'
    },
    {
        id: 'medium_intensity',
        title: 'Intensidade Média (Medium Intensity)',
        tag: 'medium intensity',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        description: 'Volume equilibrado e firme, ideal para versos narrativos.',
        aiBehavior: 'Produz uma linha melódica sólida e confortável.',
        example: '[medium intensity]\nCaminhando pela rua',
        defaultPlacement: 'before_line'
    },
    {
        id: 'powerful_vocal',
        title: 'Vocal Poderoso (Powerful Vocal)',
        tag: 'powerful vocal',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        description: 'Projeção encorpada, cheia de autoridade e energia sonora.',
        aiBehavior: 'Abre a caixa torácica e aumenta a presença do vocal na mix.',
        example: '[powerful vocal]\nEu declaro a vitória!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'intense_vocal',
        title: 'Vocal Intenso (Intense Vocal)',
        tag: 'intense vocal',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
        description: 'Carga dramática pulsante com máxima presença emocional.',
        aiBehavior: 'Intensifica a pegada de cada sílaba cantada.',
        example: '[intense vocal]\nNão há como recuar',
        defaultPlacement: 'before_line'
    },
    {
        id: 'explosive_vocal',
        title: 'Entrada Vocal Explosiva (Explosive Vocal)',
        tag: 'explosive vocal',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-red-600/20 text-red-300 border-red-500/30',
        description: 'A voz entra com tudo, impactando o ouvinte sem aviso prévio.',
        aiBehavior: 'Ataque imediato com volume e pressão no máximo.',
        example: '[explosive vocal]\nQUEBRA TUDO!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'full_power',
        title: 'Potência Máxima (Full Power)',
        tag: 'full power',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-rose-600/20 text-rose-300 border-rose-500/30',
        description: 'O cantor dá 100% da sua capacidade e volume.',
        aiBehavior: 'Empurra o alcance e a sustentação até o limite dinâmico.',
        example: '[full power]\nGLÓRIA E PODER!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'crescendo',
        title: 'Crescendo de Volume (Crescendo)',
        tag: 'crescendo',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        description: 'Aumente gradualmente a intensidade do início ao fim do trecho.',
        aiBehavior: 'Eleva a energia e o volume suavemente a cada compasso.',
        example: '[crescendo]\nUm fogo que começa pequeno e vai queimar',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gradual_crescendo',
        title: 'Crescendo Progressivo (Gradual Crescendo)',
        tag: 'gradual crescendo',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
        description: 'Construção contínua e gradual, perfeita para pré-refrão.',
        aiBehavior: 'Prepara a transição para o refrão com aumento firme de intensidade.',
        example: '[gradual crescendo, increasing emotional intensity]\nEntão eu levantei meus olhos',
        defaultPlacement: 'before_line'
    },
    {
        id: 'decrescendo',
        title: 'Decrescendo / Diminuindo (Decrescendo)',
        tag: 'decrescendo',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-zinc-600/20 text-zinc-300 border-zinc-500/30',
        description: 'Reduz gradualmente a intensidade vocal até silenciar ou sussurrar.',
        aiBehavior: 'Abaixa o volume e acalma o ataque vocal aos poucos.',
        example: '[decrescendo]\nAté que restou apenas a paz',
        defaultPlacement: 'before_line'
    },
    {
        id: 'dynamic_build',
        title: 'Construção Dinâmica (Dynamic Build)',
        tag: 'dynamic build',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-orange-600/10 text-orange-300 border-orange-600/20',
        description: 'A banda e a voz aceleram a tensão rumo ao clímax.',
        aiBehavior: 'Mobiliza os instrumentos e o vocal em sincronia dinâmica.',
        example: '[dynamic build]\nEstá chegando a nossa hora',
        defaultPlacement: 'before_line'
    },
    {
        id: 'emotional_buildup',
        title: 'Construção Emocional (Emotional Build-up)',
        tag: 'emotional build-up',
        category: 'dynamic',
        badge: 'Dinâmica',
        badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
        description: 'A emoção vai transbordando a cada frase cantada.',
        aiBehavior: 'Combina dinâmica, vibrato e respiração urgente.',
        example: '[emotional build-up]\nMeu coração não vai parar',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 7. BELTING / POTÊNCIA (BELTING)
    // ==========================================
    {
        id: 'belt',
        title: 'Belting Vocal (Belt)',
        tag: 'belt',
        category: 'belting',
        badge: 'Belting',
        badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        description: 'Voz de peito projetada no agudo sem usar falsete.',
        aiBehavior: 'Força a emissão encorpada em notas que normalmente exigiriam voz de cabeça.',
        example: '[belt]\nEu não vou desistir!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'powerful_belt',
        title: 'Belting Poderoso (Powerful Belt)',
        tag: 'powerful belt',
        category: 'belting',
        badge: 'Belting',
        badgeColor: 'bg-orange-600/20 text-orange-300 border-orange-500/30',
        description: 'Belting com volume e potência no topo.',
        aiBehavior: 'Cria uma parede sonora imensa na nota cantada.',
        example: '[powerful belt]\nTu és o Rei!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'high_belt',
        title: 'Belting Agudo Extremo (High Belt)',
        tag: 'high belt',
        category: 'belting',
        badge: 'Belting',
        badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
        description: 'Belting em notas extremamente agudas.',
        aiBehavior: 'Alcança o registro agudo de peito com grande sustentação.',
        example: '[high belt]\nLivre enfim!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'chest_dominant_belt',
        title: 'Belting com Voz de Peito Dominante (Chest-Dominant Belt)',
        tag: 'chest-dominant belt',
        category: 'belting',
        badge: 'Belting',
        badgeColor: 'bg-red-600/20 text-red-300 border-red-500/30',
        description: 'Predominância de massa espessa vocal sem afinar o timbre.',
        aiBehavior: 'Evita a sonoridade fina ou anasalada no agudo.',
        example: '[chest-dominant belt]\nContra tudo e todos',
        defaultPlacement: 'before_line'
    },
    {
        id: 'emotional_belt',
        title: 'Belting Emocional / Dramático (Emotional Belt)',
        tag: 'emotional belt',
        category: 'belting',
        badge: 'Belting',
        badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        description: 'Belting que carrega um desabafo ou choro no meio da potência.',
        aiBehavior: 'Combina força com vulnerabilidade interpretativa.',
        example: '[emotional belt]\nFica comigo aqui!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'explosive_belt',
        title: 'Belting Explosivo (Explosive Belt)',
        tag: 'explosive belt',
        category: 'belting',
        badge: 'Belting',
        badgeColor: 'bg-red-700/20 text-red-300 border-red-600/30',
        description: 'Explosão imediata em belting sem preparação melódica suave.',
        aiBehavior: 'Dispara a nota de peito no primeiro segundo do compasso.',
        example: '[explosive belt]\nACORDA MEU POVO!',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 8. REGISTROS / FALSETTO / VOZ MISTA
    // ==========================================
    {
        id: 'head_voice',
        title: 'Voz de Cabeça (Head Voice)',
        tag: 'head voice',
        category: 'register',
        badge: 'Registro',
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        description: 'Ressonância nos ressonadores superiores da face/cabeça; som límpido e alto.',
        aiBehavior: 'Alivia o peso torácico mantendo afinação pura no agudo.',
        example: '[head voice]\nAlém do horizonte',
        defaultPlacement: 'before_line'
    },
    {
        id: 'soft_head_voice',
        title: 'Voz de Cabeça Suave (Soft Head Voice)',
        tag: 'soft head voice',
        category: 'register',
        badge: 'Registro',
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        description: 'Voz de cabeça doce e delicada, perfeita para passagens angelicais.',
        aiBehavior: 'Atenua a força do ataque mantendo brilho celestial.',
        example: '[soft head voice]\nDescendo como a chuva',
        defaultPlacement: 'before_line'
    },
    {
        id: 'falsetto',
        title: 'Falsete Clássico (Falsetto)',
        tag: 'falsetto',
        category: 'register',
        badge: 'Falsete',
        badgeColor: 'bg-cyan-600/10 text-cyan-300 border-cyan-600/20',
        description: 'Voz fina e destacada no agudo (estilo The Weeknd, Sam Smith ou Bee Gees).',
        aiBehavior: 'Reduz a massa vibratória das pregas vocais, gerando som fino e aveludado.',
        example: '[falsetto]\n(Ooooh...) me leva pra casa',
        defaultPlacement: 'before_line'
    },
    {
        id: 'soft_falsetto',
        title: 'Falsete Suave & Delicado (Soft Falsetto)',
        tag: 'soft falsetto',
        category: 'register',
        badge: 'Falsete',
        badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        description: 'Falsete cantado no menor volume possível com muita doçura.',
        aiBehavior: 'Traz ar e tranquilidade meditativa à canção.',
        example: '[soft falsetto]\nSó um instante...',
        defaultPlacement: 'before_line'
    },
    {
        id: 'airy_falsetto',
        title: 'Falsete Aéreo / Efémero (Airy Falsetto)',
        tag: 'airy falsetto',
        category: 'register',
        badge: 'Falsete',
        badgeColor: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
        description: 'Falsete com bastante ar passando, quase como um sopro cantado.',
        aiBehavior: 'Espalha a imagem estéreo e suaviza agudos cortantes.',
        example: '[airy falsetto]\nDesaparecendo na neblina',
        defaultPlacement: 'before_line'
    },
    {
        id: 'emotional_falsetto',
        title: 'Falsete Emocional (Emotional Falsetto)',
        tag: 'emotional falsetto',
        category: 'register',
        badge: 'Falsete',
        badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
        description: 'Falsete carregado de desabafo e vulnerabilidade extrema.',
        aiBehavior: 'Modula o pitch com sensibilidade dramática.',
        example: '[emotional falsetto]\nPor que dói tanto?',
        defaultPlacement: 'before_line'
    },
    {
        id: 'mixed_voice',
        title: 'Voz Mista / Mix Voice (Mixed Voice)',
        tag: 'mixed voice',
        category: 'register',
        badge: 'Registro',
        badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        description: 'Equilíbrio perfeito entre o peso do peito e a leveza da cabeça.',
        aiBehavior: 'Permite transitar por notas altas com estabilidade e sem quebras forçadas.',
        example: '[mixed voice]\nCruzando a fronteira',
        defaultPlacement: 'before_line'
    },
    {
        id: 'powerful_mixed_voice',
        title: 'Voz Mista Potente (Powerful Mixed Voice)',
        tag: 'powerful mixed voice',
        category: 'register',
        badge: 'Registro',
        badgeColor: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
        description: 'Voz mista com muita compressão e volume nos agudos.',
        aiBehavior: 'Gera brilho pop contemporâneo sem cansaço de belting puro.',
        example: '[powerful mixed voice]\nNada pode me parar',
        defaultPlacement: 'before_line'
    },
    {
        id: 'chest_voice',
        title: 'Voz de Peito Padrão (Chest Voice)',
        tag: 'chest voice',
        category: 'register',
        badge: 'Registro',
        badgeColor: 'bg-stone-500/10 text-stone-300 border-stone-500/20',
        description: 'Registro natural de fala cantada com ressonância corporal sólida.',
        aiBehavior: 'Enfatiza médios fundamentais e clareza de dicção.',
        example: '[chest voice]\nComeçando nossa história',
        defaultPlacement: 'before_line'
    },
    {
        id: 'deep_chest_voice',
        title: 'Voz de Peito Profunda & Grave (Deep Chest Voice)',
        tag: 'deep chest voice',
        category: 'register',
        badge: 'Registro',
        badgeColor: 'bg-zinc-800 text-zinc-200 border-zinc-600',
        description: 'Voz muito grave, cavernosa, aveludada e profunda (baixo/barítono).',
        aiBehavior: 'Foca no peso dos graves corporais, ideal para versos reflexivos.',
        example: '[deep chest voice]\nNo silêncio da noite escura',
        defaultPlacement: 'before_line'
    },
    {
        id: 'low_register',
        title: 'Registro Grave (Low Register)',
        tag: 'low register',
        category: 'register',
        badge: 'Registro',
        badgeColor: 'bg-stone-700/30 text-stone-300 border-stone-600/30',
        description: 'Canta na parte baixa da tessitura do cantor.',
        aiBehavior: 'Limita as notas da linha melódica para a oitava inferior.',
        example: '[low register]\nPalavras sussurradas no chão',
        defaultPlacement: 'before_line'
    },
    {
        id: 'high_register',
        title: 'Registro Agudo (High Register)',
        tag: 'high register',
        category: 'register',
        badge: 'Registro',
        badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        description: 'Canta no topo agudo da escala tonal.',
        aiBehavior: 'Eleva a melodia para as notas superiores da escala.',
        example: '[high register]\nOuvindo o clamor do alto',
        defaultPlacement: 'before_line'
    },
    {
        id: 'soaring_high_note',
        title: 'Nota Aguda Grandiosa & Aberta (Soaring High Note)',
        tag: 'soaring high note',
        category: 'register',
        badge: 'Clímax',
        badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        description: 'Nota no agudo que voa majestosamente sobre toda a instrumentação.',
        aiBehavior: 'Cria uma sensação cinematográfica de voo e expansão.',
        example: '[soaring high note]\nPARA SEMPRE TEU NOME BRILHARÁ!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'high_climactic_note',
        title: 'Nota Aguda de Clímax (High Climactic Note)',
        tag: 'high climactic note',
        category: 'register',
        badge: 'Clímax',
        badgeColor: 'bg-rose-600/20 text-rose-300 border-rose-500/30',
        description: 'A nota mais alta e catártica de toda a música.',
        aiBehavior: 'Garante o ponto culminante melódico e emocional da faixa.',
        example: '[high climactic note on "SENHOR!"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 9. TRANSIÇÕES DE REGISTRO & QUEBRAS
    // ==========================================
    {
        id: 'chest_to_head_transition',
        title: 'Transição Peito para Cabeça (Chest to Head Voice)',
        tag: 'chest to head voice transition',
        category: 'transition',
        badge: 'Transição',
        badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        description: 'Passagem suave do registro encorpado de peito para a voz de cabeça límpida.',
        aiBehavior: 'Evita cortes abruptos, realizando um legato entre os dois registros.',
        example: '[chest to head voice transition]\nSubindo as montanhas',
        defaultPlacement: 'before_line'
    },
    {
        id: 'chest_to_falsetto',
        title: 'Transição Peito para Falsete (Chest to Falsetto)',
        tag: 'chest to falsetto',
        category: 'transition',
        badge: 'Transição',
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        description: 'Muda de voz firme para um falsete aéreo delicado no meio da frase.',
        aiBehavior: 'Simula a passagem clássica de baladas pop e indie.',
        example: 'Eu quero estar [chest to falsetto] onde você está',
        defaultPlacement: 'before_line'
    },
    {
        id: 'vocal_flip',
        title: 'Vocal Flip / Virada Rápida (Vocal Flip)',
        tag: 'vocal flip',
        category: 'transition',
        badge: 'Transição',
        badgeColor: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
        description: 'Salto repentino e intencional para falsete (estilo yodel/country ou pop diva).',
        aiBehavior: 'Produz um estalo musical característico na quebra de registro.',
        example: 'Te dei meu amor [vocal flip on "amor"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'controlled_vocal_break',
        title: 'Quebra Vocal Controlada (Controlled Vocal Break)',
        tag: 'controlled vocal break',
        category: 'transition',
        badge: 'Transição',
        badgeColor: 'bg-pink-600/10 text-pink-300 border-pink-600/20',
        description: 'Quebra de voz proposital que transmite desespero ou vulnerabilidade autêntica.',
        aiBehavior: 'Cria uma falha calculada sem desafinar o tom principal.',
        example: '[controlled vocal break on "esquecer"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'register_break_emotion',
        title: 'Quebra de Registro por Emoção (Register Break for Emotion)',
        tag: 'register break for emotion',
        category: 'transition',
        badge: 'Transição',
        badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
        description: 'A voz desafoga e parece quebrar sob o peso da dor.',
        aiBehavior: 'Simula o canto de quem está emocionado e perde o controle da garganta por um segundo.',
        example: '[register break for emotion]\nEu não aguento mais',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 10. ATAQUES DE NOTA (ONSETS)
    // ==========================================
    {
        id: 'soft_onset',
        title: 'Ataque Suave (Soft Onset)',
        tag: 'soft onset',
        category: 'onset',
        badge: 'Ataque',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        description: 'A nota surge suavemente, sem percussão ou golpe.',
        aiBehavior: 'Inicia a oscilação da voz de maneira gradual e tranquila.',
        example: '[soft onset]\nComeça em silêncio',
        defaultPlacement: 'before_line'
    },
    {
        id: 'breathy_onset',
        title: 'Ataque com Sopro (Breathy Onset)',
        tag: 'breathy onset',
        category: 'onset',
        badge: 'Ataque',
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        description: 'O ar sai antes do som da vogal, gerando sensação intimista.',
        aiBehavior: 'Insere aspiração inicial antes da nota musical.',
        example: '[breathy onset]\nHá quanto tempo...',
        defaultPlacement: 'before_line'
    },
    {
        id: 'glottal_onset',
        title: 'Ataque Glótico / Firme (Glottal Onset)',
        tag: 'glottal onset',
        category: 'onset',
        badge: 'Ataque',
        badgeColor: 'bg-amber-600/10 text-amber-300 border-amber-600/20',
        description: 'Fechamento abrupto das cordas gerando um ataque percussivo marcante.',
        aiBehavior: 'Enfatiza a consoante ou vogal inicial com impacto seco.',
        example: '[glottal onset]\nAgora é a hora!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'cry_onset',
        title: 'Ataque com Choro (Cry Onset)',
        tag: 'cry onset',
        category: 'onset',
        badge: 'Ataque',
        badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        description: 'Começa a frase com um soluço ou puxada característica de quem chora.',
        aiBehavior: 'Cria uma curva de pitch vindo de cima com ressonância laríngea chorada.',
        example: '[cry onset]\nSenhor, ouve a minha oração',
        defaultPlacement: 'before_line'
    },
    {
        id: 'raspy_onset',
        title: 'Ataque com Rouquidão / Drive (Raspy Onset)',
        tag: 'raspy onset',
        category: 'onset',
        badge: 'Ataque',
        badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
        description: 'A nota nasce direto com drive e rouquidão no primeiro instante.',
        aiBehavior: 'Rasga o primeiro ataque silábico com força.',
        example: '[raspy onset]\nChega de mentir!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'explosive_onset',
        title: 'Ataque Explosivo (Explosive Onset)',
        tag: 'explosive onset',
        category: 'onset',
        badge: 'Ataque',
        badgeColor: 'bg-red-600/20 text-red-300 border-red-500/30',
        description: 'Entrada sem qualquer transição, explodindo no volume máximo.',
        aiBehavior: 'Dispara a voz imediatamente sem ramp-up.',
        example: '[explosive onset]\nVEM ME BUSCAR!',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 11. FINALIZAÇÃO DAS FRASES (ENDINGS)
    // ==========================================
    {
        id: 'soft_ending',
        title: 'Finalização Suave (Soft Ending)',
        tag: 'soft ending',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        description: 'Termina a frase desacelerando a intensidade suavemente.',
        aiBehavior: 'Fecha a cauda da frase sem estalos ou ruídos ásperos.',
        example: 'Fique em paz [soft ending]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'breathy_ending',
        title: 'Finalização Soprada (Breathy Ending)',
        tag: 'breathy ending',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        description: 'A última palavra termina liberando ar expirado com suspiro.',
        aiBehavior: 'Converte a consoante final em um suspiro de alívio ou dor.',
        example: 'E eu me perdi [breathy ending]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'raspy_ending',
        title: 'Finalização Rouca / Rasgada (Raspy Ending)',
        tag: 'raspy ending',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        description: 'O cantor rasga a voz no finalzinho da frase, dando o efeito clássico de rock/blues.',
        aiBehavior: 'Aplica saturação laríngea e quebra suave apenas na cauda da frase.',
        example: 'Lá fora a noite cai\n[raspy sustained ending on "cai"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'melismatic_ending',
        title: 'Finalização com Melisma (Melismatic Ending)',
        tag: 'melismatic ending',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
        description: 'Fecha o verso fazendo um pequeno desenho melódico virtuoso.',
        aiBehavior: 'Executa notas ornamentais na última vogal antes do silêncio.',
        example: 'Para sempre contigo [melismatic ending]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'falling_ending',
        title: 'Final Caindo / Descendente (Falling Ending)',
        tag: 'falling ending',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        description: 'A nota final desce suavemente para um tom mais baixo.',
        aiBehavior: 'Simula um relaxamento melódico em direção ao grave.',
        example: 'Tudo acabou [falling ending]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'vocal_fry_ending',
        title: 'Final com Vocal Fry (Vocal Fry Ending)',
        tag: 'vocal fry ending',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-stone-500/10 text-stone-300 border-stone-500/20',
        description: 'A voz desce no final da palavra e borbulha em vocal fry rouco e grave.',
        aiBehavior: 'Insere o crepitar característico de cordas vocais relaxadas no fim da frase.',
        example: 'Eu tentei te avisar... [vocal fry ending]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'whispered_ending',
        title: 'Final Sussurrado (Whispered Ending)',
        tag: 'whispered ending',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        description: 'A frase é cantada normalmente e a última palavra é apenas sussurrada.',
        aiBehavior: 'Elimina as cordas vocais tônicas e deixa só o ar intencional.',
        example: 'Não esquece de mim [whispered ending]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'emotional_crack_end',
        title: 'Pequena Quebra Emocional no Final (Emotional Crack at the End)',
        tag: 'emotional crack at the end',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-red-400/10 text-red-300 border-red-400/20',
        description: 'A última nota falha comoventemente, como se a pessoa não aguentasse segurar o choro.',
        aiBehavior: 'Produz uma micro-quebra tocante no último fonema.',
        example: 'Por favor, volta [emotional crack at the end]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'fade_final_note',
        title: 'Nota Final Desaparecendo (Fade the Final Note)',
        tag: 'fade the final note',
        category: 'ending',
        badge: 'Finalização',
        badgeColor: 'bg-zinc-600/20 text-zinc-300 border-zinc-500/30',
        description: 'A nota vai sumindo no ar até se dissolver com o eco do instrumental.',
        aiBehavior: 'Aplica envelope de volume decrescente na cauda.',
        example: 'Eternamente... [fade the final note]',
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 12. PORTAMENTO & SLIDES
    // ==========================================
    {
        id: 'vocal_slide',
        title: 'Deslize Vocal / Glissando (Vocal Slide)',
        tag: 'vocal slide',
        category: 'slide',
        badge: 'Slide',
        badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        description: 'Desliza continuamente de uma nota para outra sem saltos secos.',
        aiBehavior: 'Executa portamento suave ligando as alturas tonais.',
        example: '[vocal slide]\nDe onde eu vim até aqui',
        defaultPlacement: 'before_line'
    },
    {
        id: 'pitch_scoop',
        title: 'Pitch Scoop / Entrada por Baixo (Pitch Scoop)',
        tag: 'pitch scoop',
        category: 'slide',
        badge: 'Slide',
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        description: 'Entra na nota vindo ligeiramente de baixo antes de estabilizar na altura exata.',
        aiBehavior: 'Simula o estilo vocal expressivo de blues, pop e soul.',
        example: 'Vem [pitch scoop on "Vem"] me abraçar',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },
    {
        id: 'fall_off',
        title: 'Fall-off / Queda Rápida (Fall-off)',
        tag: 'fall-off',
        category: 'slide',
        badge: 'Slide',
        badgeColor: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
        description: 'Atinge a nota e imediatamente despenca a afinação para baixo de forma solta.',
        aiBehavior: 'Cria uma queda rápida e expressiva no final da palavra.',
        example: 'E tudo caiu! [fall-off]',
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 13. INTERPRETAÇÃO EMOCIONAL
    // ==========================================
    {
        id: 'emotional_vocal',
        title: 'Interpretação Emocional (Emotional Vocal)',
        tag: 'emotional vocal',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        description: 'Voz cheia de sentimento, fugindo da frieza mecânica.',
        aiBehavior: 'Modula respiração, pausas e dinâmicas para transmitir coração.',
        example: '[emotional vocal]\nEu tentei de tudo',
        defaultPlacement: 'before_line'
    },
    {
        id: 'deeply_emotional',
        title: 'Profundamente Emocional (Deeply Emotional)',
        tag: 'deeply emotional',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-rose-600/20 text-rose-300 border-rose-500/30',
        description: 'Carga emocional no ponto mais alto e sincero da canção.',
        aiBehavior: 'Aumenta as nuances interpretativas e o peso expressivo do cantor.',
        example: '[deeply emotional]\nNão há como explicar essa dor',
        defaultPlacement: 'before_line'
    },
    {
        id: 'vulnerable_vocal',
        title: 'Vocal Vulnerável (Vulnerable Vocal)',
        tag: 'vulnerable vocal',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-pink-400/10 text-pink-300 border-pink-400/20',
        description: 'Voz desarmada, honesta, sem defesas, transmitindo fragilidade humana.',
        aiBehavior: 'Reduz a força e destaca o timbre cru e sincero.',
        example: '[vulnerable vocal]\nEu não sei o que fazer',
        defaultPlacement: 'before_line'
    },
    {
        id: 'heartbroken_delivery',
        title: 'Coração Partido (Heartbroken Delivery)',
        tag: 'heartbroken delivery',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
        description: 'Interpretação de perda profunda e abandono doloroso.',
        aiBehavior: 'Simula a voz cansada e machucada de quem chora por amor.',
        example: '[heartbroken delivery]\nAs malas na porta da sala',
        defaultPlacement: 'before_line'
    },
    {
        id: 'crying_tone',
        title: 'Timbre de Choro Contido (Crying Tone)',
        tag: 'crying tone',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-rose-700/20 text-rose-300 border-rose-600/30',
        description: 'Timbre como se estivesse cantando com a garganta engasgada pelo choro.',
        aiBehavior: 'Adiciona ar, pequenas quebras e laringe elevada característica do pranto.',
        example: '[crying tone]\nMesmo quando eu não consigo entender',
        defaultPlacement: 'before_line'
    },
    {
        id: 'desperate_delivery',
        title: 'Interpretação Desesperada (Desperate Delivery)',
        tag: 'desperate delivery',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-red-600/20 text-red-300 border-red-500/30',
        description: 'Voz de desespero urgente, implorando por ajuda ou resposta.',
        aiBehavior: 'Aumenta a velocidade de dicção e o volume com urgência.',
        example: '[desperate delivery]\nMe tira desse lugar!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'pleading_vocal',
        title: 'Vocal Suplicante (Pleading Vocal)',
        tag: 'pleading vocal',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-amber-600/10 text-amber-300 border-amber-600/20',
        description: 'Voz de quem suplica com humildade e reverência.',
        aiBehavior: 'Emite notas com inflexão inclinada para a comoção.',
        example: '[pleading vocal]\nPor misericórdia, olha pra mim',
        defaultPlacement: 'before_line'
    },
    {
        id: 'hopeful_vocal',
        title: 'Interpretação Esperançosa (Hopeful Vocal)',
        tag: 'hopeful vocal',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        description: 'Voz iluminada, serena e confiante de que tudo vai dar certo.',
        aiBehavior: 'Abre as vogais com tom solar e inspirador.',
        example: '[hopeful vocal]\nAmanhã será um novo dia',
        defaultPlacement: 'before_line'
    },
    {
        id: 'joyful_vocal',
        title: 'Interpretação Alegre (Joyful Vocal)',
        tag: 'joyful vocal',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
        description: 'Voz vibrante, com sorriso audível na pronúncia.',
        aiBehavior: 'Acentua ritmo vivo e harmônicos brilhantes.',
        example: '[joyful vocal]\nCelebrando a vida!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'triumphant_vocal',
        title: 'Interpretação Triunfante (Triumphant Vocal)',
        tag: 'triumphant vocal',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        description: 'Voz vitoriosa, épica e cheia de glória.',
        aiBehavior: 'Maximiza projeção e sustentação com autoridade marcial.',
        example: '[triumphant vocal]\nA VITÓRIA É NOSSA!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'prayerful_vocal',
        title: 'Interpretação como Oração (Prayerful Vocal)',
        tag: 'prayerful vocal',
        category: 'emotion',
        badge: 'Gospel / Louvor',
        badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        description: 'Canto devocional, humilde e sagrado, como uma prece ao Altíssimo.',
        aiBehavior: 'Elimina exibicionismos e foca na intimidade espiritual da letra.',
        example: '[prayerful vocal]\nEis-me aqui, Senhor',
        defaultPlacement: 'before_line'
    },
    {
        id: 'confessional_vocal',
        title: 'Interpretação Confessional (Confessional Vocal)',
        tag: 'confessional vocal',
        category: 'emotion',
        badge: 'Emoção',
        badgeColor: 'bg-stone-500/10 text-stone-300 border-stone-500/20',
        description: 'Voz como quem confessa um segredo guardado por anos a fio.',
        aiBehavior: 'Cria ambiente silencioso e próximo de absoluta sinceridade.',
        example: '[confessional vocal]\nEu nunca tive coragem de admitir',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 14. FRASEADO & RITMO
    // ==========================================
    {
        id: 'behind_the_beat',
        title: 'Atrás do Tempo / Laid-Back (Behind the Beat)',
        tag: 'behind the beat',
        category: 'phrasing',
        badge: 'Ritmo',
        badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        description: 'Canta ligeiramente atrasado em relação à bateria (clássico soul/jazz/R&B).',
        aiBehavior: 'Dá aquela sensação de groove relaxado e cheio de estilo.',
        example: '[behind the beat]\nDeixa a música nos levar',
        defaultPlacement: 'before_line'
    },
    {
        id: 'ahead_of_the_beat',
        title: 'Adiantado no Tempo (Ahead of the Beat)',
        tag: 'ahead of the beat',
        category: 'phrasing',
        badge: 'Ritmo',
        badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
        description: 'Canta empurrando o tempo para frente, transmitindo ansiedade e velocidade.',
        aiBehavior: 'Antecipa os ataques silábicos ligeiramente antes do clique.',
        example: '[ahead of the beat]\nCorre que o tempo não espera',
        defaultPlacement: 'before_line'
    },
    {
        id: 'staccato_vocal',
        title: 'Vocal Staccato / Notas Curtas (Staccato Vocal)',
        tag: 'staccato vocal',
        category: 'phrasing',
        badge: 'Ritmo',
        badgeColor: 'bg-amber-600/10 text-amber-300 border-amber-600/20',
        description: 'Notas destacadas, curtas e secas, com silêncio entre as sílabas.',
        aiBehavior: 'Interrompe a reverberação entre cada palavra cantada.',
        example: '[staccato vocal]\nBate. Forte. Sem. Parar.',
        defaultPlacement: 'before_line'
    },
    {
        id: 'legato_vocal',
        title: 'Vocal Legato / Fluido (Legato Vocal)',
        tag: 'legato vocal',
        category: 'phrasing',
        badge: 'Ritmo',
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        description: 'Notas conectadas suavemente como um fio contínuo e macio.',
        aiBehavior: 'Garante transições aveludadas entre palavras sem cortes.',
        example: '[legato vocal]\nComo as águas de um rio tranquilo',
        defaultPlacement: 'before_line'
    },
    {
        id: 'syncopated_vocal',
        title: 'Fraseado Sincopado (Syncopated Vocal)',
        tag: 'syncopated vocal',
        category: 'phrasing',
        badge: 'Ritmo',
        badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        description: 'Acentos fora dos tempos fortes, com suingue brasileiro ou funk/pop.',
        aiBehavior: 'Trabalha contra-tempos ricos na métrica da letra.',
        example: '[syncopated vocal]\nNo balanço do mar',
        defaultPlacement: 'before_line'
    },
    {
        id: 'rubato',
        title: 'Rubato / Tempo Flexível (Rubato)',
        tag: 'rubato',
        category: 'phrasing',
        badge: 'Ritmo',
        badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        description: 'Acelera e desacelera o andamento livremente a serviço da emoção.',
        aiBehavior: 'Desprende o vocal da grade rígida do metrônomo.',
        example: '[rubato]\nQuando fecho os olhos para sonhar',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 15. ARTICULAÇÃO & PRONÚNCIA
    // ==========================================
    {
        id: 'clear_articulation',
        title: 'Dicção Clara & Perfeita (Clear Articulation)',
        tag: 'clear articulation',
        category: 'articulation',
        badge: 'Articulação',
        badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        description: 'Cada consoante e vogal é compreendida perfeitamente pelo ouvinte.',
        aiBehavior: 'Elimina embolamentos e prioriza inteligibilidade vocal máxima.',
        example: '[clear articulation]\nOuça a mensagem com atenção',
        defaultPlacement: 'before_line'
    },
    {
        id: 'elongated_vowels',
        title: 'Vogais Alongadas (Elongated Vowels)',
        tag: 'elongated vowels',
        category: 'articulation',
        badge: 'Articulação',
        badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
        description: 'Abre e estende as vogais centrais da letra (A, E, O).',
        aiBehavior: 'Dedica a maior parte do compasso à sustentação das vogais.',
        example: '[elongated vowels]\nO Teu amooor me alcançou',
        defaultPlacement: 'before_line'
    },
    {
        id: 'stretch_last_syllable',
        title: 'Alongar a Última Sílaba (Stretch the Last Syllable)',
        tag: 'stretch the last syllable',
        category: 'articulation',
        badge: 'Articulação',
        badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        description: 'Segura e arrasta a última sílaba até o próximo compasso.',
        aiBehavior: 'Impede o corte rápido no final do verso.',
        example: 'Eu vou venceeer [stretch the last syllable]',
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 16. AD-LIBS CANTADOS (PARÊNTESES)
    // ==========================================
    {
        id: 'adlib_volta',
        title: 'Ad-lib de Apelo: (volta pra mim...)',
        tag: 'background ad-lib',
        inlineTag: '(volta pra mim...)',
        category: 'adlib',
        badge: 'Ad-lib Cantado',
        badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        description: 'Frase curta cantada entre parênteses em resposta à letra principal.',
        aiBehavior: 'A IA instrui o vocalista secundário a CANTAR a frase entre parênteses.',
        example: 'Eu ainda espero por você\n(volta pra mim...)',
        defaultPlacement: 'adlib'
    },
    {
        id: 'adlib_yeah',
        title: 'Ad-lib Enérgico: (yeah!)',
        tag: 'powerful gospel ad-lib',
        inlineTag: '(yeah!)',
        category: 'adlib',
        badge: 'Ad-lib Cantado',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        description: 'Exclamação enérgica cantada para marcar o groove ou refrão.',
        aiBehavior: 'Produz uma pontuação rítmica com força vocal ao fundo.',
        example: '[powerful gospel ad-lib]\n(yeah!)',
        defaultPlacement: 'adlib'
    },
    {
        id: 'adlib_oh_melismatic',
        title: 'Ad-lib com Melisma: (oh-oh-oh...)',
        tag: 'melismatic ad-lib',
        inlineTag: '(oh-oh-oh...)',
        category: 'adlib',
        badge: 'Ad-lib Cantado',
        badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        description: 'Ad-lib com ondulação melódica expressiva que preenche pausas.',
        aiBehavior: 'Gera floreio melódico cantado em ad-lib suave.',
        example: '[melismatic ad-lib]\n(oh-oh-oh...)',
        defaultPlacement: 'adlib'
    },
    {
        id: 'adlib_deus',
        title: 'Ad-lib Worship: (meu Deus...)',
        tag: 'prayerful ad-lib',
        inlineTag: '(meu Deus...)',
        category: 'adlib',
        badge: 'Ad-lib Cantado',
        badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        description: 'Exclamação de adoração ou oração espontânea no fundo do louvor.',
        aiBehavior: 'Produz resposta devocional com reverb em segundo plano.',
        example: 'Tu és fiel\n(meu Deus...)',
        defaultPlacement: 'adlib'
    },
    {
        id: 'adlib_hallelujah',
        title: 'Ad-lib: (Aleluia / Hallelujah)',
        tag: 'gospel choir ad-lib',
        inlineTag: '(Aleluia!)',
        category: 'adlib',
        badge: 'Ad-lib Cantado',
        badgeColor: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        description: 'Clamor de louvor cantado por uma segunda voz ou coral.',
        aiBehavior: 'Entra em resposta direta à frase do vocalista principal.',
        example: 'Ele ressuscitou!\n(Aleluia!)',
        defaultPlacement: 'adlib'
    },
    {
        id: 'adlib_call_response',
        title: 'Call & Response: Vocal canta e coro responde',
        tag: 'background gospel choir, call and response',
        inlineTag: '(Ele vive!)',
        category: 'adlib',
        badge: 'Call & Response',
        badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        description: 'O líder canta o verso e o coro responde imediatamente entre parênteses.',
        aiBehavior: 'Estabelece a dinâmica clássica de pergunta e resposta vocal.',
        example: 'Lead: Eu sei que Ele vive\n[background gospel choir, call and response]\n(Ele vive!)',
        defaultPlacement: 'adlib'
    },

    // ==========================================
    // 17. BACKING VOCALS & COROS (CHOIR)
    // ==========================================
    {
        id: 'background_vocals',
        title: 'Backing Vocals Gerais (Background Vocals)',
        tag: 'background vocals',
        category: 'harmony',
        badge: 'Backing',
        badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        description: 'Ativa vozes secundárias de apoio harmônico.',
        aiBehavior: 'Cria uma base vocal estéreo para apoiar o cantor principal.',
        example: '[background vocals]\nSegurando o andamento',
        defaultPlacement: 'before_line'
    },
    {
        id: 'soft_backing_vocals',
        title: 'Backing Vocals Suaves (Soft Backing Vocals)',
        tag: 'soft backing vocals',
        category: 'harmony',
        badge: 'Backing',
        badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
        description: 'Vozes de fundo delicadas, sem competir com a linha principal.',
        aiBehavior: 'Nivela o volume dos coros abaixo do vocal líder.',
        example: '[soft backing vocals]\nAcompanhando o refrão',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gospel_backing_vocals',
        title: 'Backing Vocals Gospel (Gospel Backing Vocals)',
        tag: 'gospel backing vocals',
        category: 'harmony',
        badge: 'Gospel',
        badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        description: 'Vozes ricas com harmonização em terças, sextas e ad-libs de apoio.',
        aiBehavior: 'Insere dinâmica de coral gospel contemporâneo e worship.',
        example: '[gospel backing vocals]\n(Tu és Santo, Tu és Digno)',
        defaultPlacement: 'before_line'
    },
    {
        id: 'choir_enters',
        title: 'Entrada do Coral (Choir Enters)',
        tag: 'choir enters',
        category: 'harmony',
        badge: 'Coral',
        badgeColor: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        description: 'Momento exato em que o coro completo se junta à música.',
        aiBehavior: 'Expande a amplitude estéreo instantaneamente com vozes múltiplas.',
        example: '[choir enters]\nSANTO, SANTO ÉS TU!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'large_gospel_choir',
        title: 'Coral Gospel Grande (Large Gospel Choir)',
        tag: 'large gospel choir',
        category: 'harmony',
        badge: 'Coral Gospel',
        badgeColor: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
        description: 'Um coro imenso com dezenas de vozes masculinas e femininas.',
        aiBehavior: 'Gera uma massa coral imersiva e emocionante.',
        example: '[large gospel choir, uplifting harmonies]\nLouvai ao Senhor!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'epic_choir',
        title: 'Coro Épico & Cinematográfico (Epic Choir)',
        tag: 'epic choir',
        category: 'harmony',
        badge: 'Coral Épico',
        badgeColor: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
        description: 'Coro grandioso com reverb de catedral para clímax majestosos.',
        aiBehavior: 'Espalha harmonia sinfônica com impacto cinematográfico.',
        example: '[epic choir, massive vocal wall]\nO REI DOS REIS!',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 18. HARMONIAS (HARMONIES)
    // ==========================================
    {
        id: 'two_part_harmony',
        title: 'Harmonia em Duas Vozes (Two-Part Harmony)',
        tag: 'two-part harmony',
        category: 'harmony',
        badge: 'Harmonia',
        badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        description: 'Duas vozes cantando em paralelo (geralmente em terças).',
        aiBehavior: 'Adiciona uma segunda voz cantante em intervalo consoante.',
        example: '[two-part harmony]\nCaminhando lado a lado',
        defaultPlacement: 'before_line'
    },
    {
        id: 'three_part_harmony',
        title: 'Harmonia em Três Vozes (Three-Part Harmony)',
        tag: 'three-part harmony',
        category: 'harmony',
        badge: 'Harmonia',
        badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        description: 'Acorde vocal completo formado por três cantores afinados.',
        aiBehavior: 'Monta tríades vocais completas sob o tema principal.',
        example: '[three-part harmony]\nEm um só coração',
        defaultPlacement: 'before_line'
    },
    {
        id: 'tight_harmonies',
        title: 'Harmonias Fechadas / Próximas (Tight Harmonies)',
        tag: 'tight harmonies',
        category: 'harmony',
        badge: 'Harmonia',
        badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
        description: 'Intervalos próximos e muito bem alinhados ritmicamente.',
        aiBehavior: 'Gera sensação de conjunto vocal acústico impecável.',
        example: '[tight harmonies]\nNão há distância entre nós',
        defaultPlacement: 'before_line'
    },
    {
        id: 'octave_harmony',
        title: 'Dobra em Oitava (Octave Harmony)',
        tag: 'octave harmony',
        category: 'harmony',
        badge: 'Harmonia',
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        description: 'Uma segunda voz dobrando a melodia exatamente uma oitava acima ou abaixo.',
        aiBehavior: 'Dá corpo e profundidade à voz principal sem criar novos acordes.',
        example: '[octave harmony]\nOuvindo o meu chamado',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 19. DOBRAS E CAMADAS (DOUBLES / STACKS)
    // ==========================================
    {
        id: 'vocal_double',
        title: 'Dobra Vocal / Double Tracking (Vocal Double)',
        tag: 'vocal double',
        category: 'doubles',
        badge: 'Dobra',
        badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        description: 'A voz principal cantada duas vezes para engrossar o som.',
        aiBehavior: 'Simula duas gravações sincronizadas da mesma melodia.',
        example: '[vocal double]\nMinha força renovada',
        defaultPlacement: 'before_line'
    },
    {
        id: 'wide_vocal_doubles',
        title: 'Dobras Abertas no Estéreo (Wide Vocal Doubles)',
        tag: 'wide vocal doubles',
        category: 'doubles',
        badge: 'Dobra',
        badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        description: 'Dobras paneadas para os canais esquerdo e direito, abrindo o som.',
        aiBehavior: 'Aumenta a largura estéreo da voz na mixagem.',
        example: '[wide vocal doubles]\nEnchendo toda a sala',
        defaultPlacement: 'before_line'
    },
    {
        id: 'stacked_vocals',
        title: 'Empilhamento de Vozes (Stacked Vocals)',
        tag: 'stacked vocals',
        category: 'doubles',
        badge: 'Camadas',
        badgeColor: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
        description: 'Múltiplas camadas vocais empilhadas criando uma parede sonora densa.',
        aiBehavior: 'Produz sonoridade densa de superprodução pop ou hino.',
        example: '[stacked vocals, full harmony]\nESTAMOS JUNTOS!',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 20. SUSSURRO / FALADO / VOCAL FRY
    // ==========================================
    {
        id: 'whisper',
        title: 'Sussurrado (Whisper)',
        tag: 'whisper',
        category: 'whisper_fry',
        badge: 'Sussurro',
        badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        description: 'Texto inteiramente sussurrado sem altura tonal definida.',
        aiBehavior: 'Filtra os graves e destaca ar e proximidade estéreo.',
        example: '[whisper]\nNão faça barulho...',
        defaultPlacement: 'before_line'
    },
    {
        id: 'spoken',
        title: 'Texto Falado / Recitado (Spoken)',
        tag: 'spoken',
        category: 'whisper_fry',
        badge: 'Falado',
        badgeColor: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
        description: 'O artista fala as palavras em tom conversacional ou dramático.',
        aiBehavior: 'Remove a melodia cantada e aplica cadência rítmica falada.',
        example: '[spoken]\nEu me lembro daquele dia...',
        defaultPlacement: 'before_line'
    },
    {
        id: 'half_spoken_half_sung',
        title: 'Meio Falado / Meio Cantado (Half-Spoken Half-Sung)',
        tag: 'half-spoken half-sung',
        category: 'whisper_fry',
        badge: 'Recitado',
        badgeColor: 'bg-stone-500/10 text-stone-300 border-stone-500/20',
        description: 'Estilo de narrativa musical poética entre o canto e a conversa.',
        aiBehavior: 'Equilibra afinação sutil com dicção de fala.',
        example: '[half-spoken half-sung]\nE os dias foram passando devagar',
        defaultPlacement: 'before_line'
    },
    {
        id: 'vocal_fry',
        title: 'Vocal Fry Contínuo (Vocal Fry)',
        tag: 'vocal fry',
        category: 'whisper_fry',
        badge: 'Vocal Fry',
        badgeColor: 'bg-amber-600/10 text-amber-300 border-amber-600/20',
        description: 'Crepitar rouco e relaxado das pregas vocais em notas muito graves.',
        aiBehavior: 'Adiciona textura granular de crepitação vocal.',
        example: '[vocal fry]\nTudo que restou...',
        defaultPlacement: 'before_line'
    },
    {
        id: 'vocal_fry_onset',
        title: 'Início de Frase com Vocal Fry (Vocal Fry Onset)',
        tag: 'vocal fry onset',
        category: 'whisper_fry',
        badge: 'Vocal Fry',
        badgeColor: 'bg-amber-700/20 text-amber-300 border-amber-600/30',
        description: 'Começa a frase com aquele borbulhar rouco característico antes de abrir a voz.',
        aiBehavior: 'Inicia o som com crepitação grave e transiciona para a nota límpida.',
        example: '[vocal fry onset]\nEu não queria te perder',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 21. EFEITOS DE CHORO & SOLUÇO
    // ==========================================
    {
        id: 'crying_vocal_texture',
        title: 'Textura Vocal de Choro (Crying Vocal Texture)',
        tag: 'crying vocal texture',
        category: 'cry_sob',
        badge: 'Choro',
        badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        description: 'Voz que transmite a sensação física de lágrimas rolando na interpretação.',
        aiBehavior: 'Aplica instabilidade terna de pitch e ressonância laríngea chorosa.',
        example: '[crying vocal texture]\nComo eu sinto a tua falta',
        defaultPlacement: 'before_line'
    },
    {
        id: 'voice_breaking_emotion',
        title: 'Voz Quebrando de Emoção (Voice Breaking with Emotion)',
        tag: 'voice breaking with emotion',
        category: 'cry_sob',
        badge: 'Choro',
        badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
        description: 'A voz sofre pequenas quebras sinceras provocadas pela comoção do verso.',
        aiBehavior: 'Insere fissuras expressivas na continuidade da frase.',
        example: '[voice breaking with emotion]\nMesmo assim, eu ainda acredito',
        defaultPlacement: 'before_line'
    },
    {
        id: 'subtle_sob',
        title: 'Leve Sensação de Soluço (Subtle Sob)',
        tag: 'subtle sob',
        category: 'cry_sob',
        badge: 'Choro',
        badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
        description: 'Pequena puxada de ar com soluço antes de uma palavra chave.',
        aiBehavior: 'Produz uma contração vocal humana sutil e tocante.',
        example: 'E quando eu te vi [subtle sob on "vi"]',
        supportsWordTarget: true,
        defaultPlacement: 'after_line'
    },

    // ==========================================
    // 22. GÊNEROS: GOSPEL, ROCK, COUNTRY, R&B
    // ==========================================
    {
        id: 'gospel_vocal',
        title: 'Interpretação Gospel Autêntica (Gospel Vocal)',
        tag: 'gospel vocal',
        category: 'genre',
        badge: 'Gospel',
        badgeColor: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        description: 'Estilo de adoração e louvor com paixão, vigor espiritual e expressão corporal audível.',
        aiBehavior: 'Direciona a IA para fraseados de louvor, dinâmicas de igreja e melismas gospel.',
        example: '[gospel vocal, soulful interpretation]\nTu és Santo, meu Senhor',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gospel_runs',
        title: 'Runs & Floreios Gospel (Gospel Runs)',
        tag: 'gospel runs',
        category: 'genre',
        badge: 'Gospel',
        badgeColor: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
        description: 'Sequências de notas em escalas pentatônicas gospel características.',
        aiBehavior: 'Aplica agilidade virtuosística com acentuações pentecostais.',
        example: '[gospel runs]\n(Oooooh-oh-oh-oh-oh)',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gospel_shout',
        title: 'Grito Gospel / Clamor (Gospel Shout)',
        tag: 'gospel shout',
        category: 'genre',
        badge: 'Gospel',
        badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
        description: 'Exclamação potente e afinada com pegada de júbilo e celebração.',
        aiBehavior: 'Projeta um grito harmônico e musical cheio de unção.',
        example: '[gospel shout]\nELE RESSUSCITOU!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'gospel_climax',
        title: 'Clímax Vocal Gospel (Gospel Vocal Climax)',
        tag: 'gospel vocal climax',
        category: 'genre',
        badge: 'Gospel',
        badgeColor: 'bg-yellow-500/25 text-yellow-200 border-yellow-400/40',
        description: 'O momento de maior poder espiritual e intensidade na música de adoração.',
        aiBehavior: 'Une coro gospel, notas agudas em belting rasgado e ad-libs contínuos.',
        example: '[gospel vocal climax, full choir, extended melisma]\nGLÓRIA, GLÓRIA NAS ALTURAS!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'rock_rasp',
        title: 'Rouquidão Rock Tradicional (Rock Rasp)',
        tag: 'rock rasp',
        category: 'genre',
        badge: 'Rock',
        badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
        description: 'Rouquidão marcante no vocal, típica de clássicos do rock e grunge.',
        aiBehavior: 'Adiciona textura áspera e encorpada de atitude rock.',
        example: '[rock rasp]\nCorrendo na contramão',
        defaultPlacement: 'before_line'
    },
    {
        id: 'rock_belt',
        title: 'Belting Rock / Agudo Poderoso (Rock Belt)',
        tag: 'rock belt',
        category: 'genre',
        badge: 'Rock',
        badgeColor: 'bg-red-600/20 text-red-300 border-red-500/30',
        description: 'Agudo potente com sustain de guitarra e pegada pesada.',
        aiBehavior: 'Projeta notas agudas de peito com drive no refrão rock.',
        example: '[rock belt]\nNÃO HÁ MAIS VOLTA!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'country_twang',
        title: 'Twang Country / Sertanejo (Country Twang)',
        tag: 'country twang',
        category: 'genre',
        badge: 'Country',
        badgeColor: 'bg-amber-600/15 text-amber-300 border-amber-600/30',
        description: 'Ressonância anasalada e brilhante típica de country e sertanejo de raiz.',
        aiBehavior: 'Destaca frequências médias-altas com dicção característica.',
        example: '[country twang]\nNa poeira desse chão',
        defaultPlacement: 'before_line'
    },
    {
        id: 'smooth_rnb',
        title: 'Fraseado R&B Suave (Smooth R&B Phrasing)',
        tag: 'smooth R&B phrasing',
        category: 'genre',
        badge: 'R&B',
        badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
        description: 'Dicção aveludada, suave e com ritmo sedutor no tempo da música.',
        aiBehavior: 'Conecta as sílabas com elegância e sensualidade acústica.',
        example: '[smooth R&B phrasing]\nSó quero você aqui perto',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 23. ESPAÇO & EFEITOS DE PRODUÇÃO
    // ==========================================
    {
        id: 'vocal_reverb',
        title: 'Reverb Vocal Espacial (Vocal Reverb)',
        tag: 'vocal reverb',
        category: 'production',
        badge: 'Produção',
        badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        description: 'Espaço acústico envolvente com ambiência natural.',
        aiBehavior: 'Aplica cauda de reverberação ampla no vocal.',
        example: '[vocal reverb]\nEcoando pelo vale',
        defaultPlacement: 'before_line'
    },
    {
        id: 'large_hall_reverb',
        title: 'Reverb de Salão Grande / Catedral (Large Hall Reverb)',
        tag: 'large hall reverb',
        category: 'production',
        badge: 'Produção',
        badgeColor: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
        description: 'Reverb profundo que simula uma catedral imensa ou auditório monumental.',
        aiBehavior: 'Alonga o tempo de decaimento do espaço acústico.',
        example: '[large hall reverb]\nSopra o vento do Espírito',
        defaultPlacement: 'before_line'
    },
    {
        id: 'vocal_delay',
        title: 'Delay Vocal com Repetições (Vocal Delay)',
        tag: 'vocal delay',
        category: 'production',
        badge: 'Produção',
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        description: 'Ecos rítmicos que se repetem no tempo da música.',
        aiBehavior: 'Cria repetições sincopadas nas caudas das palavras.',
        example: 'Nunca mais... [vocal delay]',
        defaultPlacement: 'after_line'
    },
    {
        id: 'close_mic_vocal',
        title: 'Microfone Extremamente Próximo (Close-Mic Vocal)',
        tag: 'close-mic vocal',
        category: 'production',
        badge: 'Produção',
        badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        description: 'Efeito de proximidade máxima, captando a respiração e intimidade como ao ouvido.',
        aiBehavior: 'Remove ambiência distante e foca na presença direta da voz.',
        example: '[close-mic vocal, intimate breathy tone]\nOuça o que eu vou te dizer',
        defaultPlacement: 'before_line'
    },
    {
        id: 'wide_stereo_vocals',
        title: 'Vocal Aberto no Estéreo (Wide Stereo Vocals)',
        tag: 'wide stereo vocals',
        category: 'production',
        badge: 'Produção',
        badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        description: 'Espalha as vozes nas pontas do fone de ouvido, gerando imersão panorâmica.',
        aiBehavior: 'Abre a mixagem do vocal pelos canais laterais L e R.',
        example: '[wide stereo vocals]\nEm todos os cantos',
        defaultPlacement: 'before_line'
    },
    {
        id: 'ethereal_vocal_effect',
        title: 'Efeito Vocal Etéreo / Místico (Ethereal Vocal Effect)',
        tag: 'ethereal vocal effect',
        category: 'production',
        badge: 'Produção',
        badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        description: 'Voz flutuante com shimmer, reverb difuso e sensação celestial.',
        aiBehavior: 'Processa o vocal com brilho místico e caudas harmônicas sonhadoras.',
        example: '[ethereal vocal effect]\nAlém do véu do tempo',
        defaultPlacement: 'before_line'
    },

    // ==========================================
    // 24. CLÍMAX & COMBOS SUGERIDOS NO ESTUDO
    // ==========================================
    {
        id: 'combo_worship_climax',
        title: 'Combo Clímax Worship / Louvor',
        tag: 'vocal climax, powerful raspy belt, sustained high note, emotional vibrato, extended gospel melisma',
        category: 'climax',
        badge: 'Clímax Supremo',
        badgeColor: 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-200 border-amber-500/40',
        description: 'Combina: Belting rasgado potente + Nota aguda sustentada + Vibrato emocional + Melisma gospel estendido.',
        aiBehavior: 'Instrui a IA a executar a progressão perfeita do clímax: ataque potente, introdução de drive, sustentação, vibrato e resolução em melisma.',
        example: '[vocal climax, powerful raspy belt, sustained high note, emotional vibrato, extended gospel melisma]\nEu sei que meu Redentor vive!',
        defaultPlacement: 'before_line'
    },
    {
        id: 'combo_phrase_evolution',
        title: 'Combo Evolução Dentro da Frase',
        tag: 'starts soft and breathy, gradually becomes stronger, ends with a powerful raspy belt and extended melisma',
        category: 'climax',
        badge: 'Evolução',
        badgeColor: 'bg-gradient-to-r from-cyan-500/20 to-orange-500/20 text-cyan-200 border-cyan-500/40',
        description: 'Começa suave e soprado, vai ganhando força e termina com belting rasgado potente e melisma.',
        aiBehavior: 'Desenvolve uma transição dinâmica contínua dentro de uma única linha melódica.',
        example: '[starts soft and breathy, gradually becomes stronger, ends with a powerful raspy belt and extended melisma]\nEu nunca vou desistir de você',
        defaultPlacement: 'before_line'
    },
    {
        id: 'combo_final_chorus',
        title: 'Combo Refrão Final Grandioso',
        tag: 'full vocal power, gospel intensity, layered harmonies, large gospel choir, vocal climax',
        category: 'climax',
        badge: 'Grande Final',
        badgeColor: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
        description: 'Potência máxima, intensidade gospel, harmonias em camadas e entrada do grande coral.',
        aiBehavior: 'Explode todos os elementos vocais no auge da canção.',
        example: '[Final Chorus: full vocal power, gospel intensity, layered harmonies, large gospel choir, vocal climax]',
        defaultPlacement: 'header'
    },
    {
        id: 'combo_intimate_verse',
        title: 'Combo Verso Íntimo & Emotivo',
        tag: 'intimate close-mic vocal, warm tone, slightly breathy, restrained vocal',
        category: 'climax',
        badge: 'Verso Emotivo',
        badgeColor: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
        description: 'Vocal próximo ao microfone, quente, ligeiramente soprado e contido.',
        aiBehavior: 'Traz foco e intimidade para a narrativa dos primeiros versos.',
        example: '[Verse 1: intimate close-mic vocal, warm tone, slightly breathy]',
        defaultPlacement: 'header'
    }
];
