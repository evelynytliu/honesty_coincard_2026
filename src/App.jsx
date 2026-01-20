import React, { useState, useEffect } from 'react';
import { supabase } from './db/supabaseClient';
import './index.css';
import AdminOrders from './AdminOrders';

// Importing images
import cardAFront from './assets/card_a_front.png';
import cardABack from './assets/card_a_back.png';
import cardBFront from './assets/card_b_front.png';
import cardBBack from './assets/card_b_back.png';
import heroImg from './assets/hero.png';

const PRICING_TIERS = [
  { min: 1500, price: 2.5 },
  { min: 1000, price: 3.0 },
  { min: 500, price: 3.5 },
  { min: 300, price: 5.0 },
  { min: 200, price: 7.0 },
  { min: 0, price: 7.0 }, // Fallback for low quantities
];

function getPricePerUnit(totalQty) {
  const tier = PRICING_TIERS.find(t => totalQty >= t.min);
  return tier ? tier.price : 7.0;
}

function App() {
  // Simple check for admin page query param
  const isAdmin = new URLSearchParams(window.location.search).get('page') === 'admin';

  if (isAdmin) {
    return <AdminOrders />;
  }
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [qtyA, setQtyA] = useState(0);
  const [qtyB, setQtyB] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  // Add separate counters for stats
  const [totalSystemCountA, setTotalSystemCountA] = useState(0);
  const [totalSystemCountB, setTotalSystemCountB] = useState(0);
  const totalSystemCount = totalSystemCountA + totalSystemCountB;
  const [lightboxImg, setLightboxImg] = useState(null); // New state for lightbox

  // Derived state
  // Derived state
  const totalQty = (parseInt(qtyA) || 0) + (parseInt(qtyB) || 0);
  // Price is based on the GRAND TOTAL (System + Current User), "Group Buy" logic
  // If totalSystemCount is 0 (initial load), it might default to lowest tier until fetched
  const currentGrandTotal = totalSystemCount + totalQty;
  const pricePerUnit = getPricePerUnit(currentGrandTotal);
  const activeTier = PRICING_TIERS.find(t => currentGrandTotal >= t.min);
  const currentTierMin = activeTier ? activeTier.min : 0;
  const totalPrice = Math.ceil(totalQty * pricePerUnit);

  // Fetch initial total and subscribe
  useEffect(() => {
    fetchTotal();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cny_card_orders',
        },
        (payload) => {
          // Optimistically update or re-fetch
          // payload.new contains the new row
          setTotalSystemCountA((prev) => prev + (payload.new.card_type_a_qty || 0));
          setTotalSystemCountB((prev) => prev + (payload.new.card_type_b_qty || 0));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTotal() {
    // We fetch all rows to calculate specific totals for A and B
    // This allows us to show the breakdown correctly (Gold Horse vs Money Horse)
    const { data: rows, error: tableError } = await supabase
      .from('cny_card_orders')
      .select('card_type_a_qty, card_type_b_qty');

    if (!tableError && rows) {
      let sumA = 0;
      let sumB = 0;
      rows.forEach(r => {
        sumA += (r.card_type_a_qty || 0);
        sumB += (r.card_type_b_qty || 0);
      });
      setTotalSystemCountA(sumA);
      setTotalSystemCountB(sumB);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalQty <= 0) {
      alert("請至少輸入數量");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('cny_card_orders').insert([
      {
        name,
        department,
        card_type_a_qty: qtyA,
        card_type_b_qty: qtyB,
        total_price: totalPrice
      }
    ]);

    if (error) {
      console.error(error);
      alert("訂購失敗，請稍後再試或聯繫管理員。\n" + error.message);
    } else {
      setSuccess(true);
      // Reset form
      setName('');
      setDepartment('');
      setQtyA(0);
      setQtyB(0);
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <div className="glass-card">
          <h1 style={{ color: 'var(--primary-red)' }}>🎉 預訂成功！</h1>
          <p className="subtitle">感謝您的支持，金馬呈祥，馬上有錢！</p>
          <button className="submit-btn" onClick={() => setSuccess(false)}>
            繼續預訂
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main-wrapper">
      <div className="hero-section">
        <img src={heroImg} alt="2026 Year of the Horse" className="hero-image" />
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>2026 金馬呈祥 · 萬事如意</h1>
            <p className="subtitle" style={{ marginBottom: 0 }}>Designed for 大誠保險經紀人</p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} className="lightbox-img" alt="Enlarged view" />
        </div>
      )}

      <div className="content-container">

        {/* Intro Text - Magazine Style Drop Cap */}
        {/* Intro Text - Magazine Style Drop Cap */}
        <div className="glass-card intro-card">
          <p className="intro-text">
            <span className="drop-cap">迎</span>
            接充滿希望的 2026 馬年，讓我們以「金馬呈祥」與「馬上有錢」這兩款一元賀歲小卡，
            表達對夥伴與客戶最真摯的祝福。
          </p>
        </div>

        {/* 2. Card Design Details (Moved Up) */}
        <div className="glass-card large-preview-section">
          <h4 className="preview-title" style={{ marginTop: 0 }}>卡片設計細節 Preview</h4>

          <div style={{ marginBottom: '2rem' }}>
            <div className="preview-label">Design A: 金馬呈祥</div>
            <div className="swipe-hint">
              <span>👈</span> 左右滑動查看背面 <span>👉</span>
            </div>
            <div className="swipe-container">
              <div className="swipe-card">
                <img src={cardAFront} alt="Design A Front" onClick={() => setLightboxImg(cardAFront)} />
              </div>
              <div className="swipe-card">
                <img src={cardABack} alt="Design A Back" onClick={() => setLightboxImg(cardABack)} />
              </div>
            </div>
          </div>

          <div>
            <div className="preview-label">Design B: 馬上有錢</div>
            <div className="swipe-hint">
              <span>👈</span> 左右滑動查看背面 <span>👉</span>
            </div>
            <div className="swipe-container">
              <div className="swipe-card">
                <img src={cardBFront} alt="Design B Front" onClick={() => setLightboxImg(cardBFront)} />
              </div>
              <div className="swipe-card">
                <img src={cardBBack} alt="Design B Back" onClick={() => setLightboxImg(cardBBack)} />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Pricing Table (Kept here, but logically after details now) */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🧧 團購優惠價</span>
            <span className="subtitle-tag">for 群英通訊處</span>
          </h3>
          <table className="price-table">
            <thead>
              <tr>
                <th>需求數量 (張)</th>
                <th>單價 (元/張)</th>
              </tr>
            </thead>
            <tbody>
              {[200, 300, 500, 1000, 1500].map(tierQty => {
                const tierPrice = getPricePerUnit(tierQty);

                let activeClass = '';
                // Find active tier for current quantity
                const currentGrandTotal = totalSystemCount + totalQty;
                const grandTotalTierPrice = getPricePerUnit(currentGrandTotal);

                if (grandTotalTierPrice === tierPrice) {
                  const activeTierObj = PRICING_TIERS.find(t => currentGrandTotal >= t.min);
                  // The found object has a .min
                  if (activeTierObj && activeTierObj.min === tierQty) {
                    activeClass = 'active-tier';
                  }

                  // Correction for < 200 case:
                  if (currentGrandTotal < 200 && tierQty === 200) {
                    activeClass = 'active-tier';
                  }
                }

                return (
                  <tr key={tierQty} className={activeClass}>
                    <td>{tierQty}{tierQty === 1500 ? '+' : ''}</td>
                    <td style={{ position: 'relative' }}>
                      <span className="price-tag">${tierPrice}</span>
                      {activeClass === 'active-tier' && <span className="current-tier-badge">目前適用</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ fontSize: '0.9rem', color: '#D32F2F', fontWeight: 'bold' }}>
            * 目前全體累積數量：{totalSystemCount.toLocaleString()} 張<br />
            * 您的單價將依照「全體累積總量」計算，買越多越便宜！
          </p>
        </div>

        {/* 4. Order Form with ID for anchor */}
        <form onSubmit={handleSubmit} className="glass-card" id="order-form">
          <h3>📝 預訂資料</h3>

          <div className="form-group">
            <label>姓名 Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>事業體 Department</label>
            <input
              type="text"
              required
              value={department}
              onChange={e => setDepartment(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>預訂內容 <span style={{ fontSize: '0.8em', opacity: 0.7 }}>(點擊圖片可放大)</span></label>

            <div className="cards-selection-grid">
              <div className="card-item-compact">
                <div className="item-left">
                  <img src={cardAFront} className="thumb-img" onClick={() => setLightboxImg(cardAFront)} />
                  <div className="item-details">
                    <span className="item-title">Design A: 金馬呈祥</span>
                    <span className="view-back-link" onClick={() => setLightboxImg(cardABack)}>查看背面</span>
                  </div>
                </div>
                <div className="item-right">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={qtyA === 0 ? '' : qtyA}
                    onChange={e => setQtyA(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="card-item-compact">
                <div className="item-left">
                  <img src={cardBFront} className="thumb-img" onClick={() => setLightboxImg(cardBFront)} />
                  <div className="item-details">
                    <span className="item-title">Design B: 馬上有錢</span>
                    <span className="view-back-link" onClick={() => setLightboxImg(cardBBack)}>查看背面</span>
                  </div>
                </div>
                <div className="item-right">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={qtyB === 0 ? '' : qtyB}
                    onChange={e => setQtyB(parseInt(e.target.value) || 0)}
                  />
                </div>

              </div>
            </div>
          </div>



          <div className="total-section premium-summary">

            <div className="summary-row main-order-row">
              <span className="summary-label">您的預訂數量</span>
              <span className="summary-value">{totalQty} 張</span>
            </div>

            {/* Subtle Pricing Context */}
            <div className="tier-notification">
              <div style={{ marginBottom: '4px' }}>
                單價: <strong>${pricePerUnit}元</strong> <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>(原價 $7.0)</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#fbbf24', opacity: 0.9, fontWeight: 'normal' }}>
                預估累積數量：{currentGrandTotal.toLocaleString()} 張 / 目前適用級距：{currentTierMin.toLocaleString()} 張
              </div>
            </div>

            <div className="final-price-block">
              <span className="final-amount-label">您的預估金額</span>
              <span className="final-amount">${totalPrice.toLocaleString()}</span>
            </div>
            <div className="estimated-note">
              * 實際金額將於截止後，依全體最終累積總量結算
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="submit-btn" disabled={submitting || totalQty <= 0}>
              {submitting ? '送出中...' : '確認預訂'}
            </button>
          </div>

        </form>

        {/* Live Counter */}
        {/* Live Counter */}
        <div className="live-counter" title="全公司即時預訂總量">
          <div className="stats-row">
            <span>🔥 群英通訊處累積預訂: {totalSystemCount.toLocaleString()} 張</span>
            <span className="stats-detail">( 金馬: {totalSystemCountA.toLocaleString()} / 馬上: {totalSystemCountB.toLocaleString()} )</span>
          </div>
        </div>

        <footer className="designer-footer">
          Designed by <a href="http://evelynytliu.github.io/" target="_blank" rel="noopener noreferrer">Evelyn Y.T. Liu</a>
          <br />
          <a href="?page=admin" style={{ fontSize: '0.8rem', opacity: 0.3, textDecoration: 'none', marginTop: '10px', display: 'inline-block' }}>主揪管理後台</a>
        </footer>

      </div> {/* End content-container */}

      {/* Floating Action Button */}
      <a href="#order-form" className="floating-order-btn">
        🛒 我要訂購
      </a>

    </div> /* End app-main-wrapper */
  );
}

export default App;
