/* CUPISSA - Modulo independiente de graficas de flujo de caja.
 * Recibe los movimientos desde la aplicacion principal y administra su instancia Chart.js.
 */
(function (global) {
    'use strict';
    let chart = null;
    const $ = (id) => document.getElementById(id);
    const money = (v) => typeof global.parseMonto === 'function' ? global.parseMonto(v || 0) : (Number(v) || 0);
    const monthLabel = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1)
        .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    function sumsByMonth(movements) {
        const result = {}; 
        (movements || []).forEach((m) => {
            if (!m.fecha || !/^\d{4}-\d{2}-\d{2}/.test(m.fecha) || !['INGRESO', 'EGRESO'].includes(m.tipo)) return;
            const key = m.fecha.slice(0, 7);
            if (!result[key]) result[key] = { ingresos: 0, egresos: 0 };
            result[key][m.tipo === 'INGRESO' ? 'ingresos' : 'egresos'] += money(m.valor);
        });
        return result;
    }
    function paint(title, help, labels, ingresos, egresos, onClick) {
        const canvas = $('chart-flujo-diario');
        if (!canvas || !global.Chart) return;
        if (chart) { chart.destroy(); chart = null; }
        const titleNode = $('titulo-chart-flujo'); if (titleNode) titleNode.textContent = title;
        const helpNode = $('ayuda-chart-flujo'); if (helpNode) helpNode.textContent = help;
        chart = new global.Chart(canvas, {
            type: 'bar',
            data: { labels, datasets: [
                { label: 'Ingresos ($)', data: ingresos, backgroundColor: '#059669', borderRadius: 4 },
                { label: 'Egresos ($)', data: egresos, backgroundColor: '#dc2626', borderRadius: 4 }
            ] },
            options: { responsive: true, maintainAspectRatio: false, onClick: onClick || undefined,
                scales: { y: { beginAtZero: true } } }
        });
    }
    
function renderMensual(movements) {
    const monthly = sumsByMonth(movements);
    const keys = Object.keys(monthly)
        .filter(k => k >= '2026-09')
        .sort();

    const back = $('btn-volver-chart-mensual');
    if (back) back.classList.add('hidden');

    if (!keys.length) {
        paint(
            '📈 Ingresos vs Egresos (Resumen mensual)',
            'No hay movimientos desde septiembre de 2026.',
            [],
            [],
            []
        );
        return;
    }

    paint(
        '📈 Ingresos vs Egresos (Resumen mensual)',
        'Haz clic en un mes para consultar su gráfica diaria.',
        keys.map(monthLabel),
        keys.map(k => monthly[k].ingresos),
        keys.map(k => monthly[k].egresos),
        (_event, elements) => {
            if (elements && elements.length) {
                renderDiario(movements, keys[elements[0].index]);
            }
        }
    );
}

    function renderDiario(movements, month) {
        const days = {};
        (movements || []).forEach((m) => {
            if (!m.fecha || !m.fecha.startsWith(month) || !['INGRESO', 'EGRESO'].includes(m.tipo)) return;
            if (!days[m.fecha]) days[m.fecha] = { ingresos: 0, egresos: 0 };
            days[m.fecha][m.tipo === 'INGRESO' ? 'ingresos' : 'egresos'] += money(m.valor);
        });
        const keys = Object.keys(days).sort();
        const back = $('btn-volver-chart-mensual'); if (back) back.classList.remove('hidden');
        paint('📅 Detalle diario — ' + monthLabel(month), 'Movimientos diarios del mes seleccionado. Usa “Volver a meses” para regresar.',
            keys.map(k => k.slice(8, 10)), keys.map(k => days[k].ingresos), keys.map(k => days[k].egresos));
    }
    global.CupissaFlujoCaja = { renderMensual, renderDiario };
})(window);
