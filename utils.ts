
export function getClozeIndices(text: string): number[] {
  const regex = /{{c(\d+)::.*?}}/g;
  const indices = new Set<number>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    indices.add(parseInt(match[1]));
  }
  return Array.from(indices).sort((a, b) => a - b);
}

export function renderCloze(text: string, ordinal: number, showAnswer: boolean): string {
  const regex = /{{c(\d+)::(.*?)(?:::(.*?))?}}/g;
  return text.replace(regex, (match, cardOrd, content, hint) => {
    const currentOrd = parseInt(cardOrd);
    if (currentOrd === ordinal) {
      return showAnswer 
        ? `<span class="bg-blue-600 text-white font-bold px-2 py-0.5 rounded shadow-sm scale-105 inline-block transition-all">${content}</span>`
        : `<span class="bg-blue-100 dark:bg-blue-900/40 text-blue-600 border-b-2 border-blue-500 px-4 rounded animate-pulse cursor-help font-bold text-sm" title="${hint || 'Javobni ko\'rish uchun bosing'}">[${hint || '...'}]</span>`;
    }
    return content;
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  if (hours > 0) return `${hours} soat ${minutes} daqiqa`;
  if (minutes > 0) return `${minutes} daqiqa ${seconds} soniya`;
  return `${seconds} soniya`;
}

export const MOTIVATION_DATA = {
  quotes: [
    {
      text: "Robbi zidni 'ilma.",
      translation: "Parvardigorim, ilmimni ziyoda qil.",
      source: "Toha surasi, 114-oyat"
    },
    {
      text: "Albatta, Allohdan bandalari ichida faqat olimlargina qo'rqurlar.",
      translation: "Ilm egalari Allohning qudratini chin dildan his qiladilar.",
      source: "Fotir surasi, 28-oyat"
    },
    {
      text: "Ilm talab qilish har bir musulmon uchun farzdir.",
      translation: "Bilim olish nafaqat ehtiyoj, balki muqaddas burchdir.",
      source: "Hadisi Sharif"
    },
    {
      text: "Ilm – bu nurdir, Alloh uni istagan bandasining qalbiga soladi.",
      translation: "Haqiqiy bilim qalbni yorituvchi ilohiy ne'matdir.",
      source: "Imom Shofiiy"
    },
    {
      text: "Kim ilm yo'lini tutsa, Alloh unga jannat yo'lini oson qiladi.",
      translation: "Bilim sari tashlangan har bir qadam saodatga elitadi.",
      source: "Hadisi Sharif"
    }
  ],
  tips: [
    "Har kuni kamida 15 daqiqa takrorlashni odat qiling.",
    "Uyqudan oldin yangi kartalarni ko'rib chiqish xotirani mustahkamlaydi.",
    "Mantiqiy bog'liqliklar yarating, quruq yodlashdan qoching.",
    "Eng qiyin kartalarga ko'proq e'tibor bering, 'Again' tugmasidan qo'rqmang.",
    "Ilmni boshqalarga o'rgatish – uni mustahkamlashning eng yaxshi yo'li."
  ]
};

export function getRandomMotivation() {
  const quote = MOTIVATION_DATA.quotes[Math.floor(Math.random() * MOTIVATION_DATA.quotes.length)];
  const tip = MOTIVATION_DATA.tips[Math.floor(Math.random() * MOTIVATION_DATA.tips.length)];
  return { quote, tip };
}
