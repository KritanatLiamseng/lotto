'use client';

import React, { useState } from 'react';

// Baseline data
import { lottoHistory, laoLottoHistory, hanoiLottoHistory, getSubDrawsOnly } from './data/lottoHistory';

// Components
import LottoPredictor from './components/LottoPredictor';
import LottoHistory from './components/LottoHistory';
import AIPerformance from './components/AIPerformance';
import LuckyGenerator from './components/LuckyGenerator';
import FamousNumbers from './components/FamousNumbers';

export default function Home() {
  const [activeTab, setActiveTab] = useState('predictor');
  const [activeLotto, setActiveLotto] = useState('thai'); // 'thai', 'lao', 'hanoi'
  const [activeSubLotto, setActiveSubLotto] = useState('thai'); // 'thai', 'star', 'development', 'samakkee', 'special', 'normal', 'vip'

  // Always use 100% fresh baseline database (Zero stale LocalStorage cache on PC or Mobile)
  const databases = {
    thai: lottoHistory,
    lao: laoLottoHistory,
    hanoi: hanoiLottoHistory
  };

  const activeData = databases[activeLotto];
  // Extract sub-draws based on selected active sub-lotto
  const subDataForPredictor = getSubDrawsOnly(activeData, activeLotto, activeSubLotto);

  const getScheduleInfo = () => {
    switch (activeLotto) {
      case 'lao':
        return {
          title: 'กำหนดเวลาออกผลรางวัล: หวยลาว (ลาวสตาร์, ลาวพัฒนา, ลาวสามัคคี)',
          detail: '🇱🇦 ออกรางวัลย่อยตามเวลาจริง: ลาวพัฒนา: จ.-ศ. (20:30) | ลาวสตาร์: ทุกวัน (15:45) | ลาวสามัคคี: อ.,พ.,ศ.,ส.,อา. (21:30)',
          nextDraw: 'ประมวลผลความน่าจะเป็นงวดถัดไป'
        };
      case 'hanoi':
        return {
          title: 'กำหนดเวลาออกผลรางวัล: หวยฮานอย (เวียดนาม)',
          detail: '🇻🇳 ออกรางวัลทุกวัน: ฮานอยพิเศษ (17:15 น.) | ฮานอยปกติ (18:30 น.) | ฮานอย VIP (19:15 น.)',
          nextDraw: 'ประมวลผลความน่าจะเป็นงวดถัดไป'
        };
      case 'thai':
      default:
        return {
          title: 'กำหนดเวลาออกผลรางวัล: สลากกินแบ่งรัฐบาลไทย',
          detail: '🇹🇭 ออกรางวัลประจำวันที่ 1 และ 16 ของทุกเดือน เวลา 14:30 - 16:00 น.',
          nextDraw: 'ประมวลผลความน่าจะเป็นงวดถัดไป'
        };
    }
  };

  const currentSchedule = getScheduleInfo();

  return (
    <div className="container" style={{
      transition: 'all 0.5s ease',
      borderTop: `6px solid ${
        activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F'
      }`
    }}>
      {/* Top Level Lottery Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        margin: '10px 0 24px 0',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'thai', label: '🇹🇭 หวยรัฐบาลไทย', glow: 'var(--gold-glow)' },
          { id: 'lao', label: '🇱🇦 หวยลาว', glow: 'rgba(0, 229, 255, 0.3)' },
          { id: 'hanoi', label: '🇻🇳 หวยฮานอย', glow: 'rgba(255, 0, 127, 0.3)' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveLotto(item.id);
              if (item.id === 'thai') setActiveSubLotto('thai');
              else if (item.id === 'lao') setActiveSubLotto('development');
              else if (item.id === 'hanoi') setActiveSubLotto('normal');
            }}
            style={{
              background: activeLotto === item.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${
                activeLotto === item.id 
                  ? (item.id === 'thai' ? 'var(--gold)' : item.id === 'lao' ? '#00E5FF' : '#FF007F')
                  : 'var(--border-card)'
              }`,
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: activeLotto === item.id ? '600' : '400',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              transition: 'all 0.3s ease',
              boxShadow: activeLotto === item.id ? `0 0 15px ${item.glow}` : 'none'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Sub-lotto Round Selector (for Lao & Hanoi) */}
      {(activeLotto === 'lao' || activeLotto === 'hanoi') && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          margin: '-12px 0 24px 0',
          flexWrap: 'wrap'
        }}>
          {activeLotto === 'lao' ? (
            [
              { id: 'star', label: '🟠 ลาวสตาร์ (ทุกวัน 15:45 น.)' },
              { id: 'development', label: '🟡 หวยลาวพัฒนา (จ.-ศ. 20:30 น.)' },
              { id: 'samakkee', label: '🟣 ลาวสามัคคี (อ.,พ.,ศ.,ส.,อา. 21:30 น.)' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSubLotto(sub.id)}
                style={{
                  background: activeSubLotto === sub.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${activeSubLotto === sub.id ? '#00E5FF' : 'var(--border-card)'}`,
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeSubLotto === sub.id ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                {sub.label}
              </button>
            ))
          ) : (
            [
              { id: 'special', label: '🟣 ฮานอยพิเศษ (17:15 น.)' },
              { id: 'normal', label: '🔴 ฮานอยปกติ (18:30 น.)' },
              { id: 'vip', label: '🟡 ฮานอย VIP (19:15 น.)' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSubLotto(sub.id)}
                style={{
                  background: activeSubLotto === sub.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${activeSubLotto === sub.id ? '#FF007F' : 'var(--border-card)'}`,
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeSubLotto === sub.id ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                {sub.label}
              </button>
            ))
          )}
        </div>
      )}

      {/* Header Section */}
      <header className="header">
        <div className="logo-container">
          <span style={{ fontSize: '32px' }}>
            {activeLotto === 'thai' ? '🔮' : activeLotto === 'lao' ? '🇱🇦' : '🇻🇳'}
          </span>
          <div>
            <h1 className="logo-text" style={{
              background: activeLotto === 'thai' 
                ? 'linear-gradient(135deg, var(--gold) 0%, #FFA500 50%, var(--primary) 100%)' 
                : activeLotto === 'lao' 
                ? 'linear-gradient(135deg, #00E5FF 0%, #0077FF 100%)'
                : 'linear-gradient(135deg, #FF007F 0%, #FF0000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              LottoOracle AI Super v4
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ระบบวิเคราะห์ AI แม่นยำสูงพิเศษคำนวณเปรียบเทียบสถิติย้อนหลังสดใหม่ 100%
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="draw-badge" style={{
            borderColor: activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F',
            color: activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F',
            boxShadow: activeLotto === 'thai' ? '0 0 10px var(--gold-glow)' : activeLotto === 'lao' ? '0 0 10px rgba(0, 229, 255, 0.2)' : '0 0 10px rgba(255, 0, 127, 0.2)'
          }}>
            <span className="dot" style={{
              backgroundColor: activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F'
            }}></span>
            <span>สถานะ: ประมวลผลสดใหม่ 100%</span>
          </div>
        </div>
      </header>

      {/* Announcements Schedules Panel */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        padding: '16px 24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          fontSize: '24px',
          background: 'rgba(255,255,255,0.05)',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          📢
        </div>
        <div>
          <h3 style={{ fontSize: '14px', color: '#FFF', margin: 0, fontWeight: '600' }}>
            {currentSchedule.title}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {currentSchedule.detail}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'predictor' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictor')}
        >
          📊 วิเคราะห์ความน่าจะเป็น
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 ประวัติเลขย้อนหลัง
        </button>
        <button
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          🎯 ผลงาน AI ย้อนหลัง
        </button>
        <button
          className={`tab-btn ${activeTab === 'fortune' ? 'active' : ''}`}
          onClick={() => setActiveTab('fortune')}
        >
          🎰 หมุนวงล้อนำโชค
        </button>
        <button
          className={`tab-btn ${activeTab === 'famous' ? 'active' : ''}`}
          onClick={() => setActiveTab('famous')}
        >
          🔥 เลขเด็ดสำนักดัง
        </button>
      </nav>

      {/* Main Content Area */}
      <main>
        {activeTab === 'predictor' && (
          <LottoPredictor lottoType={activeLotto} lottoData={subDataForPredictor} />
        )}

        {activeTab === 'history' && (
          <LottoHistory 
            lottoType={activeLotto} 
            lottoData={activeData}
            historyData={activeData} 
            activeSubLotto={activeSubLotto} 
          />
        )}

        {activeTab === 'performance' && (
          <AIPerformance 
            lottoType={activeLotto} 
            lottoData={subDataForPredictor}
            historyData={subDataForPredictor} 
            activeSubLotto={activeSubLotto}
          />
        )}

        {activeTab === 'fortune' && (
          <LuckyGenerator lottoType={activeLotto} />
        )}

        {activeTab === 'famous' && (
          <FamousNumbers lottoType={activeLotto} />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>LottoOracle AI Super Engine v4 • ระบบวิเคราะห์ทางสถิติเพื่อความบันเทิงเท่านั้น</p>
      </footer>
    </div>
  );
}
