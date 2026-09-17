/**
 * Mini App: «Цифровая служба школьной медиации» (VK Mini App & Telegram WebApp)
 * Клиентская логика приложения.
 */

const tg = window.Telegram?.WebApp;
const isVK = typeof vkBridge !== 'undefined' || window.location.search.includes('vk_');

// Состояние приложения
const state = {
  currentTab: 'home',
  userId: 0,
  userName: 'Ученик',
  wizard: {
    step: 1,
    opponent: 'Одноклассник / сверстник',
    category: 'Травля / подколы в классе или чате',
    description: '',
    imageBase64: null,
    imageMime: 'image/jpeg'
  },
  kbArticles: [],
  chatHistory: []
};

// =====================================================================
// ВСТРОЕННЫЕ КЛИЕНТСКИЕ ДАННЫЕ И МЕДИАТОР (РАБОТАЕТ БЕЗ СЕРВЕРА 24/7)
// =====================================================================
const FALLBACK_ARTICLES = [
  {
    id: "phone_law",
    tag: "Закон и права",
    icon: "📱",
    title: "Имеет ли учитель право отбирать телефон на уроке?",
    summary: "По закону РФ телефон — личная частная собственность. Учитель вправе требовать убрать его в рюкзак, но не имеет права изымать силой или читать переписку.",
    content: "**Правовой разбор:**\n\n• **Статья 35 Конституции РФ:** никто не может быть лишен своего имущества иначе как по решению суда.\n• **Статья 43 ФЗ «Об образовании в РФ»:** с 2024 года закон запрещает пользоваться телефонами во время уроков (за исключением экстренных ситуаций).\n• **Что разрешено учителю:** сделать замечание, попросить убрать телефон в рюкзак, вызвать родителей или составить докладную записку.\n• **Что категорически запрещено:** выхватывать телефон из рук, удерживать его после уроков, а тем более проверять галерею или мессенджеры (это прямое нарушение тайны переписки, ст. 138 УК РФ).\n\n💡 **Как грамотно ответить:** *«Я убираю телефон в рюкзак и не буду им пользоваться. Отдавать в руки я его не обязан, так как это моя личная собственность»*."
  },
  {
    id: "bullying_law",
    tag: "Безопасность",
    icon: "🛡️",
    title: "Что считается буллингом по закону и какая ответственность?",
    summary: "Травля — это не «шутки», а наказуемое правонарушение: оскорбления, клевета, шантаж и слив личных данных преследуются законом РФ.",
    content: "**Ответственность за буллинг и кибербуллинг:**\n\n• **Оскорбление (ст. 5.61 КоАП РФ):** унижение чести и достоинства влечет административный штраф (до 16 лет штраф платят родители обидчика).\n• **Клевета (ст. 128.1 УК РФ):** распространение заведомо ложных сведений, порочащих честь.\n• **Нарушение неприкосновенности частной жизни (ст. 137 УК РФ):** публикация чужих фото, скринов переписок без согласия — уголовное преступление.\n• **Угрозы и вымогательство (ст. 119 и 163 УК РФ):** требования денег, еды или угрозы физической расправой.\n\n💡 **Что делать:** обязательно сохраняйте скриншоты, аудиозаписи и ссылки на сообщения обидчиков. Это юридические доказательства."
  },
  {
    id: "nno_formula",
    tag: "Медиация",
    icon: "🤝",
    title: "Формула ненасильственного общения (ННО): как осадить без мата",
    summary: "Психологический метод Маршалла Розенберга, позволяющий остановить агрессию оппонента в 4 простых шага.",
    content: "**4 шага формулы ННО:**\n\n1. **Констатация факта (без оценки и обвинений):** *«Когда ты громко обсуждаешь мой ответ у доски...»*\n2. **Озвучивание чувства:** *«...мне неприятно и это сбивает меня с мысли»*\n3. **Озвучивание потребности:** *«...потому что для меня важно спокойно сосредоточиться на уроке»*\n4. **Конкретная спокойная просьба:** *«...пожалуйста, не комментируй мои ответы»*.\n\n🔥 **Почему это работает:** вы не оскорбляете в ответ, поэтому оппоненту не за что зацепиться для продолжения скандала."
  },
  {
    id: "parents_talk",
    tag: "Семья",
    icon: "👨‍👩‍👧",
    title: "Как рассказать родителям о сложной ситуации без криков",
    summary: "Инструкция, как получить от родителей защиту и поддержку, а не упреки и разочарование.",
    content: "**Пошаговый сценарий доверительного разговора:**\n\n1. **Выберите спокойный момент:** не начинайте разговор в спешке перед работой или когда родители только зашли уставшие домой.\n2. **Скажите волшебную фразу:** *«Мама / папа, мне сейчас очень нужна ваша помощь и совет как взрослых. Пожалуйста, просто выслушайте меня спокойно, без криков»*.\n3. **Расскажите факты:** без преувеличений и оправданий опишите, что произошло.\n4. **Обозначьте свои переживания:** *«Я сам(а) очень переживаю из-за этого и не знаю, как поступить правильно»*.\n5. **Попросите конкретной помощи:** *«Помогите мне поговорить с классным руководителем»* или *«Давайте вместе решим этот вопрос»*."
  },
  {
    id: "school_mediation",
    tag: "Служба примирения",
    icon: "⚖️",
    title: "Школьная служба медиации: как решить конфликт без наказания",
    summary: "Во многих школах действует Служба примирения. Это добровольные переговоры с нейтральным медиатором без двоек за поведение.",
    content: "**Что такое школьная медиация:**\n\n• **Нейтральность:** медиатор (психолог или обученный старшеклассник) не судит, не ищет виноватых и не ставит клеймо.\n• **Добровольность:** на медиацию нельзя принудить, обе стороны должны согласиться сесть за стол переговоров.\n• **Конфиденциальность:** все, что сказано на встрече, остается строго между участниками и не выносится на педсовет.\n• **Восстановительный результат:** цель — не наказать виновного, а загладить причиненный вред и договориться о правилах совместной жизни в классе."
  }
];

function getOfflineReplyClient(userMessage) {
  const msg = userMessage.toLowerCase();
  if (['привет', 'здравствуй', 'ку', 'хай', 'добрый'].some(w => msg.includes(w))) {
    return {
      reply: "👋 Привет! Я цифровая служба школьной медиации. Помогаю мирно и конфиденциально разрешать любые ссоры, споры и недопонимания в классе или с учителями. Расскажи, что произошло?",
      suggestions: ["Конфликт с одноклассником", "Спор с учителем", "Сложности дома"]
    };
  } else if (['бьют', 'драка', 'ударил', 'угрож', 'вымогат', 'деньги'].some(w => msg.includes(w))) {
    return {
      reply: "⚠️ Это серьезная ситуация, касающаяся твоей безопасности! Не оставайся один на один с агрессором. Срочно обратись к дежурному учителю, социальному педагогу или позвони на Единый детский телефон доверия: **8-800-2000-122** (бесплатно, анонимно).",
      suggestions: ["Позвонить на горячую линию", "Как поговорить с родителями?", "Помощь медиатора"]
    };
  } else if (['дразн', 'обзыва', 'буллинг', 'травл', 'подкол', 'слухи', 'сплетн'].some(w => msg.includes(w))) {
    return {
      reply: "🛡️ Травля и обидные подколы — это попытка нарушить твои границы. Главное правило: не показывай бурных эмоций (обидчики ждут слез или крика). Отвечай твердо и спокойно: *«Мне это неинтересно»* или *«Зачем ты это говоришь?»*. Фиксируй скриншоты.",
      suggestions: ["Разобрать ситуацию в мастере", "Закон о буллинге", "Что написать в ответ?"]
    };
  } else if (['учител', 'оценк', 'пара', 'двойк', 'занижа', 'предметник'].some(w => msg.includes(w))) {
    return {
      reply: "📚 В спорах с учителями закон на твоей стороне при вежливом диалоге. Главное: обсуждай работу, а не личность учителя. Скажи: *«Подскажите, пожалуйста, в каких именно критериях я ошибся(лась)? Что нужно доработать, чтобы исправить оценку?»*. Учитель обязан разъяснить критерии согласно ФЗ «Об образовании в РФ».",
      suggestions: ["Как оспорить оценку?", "Поговорить с классным руководителем", "Права ученика"]
    };
  } else if (['родител', 'мама', 'папа', 'руга', 'дома', 'телефон отбира'].some(w => msg.includes(w))) {
    return {
      reply: "👨‍👩‍👧 Разногласия с родителями часто вызваны их тревогой за твоё будущее, хотя проявляться это может через давление или контроль. Попробуй метод «Я-сообщений»: *«Когда вы повышаете голос, мне трудно вас услышать. Я хочу спокойно обсудить учебу»*.",
      suggestions: ["Инструкция: разговор с родителями", "Как снизить контроль?", "Сделать паузу"]
    };
  } else if (['стресс', 'экзамен', 'огэ', 'егэ', 'устал', 'выгоран', 'тревог'].some(w => msg.includes(w))) {
    return {
      reply: "🧘 Тревога перед экзаменами и нагрузками — нормальная реакция организма. Помни: твоя ценность не измеряется баллами в дневнике. Раздели подготовку на короткие отрезки по 25 минут и обязательно давай себе отдых без гаджетов. Ты справишься!",
      suggestions: ["Дневник настроения", "Дыхательная техника", "Чек-лист перед уроком"]
    };
  } else {
    return {
      reply: "Я внимательно тебя слушаю. В восстановительной медиации мы всегда разбираем 3 главных вопроса:\n\n1. 📌 **Что конкретно произошло?** (факты без эмоций)\n2. 💭 **Что ты почувствовал(а) в этот момент?**\n3. 🤝 **Какое решение ситуации было бы справедливым для тебя?**\n\nНапиши подробности или воспользуйся вкладкой «Разбор ситуации» на главном экране!",
      suggestions: ["Разобрать ситуацию в Мастере", "Твои права в школе", "Кризисная помощь"]
    };
  }
}

function getOfflineAnalysisClient(opponent, category, description) {
  return (
    `### 🔍 1. Что происходит на самом деле\n` +
    `В ситуации конфликта по категории **«${category}»** с участием **«${opponent}»** за видимой агрессией или непониманием всегда стоят скрытые мотивы.\n` +
    `Вторая сторона чаще всего действует не из чистого зла, а из потребности в контроле, страха потерять авторитет в коллективе или собственной неуверенности. Нападая или провоцируя, оппонент проверяет твои личные границы и пытается самоутвердиться за чужой счет.\n\n` +
    `### 🛡️ 2. Твоя внутренняя опора\n` +
    `• **Ты не виноват(а) в чужой агрессии:** поведение оппонента — это отражение его внутренних проблем, а не твоих качеств.\n` +
    `• **Держи эмоциональную дистанцию:** цель провокатора — вывести тебя на крик, слезы или агрессию. Спокойствие лишает его главного оружия.\n` +
    `• **Пауза — твой союзник:** перед любым ответом сделай глубокий вдох и сосчитай до 5. Это вернет контроль над ситуацией.\n\n` +
    `### 💡 3. Дипломатические сценарии действий\n` +
    `**Вариант А (Мягкое прояснение / разговор один на один):**\n` +
    `*«Я вижу, что между нами возникло напряжение. Давай спокойно проясним, что именно не так, без взаимных претензий»*.\n\n` +
    `**Вариант Б (Твердые границы без эскалации):**\n` +
    `*«Мне неприятен такой тон и подобные слова. Я готов(а) общаться нормально, но переходить на личности не позволю»*.\n\n` +
    `**Вариант В (Привлечение нейтральной стороны):**\n` +
    `Если разговор не помогает или есть угроза безопасности, не оставайся один на один с проблемой. Обратись в Школьную службу примирения, к социальному педагогу или классному руководителю с просьбой провести медиативную встречу.\n\n` +
    `### 🚫 4. Главная ошибка прямо сейчас\n` +
    `Категорически **нельзя отвечать симметричной агрессией, оскорблениями в ответ или затевать драку**. Это переведет конфликт в плоскость обоюдного нарушения правил школы, где тебя могут выставить зачинщиком наравне с обидчиком.`
  );
}

function getOfflineScreenshotAdvice() {
  return (
    `### 📸 Экспертный разбор переписки (Служба медиации)\n\n` +
    `1. 🔒 **Факт зафиксирован:** скриншот обработан и сохранен в безопасном журнале обращения.\n` +
    `2. ⏸️ **Правило паузы:** если тебя провоцируют в чате — ни в коем случае не отвечай сразу на эмоциях. Главная цель обидчика — заставить тебя оправдываться или сорваться на оскорбления на глазах у других.\n` +
    `3. 💬 **Рекомендуемый ответ в чат:**\n` +
    `*«Обсуждать личные вопросы в общем чате я не планирую. Если хочешь конструктивного диалога — пиши лично или обсудим ситуацию со школьным медиатором»*.\n` +
    `4. ⚖️ **Правовая защита:** публичные оскорбления и травля в сетевых беседах подпадают под ст. 5.61 КоАП РФ. Сохраняй скриншоты — они являются доказательством при необходимости привлечения классного руководителя или администрации.`
  );
}

// =====================================================================
// ИНИЦИАЛИЗАЦИЯ VK MINI APP И TELEGRAM WEBAPP
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Инициализация VK Mini App
  if (typeof vkBridge !== 'undefined') {
    try {
      await vkBridge.send('VKWebAppInit');
      console.log('✅ VK Bridge успешно инициализирован');

      // Подписка на события VK темы
      vkBridge.subscribe((e) => {
        if (e.detail.type === 'VKWebAppUpdateConfig') {
          const scheme = e.detail.data.scheme;
          if (scheme && scheme.includes('light')) {
            document.body.classList.add('light-theme');
          } else {
            document.body.classList.remove('light-theme');
          }
        }
      });

      // Получаем информацию о пользователе VK
      const user = await vkBridge.send('VKWebAppGetUserInfo');
      if (user && user.id) {
        state.userId = user.id;
        state.userName = user.first_name || 'Друг';
        const greetingEl = document.getElementById('userGreeting');
        if (greetingEl) {
          greetingEl.textContent = `Привет, ${state.userName}!`;
        }
      }
    } catch (e) {
      console.log('VK Bridge init notice:', e);
    }
  }

  // Извлечение user_id из VK URL параметров (?vk_user_id=...)
  const urlParams = new URLSearchParams(window.location.search);
  const vkUserId = urlParams.get('vk_user_id');
  if (vkUserId && !state.userId) {
    state.userId = parseInt(vkUserId, 10);
  }

  // 2. Инициализация Telegram WebApp
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.colorScheme === 'light') {
        document.body.classList.add('light-theme');
      }
      const user = tg.initDataUnsafe?.user;
      if (user) {
        state.userId = user.id;
        state.userName = user.first_name || 'Друг';
        const greetingEl = document.getElementById('userGreeting');
        if (greetingEl) {
          greetingEl.textContent = `Привет, ${state.userName}!`;
        }
      }
    } catch (e) {}
  }

  // Загружаем статьи базы знаний
  loadKnowledgeBase();
});

function triggerHaptic(type = 'light') {
  try {
    if (typeof vkBridge !== 'undefined') {
      vkBridge.send('VKWebAppTapticImpactOccurred', { style: type });
    } else if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {}
}

// =====================================================================
// НАВИГАЦИЯ ПО ВКЛАДКАМ
// =====================================================================
function navigateTo(tabName) {
  triggerHaptic('light');
  state.currentTab = tabName;

  // Скрываем все экраны
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));

  // Активируем нужный экран
  const targetScreen = document.getElementById(`screen-${tabName}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  // Обновляем состояние таббара
  document.querySelectorAll('.tab-item').forEach(el => {
    if (el.dataset.target === tabName) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Прокручиваем наверх
  const mainContent = document.getElementById('mainContent');
  if (mainContent) mainContent.scrollTop = 0;
}

// =====================================================================
// 1. ДНЕВНИК НАСТРОЕНИЯ (MOOD CHECK-IN)
// =====================================================================
async function submitMood(score, label) {
  triggerHaptic('medium');

  document.querySelectorAll('.mood-btn').forEach((btn, idx) => {
    if (idx + 1 === score) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  const feedbackEl = document.getElementById('moodFeedback');
  if (feedbackEl) {
    feedbackEl.textContent = 'Сохраняем...';
    feedbackEl.classList.remove('hidden');
  }

  try {
    const res = await fetch('/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        score: score,
        label: label
      })
    });
    const data = await res.json();
    if (data.ok && feedbackEl) {
      feedbackEl.textContent = `✨ ${data.affirmation}`;
    }
  } catch (err) {
    const quotes = {
      1: "Понимаю, день непростой. Главное — помнить, что любые сложные эмоции проходят. Сделай паузу и вдох-выдох.",
      2: "Тревога и грусть забирают силы. Давай разберем, что именно тебя тревожит, и наметим простой план.",
      3: "Хорошее нейтральное состояние — отличная база, чтобы спокойно и рассудительно решать любые задачи.",
      4: "Отличный эмоциональный заряд! Используй эту уверенность для добрых дел и продуктивного общения.",
      5: "Супер! Твоя уверенность и энергия помогут легко найти общий язык с кем угодно."
    };
    if (feedbackEl) feedbackEl.textContent = `✨ ${quotes[score] || quotes[3]}`;
  }
}


// Быстрый запуск разбора скриншота
function openScreenshotAnalyzer() {
  navigateTo('wizard');
  goToWizardStep(3);
  setTimeout(() => {
    const fileInput = document.getElementById('wizardFileInput');
    if (fileInput) fileInput.click();
  }, 200);
}

// =====================================================================
// 2. МАСТЕР РАЗРЕШЕНИЯ КОНФЛИКТА (WIZARD)
// =====================================================================
function selectWizardOption(field, value, btnEl) {
  triggerHaptic('light');
  state.wizard[field] = value;

  const parent = btnEl.parentElement;
  parent.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
  btnEl.classList.add('active');
}

function goToWizardStep(stepNum) {
  triggerHaptic('light');
  state.wizard.step = stepNum;

  // Обновляем индикаторы шагов
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`stepDot${i}`);
    const line = document.getElementById(`stepLine${i}`);
    if (dot) {
      if (i <= stepNum) dot.classList.add('active');
      else dot.classList.remove('active');
    }
    if (line) {
      if (i < stepNum) line.classList.add('active');
      else line.classList.remove('active');
    }
  }

  // Показываем содержимое шага
  for (let i = 1; i <= 4; i++) {
    const content = document.getElementById(`wizardStep${i}`);
    if (content) {
      if (i === stepNum) content.classList.add('active');
      else content.classList.remove('active');
    }
  }

  const mainContent = document.getElementById('mainContent');
  if (mainContent) mainContent.scrollTop = 0;
}

function handleWizardFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  state.wizard.imageMime = file.type || 'image/jpeg';

  const reader = new FileReader();
  reader.onload = (e) => {
    state.wizard.imageBase64 = e.target.result;
    const previewWrap = document.getElementById('wizardImgPreviewWrap');
    const previewImg = document.getElementById('wizardImgPreview');
    const uploadText = document.getElementById('wizardUploadText');

    if (previewImg && previewWrap) {
      previewImg.src = e.target.result;
      previewWrap.classList.remove('hidden');
    }
    if (uploadText) {
      uploadText.textContent = `Выбран файл: ${file.name}`;
    }
    triggerHaptic('medium');
  };
  reader.readAsDataURL(file);
}

function removeWizardImg(event) {
  event.stopPropagation();
  state.wizard.imageBase64 = null;
  const previewWrap = document.getElementById('wizardImgPreviewWrap');
  const uploadText = document.getElementById('wizardUploadText');
  const fileInput = document.getElementById('wizardFileInput');

  if (previewWrap) previewWrap.classList.add('hidden');
  if (uploadText) uploadText.textContent = 'Прикрепить скриншот переписки (по желанию)';
  if (fileInput) fileInput.value = '';
  triggerHaptic('light');
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h4 style="margin: 12px 0 6px; color: var(--text-primary); font-size: 15px; font-weight: 700;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="margin: 14px 0 8px; color: var(--text-primary); font-size: 16px; font-weight: 700;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• (.*$)/gim, '<div style="margin: 3px 0; padding-left: 10px;">• $1</div>')
    .replace(/\n\n/g, '<div style="height: 8px;"></div>')
    .replace(/\n/g, '<br>');
}

async function startConflictAnalysis() {
  const descEl = document.getElementById('wizardDesc');
  const desc = descEl ? descEl.value.trim() : '';

  if (!desc && !state.wizard.imageBase64) {
    alert('Пожалуйста, напиши пару слов о том, что произошло, или прикрепи скриншот.');
    return;
  }

  state.wizard.description = desc;
  goToWizardStep(4);

  const loadingEl = document.getElementById('wizardLoading');
  const resultEl = document.getElementById('wizardResult');
  const resultTextEl = document.getElementById('wizardResultText');

  if (loadingEl) loadingEl.classList.remove('hidden');
  if (resultEl) resultEl.classList.add('hidden');

  try {
    let response;
    // Если прикреплен скриншот, вызываем мультимодальный анализ
    if (state.wizard.imageBase64) {
      response = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          image_base64: state.wizard.imageBase64,
          mime_type: state.wizard.imageMime,
          caption: `Спор с [${state.wizard.opponent}], категория: [${state.wizard.category}]. ${desc}`
        })
      });
    } else {
      // Иначе структурированный текстовый разбор
      response = await fetch('/api/analyze-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          opponent: state.wizard.opponent,
          category: state.wizard.category,
          description: desc
        })
      });
    }

    const data = await response.json();
    if (loadingEl) loadingEl.classList.add('hidden');
    if (resultEl) resultEl.classList.remove('hidden');

    if (data.ok) {
      triggerHaptic('heavy');
      const formatted = formatMarkdown(data.analysis || data.reply || '');
      if (resultTextEl) resultTextEl.innerHTML = formatted;
    } else {
      if (resultTextEl) resultTextEl.textContent = '❌ Не удалось разобрать ситуацию: ' + (data.error || 'ошибка сервера');
    }
  } catch (err) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (resultEl) resultEl.classList.remove('hidden');
    triggerHaptic('heavy');
    const fallbackText = state.wizard.imageBase64
      ? getOfflineScreenshotAdvice()
      : getOfflineAnalysisClient(state.wizard.opponent, state.wizard.category, desc);
    if (resultTextEl) resultTextEl.innerHTML = formatMarkdown(fallbackText);
  }
}



function resetWizard() {
  triggerHaptic('light');
  state.wizard.description = '';
  state.wizard.imageBase64 = null;
  const descEl = document.getElementById('wizardDesc');
  if (descEl) descEl.value = '';
  removeWizardImg({ stopPropagation: () => {} });
  goToWizardStep(1);
}

function transferWizardToChat() {
  navigateTo('chat');
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = 'Подскажи, что сказать в первую очередь?';
    chatInput.focus();
  }
}

// =====================================================================
// 3. ИИ-МЕДИАТОР ОНЛАЙН (CHAT)
// =====================================================================
function handleChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

async function sendChatMessage(customText = null) {
  const inputEl = document.getElementById('chatInput');
  const text = customText || (inputEl ? inputEl.value.trim() : '');

  if (!text) return;
  if (!customText && inputEl) inputEl.value = '';

  triggerHaptic('light');
  appendChatMessage(text, 'user');

  // Показываем индикатор печати
  const typingBubble = appendTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.userId,
        message: text
      })
    });

    const data = await res.json();
    if (typingBubble) typingBubble.remove();

    if (data.ok) {
      triggerHaptic('medium');
      appendChatMessage(data.reply, 'bot');
      renderSuggestions(data.suggestions || []);
    } else {
      appendChatMessage('❌ Ошибка: ' + (data.error || 'не удалось получить ответ'), 'bot');
    }
  } catch (err) {
    if (typingBubble) typingBubble.remove();
    triggerHaptic('medium');
    const fallback = getOfflineReplyClient(text);
    appendChatMessage(fallback.reply, 'bot');
    renderSuggestions(fallback.suggestions);
  }
}


function appendChatMessage(text, sender) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${sender}-msg`;

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';

  bubbleDiv.innerHTML = formatMarkdown(text);
  msgDiv.appendChild(bubbleDiv);
  container.appendChild(msgDiv);

  // Автоскролл
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
  const container = document.getElementById('chatMessages');
  if (!container) return null;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg bot-msg';
  msgDiv.innerHTML = '<div class="bubble" style="color:var(--text-muted);font-style:italic">Медиатор думает...</div>';
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
  return msgDiv;
}

function renderSuggestions(suggestions) {
  const container = document.getElementById('chatSuggestions');
  if (!container) return;

  container.innerHTML = '';
  if (!suggestions || suggestions.length === 0) return;

  suggestions.forEach(sug => {
    const pill = document.createElement('button');
    pill.className = 'sug-pill';
    pill.textContent = `💡 ${sug}`;
    pill.onclick = () => {
      container.innerHTML = '';
      sendChatMessage(sug);
    };
    container.appendChild(pill);
  });
}

function clearWebChat() {
  triggerHaptic('medium');
  const container = document.getElementById('chatMessages');
  const sugContainer = document.getElementById('chatSuggestions');
  if (container) {
    container.innerHTML = `
      <div class="msg bot-msg">
        <div class="bubble">
          История очищена. Я готов выслушать новую ситуацию и помочь найти мирный выход!
        </div>
      </div>
    `;
  }
  if (sugContainer) sugContainer.innerHTML = '';
}

// =====================================================================
// 4. БАЗА ЗНАНИЙ (KNOWLEDGE BASE)
// =====================================================================
async function loadKnowledgeBase() {
  try {
    const res = await fetch('/api/kb');
    const data = await res.json();
    if (data.ok && data.articles) {
      state.kbArticles = data.articles;
      renderKnowledgeBase(data.articles);
    }
  } catch (err) {
    state.kbArticles = FALLBACK_ARTICLES;
    renderKnowledgeBase(FALLBACK_ARTICLES);
  }
}


function renderKnowledgeBase(articles) {
  const container = document.getElementById('kbList');
  if (!container) return;

  container.innerHTML = '';
  articles.forEach(art => {
    const card = document.createElement('div');
    card.className = 'kb-card';
    card.onclick = () => openArticleModal(art);

    card.innerHTML = `
      <div class="kb-card-header">
        <span style="font-size:18px">${art.icon}</span>
        <span class="kb-card-tag">${art.tag}</span>
      </div>
      <h3 class="kb-card-title">${art.title}</h3>
      <p class="kb-card-summary">${art.summary}</p>
    `;
    container.appendChild(card);
  });
}

function openArticleModal(article) {
  triggerHaptic('medium');
  const modal = document.getElementById('articleModal');
  const iconEl = document.getElementById('modalArticleIcon');
  const tagEl = document.getElementById('modalArticleTag');
  const titleEl = document.getElementById('modalArticleTitle');
  const contentEl = document.getElementById('modalArticleContent');

  if (iconEl) iconEl.textContent = article.icon;
  if (tagEl) tagEl.textContent = article.tag;
  if (titleEl) titleEl.textContent = article.title;
  if (contentEl) {
    contentEl.innerHTML = article.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  if (modal) modal.classList.remove('hidden');
}

function closeArticleModal() {
  triggerHaptic('light');
  const modal = document.getElementById('articleModal');
  if (modal) modal.classList.add('hidden');
}
