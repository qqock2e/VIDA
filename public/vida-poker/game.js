/**
 * VIDA POKER — game.js  v3
 * Pure game logic. Zero DOM.
 *
 * v3 changes:
 *  - Additive multiplier system: totalMult = handMult + suitBonus + rankBonus + passiveBonuses
 *  - Starting at 0x (highCard), pair+ should give meaningful total (≥~0.8 from suit+rank)
 *  - Straight target ≈ 2.0x total (hand ~1.5 + bonuses ~0.5)
 *  - Common hands (straight, full house) have modest multipliers
 *  - Points reworked: fixed per hand type + round bonus (1-2 upgrades per round)
 *  - preBet phase: bet before seeing cards
 */

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const SUITS     = ['spade','diamond','heart','club'];
const SUIT_SYMBOLS = { spade:'♠', diamond:'♦', heart:'♥', club:'♣' };
const SUIT_ORDER   = { spade:4, diamond:3, heart:2, club:1 };
const RANKS     = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANK_VAL  = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
const BLACK_SUITS = new Set(['spade','club']);
const RED_SUITS   = new Set(['diamond','heart']);

/**
 * Suit bonus per card of best suit (additive)
 * Only counted when you have ≥2 cards of that suit in your best hand
 */
const SUIT_PER_CARD = { spade:0.08, diamond:0.06, heart:0.05, club:0.03 };

/**
 * Difficulty presets — v3
 *
 * baseBet          : base life units the player wagers each hand
 * startLife        : always 20
 * baseCostPerRound : life drained per round at round 1
 * revealPenalty    : extra drain added per field card revealed beyond the 2 free ones
 * roundCostGrowth  : how much baseCost grows each round
 * pointMult        : point multiplier (higher on harder modes)
 */
const DIFFICULTY_PRESETS = {
  easy:   { baseBet:2.0, startLife:20, baseCostPerRound:1.0, revealPenalty:0.30, roundCostGrowth:0.35, pointMult:0.8  },
  normal: { baseBet:1.8, startLife:20, baseCostPerRound:1.5, revealPenalty:0.45, roundCostGrowth:0.50, pointMult:1.0  },
  hard:   { baseBet:1.6, startLife:20, baseCostPerRound:2.0, revealPenalty:0.60, roundCostGrowth:0.70, pointMult:1.3  },
  insane: { baseBet:1.4, startLife:20, baseCostPerRound:2.8, revealPenalty:0.85, roundCostGrowth:1.00, pointMult:1.8  },
};

/**
 * Hand multipliers — v3 (ADDITIVE system, starts at 0)
 *
 * Total multiplier = handMult + suitBonus + rankBonus + passiveBonuses
 * Straight target: ~1.5 + ~0.5 bonuses ≈ 2.0x
 * Full house is common in 7-card: keep modest
 * Rare hands (4OAK+, SF, RF) can be much bigger
 */
const HAND_MULTS = {
  highCard:      0,
  onePair:       0.5,
  twoPair:       0.8,
  threeOfAKind:  1.1,
  straight:      1.5,
  flush:         1.3,
  fullHouse:     1.7,
  fourOfAKind:   3.0,
  straightFlush: 5.0,
  royalFlush:    8.0,
};

/**
 * Fixed points awarded per hand type (v3)
 * No longer scales with earned life — purely based on hand achievement
 */
const HAND_POINTS = {
  highCard:      0,
  onePair:       2,
  twoPair:       4,
  threeOfAKind:  6,
  straight:      8,
  flush:         10,
  fullHouse:     14,
  fourOfAKind:   20,
  straightFlush: 30,
  royalFlush:    50,
};

const HAND_NAMES_I18N = {
  highCard:      { en:'High Card',        ko:'하이 카드'          },
  onePair:       { en:'One Pair',         ko:'원 페어'            },
  twoPair:       { en:'Two Pair',         ko:'투 페어'            },
  threeOfAKind:  { en:'Three of a Kind',  ko:'트리플'             },
  straight:      { en:'Straight',         ko:'스트레이트'          },
  flush:         { en:'Flush',            ko:'플러시'             },
  fullHouse:     { en:'Full House',       ko:'풀 하우스'          },
  fourOfAKind:   { en:'Four of a Kind',   ko:'포 카드'            },
  straightFlush: { en:'Straight Flush',   ko:'스트레이트 플러시'   },
  royalFlush:    { en:'Royal Flush',      ko:'로열 플러시'         },
};

// Rarity tiers for hand animation
const HAND_RARITY = {
  highCard:      'common',
  onePair:       'common',
  twoPair:       'uncommon',
  threeOfAKind:  'uncommon',
  straight:      'rare',
  flush:         'rare',
  fullHouse:     'epic',
  fourOfAKind:   'epic',
  straightFlush: 'legendary',
  royalFlush:    'legendary',
};

// ─────────────────────────────────────────────
// PASSIVE DEFINITIONS  v3
// Effects adjusted for additive multiplier system
// ─────────────────────────────────────────────
const PASSIVE_DEFS = [
  {
    id:'lifeBonus', maxLv:5,
    costs:[4,7,11,16,22],
    nameI18n:  { en:'Spring of Life',  ko:'생명의 샘'   },
    descI18n:  {
      en:['Start +1 Life','Start +2 Life','Start +3 Life','Start +4 Life','Start +5 Life'],
      ko:['시작 라이프 +1','시작 라이프 +2','시작 라이프 +3','시작 라이프 +4','시작 라이프 +5'],
    },
    effect:(lv)=>({ startLifeBonus: lv }),
  },
  {
    id:'betBoost', maxLv:4,
    costs:[5,9,14,20],
    nameI18n:  { en:"Gambler's Soul",  ko:'도박사의 혼' },
    descI18n:  {
      en:['Bet mult +0.15','Bet mult +0.30','Bet mult +0.45','Bet mult +0.65'],
      ko:['베팅 배율 +0.15','베팅 배율 +0.30','베팅 배율 +0.45','베팅 배율 +0.65'],
    },
    effect:(lv)=>({ betBonus:[0,0.15,0.30,0.45,0.65][lv] }),
  },
  {
    id:'suitMaster', maxLv:3,
    costs:[6,12,20],
    nameI18n:  { en:'Suit Master',     ko:'문양의 달인' },
    descI18n:  {
      en:['Suit bonus +50%','Suit bonus +100%','Suit bonus +160%'],
      ko:['문양 보너스 +50%','문양 보너스 +100%','문양 보너스 +160%'],
    },
    effect:(lv)=>({ suitBonusMultAdd:[0,0.5,1.0,1.6][lv] }),
  },
  {
    id:'rankBonus', maxLv:3,
    costs:[5,10,17],
    nameI18n:  { en:"Noble's Hand",    ko:'귀족의 패'   },
    descI18n:  {
      en:['Rank bonus +50%','Rank bonus +100%','Rank bonus +160%'],
      ko:['숫자 보너스 +50%','숫자 보너스 +100%','숫자 보너스 +160%'],
    },
    effect:(lv)=>({ rankBonusMultAdd:[0,0.5,1.0,1.6][lv] }),
  },
  {
    id:'lowCost', maxLv:4,
    costs:[4,8,13,20],
    nameI18n:  { en:'Frugality',       ko:'절약의 미덕' },
    descI18n:  {
      en:['Round drain −8%','Round drain −16%','Round drain −25%','Round drain −35%'],
      ko:['라운드 차감 −8%','라운드 차감 −16%','라운드 차감 −25%','라운드 차감 −35%'],
    },
    effect:(lv)=>({ costReduction:[0,0.08,0.16,0.25,0.35][lv] }),
  },
  {
    id:'multBoost', maxLv:3,
    costs:[8,15,25],
    nameI18n:  { en:'Alchemist',       ko:'연금술사'    },
    descI18n:  {
      en:['Total mult +0.15','Total mult +0.35','Total mult +0.6'],
      ko:['최종 배율 +0.15','최종 배율 +0.35','최종 배율 +0.6'],
    },
    effect:(lv)=>({ multFlatBonus:[0,0.15,0.35,0.6][lv] }),
  },
  {
    id:'betRefund', maxLv:3,
    costs:[6,12,20],
    nameI18n:  { en:'Insurance',       ko:'보험'        },
    descI18n:  {
      en:['Fold refunds 10% of drain','Fold refunds 20%','Fold refunds 30%'],
      ko:['폴드 시 차감의 10% 환급','폴드 시 20% 환급','폴드 시 30% 환급'],
    },
    effect:(lv)=>({ foldRefund:[0,0.10,0.20,0.30][lv] }),
  },
  {
    id:'highHandBonus', maxLv:3,
    costs:[7,13,22],
    nameI18n:  { en:'High Roller',     ko:'하이 롤러'   },
    descI18n:  {
      en:['Flush+ hands: +0.2 mult','Flush+ hands: +0.4 mult','Flush+ hands: +0.7 mult'],
      ko:['플러시 이상: 배율 +0.2','플러시 이상: 배율 +0.4','플러시 이상: 배율 +0.7'],
    },
    effect:(lv)=>({ highHandFlatBonus:[0,0.2,0.4,0.7][lv] }),
  },
];

// ─────────────────────────────────────────────
// ACTIVE ITEM DEFINITIONS  v3 (unchanged)
// ─────────────────────────────────────────────
const ITEM_DEFS = [
  {
    id:'rankUp',
    nameI18n:  { en:'⬆ Rank Up',         ko:'⬆ 랭크업'          },
    descI18n:  { en:'Increase one hand card rank by 1 (not Ace)', ko:'패 카드 1장 숫자 +1 (A 제외)' },
    targetPool:'hand', action:'rank_up',
  },
  {
    id:'draw',
    nameI18n:  { en:'🃏 Card Swap',        ko:'🃏 카드 교체'        },
    descI18n:  { en:'Replace one hand card with a random new draw', ko:'패 카드 1장을 새로 뽑음' },
    targetPool:'hand', action:'redraw',
  },
  {
    id:'colorSwapRed',
    nameI18n:  { en:'🔴 Paint Red',        ko:'🔴 빨간 물감'        },
    descI18n:  { en:'Change one hand card suit to a random red suit (♦ or ♥)', ko:'패 카드 1장을 랜덤 빨간 문양(♦/♥)으로 변환' },
    targetPool:'hand', action:'color_to_red',
  },
  {
    id:'colorSwapBlack',
    nameI18n:  { en:'⚫ Paint Black',       ko:'⚫ 검은 물감'        },
    descI18n:  { en:'Change one hand card suit to a random black suit (♠ or ♣)', ko:'패 카드 1장을 랜덤 검은 문양(♠/♣)으로 변환' },
    targetPool:'hand', action:'color_to_black',
  },
  {
    id:'toSpade',
    nameI18n:  { en:'♠ Spade Seal',        ko:'♠ 스페이드 봉인'    },
    descI18n:  { en:'Change one hand card suit to ♠ Spade', ko:'패 카드 1장의 문양을 ♠로 변환' },
    targetPool:'hand', action:'suit_to_spade',
  },
  {
    id:'rankSwap',
    nameI18n:  { en:'🔀 Rank Shuffle',     ko:'🔀 랭크 셔플'       },
    descI18n:  { en:'Randomly swap the ranks of your two hand cards', ko:'패 두 장의 숫자를 무작위로 교환' },
    targetPool:null, action:'rank_swap',
  },
  {
    id:'rankDown',
    nameI18n:  { en:'⬇ Demote & Draw',     ko:'⬇ 다운 & 드로우'   },
    descI18n:  { en:'Lower one hand card rank by 1, then draw an extra card to hand (hand becomes 3)', ko:'패 카드 1장 숫자 -1, 대신 덱에서 1장 추가 드로우 (패 3장)' },
    targetPool:'hand', action:'rank_down_draw',
  },
];

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function makeDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({suit:s, rank:r});
  return deck;
}
function shuffle(arr) {
  for (let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function cardKey(c)       { return `${c.rank}-${c.suit}`; }
function cardStr(c)       { return `${SUIT_SYMBOLS[c.suit]}${c.rank}`; }
function combinations(arr,k) {
  if (k>arr.length) return [arr.slice()];
  if (k===arr.length) return [arr.slice()];
  if (k===1) return arr.map(x=>[x]);
  const res=[];
  for (let i=0;i<=arr.length-k;i++) {
    for (const combo of combinations(arr.slice(i+1),k-1)) res.push([arr[i],...combo]);
  }
  return res;
}

// ─────────────────────────────────────────────
// HAND EVALUATION
// ─────────────────────────────────────────────
function evaluateHand(cards) {
  const ranks   = cards.map(c=>RANK_VAL[c.rank]).sort((a,b)=>b-a);
  const suits   = cards.map(c=>c.suit);
  const rankCnt = {}; const suitCnt = {};
  for (const r of ranks) rankCnt[r]=(rankCnt[r]||0)+1;
  for (const s of suits) suitCnt[s]=(suitCnt[s]||0)+1;
  const counts   = Object.values(rankCnt).sort((a,b)=>b-a);
  const isFlush  = Object.keys(suitCnt).length===1;
  const uniqR    = [...new Set(ranks)].sort((a,b)=>b-a);
  let isStraight = false;
  if (cards.length>=5 && uniqR.length===5) {
    isStraight = (uniqR[0]-uniqR[4]===4);
    if (!isStraight && uniqR[0]===14) isStraight = (uniqR.join()===('14,5,4,3,2'));
  }
  const topRank = ranks[0];
  let key, score;
  if      (isFlush&&isStraight&&topRank===14) { key='royalFlush';    score=10000; }
  else if (isFlush&&isStraight)               { key='straightFlush'; score=9000+topRank; }
  else if (counts[0]===4)                     { key='fourOfAKind';   score=8000+topRank; }
  else if (counts[0]===3&&counts[1]===2)      { key='fullHouse';     score=7000+topRank; }
  else if (isFlush)                           { key='flush';         score=6000+topRank; }
  else if (isStraight)                        { key='straight';      score=5000+topRank; }
  else if (counts[0]===3)                     { key='threeOfAKind';  score=4000+topRank; }
  else if (counts[0]===2&&counts[1]===2)      { key='twoPair';       score=3000+topRank; }
  else if (counts[0]===2)                     { key='onePair';       score=2000+topRank; }
  else                                        { key='highCard';      score=1000+topRank; }

  const contributingCards = getContributingCards(cards, key, rankCnt, suitCnt);
  return { key, mult:HAND_MULTS[key]||0, score, ranks, contributingCards };
}

function getContributingCards(cards, key, rankCnt, suitCnt) {
  switch(key) {
    case 'royalFlush': case 'straightFlush': case 'flush': case 'straight':
      return cards.map((_,i)=>i);
    case 'fourOfAKind': {
      const r=Object.entries(rankCnt).find(([,v])=>v===4)?.[0];
      return cards.map((c,i)=>RANK_VAL[c.rank]===+r?i:-1).filter(i=>i>=0);
    }
    case 'fullHouse': return cards.map((_,i)=>i);
    case 'threeOfAKind': {
      const r=Object.entries(rankCnt).find(([,v])=>v===3)?.[0];
      return cards.map((c,i)=>RANK_VAL[c.rank]===+r?i:-1).filter(i=>i>=0);
    }
    case 'twoPair': {
      const pairs=Object.entries(rankCnt).filter(([,v])=>v===2).map(([r])=>+r);
      return cards.map((c,i)=>pairs.includes(RANK_VAL[c.rank])?i:-1).filter(i=>i>=0);
    }
    case 'onePair': {
      const r=Object.entries(rankCnt).find(([,v])=>v===2)?.[0];
      return cards.map((c,i)=>RANK_VAL[c.rank]===+r?i:-1).filter(i=>i>=0);
    }
    default: return [cards.indexOf([...cards].sort((a,b)=>RANK_VAL[b.rank]-RANK_VAL[a.rank])[0])];
  }
}

function getBestHand(cards) {
  if (!cards.length) return {key:'none',mult:0,score:0,handCards:[],ranks:[],contributingCards:[]};
  const size=Math.min(5,cards.length);
  const combos=combinations(cards,size);
  let best=null;
  for (const combo of combos) {
    const ev=evaluateHand(combo);
    if (!best||ev.score>best.score) best={...ev,handCards:combo};
  }
  return best;
}

// ─────────────────────────────────────────────
// SUIT BONUS (v3 — ADDITIVE)
// ─────────────────────────────────────────────
function getSuitBonus(cards, suitBonusMultAdd=0) {
  const suitCnt={};
  for (const c of cards) suitCnt[c.suit]=(suitCnt[c.suit]||0)+1;
  let bestSuit=null, bestCount=0;
  for (const [s,cnt] of Object.entries(suitCnt)) {
    if (cnt>bestCount||(cnt===bestCount&&SUIT_ORDER[s]>SUIT_ORDER[bestSuit||'club'])) {
      bestCount=cnt; bestSuit=s;
    }
  }
  if (!bestSuit||bestCount<2) return {suit:null,count:0,bonus:0};
  // Additive: count * per-card value * (1 + multAdd)
  const perCard = SUIT_PER_CARD[bestSuit] || 0;
  const bonus = +(bestCount * perCard * (1 + suitBonusMultAdd)).toFixed(4);
  return {suit:bestSuit,count:bestCount,bonus};
}

// ─────────────────────────────────────────────
// RANK BONUS (v3 — ADDITIVE)
// ─────────────────────────────────────────────
function getRankBonus(cards, rankBonusMultAdd=0) {
  if (!cards.length) return 0;
  // Average rank value of all cards, scaled
  const avgRank = cards.reduce((s,c)=>s+RANK_VAL[c.rank],0) / cards.length;
  // (avgRank - 2) / 12 gives 0~1 range; multiply by 0.35 for modest base
  const base = Math.max(0, (avgRank - 2) / 12 * 0.35);
  return +(base * (1 + rankBonusMultAdd)).toFixed(4);
}

// ─────────────────────────────────────────────
// PASSIVE AGGREGATOR
// ─────────────────────────────────────────────
function getPassiveEffect(passives) {
  const eff={};
  for (const [id,lv] of Object.entries(passives)) {
    if (!lv) continue;
    const def=PASSIVE_DEFS.find(p=>p.id===id);
    if (def) Object.assign(eff, def.effect(lv));
  }
  return eff;
}

// ─────────────────────────────────────────────
// ROUND COST
// ─────────────────────────────────────────────
function computeRoundCost(G) {
  const preset  = DIFFICULTY_PRESETS[G.settings.difficulty];
  const passive = getPassiveEffect(G.passives);
  let cost = preset.baseCostPerRound + (G.round-1)*preset.roundCostGrowth;
  const extraReveals = Math.max(0, G.revealedCount-2);
  cost += extraReveals*preset.revealPenalty;
  if (passive.costReduction) cost *= (1-passive.costReduction);
  G.roundCost = +cost.toFixed(2);
  return G.roundCost;
}

// ─────────────────────────────────────────────
// COMPUTE RETURN (v3 — ADDITIVE system)
// ─────────────────────────────────────────────
function computeReturn(G) {
  const all=getAllCards(G);
  if (!all.length) return {mult:0,lifeReturn:0,key:'none',handCards:[],suitBonus:{suit:null,count:0,bonus:0},rankBonus:0,contributingIndices:[],breakdown:[]};
  const passive   = getPassiveEffect(G.passives);
  const hand      = getBestHand(all);
  const suitInfo  = getSuitBonus(all, passive.suitBonusMultAdd||0);
  const rankBon   = getRankBonus(all, passive.rankBonusMultAdd||0);

  // All additive!
  let totalMult = hand.mult; // base hand mult (0 for highCard)

  const breakdown = [];
  if (hand.mult > 0) breakdown.push({label:HAND_NAMES_I18N[hand.key]?.[G.settings.lang]||hand.key, value:hand.mult});

  const SUIT_NAMES_I18N = {spade:{en:'Spade',ko:'스페이드'},diamond:{en:'Diamond',ko:'다이아몬드'},heart:{en:'Heart',ko:'하트'},club:{en:'Club',ko:'클로버'}};
  const BONUS_LABELS_I18N = {
    suit:  {en:' bonus', ko:' 보너스'},
    rank:  {en:'Rank bonus', ko:'숫자 보너스'},
    alch:  {en:'Alchemist', ko:'연금술사'},
    hroll: {en:'High Roller', ko:'하이 롤러'},
  };
  const loc = G.settings.lang || 'en';

  if (suitInfo.bonus > 0) {
    totalMult += suitInfo.bonus;
    const suitSym = SUIT_SYMBOLS[suitInfo.suit];
    const suitName = (SUIT_NAMES_I18N[suitInfo.suit]||SUIT_NAMES_I18N.spade)[loc] || (SUIT_NAMES_I18N[suitInfo.suit]||SUIT_NAMES_I18N.spade).en;
    const bonLabel = BONUS_LABELS_I18N.suit[loc] || BONUS_LABELS_I18N.suit.en;
    breakdown.push({label:`${suitSym} ${suitName}${bonLabel}`, value:suitInfo.bonus, isSuitBonus:true, suitName:`${suitSym} ${suitName}${bonLabel}`});
  }
  if (rankBon > 0) {
    totalMult += rankBon;
    const rankLabel = BONUS_LABELS_I18N.rank[loc] || BONUS_LABELS_I18N.rank.en;
    breakdown.push({label:rankLabel, value:rankBon, isRankBonus:true});
  }

  // Alchemist flat bonus
  if (passive.multFlatBonus) {
    totalMult += passive.multFlatBonus;
    const alchLabel = BONUS_LABELS_I18N.alch[loc] || BONUS_LABELS_I18N.alch.en;
    breakdown.push({label:alchLabel, value:passive.multFlatBonus, isPassive:true});
  }

  // High roller bonus (flush and above) — flat additive
  const highHandKeys = new Set(['flush','fullHouse','fourOfAKind','straightFlush','royalFlush']);
  if (passive.highHandFlatBonus && highHandKeys.has(hand.key)) {
    totalMult += passive.highHandFlatBonus;
    const hrLabel = BONUS_LABELS_I18N.hroll[loc] || BONUS_LABELS_I18N.hroll.en;
    breakdown.push({label:hrLabel, value:passive.highHandFlatBonus, isPassive:true});
  }

  totalMult = +totalMult.toFixed(4);
  const lifeReturn  = +(G.betAmount * totalMult).toFixed(2);

  // Map contributing cards back to full all-cards indices
  const contributingIndices = (hand.contributingCards||[]).map(i=>{
    const c = hand.handCards[i];
    return all.findIndex(a=>a.rank===c.rank&&a.suit===c.suit);
  });

  return {
    mult:totalMult, lifeReturn, key:hand.key,
    handCards:hand.handCards||[], suitBonus:suitInfo, rankBonus:rankBon,
    contributingIndices, rarity:HAND_RARITY[hand.key]||'common',
    breakdown, handMult:hand.mult,
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getAllCards(G) { return [...G.handCards,...G.fieldCards.slice(0,G.revealedCount)]; }

function drawCard(G) {
  if (!G.deck.length) {
    G.deck=shuffle(makeDeck());
    const used=new Set([...G.handCards,...G.fieldCards].map(cardKey));
    G.deck=G.deck.filter(c=>!used.has(cardKey(c)));
  }
  return G.deck.pop();
}

// ─────────────────────────────────────────────
// INIT GAME
// ─────────────────────────────────────────────
function initGame(settings={}) {
  const difficulty = (settings.difficulty||'normal').toLowerCase();
  const preset     = DIFFICULTY_PRESETS[difficulty]||DIFFICULTY_PRESETS.normal;
  const G = {
    settings:   { difficulty, lang: settings.lang||'en' },
    life:       preset.startLife,
    maxLife:    preset.startLife,
    round:      1,
    totalPoints:0,
    deck:       shuffle(makeDeck()),
    handCards:  [],
    fieldCards: [],
    phase:      'idle',
    revealedCount: 2,
    betAmount:  0,
    roundCost:  0,
    passives:   {},
    heldItem:   null,
    betHeld:    0,         // amount held in escrow during betting phase
    itemUsedThisRound: false,
    nextItemAtRound: 10,
    logs:       [],
    lastResult: null,
  };
  return G;
}

// ─────────────────────────────────────────────
// PRE-BET (v3 — bet before seeing cards)
// ─────────────────────────────────────────────
function enterPreBet(G) {
  const preset  = DIFFICULTY_PRESETS[G.settings.difficulty];
  const passive = getPassiveEffect(G.passives);
  const baseBet = +(preset.baseBet + (passive.betBonus||0)).toFixed(2);
  // Minimum bet is the smaller of baseBet and current life (can't bet more than you have)
  const minBet  = Math.min(baseBet, G.life);
  G.betAmount   = minBet;
  G.minBet      = minBet;
  G.phase       = 'preBet';
  G.handCards   = [];
  G.fieldCards  = [];
  G.revealedCount = 0;
  G.itemUsedThisRound = false;
  G.lastResult  = null;
  G.betHeld     = 0;
  return G;
}

// ─────────────────────────────────────────────
// CONFIRM BET & DEAL (v3)
// ─────────────────────────────────────────────
function confirmBetAndDeal(G) {
  if (G.phase !== 'preBet') return false;
  if (G.betAmount <= 0) return false;

  // Clamp bet to current life (safety)
  G.betAmount = Math.min(G.betAmount, G.life);
  if (G.betAmount <= 0) return false;

  // Deduct bet from life upfront (held in escrow)
  G.life = +(G.life - G.betAmount).toFixed(2);
  G.betHeld = G.betAmount; // track how much was held

  G.deck        = shuffle(makeDeck());
  G.handCards   = [drawCard(G), drawCard(G)];
  G.fieldCards  = [drawCard(G),drawCard(G),drawCard(G),drawCard(G),drawCard(G)];
  G.revealedCount = 2;
  G.phase       = 'betting';
  G.itemUsedThisRound = false;
  G.lastResult  = null;

  // Grant item on round 1 or every 10 rounds
  if (G.round===1 || G.round>=G.nextItemAtRound) {
    if (G.heldItem===null) {
      const pool=shuffle(ITEM_DEFS.map(d=>d.id));
      G.heldItem=pool[0];
    }
    if (G.round>=G.nextItemAtRound) G.nextItemAtRound+=10;
  }

  computeRoundCost(G);
  addLog(G,`round_start:${G.round}`);
  return true;
}

// ─────────────────────────────────────────────
// BETTING (adjust bet during preBet phase)
// ─────────────────────────────────────────────
function adjustBet(G, mode) {
  // Only allow bet adjustment during preBet phase (before seeing cards)
  if (G.phase!=='preBet') return false;
  const preset  = DIFFICULTY_PRESETS[G.settings.difficulty];
  const passive = getPassiveEffect(G.passives);
  const baseBet = +(preset.baseBet+(passive.betBonus||0)).toFixed(2);
  const maxBet  = +G.life.toFixed(2);
  // Minimum: at least the smaller of baseBet or remaining life
  const minBet  = Math.min(baseBet, maxBet);
  let bet = G.betAmount;

  switch(mode) {
    case '+1':   bet+=1;   break;
    case '+5':   bet+=5;   break;
    case '+10':  bet+=10;  break;
    case '+100': bet+=100; break;
    case '-1':   bet-=1;   break;
    case '-5':   bet-=5;   break;
    case '-10':  bet-=10;  break;
    case 'half': bet=+(maxBet/2).toFixed(2); break;
    case 'allin':bet=maxBet; break;
    default: return false;
  }
  // Clamp: never below minBet, never above maxBet, never 0
  bet = Math.min(maxBet, Math.max(minBet, +bet.toFixed(2)));
  if (bet <= 0) return false; // can't bet 0
  G.betAmount = bet;
  return true;
}

// ─────────────────────────────────────────────
// REVEAL
// ─────────────────────────────────────────────
function revealNext(G) {
  if (G.phase!=='betting'||G.revealedCount>=5) return false;
  G.revealedCount++;
  computeRoundCost(G);
  addLog(G,`reveal:${cardStr(G.fieldCards[G.revealedCount-1])}`);
  return true;
}

// ─────────────────────────────────────────────
// PLACE BET (settle)
// ─────────────────────────────────────────────
function placeBet(G) {
  if (G.phase!=='betting') return null;
  G.phase='resolving';
  const result  = computeReturn(G);
  const preset  = DIFFICULTY_PRESETS[G.settings.difficulty];

  // Return formula: -bet (already deducted at preBet) + bet*mult (winnings) - roundCost
  // So net = bet*(mult - 1) - roundCost  (at mult=1x you just recover your bet)
  // lifeReturn = betAmount * totalMult = total winnings
  const winnings   = result.lifeReturn; // betAmount * totalMult
  const netGain    = +(winnings - G.roundCost).toFixed(2);

  G.life = Math.max(0, +(G.life + netGain).toFixed(2));

  // Fixed points per hand type + small bonus from difficulty
  const pts = Math.floor((HAND_POINTS[result.key]||0) * preset.pointMult);
  G.totalPoints += pts;

  G.lastResult = {
    type:'bet', handKey:result.key, mult:result.mult,
    lifeGain:winnings, lifeCost:G.roundCost, netGain,
    totalReturn:winnings, betReturned:0, // bet is NOT returned separately; winnings already include it at 1x
    pointsEarned:pts, suitBonus:result.suitBonus,
    rankBonus:result.rankBonus,
    breakdown:result.breakdown, handMult:result.handMult,
    rarity:result.rarity, contributingIndices:result.contributingIndices,
    betAmount:G.betHeld, lifeAfter:G.life,
  };
  G.betHeld = 0;
  addLog(G,`bet:${result.key}:${result.mult.toFixed(2)}:${netGain}`);
  return G.lastResult;
}

// ─────────────────────────────────────────────
// FOLD
// ─────────────────────────────────────────────
function fold(G) {
  if (G.phase!=='betting') return null;
  G.phase='resolving';
  const passive   = getPassiveEffect(G.passives);
  const refund    = passive.foldRefund||0;

  // Recover half the bet
  const halfBet   = +(G.betHeld * 0.5).toFixed(2);
  // Round cost drain (with insurance refund)
  const lifeCost  = +(G.roundCost*(1-refund)).toFixed(2);
  const recovery  = +(halfBet - lifeCost).toFixed(2);

  G.life = Math.max(0, +(G.life + recovery).toFixed(2));
  G.lastResult = {
    type:'fold', lifeCost, betRecovered:halfBet, betLost:+(G.betHeld*0.5).toFixed(2),
    netGain:recovery, lifeAfter:G.life, pointsEarned:0,
    betAmount:G.betHeld,
  };
  G.betHeld = 0;
  addLog(G,`fold:${lifeCost}`);
  return G.lastResult;
}

// ─────────────────────────────────────────────
// ADVANCE ROUND
// ─────────────────────────────────────────────
function advanceRound(G) {
  G.round++;
  // Fixed round bonus: 5 + round number
  const pts = 5 + G.round;
  G.totalPoints += pts;
  return pts;
}

// ─────────────────────────────────────────────
// PASSIVE SHOP
// ─────────────────────────────────────────────
function buyPassive(G, id) {
  const def=PASSIVE_DEFS.find(p=>p.id===id);
  if (!def) return {ok:false,reason:'not_found'};
  const lv=G.passives[id]||0;
  if (lv>=def.maxLv) return {ok:false,reason:'maxed'};
  const cost=def.costs[lv];
  if (G.totalPoints<cost) return {ok:false,reason:'no_points'};
  G.totalPoints-=cost;
  G.passives[id]=(G.passives[id]||0)+1;
  addLog(G,`passive:${id}:${G.passives[id]}`);
  return {ok:true,newLevel:G.passives[id]};
}

// ─────────────────────────────────────────────
// ITEM SYSTEM
// ─────────────────────────────────────────────
function getItemTargets(G, itemId) {
  const def=ITEM_DEFS.find(d=>d.id===itemId);
  if (!def) return [];
  if (def.targetPool==='hand')       return G.handCards.map((c,i)=>({...c,_idx:i}));
  if (def.targetPool==='field_open') return G.fieldCards.slice(0,G.revealedCount).map((c,i)=>({...c,_idx:i}));
  return [];
}

function useItem(G, targetIdx=-1) {
  const itemId = G.heldItem;
  if (!itemId)                    return {ok:false,reason:'no_item'};
  if (G.itemUsedThisRound)        return {ok:false,reason:'already_used'};
  if (G.phase!=='betting')        return {ok:false,reason:'wrong_phase'};
  const def=ITEM_DEFS.find(d=>d.id===itemId);
  if (!def) return {ok:false,reason:'not_found'};

  let detail={};

  switch(def.action) {
    case 'rank_up': {
      const c=G.handCards[targetIdx];
      if (!c) return {ok:false,reason:'invalid_target'};
      if (c.rank==='A') return {ok:false,reason:'ace_max'};
      const ri=RANKS.indexOf(c.rank);
      const oldRank=c.rank; c.rank=RANKS[ri+1];
      detail={oldRank,newRank:c.rank};
      break;
    }
    case 'redraw': {
      const old=G.handCards[targetIdx];
      if (!old) return {ok:false,reason:'invalid_target'};
      const newCard=drawCard(G);
      G.handCards[targetIdx]=newCard;
      detail={oldCard:cardStr(old),newCard:cardStr(newCard)};
      break;
    }
    case 'color_to_red': {
      const c=G.handCards[targetIdx];
      if (!c) return {ok:false,reason:'invalid_target'};
      const reds=['diamond','heart'];
      const newSuit=reds[Math.floor(Math.random()*2)];
      const oldSuit=c.suit; c.suit=newSuit;
      detail={oldSuit,newSuit,symbol:SUIT_SYMBOLS[newSuit]};
      break;
    }
    case 'color_to_black': {
      const c=G.handCards[targetIdx];
      if (!c) return {ok:false,reason:'invalid_target'};
      const blacks=['spade','club'];
      const newSuit=blacks[Math.floor(Math.random()*2)];
      const oldSuit=c.suit; c.suit=newSuit;
      detail={oldSuit,newSuit,symbol:SUIT_SYMBOLS[newSuit]};
      break;
    }
    case 'suit_to_spade': {
      const c=G.handCards[targetIdx];
      if (!c) return {ok:false,reason:'invalid_target'};
      const oldSuit=c.suit; c.suit='spade';
      detail={oldSuit,newSuit:'spade'};
      break;
    }
    case 'rank_swap': {
      if (G.handCards.length<2) return {ok:false,reason:'need_two'};
      const i=Math.floor(Math.random()*G.handCards.length);
      let j; do { j=Math.floor(Math.random()*G.handCards.length); } while(j===i);
      const tmp=G.handCards[i].rank;
      G.handCards[i].rank=G.handCards[j].rank;
      G.handCards[j].rank=tmp;
      detail={swappedIndices:[i,j]};
      break;
    }
    case 'rank_down_draw': {
      const c=G.handCards[targetIdx];
      if (!c) return {ok:false,reason:'invalid_target'};
      if (c.rank==='2') return {ok:false,reason:'rank_min'};
      const ri=RANKS.indexOf(c.rank);
      const oldRank=c.rank; c.rank=RANKS[ri-1];
      const extra=drawCard(G);
      G.handCards.push(extra);
      detail={oldRank,newRank:c.rank,drawnCard:cardStr(extra)};
      break;
    }
    default: return {ok:false,reason:'unknown_action'};
  }

  G.itemUsedThisRound=true;
  G.heldItem=null;
  computeRoundCost(G);
  addLog(G,`item:${itemId}`);
  return {ok:true,detail};
}

// ─────────────────────────────────────────────
// GAME OVER
// ─────────────────────────────────────────────
function isGameOver(G) { return G.life<=0; }

// ─────────────────────────────────────────────
// LOG
// ─────────────────────────────────────────────
function addLog(G,msg) { G.logs.unshift(msg); if (G.logs.length>100) G.logs.pop(); }

// ─────────────────────────────────────────────
// I18N HELPERS
// ─────────────────────────────────────────────
function getHandName(key,lang='en') { return (HAND_NAMES_I18N[key]||{})[lang]||key; }
function getPassiveDef(id) { return PASSIVE_DEFS.find(p=>p.id===id); }
function getItemDef(id)    { return ITEM_DEFS.find(d=>d.id===id); }

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
const VidaGame = {
  DIFFICULTY_PRESETS, PASSIVE_DEFS, ITEM_DEFS, HAND_MULTS, HAND_POINTS, HAND_RARITY,
  SUIT_SYMBOLS, SUIT_ORDER, SUIT_PER_CARD, RANKS, RANK_VAL, BLACK_SUITS, RED_SUITS,
  initGame, enterPreBet, confirmBetAndDeal, revealNext, placeBet, fold, advanceRound,
  adjustBet, buyPassive, useItem, getItemTargets, isGameOver,
  computeReturn, computeRoundCost, getBestHand, getAllCards,
  getPassiveEffect, getSuitBonus, getRankBonus,
  getHandName, getPassiveDef, getItemDef,
  cardStr, shuffle, makeDeck,
};
if (typeof module!=='undefined'&&module.exports) module.exports=VidaGame;
if (typeof window!=='undefined') window.VidaGame=VidaGame;
