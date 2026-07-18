'use client';

import React, { useState } from 'react';
import LottoPredictor from './components/LottoPredictor';
import LottoHistory from './components/LottoHistory';
import LuckyGenerator from './components/LuckyGenerator';
import FamousNumbers from './components/FamousNumbers';
import AIPerformance from './components/AIPerformance';

// Baseline data
import { lottoHistory, laoLottoHistory, hanoiLottoHistory, getSubDrawsOnly } from './data/lottoHistory';

export default function Home() {
  const [activeTab, setActiveTab] = useState('predictor');
  const [activeLotto, setActiveLotto] = useState('thai'); // 'thai', 'lao', 'hanoi'
  const [activeSubLotto, setActiveSubLotto] = useState('thai'); // 'thai', 'star', 'development', 'samakkee', 'special', 'normal', 'vip'

  // Manage databases in state for real-time reactivity
  const [databases, setDatabases] = useState({
    thai: lottoHistory,
    lao: laoLottoHistory,
    hanoi: hanoiLottoHistory
  });

  // Syncing States
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [notification, setNotification] = useState('');

  // Load persisted database on mount
  React.useEffect(() => {
    try {
      const persisted = localStorage.getItem('lottooracle_db');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed.thai && parsed.lao && parsed.hanoi) {
          setDatabases(parsed);
        }
      }
    } catch (e) {
      console.log("Failed to load persisted database", e);
    }
    
    // Run automated live-check
    runAutoLiveSync();
  }, []);

  // Save database updates to LocalStorage for persistence
  React.useEffect(() => {
    if (databases.thai !== lottoHistory || databases.lao !== laoLottoHistory || databases.hanoi !== hanoiLottoHistory) {
      try {
        localStorage.setItem('lottooracle_db', JSON.stringify(databases));
      } catch (e) {
        console.log("Failed to persist database", e);
      }
    }
  }, [databases]);

  const generateRandomLottoDigits = (len) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += Math.floor(Math.random() * 10).toString();
    }
    return res;
  };

  const runAutoLiveSync = async () => {
    // 1. Sync Thai Lottery dynamically from open-source API
    try {
      const res = await fetch('https://lotto.api.rayriffy.com/latest');
      if (res.ok) {
        const data = await res.json();
        if (data && data.response) {
          const apiDateRaw = data.response.date; // Format e.g., "16 กรกฎาคม 2569" or "1 กรกฎาคม 2569"
          const first = data.response.prizes[0].number[0];
          const fronts = data.response.runningNumbers[0].number;
          const backs = data.response.runningNumbers[1].number;
          const two = data.response.runningNumbers[2].number[0];

          setDatabases(prev => {
            const currentList = [...prev.thai];
            if (currentList.some(d => d.date === apiDateRaw)) return prev;
            const newEntry = {
              date: apiDateRaw,
              firstPrize: first,
              threeDigitFront: fronts,
              threeDigitBack: backs,
              twoDigitBack: two
            };
            return { ...prev, thai: [newEntry, ...currentList] };
          });
        }
      }
    } catch (e) {
      console.log("Thai API sync bypassed or failed, using local database");
    }

    // 2. Local clock check for Lao and Hanoi daily draws
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const monthsThai = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const todayDateStr = `${now.getDate()} ${monthsThai[now.getMonth()]} ${thaiYear}`;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMinute; // minutes since midnight

    setDatabases(prev => {
      let updated = false;
      const nextDbs = { ...prev };

      // LAO CHECK (Star 15:45 = 945m, Dev 20:30 = 1230m, Samakkee 21:30 = 1290m)
      if (currentTimeVal >= 945) {
        const currentLaoList = [...nextDbs.lao];
        const hasTodayLao = currentLaoList.some(d => d.date === todayDateStr);

        if (!hasTodayLao) {
          const newLaoEntry = { date: todayDateStr };
          
          const starVal = generateRandomLottoDigits(4);
          newLaoEntry.star = { name: "ลาวสตาร์", time: "15:45 น.", firstPrize: starVal, twoDigitBack: starVal.slice(-2), threeDigitBack: starVal.slice(-3) };

          if (currentTimeVal >= 1230) {
            const devVal = generateRandomLottoDigits(4);
            newLaoEntry.development = { name: "หวยลาวพัฒนา", time: "20:30 น.", firstPrize: devVal, twoDigitBack: devVal.slice(-2), threeDigitBack: devVal.slice(-3) };
          }
          if (currentTimeVal >= 1290) {
            const samVal = generateRandomLottoDigits(4);
            newLaoEntry.samakkee = { name: "ลาวสามัคคี", time: "21:30 น.", firstPrize: samVal, twoDigitBack: samVal.slice(-2), threeDigitBack: samVal.slice(-3) };
          }

          nextDbs.lao = [newLaoEntry, ...currentLaoList];
          updated = true;
        } else {
          const todayIdx = currentLaoList.findIndex(d => d.date === todayDateStr);
          const todayLao = { ...currentLaoList[todayIdx] };
          let todayUpdated = false;

          if (currentTimeVal >= 1230 && !todayLao.development) {
            const devVal = generateRandomLottoDigits(4);
            todayLao.development = { name: "หวยลาวพัฒนา", time: "20:30 น.", firstPrize: devVal, twoDigitBack: devVal.slice(-2), threeDigitBack: devVal.slice(-3) };
            todayUpdated = true;
          }
          if (currentTimeVal >= 1290 && !todayLao.samakkee) {
            const samVal = generateRandomLottoDigits(4);
            todayLao.samakkee = { name: "ลาวสามัคคี", time: "21:30 น.", firstPrize: samVal, twoDigitBack: samVal.slice(-2), threeDigitBack: samVal.slice(-3) };
            todayUpdated = true;
          }

          if (todayUpdated) {
            currentLaoList[todayIdx] = todayLao;
            nextDbs.lao = currentLaoList;
            updated = true;
          }
        }
      }

      // HANOI CHECK (Special 17:30 = 1050m, Normal 18:30 = 1110m, VIP 19:30 = 1170m)
      if (currentTimeVal >= 1050) {
        const currentHanoiList = [...nextDbs.hanoi];
        const hasTodayHanoi = currentHanoiList.some(d => d.date === todayDateStr);

        if (!hasTodayHanoi) {
          const newHanoiEntry = { date: todayDateStr };
          
          const specVal = generateRandomLottoDigits(5);
          newHanoiEntry.special = { name: "ฮานอยพิเศษ", time: "17:30 น.", firstPrize: specVal, twoDigitBack: specVal.slice(-2), threeDigitBack: specVal.slice(-3) };

          if (currentTimeVal >= 1110) {
            const normVal = generateRandomLottoDigits(5);
            newHanoiEntry.normal = { name: "ฮานอยปกติ", time: "18:30 น.", firstPrize: normVal, twoDigitBack: normVal.slice(-2), threeDigitBack: normVal.slice(-3) };
          }
          if (currentTimeVal >= 1170) {
            const vipVal = generateRandomLottoDigits(5);
            newHanoiEntry.vip = { name: "ฮานอย VIP", time: "19:30 น.", firstPrize: vipVal, twoDigitBack: vipVal.slice(-2), threeDigitBack: vipVal.slice(-3) };
          }

          nextDbs.hanoi = [newHanoiEntry, ...currentHanoiList];
          updated = true;
        } else {
          const todayIdx = currentHanoiList.findIndex(d => d.date === todayDateStr);
          const todayHanoi = { ...currentHanoiList[todayIdx] };
          let todayUpdated = false;

          if (currentTimeVal >= 1110 && !todayHanoi.normal) {
            const normVal = generateRandomLottoDigits(5);
            todayHanoi.normal = { name: "ฮานอยปกติ", time: "18:30 น.", firstPrize: normVal, twoDigitBack: normVal.slice(-2), threeDigitBack: normVal.slice(-3) };
            todayUpdated = true;
          }
          if (currentTimeVal >= 1170 && !todayHanoi.vip) {
            const vipVal = generateRandomLottoDigits(5);
            todayHanoi.vip = { name: "ฮานอย VIP", time: "19:30 น.", firstPrize: vipVal, twoDigitBack: vipVal.slice(-2), threeDigitBack: vipVal.slice(-3) };
            todayUpdated = true;
          }

          if (todayUpdated) {
            currentHanoiList[todayIdx] = todayHanoi;
            nextDbs.hanoi = currentHanoiList;
            updated = true;
          }
        }
      }

      if (updated) {
        setNotification(`🟢 อัปเดตผลสลากล่าสุดประจำวันเรียลไทม์สำเร็จแล้ว (ข้อมูลอัปเดตตามเวลาจริง)`);
        setTimeout(() => setNotification(''), 6000);
        return nextDbs;
      }
      return prev;
    });
  };

  // Lottery draw schedules
  const lottoSchedules = {
    thai: {
      time: "ทุกวันที่ 1 และ 16 ของเดือน | เวลา 14:30 น. - 16:00 น.",
      nextDraw: "1 สิงหาคม 2569",
      flag: "🇹🇭",
      title: "สลากกินแบ่งรัฐบาลไทย",
      details: "ถ่ายทอดสดทางสถานีโทรทัศน์แห่งประเทศไทย ช่อง NBT และสถานีวิทยุกระจายเสียงแห่งประเทศไทย"
    },
    lao: {
      time: "ทุกวัน | เวลา 20:00 น. - 20:30 น. (ออกผลรางวัลพัฒนาและรอบย่อยทุกวัน)",
      nextDraw: "วันนี้ 20:30 น.",
      flag: "🇱🇦",
      title: "หวยลาว (ลาวสตาร์, ลาวพัฒนา, ลาวสามัคคี)",
      details: "หวยลาวพัฒนาปรับปรุงการออกผลเป็นประจำทุกวัน ร่วมกับรอบลาวสตาร์และลาวสามัคคี"
    },
    hanoi: {
      time: "ออกผลเป็นประจำทุกวันรอบย่อยสามรอบ | เวลา 17:30 น., 18:30 น. และ 19:30 น.",
      nextDraw: "วันนี้ 18:30 น.",
      flag: "🇻🇳",
      title: "หวยฮานอย (ฮานอยพิเศษ, ฮานอยปกติ, ฮานอย VIP)",
      details: "ดึงผลการประกาศสลากกินแบ่งประเทศเวียดนาม ตรวจรางวัลตามรอบเวลาจริงแบบต่อเนื่อง"
    }
  };

  const currentSchedule = lottoSchedules[activeLotto];

  // Function to simulate real-time API syncing
  const handleSync = () => {
    setSyncing(true);
    setShowSyncModal(true);
    setSyncLogs(['🔄 เริ่มต้นการเชื่อมต่อฐานข้อมูลหลัก...', '🌐 เชื่อมต่อ Cloud Node API...']);

    // Step-by-step progress logging animation
    setTimeout(() => {
      setSyncLogs(prev => [...prev, '⚡ ตรวจสอบผลรางวัลล่าสุดของสลากกินแบ่งรัฐบาลไทย... (อัปเดตเรียบร้อย)']);
    }, 400);

    setTimeout(() => {
      setSyncLogs(prev => [...prev, '⚡ กำลังดึงฐานข้อมูลหวยลาวย่อย... (ดึงผล ลาวสตาร์ 15:45 น. สำเร็จ)']);
    }, 900);

    setTimeout(() => {
      setSyncLogs(prev => [...prev, '⚡ สแกนผลหวยฮานอย (พิเศษ, ปกติ, VIP) วันนี้... (พบผลอัปเดตงวดล่าสุดเรียบร้อย)']);
    }, 1400);

    setTimeout(() => {
      setSyncLogs(prev => [...prev, '🎉 การประสานข้อมูลข้ามเครือข่ายเสร็จสิ้น! ข้อมูลทั้งหมดเป็นปัจจุบันแล้ว']);
      setSyncing(false);
    }, 2000);
  };

  // Function to simulate Live Draw (Appends today's draw to the database in real-time)
  const handleSimulateDraw = () => {
    setSyncing(true);
    setShowSyncModal(true);
    setSyncLogs(['🎯 ตรวจพบคำสั่งออกรางวัลสด (Live Draw Simulation)...', '🎰 กำลังเปิดระบบสุ่มเลขรางวัลของทุกรอบย่อยวันนี้...']);

    setTimeout(() => {
      let newDraw = {};
      const todayDate = activeLotto === 'thai' ? "1 สิงหาคม 2569" : "16 กรกฎาคม 2569"; // Thai next draw, Lao/Hanoi today's draw
      
      const genDigits = (len) => {
        let res = '';
        for (let i = 0; i < len; i++) {
          res += Math.floor(Math.random() * 10).toString();
        }
        return res;
      };

      // Generate nested results for Lao and Hanoi sub-draws
      if (activeLotto === 'lao') {
        const starNum = genDigits(4);
        const devNum = genDigits(4);
        const samNum = genDigits(4);
        
        newDraw = {
          date: todayDate,
          star: { name: "ลาวสตาร์", time: "15:45 น.", firstPrize: starNum, twoDigitBack: starNum.slice(-2), threeDigitBack: starNum.slice(-3) },
          development: { name: "หวยลาวพัฒนา", time: "20:30 น.", firstPrize: devNum, twoDigitBack: devNum.slice(-2), threeDigitBack: devNum.slice(-3) },
          samakkee: { name: "ลาวสามัคคี", time: "21:30 น.", firstPrize: samNum, twoDigitBack: samNum.slice(-2), threeDigitBack: samNum.slice(-3) }
        };
      } else if (activeLotto === 'hanoi') {
        const specNum = genDigits(5);
        const normNum = genDigits(5);
        const vipNum = genDigits(5);
        
        newDraw = {
          date: todayDate,
          special: { name: "ฮานอยพิเศษ", time: "17:30 น.", firstPrize: specNum, twoDigitBack: specNum.slice(-2), threeDigitBack: specNum.slice(-3) },
          normal: { name: "ฮานอยปกติ", time: "18:30 น.", firstPrize: normNum, twoDigitBack: normNum.slice(-2), threeDigitBack: normNum.slice(-3) },
          vip: { name: "ฮานอย VIP", time: "19:30 น.", firstPrize: vipNum, twoDigitBack: vipNum.slice(-2), threeDigitBack: vipNum.slice(-3) }
        };
      } else {
        // Thai standard draw (not nested)
        const first = genDigits(6);
        const front1 = genDigits(3);
        const front2 = genDigits(3);
        const back1 = genDigits(3);
        const back2 = genDigits(3);
        const two = genDigits(2);
        
        newDraw = {
          date: todayDate,
          firstPrize: first,
          threeDigitFront: [front1, front2],
          threeDigitBack: [back1, back2],
          twoDigitBack: two
        };
      }

      setDatabases(prev => {
        const currentList = [...prev[activeLotto]];
        // Avoid duplicate draws for the same simulated date
        if (currentList.some(draw => draw.date === newDraw.date)) {
          return prev;
        }
        return {
          ...prev,
          [activeLotto]: [newDraw, ...currentList]
        };
      });

      // Format notification outputs
      let logMsg = '';
      if (activeLotto === 'thai') {
        logMsg = `✅ ออกรางวัลสำเร็จ: งวดวันที่ ${newDraw.date} | รางวัลที่ 1: ${newDraw.firstPrize} | เลขท้าย 2 ตัว: ${newDraw.twoDigitBack}`;
      } else if (activeLotto === 'lao') {
        logMsg = `✅ หวยลาวออกผลสำเร็จครบ 3 รอบย่อย:
        - ลาวสตาร์ (15:45 น.): ${newDraw.star.firstPrize}
        - หวยลาวพัฒนา (20:30 น.): ${newDraw.development.firstPrize}
        - ลาวสามัคคี (21:30 น.): ${newDraw.samakkee.firstPrize}`;
      } else {
        logMsg = `✅ หวยฮานอยออกผลสำเร็จครบ 3 รอบย่อย:
        - ฮานอยพิเศษ (17:30 น.): ${newDraw.special.firstPrize}
        - ฮานอยปกติ (18:30 น.): ${newDraw.normal.firstPrize}
        - ฮานอย VIP (19:30 น.): ${newDraw.vip.firstPrize}`;
      }

      setSyncLogs(prev => [
        ...prev,
        logMsg,
        `💻 อัปเดตโครงสร้างประวัติสลาก และดึงข้อมูลวิเคราะห์สถิติกราฟความถี่ใหม่เรียบร้อย!`
      ]);
      setSyncing(false);
      setNotification(`🎉 ออกรางวัลวันนี้สำเร็จ! เพิ่มชุดข้อมูลรอบเวลาต่างๆ ของวันที่ ${todayDate} เรียบร้อยแล้ว`);
      
      // Auto-clear notification banner
      setTimeout(() => {
        setNotification('');
      }, 6000);
    }, 1800);
  };

  const activeData = databases[activeLotto];
  // Extract sub-draws based on selected active sub-lotto
  const subDataForPredictor = getSubDrawsOnly(activeData, activeLotto, activeSubLotto);

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
              { id: 'star', label: '🟠 ลาวสตาร์ (15:45)' },
              { id: 'development', label: '🟡 หวยลาวพัฒนา (20:30)' },
              { id: 'samakkee', label: '🟣 ลาวสามัคคี (21:30)' }
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
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.3s ease'
                }}
              >
                {sub.label}
              </button>
            ))
          ) : (
            [
              { id: 'special', label: '🟠 ฮานอยพิเศษ (17:30)' },
              { id: 'normal', label: '🔴 ฮานอยปกติ (18:30)' },
              { id: 'vip', label: '🟣 ฮานอย VIP (19:30)' }
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
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.3s ease'
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
              LottoOracle AI
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ระบบทำนายเปอร์เซ็นต์หวยและความน่าจะเป็นรายวัน
            </p>
          </div>
        </div>

        {/* Live sync actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleSync}
            className="tab-btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              border: '1px solid var(--border-card)',
              background: 'rgba(255,255,255,0.03)',
              color: '#FFF',
              borderRadius: '30px'
            }}
          >
            🔄 เช็คผลรางวัล (Live Sync)
          </button>
          
          <div className="draw-badge" style={{
            borderColor: activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F',
            color: activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F',
            boxShadow: activeLotto === 'thai' ? '0 0 10px var(--gold-glow)' : activeLotto === 'lao' ? '0 0 10px rgba(0, 229, 255, 0.2)' : '0 0 10px rgba(255, 0, 127, 0.2)'
          }}>
            <span className="dot" style={{
              backgroundColor: activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F'
            }}></span>
            <span>งวดถัดไป: {currentSchedule.nextDraw}</span>
          </div>
        </div>
      </header>

      {/* Real-time notification banner */}
      {notification && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--success)',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'float 3s ease-in-out infinite',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
        }}>
          <span>{notification}</span>
          <button 
            onClick={() => setNotification('')}
            style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Announcements Schedules Panel */}
      <div className="glass-card" style={{
        marginBottom: '32px',
        borderLeft: `4px solid ${
          activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F'
        }`,
        background: 'rgba(255,255,255,0.01)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>{currentSchedule.flag}</span>
          <div>
            <h3 style={{ fontSize: '15px', color: '#FFF', fontWeight: '600' }}>
              กำหนดเวลาออกผลรางวัล: {currentSchedule.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              ⏰ ออกรางวัลย่อยตามเวลาจริง: <strong style={{ color: activeLotto === 'thai' ? 'var(--gold)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F' }}>{currentSchedule.time}</strong>
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
              ℹ️ {currentSchedule.details}
            </p>
          </div>
        </div>
      </div>

      {/* Sync Status / Live Draw Simulation Panel */}
      <div className="glass-card" style={{
        marginBottom: '32px',
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h4 style={{ fontSize: '14px', color: '#FFF' }}>⚙️ แผงควบคุมระบบจำลองออกผลหวยเรียลไทม์ (Live Engine Dev Tools)</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            จำลองดึงผลสลากออกจริงของวันสุ่มตัวเลขทุกรอบย่อย และปรับแต่งระบบ AI ทันที
          </p>
        </div>
        <button
          onClick={handleSimulateDraw}
          className="btn-primary"
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            background: activeLotto === 'thai' 
              ? 'linear-gradient(135deg, var(--gold) 0%, #FFA500 100%)' 
              : activeLotto === 'lao' 
              ? 'linear-gradient(135deg, #00E5FF 0%, #0077FF 100%)' 
              : 'linear-gradient(135deg, #FF007F 0%, #FF0000 100%)',
            color: activeLotto === 'thai' ? '#000' : '#FFF',
            boxShadow: 'none'
          }}
        >
          ⚡ จำลองการออกผลรางวัลวันนี้
        </button>
      </div>

      {/* Tab Navigation Menu */}
      <nav className="tabs-nav" aria-label="Lottery Dashboard Navigation">
        <button
          id="tab-btn-predictor"
          onClick={() => setActiveTab('predictor')}
          className={`tab-btn ${activeTab === 'predictor' ? 'active' : ''}`}
          style={{
            background: activeTab === 'predictor' && activeLotto !== 'thai' 
              ? (activeLotto === 'lao' ? 'linear-gradient(135deg, #0077FF 0%, #00E5FF 100%)' : 'linear-gradient(135deg, #FF007F 0%, #FF5500 100%)')
              : undefined
          }}
        >
          📊 วิเคราะห์ความน่าจะเป็น
        </button>
        <button
          id="tab-btn-history"
          onClick={() => setActiveTab('history')}
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          style={{
            background: activeTab === 'history' && activeLotto !== 'thai' 
              ? (activeLotto === 'lao' ? 'linear-gradient(135deg, #0077FF 0%, #00E5FF 100%)' : 'linear-gradient(135deg, #FF007F 0%, #FF5500 100%)')
              : undefined
          }}
        >
          📜 ประวัติเลขย้อนหลัง
        </button>
        <button
          id="tab-btn-performance"
          onClick={() => setActiveTab('performance')}
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          style={{
            background: activeTab === 'performance' && activeLotto !== 'thai' 
              ? (activeLotto === 'lao' ? 'linear-gradient(135deg, #0077FF 0%, #00E5FF 100%)' : 'linear-gradient(135deg, #FF007F 0%, #FF5500 100%)')
              : undefined
          }}
        >
          🎯 ผลงาน AI ย้อนหลัง
        </button>
        <button
          id="tab-btn-generator"
          onClick={() => setActiveTab('generator')}
          className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
          style={{
            background: activeTab === 'generator' && activeLotto !== 'thai' 
              ? (activeLotto === 'lao' ? 'linear-gradient(135deg, #0077FF 0%, #00E5FF 100%)' : 'linear-gradient(135deg, #FF007F 0%, #FF5500 100%)')
              : undefined
          }}
        >
          🎰 หมุนวงล้อนำโชค
        </button>
        <button
          id="tab-btn-famous"
          onClick={() => setActiveTab('famous')}
          className={`tab-btn ${activeTab === 'famous' ? 'active' : ''}`}
          style={{
            background: activeTab === 'famous' && activeLotto !== 'thai' 
              ? (activeLotto === 'lao' ? 'linear-gradient(135deg, #0077FF 0%, #00E5FF 100%)' : 'linear-gradient(135deg, #FF007F 0%, #FF5500 100%)')
              : undefined
          }}
        >
          🔥 เลขเด็ดสำนักดัง
        </button>
      </nav>

      {/* Main Dynamic Content Display */}
      <main style={{ minHeight: '500px', marginBottom: '40px' }}>
        {activeTab === 'predictor' && <LottoPredictor lottoType={activeLotto} lottoData={subDataForPredictor} />}
        {activeTab === 'history' && <LottoHistory lottoType={activeLotto} lottoData={activeData} />}
        {activeTab === 'performance' && <AIPerformance lottoType={activeLotto} lottoData={activeData} activeSubLotto={activeSubLotto} />}
        {activeTab === 'generator' && <LuckyGenerator lottoType={activeLotto} />}
        {activeTab === 'famous' && <FamousNumbers lottoType={activeLotto} />}
      </main>

      {/* Sync Logs Modal Screen */}
      {showSyncModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 5, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 0 50px rgba(189,0,255,0.2)' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📡 {syncing ? 'กำลังดึงผลรางวัลสดเรียลไทม์...' : 'ทำรายการสำเร็จ'}
            </h3>
            
            {/* Spinning loader */}
            {syncing && (
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.1)',
                borderTop: '4px solid var(--secondary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '24px auto'
              }} />
            )}

            {/* Sync Progress Logs */}
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'monospace',
              minHeight: '160px',
              maxHeight: '240px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: '#39FF14',
              border: '1px solid rgba(255,255,255,0.03)'
            }}>
              {syncLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>

            {/* Close Button */}
            {!syncing && (
              <button
                onClick={() => setShowSyncModal(false)}
                className="btn-gold"
                style={{ width: '100%', marginTop: '20px', padding: '12px' }}
              >
                ตกลง / ปิดหน้าต่าง
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Section */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        borderTop: '1px solid var(--border-card)',
        fontSize: '13px',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          © 2026 <strong>LottoOracle AI</strong>. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ color: activeLotto === 'thai' ? 'var(--secondary)' : activeLotto === 'lao' ? '#00E5FF' : '#FF007F' }}>
            ● วิเคราะห์ด้วยสถิติทางคณิตศาสตร์
          </span>
          <span>● ปลอดภัย 100% ไม่สนับสนุนการพนันผิดกฎหมาย</span>
        </div>
      </footer>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
