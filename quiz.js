const portraits = [
  ['诸葛亮','谋士','深谋远虑、善于拆解、考虑周全','别人看见一团线，你已经摸到了线头。','遇到变化或分歧时，你常先找信息、理顺因果，再挑一条走得通的路。这份对全局和后手的关注，让你和诸葛亮的谋士形象相照。','你擅长提早看见容易被忽略的风险，也能把复杂问题拆成别人愿意接手的小步。','随身道具是一张写着三套备选方案的便签。'],
  ['李世民','帝王','整合意见、敢于决断、重视协作','你最擅长的，是把一桌意见变成一件事。','人多意见杂时，你倾向于先找到共同目标，再让每个人有事可做。这种把意见变成合力的方式，呼应李世民的统筹型形象。','你能在一群人等着别人开口时，给大家一个具体、可共同推进的起点。','朋友群里最常出现的关键词，大概是你发的「时间地点定了」。'],
  ['苏轼','文人','善于表达、幽默通透、善用比喻','日子起了褶，你能顺手折出一朵花。','你常用故事、比喻或幽默重新讲一件事情，让难开口的感受变得好理解。这种把生活转化成表达的习惯，与苏轼的文人形象相照。','你能给一场尴尬找到合适的说法，也能在平常的小事里发掘值得分享的角度。','你的朋友圈草稿箱，可能比很多人的游记还精彩。'],
  ['荆轲','侠客','看重情义、关照他人、敢于出声','有人被落下时，你就是那个会回头的人。','你容易留意谁没被听见、谁正需要帮助，也愿意在分歧里替在乎的人说句话。这股护住身边人的劲头，让人想到荆轲的侠客形象。','你能敏锐发现关系里的不公平，在旁人还犹豫时给出及时而具体的支持。','朋友的紧急联系人栏里，你很可能有一席之地。'],
  ['李白','诗人','感受细腻、想象丰富、好奇心强','别人赶路，你还听见了风。','你容易被气味、光线或一句恰好的话触动，也愿意跟着好奇心多走几步。这种对体验和想象的偏爱，有几分李白的诗人气质。','你擅长捕捉别人匆匆略过的细节，还可能把寻常经历变成很新鲜的点子。','你的相册可能有十几张同一天空，每一张都舍不得删。'],
  ['霍去病','将领','行动果断、擅长试验、临场灵活','路还没画完，你已经走出了第一步。','面对卡住的事，你倾向于先动手、看反馈，再决定下一步。这样的行动节奏，让人想到霍去病的将领形象。','你能用一次低成本的试验打破僵局，让原本抽象的争论变成看得见的进展。','团队还在讨论买哪种纸，你的第一张草图可能已经画完了。'],
  ['陶渊明','隐士','重视边界、享受独处、节奏从容','你把自己的日子，过成了一方小天地。','当外界很热闹，你仍愿意留一些时间给独处、慢生活和自己的兴趣。这份对生活节奏的珍惜，呼应陶渊明的隐士形象。','你善于分辨自己真正需要的东西，也能在嘈杂时保住注意力和恢复空间。','如果周末也能设为免打扰，你大概会给它一个固定时段。']
];
const traits = ['谋略','统筹','表达','仗义','感受','行动','自在'];

const questions = questionGroups.flatMap(([group, items]) =>
  items.map(([title, ...choices]) => ({
    group,
    title,
    options: choices.map(choice => {
      const [label, weights] = choice.split('|');
      const [primary, secondary] = [...weights].map(Number);
      return { label, primary, secondary };
    })
  }))
);

// Scale each trait by its attainable maximum, since choices offer different
// opportunities to earn points. Integer cross-products preserve exact ties.
const maximums = traits.map((_, trait) => questions.reduce((sum, question) =>
  sum + Math.max(...question.options.map(option =>
    option.primary === trait ? 2 : Number(option.secondary === trait))), 0));

function scoreAnswers(answers) {
  if (answers.length !== questions.length) throw new RangeError('需要回答全部题目');
  const totals = traits.map(() => 0);
  const primaryHits = traits.map(() => 0);
  const selected = questions.map((question, index) => {
    const choice = question.options[answers[index]];
    if (!choice) throw new RangeError('存在未作答或无效选项');
    totals[choice.primary] += 2;
    totals[choice.secondary] += 1;
    primaryHits[choice.primary]++;
    return choice;
  });
  const ranked = traits.map((_, index) => index).sort((a, b) => {
    const gap = totals[b] * maximums[a] - totals[a] * maximums[b];
    if (gap) return gap;
    if (primaryHits[a] !== primaryHits[b]) return primaryHits[b] - primaryHits[a];
    // Use the first answer that distinguishes tied traits.
    for (const { primary, secondary } of selected) {
      const weight = trait => primary === trait ? 2 : Number(secondary === trait);
      if (weight(a) !== weight(b)) return weight(b) - weight(a);
    }
    return a - b;
  });
  return { winner: ranked[0], totals };
}

const app = document.querySelector('#app');
const home = app.innerHTML;
let answers = [];
let current = 0;

function show(markup, focusTarget) {
  app.innerHTML = markup;
  app.querySelector(focusTarget).focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function renderQuestion() {
  const question = questions[current];
  const completed = answers.filter(Number.isInteger).length;
  const finishing = current === questions.length - 1;
  // Vary the displayed order while keeping it stable when revisiting a question.
  const offset = (current * 7 + Math.floor(current / 4)) % question.options.length;
  const options = question.options.map((_, position) => {
    const index = (position + offset) % question.options.length;
    return `<label class="option">
      <input type="radio" name="choice" value="${index}" ${answers[current] === index ? 'checked' : ''}>
      <span class="letter" aria-hidden="true">${'ABCD'[position]}</span>
      <span>${question.options[index].label}</span>
    </label>`;
  }).join('');
  show(`<form class="panel enter" id="question-form">
    <div class="progress-line"><span>${question.group}</span><span>第 ${current + 1} / ${questions.length} 题</span></div>
    <progress id="progress" max="${questions.length}" value="${completed}" aria-label="已答题数"></progress>
    <h1 id="question-heading" tabindex="-1">${question.title}</h1>
    <div class="options" role="radiogroup" aria-labelledby="question-heading">${options}</div>
    <div class="actions">
      <button type="button" class="quiet" id="back">${current === 0 ? '返回首页' : '上一题'}</button>
      <button class="primary" type="submit" id="next" ${answers[current] === undefined ? 'disabled' : ''}>
        ${finishing ? '查看结果' : '下一题'}
      </button>
    </div>
  </form>`, '#question-heading');
}

function renderResult() {
  const { winner } = scoreAnswers(answers);
  const [name, role, features, line, reason, strength, bonus] = portraits[winner];
  show(`<section class="result-wrap enter" aria-labelledby="result-name">
    <article class="result-card">
      <header class="result-top">
        <div class="result-type">我的历史人物人格 · ${role}</div>
        <h1 id="result-name" tabindex="-1">${name}</h1>
        <blockquote>「${line}」</blockquote>
        <div class="chips" aria-label="性格特点">${features.split('、').map(feature => `<span>${feature}</span>`).join('')}</div>
      </header>
      <div class="result-details">
        <section><h2>为什么像你</h2><p>${reason}</p></section>
        <section><h2>隐藏优势</h2><p>${strength}</p></section>
        <section><h2>趣味彩蛋</h2><p>${bonus}</p></section>
      </div>
      <div class="card-footer">古人照影 · 测测你的灵魂对应哪位中国历史人物</div>
    </article>
    <div class="actions result-actions">
      <button type="button" class="quiet" id="restart">重新测试</button>
      <button type="button" class="primary" id="screenshot">截图模式</button>
    </div>
    <button type="button" class="quiet exit-screenshot" id="exit-screenshot">退出截图模式</button>
  </section>`, '#result-name');
}

function setScreenshot(enabled) {
  document.body.classList.toggle('screenshot', enabled);
  app.querySelector(enabled ? '#exit-screenshot' : '#screenshot').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

app.addEventListener('click', event => {
  switch (event.target.closest('button')?.id) {
    case 'start': renderQuestion(); break;
    case 'back':
      if (current > 0) {
        current--;
        renderQuestion();
      } else {
        show(home, '#start');
      }
      break;
    case 'restart':
      answers = [];
      current = 0;
      show(home, '#start');
      break;
    case 'screenshot': setScreenshot(true); break;
    case 'exit-screenshot': setScreenshot(false); break;
  }
});

app.addEventListener('change', event => {
  if (event.target.name !== 'choice') return;
  answers[current] = Number(event.target.value);
  app.querySelector('#next').disabled = false;
  app.querySelector('#progress').value = answers.filter(Number.isInteger).length;
});

app.addEventListener('submit', event => {
  if (event.target.id !== 'question-form') return;
  event.preventDefault();
  if (!Number.isInteger(answers[current])) return;
  if (current === questions.length - 1) {
    renderResult();
  } else {
    current++;
    renderQuestion();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('screenshot')) setScreenshot(false);
});