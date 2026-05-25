/**
 * VIDA POKER — main.js  v3
 * All DOM / rendering / animation / sound. No game logic.
 *
 * v3 changes:
 *  - No result modal; multiplier breakdown shown as floating text during animation
 *  - Large "×N" total multiplier display after breakdown
 *  - Screen shake on settle/fold
 *  - preBet phase: bet before seeing cards
 *  - After animation + multiplier display, auto-transition to shop
 */

// ─────────────────────────────────────────────
// I18N
// ─────────────────────────────────────────────
const UI_STRINGS = {
  en: {
    title_sub:'ROGUELITE POKER',
    choose_difficulty:'Choose Difficulty',
    diff_easy:'EASY', diff_normal:'NORMAL', diff_hard:'HARD', diff_insane:'INSANE',
    diff_easy_desc:'High drain · Moderate scaling',
    diff_normal_desc:'Recommended',
    diff_hard_desc:'Steep scaling · Punishing reveals',
    diff_insane_desc:'Survive if you can',
    btn_start:'▶  START GAME',
    hud_life:'LIFE', hud_round:'ROUND', hud_points:'POINTS', hud_cost_label:'Drain',
    hud_field:'⬡  Field Cards', hud_hand:'✦  Your Hand',
    hud_expected:'Expected return', hud_passives:'Passives:',
    btn_reveal:'▶ Reveal Card',
    btn_settle:'Settle',
    btn_fold:'Fold',
    btn_item:'🎴 Item',
    btn_bet_minus:'−',
    phase_prebet:(round)=>`Round ${round} — Place your bet`,
    phase_betting:(round,revealed)=>
      `Round ${round} — ${revealed}/5 revealed`,
    phase_processing:'Processing…',
    result_profit:'🎉 Profit!', result_loss:'📉 Loss', result_fold:'🏳 Fold',
    result_life_now:(l)=>`Life: ${l}♥`,
    btn_next_shop:'Next: Passive Shop →',
    shop_title:'⚗  Passive Shop', shop_points:'Points',
    shop_subtitle:'Spend points to upgrade passives',
    shop_cost:'Cost', shop_max:'MAX', shop_level:'Lv',
    btn_shop_done:'Done → Next Round',
    btn_deal:'🃏 Deal Cards',
    prebet_title:'Place Your Bet',
    prebet_info:'Set your wager before the cards are dealt.',
    prebet_locked:'Bet locked: ♥',
    item_title:'🎴 Use Item', item_subtitle:'Select target card',
    item_no_target:'Using…', btn_cancel:'Cancel',
    item_held:'Held Item', item_none:'No item',
    item_next:(r)=>`Next item: Round ${r}`,
    go_title:'GAME OVER', go_sub:'Life depleted',
    go_final_round:'Final Round', go_points:'Total Points', btn_home:'Back to Title',
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
    notif_passive_up:(n)=>`${n} upgraded!`,
    notif_pts:(n)=>`+${n}P`,
    notif_reveal_pen:(c)=>`Drain now ${c}♥`,
    notif_item_used:'Item used!',
    mult_hand:(name)=>`${name}`,
    mult_suit:(sym)=>`${sym} 보너스`,
    mult_rank:'숫자 보너스',
    mult_alchemy:'연금술사',
    mult_highroller:'하이 롤러',
  },
  ko: {
    title_sub:'로그라이트 포커',
    choose_difficulty:'난이도 선택',
    diff_easy:'EASY', diff_normal:'NORMAL', diff_hard:'HARD', diff_insane:'INSANE',
    diff_easy_desc:'높은 기본 차감 · 완만한 증가',
    diff_normal_desc:'추천',
    diff_hard_desc:'빠른 증가 · 공개 페널티 강화',
    diff_insane_desc:'살아남을 수 있다면',
    btn_start:'▶  게임 시작',
    hud_life:'라이프', hud_round:'라운드', hud_points:'포인트', hud_cost_label:'차감',
    hud_field:'⬡  필드 카드', hud_hand:'✦  내 패',
    hud_expected:'예상 수익', hud_passives:'패시브:',
    btn_reveal:'▶ 카드 공개',
    btn_settle:'정산하기',
    btn_fold:'폴드',
    btn_item:'🎴 아이템',
    btn_bet_minus:'−',
    phase_prebet:(round)=>`라운드 ${round} — 베팅하세요`,
    phase_betting:(round,revealed)=>
      `라운드 ${round} — 필드 ${revealed}/5 공개`,
    phase_processing:'처리 중…',
    result_profit:'🎉 수익!', result_loss:'📉 손실', result_fold:'🏳 폴드',
    result_life_now:(l)=>`라이프: ${l}♥`,
    btn_next_shop:'다음: 패시브 상점 →',
    shop_title:'⚗  패시브 상점', shop_points:'포인트',
    shop_subtitle:'포인트로 패시브를 업그레이드하세요',
    shop_cost:'비용', shop_max:'MAX', shop_level:'Lv',
    btn_shop_done:'완료 → 다음 라운드',
    btn_deal:'🃏 카드 배분',
    prebet_title:'베팅하세요',
    prebet_info:'카드가 배분되기 전에 베팅액을 설정하세요.',
    prebet_locked:'베팅 확정: ♥',
    item_title:'🎴 아이템 사용', item_subtitle:'대상 카드를 선택하세요',
    item_no_target:'사용 중…', btn_cancel:'취소',
    item_held:'보유 아이템', item_none:'아이템 없음',
    item_next:(r)=>`다음 아이템: ${r}라운드`,
    go_title:'GAME OVER', go_sub:'생명이 다했습니다',
    go_final_round:'최종 라운드', go_points:'획득 포인트', btn_home:'처음으로',
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
    notif_passive_up:(n)=>`${n} 업그레이드!`,
    notif_pts:(n)=>`+${n}P`,
    notif_reveal_pen:(c)=>`차감량: ${c}♥`,
    notif_item_used:'아이템 사용!',
    mult_hand:(name)=>`${name}`,
    mult_suit:(sym)=>`${sym} 보너스`,
    mult_rank:'숫자 보너스',
    mult_alchemy:'연금술사',
    mult_highroller:'하이 롤러',
  },
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let G    = null;
let lang = 'en';
let selectedDifficulty = 'normal';
let pendingItemAction  = null;
let isAnimating = false;

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
  // Force reflow
  void el.offsetWidth;
  el.classList.add(heavy ? 'shaking-heavy' : 'shaking');
  setTimeout(()=>el.classList.remove('shaking','shaking-heavy'), heavy ? 700 : 550);
}

// ─────────────────────────────────────────────
// DIFFICULTY / START
// ─────────────────────────────────────────────
function selectDifficulty(diff) {
  selectedDifficulty=diff;
  document.querySelectorAll('.diff-btn').forEach(b=>b.classList.toggle('selected',b.dataset.diff===diff));
}
function startGame() {
  G=VidaGame.initGame({difficulty:selectedDifficulty, lang});
  VidaGame.enterPreBet(G);
  showScreen('gameScreen');
  renderAll();
}

// ─────────────────────────────────────────────
// PRE-BET
// ─────────────────────────────────────────────
function confirmBetAndDeal() {
  if (!G||G.phase!=='preBet') return;
  if (!VidaGame.confirmBetAndDeal(G)) return;
  sfx('reveal');
  sfx('reveal');
  renderAll();
  // Animate initial card reveals
  setTimeout(()=>animateRevealCard(0), 100);
  setTimeout(()=>animateRevealCard(1), 250);
  setTimeout(()=>animateRevealCard(0), 100); // hand cards
  setTimeout(()=>animateRevealCard(1), 200);
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
// BETTING (adjust bet — only during preBet)
// ─────────────────────────────────────────────
function adjustBet(mode) {
  if (!G) return;
  VidaGame.adjustBet(G, mode);
  renderPreBetBar();
}

// ─────────────────────────────────────────────
// SETTLE (placeBet)
// ─────────────────────────────────────────────
function settle() {
  if (!G||G.phase!=='betting'||isAnimating) return;

  // 1. Compute result before mutating
  const preview = VidaGame.computeReturn(G);

  // 2. Run animation sequence, THEN apply result
  isAnimating = true;
  runHandAnimation(preview, ()=>{
    const result = VidaGame.placeBet(G);
    renderAll();

    // Screen shake
    const isHeavy = ['epic','legendary'].includes(result.rarity);
    screenShake(isHeavy);

    // Show multiplier breakdown + total
    showMultiplierBreakdown(result, ()=>{
      // Animate life change
      const prev=+(G.life-result.netGain).toFixed(2);
      animateLifeChange(prev, G.life);

      isAnimating = false;

      // After delay, go to shop
      setTimeout(()=>{
        if (VidaGame.isGameOver(G)) { showGameOver(); return; }
        const pts=VidaGame.advanceRound(G);
        notify(t('notif_pts',pts),'notif-gold');
        sfx('shop');
        openShop();
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
    const fi = idx - G.handCards.length;
    return fieldEls[fi];
  }

  const isSequential = (preview.key==='straight'||preview.key==='straightFlush');

  sfx('hand_reveal', rarity);

  // Step 1: dim non-contributing cards
  allCardEls.forEach(el=>{ el.style.opacity='0.3'; el.style.transition='opacity 0.3s'; });
  indices.forEach(i=>{ const el=getEl(i); if(el){ el.style.opacity='1'; } });

  // Step 2: highlight contributing cards
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

  // Step 3: rarity flash overlay
  const totalDelay = isSequential ? indices.length*delay : 200;
  setTimeout(()=>{
    const overlay=document.getElementById('handFlashOverlay');
    if (overlay) {
      overlay.style.background=`radial-gradient(ellipse at center, ${color}33 0%, transparent 70%)`;
      overlay.style.opacity='1';
      setTimeout(()=>{ overlay.style.opacity='0'; }, 400);
    }
  }, totalDelay+80);

  // Step 4: show hand label badge
  setTimeout(()=>{
    showHandBadge(preview.key, rarity, color);
  }, totalDelay+120);

  // Step 5: reset cards and call done
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
  badge.style.transform='translateY(0) scale(1)';
  badge.style.transition='opacity 0.3s, transform 0.3s';
  setTimeout(()=>{ badge.style.opacity='0'; badge.style.transform='translateY(-16px) scale(0.9)'; }, 750);
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
    // For fold, just show a quick message
    totalEl.textContent = '×0';
    totalEl.querySelector('.mult-label')?.remove();
    const label = document.createElement('span');
    label.className = 'mult-label';
    label.textContent = t('result_fold');
    totalEl.appendChild(label);
    totalEl.classList.add('visible');
    sfx('fold');
    setTimeout(()=>{
      totalEl.classList.remove('visible');
      if (onDone) onDone();
    }, 1000);
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

  // After all breakdown items, show the total
  setTimeout(()=>{
    totalEl.textContent = `×${result.mult.toFixed(2)}`;
    totalEl.querySelector('.mult-label')?.remove();
    const label = document.createElement('span');
    label.className = 'mult-label';
    const netStr = result.netGain >= 0 ? `+${result.netGain.toFixed(1)}` : result.netGain.toFixed(1);
    label.textContent = `${netStr}♥`;
    totalEl.appendChild(label);
    totalEl.classList.add('visible');
    sfx('total');

    // Screen shake for big multipliers
    if (result.mult >= 3.0) screenShake(true);
    else if (result.mult >= 1.5) screenShake(false);
  }, delay + 200);

  // Hide everything and call onDone
  const totalDuration = delay + 200 + 1800;
  setTimeout(()=>{
    wrap.innerHTML = '';
    totalEl.classList.remove('visible');
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

  // Show fold multiplier display (×0)
  showMultiplierBreakdown(result, ()=>{
    animateLifeChange(prev, G.life);
    isAnimating = false;

    setTimeout(()=>{
      if (VidaGame.isGameOver(G)) { showGameOver(); return; }
      const pts=VidaGame.advanceRound(G);
      notify(t('notif_pts',pts),'notif-gold');
      sfx('shop');
      openShop();
    }, 800);
  });
}

// ─────────────────────────────────────────────
// SHOP
// ─────────────────────────────────────────────
function openShop() { renderShop(); document.getElementById('shopModal').classList.remove('hidden'); }

function renderShop() {
  document.getElementById('shopPointsVal').textContent = G.totalPoints;
  document.getElementById('shopTitle').textContent     = t('shop_title');
  document.getElementById('shopSubtitle').textContent  = t('shop_subtitle');
  document.getElementById('btnShopDone').textContent   = t('btn_shop_done');
  const grid=document.getElementById('passiveGrid');
  grid.innerHTML='';
  for (const def of VidaGame.PASSIVE_DEFS) {
    const lv=G.passives[def.id]||0;
    const isMaxed=lv>=def.maxLv;
    const cost=isMaxed?null:def.costs[lv];
    const canBuy=!isMaxed&&G.totalPoints>=cost;
    const card=document.createElement('div');
    card.className='passive-card'+(lv>0?' owned':'')+(isMaxed?' maxed':'')+(canBuy?' buyable':'');
    const dots=Array.from({length:def.maxLv},(_,i)=>`<span class="pl-dot ${i<lv?'filled':''}"></span>`).join('');
    const name=def.nameI18n[lang]||def.nameI18n.en;
    const descArr=def.descI18n[lang]||def.descI18n.en;
    const desc=descArr[Math.max(0,lv-1)]||descArr[0];
    card.innerHTML=`
      <div class="passive-name">${name}</div>
      <div class="passive-desc">${desc}</div>
      ${!isMaxed?`<div class="passive-cost">${t('shop_cost')}: ${cost}P`
               +`<span class="next-level-preview"> → ${descArr[lv]||''}</span></div>`
               :`<div class="passive-cost" style="color:var(--purple);">${t('shop_max')}</div>`}
      <div class="passive-level">${dots}</div>`;
    if (canBuy) {
      card.onclick=()=>{
        const res=VidaGame.buyPassive(G,def.id);
        if (res.ok) { sfx('item'); notify(t('notif_passive_up',name),'notif-gold'); renderShop(); }
      };
    }
    grid.appendChild(card);
  }
}

function closeShop() {
  document.getElementById('shopModal').classList.add('hidden');
  VidaGame.enterPreBet(G);
  renderAll();
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
  document.getElementById('goTitle').textContent      =t('go_title');
  document.getElementById('goSub').textContent        =t('go_sub');
  document.getElementById('goFinalRoundLabel').textContent=t('go_final_round');
  document.getElementById('goPointsLabel').textContent    =t('go_points');
  document.getElementById('finalRound').textContent   =G.round;
  document.getElementById('finalPoints').textContent  =G.totalPoints;
  document.getElementById('btnHome').textContent      =t('btn_home');
  showScreen('gameOverScreen');
}

function showTitle() { showScreen('titleScreen'); applyLang(); }

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
  renderGameLog();
}

function renderStats() {
  document.getElementById('lifeDisplay').textContent  =G.life.toFixed(1);
  document.getElementById('roundDisplay').textContent =G.round;
  document.getElementById('pointDisplay').textContent =G.totalPoints;
  document.getElementById('roundCostDisplay').textContent=`−${G.roundCost}`;
  document.getElementById('hudLifeLabel').textContent  =t('hud_life');
  document.getElementById('hudRoundLabel').textContent =t('hud_round');
  document.getElementById('hudPointsLabel').textContent=t('hud_points');
  document.getElementById('hudCostLabel').textContent  =t('hud_cost_label');
  const pct=Math.min(100,(G.life/G.maxLife)*100);
  document.getElementById('lifeBarFill').style.width=pct+'%';
  document.getElementById('lifeBarText').textContent=`${G.life.toFixed(1)} / ${G.maxLife}`;
}

function renderPreBetBar() {
  if (!G) return;
  const preset=VidaGame.DIFFICULTY_PRESETS[G.settings.difficulty];
  const passive=VidaGame.getPassiveEffect(G.passives);
  const minBet=+(preset.baseBet+(passive.betBonus||0)).toFixed(2);
  const maxBet=G.life;

  // Update preBet section display
  const preBetDisplay = document.getElementById('preBetAmountDisplay');
  if (preBetDisplay) preBetDisplay.textContent=G.betAmount.toFixed(1)+'♥';

  const pct=maxBet>0?Math.min(100,((G.betAmount-minBet)/(maxBet-minBet||1))*100):0;
  const fill=document.getElementById('preBetBarFill');
  if (fill) fill.style.width=pct+'%';
}

function renderPreBetSection() {
  const preBetSection = document.getElementById('preBetSection');
  const fieldSection  = document.getElementById('fieldSection');
  const handSection   = document.getElementById('handSection');
  const actionSection = document.getElementById('actionSection');

  if (G.phase === 'preBet') {
    preBetSection.style.display = 'block';
    fieldSection.style.display  = 'none';
    handSection.style.display   = 'none';
    actionSection.style.display = 'none';

    document.getElementById('preBetTitle').textContent = t('prebet_title');
    document.getElementById('preBetInfo').textContent  = t('prebet_info');
    document.getElementById('btnDeal').textContent     = t('btn_deal');
    renderPreBetBar();
  } else {
    preBetSection.style.display = 'none';
    fieldSection.style.display  = 'block';
    handSection.style.display   = 'flex';
    actionSection.style.display = 'block';
  }
}

function renderField() {
  if (G.phase === 'preBet') return;
  document.getElementById('fieldSectionTitle').textContent=t('hud_field');
  const row=document.getElementById('fieldCards');
  row.innerHTML='';
  for (let i=0;i<5;i++) {
    if (i<G.revealedCount) row.appendChild(makeCardEl(G.fieldCards[i]));
    else { const s=document.createElement('div'); s.className='card card-hidden'; row.appendChild(s); }
  }
}

function renderHand() {
  if (G.phase === 'preBet') return;
  document.getElementById('handSectionTitle').textContent=t('hud_hand');
  const row=document.getElementById('handCards');
  row.innerHTML='';
  const result=VidaGame.computeReturn(G);
  const handKeys=new Set((result.handCards||[]).map(c=>`${c.rank}-${c.suit}`));
  for (const c of G.handCards) {
    const el=makeCardEl(c);
    if (handKeys.has(`${c.rank}-${c.suit}`)) el.classList.add('used-in-hand');
    row.appendChild(el);
  }
}

function renderHandResult() {
  if (G.phase === 'preBet') return;
  const result=VidaGame.computeReturn(G);
  const SUIT_SYMBOLS=VidaGame.SUIT_SYMBOLS;
  document.getElementById('handName').textContent=VidaGame.getHandName(result.key,lang);
  document.getElementById('handMult').textContent='×'+result.mult.toFixed(2);
  document.getElementById('expectedReturnLabel').textContent=t('hud_expected');
  document.getElementById('expectedReturn').textContent=`+${result.lifeReturn.toFixed(2)} ♥`;
  document.getElementById('betInfo').textContent=`♥${G.betAmount.toFixed(1)} × ×${result.mult.toFixed(2)}`;
  const sb=result.suitBonus;
  const sbRow=document.getElementById('suitBonusRow');
  sbRow.innerHTML='';
  if (sb?.suit) {
    const badge=document.createElement('span');
    badge.className=`suit-badge badge-${sb.suit}`;
    badge.textContent=`${SUIT_SYMBOLS[sb.suit]} ×${sb.count}`;
    sbRow.appendChild(badge);
    const txt=document.createElement('span');
    txt.textContent=`+${sb.bonus.toFixed(3)}`;
    sbRow.appendChild(txt);
  }
  // Show rank bonus
  if (result.rankBonus > 0) {
    const rbBadge = document.createElement('span');
    rbBadge.className = 'suit-badge';
    rbBadge.style.background = 'rgba(255,204,102,.12)';
    rbBadge.style.color = '#ffcc66';
    rbBadge.textContent = `#+${result.rankBonus.toFixed(3)}`;
    sbRow.appendChild(rbBadge);
  }
}

function renderButtons() {
  const inPlay=G.phase==='betting';
  const btnReveal=document.getElementById('btnReveal');
  const btnSettle=document.getElementById('btnSettle');
  const btnFold  =document.getElementById('btnFold');
  const btnItem  =document.getElementById('btnItem');

  btnReveal.style.display=(inPlay&&G.revealedCount<5)?'flex':'none';
  btnSettle.style.display=inPlay?'flex':'none';
  btnFold.style.display  =inPlay?'flex':'none';
  btnItem.style.display  =(inPlay&&G.heldItem&&!G.itemUsedThisRound)?'flex':'none';

  btnReveal.textContent=t('btn_reveal');
  btnSettle.textContent=t('btn_settle');
  btnFold.textContent  =t('btn_fold');
  btnItem.textContent  =t('btn_item');

  document.getElementById('phaseInfo').textContent=
    G.phase==='preBet' ? t('phase_prebet',G.round) :
    inPlay ? t('phase_betting',G.round,G.revealedCount) :
    t('phase_processing');
}

function renderPassiveChips() {
  document.getElementById('passivesLabel').textContent=t('hud_passives');
  const wrap=document.getElementById('passiveChips');
  wrap.innerHTML='';
  for (const [id,lv] of Object.entries(G.passives)) {
    if (!lv) continue;
    const def=VidaGame.getPassiveDef(id);
    if (!def) continue;
    const name=def.nameI18n[lang]||def.nameI18n.en;
    const chip=document.createElement('span');
    chip.className='item-chip passive';
    chip.textContent=`${name} ${t('shop_level')}${lv}`;
    chip.title=(def.descI18n[lang]||def.descI18n.en)[lv-1];
    wrap.appendChild(chip);
  }
}

function renderItemSlot() {
  const slot=document.getElementById('itemSlotBox');
  if (!slot) return;
  const def=G.heldItem?VidaGame.getItemDef(G.heldItem):null;
  const name=def?(def.nameI18n[lang]||def.nameI18n.en):t('item_none');
  const desc=def?(def.descI18n[lang]||def.descI18n.en):'';
  const used=G.itemUsedThisRound;
  slot.innerHTML=`
    <div class="item-slot-label">${t('item_held')}</div>
    <div class="item-slot-name" style="opacity:${used?0.4:1}">${name}</div>
    ${desc?`<div class="item-slot-desc" style="opacity:${used?0.35:1}">${desc}</div>`:''}
    ${!G.heldItem?`<div class="item-slot-next">${t('item_next',G.nextItemAtRound)}</div>`:''}
  `;
}

function renderGameLog() {
  const box=document.getElementById('gameLog');
  if (!box) return;
  box.innerHTML = G.logs.slice(0,5).map(l=>`<div>${l}</div>`).join('');
}

// ─────────────────────────────────────────────
// CARD FACTORY
// ─────────────────────────────────────────────
const SUIT_SYMBOLS_UI=VidaGame.SUIT_SYMBOLS;
function makeCardEl(card) {
  const el=document.createElement('div');
  const sym=SUIT_SYMBOLS_UI[card.suit];
  el.className=`card card-face suit-${card.suit}`;
  el.innerHTML=`
    <div class="card-corner"><span class="cr">${card.rank}</span><span class="cs">${sym}</span></div>
    <div class="card-rank">${card.rank}</div>
    <div class="card-suit">${sym}</div>
    <div class="card-corner-br"><span class="cr">${card.rank}</span><span class="cs">${sym}</span></div>`;
  return el;
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────
function notify(msg, cls='notif-gold') {
  const wrap=document.getElementById('notifications');
  const el=document.createElement('div');
  el.className=`notif ${cls}`;
  el.textContent=msg;
  wrap.appendChild(el);
  setTimeout(()=>el.remove(),3100);
}

// ─────────────────────────────────────────────
// STARS
// ─────────────────────────────────────────────
function initStars() {
  const wrap=document.getElementById('stars');
  for (let i=0;i<80;i++) {
    const s=document.createElement('div');
    s.className='star';
    s.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;`
      +`--d:${2+Math.random()*4}s;--delay:${-Math.random()*4}s;--op:${0.2+Math.random()*0.5}`;
    wrap.appendChild(s);
  }
}

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  initStars();
  applyLang();
  selectDifficulty('normal');
});
