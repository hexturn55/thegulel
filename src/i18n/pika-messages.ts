/**
 * Message catalog for the Pika Studio admin UI, routed through next-intl.
 *
 * The app stores per-locale content in DB columns (titleHi/titleZh) and does
 * not currently wire next-intl globally, so the Pika Studio panel mounts its
 * own `NextIntlClientProvider` with these messages. Locales mirror the app's
 * supported set: English, Hindi, Chinese.
 */

export const pikaLocales = ['en', 'hi', 'zh'] as const;
export type PikaLocale = (typeof pikaLocales)[number];

type PikaMessages = {
  PikaStudio: Record<string, string>;
};

const en: PikaMessages = {
  PikaStudio: {
    title: 'Pika Studio',
    subtitle: 'Generate promos, posters and shorts, and score virality.',
    promo: 'Promo / Trailer',
    poster: 'Poster / Thumbnail',
    reframe: 'Vertical 9:16 Reframe',
    virality: 'Virality Score',
    promptLabel: 'Prompt',
    imageUrlLabel: 'Source image URL',
    videoUrlLabel: 'Video URL',
    generate: 'Generate',
    score: 'Score',
    refresh: 'Refresh',
    jobs: 'Jobs',
    noJobs: 'No jobs yet.',
    statusPending: 'Queued',
    statusProcessing: 'Processing',
    statusCompleted: 'Completed',
    statusFailed: 'Failed',
    play: 'Play promo',
    open: 'Open media',
    working: 'Working…',
    scorePrefix: 'Virality',
  },
};

const hi: PikaMessages = {
  PikaStudio: {
    title: 'पिका स्टूडियो',
    subtitle: 'प्रोमो, पोस्टर और शॉर्ट्स बनाएं, और वायरलिटी स्कोर करें।',
    promo: 'प्रोमो / ट्रेलर',
    poster: 'पोस्टर / थंबनेल',
    reframe: 'वर्टिकल 9:16 रीफ्रेम',
    virality: 'वायरलिटी स्कोर',
    promptLabel: 'प्रॉम्प्ट',
    imageUrlLabel: 'स्रोत छवि URL',
    videoUrlLabel: 'वीडियो URL',
    generate: 'बनाएं',
    score: 'स्कोर',
    refresh: 'रिफ्रेश',
    jobs: 'जॉब्स',
    noJobs: 'अभी कोई जॉब नहीं।',
    statusPending: 'कतार में',
    statusProcessing: 'प्रोसेसिंग',
    statusCompleted: 'पूर्ण',
    statusFailed: 'विफल',
    play: 'प्रोमो चलाएं',
    open: 'मीडिया खोलें',
    working: 'काम चल रहा है…',
    scorePrefix: 'वायरलिटी',
  },
};

const zh: PikaMessages = {
  PikaStudio: {
    title: 'Pika 工作室',
    subtitle: '生成预告片、海报和竖屏短片，并预测传播力。',
    promo: '预告片',
    poster: '海报 / 缩略图',
    reframe: '竖屏 9:16 重构',
    virality: '传播力评分',
    promptLabel: '提示词',
    imageUrlLabel: '源图片 URL',
    videoUrlLabel: '视频 URL',
    generate: '生成',
    score: '评分',
    refresh: '刷新',
    jobs: '任务',
    noJobs: '暂无任务。',
    statusPending: '排队中',
    statusProcessing: '处理中',
    statusCompleted: '已完成',
    statusFailed: '失败',
    play: '播放预告片',
    open: '打开媒体',
    working: '处理中…',
    scorePrefix: '传播力',
  },
};

const catalogs: Record<PikaLocale, PikaMessages> = { en, hi, zh };

export function getPikaMessages(locale: string): PikaMessages {
  return catalogs[(locale as PikaLocale)] ?? en;
}
