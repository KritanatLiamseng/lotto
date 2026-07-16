'use client';

import React, { useState, useEffect } from 'react';

export default function LuckyGenerator({ lottoType = 'thai' }) {
  const [spinning, setSpinning] = useState(false);
  const [twoDigit, setTwoDigit] = useState('--');
  const [threeDigit, setThreeDigit] = useState('---');
  const [fourDigit, setFourDigit] = useState('----'); // Specific to Lao
  
  // Dynamic number of balls depending on lottery type
  const [visibleBalls, setVisibleBalls] = useState([]);

  // Reset ball view when switcher changes
  useEffect(() => {
    setTwoDigit('--');
    setThreeDigit('---');
    setFourDigit('----');
    
    if (lottoType === 'lao') {
      setVisibleBalls([
        { id: 1, val: '?', color: 'cyan' },
        { id: 2, val: '?', color: 'magenta' },
        { id: 3, val: '?', color: 'gold' },
        { id: 4, val: '?', color: 'cyan' }
      ]);
    } else {
      setVisibleBalls([
        { id: 1, val: '?', color: 'gold' },
        { id: 2, val: '?', color: 'magenta' },
        { id: 3, val: '?', color: 'cyan' }
      ]);
    }
  }, [lottoType]);

  // Synthetic Audio Generator
  const playSound = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn("Audio blocked or not supported:", e);
    }
  };

  const handleGenerate = () => {
    if (spinning) return;
    setSpinning(true);
    playSound('tick');

    const totalBalls = lottoType === 'lao' ? 4 : 3;
    let counter = 0;

    const interval = setInterval(() => {
      // Bouncing dynamic random digits
      const tempBalls = [];
      const colors = ['cyan', 'magenta', 'gold', 'cyan'];
      for (let b = 0; b < totalBalls; b++) {
        tempBalls.push({
          id: b + 1,
          val: Math.floor(Math.random() * 10).toString(),
          color: colors[b % colors.length]
        });
      }
      setVisibleBalls(tempBalls);
      
      setTwoDigit(Math.floor(Math.random() * 90 + 10).toString());
      setThreeDigit(Math.floor(Math.random() * 900 + 100).toString());
      if (lottoType === 'lao') {
        setFourDigit(Math.floor(Math.random() * 9000 + 1000).toString());
      }

      playSound('tick');
      counter++;

      if (counter >= 15) {
        clearInterval(interval);
        
        // Final selection
        const finalDigits = [];
        for (let b = 0; b < totalBalls; b++) {
          finalDigits.push(Math.floor(Math.random() * 10));
        }
        
        const finalTwo = `${finalDigits[0]}${finalDigits[1]}`;
        const finalThree = `${finalDigits[0]}${finalDigits[1]}${finalDigits[2]}`;
        
        const colors = ['cyan', 'magenta', 'gold', 'cyan'];
        setVisibleBalls(finalDigits.map((digit, idx) => ({
          id: idx + 1,
          val: digit.toString(),
          color: colors[idx % colors.length]
        })));

        setTwoDigit(finalTwo);
        setThreeDigit(finalThree);
        if (lottoType === 'lao') {
          const finalFour = `${finalDigits[0]}${finalDigits[1]}${finalDigits[2]}${finalDigits[3]}`;
          setFourDigit(finalFour);
        }
        
        setSpinning(false);
        playSound('success');
      }
    }, 120);
  };

  // Theme settings
  const getThemeStyle = () => {
    switch (lottoType) {
      case 'lao':
        return {
          glow: 'rgba(0, 229, 255, 0.25)',
          glowInner: 'rgba(0, 229, 255, 0.15)',
          btnBackground: 'linear-gradient(135deg, #00E5FF 0%, #0077FF 100%)',
          btnShadow: '0 4px 20px rgba(0, 229, 255, 0.4)',
          btnShadowHover: '0 6px 25px rgba(0, 229, 255, 0.6)',
          machineBorder: '4px solid rgba(0, 229, 255, 0.2)'
        };
      case 'hanoi':
        return {
          glow: 'rgba(255, 0, 127, 0.25)',
          glowInner: 'rgba(255, 0, 127, 0.15)',
          btnBackground: 'linear-gradient(135deg, #FF007F 0%, #FF0000 100%)',
          btnShadow: '0 4px 20px rgba(255, 0, 127, 0.4)',
          btnShadowHover: '0 6px 25px rgba(255, 0, 127, 0.6)',
          machineBorder: '4px solid rgba(255, 0, 127, 0.2)'
        };
      case 'thai':
      default:
        return {
          glow: 'rgba(189, 0, 255, 0.15)',
          glowInner: 'var(--primary-glow)',
          btnBackground: 'linear-gradient(135deg, var(--gold) 0%, #FFA500 100%)',
          btnShadow: '0 4px 20px var(--gold-glow)',
          btnShadowHover: '0 6px 25px rgba(255, 215, 0, 0.6)',
          machineBorder: '4px solid rgba(255, 255, 255, 0.1)'
        };
    }
  };

  const theme = getThemeStyle();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow ambient background */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${theme.glowInner} 0%, transparent 60%)`,
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <h2 style={{ fontSize: '24px', marginBottom: '8px', zIndex: 1, position: 'relative' }}>
          🔮 เครื่องหมุนลูกบอลนำโชค 
          {lottoType === 'lao' ? 'หวยลาว AI' : lottoType === 'hanoi' ? 'หวยฮานอย AI' : 'หวยไทย AI'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', zIndex: 1, position: 'relative' }}>
          กดปุ่มสุ่มเพื่อคำนวณและประมวลผลดึงตัวเลขนำโชคส่วนตัวของคุณ
        </p>

        {/* Lottery Machine cage design */}
        <div style={{
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          border: theme.machineBorder,
          background: 'rgba(255, 255, 255, 0.02)',
          boxShadow: `0 0 30px ${theme.glow}, inset 0 0 20px rgba(0, 0, 0, 0.6)`,
          margin: '0 auto 40px auto',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1
        }}>
          {/* Inner cage rotating */}
          <div style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: '2px dashed rgba(255, 255, 255, 0.15)',
            position: 'absolute',
            animation: spinning ? 'spin 1.2s linear infinite' : 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }} />

          {/* Balls bouncing */}
          <div style={{
            display: 'flex',
            gap: '8px',
            zIndex: 2,
            transform: spinning ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s ease',
            flexWrap: 'nowrap'
          }}>
            {visibleBalls.map(ball => (
              <span
                key={ball.id}
                className={`number-ball ${
                  ball.color === 'gold' ? 'gold-ball' : ball.color === 'magenta' ? 'magenta-ball' : 'cyan-ball'
                }`}
                style={{
                  width: '40px',
                  height: '40px',
                  fontSize: '18px',
                  animation: spinning ? `float ${0.25 + ball.id * 0.08}s ease-in-out infinite` : 'none',
                  margin: 0,
                  color: ball.color === 'gold' && lottoType === 'thai' ? '#000' : '#FFF'
                }}
              >
                {ball.val}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic results rendering depending on lottery type */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: lottoType === 'lao' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '32px',
          zIndex: 1,
          position: 'relative'
        }}>
          {lottoType === 'lao' && (
            <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px 8px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>เลขลาว 4 ตัว</div>
              <div className="numbers-font" style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#00E5FF',
                textShadow: '0 0 10px rgba(0, 229, 255, 0.3)',
                letterSpacing: '2px'
              }}>
                {fourDigit}
              </div>
            </div>
          )}

          <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px 8px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>เลขแนะนำ 3 ตัว</div>
            <div className="numbers-font" style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'var(--gold)',
              textShadow: '0 0 10px var(--gold-glow)',
              letterSpacing: '3px'
            }}>
              {threeDigit}
            </div>
          </div>

          <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px 8px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>เลขแนะนำ 2 ตัว</div>
            <div className="numbers-font" style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: lottoType === 'hanoi' ? '#FF007F' : 'var(--secondary)',
              textShadow: lottoType === 'hanoi' ? '0 0 10px rgba(255, 0, 127, 0.3)' : '0 0 10px var(--secondary-glow)',
              letterSpacing: '2px'
            }}>
              {twoDigit}
            </div>
          </div>
        </div>

        {/* Spin Action Button */}
        <button
          onClick={handleGenerate}
          disabled={spinning}
          style={{
            width: '100%',
            background: theme.btnBackground,
            color: lottoType === 'thai' ? '#000' : '#FFF',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: spinning ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: theme.btnShadow,
            zIndex: 1,
            position: 'relative',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => { if (!spinning) e.currentTarget.style.boxShadow = theme.btnShadowHover; }}
          onMouseOut={(e) => { if (!spinning) e.currentTarget.style.boxShadow = theme.btnShadow; }}
          id="lucky-spin-btn"
        >
          {spinning ? '🎰 กำลังหมุนลูกบอล...' : `🔮 สุ่มเลขนำโชค ${lottoType === 'lao' ? 'หวยลาว' : lottoType === 'hanoi' ? 'หวยฮานอย' : 'หวยไทย'}`}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
