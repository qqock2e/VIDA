/**
 * VIDA POKER — game.js  v4
 * Pure game logic. Zero DOM.
 *
 * v4 changes:
 *  - REMOVE POINT SYSTEM: no totalPoints, no HAND_POINTS, no buyPassive()
 *  - PASSIVE ITEMS: choose 1 of 3 random passives at round 1 and every 5 rounds
 *  - ACTIVE ITEMS: choose 1 of 3 random items at round 1 and every 10 rounds (if no heldItem)
 *  - SHOP SYSTEM: buy active items with Life every 5 rounds (extraItemSlot)
 *  - GAME BALANCE: reduced SUIT_PER_CARD, reduced rank bonus, reduced PASSIVE_DEFS values
 *  - Life-scaling drain (prevents exponential growth)
 *  - Adjusted HAND_MULTS (increase gap between bad and good hands)
 *  - INFINITY MODE: no round cap after victory at round 100
 *  - BACKGROUND STAGES: getBackgroundStage(G)
 *  - Removed nextItemAtRound from G
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
 * v4: Reduced values
 */
const SUIT_PER_CARD = { spade:0.04, diamond:0.03, heart:0.025, club:0.015 };

/**
 * Difficulty presets — v5
 *
 * baseBet        : base life units the player wagers each hand
 * startLife      : always 20
 * roundStartCost : flat Life cost to START a round (deducted on deal, proportional to difficulty)
 * baseDrain      : base drain per round (flat, no round growth)
 * revealDrain    : tiny extra drain per field card revealed beyond the 2 free ones
 * lifeDrainRate  : extra drain per unit of Life exceeding starting Life (prevents snowball)
 * maxRound       : round cap for normal mode (infinity mode has no cap)
 */
const DIFFICULTY_PRESETS = {
  easy:   { baseBet:1.4, startLife:30, baseCostPerRound:1.0, revealPenalty:0.30, roundCostGrowth:0.25, lifeDrainRate:0.04, maxRound:50 },
  normal: { baseBet:1.4, startLife:25, baseCostPerRound:1.3, revealPenalty:0.45, roundCostGrowth:0.30, lifeDrainRate:0.07, maxRound:50 },
  hard:   { baseBet:1.4, startLife:20, baseCostPerRound:1.8, revealPenalty:0.60, roundCostGrowth:0.50, lifeDrainRate:0.09, maxRound:50 },
  insane: { baseBet:1.4, startLife:20, baseCostPerRound:2.5, revealPenalty:0.75, roundCostGrowth:0.80, lifeDrainRate:0.13, maxRound:50 },
};

/**
 * Hand multipliers — v4 (ADDITIVE system, starts at 0)
 *
 * Total multiplier = handMult + suitBonus + rankBonus + passiveBonuses
 * v4: Increased gap between bad and good hands
 */
const HAND_MULTS = {
  highCard:      0,
  onePair:       0.7,
  twoPair:       1.0,
  threeOfAKind:  1.6,
  backStraight:  2.5,
  straight:      2.0,
  mountain:      2.5,
  flush:         1.7,
  fullHouse:     2.2,
  fourOfAKind:   3.4,
  backStraightFlush: 5.5,
  straightFlush: 3.5,
  royalFlush:    8.5,
};

const HAND_NAMES_I18N = {
  highCard:      { en:'High Card',        ko:'하이 카드'          },
  onePair:       { en:'One Pair',         ko:'원 페어'            },
  twoPair:       { en:'Two Pair',         ko:'투 페어'            },
  threeOfAKind:  { en:'Three of a Kind',  ko:'트리플'             },
  backStraight:  { en:'Back Straight',    ko:'백 스트레이트'       },
  straight:      { en:'Straight',         ko:'스트레이트'          },
  mountain:      { en:'Mountain',         ko:'마운틴'             },
  flush:         { en:'Flush',            ko:'플러시'             },
  fullHouse:     { en:'Full House',       ko:'풀 하우스'          },
  fourOfAKind:   { en:'Four of a Kind',   ko:'포 카드'            },
  backStraightFlush: { en:'Back Straight Flush', ko:'백 스트레이트 플러시' },
  straightFlush: { en:'Straight Flush',   ko:'스트레이트 플러시'   },
  royalFlush:    { en:'Royal Flush',      ko:'로열 플러시'         },
};

// Rarity tiers for hand animation
const HAND_RARITY = {
  highCard:      'common',
  onePair:       'common',
  twoPair:       'uncommon',
  threeOfAKind:  'uncommon',
  backStraight:  'uncommon',
  straight:      'rare',
  mountain:      'rare',
  flush:         'rare',
  fullHouse:     'epic',
  fourOfAKind:   'epic',
  backStraightFlush: 'epic',
  straightFlush: 'legendary',
  royalFlush:    'legendary',
};

// ─────────────────────────────────────────────
// PASSIVE DEFINITIONS  v4
// Effects adjusted for additive multiplier system
// No costs array (points removed); passives are chosen, not bought
// ─────────────────────────────────────────────
const PASSIVE_DEFS = [
  {
    id:'lifeBonus', maxLv:5,
    nameI18n:  { en:'Spring of Life',  ko:'생명의 샘'   },
    descI18n:  {
      en:['Start +1 Life','Start +2 Life','Start +3 Life','Start +4 Life','Start +5 Life'],
      ko:['시작 라이프 +1','시작 라이프 +2','시작 라이프 +3','시작 라이프 +4','시작 라이프 +5'],
    },
    effect:(lv)=>({ startLifeBonus: lv }),
  },
  {
    id:'betBoost', maxLv:3,
    nameI18n:  { en:"Gambler's Soul",  ko:'도박사의 혼' },
    descI18n:  {
      en:['Bet mult +0.08','Bet mult +0.15','Bet mult +0.25'],
      ko:['베팅 배율 +0.08','베팅 배율 +0.15','베팅 배율 +0.25'],
    },
    effect:(lv)=>({ betBonus:[0,0.08,0.15,0.25][lv] }),
  },
  {
    id:'suitMaster', maxLv:3,
    nameI18n:  { en:'Suit Master',     ko:'문양의 달인' },
    descI18n:  {
      en:['Suit bonus +30%','Suit bonus +60%','Suit bonus +100%'],
      ko:['문양 보너스 +30%','문양 보너스 +60%','문양 보너스 +100%'],
    },
    effect:(lv)=>({ suitBonusMultAdd:[0,0.3,0.6,1.0][lv] }),
  },
  {
    id:'rankBonus', maxLv:3,
    nameI18n:  { en:"Noble's Hand",    ko:'귀족의 패'   },
    descI18n:  {
      en:['Rank bonus +30%','Rank bonus +60%','Rank bonus +100%'],
      ko:['숫자 보너스 +30%','숫자 보너스 +60%','숫자 보너스 +100%'],
    },
    effect:(lv)=>({ rankBonusMultAdd:[0,0.3,0.6,1.0][lv] }),
  },
  {
    id:'lowCost', maxLv:4,
    nameI18n:  { en:'Frugality',       ko:'절약의 미덕' },
    descI18n:  {
      en:['Round drain −6%','Round drain −12%','Round drain −18%','Round drain −25%'],
      ko:['라운드 차감 −6%','라운드 차감 −12%','라운드 차감 −18%','라운드 차감 −25%'],
    },
    effect:(lv)=>({ costReduction:[0,0.06,0.12,0.18,0.25][lv] }),
  },
  {
    id:'multBoost', maxLv:3,
    nameI18n:  { en:'Alchemist',       ko:'연금술사'    },
    descI18n:  {
      en:['Total mult +0.08','Total mult +0.18','Total mult +0.30'],
      ko:['최종 배율 +0.08','최종 배율 +0.18','최종 배율 +0.30'],
    },
    effect:(lv)=>({ multFlatBonus:[0,0.08,0.18,0.30][lv] }),
  },
  {
    id:'betRefund', maxLv:3,
    nameI18n:  { en:'Insurance',       ko:'보험'        },
    descI18n:  {
      en:['Fold refunds 8% of drain','Fold refunds 15%','Fold refunds 22%'],
      ko:['폴드 시 차감의 8% 환급','폴드 시 15% 환급','폴드 시 22% 환급'],
    },
    effect:(lv)=>({ foldRefund:[0,0.08,0.15,0.22][lv] }),
  },
  {
    id:'highHandBonus', maxLv:3,
    nameI18n:  { en:'High Roller',     ko:'하이 롤러'   },
    descI18n:  {
      en:['Flush+ hands: +0.10 mult','Flush+ hands: +0.20 mult','Flush+ hands: +0.35 mult'],
      ko:['플러시 이상: 배율 +0.10','플러시 이상: 배율 +0.20','플러시 이상: 배율 +0.35'],
    },
    effect:(lv)=>({ highHandFlatBonus:[0,0.10,0.20,0.35][lv] }),
  },
];

// ─────────────────────────────────────────────
// ACTIVE ITEM DEFINITIONS  v4
// Added shopCost field for shop system
// ─────────────────────────────────────────────
const ITEM_DEFS = [
  {
    id:'rankUp',
    nameI18n:  { en:'⬆ Rank Up',         ko:'⬆ 랭크업'          },
    descI18n:  { en:'Increase one hand card rank by 1 (not Ace)', ko:'패 카드 1장 숫자 +1 (A 제외)' },
    targetPool:'hand', action:'rank_up',
    shopCost: 5,
  },
  {
    id:'draw',
    nameI18n:  { en:'🃏 Card Swap',        ko:'🃏 카드 교체'        },
    descI18n:  { en:'Replace one hand card with a random new draw', ko:'패 카드 1장을 새로 뽑음' },
    targetPool:'hand', action:'redraw',
    shopCost: 4,
  },
  {
    id:'colorSwapRed',
    nameI18n:  { en:'🔴 Paint Red',        ko:'🔴 빨간 물감'        },
    descI18n:  { en:'Change one hand card suit to a random red suit (♦ or ♥)', ko:'패 카드 1장을 랜덤 빨간 문양(♦/♥)으로 변환' },
    targetPool:'hand', action:'color_to_red',
    shopCost: 3,
  },
  {
    id:'colorSwapBlack',
    nameI18n:  { en:'⚫ Paint Black',       ko:'⚫ 검은 물감'        },
    descI18n:  { en:'Change one hand card suit to a random black suit (♠ or ♣)', ko:'패 카드 1장을 랜덤 검은 문양(♠/♣)으로 변환' },
    targetPool:'hand', action:'color_to_black',
    shopCost: 3,
  },
  {
    id:'toSpade',
    nameI18n:  { en:'♠ Spade Seal',        ko:'♠ 스페이드 봉인'    },
    descI18n:  { en:'Change one hand card suit to ♠ Spade', ko:'패 카드 1장의 문양을 ♠로 변환' },
    targetPool:'hand', action:'suit_to_spade',
    shopCost: 4,
  },
  {
    id:'rankSwap',
    nameI18n:  { en:'🔀 Rank Shuffle',     ko:'🔀 랭크 셔플'       },
    descI18n:  { en:'Randomly swap the ranks of your two hand cards', ko:'패 두 장의 숫자를 무작위로 교환' },
    targetPool:null, action:'rank_swap',
    shopCost: 4,
  },
  {
    id:'rankDown',
    nameI18n:  { en:'⬇ Demote & Draw',     ko:'⬇ 다운 & 드로우'   },
    descI18n:  { en:'Lower one hand card rank by 1, then draw an extra card to hand (hand becomes 3)', ko:'패 카드 1장 숫자 -1, 대신 덱에서 1장 추가 드로우 (패 3장)' },
    targetPool:'hand', action:'rank_down_draw',
    shopCost: 4,
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
  // Flush requires 5+ cards all same suit (fix: was triggering with <5 cards)
  const isFlush  = cards.length>=5 && Object.keys(suitCnt).length===1;
  const uniqR    = [...new Set(ranks)].sort((a,b)=>b-a);
  let isStraight = false;
  let isBackStraight = false;
  let isMountain = false;
  if (cards.length>=5 && uniqR.length===5) {
    isStraight = (uniqR[0]-uniqR[4]===4);
    // Mountain: A-K-Q-J-10
    if (isStraight && uniqR[0]===14 && uniqR[4]===10) isMountain = true;
    // Back Straight: A-2-3-4-5
    if (!isStraight && uniqR[0]===14 && uniqR.join()==='14,5,4,3,2') {
      isStraight = true;
      isBackStraight = true;
    }
  }
  const topRank = ranks[0];
  let key, score;
  if      (isFlush&&isStraight&&isMountain)    { key='royalFlush';       score=10000; }
  else if (isFlush&&isBackStraight)             { key='backStraightFlush'; score=4500+topRank; }
  else if (isFlush&&isStraight)                 { key='straightFlush';     score=9000+topRank; }
  else if (counts[0]===4)                       { key='fourOfAKind';       score=8000+topRank; }
  else if (counts[0]===3&&counts[1]===2)        { key='fullHouse';         score=7000+topRank; }
  else if (isFlush)                             { key='flush';             score=6000+topRank; }
  else if (isMountain)                          { key='mountain';          score=5500+topRank; }
  else if (isStraight&&!isBackStraight)         { key='straight';          score=5000+topRank; }
  else if (isBackStraight)                      { key='backStraight';      score=1500; }
  else if (counts[0]===3)                       { key='threeOfAKind';      score=4000+topRank; }
  else if (counts[0]===2&&counts[1]===2)        { key='twoPair';           score=3000+topRank; }
  else if (counts[0]===2)                       { key='onePair';           score=2000+topRank; }
  else                                          { key='highCard';          score=1000+topRank; }

  const contributingCards = getContributingCards(cards, key, rankCnt, suitCnt);
  return { key, mult:HAND_MULTS[key]||0, score, ranks, contributingCards };
}

function getContributingCards(cards, key, rankCnt, suitCnt) {
  switch(key) {
    case 'royalFlush': case 'backStraightFlush': case 'straightFlush': case 'flush': case 'straight': case 'mountain': case 'backStraight':
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
// SUIT BONUS (v4 — ADDITIVE)
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
// RANK BONUS (v4 — ADDITIVE)
// ─────────────────────────────────────────────
function getRankBonus(cards, rankBonusMultAdd=0) {
  if (!cards.length) return 0;
  // Average rank value of all cards, scaled
  const avgRank = cards.reduce((s,c)=>s+RANK_VAL[c.rank],0) / cards.length;
  // (avgRank - 2) / 12 gives 0~1 range; multiply by 0.14 for modest base (v4: reduced from 0.35)
  const base = Math.max(0, (avgRank - 2) / 12 * 0.14);
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
// ROUND COST (v5 — flat base drain + tiny reveal increments)
// ─────────────────────────────────────────────
function computeRoundCost(G) {
  const preset  = DIFFICULTY_PRESETS[G.settings.difficulty];
  const passive = getPassiveEffect(G.passives);
  // Base drain is flat (no round growth), plus tiny reveal increments
  const lifeScale = 1 + (G.life / preset.startLife - 1) * preset.lifeDrainRate;
  const extraReveals = Math.max(0, G.revealedCount - 2);
  let cost = (preset.baseDrain + extraReveals * preset.revealDrain) * lifeScale;
  if (passive.costReduction) cost *= (1 - passive.costReduction);
  G.roundCost = +cost.toFixed(2);
  return G.roundCost;
}

// ─────────────────────────────────────────────
// COMPUTE RETURN (v4 — ADDITIVE system)
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
// INIT GAME (v4)
// ─────────────────────────────────────────────
function initGame(settings={}) {
  const difficulty = (settings.difficulty||'normal').toLowerCase();
  const preset     = DIFFICULTY_PRESETS[difficulty]||DIFFICULTY_PRESETS.normal;
  const passive    = {};
  // Apply startLifeBonus from passives (lifeBonus passive may be pre-selected)
  const startLifeBonus = 0;
  const G = {
    settings:   { difficulty, lang: settings.lang||'en' },
    life:       preset.startLife + startLifeBonus,
    maxLife:    preset.startLife + startLifeBonus,
    round:      1,
    deck:       shuffle(makeDeck()),
    handCards:  [],
    fieldCards: [],
    phase:      'idle',
    revealedCount: 2,
    betAmount:  0,
    roundCost:  0,
    passives:   {},
    heldItem:   null,
    betHeld:    0,
    itemUsedThisRound: false,
    extraItemSlot: null,
    extraItemUsedThisRound: false,
    infinityMode: settings.infinityMode || false,
    roundStartCost: 0,
    raiseStep:  0,
    logs:       [],
    lastResult: null,
  };
  return G;
}

// ─────────────────────────────────────────────
// INFINITY MODE (v4)
// ─────────────────────────────────────────────
function initInfinityGame(settings={}) {
  const G = initGame({...settings, infinityMode: true});
  return G;
}

function checkRoundCap(G) {
  const preset = DIFFICULTY_PRESETS[G.settings.difficulty];
  if (!G.infinityMode && G.round >= preset.maxRound) return 'victory';
  return 'continue';
}

// ─────────────────────────────────────────────
// BACKGROUND STAGES (v4)
// ─────────────────────────────────────────────
function getBackgroundStage(G) {
  return Math.floor((G.round - 1) / 10);
}

// ─────────────────────────────────────────────
// PASSIVE SELECTION (v4 — choose 1 of 3)
// ─────────────────────────────────────────────
function shouldShowPassiveSelection(G) {
  return G.round === 1 || G.round % 5 === 0;
}

function generatePassiveOffers(G) {
  // Filter passives that aren't maxed
  const available = PASSIVE_DEFS.filter(def => {
    const lv = G.passives[def.id] || 0;
    return lv < def.maxLv;
  });
  // Shuffle and pick up to 3
  const shuffled = shuffle([...available]);
  const picks = shuffled.slice(0, 3);
  return picks.map(def => {
    const currentLv = G.passives[def.id] || 0;
    const nextLv = currentLv + 1;
    const loc = G.settings.lang || 'en';
    const nextDesc = def.descI18n[loc]
      ? def.descI18n[loc][nextLv - 1] || def.descI18n.en[nextLv - 1] || ''
      : def.descI18n.en[nextLv - 1] || '';
    return {
      id: def.id,
      nameI18n: def.nameI18n,
      descI18n: def.descI18n,
      currentLv,
      maxLv: def.maxLv,
      nextDesc,
    };
  });
}

function selectPassive(G, passiveId) {
  const def = PASSIVE_DEFS.find(p => p.id === passiveId);
  if (!def) return { ok: false, reason: 'not_found' };
  const lv = G.passives[passiveId] || 0;
  if (lv >= def.maxLv) return { ok: false, reason: 'maxed' };
  G.passives[passiveId] = lv + 1;
  // If lifeBonus was selected, apply the extra life
  if (passiveId === 'lifeBonus') {
    const bonus = 1; // Each level of lifeBonus gives +1 start life
    // For in-game: add the life immediately
    G.life = +(G.life + bonus).toFixed(2);
    G.maxLife = +(G.maxLife + bonus).toFixed(2);
  }
  addLog(G, `passive:${passiveId}:${G.passives[passiveId]}`);
  return { ok: true, newLevel: G.passives[passiveId] };
}

// ─────────────────────────────────────────────
// ACTIVE ITEM SELECTION (v4 — choose 1 of 3)
// ─────────────────────────────────────────────
function shouldShowItemSelection(G) {
  return (G.round === 1 || G.round % 10 === 0) && G.heldItem === null;
}

function generateItemOffers(G) {
  const shuffled = shuffle([...ITEM_DEFS]);
  const picks = shuffled.slice(0, 3);
  return picks.map(def => ({
    id: def.id,
    nameI18n: def.nameI18n,
    descI18n: def.descI18n,
  }));
}

function selectItem(G, itemId) {
  const def = ITEM_DEFS.find(d => d.id === itemId);
  if (!def) return { ok: false, reason: 'not_found' };
  G.heldItem = itemId;
  addLog(G, `item_selected:${itemId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────
// SHOP SYSTEM (v4 — buy items with Life)
// ─────────────────────────────────────────────
function shouldShowShop(G) {
  return G.round % 5 === 0;
}

function generateShopOffers(G) {
  const shuffled = shuffle([...ITEM_DEFS]);
  const picks = shuffled.slice(0, 3);
  return picks.map(def => ({
    id: def.id,
    nameI18n: def.nameI18n,
    descI18n: def.descI18n,
    lifeCost: def.shopCost,
  }));
}

function buyShopItem(G, itemId) {
  const def = ITEM_DEFS.find(d => d.id === itemId);
  if (!def) return { ok: false, reason: 'not_found' };
  const cost = def.shopCost;
  if (G.life < cost) return { ok: false, reason: 'not_enough_life' };
  G.life = +(G.life - cost).toFixed(2);
  G.extraItemSlot = itemId;
  G.extraItemUsedThisRound = false;
  addLog(G, `shop_buy:${itemId}:${cost}`);
  return { ok: true, newLife: G.life };
}

function useExtraItem(G, targetIdx=-1) {
  const itemId = G.extraItemSlot;
  if (!itemId)                       return { ok:false, reason:'no_item' };
  if (G.extraItemUsedThisRound)      return { ok:false, reason:'already_used' };
  if (G.phase!=='betting')           return { ok:false, reason:'wrong_phase' };
  const def = ITEM_DEFS.find(d => d.id === itemId);
  if (!def) return { ok:false, reason:'not_found' };

  let detail = {};

  switch(def.action) {
    case 'rank_up': {
      const c = G.handCards[targetIdx];
      if (!c) return { ok:false, reason:'invalid_target' };
      if (c.rank==='A') return { ok:false, reason:'ace_max' };
      const ri = RANKS.indexOf(c.rank);
      const oldRank = c.rank; c.rank = RANKS[ri+1];
      detail = { oldRank, newRank: c.rank };
      break;
    }
    case 'redraw': {
      const old = G.handCards[targetIdx];
      if (!old) return { ok:false, reason:'invalid_target' };
      const newCard = drawCard(G);
      G.handCards[targetIdx] = newCard;
      detail = { oldCard: cardStr(old), newCard: cardStr(newCard) };
      break;
    }
    case 'color_to_red': {
      const c = G.handCards[targetIdx];
      if (!c) return { ok:false, reason:'invalid_target' };
      const reds = ['diamond','heart'];
      const newSuit = reds[Math.floor(Math.random()*2)];
      const oldSuit = c.suit; c.suit = newSuit;
      detail = { oldSuit, newSuit, symbol: SUIT_SYMBOLS[newSuit] };
      break;
    }
    case 'color_to_black': {
      const c = G.handCards[targetIdx];
      if (!c) return { ok:false, reason:'invalid_target' };
      const blacks = ['spade','club'];
      const newSuit = blacks[Math.floor(Math.random()*2)];
      const oldSuit = c.suit; c.suit = newSuit;
      detail = { oldSuit, newSuit, symbol: SUIT_SYMBOLS[newSuit] };
      break;
    }
    case 'suit_to_spade': {
      const c = G.handCards[targetIdx];
      if (!c) return { ok:false, reason:'invalid_target' };
      const oldSuit = c.suit; c.suit = 'spade';
      detail = { oldSuit, newSuit: 'spade' };
      break;
    }
    case 'rank_swap': {
      if (G.handCards.length < 2) return { ok:false, reason:'need_two' };
      const i = Math.floor(Math.random()*G.handCards.length);
      let j; do { j=Math.floor(Math.random()*G.handCards.length); } while(j===i);
      const tmp = G.handCards[i].rank;
      G.handCards[i].rank = G.handCards[j].rank;
      G.handCards[j].rank = tmp;
      detail = { swappedIndices: [i,j] };
      break;
    }
    case 'rank_down_draw': {
      const c = G.handCards[targetIdx];
      if (!c) return { ok:false, reason:'invalid_target' };
      if (c.rank==='2') return { ok:false, reason:'rank_min' };
      const ri = RANKS.indexOf(c.rank);
      const oldRank = c.rank; c.rank = RANKS[ri-1];
      const extra = drawCard(G);
      G.handCards.push(extra);
      detail = { oldRank, newRank: c.rank, drawnCard: cardStr(extra) };
      break;
    }
    default: return { ok:false, reason:'unknown_action' };
  }

  G.extraItemUsedThisRound = true;
  G.extraItemSlot = null;
  computeRoundCost(G);
  addLog(G, `extra_item:${itemId}`);
  return { ok: true, detail };
}

// ─────────────────────────────────────────────
// PRE-BET (v4 — bet before seeing cards)
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
  G.extraItemUsedThisRound = false;
  G.lastResult  = null;
  G.betHeld     = 0;
  G.roundStartCost = +(preset.roundStartCost).toFixed(2);
  G.raiseStep   = 0;
  return G;
}

// ─────────────────────────────────────────────
// CONFIRM BET & DEAL (v4)
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

  // Deduct round start cost
  const startCost = G.roundStartCost;
  G.life = +(G.life - startCost).toFixed(2);

  G.deck        = shuffle(makeDeck());
  G.handCards   = [drawCard(G), drawCard(G)];
  G.fieldCards  = [drawCard(G),drawCard(G),drawCard(G),drawCard(G),drawCard(G)];
  G.revealedCount = 2;
  G.phase       = 'betting';
  G.itemUsedThisRound = false;
  G.extraItemUsedThisRound = false;
  G.lastResult  = null;
  G.raiseStep   = 0;

  // v4: Items are now given via selection system, not automatic grants here

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
// REVEAL (v5 — auto-settle on last card)
// ─────────────────────────────────────────────
function revealNext(G) {
  if (G.phase!=='betting'||G.revealedCount>=5) return false;
  G.revealedCount++;
  computeRoundCost(G);
  addLog(G,`reveal:${cardStr(G.fieldCards[G.revealedCount-1])}`);
  // If last card revealed, auto-settle
  if (G.revealedCount >= 5) {
    return 'auto_settle';
  }
  return true;
}

// ─────────────────────────────────────────────
// PLACE BET (settle) — v4: no points
// ─────────────────────────────────────────────
function placeBet(G) {
  if (G.phase!=='betting') return null;
  G.phase='resolving';
  const result  = computeReturn(G);

  // Return formula: -bet (already deducted at preBet) + bet*mult (winnings) - roundCost
  // So net = bet*(mult - 1) - roundCost  (at mult=1x you just recover your bet)
  // lifeReturn = betAmount * totalMult = total winnings
  const winnings   = result.lifeReturn; // betAmount * totalMult
  const netGain    = +(winnings - G.roundCost).toFixed(2);

  G.life = Math.max(0, +(G.life + netGain).toFixed(2));

  G.lastResult = {
    type:'bet', handKey:result.key, mult:result.mult,
    lifeGain:winnings, lifeCost:G.roundCost, netGain,
    totalReturn:winnings, betReturned:0,
    suitBonus:result.suitBonus,
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
// FOLD — v4: no points
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
    netGain:recovery, lifeAfter:G.life,
    betAmount:G.betHeld,
  };
  G.betHeld = 0;
  addLog(G,`fold:${lifeCost}`);
  return G.lastResult;
}

// ─────────────────────────────────────────────
// ADVANCE ROUND — v4: just increment round, no points
// ─────────────────────────────────────────────
function advanceRound(G) {
  G.round++;
  return G.round;
}

// ─────────────────────────────────────────────
// ITEM SYSTEM (heldItem)
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
// RAISE BET (v5 — once per reveal step, supports all-in)
// ─────────────────────────────────────────────
function raiseBet(G, mode = 'raise') {
  if (G.phase !== 'betting') return { ok: false, reason: 'wrong_phase' };
  if (G.raiseStep >= G.revealedCount - 1) return { ok: false, reason: 'no_raise_available' };
  if (G.revealedCount >= 5) return { ok: false, reason: 'last_card' };

  let raiseAmount;
  if (mode === 'allin') {
    raiseAmount = +G.life.toFixed(2);
  } else {
    raiseAmount = +(G.betHeld * 0.25).toFixed(2);
  }

  if (raiseAmount <= 0) return { ok: false, reason: 'too_small' };
  if (G.life < raiseAmount) raiseAmount = +G.life.toFixed(2); // clamp

  G.life = +(G.life - raiseAmount).toFixed(2);
  G.betAmount = +(G.betAmount + raiseAmount).toFixed(2);
  G.betHeld = +(G.betHeld + raiseAmount).toFixed(2);
  G.raiseStep++;
  computeRoundCost(G);
  addLog(G, `raise:${raiseAmount}`);

  const isAllIn = G.life <= 0;
  return { ok: true, raiseAmount, newBetHeld: G.betHeld, newLife: G.life, isAllIn };
}

// ─────────────────────────────────────────────
// SKIP ROUND (v5 — skip, only pay base drain)
// ─────────────────────────────────────────────
function skipRound(G) {
  if (G.phase !== 'preBet') return { ok: false, reason: 'wrong_phase' };
  const preset = DIFFICULTY_PRESETS[G.settings.difficulty];
  const passive = getPassiveEffect(G.passives);
  const lifeScale = 1 + (G.life / preset.startLife - 1) * preset.lifeDrainRate;
  let drain = preset.baseDrain * lifeScale;
  if (passive.costReduction) drain *= (1 - passive.costReduction);
  drain = +drain.toFixed(2);
  G.life = Math.max(0, +(G.life - drain).toFixed(2));
  G.lastResult = { type: 'skip', lifeCost: drain, netGain: -drain, lifeAfter: G.life };
  addLog(G, `skip:${drain}`);
  return { ok: true, drain, newLife: G.life };
}

// ─────────────────────────────────────────────
// INFINITY MILESTONE CHECK (every 50 rounds)
// ─────────────────────────────────────────────
function checkInfinityMilestone(G) {
  if (!G.infinityMode) return null;
  if (G.round > 0 && G.round % 50 === 0) {
    return { lifeBonus: 5, extraItem: true };
  }
  return null;
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
// SCORE CALCULATION (for leaderboard)
// ─────────────────────────────────────────────
function computeScore(G) {
  const diffWeights = { easy:1, normal:2, hard:3, insane:5 };
  const w = diffWeights[G.settings.difficulty] || 1;
  const infinityBonus = G.infinityMode ? 1.5 : 1;
  return Math.round((G.round * w * 100 + G.life * w * 10) * infinityBonus);
}

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
const VidaGame = {
  DIFFICULTY_PRESETS, PASSIVE_DEFS, ITEM_DEFS, HAND_MULTS, HAND_RARITY,
  SUIT_SYMBOLS, SUIT_ORDER, SUIT_PER_CARD, RANKS, RANK_VAL, BLACK_SUITS, RED_SUITS,
  initGame, initInfinityGame, enterPreBet, confirmBetAndDeal, revealNext, placeBet, fold, advanceRound,
  adjustBet, raiseBet, skipRound, useItem, useExtraItem, getItemTargets, isGameOver,
  computeReturn, computeRoundCost, computeScore, getBestHand, getAllCards,
  getPassiveEffect, getSuitBonus, getRankBonus,
  getHandName, getPassiveDef, getItemDef,
  cardStr, shuffle, makeDeck,
  // v4 new exports
  shouldShowPassiveSelection, generatePassiveOffers, selectPassive,
  shouldShowItemSelection, generateItemOffers, selectItem,
  shouldShowShop, generateShopOffers, buyShopItem,
  checkRoundCap, checkInfinityMilestone, getBackgroundStage,
};
if (typeof module!=='undefined'&&module.exports) module.exports=VidaGame;
if (typeof window!=='undefined') window.VidaGame=VidaGame;
