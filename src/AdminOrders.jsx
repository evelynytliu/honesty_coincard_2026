import React, { useState, useEffect } from 'react';
import { supabase } from './db/supabaseClient';
import './index.css';

// Admin page showing simple table of orders
function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [grandTotalQty, setGrandTotalQty] = useState(0);

    // Reusing the pricing tiers for consistency
    const PRICING_TIERS = [
        { min: 1500, price: 4.5 },
        { min: 1000, price: 5.0 },
        { min: 500, price: 6.0 },
        { min: 300, price: 7.0 },
        { min: 200, price: 9.0 },
        { min: 0, price: 9.0 },
    ];

    function getPricePerUnit(totalQty) {
        const tier = PRICING_TIERS.find(t => totalQty >= t.min);
        return tier ? tier.price : 9.0;
    }

    useEffect(() => {
        fetchOrders();

        // Set up real-time subscription
        const channel = supabase
            .channel('admin-table-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cny_card_orders' },
                () => fetchOrders() // Simple refresh on any change
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchOrders() {
        setLoading(true);
        // Fetch all orders
        const { data, error } = await supabase
            .from('cny_card_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);

            // Calculate Grand Total from all orders on client side to be safe
            const total = (data || []).reduce((acc, order) => {
                return acc + order.card_type_a_qty + order.card_type_b_qty;
            }, 0);
            setGrandTotalQty(total);
        }
        setLoading(false);
    }

    // Calculate current dynamic price
    const currentPrice = getPricePerUnit(grandTotalQty);

    if (loading && orders.length === 0) {
        return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading orders...</div>;
    }

    return (
        <div className="admin-container" style={{ maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            <div className="glass-card admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>📋 預訂管理後台</h1>
                    <a href="./" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>返回首頁</a>
                </div>

                <div className="stats-panel" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem',
                    background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>累積總張數</div>
                        <div style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>{grandTotalQty.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>目前適用單價</div>
                        <div style={{ fontSize: '2rem', color: '#10b981', fontWeight: 'bold' }}>${currentPrice}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>預估總額</div>
                        <div style={{ fontSize: '2rem', color: 'var(--text-white)', fontWeight: 'bold' }}>${(grandTotalQty * currentPrice).toLocaleString()}</div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--accent-gold)', color: 'var(--text-gold)' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>日期</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>姓名</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>事業體</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Design A</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Design B</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>總張數</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>預估應付</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const orderTotal = order.card_type_a_qty + order.card_type_b_qty;
                                const dynamicTotal = Math.ceil(orderTotal * currentPrice);

                                return (
                                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <td data-label="日期" style={{ padding: '12px', color: '#ccc', fontSize: '0.85rem' }}>
                                            {new Date(order.created_at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td data-label="姓名" style={{ padding: '12px', fontWeight: 'bold' }}>{order.name}</td>
                                        <td data-label="事業體" style={{ padding: '12px' }}>{order.department}</td>
                                        <td data-label="Design A" style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>{order.card_type_a_qty || '-'}</td>
                                        <td data-label="Design B" style={{ padding: '12px', textAlign: 'center', color: '#ccc' }}>{order.card_type_b_qty || '-'}</td>
                                        <td data-label="總張數" style={{ padding: '12px', textAlign: 'center', fontSize: '1.1rem' }}>{orderTotal}</td>
                                        <td data-label="預估應付" style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                                            ${dynamicTotal.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminOrders;
