/**
 * Mini App: «Цифровая служба школьной медиации» (VK Mini App & Telegram WebApp)
 * Единая главная страница: Чат + Мастер конфликтов + Психологические тесты + SOS
 */

const tg = window.Telegram?.WebApp;
const isVK = typeof vkBridge !== 'undefined' || window.location.search.includes('vk_');

// Состояние приложения
const state = {
  userId: 0,
  userName: 'Ученик',
  assistantMode: 'chat', // 'chat' | 'wizard' | 'test'
  wizard: {
    step: 1,
    opponent: 'Одноклассник / сверстник',
    category: 'Травля / подколы в классе или чате',
    description: '',
    imageBase64: null,
    imageMime: 'image/jpeg'
  },
  psychTest: {
    currentQ: 0,
    answers: [],
    completed: false
  },
  chatHistory: []
};

// =====================================================================
// ДАННЫЕ ПСИХОЛОГИЧЕСКОГО ТЕСТА (Адаптация метода К. Томаса)
// =====================================================================
const PSYCH_TEST = {
  title: "ТЕСТ: ТВОЙ СТИЛЬ В КОНФЛИКТАХ",
  subtitle: "Методика К. Томаса в школьной адаптации",
  questions: [
    {
      q: "1. Одноклассник публично отпустил обидную шутку в твой адрес. Твоя первая реакция?",
      options: [
        { text: "Осажу его еще жестче при всех, чтобы больше не лез и знал свое место", style: "compete", letter: "A" },
        { text: "Спокойно предложу после урока поговорить наедине и прояснить шутку", style: "collab", letter: "B" },
        { text: "Отшучусь в ответ или переведу в компромиссную тему без открытой ссоры", style: "compromise", letter: "C" },
        { text: "Проигнорирую и отойду в сторону, сделав вид, что не заметил", style: "avoid", letter: "D" },
        { text: "Промолчу и стерплю, лишь бы не портить отношения и не устраивать скандал", style: "accommodate", letter: "E" }
      ]
    },
    {
      q: "2. При подготовке командного проекта возник спор о том, кто какую часть делает:",
      options: [
        { text: "Настаиваю только на своем плане: я лучше знаю, как победить", style: "compete", letter: "A" },
        { text: "Сядем и вместе распределим задачи с учетом сильных сторон каждого", style: "collab", letter: "B" },
        { text: "Предложу разделить спорные обязанности поровну или по жребию", style: "compromise", letter: "C" },
        { text: "Пусть делают как хотят, я выполню только свой минимум", style: "avoid", letter: "D" },
        { text: "Соглашусь на любые чужие условия, чтобы не спорить в команде", style: "accommodate", letter: "E" }
      ]
    },
    {
      q: "3. Учитель поставил спорную оценку, с которой ты не согласен:",
      options: [
        { text: "Буду настойчиво спорить на уроке или сразу пойду жаловаться к руководству", style: "compete", letter: "A" },
        { text: "После урока вежливо спрошу критерии и как доработать работу", style: "collab", letter: "B" },
        { text: "Договорюсь о пересдаче или подготовке дополнительного доклада", style: "compromise", letter: "C" },
        { text: "Махну рукой: спорить с учителем бесполезно и себе дороже", style: "avoid", letter: "D" },
        { text: "Смирюсь молча, решив, что учитель всегда прав", style: "accommodate", letter: "E" }
      ]
    },
    {
      q: "4. Близкий друг случайно выдал твой секрет другим ребятам:",
      options: [
        { text: "Сразу прекращу общение и выскажу всё самое резкое прямо в лицо", style: "compete", letter: "A" },
        { text: "Поговорю начистоту: объясню свои чувства и спрошу, почему он так поступил", style: "collab", letter: "B" },
        { text: "Попрошу его публично опровергнуть слух, и тогда забудем инцидент", style: "compromise", letter: "C" },
        { text: "Сделаю вид, что всё нормально, но перестану доверять и отдалюсь", style: "avoid", letter: "D" },
        { text: "Прощу сразу, сделав вид, что мне совсем не обидно", style: "accommodate", letter: "E" }
      ]
    },
    {
      q: "5. В классном чате разгорается конфликт между одноклассниками:",
      options: [
        { text: "Вмешаюсь и жестко докажу правоту своей стороны", style: "compete", letter: "A" },
        { text: "Предложу всем снизить градус и найти мирное решение спора", style: "collab", letter: "B" },
        { text: "Предложу сойтись на нейтральном варианте, устраивающем большинство", style: "compromise", letter: "C" },
        { text: "Выключу уведомления в чате или сразу выйду из него", style: "avoid", letter: "D" },
        { text: "Поддержу большинство, даже если в душе не совсем согласен", style: "accommodate", letter: "E" }
      ]
    }
  ],
  results: {
    collab: {
      title: "СОТРУДНИЧЕСТВО (ПАРТНЕРСТВО)",
      badge: "🤝 СТРАТЕГИЯ ЛИДЕРА И МЕДИАТОРА",
      icon: "./images/icons/handshake.png",
      desc: "Ты стремишься не просто «замять» ссору, а понять истинные мотивы второй стороны и найти решение, где выигрывают оба (Win-Win). Это самый зрелый и уважительный стиль общения в школе.",
      strengths: "Высокий авторитет, умение слушать без обиды, способность сохранять дружбу при разногласиях.",
      tips: "Помни, что сотрудничество требует времени. Если оппонент агрессивен и пока не готов к диалогу, сначала четко обозначь свои личные границы."
    },
    compromise: {
      title: "КОМПРОМИСС (ЗОЛОТАЯ СЕРЕДИНА)",
      badge: "⚖️ ДИПЛОМАТИЧЕСКИЙ БАЛАНС",
      icon: "./images/icons/scales.png",
      desc: "Ты мастер взаимных уступок. Ты быстро гасишь пламя конфликта, предлагая вариант «ни тебе, ни мне» или «пополам». С тобой легко договариваться.",
      strengths: "Быстрое снятие напряжения, сохранение мира в классе, практичность.",
      tips: "Следи, чтобы постоянные уступки не ущемляли твои базовые интересы. Иногда полезно глубже прояснить потребности сторон, переходя к сотрудничеству."
    },
    compete: {
      title: "СОПЕРНИЧЕСТВО (НАСТОЙЧИВОСТЬ)",
      badge: "🔥 СИЛЬНАЯ ВОЛЯ И ГРАНИЦЫ",
      icon: "./images/icons/conflict_angry.png",
      desc: "Ты уверенно защищаешь свои интересы и не даешь себя в обиду. У тебя есть внутренний стержень, смелость и лидерская решительность.",
      strengths: "Умение постоять за себя, защита личных границ, решительность в стрессе.",
      tips: "Постоянная борьба утомляет и может создавать лишних недоброжелателей. Попробуй проявлять эмпатию и слышать мотивы других ребят — это сделает тебя еще сильнее."
    },
    avoid: {
      title: "ИЗБЕГАНИЕ (ДИСТАНЦИРОВАНИЕ)",
      badge: "🛡️ СБЕРЕЖЕНИЕ СИЛ И ПАУЗА",
      icon: "./images/icons/padlock.png",
      desc: "Ты предпочитаешь не вступать в пустые перепалки и сохранять душевное спокойствие, держась в стороне от школьных интриг и сплетен.",
      strengths: "Эмоциональная устойчивость, отсутствие бессмысленных драк и конфликтов на пустом месте.",
      tips: "Избегание идеально при пустых провокациях. Но если нарушают твои права или есть угроза буллинга — не молчи, привлекай службу медиации или взрослых."
    },
    accommodate: {
      title: "ПРИСПОСОБЛЕНИЕ (МИРОТВОРЕЦ)",
      badge: "🕊️ ЗАБОТА ОБ ОТНОШЕНИЯХ",
      icon: "./images/icons/two_people.png",
      desc: "Для тебя важнее всего мир и добрые отношения с окружающими. Ты умеешь сопереживать, прощать и сглаживать любые острые углы.",
      strengths: "Доброта, глубокая эмпатия, способность объединять людей.",
      tips: "Твои чувства, желания и комфорт не менее важны, чем чужие! Учись говорить твердое спокойное «нет», когда нарушают твои личные границы."
    }
  }
};

// =====================================================================
// КЛИЕНТСКИЙ ГЕНЕРАТОР ОТВЕТОВ МЕДИАТОРА (24/7 OFFLINE & ONLINE)
// =====================================================================
function getOfflineReplyClient(userMessage) {
  const msg = userMessage.toLowerCase().trim();

  // Триггер на слово ТЕСТ
  if (['тест', 'тесты', 'псих', 'пройти тест', 'психолог'].some(w => msg.includes(w))) {
    return {
      reply: "🎯 **Я могу предложить тебе 3 эффективных решения:**\n\n" +
        "1. 🧠 **Психологический тест** — определи свой ведущий стиль поведения в школьных спорах по методу К. Томаса и узнай свои сильные стороны.\n" +
        "2. 💬 **Разобрать ситуацию как медиатор** — разберем конкретный конфликт один на один, снимем эмоциональное напряжение и найдем нужные слова.\n" +
        "3. ⚖️ **Мастер разрешения конфликтов** — пошаговый конструктор с получением готового дипломатического плана мирного выхода.\n\n" +
        "Выбери, с чего начнем:",
      isThreeSolutions: true,
      suggestions: ["Психологический тест", "Разобрать как медиатор", "Мастер конфликтов"]
    };
  }

  if (['привет', 'здравствуй', 'ку', 'хай', 'добрый'].some(w => msg.includes(w))) {
    return {
      reply: "👋 Привет! Я цифровая служба школьной медиации. Помогаю мирно и конфиденциально разрешать любые ссоры, споры и недопонимания в классе или с учителями. Расскажи, что произошло? Или напиши **«тест»**, чтобы узнать свой стиль поведения в конфликтах!",
      suggestions: ["Начать тест", "Конфликт с одноклассником", "Спор с учителем"]
    };
  } else if (['бьют', 'драка', 'ударил', 'угрож', 'вымогат', 'деньги'].some(w => msg.includes(w))) {
    return {
      reply: "⚠️ Это серьезная ситуация, касающаяся твоей безопасности! Не оставайся один на один с агрессором. Срочно обратись к дежурному учителю, социальному педагогу или позвони на Единый детский телефон доверия: **8 (800) 200-01-22** (бесплатно, анонимно).",
      suggestions: ["Позвонить на горячую линию", "Как поговорить с родителями?", "План мастера"]
    };
  } else if (['дразн', 'обзыва', 'буллинг', 'травл', 'подкол', 'слухи', 'сплетн'].some(w => msg.includes(w))) {
    return {
      reply: "🛡️ Травля и обидные подколы — это попытка нарушить твои границы. Главное правило: не показывай бурных эмоций (обидчики ждут слез или крика). Отвечай твердо и спокойно: *«Мне это неинтересно»* или *«Зачем ты это говоришь?»*. Фиксируй скриншоты переписки.",
      suggestions: ["Мастер конфликтов", "Что написать в ответ?", "Пройти тест"]
    };
  } else if (['учител', 'оценк', 'пара', 'двойк', 'занижа', 'предметник'].some(w => msg.includes(w))) {
    return {
      reply: "📚 В спорах с учителями закон на твоей стороне при вежливом диалоге. Главное: обсуждай работу, а не личность учителя. Скажи: *«Подскажите, пожалуйста, в каких именно критериях я ошибся(лась)? Что нужно доработать, чтобы исправить оценку?»*. Учитель обязан разъяснить критерии.",
      suggestions: ["Как оспорить оценку?", "Поговорить с классным руководителем", "Мастер конфликтов"]
    };
  } else if (['родител', 'мама', 'папа', 'руга', 'дома', 'телефон отбира'].some(w => msg.includes(w))) {
    return {
      reply: "👨‍👩‍👧 Разногласия с родителями часто вызваны их тревогой за твоё будущее, хотя проявляться это может через давление или контроль. Попробуй метод «Я-сообщений»: *«Когда вы повышаете голос, мне трудно вас услышать. Я хочу спокойно обсудить учебу»*.",
      suggestions: ["Разговор с родителями", "Сделать паузу", "Пройти тест"]
    };
  } else if (['стресс', 'экзамен', 'огэ', 'егэ', 'устал', 'выгоран', 'тревог'].some(w => msg.includes(w))) {
    return {
      reply: "🧘 Тревога перед экзаменами и нагрузками — нормальная реакция организма. Помни: твоя ценность не измеряется баллами в дневнике. Раздели подготовку на короткие отрезки по 25 минут и обязательно давай себе отдых без гаджетов. Ты справишься!",
      suggestions: ["Психологический тест", "Дыхательная техника", "Разобрать как медиатор"]
    };
  } else {
    return {
      reply: "Я внимательно тебя слушаю. В восстановительной медиации мы всегда разбираем 3 главных вопроса:\n\n1. 📌 **Что конкретно произошло?** (факты без эмоций)\n2. 💭 **Что ты почувствовал(а) в этот момент?**\n3. 🤝 **Какое решение ситуации было бы справедливым для тебя?**\n\nНапиши подробности или выбери **«Мастер конфликтов»** в переключателе выше для пошагового разбора!",
      suggestions: ["Мастер конфликтов", "Психологический тест", "Как справиться со стрессом?"]
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
    `4. ⚖️ **Защита границ:** публичные оскорбления и травля в сетевых беседах подпадают под ст. 5.61 КоАП РФ. Сохраняй скриншоты — они являются доказательством при необходимости привлечения классного руководителя или администрации.`
  );
}

// =====================================================================
// ИНИЦИАЛИЗАЦИЯ
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. VK Bridge init
  if (typeof vkBridge !== 'undefined') {
    try {
      await vkBridge.send('VKWebAppInit');
      console.log('✅ VK Bridge успешно инициализирован');

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

  const urlParams = new URLSearchParams(window.location.search);
  const vkUserId = urlParams.get('vk_user_id');
  if (vkUserId && !state.userId) {
    state.userId = parseInt(vkUserId, 10);
  }

  // 2. Telegram WebApp init
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

  // Инициализируем тест
  renderPsychTest();
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

function scrollToAssistant() {
  triggerHaptic('light');
  const el = document.getElementById('assistantSection');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

// =====================================================================
// ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ В ОБЪЕДИНЕННОМ ЦЕНТРЕ МЕДИАЦИИ
// =====================================================================
function setAssistantMode(mode) {
  triggerHaptic('medium');
  state.assistantMode = mode;

  // Кнопки табов
  const btnChat = document.getElementById('tabBtnChat');
  const btnWizard = document.getElementById('tabBtnWizard');
  const btnTest = document.getElementById('tabBtnTest');

  if (btnChat) btnChat.classList.toggle('active', mode === 'chat');
  if (btnWizard) btnWizard.classList.toggle('active', mode === 'wizard');
  if (btnTest) btnTest.classList.toggle('active', mode === 'test');

  // Панели
  const panelChat = document.getElementById('assistantModeChat');
  const panelWizard = document.getElementById('assistantModeWizard');
  const panelTest = document.getElementById('assistantModeTest');

  if (panelChat) panelChat.classList.toggle('hidden', mode !== 'chat');
  if (panelWizard) panelWizard.classList.toggle('hidden', mode !== 'wizard');
  if (panelTest) panelTest.classList.toggle('hidden', mode !== 'test');

  if (mode === 'test' && !state.psychTest.completed) {
    renderPsychTest();
  }

  // Скроллим к ассистенту
  scrollToAssistant();
}

// Запуск разбора по теме из капсул «КОГДА ОБРАЩАТЬСЯ?»
function startTopicResolution(topic) {
  triggerHaptic('medium');
  setAssistantMode('wizard');
  resetWizard();

  setTimeout(() => {
    if (topic === 'friend') {
      const optCards = document.querySelectorAll('#wizardStep1 .option-card');
      if (optCards[3]) selectWizardOption('opponent', 'Близкий друг / подруга', optCards[3]);
      goToWizardStep(2);
    } else if (topic === 'class') {
      const optCards = document.querySelectorAll('#wizardStep1 .option-card');
      if (optCards[0]) selectWizardOption('opponent', 'Одноклассник / сверстник', optCards[0]);
      goToWizardStep(2);
      const catPills = document.querySelectorAll('#wizardStep2 .cat-pill');
      if (catPills[3]) selectWizardOption('category', 'Угрозы, бойкот или давление толпы', catPills[3]);
    } else if (topic === 'rumors') {
      const optCards = document.querySelectorAll('#wizardStep1 .option-card');
      if (optCards[0]) selectWizardOption('opponent', 'Одноклассник / сверстник', optCards[0]);
      goToWizardStep(2);
      const catPills = document.querySelectorAll('#wizardStep2 .cat-pill');
      if (catPills[2]) selectWizardOption('category', 'Нарушение личных границ и слухи', catPills[2]);
      goToWizardStep(3);
    } else if (topic === 'teachers') {
      const optCards = document.querySelectorAll('#wizardStep1 .option-card');
      if (optCards[1]) selectWizardOption('opponent', 'Учитель / преподаватель', optCards[1]);
      goToWizardStep(2);
    } else if (topic === 'bullying') {
      const optCards = document.querySelectorAll('#wizardStep1 .option-card');
      if (optCards[0]) selectWizardOption('opponent', 'Одноклассник / сверстник', optCards[0]);
      goToWizardStep(2);
      const catPills = document.querySelectorAll('#wizardStep2 .cat-pill');
      if (catPills[0]) selectWizardOption('category', 'Травля / подколы в классе или чате', catPills[0]);
      goToWizardStep(3);
    }
  }, 100);
}

// Запуск экспресс-разбора по скриншоту
function openScreenshotAnalyzer() {
  triggerHaptic('light');
  const fileInput = document.getElementById('globalScreenshotInput');
  if (fileInput) fileInput.click();
}

function handleScreenshotUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  state.wizard.imageMime = file.type || 'image/jpeg';

  const reader = new FileReader();
  reader.onload = (e) => {
    state.wizard.imageBase64 = e.target.result;
    setAssistantMode('wizard');
    goToWizardStep(3);

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
    scrollToAssistant();
  };
  reader.readAsDataURL(file);
}

// =====================================================================
// МОДУЛЬ ПСИХОЛОГИЧЕСКОГО ТЕСТА
// =====================================================================
function renderPsychTest() {
  const container = document.getElementById('psychTestContainer');
  if (!container) return;

  if (state.psychTest.completed) {
    renderPsychResult();
    return;
  }

  const qIndex = state.psychTest.currentQ;
  const question = PSYCH_TEST.questions[qIndex];
  const total = PSYCH_TEST.questions.length;
  const progressPercent = Math.round(((qIndex) / total) * 100);

  let optionsHtml = '';
  question.options.forEach((opt) => {
    optionsHtml += `
      <button class="test-opt-btn" onclick="answerPsychQuestion('${opt.style}')">
        <span class="test-opt-letter">${opt.letter}</span>
        <span class="test-opt-text">${opt.text}</span>
      </button>
    `;
  });

  container.innerHTML = `
    <div class="test-header-wrap">
      <div class="test-badge-row">
        <span class="test-main-badge">${PSYCH_TEST.title}</span>
        <span class="test-q-counter">Вопрос ${qIndex + 1} из ${total}</span>
      </div>
      <div class="test-progress-bar-bg">
        <div class="test-progress-bar-fill" style="width: ${progressPercent}%"></div>
      </div>
    </div>

    <div class="test-question-box">
      <div class="test-question-title">${question.q}</div>
    </div>

    <div class="test-options-list">
      ${optionsHtml}
    </div>
  `;
}

function answerPsychQuestion(style) {
  triggerHaptic('medium');
  state.psychTest.answers.push(style);

  if (state.psychTest.currentQ + 1 < PSYCH_TEST.questions.length) {
    state.psychTest.currentQ += 1;
    renderPsychTest();
  } else {
    state.psychTest.completed = true;
    renderPsychResult();
  }
}

function renderPsychResult() {
  const container = document.getElementById('psychTestContainer');
  if (!container) return;

  // Считаем стиль большинства
  const counts = { compete: 0, collab: 0, compromise: 0, avoid: 0, accommodate: 0 };
  state.psychTest.answers.forEach(st => {
    if (counts[st] !== undefined) counts[st]++;
  });

  let maxStyle = 'collab';
  let maxCount = -1;
  for (const [st, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxStyle = st;
    }
  }

  const resultData = PSYCH_TEST.results[maxStyle] || PSYCH_TEST.results.collab;

  container.innerHTML = `
    <div class="test-result-card">
      <div class="test-result-icon-wrap">
        <img src="${resultData.icon}" class="test-result-icon" alt="">
      </div>
      <span class="test-result-badge">${resultData.badge}</span>
      <h3 class="test-result-title">${resultData.title}</h3>

      <div class="test-result-desc">
        ${resultData.desc}
      </div>

      <div class="test-result-extra">
        <div class="test-extra-item">
          <strong>💪 Твоя сильная сторона:</strong> ${resultData.strengths}
        </div>
        <div class="test-extra-item">
          <strong>💡 Совет школьного медиатора:</strong> ${resultData.tips}
        </div>
      </div>

      <div class="test-result-actions">
        <button class="btn-primary" onclick="startMediatorChatPrompt('У меня по тесту стиль «${resultData.title}». Как мне разрешить ситуацию?')">
          РАЗОБРАТЬ СИТУАЦИЮ С МЕДИАТОРОМ
        </button>
        <button class="btn-secondary" onclick="resetPsychTest()">
          🔄 ПРОЙТИ ТЕСТ ЗАНОВО
        </button>
      </div>
    </div>
  `;
}

function resetPsychTest() {
  triggerHaptic('light');
  state.psychTest.currentQ = 0;
  state.psychTest.answers = [];
  state.psychTest.completed = false;
  renderPsychTest();
}

// =====================================================================
// ИИ-МЕДИАТОР ОНЛАЙН (CHAT)
// =====================================================================
function handleChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

function triggerChatPhotoUpload() {
  triggerHaptic('light');
  const input = document.getElementById('chatFileInput');
  if (input) input.click();
}

function handleChatFileUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const mimeType = file.type || 'image/jpeg';

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    appendChatMessage(`📸 *[Прикреплен скриншот: ${file.name}]*`, 'user');
    const typingBubble = appendTypingIndicator();

    try {
      const res = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.userId,
          image_base64: base64Data,
          mime_type: mimeType,
          caption: 'Разбери этот скриншот переписки как медиатор'
        })
      });
      const data = await res.json();
      if (typingBubble) typingBubble.remove();
      if (data.ok) {
        appendChatMessage(data.reply, 'bot');
      } else {
        appendChatMessage(getOfflineScreenshotAdvice(), 'bot');
      }
    } catch (err) {
      if (typingBubble) typingBubble.remove();
      appendChatMessage(getOfflineScreenshotAdvice(), 'bot');
    }
  };
  reader.readAsDataURL(file);
}

function startMediatorChatPrompt(customText = null) {
  setAssistantMode('chat');
  const input = document.getElementById('chatInput');
  if (customText) {
    sendChatMessage(customText);
  } else {
    if (input) {
      input.value = 'Помоги мне мирно разобрать спор: ';
      input.focus();
    }
  }
}

async function sendChatMessage(customText = null) {
  const inputEl = document.getElementById('chatInput');
  const text = customText || (inputEl ? inputEl.value.trim() : '');

  if (!text) return;
  if (!customText && inputEl) inputEl.value = '';

  triggerHaptic('light');
  appendChatMessage(text, 'user');

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
      if (['тест', 'тесты', 'псих'].some(w => text.toLowerCase().includes(w))) {
        appendThreeSolutionsMessage();
      } else {
        appendChatMessage(data.reply, 'bot');
        renderSuggestions(data.suggestions || []);
      }
    } else {
      const fallback = getOfflineReplyClient(text);
      if (fallback.isThreeSolutions) {
        appendThreeSolutionsMessage();
      } else {
        appendChatMessage(fallback.reply, 'bot');
        renderSuggestions(fallback.suggestions);
      }
    }
  } catch (err) {
    if (typingBubble) typingBubble.remove();
    triggerHaptic('medium');
    const fallback = getOfflineReplyClient(text);
    if (fallback.isThreeSolutions) {
      appendThreeSolutionsMessage();
    } else {
      appendChatMessage(fallback.reply, 'bot');
      renderSuggestions(fallback.suggestions);
    }
  }
}

function appendThreeSolutionsMessage() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg bot-msg';

  msgDiv.innerHTML = `
    <div class="bubble">
      🎯 <strong>Я могу предложить тебе 3 эффективных решения:</strong><br><br>
      1. 🧠 <strong>Психологический тест</strong> — определи свой ведущий стиль поведения в школьных конфликтах по методу К. Томаса.<br>
      2. 💬 <strong>Разобрать ситуацию как медиатор</strong> — разберем конфликт один на один, снимем напряжение и найдем нужные слова.<br>
      3. ⚖️ <strong>Мастер разрешения конфликтов</strong> — пошаговый конструктор с получением готового дипломатического плана.<br><br>
      <em>Выбери подходящий вариант:</em>
      <div class="solutions-inline-options">
        <button class="inline-solution-btn" onclick="setAssistantMode('test')">
          🧠 <strong>Психологический тест</strong> (стиль поведения)
        </button>
        <button class="inline-solution-btn" onclick="startMediatorChatPrompt()">
          💬 <strong>Разобрать ситуацию как медиатор</strong>
        </button>
        <button class="inline-solution-btn" onclick="setAssistantMode('wizard')">
          ⚖️ <strong>Мастер разрешения конфликтов</strong>
        </button>
      </div>
    </div>
  `;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
  renderSuggestions(["Психологический тест", "Разобрать как медиатор", "Мастер конфликтов"]);
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

function clearUnifiedAssistant() {
  triggerHaptic('medium');
  const container = document.getElementById('chatMessages');
  const sugContainer = document.getElementById('chatSuggestions');
  if (container) {
    container.innerHTML = `
      <div class="msg bot-msg">
        <div class="bubble">
          👋 История очищена. Напиши, что случилось, или отправь слово <strong>«тест»</strong>, и я предложу три решения!
          <div class="solutions-inline-options">
            <button class="inline-solution-btn" onclick="setAssistantMode('test')">
              🧠 <strong>Психологический тест</strong> (стиль поведения в споре)
            </button>
            <button class="inline-solution-btn" onclick="startMediatorChatPrompt()">
              💬 <strong>Разобрать ситуацию как медиатор</strong>
            </button>
            <button class="inline-solution-btn" onclick="setAssistantMode('wizard')">
              ⚖️ <strong>Мастер разрешения конфликтов</strong>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  if (sugContainer) sugContainer.innerHTML = '';
  resetWizard();
  resetPsychTest();
}

// =====================================================================
// МАСТЕР РАЗРЕШЕНИЯ КОНФЛИКТА (WIZARD)
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

  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`stepDot${i}`);
    const line = document.getElementById(`stepLine${i}`);
    if (dot) dot.classList.toggle('active', i <= stepNum);
    if (line) line.classList.toggle('active', i < stepNum);
  }

  for (let i = 1; i <= 4; i++) {
    const content = document.getElementById(`wizardStep${i}`);
    if (content) content.classList.toggle('active', i === stepNum);
  }

  scrollToAssistant();
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
    if (uploadText) uploadText.textContent = `Выбран файл: ${file.name}`;
    triggerHaptic('medium');
  };
  reader.readAsDataURL(file);
}

function removeWizardImg(event) {
  if (event && event.stopPropagation) event.stopPropagation();
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
    .replace(/^### (.*$)/gim, '<h4 style="margin: 12px 0 6px; color: var(--text-primary); font-size: 14.5px; font-weight: 700;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="margin: 14px 0 8px; color: var(--text-primary); font-size: 15.5px; font-weight: 700;">$1</h3>')
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
      const fallbackAdvice = getOfflineAnalysisClient(state.wizard.opponent, state.wizard.category, desc);
      if (resultTextEl) resultTextEl.innerHTML = formatMarkdown(fallbackAdvice);
    }
  } catch (err) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (resultEl) resultEl.classList.remove('hidden');
    triggerHaptic('heavy');
    const fallbackAdvice = getOfflineAnalysisClient(state.wizard.opponent, state.wizard.category, desc);
    if (resultTextEl) resultTextEl.innerHTML = formatMarkdown(fallbackAdvice);
  }
}

function resetWizard() {
  triggerHaptic('light');
  state.wizard.description = '';
  state.wizard.imageBase64 = null;
  const descEl = document.getElementById('wizardDesc');
  if (descEl) descEl.value = '';
  removeWizardImg();
  goToWizardStep(1);
}

function transferWizardToChat() {
  setAssistantMode('chat');
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = 'Подскажи, с каких именно слов лучше начать разговор?';
    chatInput.focus();
  }
}
