// ==UserScript==
// @name         PokéSurvivor Auto Bot & Cheat Suite
// @namespace    https://github.com/nhoxboo/pokesurvivor-auto
// @version      1.0.0
// @description  Tool Auto Toàn Diện cho PokéSurvivor: Tự Né Tránh (Smart Kite), Tự Nhặt Đồ Toàn Bản Đồ (Global Magnet), Tự Nâng Cấp (Auto LevelUp), Bất Tử (God Mode), Tăng Tốc Game, Nhân Sát Thương & Xu.
// @author       Beso & Anh Nam
// @match        https://pokesurvivor.com/*
// @match        https://*.pokesurvivor.com/*
// @icon         https://pokesurvivor.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/nhoxboo/pokesurvivor-auto/main/pokesurvivor-auto.user.js
// @downloadURL  https://raw.githubusercontent.com/nhoxboo/pokesurvivor-auto/main/pokesurvivor-auto.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    console.log('[PokeSurvivor-Auto] Khởi tạo script tại document-start...');

    // =========================================================================
    // 1. ENGINE CAPTURE HOOK (Bắt lõi Engine _0x1fe493 ngay khi vừa tải)
    // =========================================================================
    let gameEngine = null;

    // Định nghĩa getter trên Object.prototype để hứng tham chiếu Engine
    Object.defineProperty(Object.prototype, '__ps_engine_trap__', {
        configurable: true,
        enumerable: false,
        get() {
            if (this && this.LIFT === 0x12) {
                gameEngine = this;
                window.__PS_ENGINE__ = this;
                console.log('[PokeSurvivor-Auto] 🎉 BẮT THÀNH CÔNG GAME ENGINE:', this);
                onEngineReady(this);
            }
            return true;
        }
    });

    // Hook Array.prototype.filter (hàm cuối cùng mà app.min.js gọi trước khi chạy Flow.boot)
    const origFilter = Array.prototype.filter;
    Array.prototype.filter = function (callback, thisArg) {
        if (typeof callback === 'function' && !gameEngine) {
            try {
                callback('__ps_engine_trap__');
            } catch (e) { }
        }
        return origFilter.call(this, callback, thisArg);
    };

    // =========================================================================
    // 2. CONFIGURATION & STATE
    // =========================================================================
    const DEFAULT_CONFIG = {
        autoPlay: true,          // Tự động né quái & di chuyển thông minh
        autoMagnet: true,        // Hút sạch vật phẩm, ngọc kinh nghiệm, tiền
        autoLevelUp: true,       // Tự chọn thẻ nâng cấp khi lên cấp
        autoBond: true,          // Tự chọn nâng cấp Partner Bond
        autoItem: true,          // Tự mở hòm / nhặt item đặc biệt
        autoRestart: false,      // Tự chơi lại khi thua
        godMode: false,          // Bất tử (HP luôn đầy + Invulnerability)
        oneHitKill: false,       // Tăng 100x sát thương
        cdReduction: false,      // Bắn chiêu liên tục không cooldown
        speedHack: 1.0,          // Tốc độ game (1x - 5x)
        moveSpeedMul: 1.0,       // Tốc độ chạy nhân vật
        coinMul: 1.0,            // Nhân lượng tiền rơi
        autoAim: true            // Tự hướng mặt về phía quái gần nhất
    };

    let config = Object.assign({}, DEFAULT_CONFIG);
    try {
        const saved = localStorage.getItem('ps_auto_cfg');
        if (saved) {
            Object.assign(config, JSON.parse(saved));
        }
    } catch (e) { }

    function saveConfig() {
        try {
            localStorage.setItem('ps_auto_cfg', JSON.stringify(config));
        } catch (e) { }
    }

    let botMoveVector = [0, 0];
    let isUiMinimized = false;

    // =========================================================================
    // 3. ENGINE HOOKS & CONTROLS
    // =========================================================================
    function onEngineReady(engine) {
        // Hook Input.axis để can thiệp hướng di chuyển mượt mà
        if (engine.Input && typeof engine.Input.axis === 'function') {
            const origAxis = engine.Input.axis;
            engine.Input.axis = function () {
                if (config.autoPlay && engine.Game && engine.Game.state === 'playing') {
                    // Nếu bot đang có vector né quái thì trả về
                    if (botMoveVector[0] !== 0 || botMoveVector[1] !== 0) {
                        return botMoveVector;
                    }
                }
                return origAxis.apply(this, arguments);
            };
            console.log('[PokeSurvivor-Auto] Đã hook Input.axis thành công.');
        }

        // Tự động gỡ bỏ hook Array.filter để tối ưu hiệu năng
        Array.prototype.filter = origFilter;
    }

    // =========================================================================
    // 4. MAIN AUTOMATION LOOP (60 FPS)
    // =========================================================================
    function runBotTick() {
        requestAnimationFrame(runBotTick);

        const engine = window.__PS_ENGINE__ || gameEngine;
        if (!engine || !engine.Game) return;

        const state = engine.Game.state;

        // Cập nhật thông số HUD trên Menu
        updateStatsHud(engine);

        // --- TRẠNG THÁI: ĐANG CHƠI (PLAYING) ---
        if (state === 'playing') {
            const player = engine.Game.player;
            if (!player || player.dead) return;

            // 1. GOD MODE / BẤT TỬ
            if (config.godMode) {
                player.invuln = 10;
                if (player.hp < player.maxHp) {
                    player.hp = player.maxHp;
                }
            }

            // 2. SÁT THƯƠNG & COOLDOWN
            if (config.oneHitKill) {
                player.atkMul = Math.max(player.atkMul, 100);
            }
            if (config.cdReduction) {
                player.cdMul = 0.05; // Cooldown 95%
            }

            // 3. TỐC ĐỘ DI CHUYỂN NHÂN VẬT & TIỀN
            if (config.moveSpeedMul > 1.0) {
                player.spdMul = config.moveSpeedMul;
            }
            if (config.coinMul > 1.0) {
                player.coinMul = config.coinMul;
            }

            // 4. TỐC ĐỘ GAME (GAME SPEED HACK)
            if (config.speedHack > 1.0 && typeof engine.Game.debugSpeed === 'function') {
                engine.Game.debugSpeed(config.speedHack);
            }

            // 5. GLOBAL MAGNET (HÚT TOÀN BỘ VẬT PHẨM TOÀN BẢN ĐỒ)
            if (config.autoMagnet && engine.Pickups && typeof engine.Pickups.pullAll === 'function') {
                engine.Pickups.pullAll();
            }

            // 6. THUẬT TOÁN AUTO-PLAY / SMART KITING (TỰ NÉ QUÁI THÔNG MINH)
            if (config.autoPlay && engine.EnemyMgr) {
                calculateSmartMove(player, engine);
            } else {
                botMoveVector = [0, 0];
            }
        }

        // --- TRẠNG THÁI: LÊN CẤP (LEVEL UP) ---
        else if (state === 'levelup') {
            if (config.autoLevelUp && engine.RunUI) {
                // Tự động chọn thẻ kỹ năng đầu tiên
                setTimeout(() => {
                    try {
                        engine.RunUI.pick(0);
                    } catch (e) { }
                }, 150);
            }
        }

        // --- TRẠNG THÁI: CỬA SỔ CHỌN BOND HOẶC ITEM ---
        if (config.autoBond && engine.UI && engine.UI.isOpen && engine.UI.isOpen('scr-bond')) {
            if (engine.RunUI && typeof engine.RunUI.pickBond === 'function') {
                setTimeout(() => {
                    try { engine.RunUI.pickBond(0); } catch (e) { }
                }, 150);
            }
        }

        if (config.autoItem && engine.UI && engine.UI.isOpen && engine.UI.isOpen('scr-item')) {
            const itemCards = document.querySelectorAll('#item-cards .card');
            if (itemCards && itemCards.length > 0) {
                setTimeout(() => {
                    try { itemCards[0].click(); } catch (e) { }
                }, 150);
            }
        }

        // --- TRẠNG THÁI: KẾT THÚC RUN (GAME OVER) ---
        if (state === 'over' || (engine.UI && engine.UI.isOpen && engine.UI.isOpen('scr-over'))) {
            if (config.autoRestart) {
                const btnAgain = document.getElementById('btn-again');
                if (btnAgain) {
                    btnAgain.click();
                    setTimeout(() => {
                        if (engine.Flow && typeof engine.Flow.play === 'function') {
                            engine.Flow.play();
                        }
                    }, 1000);
                }
            }
        }
    }

    // =========================================================================
    // 5. THUẬT TOÁN TỰ NÉ TRÁNH & TÌM VỊ TRÍ AN TOÀN (SMART KITE)
    // =========================================================================
    function calculateSmartMove(player, engine) {
        const enemies = (engine.EnemyMgr.all && engine.EnemyMgr.all()) || [];
        const livingEnemies = enemies.filter(e => !e.dead);

        const px = player.x;
        const py = player.y;

        let repulseX = 0;
        let repulseY = 0;
        const DANGER_RADIUS = 160; // Bán kính cảnh báo nguy hiểm

        let dangerCount = 0;

        for (let i = 0; i < livingEnemies.length; i++) {
            const e = livingEnemies[i];
            const dx = px - e.x;
            const dy = py - e.y;
            const dist = Math.hypot(dx, dy);

            if (dist < DANGER_RADIUS && dist > 0.001) {
                dangerCount++;
                // Lực đẩy tỷ lệ nghịch với khoảng cách (càng gần lực càng mạnh)
                const weight = Math.pow((DANGER_RADIUS - dist) / DANGER_RADIUS, 1.5) * 3.0;
                repulseX += (dx / dist) * weight;
                repulseY += (dy / dist) * weight;
            }
        }

        // Giữ nhân vật không chạy quá xa tâm bản đồ (giới hạn 700px từ tâm)
        const distFromCenter = Math.hypot(px, py);
        if (distFromCenter > 650) {
            const centerWeight = (distFromCenter - 650) / 200;
            repulseX -= (px / distFromCenter) * centerWeight * 2.0;
            repulseY -= (py / distFromCenter) * centerWeight * 2.0;
        }

        // Nếu xung quanh hoàn toàn không có quái, nhẹ nhàng lượn vòng hoặc đứng yên
        if (dangerCount === 0) {
            if (distFromCenter > 300) {
                // Hướng nhẹ về tâm
                repulseX -= (px / distFromCenter) * 0.5;
                repulseY -= (py / distFromCenter) * 0.5;
            } else {
                botMoveVector = [0, 0];
                return;
            }
        }

        // Chuẩn hóa vector thành vận tốc độ dài 1
        const mag = Math.hypot(repulseX, repulseY);
        if (mag > 0.05) {
            botMoveVector = [repulseX / mag, repulseY / mag];
        } else {
            botMoveVector = [0, 0];
        }
    }

    // =========================================================================
    // 6. GIAO DIỆN ĐIỀU KHIỂN (FLOATING DASHBOARD - WHITE & BLUE THEME)
    // =========================================================================
    function createUI() {
        if (document.getElementById('ps-auto-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'ps-auto-panel';
        panel.innerHTML = `
            <style>
                #ps-auto-panel {
                    position: fixed;
                    top: 15px;
                    right: 15px;
                    width: 320px;
                    background: #ffffff;
                    color: #1e293b;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 13px;
                    z-index: 9999999;
                    user-select: none;
                    border: 1px solid #cbd5e1;
                    overflow: hidden;
                    transition: transform 0.2s ease, opacity 0.2s ease;
                }
                #ps-auto-panel.minimized #ps-body {
                    display: none;
                }
                #ps-header {
                    background: #1e293b;
                    color: #ffffff;
                    padding: 10px 14px;
                    font-weight: 700;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: move;
                }
                #ps-header .title-badge {
                    background: #3b82f6;
                    color: #ffffff;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                #ps-header .controls button {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 15px;
                    padding: 0 4px;
                    line-height: 1;
                }
                #ps-header .controls button:hover {
                    color: #ffffff;
                }
                #ps-body {
                    padding: 12px 14px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .ps-hud {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                    background: #f8fafc;
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 12px;
                    font-size: 12px;
                }
                .ps-hud-item span {
                    color: #64748b;
                }
                .ps-hud-item b {
                    color: #0f172a;
                    float: right;
                }
                .ps-section-title {
                    font-weight: 700;
                    font-size: 11px;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 10px 0 6px 0;
                }
                .ps-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 5px 0;
                    border-bottom: 1px solid #f1f5f9;
                }
                .ps-row:last-child {
                    border-bottom: none;
                }
                .ps-label {
                    font-weight: 500;
                    color: #334155;
                }
                /* Switch Toggle */
                .ps-switch {
                    position: relative;
                    display: inline-block;
                    width: 38px;
                    height: 20px;
                }
                .ps-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .ps-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #cbd5e1;
                    transition: .2s;
                    border-radius: 20px;
                }
                .ps-slider:before {
                    position: absolute;
                    content: "";
                    height: 14px;
                    width: 14px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .2s;
                    border-radius: 50%;
                }
                input:checked + .ps-slider {
                    background-color: #2563eb;
                }
                input:checked + .ps-slider:before {
                    transform: translateX(18px);
                }
                /* Buttons & Actions */
                .ps-btn-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                    margin-top: 10px;
                }
                .ps-btn {
                    background: #f1f5f9;
                    border: 1px solid #cbd5e1;
                    color: #1e293b;
                    padding: 7px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    text-align: center;
                }
                .ps-btn:hover {
                    background: #e2e8f0;
                    border-color: #94a3b8;
                }
                .ps-btn.primary {
                    background: #2563eb;
                    border-color: #1d4ed8;
                    color: #ffffff;
                }
                .ps-btn.primary:hover {
                    background: #1d4ed8;
                }
                .ps-btn.danger {
                    background: #ef4444;
                    border-color: #dc2626;
                    color: #ffffff;
                }
                .ps-btn.danger:hover {
                    background: #dc2626;
                }
                .ps-select {
                    padding: 3px 6px;
                    border-radius: 4px;
                    border: 1px solid #cbd5e1;
                    font-size: 12px;
                    background: #fff;
                    color: #1e293b;
                    outline: none;
                }
                .ps-footer {
                    margin-top: 12px;
                    text-align: center;
                    font-size: 11px;
                    color: #94a3b8;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 8px;
                }
            </style>

            <div id="ps-header">
                <div style="display:flex;align-items:center;">
                    <span>⚡ PokéSurvivor Auto</span>
                    <span class="title-badge">v1.0</span>
                </div>
                <div class="controls">
                    <button id="ps-btn-min" title="Thu nhỏ / Mở rộng">—</button>
                    <button id="ps-btn-close" title="Ẩn (Bấm H để mở lại)">✕</button>
                </div>
            </div>

            <div id="ps-body">
                <div class="ps-hud">
                    <div class="ps-hud-item"><span>Trạng thái:</span> <b id="hud-state">Chờ Game...</b></div>
                    <div class="ps-hud-item"><span>Máu (HP):</span> <b id="hud-hp">-/-</b></div>
                    <div class="ps-hud-item"><span>Quái còn lại:</span> <b id="hud-enemies">0</b></div>
                    <div class="ps-hud-item"><span>Cấp độ:</span> <b id="hud-level">1</b></div>
                </div>

                <div class="ps-section-title">Tính Năng Tự Động (Auto-Play)</div>
                <div class="ps-row">
                    <span class="ps-label">🤖 Tự Né Quái (Smart Kite)</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-autoPlay">
                        <span class="ps-slider"></span>
                    </label>
                </div>
                <div class="ps-row">
                    <span class="ps-label">🧲 Tự Hút Đồ Toàn Map</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-autoMagnet">
                        <span class="ps-slider"></span>
                    </label>
                </div>
                <div class="ps-row">
                    <span class="ps-label">⭐ Tự Nâng Cấp (LevelUp)</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-autoLevelUp">
                        <span class="ps-slider"></span>
                    </label>
                </div>
                <div class="ps-row">
                    <span class="ps-label">🤝 Tự Chọn Partner Bond</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-autoBond">
                        <span class="ps-slider"></span>
                    </label>
                </div>
                <div class="ps-row">
                    <span class="ps-label">🎁 Tự Mở Rương / Item</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-autoItem">
                        <span class="ps-slider"></span>
                    </label>
                </div>
                <div class="ps-row">
                    <span class="ps-label">🔄 Tự Chơi Lại Khi Thua</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-autoRestart">
                        <span class="ps-slider"></span>
                    </label>
                </div>

                <div class="ps-section-title">Sức Mạnh & Hỗ Trợ (God Mode)</div>
                <div class="ps-row">
                    <span class="ps-label" style="color:#b91c1c;font-weight:600;">🛡️ Bất Tử (God Mode)</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-godMode">
                        <span class="ps-slider"></span>
                    </label>
                </div>
                <div class="ps-row">
                    <span class="ps-label">💥 1-Hit Kill (100x ATK)</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-oneHitKill">
                        <span class="ps-slider"></span>
                    </label>
                </div>
                <div class="ps-row">
                    <span class="ps-label">⚡ Bắn Liên Tục (Không CD)</span>
                    <label class="ps-switch">
                        <input type="checkbox" id="cfg-cdReduction">
                        <span class="ps-slider"></span>
                    </label>
                </div>
                <div class="ps-row">
                    <span class="ps-label">⏩ Tốc Độ Game</span>
                    <select id="cfg-speedHack" class="ps-select">
                        <option value="1.0">1x (Chuẩn)</option>
                        <option value="1.5">1.5x (Nhanh)</option>
                        <option value="2.0">2x (Cực nhanh)</option>
                        <option value="3.0">3x (Siêu tốc)</option>
                        <option value="5.0">5x (Max tốc)</option>
                    </select>
                </div>
                <div class="ps-row">
                    <span class="ps-label">👟 Tốc Độ Chạy</span>
                    <select id="cfg-moveSpeedMul" class="ps-select">
                        <option value="1.0">1x (Chuẩn)</option>
                        <option value="1.5">1.5x</option>
                        <option value="2.0">2.0x</option>
                    </select>
                </div>

                <div class="ps-section-title">Thao Tác Nhanh</div>
                <div class="ps-btn-group">
                    <button class="ps-btn primary" id="btn-pull-all">🧲 Hút Toàn Bộ</button>
                    <button class="ps-btn" id="btn-heal">💚 Hồi Đầy Máu</button>
                    <button class="ps-btn" id="btn-level-up">🆙 +1 Cấp Độ</button>
                    <button class="ps-btn" id="btn-start-run">▶️ Chơi Ngay</button>
                </div>

                <div class="ps-footer">
                    Phím tắt: <b>H</b> để ẩn/hiện menu • Tối ưu cho Tampermonkey
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Bind switch toggles
        const binds = [
            'autoPlay', 'autoMagnet', 'autoLevelUp', 'autoBond',
            'autoItem', 'autoRestart', 'godMode', 'oneHitKill', 'cdReduction'
        ];
        binds.forEach(key => {
            const el = document.getElementById(`cfg-${key}`);
            if (el) {
                el.checked = !!config[key];
                el.addEventListener('change', () => {
                    config[key] = el.checked;
                    saveConfig();
                });
            }
        });

        // Bind select dropdowns
        const speedEl = document.getElementById('cfg-speedHack');
        if (speedEl) {
            speedEl.value = String(config.speedHack);
            speedEl.addEventListener('change', () => {
                config.speedHack = parseFloat(speedEl.value);
                saveConfig();
            });
        }

        const moveEl = document.getElementById('cfg-moveSpeedMul');
        if (moveEl) {
            moveEl.value = String(config.moveSpeedMul);
            moveEl.addEventListener('change', () => {
                config.moveSpeedMul = parseFloat(moveEl.value);
                saveConfig();
            });
        }

        // Action Buttons
        document.getElementById('btn-pull-all').addEventListener('click', () => {
            const engine = window.__PS_ENGINE__ || gameEngine;
            if (engine && engine.Pickups && typeof engine.Pickups.pullAll === 'function') {
                engine.Pickups.pullAll();
            }
        });

        document.getElementById('btn-heal').addEventListener('click', () => {
            const engine = window.__PS_ENGINE__ || gameEngine;
            if (engine && engine.Game && engine.Game.player) {
                engine.Game.player.hp = engine.Game.player.maxHp;
            }
        });

        document.getElementById('btn-level-up').addEventListener('click', () => {
            const engine = window.__PS_ENGINE__ || gameEngine;
            if (engine && engine.Game && typeof engine.Game.debugLevelUp === 'function') {
                engine.Game.debugLevelUp();
            }
        });

        document.getElementById('btn-start-run').addEventListener('click', () => {
            const engine = window.__PS_ENGINE__ || gameEngine;
            if (engine && engine.Flow && typeof engine.Flow.play === 'function') {
                engine.Flow.play();
            } else if (engine && engine.Game && typeof engine.Game.startRun === 'function') {
                engine.Game.startRun();
            }
        });

        // Window controls
        const minBtn = document.getElementById('ps-btn-min');
        minBtn.addEventListener('click', () => {
            isUiMinimized = !isUiMinimized;
            panel.classList.toggle('minimized', isUiMinimized);
            minBtn.textContent = isUiMinimized ? '□' : '—';
        });

        const closeBtn = document.getElementById('ps-btn-close');
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        // Keyboard hotkey 'H' to toggle UI
        window.addEventListener('keydown', (e) => {
            if (e.target && ['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;
            if (e.key === 'h' || e.key === 'H') {
                panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
            }
        });

        // Draggable panel
        makeDraggable(panel, document.getElementById('ps-header'));
    }

    function updateStatsHud(engine) {
        const hudState = document.getElementById('hud-state');
        const hudHp = document.getElementById('hud-hp');
        const hudEnemies = document.getElementById('hud-enemies');
        const hudLevel = document.getElementById('hud-level');

        if (!hudState) return;

        hudState.textContent = engine.Game.state || 'menu';
        if (engine.Game.state === 'playing' && engine.Game.player) {
            const p = engine.Game.player;
            hudHp.textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
            hudLevel.textContent = p.level || 1;
            const enemies = (engine.EnemyMgr && engine.EnemyMgr.all && engine.EnemyMgr.all()) || [];
            hudEnemies.textContent = enemies.filter(e => !e.dead).length;
        } else {
            hudHp.textContent = '-/-';
            hudEnemies.textContent = '0';
        }
    }

    function makeDraggable(element, handle) {
        let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            mouseX = e.clientX;
            mouseY = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            offsetX = mouseX - e.clientX;
            offsetY = mouseY - e.clientY;
            mouseX = e.clientX;
            mouseY = e.clientY;
            element.style.top = (element.offsetTop - offsetY) + "px";
            element.style.left = (element.offsetLeft - offsetX) + "px";
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // =========================================================================
    // 7. INITIALIZE SCRIPT
    // =========================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createUI();
        });
    } else {
        createUI();
    }

    // Bắt đầu vòng lặp tự động 60fps
    requestAnimationFrame(runBotTick);

})();
