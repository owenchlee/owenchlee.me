import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CARDS,
  FAN_QUESTIONS,
  RARITY_LABEL,
  TYPE_LABEL,
  addToBinder,
  checkFanAnswer,
  isPackUnlocked,
  rollPack,
  unlockPack,
  useBinder,
} from './packs';
import { playFlip, playJingle, playTear } from './sfx';

// Opening the secret booster pack (see packs.js). First time, it's fans
// only: one Pokémon trivia question, and a right answer unseals it for
// good. Then tap the sealed pack to
// tear it, then flip the five cards one at a time; the last is the rare
// slot, and it glows before it's flipped when something good is under it.
// The binder tab shows every card in the set, with silhouettes for the
// ones not pulled yet. Escape closes (capture phase, like the Workshop).
const RARITY_MARK = { common: '●', uncommon: '◆', rare: '★', holo: '★', secret: '✦' };
const setNumber = (card) => `${String(CARDS.indexOf(card) + 1).padStart(2, '0')}/${CARDS.length}`;

export function TradingCard({ card }) {
  const isSecret = card.type === 'secret';
  return (
    <div className={`tcg tcg--${card.type} tcg--${card.rarity}`} style={{ '--card': card.color }}>
      <div className="tcg-head">
        <span className="tcg-name">{card.name}</span>
        {card.hp && <span className="tcg-hp">HP {card.hp}</span>}
      </div>
      <div className="tcg-art">
        {card.art ? (
          <img src={card.art} alt="" draggable="false" />
        ) : (
          <span className="tcg-art-label">{card.label ?? card.org ?? card.name}</span>
        )}
      </div>
      <div className="tcg-typeline">{TYPE_LABEL[card.type]}</div>
      <div className="tcg-body">
        {isSecret ? (
          <p className="tcg-quote">&ldquo;{card.quote}&rdquo;</p>
        ) : card.move ? (
          <p className="tcg-move">
            <span>{card.move}</span>
            <span>{card.damage}</span>
          </p>
        ) : null}
        <p className="tcg-text">{card.text}</p>
      </div>
      <div className="tcg-foot">
        <span>{setNumber(card)}</span>
        <span title={RARITY_LABEL[card.rarity]}>
          {RARITY_MARK[card.rarity]} {RARITY_LABEL[card.rarity]}
        </span>
      </div>
    </div>
  );
}

function FanCheck({ onPass }) {
  const [question, setQuestion] = useState(() => FAN_QUESTIONS[Math.floor(Math.random() * FAN_QUESTIONS.length)]);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [question]);

  function submit(e) {
    e.preventDefault();
    if (checkFanAnswer(question, answer)) {
      unlockPack();
      playJingle('catch');
      onPass();
      return;
    }
    playFlip();
    setWrong(true);
    setAnswer('');
    // A different question next time, so it can't just be brute-forced.
    setQuestion((cur) => {
      const others = FAN_QUESTIONS.filter((q) => q !== cur);
      return others[Math.floor(Math.random() * others.length)];
    });
  }

  return (
    <form className="fancheck" onSubmit={submit}>
      <span className="booster booster--locked" aria-hidden="true">
        <span className="booster-strip" />
        <span className="booster-body">
          <span className="booster-logo">Owen Lee</span>
          <span className="booster-series">Fans only</span>
        </span>
      </span>
      <p className="fancheck-intro">This pack only opens for Pokémon fans. Prove it:</p>
      <label className="fancheck-q" htmlFor="fancheck-answer">
        {question.q}
      </label>
      <div className="fancheck-row">
        <input
          id="fancheck-answer"
          ref={inputRef}
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setWrong(false);
          }}
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" className="packs-button">
          Answer
        </button>
      </div>
      {wrong && <p className="fancheck-wrong">Not quite! Only true fans may pass. Try this one instead.</p>}
    </form>
  );
}

function PackOpener({ onClose }) {
  const binder = useBinder();
  const [unlocked, setUnlocked] = useState(isPackUnlocked);
  const [view, setView] = useState('pack');
  const [phase, setPhase] = useState('sealed');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState(0);
  const closeRef = useRef(null);
  const tearTimer = useRef(null);

  useEffect(() => () => clearTimeout(tearTimer.current), []);

  const tear = useCallback(() => {
    if (phase !== 'sealed') return;
    const pack = rollPack();
    setCards(pack);
    setFlipped(0);
    setPhase('tearing');
    playTear();
    tearTimer.current = setTimeout(() => setPhase('reveal'), 650);
  }, [phase]);

  const flipNext = useCallback(() => {
    if (phase !== 'reveal' || flipped >= cards.length) return;
    const card = cards[flipped];
    const next = flipped + 1;
    setFlipped(next);
    if (card.rarity === 'secret') playJingle('secret');
    else if (card.rarity === 'holo') playJingle('catch');
    else playFlip();
    if (next === cards.length) {
      addToBinder(cards);
      setPhase('done');
    }
  }, [phase, flipped, cards]);

  function another() {
    setCards([]);
    setFlipped(0);
    setPhase('sealed');
    setView('pack');
  }

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Tab') return;
      e.stopPropagation();
      if (e.key === 'Escape') onClose();
      else if ((e.key === 'Enter' || e.key === ' ') && view === 'pack' && unlocked) {
        e.preventDefault();
        if (phase === 'sealed') tear();
        else flipNext();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      opener?.focus?.();
    };
  }, [onClose, phase, view, tear, flipNext, unlocked]);

  const owned = CARDS.filter((c) => binder[c.id]).length;
  const rareSlot = cards[cards.length - 1];
  const tease = phase === 'reveal' && flipped === cards.length - 1 && rareSlot ? rareSlot.rarity : null;

  return (
    <div className="packs-backdrop" onClick={onClose}>
      <div
        className="packs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="packs-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="packs-head">
          <h2 id="packs-title">{view === 'pack' ? 'Booster Pack' : `Binder ${owned}/${CARDS.length}`}</h2>
          <div className="packs-tabs">
            <button type="button" className={view === 'pack' ? 'is-active' : ''} onClick={() => setView('pack')}>
              Pack
            </button>
            <button type="button" className={view === 'binder' ? 'is-active' : ''} onClick={() => setView('binder')}>
              Binder
            </button>
            <button ref={closeRef} type="button" className="trainer-card-close" onClick={onClose}>
              Close ✕
            </button>
          </div>
        </div>

        {view === 'pack' && !unlocked && (
          <div className="packs-stage">
            <FanCheck onPass={() => setUnlocked(true)} />
          </div>
        )}

        {view === 'pack' && unlocked && (
          <div className="packs-stage">
            {(phase === 'sealed' || phase === 'tearing') && (
              <button
                type="button"
                className={`booster ${phase === 'tearing' ? 'is-tearing' : ''}`}
                onClick={tear}
                aria-label="Tear open the pack"
              >
                <span className="booster-strip" aria-hidden="true" />
                <span className="booster-body" aria-hidden="true">
                  <span className="booster-logo">Owen Lee</span>
                  <span className="booster-series">Trading Card Game · Series 1</span>
                  <span className="booster-count">5 cards</span>
                </span>
              </button>
            )}
            {phase === 'sealed' && <p className="packs-hint">Tap the pack to tear it open.</p>}

            {(phase === 'reveal' || phase === 'done') && (
              <>
                <div className="packs-row">
                  {cards.map((card, i) => {
                    const isUp = i < flipped;
                    const isNext = i === flipped && phase === 'reveal';
                    return (
                      <button
                        key={`${card.id}-${i}`}
                        type="button"
                        className={`packs-slot ${isUp ? 'is-up' : ''} ${isNext ? 'is-next' : ''} ${
                          isNext && tease ? `tease-${tease}` : ''
                        }`}
                        onClick={isNext ? flipNext : undefined}
                        disabled={!isNext}
                        aria-label={isUp ? `${card.name}, ${RARITY_LABEL[card.rarity]}` : isNext ? 'Flip this card' : 'Face-down card'}
                      >
                        <span className="packs-flipper">
                          <span className="packs-face packs-face--back" aria-hidden="true">
                            <span className="card-back" />
                          </span>
                          <span className="packs-face packs-face--front">
                            <TradingCard card={card} />
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {phase === 'reveal' && <p className="packs-hint">Tap the glowing card to flip it.</p>}
                {phase === 'done' && (
                  <div className="packs-actions">
                    {cards.some((c) => c.rarity === 'secret') && (
                      <p className="packs-secret-callout">You pulled the Secret Rare!</p>
                    )}
                    <button type="button" className="packs-button" onClick={another}>
                      Open another pack
                    </button>
                    <button type="button" className="packs-button packs-button--alt" onClick={() => setView('binder')}>
                      View binder
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === 'binder' && (
          <div className="binder">
            {CARDS.map((card) =>
              binder[card.id] ? (
                <div key={card.id} className="binder-slot">
                  <TradingCard card={card} />
                  {binder[card.id] > 1 && <span className="binder-count">×{binder[card.id]}</span>}
                </div>
              ) : (
                <div key={card.id} className={`binder-slot binder-slot--empty binder-slot--${card.rarity}`}>
                  <span className="binder-empty-num">{setNumber(card)}</span>
                  <span className="binder-empty-q">?</span>
                  <span className="binder-empty-rarity">{RARITY_LABEL[card.rarity]}</span>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PackOpener;
