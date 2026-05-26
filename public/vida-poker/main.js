/**
 * VIDA POKER — main.js  v4
 * All DOM / rendering / animation / sound. No game logic.
 *
 * v4 changes:
 *  - Point system removed
 *  - Passive selection (choose 1 of 3) replaces shop
 *  - Item selection (choose 1 of 3) replaces random grant
 *  - Shop: buy items with Life
 *  - Infinity mode + victory screen
 *  - Background color stages
 *  - All hardcoded Korean replaced with t() i18n
 *  - Extra item slot support
 */

// ─────────────────────────────────────────────
// I18N
// ─────────────────────────────────────────────
const UI_STRINGS = {
  en: {
    title_sub:'ROGUELITE POKER',
    choose_difficulty:'Choose Difficulty',
    diff_easy:'EASY', diff_normal:'NORMAL', diff_hard:'HARD', diff_insane:'INSANE',
    diff_easy_desc:'Moderate drain · Slow growth',
    diff_normal_desc:'Recommended',
    diff_hard_desc:'Steep growth · Punishing reveals',
    diff_insane_desc:'Survive if you can',
    btn_start:'▶  START GAME',
    btn_infinity:'∞ INFINITY',
    hud_life:'LIFE', hud_round:'ROUND', hud_cost_label:'Drain',
    hud_field:'⬡  Field Cards', hud_hand:'✦  Your Hand',
    hud_expected:'Expected return', hud_passives:'Passives:',
    btn_reveal:'▶ Reveal Card',
    btn_settle:'Settle',
    btn_fold:'Fold',
    btn_item:'🎴 Item',
    btn_extra_item:'💎 Extra',
    btn_bet_minus:'−',
    phase_prebet:(round)=>`Round ${round} — Place your bet`,
    phase_betting:(round,revealed)=>`Round ${round} — ${revealed}/5 revealed`,
    phase_processing:'Processing…',
    result_profit:'🎉 Profit!', result_loss:'📉 Loss', result_fold:'🏳 Fold',
    result_life_now:(l)=>`Life: ${l}♥`,
    prebet_title:'Place Your Bet',
    prebet_info:'Set your wager before the cards are dealt.',
    prebet_locked:'Bet locked: ♥',
    item_title:'🎴 Use Item', item_subtitle:'Select target card',
    item_no_target:'Using…', btn_cancel:'Cancel',
    item_held:'Held Item', item_none:'No item',
    go_title:'GAME OVER', go_sub:'Life depleted',
    go_final_round:'Final Round', go_life_label:'Remaining Life',
    btn_home:'Back to Title',
    go_nickname_label:'Enter your nickname',
    go_submit:'Register', go_submit_success:'Score registered!', go_submit_error:'Registration failed',
    go_already_submitted:'Already registered',
    victory_title:'🎉 VICTORY!', victory_sub:'You survived 100 rounds!',
    victory_round_label:'Final Round', victory_life_label:'Remaining Life',
    victory_nickname_label:'Enter your nickname',
    victory_submit:'Register', victory_submit_success:'Score registered!', victory_submit_error:'Registration failed',
    btn_infinity_continue:'Continue (Infinity Mode)',
    btn_victory_home:'Back to Title',
    lb_title:'🏆 LEADERBOARD', lb_subtitle:'Top Players by Round',
    lb_empty:'No records yet', lb_back:'← Back to Title',
    lb_loading:'Loading…', lb_error:'Failed to load',
    passive_select_title:'Choose a Passive', passive_select_subtitle:'Pick one of three upgrades',
    item_select_title:'Choose an Item', item_select_subtitle:'Pick one of three items',
    shop_title:'🏪 Shop', shop_subtitle:'Buy items with Life',
    shop_life_label:'Current Life', shop_skip:'Skip',
    shop_extra_slot:'Extra Item Slot', shop_extra_occupied:'(Occupied — buying replaces it)',
    lv_label:'Lv', drain_label:'Drain',
    winnings_label:'Winnings', round_drain_label:'Round drain',
    bet_half_recovered:'Half bet recovered', bet_lost_label:'Bet lost',
    fold_label:'Fold', bet_held_label:'Bet held',
    notif_ace_max:'Cannot rank up an Ace!',
    notif_rank_min:'Already at minimum rank!',
    notif_need_two:'Need two hand cards!',
    notif_spade:'Card converted to ♠!',
    notif_red:(s)=>`Card → ${s}!`,
    notif_black:(s)=>`Card → ${s}!`,
    notif_redraw:(c)=>`New card: ${c}`,
    notif_rankup:(a,b)=>`Rank: ${a}→${b}`,
    notif_rankdown:(a,b,c)=>`Rank: ${a}→${b} + drew ${c}`,
    notif_rankswap:'Hand ranks swapped!',
    notif_passive_selected:'Passive acquired!',
    notif_item_selected:'Item acquired!',
    notif_shop_bought:'Item purchased!',
    notif_not_enough_life:'Not enough Life!',
    notif_item_used:'Item used!',
    notif_reveal_pen:(c)=>`Drain now ${c}♥`,
    extra_slot_label:'EXTRA ITEM',
    item_slot_label:'HELD ITEM',
  },
  ko: {
    title_sub:'로그라이트 포커',
    choose_difficulty:'난이도 선택',
    diff_easy:'EASY', diff_normal:'NORMAL', diff_hard:'HARD', diff_insane:'INSANE',
    diff_easy_desc:'완만한 차감 · 느린 증가',
    diff_normal_desc:'추천',
    diff_hard_desc:'빠른 증가 · 공개 페널티 강화',
    diff_insane_desc:'살아남을 수 있다면',
    btn_start:'▶  게임 시작',
    btn_infinity:'∞ 인피니티',
    hud_life:'라이프', hud_round:'라운드', hud_cost_label:'차감',
    hud_field:'⬡  필드 카드', hud_hand:'✦  내 패',
    hud_expected:'예상 수익', hud_passives:'패시브:',
    btn_reveal:'▶ 카드 공개',
    btn_settle:'정산하기',
    btn_fold:'폴드',
    btn_item:'🎴 아이템',
    btn_extra_item:'💎 추가',
    btn_bet_minus:'−',
    phase_prebet:(round)=>`라운드 ${round} — 베팅하세요`,
    phase_betting:(round,revealed)=>`라운드 ${round} — 필드 ${revealed}/5 공개`,
    phase_processing:'처리 중…',
    result_profit:'🎉 수익!', result_loss:'📉 손실', result_fold:'🏳 폴드',
    result_life_now:(l)=>`라이프: ${l}♥`,
    prebet_title:'베팅하세요',
    prebet_info:'카드가 배분되기 전에 베팅액을 설정하세요.',
    prebet_locked:'베팅 확정: ♥',
    item_title:'🎴 아이템 사용', item_subtitle:'대상 카드를 선택하세요',
    item_no_target:'사용 중…', btn_cancel:'취소',
    item_held:'보유 아이템', item_none:'아이템 없음',
    go_title:'GAME OVER', go_sub:'생명이 다했습니다',
    go_final_round:'최종 라운드', go_life_label:'남은 라이프',
    btn_home:'처음으로',
    go_nickname_label:'닉네임을 입력하세요',
    go_submit:'등록', go_submit_success:'점수가 등록되었습니다!', go_submit_error:'등록에 실패했습니다',
    go_already_submitted:'이미 등록되었습니다',
    victory_title:'🎉 승리!', victory_sub:'100라운드를 생존했습니다!',
    victory_round_label:'최종 라운드', victory_life_label:'남은 라이프',
    victory_nickname_label:'닉네임을 입력하세요',
    victory_submit:'등록', victory_submit_success:'점수가 등록되었습니다!', victory_submit_error:'등록에 실패했습니다',
    btn_infinity_continue:'계속하기 (인피니티 모드)',
    btn_victory_home:'처음으로',
    lb_title:'🏆 리더보드', lb_subtitle:'라운드 순위',
    lb_empty:'기록이 없습니다', lb_back:'← 처음으로',
    lb_loading:'불러오는 중…', lb_error:'불러오기 실패',
    passive_select_title:'패시브 선택', passive_select_subtitle:'세 가지 중 하나를 고르세요',
    item_select_title:'아이템 선택', item_select_subtitle:'세 가지 중 하나를 고르세요',
    shop_title:'🏪 상점', shop_subtitle:'라이프로 아이템 구매',
    shop_life_label:'현재 라이프', shop_skip:'건너뛰기',
    shop_extra_slot:'추가 아이템 칸', shop_extra_occupied:'(보유 중 — 구매 시 교체됨)',
    lv_label:'Lv', drain_label:'차감',
    winnings_label:'획득', round_drain_label:'라운드 차감',
    bet_half_recovered:'베팅 절반 회수', bet_lost_label:'베팅 상실',
    fold_label:'폴드', bet_held_label:'베팅 예치',
    notif_ace_max:'에이스는 올릴 수 없습니다!',
    notif_rank_min:'이미 최저 랭크입니다!',
    notif_need_two:'패 카드가 2장 필요합니다!',
    notif_spade:'카드가 ♠로 변환됐습니다!',
    notif_red:(s)=>`카드 → ${s}!`,
    notif_black:(s)=>`카드 → ${s}!`,
    notif_redraw:(c)=>`새 카드: ${c}`,
    notif_rankup:(a,b)=>`랭크: ${a}→${b}`,
    notif_rankdown:(a,b,c)=>`랭크: ${a}→${b} + ${c} 드로우`,
    notif_rankswap:'패 랭크가 교환됐습니다!',
    notif_passive_selected:'패시브 획득!',
    notif_item_selected:'아이템 획득!',
    notif_shop_bought:'아이템 구매!',
    notif_not_enough_life:'라이프가 부족합니다!',
    notif_item_used:'아이템 사용!',
    notif_reveal_pen:(c)=>`차감량: ${c}♥`,
    extra_slot_label:'추가 아이템',
    item_slot_label:'보유 아이템',
  },
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let G    = null;
let lang = 'en';
let selectedDifficulty = 'normal';
let pendingItemAction  = null;
let pendingExtraItemAction = false;
let isAnimating = false;
let scoreSubmitted = false;
let victoryScoreSubmitted = false;

function t(key,...args) {
  const s=UI_STRINGS[lang]?.[key]??UI_STRINGS.en[key]??key;
  return typeof s==='function'?s(...args):s;
}

// ─────────────────────────────────────────────
// AUDIO
// ─────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, type='sine', duration=0.12, gain=0.18, delay=0) {
  try {
    const ctx=getAudio();
    const osc=ctx.createOscillator();
    const g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type=type; osc.frequency.value=freq;
    g.gain.setValueAtTime(gain, ctx.currentTime+delay);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+delay+duration);
    osc.start(ctx.currentTime+delay);
    osc.stop(ctx.currentTime+delay+duration+0.05);
  } catch(e){}
}
function sfx(name, rarity='common') {
  const rarityChord = {
    common:    [330],
    uncommon:  [330,415],
    rare:      [392,494,587],
    epic:      [440,554,659,880],
    legendary: [523,659,784,1047,1319],
  };
  const freqs = rarityChord[rarity]||rarityChord.common;
  switch(name) {
    case 'reveal':  playTone(440,'sine',0.08,0.1); break;
    case 'fold':    playTone(220,'sawtooth',0.2,0.15); break;
    case 'life_up': playTone(660,'sine',0.15,0.2); playTone(880,'sine',0.12,0.15,0.1); break;
    case 'life_dn': playTone(220,'sawtooth',0.25,0.2); break;
    case 'hand_reveal':
      freqs.forEach((f,i)=>playTone(f,'sine',0.2+i*0.05,0.25,i*0.07));
      break;
    case 'item':    playTone(600,'triangle',0.1,0.15); playTone(750,'triangle',0.1,0.12,0.08); break;
    case 'shop':    playTone(440,'triangle',0.1,0.1);  break;
    case 'tick':    playTone(330,'sine',0.04,0.08); break;
    case 'mult':    playTone(520,'sine',0.08,0.12); break;
    case 'total':   playTone(660,'sine',0.15,0.2); playTone(880,'sine',0.12,0.18,0.12); break;
    case 'select':  playTone(500,'triangle',0.1,0.15); playTone(650,'triangle',0.08,0.12,0.06); break;
    case 'victory': playTone(523,'sine',0.2,0.2); playTone(659,'sine',0.15,0.18,0.15); playTone(784,'sine',0.15,0.18,0.3); break;
  }
}

// ─────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─────────────────────────────────────────────
// SCREEN SHAKE
// ─────────────────────────────────────────────
function screenShake(heavy=false) {
  const el = document.getElementById('gameScreen');
  if (!el) return;
  el.classList.remove('shaking','shaking-heavy');
  void el.offsetWidth;
  el.classList.add(heavy ? 'shaking-heavy' : 'shaking');
  setTimeout(()=>el.classList.remove('shaking','shaking-heavy'), heavy ? 700 : 550);
}

// ─────────────────────────────────────────────
// BACKGROUND STAGES
// ─────────────────────────────────────────────
const STAGE_BACKGROUNDS = [
  'radial-gradient(ellipse at 15% 20%,rgba(80,40,180,0.17) 0%,transparent 50%),radial-gradient(ellipse at 85% 80%,rgba(180,40,80,0.13) 0%,transparent 50%)',
  'radial-gradient(ellipse at 15% 20%,rgba(40,80,180,0.17) 0%,transparent 50%),radial-gradient(ellipse at 85% 80%,rgba(40,180,80,0.13) 0%,transparent 50%)',
  'radial-gradient(ellipse at 15% 20%,rgba(40,180,80,0.17) 0%,transparent 50%),radial-gradient(ellipse at 85% 80%,rgba(180,180,40,0.13) 0%,transparent 50%)',
  'radial-gradient(ellipse at 15% 20%,rgba(180,80,40,0.17) 0%,transparent 50%),radial-gradient(ellipse at 85% 80%,rgba(180,40,40,0.13) 0%,transparent 50%)',
  'radial-gradient(ellipse at 15% 20%,rgba(180,40,180,0.17) 0%,transparent 50%),radial-gradient(ellipse at 85% 80%,rgba(40,180,180,0.13) 0%,transparent 50%)',
];
function updateBackground() {
  if (!G) {
    document.body.style.background = '';
    document.body::before;
    const before = document.body.style;
    return;
  }
  const stage = VidaGame.getBackgroundStage(G);
  const idx = Math.min(stage, STAGE_BACKGROUNDS.length - 1);
  document.body.style.background = `var(--bg1)`;
  document.body.style.setProperty('--stage-bg', STAGE_BACKGROUNDS[idx]);
  // Apply via pseudo-element workaround: just set on body::before via a style tag
  let stageStyle = document.getElementById('stageStyle');
  if (!stageStyle) {
    stageStyle = document.createElement('style');
    stageStyle.id = 'stageStyle';
    document.head.appendChild(stageStyle);
  }
  stageStyle.textContent = `body::before{background:${STAGE_BACKGROUNDS[idx]}!important;}`;
}
function resetBackground() {
  let stageStyle = document.getElementById('stageStyle');
  if (stageStyle) stageStyle.textContent = '';
}

// ─────────────────────────────────────────────
// DIFFICULTY / START
// ─────────────────────────────────────────────
function selectDifficulty(diff) {
  selectedDifficulty=diff;
  document.querySelectorAll('.diff-btn').forEach(b=>b.classList.toggle('selected',b.dataset.diff===diff));
  updateInfinityButton();
}

function updateInfinityButton() {
  const btn = document.getElementById('btnInfinity');
  if (!btn) return;
  const unlocked = localStorage.getItem('vida_infinity_'+selectedDifficulty);
  btn.style.display = unlocked ? '' : 'none';
}

function startGame() {
  G=VidaGame.initGame({difficulty:selectedDifficulty, lang});
  showScreen('gameScreen');
  updateBackground();
  // Start with passive selection at round 1
  processRoundTransition();
}

function startInfinityGame() {
  G=VidaGame.initInfinityGame({difficulty:selectedDifficulty, lang});
  showScreen('gameScreen');
  updateBackground();
  processRoundTransition();
}

// ─────────────────────────────────────────────
// ROUND TRANSITION FLOW (v4)
// After settle/fold → advanceRound → check game over / victory → passive → item → shop → preBet
// ─────────────────────────────────────────────
function processRoundTransition() {
  // 1. Check game over
  if (VidaGame.isGameOver(G)) { showGameOver(); return; }
  // 2. Check victory
  if (VidaGame.checkRoundCap(G) === 'victory') { showVictory(); return; }
  // 3. Passive selection
  if (VidaGame.shouldShowPassiveSelection(G)) {
    showPassiveSelection();
    return;
  }
  // 4. Item selection
  if (VidaGame.shouldShowItemSelection(G)) {
    showItemSelection();
    return;
  }
  // 5. Shop
  if (VidaGame.shouldShowShop(G) && G.round > 1) {
    showShopModal();
    return;
  }
  // 6. Enter preBet
  VidaGame.enterPreBet(G);
  updateBackground();
  renderAll();
}

function afterPassiveSelected() {
  // Check item selection next
  if (VidaGame.shouldShowItemSelection(G)) {
    showItemSelection();
    return;
  }
  afterItemSelected();
}

function afterItemSelected() {
  // Check shop next
  if (VidaGame.shouldShowShop(G) && G.round > 1) {
    showShopModal();
    return;
  }
  afterShopDone();
}

function afterShopDone() {
  VidaGame.enterPreBet(G);
  updateBackground();
  renderAll();
}

// ─────────────────────────────────────────────
// PASSIVE SELECTION MODAL
// ─────────────────────────────────────────────
function showPassiveSelection() {
  const offers = VidaGame.generatePassiveOffers(G);
  if (!offers.length) { afterPassiveSelected(); return; }
  document.getElementById('passiveSelectTitle').textContent = t('passive_select_title');
  document.getElementById('passiveSelectSubtitle').textContent = t('passive_select_subtitle');
  const grid = document.getElementById('passiveOfferGrid');
  grid.innerHTML = '';
  for (const offer of offers) {
    const card = document.createElement('div');
    card.className = 'offer-card';
    const name = offer.nameI18n[lang] || offer.nameI18n.en;
    card.innerHTML = `
      <div class="offer-name">${name}</div>
      <div class="offer-desc">${offer.nextDesc}</div>
      <div class="offer-level">${t('lv_label')} ${offer.currentLv} → ${offer.currentLv+1}</div>
    `;
    card.onclick = () => {
      const res = VidaGame.selectPassive(G, offer.id);
      if (res.ok) {
        sfx('select');
        notify(t('notif_passive_selected'),'notif-gold');
        document.getElementById('passiveSelectionModal').classList.add('hidden');
        afterPassiveSelected();
      }
    };
    grid.appendChild(card);
  }
  document.getElementById('passiveSelectionModal').classList.remove('hidden');
}

// ─────────────────────────────────────────────
// ITEM SELECTION MODAL
// ─────────────────────────────────────────────
function showItemSelection() {
  const offers = VidaGame.generateItemOffers(G);
  document.getElementById('itemSelectTitle').textContent = t('item_select_title');
  document.getElementById('itemSelectSubtitle').textContent = t('item_select_subtitle');
  const grid = document.getElementById('itemOfferGrid');
  grid.innerHTML = '';
  for (const offer of offers) {
    const card = document.createElement('div');
    card.className = 'offer-card';
    const name = offer.nameI18n[lang] || offer.nameI18n.en;
    const desc = (offer.descI18n[lang] || offer.descI18n.en);
    card.innerHTML = `
      <div class="offer-name">${name}</div>
      <div class="offer-desc">${desc}</div>
    `;
    card.onclick = () => {
      const res = VidaGame.selectItem(G, offer.id);
      if (res.ok) {
        sfx('select');
        notify(t('notif_item_selected'),'notif-gold');
        document.getElementById('itemSelectionModal').classList.add('hidden');
        afterItemSelected();
      }
    };
    grid.appendChild(card);
  }
  document.getElementById('itemSelectionModal').classList.remove('hidden');
}

// ─────────────────────────────────────────────
// SHOP MODAL (buy with Life)
// ─────────────────────────────────────────────
function showShopModal() {
  const offers = VidaGame.generateShopOffers(G);
  document.getElementById('shopTitle').textContent = t('shop_title');
  document.getElementById('shopSubtitle').textContent = t('shop_subtitle');
  document.getElementById('shopLifeLabel').textContent = t('shop_life_label');
  document.getElementById('shopLifeVal').textContent = G.life.toFixed(1);
  document.getElementById('btnShopSkip').textContent = t('shop_skip');

  // Show extra slot info
  const extraInfo = document.getElementById('shopExtraSlotInfo');
  if (G.extraItemSlot) {
    const def = VidaGame.getItemDef(G.extraItemSlot);
    const extraName = def ? (def.nameI18n[lang] || def.nameI18n.en) : G.extraItemSlot;
    extraInfo.textContent = `${t('shop_extra_slot')}: ${extraName} ${t('shop_extra_occupied')}`;
    extraInfo.style.color = 'var(--orange)';
  } else {
    extraInfo.textContent = `${t('shop_extra_slot')}: —`;
    extraInfo.style.color = 'var(--text-muted)';
  }

  const grid = document.getElementById('shopOfferGrid');
  grid.innerHTML = '';
  for (const offer of offers) {
    const card = document.createElement('div');
    const canBuy = G.life >= offer.lifeCost;
    card.className = 'offer-card' + (canBuy ? '' : ' disabled');
    const name = offer.nameI18n[lang] || offer.nameI18n.en;
    const desc = (offer.descI18n[lang] || offer.descI18n.en);
    card.innerHTML = `
      <div class="offer-name">${name}</div>
      <div class="offer-desc">${desc}</div>
      <div class="offer-cost">♥ ${offer.lifeCost}</div>
    `;
    if (canBuy) {
      card.onclick = () => {
        const res = VidaGame.buyShopItem(G, offer.id);
        if (res.ok) {
          sfx('shop');
          notify(t('notif_shop_bought'),'notif-gold');
          document.getElementById('shopModal').classList.add('hidden');
          afterShopDone();
        } else {
          notify(t('notif_not_enough_life'),'notif-red');
        }
      };
    }
    grid.appendChild(card);
  }
  document.getElementById('shopModal').classList.remove('hidden');
}

function closeShopModal() {
  document.getElementById('shopModal').classList.add('hidden');
  afterShopDone();
}

// ─────────────────────────────────────────────
// PRE-BET
// ─────────────────────────────────────────────
function confirmBetAndDeal() {
  if (!G||G.phase!=='preBet') return;
  const prevLife = G.life;
  if (!VidaGame.confirmBetAndDeal(G)) return;
  sfx('fold');
  animateLifeChange(prevLife, G.life);
  renderAll();
  setTimeout(()=>{
    sfx('reveal'); sfx('reveal');
    const handEls = [...document.querySelectorAll('#handCards .card')];
    handEls.forEach((el,i)=>{
      setTimeout(()=>{ el.classList.add('card-reveal'); setTimeout(()=>el.classList.remove('card-reveal'),500); }, i*150);
    });
    const fieldEls = [...document.querySelectorAll('#fieldCards .card')];
    fieldEls.forEach((el,i)=>{
      if (i < G.revealedCount) {
        setTimeout(()=>{ el.classList.add('card-reveal'); setTimeout(()=>el.classList.remove('card-reveal'),500); }, 300+i*150);
      }
    });
  }, 400);
}

// ─────────────────────────────────────────────
// REVEAL
// ─────────────────────────────────────────────
function revealNext() {
  if (!G||G.phase!=='betting') return;
  const prev=G.roundCost;
  VidaGame.revealNext(G);
  sfx('reveal');
  animateRevealCard(G.revealedCount-1);
  renderAll();
  if (G.roundCost!==prev) notify(t('notif_reveal_pen',G.roundCost),'notif-red');
}

// ─────────────────────────────────────────────
// BETTING (adjust bet)
// ─────────────────────────────────────────────
function adjustBet(mode) {
  if (!G) return;
  VidaGame.adjustBet(G, mode);
  renderPreBetBar();
}

// ─────────────────────────────────────────────
// SETTLE
// ─────────────────────────────────────────────
function settle() {
  if (!G||G.phase!=='betting'||isAnimating) return;
  const preview = VidaGame.computeReturn(G);
  isAnimating = true;
  runHandAnimation(preview, ()=>{
    const result = VidaGame.placeBet(G);
    renderAll();
    const isHeavy = ['epic','legendary'].includes(result.rarity);
    screenShake(isHeavy);
    showMultiplierBreakdown(result, ()=>{
      const prev=+(G.life-result.netGain).toFixed(2);
      animateLifeChange(prev, G.life);
      isAnimating = false;
      setTimeout(()=>{
        if (VidaGame.isGameOver(G)) { showGameOver(); return; }
        VidaGame.advanceRound(G);
        processRoundTransition();
      }, 1200);
    });
  });
}

// ─────────────────────────────────────────────
// HAND ANIMATION
// ─────────────────────────────────────────────
const RARITY_COLORS = {
  common:    '#aaffaa',
  uncommon:  '#7aef7a',
  rare:      '#60b0ff',
  epic:      '#c080ff',
  legendary: '#ffd700',
};

function runHandAnimation(preview, onDone) {
  const rarity  = preview.rarity;
  const color   = RARITY_COLORS[rarity]||'#aaffaa';
  const all     = VidaGame.getAllCards(G);
  const indices = preview.contributingIndices;
  const handEls  = [...document.querySelectorAll('#handCards .card')];
  const fieldEls = [...document.querySelectorAll('#fieldCards .card')];
  const allCardEls = [...handEls, ...fieldEls];

  function getEl(idx) {
    if (idx < G.handCards.length) return handEls[idx];
    return fieldEls[idx - G.handCards.length];
  }

  const isSequential = (preview.key==='straight'||preview.key==='straightFlush');
  sfx('hand_reveal', rarity);

  allCardEls.forEach(el=>{ el.style.opacity='0.3'; el.style.transition='opacity 0.3s'; });
  indices.forEach(i=>{ const el=getEl(i); if(el){ el.style.opacity='1'; } });

  const delay = isSequential ? 120 : 0;
  indices.forEach((i,order)=>{
    const el=getEl(i);
    if (!el) return;
    setTimeout(()=>{
      el.style.transition='box-shadow 0.2s, border-color 0.2s, transform 0.2s';
      el.style.boxShadow=`0 0 28px 6px ${color}99`;
      el.style.borderColor=color;
      el.style.borderWidth='2.5px';
      el.style.transform='translateY(-10px) scale(1.07)';
      if (isSequential) sfx('tick');
    }, order*(isSequential?delay:40));
  });

  const totalDelay = isSequential ? indices.length*delay : 200;
  setTimeout(()=>{
    const overlay=document.getElementById('handFlashOverlay');
    if (overlay) {
      overlay.style.background=`radial-gradient(ellipse at center, ${color}33 0%, transparent 70%)`;
      overlay.style.opacity='1';
      setTimeout(()=>{ overlay.style.opacity='0'; }, 400);
    }
  }, totalDelay+80);

  setTimeout(()=>{
    showHandBadge(preview.key, rarity, color);
  }, totalDelay+120);

  setTimeout(()=>{
    allCardEls.forEach(el=>{
      el.style.opacity=''; el.style.boxShadow='';
      el.style.borderColor=''; el.style.borderWidth='';
      el.style.transform='';
    });
    onDone();
  }, totalDelay+700);
}

function showHandBadge(handKey, rarity, color) {
  const badge=document.getElementById('handBadge');
  if (!badge) return;
  badge.textContent=VidaGame.getHandName(handKey,lang);
  badge.style.color=color;
  badge.style.borderColor=color+'88';
  badge.style.background=color+'18';
  badge.style.opacity='1';
  badge.style.transform='translate(-50%,-50%) scale(1)';
  badge.style.transition='opacity 0.3s, transform 0.3s';
  setTimeout(()=>{ badge.style.opacity='0'; badge.style.transform='translate(-50%,calc(-50% - 16px)) scale(0.9)'; }, 750);
}

// ─────────────────────────────────────────────
// MULTIPLIER BREAKDOWN DISPLAY
// ─────────────────────────────────────────────
function showMultiplierBreakdown(result, onDone) {
  const wrap = document.getElementById('multBreakdownWrap');
  const totalEl = document.getElementById('multTotalDisplay');
  wrap.innerHTML = '';
  totalEl.classList.remove('visible');

  const breakdown = result.breakdown || [];
  if (breakdown.length === 0 && result.type === 'fold') {
    totalEl.textContent = '×0';
    totalEl.querySelector('.mult-label')?.remove();
    const label = document.createElement('span');
    label.className = 'mult-label';
    label.textContent = t('result_fold');
    totalEl.appendChild(label);
    totalEl.classList.add('visible');
    sfx('fold');
    setTimeout(()=>{ totalEl.classList.remove('visible'); if (onDone) onDone(); }, 1000);
    return;
  }

  let delay = 0;
  const BASE_DELAY = 350;

  breakdown.forEach((item, idx)=>{
    setTimeout(()=>{
      const line = document.createElement('div');
      let cls = 'mult-line ';
      if (item.isSuitBonus) cls += 'suit';
      else if (item.isRankBonus) cls += 'rank';
      else if (item.isPassive) cls += 'passive';
      else cls += 'hand';
      line.className = cls;
      const displayLabel = item.isSuitBonus && item.suitName ? item.suitName : item.label;
      line.textContent = `×${item.value.toFixed(2)} (${displayLabel})`;
      wrap.appendChild(line);
      sfx('mult');
    }, delay);
    delay += BASE_DELAY;
  });

  if (result.lifeGain > 0) {
    setTimeout(()=>{
      const line = document.createElement('div');
      line.className = 'mult-line suit';
      line.style.color = '#6eff90';
      line.textContent = `+${result.lifeGain.toFixed(1)}♥ (${t('winnings_label')})`;
      wrap.appendChild(line);
      sfx('mult');
    }, delay);
    delay += BASE_DELAY;
  }

  if (result.lifeCost > 0) {
    setTimeout(()=>{
      const line = document.createElement('div');
      line.className = 'mult-line hand';
      line.style.color = '#ff7070';
      line.textContent = `−${result.lifeCost.toFixed(1)}♥ (${t('round_drain_label')})`;
      wrap.appendChild(line);
    }, delay);
    delay += BASE_DELAY;
  }

  setTimeout(()=>{
    totalEl.textContent = `×${result.mult.toFixed(2)}`;
    totalEl.querySelector('.mult-label')?.remove();
    const label = document.createElement('span');
    label.className = 'mult-label';
    const netStr = result.netGain >= 0 ? `+${result.netGain.toFixed(1)}` : result.netGain.toFixed(1);
    label.textContent = `${netStr}♥`;
    totalEl.appendChild(label);
    totalEl.classList.add('visible');
    totalEl.style.color = '';
    sfx('total');
    if (result.mult >= 3.0) screenShake(true);
    else if (result.mult >= 1.5) screenShake(false);
  }, delay + 200);

  const totalDuration = delay + 200 + 1800;
  setTimeout(()=>{
    wrap.innerHTML = '';
    totalEl.classList.remove('visible');
    if (onDone) onDone();
  }, totalDuration);
}

// ─────────────────────────────────────────────
// FOLD DISPLAY
// ─────────────────────────────────────────────
function showFoldDisplay(result, onDone) {
  const wrap = document.getElementById('multBreakdownWrap');
  const totalEl = document.getElementById('multTotalDisplay');
  wrap.innerHTML = '';
  totalEl.classList.remove('visible');

  let delay = 0;
  const BASE_DELAY = 400;

  if (result.betRecovered > 0) {
    setTimeout(()=>{
      const line = document.createElement('div');
      line.className = 'mult-line passive';
      line.textContent = `+${result.betRecovered.toFixed(1)}♥ (${t('bet_half_recovered')})`;
      wrap.appendChild(line);
      sfx('mult');
    }, delay);
    delay += BASE_DELAY;
  }

  if (result.betLost > 0) {
    setTimeout(()=>{
      const line = document.createElement('div');
      line.className = 'mult-line hand';
      line.style.color = '#ff7070';
      line.textContent = `−${result.betLost.toFixed(1)}♥ (${t('bet_lost_label')})`;
      wrap.appendChild(line);
    }, delay);
    delay += BASE_DELAY;
  }

  if (result.lifeCost > 0) {
    setTimeout(()=>{
      const line = document.createElement('div');
      line.className = 'mult-line hand';
      line.style.color = '#ff7070';
      line.textContent = `−${result.lifeCost.toFixed(1)}♥ (${t('round_drain_label')})`;
      wrap.appendChild(line);
    }, delay);
    delay += BASE_DELAY;
  }

  setTimeout(()=>{
    totalEl.textContent = result.netGain >= 0 ? `+${result.netGain.toFixed(1)}` : result.netGain.toFixed(1);
    totalEl.querySelector('.mult-label')?.remove();
    const label = document.createElement('span');
    label.className = 'mult-label';
    label.textContent = `🏳 ${t('fold_label')}`;
    totalEl.appendChild(label);
    totalEl.style.color = result.netGain >= 0 ? 'var(--green)' : 'var(--red)';
    totalEl.classList.add('visible');
    sfx('fold');
  }, delay + 200);

  const totalDuration = delay + 200 + 1200;
  setTimeout(()=>{
    wrap.innerHTML = '';
    totalEl.classList.remove('visible');
    totalEl.style.color = '';
    if (onDone) onDone();
  }, totalDuration);
}

function animateRevealCard(fieldIdx) {
  const fieldEls=[...document.querySelectorAll('#fieldCards .card')];
  const el=fieldEls[fieldIdx];
  if (!el) return;
  el.classList.add('card-reveal');
  setTimeout(()=>el.classList.remove('card-reveal'),500);
}

// ─────────────────────────────────────────────
// LIFE COUNTER ANIMATION
// ─────────────────────────────────────────────
function animateLifeChange(from, to, duration=1200) {
  const display=document.getElementById('lifeDisplay');
  const fill=document.getElementById('lifeBarFill');
  const maxLife=G.maxLife;
  const start=performance.now();
  const delta=to-from;
  const isGain=delta>=0;

  showFloatingLife(delta);
  sfx(isGain?'life_up':'life_dn');

  function step(now) {
    const p=Math.min(1,(now-start)/duration);
    const ease=p<0.5?2*p*p:(1-(Math.pow(-2*p+2,2))/2);
    const cur=from+delta*ease;
    if (display) display.textContent=cur.toFixed(1);
    if (fill) fill.style.width=Math.min(100,(cur/maxLife)*100)+'%';
    if (p<1) requestAnimationFrame(step);
    else {
      if (display) display.textContent=to.toFixed(1);
      if (fill) fill.style.width=Math.min(100,(to/maxLife)*100)+'%';
    }
  }
  requestAnimationFrame(step);
}

function showFloatingLife(delta) {
  const wrap=document.getElementById('floatingLifeWrap');
  if (!wrap) return;
  const el=document.createElement('div');
  el.className='floating-life '+(delta>=0?'fl-pos':'fl-neg');
  el.textContent=(delta>=0?'+':'')+delta.toFixed(2)+'♥';
  wrap.appendChild(el);
  setTimeout(()=>el.remove(),1400);
}

// ─────────────────────────────────────────────
// FOLD
// ─────────────────────────────────────────────
function foldRound() {
  if (!G||G.phase!=='betting'||isAnimating) return;
  isAnimating = true;
  sfx('fold');
  screenShake(false);

  const result=VidaGame.fold(G);
  const prev=+(G.life-result.netGain).toFixed(2);
  renderAll();

  showFoldDisplay(result, ()=>{
    animateLifeChange(prev, G.life);
    isAnimating = false;
    setTimeout(()=>{
      if (VidaGame.isGameOver(G)) { showGameOver(); return; }
      VidaGame.advanceRound(G);
      processRoundTransition();
    }, 800);
  });
}

// ─────────────────────────────────────────────
// ITEMS
// ─────────────────────────────────────────────
function openItemModal() {
  if (!G.heldItem||G.itemUsedThisRound) return;
  const def=VidaGame.getItemDef(G.heldItem);
  if (!def) return;

  if (def.targetPool===null) {
    const res=VidaGame.useItem(G,-1);
    handleItemResult(res,def);
    renderAll();
    return;
  }

  pendingItemAction = false;
  pendingExtraItemAction = false;
  document.getElementById('itemTitle').textContent    = def.nameI18n[lang]||def.nameI18n.en;
  document.getElementById('itemSubtitle').textContent = def.descI18n[lang]||def.descI18n.en;

  const targets=VidaGame.getItemTargets(G,G.heldItem);
  const list=document.getElementById('cardTargetList');
  list.innerHTML='';
  for (const c of targets) {
    const el=makeCardEl(c);
    el.style.cursor='pointer';
    el.classList.add('card-selectable');
    el.onclick=()=>{
      document.getElementById('cardTargetModal').classList.add('hidden');
      const res=VidaGame.useItem(G,c._idx);
      handleItemResult(res,def);
      renderAll();
    };
    list.appendChild(el);
  }
  document.getElementById('cancelCardBtn').textContent=t('btn_cancel');
  document.getElementById('cardTargetModal').classList.remove('hidden');
}

function openExtraItemModal() {
  if (!G.extraItemSlot||G.extraItemUsedThisRound) return;
  const def=VidaGame.getItemDef(G.extraItemSlot);
  if (!def) return;

  if (def.targetPool===null) {
    const res=VidaGame.useExtraItem(G,-1);
    handleItemResult(res,def);
    renderAll();
    return;
  }

  pendingExtraItemAction = true;
  document.getElementById('itemTitle').textContent    = def.nameI18n[lang]||def.nameI18n.en;
  document.getElementById('itemSubtitle').textContent = def.descI18n[lang]||def.descI18n.en;

  const targets=VidaGame.getItemTargets(G,G.extraItemSlot);
  const list=document.getElementById('cardTargetList');
  list.innerHTML='';
  for (const c of targets) {
    const el=makeCardEl(c);
    el.style.cursor='pointer';
    el.classList.add('card-selectable');
    el.onclick=()=>{
      document.getElementById('cardTargetModal').classList.add('hidden');
      const res=VidaGame.useExtraItem(G,c._idx);
      handleItemResult(res,def);
      renderAll();
    };
    list.appendChild(el);
  }
  document.getElementById('cancelCardBtn').textContent=t('btn_cancel');
  document.getElementById('cardTargetModal').classList.remove('hidden');
}

function cancelCardTarget() { document.getElementById('cardTargetModal').classList.add('hidden'); }

function handleItemResult(res,def) {
  if (!res.ok) {
    if (res.reason==='ace_max')  notify(t('notif_ace_max'),'notif-red');
    if (res.reason==='rank_min') notify(t('notif_rank_min'),'notif-red');
    if (res.reason==='need_two') notify(t('notif_need_two'),'notif-red');
    return;
  }
  sfx('item');
  const d=res.detail;
  switch(def.action) {
    case 'suit_to_spade':    notify(t('notif_spade'),'notif-gold'); break;
    case 'color_to_red':     notify(t('notif_red',d.symbol),'notif-gold'); break;
    case 'color_to_black':   notify(t('notif_black',d.symbol),'notif-gold'); break;
    case 'redraw':           notify(t('notif_redraw',d.newCard),'notif-gold'); break;
    case 'rank_up':          notify(t('notif_rankup',d.oldRank,d.newRank),'notif-gold'); break;
    case 'rank_down_draw':   notify(t('notif_rankdown',d.oldRank,d.newRank,d.drawnCard),'notif-gold'); break;
    case 'rank_swap':        notify(t('notif_rankswap'),'notif-gold'); break;
    default:                 notify(t('notif_item_used'),'notif-gold');
  }
}

// ─────────────────────────────────────────────
// GAME OVER
// ─────────────────────────────────────────────
function showGameOver() {
  scoreSubmitted = false;
  document.getElementById('goTitle').textContent      =t('go_title');
  document.getElementById('goSub').textContent        =t('go_sub');
  document.getElementById('goFinalRoundLabel').textContent=t('go_final_round');
  document.getElementById('goLifeLabel').textContent   =t('go_life_label');
  document.getElementById('finalRound').textContent   =G.round;
  document.getElementById('finalLife').textContent    =G.life.toFixed(1);
  document.getElementById('goNicknameLabel').textContent=t('go_nickname_label');
  document.getElementById('btnSubmitScore').textContent=t('go_submit');
  document.getElementById('goNicknameInput').value='';
  document.getElementById('goSubmitStatus').textContent='';
  document.getElementById('goNicknameSection').style.display='block';
  document.getElementById('btnSubmitScore').disabled=false;
  document.getElementById('btnHome').textContent      =t('btn_home');
  resetBackground();
  showScreen('gameOverScreen');
}

async function submitScore() {
  if (scoreSubmitted || !G) return;
  const nickname = document.getElementById('goNicknameInput').value.trim();
  if (!nickname) {
    document.getElementById('goSubmitStatus').textContent = lang==='ko'?'닉네임을 입력해주세요':'Please enter a nickname';
    document.getElementById('goSubmitStatus').style.color = 'var(--red)';
    return;
  }
  const btn = document.getElementById('btnSubmitScore');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname,
        points: 0,
        round: G.round,
        difficulty: G.settings.difficulty,
        mode: G.infinityMode ? 'infinity' : 'normal',
        life: +G.life.toFixed(1),
      }),
    });
    if (res.ok) {
      scoreSubmitted = true;
      document.getElementById('goSubmitStatus').textContent = t('go_submit_success');
      document.getElementById('goSubmitStatus').style.color = 'var(--green)';
      btn.textContent = '✓';
      sfx('total');
    } else {
      throw new Error('Failed');
    }
  } catch (e) {
    document.getElementById('goSubmitStatus').textContent = t('go_submit_error');
    document.getElementById('goSubmitStatus').style.color = 'var(--red)';
    btn.disabled = false;
    btn.textContent = t('go_submit');
  }
}

// ─────────────────────────────────────────────
// VICTORY
// ─────────────────────────────────────────────
function showVictory() {
  victoryScoreSubmitted = false;
  // Unlock infinity mode for this difficulty
  localStorage.setItem('vida_infinity_'+G.settings.difficulty, 'true');

  document.getElementById('victoryTitle').textContent = t('victory_title');
  document.getElementById('victorySub').textContent   = t('victory_sub');
  document.getElementById('victoryRoundLabel').textContent = t('victory_round_label');
  document.getElementById('victoryLifeLabel').textContent  = t('victory_life_label');
  document.getElementById('victoryRound').textContent  = G.round;
  document.getElementById('victoryLife').textContent   = G.life.toFixed(1);
  document.getElementById('victoryNicknameLabel').textContent = t('victory_nickname_label');
  document.getElementById('btnVictorySubmit').textContent = t('victory_submit');
  document.getElementById('btnInfinityContinue').textContent = t('btn_infinity_continue');
  document.getElementById('btnVictoryHome').textContent = t('btn_victory_home');
  document.getElementById('victoryNicknameInput').value = '';
  document.getElementById('victorySubmitStatus').textContent = '';
  document.getElementById('victoryNicknameSection').style.display = 'block';
  document.getElementById('btnVictorySubmit').disabled = false;

  sfx('victory');
  resetBackground();
  showScreen('victoryScreen');
}

async function submitVictoryScore() {
  if (victoryScoreSubmitted || !G) return;
  const nickname = document.getElementById('victoryNicknameInput').value.trim();
  if (!nickname) {
    document.getElementById('victorySubmitStatus').textContent = lang==='ko'?'닉네임을 입력해주세요':'Please enter a nickname';
    document.getElementById('victorySubmitStatus').style.color = 'var(--red)';
    return;
  }
  const btn = document.getElementById('btnVictorySubmit');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname,
        points: 0,
        round: G.round,
        difficulty: G.settings.difficulty,
        mode: 'normal',
        life: +G.life.toFixed(1),
      }),
    });
    if (res.ok) {
      victoryScoreSubmitted = true;
      document.getElementById('victorySubmitStatus').textContent = t('victory_submit_success');
      document.getElementById('victorySubmitStatus').style.color = 'var(--green)';
      btn.textContent = '✓';
      sfx('total');
    } else {
      throw new Error('Failed');
    }
  } catch (e) {
    document.getElementById('victorySubmitStatus').textContent = t('victory_submit_error');
    document.getElementById('victorySubmitStatus').style.color = 'var(--red)';
    btn.disabled = false;
    btn.textContent = t('victory_submit');
  }
}

function continueInfinity() {
  G.infinityMode = true;
  VidaGame.enterPreBet(G);
  updateBackground();
  showScreen('gameScreen');
  renderAll();
}

// ─────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────
let currentLbTab = 'all';

async function showLeaderboardScreen() {
  currentLbTab = 'all';
  showScreen('leaderboardScreen');
  document.getElementById('lbSubtitle').textContent = lang==='ko'?'라운드 순위':'Top Players by Round';
  document.querySelectorAll('.lb-tab').forEach(t=>t.classList.toggle('active',t.dataset.diff==='all'));
  await loadLeaderboard();
}

function switchLbTab(diff) {
  currentLbTab = diff;
  document.querySelectorAll('.lb-tab').forEach(t=>t.classList.toggle('active',t.dataset.diff===diff));
  loadLeaderboard();
}

async function loadLeaderboard() {
  const list = document.getElementById('leaderboardList');
  list.innerHTML = `<div class="lb-empty">${t('lb_loading')}</div>`;

  try {
    let url = '/api/leaderboard';
    const params = [];
    if (currentLbTab !== 'all') {
      if (currentLbTab === 'infinity') {
        params.push('mode=infinity');
      } else {
        params.push(`difficulty=${currentLbTab}`);
      }
    }
    if (params.length) url += '?' + params.join('&');

    const res = await fetch(url);
    const data = await res.json();
    list.innerHTML = '';

    // Handle both object (grouped) and array responses
    let entries;
    if (Array.isArray(data)) {
      entries = data;
    } else if (typeof data === 'object' && data !== null) {
      // Grouped by difficulty
      const diffs = ['insane','hard','normal','easy'];
      for (const diff of diffs) {
        const diffEntries = data[diff];
        if (!diffEntries || !diffEntries.length) continue;
        const diffColors = {easy:'#3dba6f',normal:'var(--gold-light)',hard:'#ff9860',insane:'#ff6060'};
        const diffColor = diffColors[diff]||'var(--text-muted)';
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'lb-section-title';
        sectionTitle.style.color = diffColor;
        sectionTitle.textContent = diff.toUpperCase();
        list.appendChild(sectionTitle);
        diffEntries.forEach((entry, i) => {
          list.appendChild(createLbRow(entry, i));
        });
      }
      return;
    }

    if (!entries.length) {
      list.innerHTML = `<div class="lb-empty">${t('lb_empty')}</div>`;
      return;
    }

    entries.forEach((entry, i) => {
      list.appendChild(createLbRow(entry, i));
    });
  } catch (e) {
    list.innerHTML = `<div class="lb-empty">${t('lb_error')}</div>`;
  }
}

function createLbRow(entry, i) {
  const row = document.createElement('div');
  row.className = 'lb-row';
  const rankClass = i===0?'gold':i===1?'silver':i===2?'bronze':'';
  const rankIcon = i===0?'👑':i===1?'🥈':i===2?'🥉':`${i+1}`;
  const date = new Date(entry.createdAt).toLocaleDateString(lang==='ko'?'ko-KR':'en-US',{month:'short',day:'numeric'});
  const lifeStr = entry.life != null ? ` · ${entry.life}♥` : '';
  const modeStr = entry.mode === 'infinity' ? ' ∞' : '';
  row.innerHTML = `
    <div class="lb-rank ${rankClass}">${rankIcon}</div>
    <div class="lb-info">
      <div class="lb-name">${entry.nickname}</div>
      <div class="lb-meta">${date}${lifeStr}${modeStr}</div>
    </div>
    <div class="lb-round">Rd.${entry.round}</div>
  `;
  return row;
}

function showTitle() {
  G = null;
  isAnimating = false;
  scoreSubmitted = false;
  victoryScoreSubmitted = false;
  document.getElementById('shopModal')?.classList.add('hidden');
  document.getElementById('cardTargetModal')?.classList.add('hidden');
  document.getElementById('passiveSelectionModal')?.classList.add('hidden');
  document.getElementById('itemSelectionModal')?.classList.add('hidden');
  const mbw = document.getElementById('multBreakdownWrap');
  if (mbw) mbw.innerHTML = '';
  const mtd = document.getElementById('multTotalDisplay');
  if (mtd) mtd.classList.remove('visible');
  resetBackground();
  showScreen('titleScreen');
  applyLang();
  updateInfinityButton();
}

// ─────────────────────────────────────────────
// LANGUAGE
// ─────────────────────────────────────────────
function setLang(l) {
  lang=l;
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('selected',b.dataset.lang===l));
  applyLang();
  if (G) renderAll();
}
function applyLang() {
  document.getElementById('titleSub').textContent        =t('title_sub');
  document.getElementById('diffChooseLabel').textContent =t('choose_difficulty');
  document.getElementById('btnStartGame').textContent    =t('btn_start');
  const infBtn = document.getElementById('btnInfinity');
  if (infBtn) infBtn.textContent = t('btn_infinity');
  ['easy','normal','hard','insane'].forEach(d=>{
    const btn=document.querySelector(`.diff-btn[data-diff="${d}"]`);
    if (btn) {
      btn.querySelector('.diff-label').textContent=t('diff_'+d);
      btn.querySelector('.diff-desc').textContent =t('diff_'+d+'_desc');
    }
  });
}

// ─────────────────────────────────────────────
// RENDER — MASTER
// ─────────────────────────────────────────────
function renderAll() {
  renderStats();
  renderPreBetSection();
  renderField();
  renderHand();
  renderHandResult();
  renderButtons();
  renderPassiveChips();
  renderItemSlot();
  renderExtraItemSlot();
  renderGameLog();
}

function renderStats() {
  const displayLife = G.life;
  document.getElementById('lifeDisplay').textContent  =displayLife.toFixed(1);
  document.getElementById('roundDisplay').textContent =G.round;
  document.getElementById('roundCostDisplay').textContent=`−${G.roundCost}`;
  document.getElementById('hudLifeLabel').textContent  =t('hud_life');
  document.getElementById('hudRoundLabel').textContent =t('hud_round');
  document.getElementById('hudCostLabel').textContent  =t('hud_cost_label');
  const pct=Math.min(100,(displayLife/G.maxLife)*100);
  document.getElementById('lifeBarFill').style.width=pct+'%';
  document.getElementById('lifeBarText').textContent=`${displayLife.toFixed(1)} / ${G.maxLife}`;

  // Bet held indicator
  const lifeBarWrap = document.querySelector('.life-bar-wrap');
  if (lifeBarWrap) {
    let betHeldEl = document.getElementById('betHeldIndicator');
    if (G.phase === 'betting' && G.betHeld > 0) {
      if (!betHeldEl) {
        betHeldEl = document.createElement('div');
        betHeldEl.id = 'betHeldIndicator';
        betHeldEl.style.cssText = 'font-size:.68rem;color:var(--gold-light);margin-top:.15rem;';
        lifeBarWrap.appendChild(betHeldEl);
      }
      betHeldEl.textContent = `🎰 ${t('bet_held_label')}: ${G.betHeld.toFixed(1)}♥`;
    } else if (betHeldEl) {
      betHeldEl.remove();
    }
  }
}

function renderPreBetBar() {
  if (!G) return;
  const preset=VidaGame.DIFFICULTY_PRESETS[G.settings.difficulty];
  const passive=VidaGame.getPassiveEffect(G.passives);
  const baseBet=+(preset.baseBet+(passive.betBonus||0)).toFixed(2);
  const maxBet=G.life;
  const minBet=Math.min(baseBet, maxBet);

  const preBetDisplay = document.getElementById('preBetAmountDisplay');
  if (preBetDisplay) preBetDisplay.textContent=G.betAmount.toFixed(1)+'♥';

  const pct=maxBet>0?Math.min(100,((G.betAmount-minBet)/(maxBet-minBet||1))*100):0;
  const fill=document.getElementById('preBetBarFill');
  if (fill) fill.style.width=pct+'%';
}

function renderPreBetSection() {
  const section = document.getElementById('preBetSection');
  if (!section) return;
  if (G.phase==='preBet') {
    section.style.display='';
    document.getElementById('preBetTitle').textContent=t('prebet_title');
    document.getElementById('preBetInfo').textContent=t('prebet_info');
    document.getElementById('btnDeal').textContent=t('btn_deal') || '🃏 Deal Cards';
    renderPreBetBar();
  } else {
    section.style.display='none';
  }
}

function renderField() {
  const el=document.getElementById('fieldCards');
  if (!el) return;
  document.getElementById('fieldSectionTitle').textContent=t('hud_field');
  el.innerHTML='';
  for (let i=0;i<5;i++) {
    if (i<G.revealedCount && G.fieldCards[i]) {
      el.appendChild(makeCardEl(G.fieldCards[i]));
    } else {
      el.appendChild(makeHiddenCard());
    }
  }
  document.getElementById('fieldSection').style.display = G.phase==='preBet'?'none':'';
}

function renderHand() {
  const el=document.getElementById('handCards');
  if (!el) return;
  document.getElementById('handSectionTitle').textContent=t('hud_hand');
  el.innerHTML='';
  for (const c of G.handCards) {
    el.appendChild(makeCardEl(c));
  }
  document.getElementById('handSection').style.display = G.phase==='preBet'?'none':'';
}

function renderHandResult() {
  if (G.phase!=='betting') {
    document.getElementById('handName').textContent='—';
    document.getElementById('handMult').textContent='×0';
    document.getElementById('suitBonusRow').innerHTML='';
    document.getElementById('expectedReturn').textContent='+0.00 ♥';
    document.getElementById('betInfo').textContent='';
    return;
  }
  const result=VidaGame.computeReturn(G);
  document.getElementById('handName').textContent=VidaGame.getHandName(result.key,lang);
  document.getElementById('handMult').textContent=`×${result.mult.toFixed(2)}`;

  const bonusRow=document.getElementById('suitBonusRow');
  bonusRow.innerHTML='';
  if (result.suitBonus.bonus>0) {
    const badge=document.createElement('span');
    badge.className=`suit-badge badge-${result.suitBonus.suit}`;
    badge.textContent=`${VidaGame.SUIT_SYMBOLS[result.suitBonus.suit]} +${result.suitBonus.bonus.toFixed(2)}`;
    bonusRow.appendChild(badge);
  }
  if (result.rankBonus>0) {
    const badge=document.createElement('span');
    badge.className='suit-badge';
    badge.style.background='rgba(255,204,102,.12)';
    badge.style.color='#ffcc66';
    badge.textContent=`#${result.rankBonus.toFixed(2)}`;
    bonusRow.appendChild(badge);
  }

  const netReturn = +(result.lifeReturn - G.roundCost).toFixed(2);
  document.getElementById('expectedReturnLabel').textContent=t('hud_expected');
  const retEl = document.getElementById('expectedReturn');
  retEl.textContent=`${netReturn>=0?'+':''}${netReturn} ♥`;
  retEl.style.color = netReturn>=0?'var(--green)':'var(--red)';

  document.getElementById('betInfo').textContent=`${t('bet_held_label')}: ${G.betHeld.toFixed(1)}♥ | ${t('drain_label')}: ${G.roundCost}♥`;
}

function renderButtons() {
  const isBetting = G.phase==='betting';
  const isPreBet = G.phase==='preBet';

  document.getElementById('btnReveal').style.display = isBetting && G.revealedCount<5 ? '' : 'none';
  document.getElementById('btnReveal').textContent = t('btn_reveal');
  document.getElementById('btnSettle').style.display = isBetting ? '' : 'none';
  document.getElementById('btnSettle').textContent = t('btn_settle');
  document.getElementById('btnFold').style.display = isBetting ? '' : 'none';
  document.getElementById('btnFold').textContent = t('btn_fold');
  document.getElementById('btnItem').style.display = isBetting && G.heldItem && !G.itemUsedThisRound ? '' : 'none';
  document.getElementById('btnItem').textContent = t('btn_item');
  document.getElementById('btnExtraItem').style.display = isBetting && G.extraItemSlot && !G.extraItemUsedThisRound ? '' : 'none';
  document.getElementById('btnExtraItem').textContent = t('btn_extra_item');

  // Phase info
  const phaseEl = document.getElementById('phaseInfo');
  if (isPreBet) phaseEl.textContent = t('phase_prebet',G.round);
  else if (isBetting) phaseEl.textContent = t('phase_betting',G.round,G.revealedCount);
  else phaseEl.textContent = '—';

  document.getElementById('actionSection').style.display = (isBetting||isPreBet) ? '' : 'none';
}

function renderPassiveChips() {
  document.getElementById('passivesLabel').textContent=t('hud_passives');
  const wrap=document.getElementById('passiveChips');
  wrap.innerHTML='';
  for (const [id,lv] of Object.entries(G.passives)) {
    if (!lv) continue;
    const def=VidaGame.getPassiveDef(id);
    if (!def) continue;
    const chip=document.createElement('span');
    chip.className='item-chip passive';
    const name=def.nameI18n[lang]||def.nameI18n.en;
    chip.textContent=`${name} ${t('lv_label')}${lv}`;
    wrap.appendChild(chip);
  }
}

function renderItemSlot() {
  const box=document.getElementById('itemSlotBox');
  if (!box) return;
  box.querySelector('.item-slot-label')?.remove();
  box.querySelector('.item-slot-name')?.remove();
  box.querySelector('.item-slot-desc')?.remove();

  if (G.heldItem) {
    const def=VidaGame.getItemDef(G.heldItem);
    const name=def?(def.nameI18n[lang]||def.nameI18n.en):G.heldItem;
    const desc=def?(def.descI18n[lang]||def.descI18n.en):'';
    box.innerHTML=`
      <div class="item-slot-label">${t('item_slot_label')}</div>
      <div class="item-slot-name">${name}${G.itemUsedThisRound?' ✓':''}</div>
      <div class="item-slot-desc">${desc}</div>
    `;
    box.style.display='';
  } else {
    box.innerHTML=`
      <div class="item-slot-label">${t('item_slot_label')}</div>
      <div class="item-slot-name" style="color:var(--text-muted);">${t('item_none')}</div>
    `;
    box.style.display='';
  }
}

function renderExtraItemSlot() {
  const box=document.getElementById('extraSlotBox');
  if (!box) return;

  if (G.extraItemSlot) {
    const def=VidaGame.getItemDef(G.extraItemSlot);
    const name=def?(def.nameI18n[lang]||def.nameI18n.en):G.extraItemSlot;
    const desc=def?(def.descI18n[lang]||def.descI18n.en):'';
    box.innerHTML=`
      <div class="extra-slot-label">${t('extra_slot_label')}</div>
      <div class="extra-slot-name">${name}${G.extraItemUsedThisRound?' ✓':''}</div>
      <div class="item-slot-desc" style="color:var(--text-muted);margin-top:.2rem;line-height:1.35;">${desc}</div>
    `;
    box.style.display='';
  } else {
    box.style.display='none';
  }
}

function renderGameLog() {
  const el=document.getElementById('gameLog');
  if (!el) return;
  el.innerHTML='';
  for (const msg of (G.logs||[]).slice(0,8)) {
    const div=document.createElement('div');
    div.textContent=msg;
    el.appendChild(div);
  }
}

// ─────────────────────────────────────────────
// CARD RENDERING
// ─────────────────────────────────────────────
function makeCardEl(c) {
  const el=document.createElement('div');
  el.className=`card card-face suit-${c.suit}`;
  el.innerHTML=`
    <div class="card-corner"><span class="cr">${c.rank}</span><span class="cs">${VidaGame.SUIT_SYMBOLS[c.suit]}</span></div>
    <span class="card-rank">${c.rank}</span>
    <span class="card-suit">${VidaGame.SUIT_SYMBOLS[c.suit]}</span>
    <div class="card-corner-br"><span class="cr">${c.rank}</span><span class="cs">${VidaGame.SUIT_SYMBOLS[c.suit]}</span></div>
  `;
  return el;
}

function makeHiddenCard() {
  const el=document.createElement('div');
  el.className='card card-hidden';
  return el;
}

// ─────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────
function notify(msg, cls='notif-gold') {
  const wrap=document.getElementById('notifications');
  const el=document.createElement('div');
  el.className=`notif ${cls}`;
  el.textContent=msg;
  wrap.appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  // Stars
  const starsEl=document.getElementById('stars');
  for (let i=0;i<60;i++) {
    const s=document.createElement('div');
    s.className='star';
    s.style.left=Math.random()*100+'%';
    s.style.top=Math.random()*100+'%';
    s.style.setProperty('--d',(2+Math.random()*4)+'s');
    s.style.setProperty('--delay',Math.random()*3+'s');
    s.style.setProperty('--op',(0.2+Math.random()*0.5).toString());
    starsEl.appendChild(s);
  }
  applyLang();
  updateInfinityButton();
});
