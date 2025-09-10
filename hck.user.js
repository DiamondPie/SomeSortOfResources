// ==UserScript==
// @name         New Userscript 2
// @namespace    http://tampermonkey.net/
// @version      1.3.1
// @description  Hack your blooket
// @author       DiamondPie
// @match        *://*.blooket.com/*
// @exclude      *://*.blooket.com/api/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=blooket.com
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        unsafeWindow
// @run-at       document-start
// @require      https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs/dist/fp.umd.min.js
// ==/UserScript==

// 为所有我选中的行添加注释

(function () {
    'use strict';

    let log; // 全脚本作用域可使用 log 对象，弹出 Toast 弹窗信息

    const host = window.location.hostname
    const WindowInfo = {
        host,
        isMainPage: host === "play.blooket.com",
        currency: {
            "goldquest.blooket.com": "g",
            "cryptohack.blooket.com": "cr",
            "fishingfrenzy.blooket.com": "w"
        }[host] ?? null
    };

    /*** Module: Style ***/
    const StyleModule = {
        /**
         * 初始化并注入全局 CSS 样式
         */
        init() {
            const style = document.createElement('style');
            style.textContent = `
            /* === Toast & Dropdown & Prompt 通用样式 === */
            #toast-container {
              position: fixed;
              bottom: 20px;
              right: 20px;
              pointer-events: none;
              z-index: 99999;
            }
            .toast {
              position: absolute;
              right: 0;
              background: #03030388;
              color: #fff;
              box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
              padding: 10px 15px;
              border-radius: 30px 15px 5px 30px;
              min-width: 200px;
              width: max-content;
              max-width: 38.2vw;
              overflow-wrap: break-word;
              transition: bottom 0.5s cubic-bezier(0.75,0.1,0.25,1), transform 0.5s cubic-bezier(0.75,0.1,0.25,1);
              pointer-events: auto;
            }
            .toast .progress {
              position: absolute;
              bottom: 0;
              left: 12px;
              height: 4px;
              width: 0;
              border-radius: 10px;
              background-color: #ffffff;
              animation-timing-function: linear;
            }
            @keyframes progressBar {
              from { width: 0; }
              to { width: calc(100% - 12px); }
            }
            @font-face {
                font-family: 'mc';
                src: url('data:font/woff2;charset=utf-8;base64,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') format('woff2'),
                     url('data:font/woff;charset=utf-8;base64,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') format('woff');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }

            .dropdownContainer {
                font-family: sans-serif;
                color: #fff;
                min-width: 150px;
                position: fixed;
                top: 50px;
                left: 50px;
                /* border: 1px solid #ccc; */
                background-color: #555a;
                user-select: none;
            }

            .dropdownTitle {
                font-size: 120%;
                background-color: #4CAF50;
                color: white;
                padding: 5px 10px;
                display: flex;
                justify-content: center;  /* 水平居中 */
                align-items: center;      /* 垂直居中 */
                position: relative;       /* 相对定位以保持图标的定位 */
            }

            .dropdownOptions {
                max-height: 0; /* 初始化最大高度为0 */
                overflow: hidden; /* 隐藏超出部分 */
                /* border-top: 1px solid #ccc; */
                /* background-color: white; */
                transition: max-height 0.1s ease; /* 添加动画效果 */
            }

            .dropdownOptions.show {
                max-height: fit-content; /* 设置一个足够的最大高度以便展开 */
            }


            .option {
                min-width: max-content;
                text-rendering: optimizeLegibility;
                backface-visibility: visible;
                text-align: center;
                padding: 3px 10px;
                background: transparent; /* 初始背景 */
                position: relative;
                overflow: hidden;
            }

            .option::before {
                content: '';
                position: absolute;
                left: 0;
                top: 100%; /* 初始位置在上方 */
                height: 0; /* 初始高度为0 */
                width: 3px; /* 线条宽度 */
                background: #4CAF50; /* 线条颜色 */
                transition: height 0.3s, top 0.3s; /* 动画效果 */
            }

            .option.active::before {
                height: 100%; /* 点击后高度填满整个选项 */
                top: 0; /* 移动到底部 */
            }

            .option::after {
                content: '';
                position: absolute;
                left: 0;
                bottom: 0; /* 将线条放在选项底部 */
                height: 100%; /* 高度占满选项的高度 */
                width: 100%; /* 占满选项宽度 */
                background: linear-gradient(to left, #4CAF5044 100%, transparent 100%);
                transform: translateX(-100%); /* 初始位置在左侧 */
                transition: transform 0.3s ease; /* 动画效果 */
            }

            .option:hover::after {
                transform: translateX(0); /* 鼠标悬浮时填充颜色从左至右 */
            }

            .option:not(:hover)::after {
                transform: translateX(-100%); /* 离开悬浮时从右到左收回 */
            }


            .dropdownIcon {
                width: 16px;
                height: 16px;
                transition: transform 0.1s ease; /* 修改动画时间为0.1秒 */
                position: absolute;
                right: 10px;
            }

            /* 展开时的旋转效果 */
            .rotate {
                transform: rotate(90deg);
            }

            .fixed-text {
                font-family: sans-serif;
                display: flex;
                flex-direction: column;
                z-index: 9999;
                user-select: none;
                position: fixed; /* 固定定位 */
                top: 60px; /* 距离顶部20px */
                right: 20px; /* 距离右边20px */
                font-size: 110%; /* 字体大小 */
                font-weight: bold; /* 加粗字体 */
                background: linear-gradient(180deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000); /* 渐变色，方向由上至下 */
                background-size: 2100% 2100%; /* 渐变背景大小 */
                background-clip: text; /* 背景裁剪到文本 */
                -webkit-background-clip: text; /* Safari支持 */
                color: transparent; /* 设置文本颜色为透明 */
                animation: glowing 8s linear infinite; /* 动画效果 */
                text-align: end;
            }

            .fixed-text p {
                align-self: end;
                width: fit-content;
                font-weight: 400;
                margin: 0;
            }

            .fixed-text extra {
                backdrop-filter: blur(0);
                background: transparent;
                color: #666;
            }

            @keyframes glowing {
                0% {
                    background-position: 0% 0%; /* 从底部开始 */
                }
                100% {
                    background-position: 0% 100%; /* 向上移动 */
                }
            }

            #customPrompt {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: sans-serif;
            }

            .promptOverlay {
                position: absolute;
                width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.6);
            }

            .promptBox {
                display: flex;
                flex-direction: column;
                justify-content: center;
                position: relative;
                background: #444;
                padding: 20px;
                border-radius: 12px;
                z-index: 10000;
                min-width: 300px;
                color: white;
                box-shadow: 0 0 10px #000;
            }

            .promptMessage {
                margin-bottom: 10px;
            }

            .promptInput {
                border-radius: 10px;
                font-family: 'Consolas', 'sans-serif';
                width: auto;
                padding: 5px;
                margin-bottom: 10px;
                background: #222;
                border: 1px solid #888;
                color: #5af962;
                font-size: 14px;
            }

            .promptButtons {
                text-align: right;
            }

            .promptButtons button {
                border-radius: 3px;
                font-family: sans-serif;
                background: #4CAF50;
                border: none;
                padding: 5px 10px;
                margin-left: 5px;
                cursor: pointer;
                color: white;
            }

            .promptButtons button:hover {
                background: #45a049;
            }
            `;
            document.head.appendChild(style);
        }
    };

    /*** Module: Toast ***/
    const ToastModule = {
        bgColors: {
            info: '#2196F3cc',
            warn: '#FF9800cc',
            error: '#F44336cc',
            success: '#4CAF50cc',
        },
        toasts: [],
        margin: 10,
        exitExtra: 20,
        /**
         * 在 DOM 内容加载后，初始化 toast 容器和 window.log 上的全局日志方法
         */
        init() {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
            this.container = container;
            log = {
                info:    (msg,d=1500) => this.show(msg,d,this.bgColors.info),
                warn:    (msg,d=2000) => this.show(msg,d,this.bgColors.warn),
                error:   (msg,d=2000) => this.show(msg,d,this.bgColors.error),
                success: (msg,d=1500) => this.show(msg,d,this.bgColors.success),
            };
        },
        /**
         * 显示带有进度条动画的 Toast 消息
         * @param {string} msg - Toast 中显示的文本
         * @param {number} duration - 自动隐藏前的持续时间（毫秒）
         * @param {string} bg - Toast 的背景颜色
         */
        show(msg, duration, bg='#03030388') {
            const t = document.createElement('div');
            t.className = 'toast';
            t.innerHTML = msg;
            t.style.background = bg;
            const p = document.createElement('div');
            p.className = 'progress';
            p.style.animation = `progressBar ${duration}ms forwards`;
            t.appendChild(p);
            t.style.bottom = '0px';
            t.style.transform = 'translateX(100%)';
            this.container.appendChild(t);
            this.toasts.push(t);
            // 进入动画
            void t.offsetWidth;
            t.style.transform = 'translateX(0)';
            t.addEventListener('transitionend', e => {
                if (e.propertyName !== 'transform') return;
                this.toasts.forEach(x => {x.style.transition='bottom 0.5s cubic-bezier(0.75,0.1,0.25,1), transform 0.5s cubic-bezier(0.75,0.1,0.25,1)'});
                this.update();
            });

            this.update();
            setTimeout(()=>this.hide(t), duration);
        },
        /**
         * 重新计算活动 Toast 的位置
         */
        update() {
            let offset = 0;
            this.toasts.forEach(t => {
                t.style.bottom = `${offset}px`;
                offset += t.offsetHeight + this.margin;
            });
        },
        /**
         * 使用退出动画隐藏和移除 Toast
         * @param {HTMLElement} t - 要隐藏的 Toast 元素
         */
        hide(t) {
            const idx = this.toasts.indexOf(t);
            if (idx === -1) return;
            const cur = parseFloat(t.style.bottom);
            this.toasts.splice(idx,1);
            this.update();
            const w = t.offsetWidth, h = t.offsetHeight;
            t.style.transform = `translateX(${w + this.exitExtra}px)`;
            t.style.bottom = `${cur - (h + this.margin)}px`;
            t.addEventListener('transitionend', e => {
                if (e.propertyName==='bottom') {
                    this.container.removeChild(t);
                }
            });
        }
    };

    const Variables = {
        general: null,
        init: function() {
            return new Promise((resolve, reject) => {
              GM_xmlhttpRequest({
                method: "GET",
                url: "https://raw.githubusercontent.com/DiamondPie/SomeSortOfResources/refs/heads/main/general.m4a",
                responseType: "blob",
                onload: function(response) {
                  const blob = response.response;
                  const blobUrl = URL.createObjectURL(blob);
                  Variables.general = new Audio(blobUrl);
                  Variables.general.loop = true;
                  resolve();
                },
                onerror: function(err) {
                  reject(err);
                }
              });
            });
        }
    }

    /*** Module: Config ***/
    const ConfigModule = {
        functions: {
            global: {
                "Misc": {
                    Debugger:  { type: 'mode', modes: ['mode1','mode2'] },
                    Terminal:  { type: 'trigger', action: async () => { console.log('Terminal trigger fired'); } },
                    SocketVisual: { type: 'toggle' },
                    General: { type: 'trigger', action: async () => { 
                        if (!Variables.general) {
                            log.info('Please grant permission on the screen after 3 sec.', 3000);
                            setTimeout(() => {
                                Variables.init()
                                .then(() => {log.success('Audio loaded successfully. Tap again to toggle.')})
                                .catch(err => {
                                    log.error('Audio load failed. See F12 for more info.'); 
                                    console.error('Audio load failed', err)})
                            }, 3000); 
                            return;
                        }
                        if (!Variables.general.ended) UtilsModule.toggleText('\\o/\\o/\\o/'); 
                        if (Variables.general.paused || Variables.general.ended) {
                            if (WindowInfo.isMainPage) {
                                document.querySelector('div[class*="checkers"]').style = `background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDcyIDM2Ij4KPHBhdGggZmlsbD0iIzAzNGRhMiIgZD0iTTAgMEg3MlYzNkgwWiIvPgo8cGF0aCBmaWxsPSIjZmZmIiBkPSJNMCA2SDcyVjMwSDBaIi8+CjxwYXRoIGZpbGw9IiNlYzFkMjUiIGQ9Ik0wIDdINzJWMjlIMFoiLz4KPGNpcmNsZSBmaWxsPSIjZmZmIiBjeD0iMjQiIGN5PSIxOCIgcj0iOCIvPgo8cGF0aCBmaWxsPSIjZWMxZDI1IiBkPSJtMjQgMTAuMjUgNC41NTUzMzYgMTQuMDE5ODgyLTExLjkyNjAyNC04LjY2NDc2NCAxNC43NDEzNzYgMC0xMS45MjYwMjQgOC42NjQ3NjR6Ii8+Cjwvc3ZnPg==')`;
                            }
                            Variables.general.play();
                        } else {
                            if (WindowInfo.isMainPage) {
                                document.querySelector('div[class*="checkers"]').style = '';
                            }
                            Variables.general.pause();
                        } 
                    }}
                },
                "Render": {
                    HideGUI: { type: 'toggle' }
                },
                "Combat": {
                    Highlight: { type: 'mode', modes: ['Emoji', 'Hidden'] },
                    NoDelay: { type: 'toggle' },
                    RealEstate: { type: 'toggle' },
                    SetEstate: { type: 'trigger', action: async () => {
                        if (!UserStatus.isEnabled('realestate')) {
                            log.warn("Enable RealEstate first to use this function.")
                            return;
                        }
                        const input = await UtilsModule.showPrompt("Your property will fixed to this number:", "1000");
                        const gg = parseInt(input);
                        if (gg && !isNaN(gg)) {
                            UserStatus.g = gg;
                            log.success(`Your property is fixed to value ${gg}.`);
                        }
                    }},
                    GetUsers: { type: 'trigger', action: async () => {
                        if (UserStatus.player.requesting) {
                            log.warn("Please do not request repeatly.")
                            return;
                        }
                        Kernel.wsInstance.send(`{"t":"d","d":{"r":114,"a":"q","b":{"p":"/${UserStatus.roomId}/c","h":""}}}`)
                        UserStatus.player.requesting = true;
                    }},
                    Packet: { type: 'trigger', action: async () => {
                        if (!Kernel.wsInstance) {
                            log.warn("Cannot send packet because no connection is established.");
                            return;
                        }
                        const input = await UtilsModule.showPrompt("Improper data packet may cause session to crash.<br>If you don't know what to input, close it.<br>Enter packet content:", `{"t":"d",...}`);
                        if (input) {
                            Kernel.wsInstance.send(input);
                            log.success("Packet sent! Toggle 'SocketVisual' and goto F12 for response.");
                        } else {
                            log.warn("Empty content. Abort sending packet.");
                        }
                    }}
                }
            },
            optional: {
                "goldquest.blooket.com": {
                    title: "GoldQuest",
                    options: {
                        ThiefBypass: { type: 'toggle' },
                        Economy:     { type: 'trigger', action: () => {} },
                        Stealer:     { type: 'trigger', action: () => {} },
                        
                    }
                }
            }
        },
        enabledProxy: null,
        /**
         * 初始化基于 Proxy 的 enabled 对象以记录功能切换的变化。
         */
        init() {
            const _e = {};
            this.enabledProxy = new Proxy(_e, {
                set(t, p, v) {
                    const old = t[p];
                    t[p] = v;
                    console.log(`[Proxy] Property "${p}" was ${old===undefined?'added':'modified'}:`, v);
                    return true;
                },
                deleteProperty(t,p) {
                    if (p in t) {
                        console.log(`[Proxy] Property "${p}" was deleted.`);
                        delete t[p];
                        return true;
                    }
                    return false;
                }
            });
            window.enabled = this.enabledProxy;
        }
    };

    /*** Module: UI ***/
    const UIModule = {
        /**
         * 在 DOM 上呈现下拉菜单、固定文本区域和自定义提示。
         */
        init() {
            const container = document.createElement('div');
            container.style.position = 'relative';
            document.body.appendChild(container);

            // 固定文字区
            const fixedText = document.createElement('div');
            fixedText.className = 'fixed-text';
            document.body.appendChild(fixedText);

            // 弹窗区
            const customPrompt = document.createElement('div');
            customPrompt.id = "customPrompt";
            customPrompt.style.display = "none";
            customPrompt.innerHTML = `
                <div class="promptOverlay"></div>
                <div class="promptBox">
                    <div class="promptMessage">Input content:</div>
                    <input type="text" class="promptInput" placeholder="{&quot;t&quot;:&quot;d&quot;,...}"/>
                    <div class="promptButtons">
                    <button class="promptOk">Confirm</button>
                    <button class="promptCancel">Cancel</button>
                    </div>
                </div>`;
            document.body.appendChild(customPrompt);

            let left = 20;
            const renderSection = (title, opts) => {
                this.createDropdown(container, title, opts, left);
                left += 160;
            };

            // 渲染全局菜单
            for (const sect in ConfigModule.functions.global) {
                renderSection(sect, ConfigModule.functions.global[sect]);
            }
            // 渲染可选菜单
            const opt = ConfigModule.functions.optional[WindowInfo.host];
            if (opt) renderSection(opt.title, opt.options);
        },
        /**
         * 使用给定的选项创建下拉列表控件
         * @param {HTMLElement} parent - 下拉列表的容器
         * @param {string} title - 显示下拉列表的标题
         * @param {object} optionsObj - 键：选项标签；值：模式数组
         * @param {number} left - 放置位置的左侧位置（以像素为单位）
         */
        createDropdown(parent, title, optionsObj, left) {
            const dl = document.createElement('div');
            dl.className = 'dropdownContainer';
            dl.style.cssText = `top:70px; left:${left}px;`;
            parent.appendChild(dl);

            const dt = document.createElement('div');
            dt.className = 'dropdownTitle';
            dt.innerHTML = `${title} <img class="dropdownIcon" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIEdlbmVyYXRvcjogU1ZHIFJlcG8gTWl4ZXIgVG9vbHMgLS0+DQo8c3ZnIHdpZHRoPSI4MDBweCIgaGVpZ2h0PSI4MDBweCIgdmlld0JveD0iMCAtMC41IDE3IDE3IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIGNsYXNzPSJzaS1nbHlwaCBzaS1nbHlwaC10cmlhbmdsZS1yaWdodCI+DQogICAgPGcgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+DQogICAgICAgIDxwYXRoIGQ9Ik02LjExMywxNS40OTUgQzUuNTMxLDE2LjA3NiA0LjAxLDE2LjM5NSA0LjAxLDE0LjQ5NCBMNC4wMSwxLjUwNiBDNC4wMSwtMC4zMzMgNS41MzEsLTAuMDc2IDYuMTEzLDAuNTA2IEwxMi41NTcsNi45NDggQzEzLjEzNyw3LjUyOSAxMy4xMzcsOC40NyAxMi41NTcsOS4wNTIgTDYuMTEzLDE1LjQ5NSBMNi4xMTMsMTUuNDk1IFoiIGZpbGw9IiM0MzQzNDMiIGNsYXNzPSJzaS1nbHlwaC1maWxsIj4NCg0KPC9wYXRoPg0KICAgIDwvZz4NCjwvc3ZnPg==" />`;
            dl.appendChild(dt);

            const dd = document.createElement('div');
            dd.className = 'dropdownOptions';
            dl.appendChild(dd);

            let isDragging = false, dragged = false;
            let initialX, initialY, offsetX, offsetY;
            const dragThreshold = 5;

            // 鼠标按下开始准备拖动
            dt.addEventListener('mousedown', (e) => {
                isDragging = true;
                dragged = false;
                initialX = e.clientX;
                initialY = e.clientY;
                const rect = dl.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
            });

            // 鼠标移动时更新位置
            function onMouseMove(e) {
                if (!isDragging) return;
                const dx = e.clientX - initialX;
                const dy = e.clientY - initialY;
                if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
                    dragged = true;
                    dl.style.left = `${e.clientX - offsetX}px`;
                    dl.style.top = `${e.clientY - offsetY}px`;
                }
            }

            function onMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
            
            Object.entries(optionsObj).forEach(([name, conf]) => {
                const opt = document.createElement('div');
                opt.className = 'option';
                opt.textContent = name;
                dd.appendChild(opt);

                let active=false, idx=0, curMode=null;
                opt.addEventListener('click', async () => {
                    if (conf.type === 'toggle') {
                        // 切换启用状态
                        if (UserStatus.isEnabled(name)) UserStatus.removeEnabled(name);
                        else UserStatus.setEnabled(name);
                        UtilsModule.toggleText(name);
                        opt.classList.toggle('active');
                    } else if (conf.type === 'mode') {
                        if (!active) {
                            const modes = conf.modes;
                            curMode = modes[0];
                            idx = 1 % modes.length;
                            UserStatus.setEnabled(name, curMode);
                            UtilsModule.toggleText(name, curMode);
                            opt.classList.add('active');
                            active = true;
                        } else {
                            UserStatus.removeEnabled(name);
                            UtilsModule.toggleText(name, curMode);
                            opt.classList.remove('active');
                            active = false; curMode=null; idx=0;
                        }
                    } else if (conf.type === 'trigger') {
                        await conf.action();
                    }
                });
                opt.addEventListener('contextmenu', e => {
                    // 右键切换模式
                    e.preventDefault();
                    if (conf.type === 'mode' && active) {
                        const old = curMode, modes = conf.modes;
                        curMode = modes[idx]; idx=(idx+1)%modes.length;
                        UserStatus.setEnabled(name, curMode);
                        UtilsModule.updateExtra(name, old, curMode);
                        log.success(`Change ${name} mode to ${curMode}`);
                    }
                });
            });

            dt.addEventListener('click', () => {
                if (dragged) return;
                dd.classList.toggle('show');
                dt.querySelector('.dropdownIcon').classList.toggle('rotate');
            });
        }
    };

    /*** Module: Utils ***/
    const UtilsModule = {
        /**
         * 切换固定文本条目的显示
         * @param {string} text - 要切换的主标签
         * @param {string} [extra] - 可选的模式文本
         */
        toggleText(text, extra) {
            const ft = document.querySelector('.fixed-text');
            const ps = Array.from(ft.querySelectorAll('p'));
            const key = text + (extra ? ` ${extra}` : '');
            const exist = ps.find(p => p.textContent === key);
            if (exist) {
                log.info(`Toggled ${text} OFF`);
                ft.removeChild(exist);
            } else {
                const p = document.createElement('p');
                p.textContent = text;
                if (extra) {
                    p.textContent += ' ';
                    const e = document.createElement('extra');
                    e.textContent = extra;
                    p.appendChild(e);
                }
                ps.push(p);
                ft.appendChild(p);
                ps.sort((a,b)=>b.clientWidth-a.clientWidth);
                ft.innerHTML = '';
                ps.forEach(x=>ft.appendChild(x));
                log.success(`Toggled ${text} ON`);
            }
        },
        /**
         * 更新现有固定文本条目的附加文本
         * @param {string} name - 标签名称
         * @param {string} oldMode - 之前的附加值
         * @param {string} newMode - 新的附加值
         */
        updateExtra(name, oldMode, newMode) {
            const ft = document.querySelector('.fixed-text');
            const ps = Array.from(ft.querySelectorAll('p'));
            ps.forEach(p => {
                if (p.textContent === `${name} ${oldMode}`) {
                    const extra = p.querySelector('extra') || document.createElement('extra');
                    extra.textContent = newMode;
                    if (!p.querySelector('extra')) p.appendChild(extra);
                }
            });
            ps.sort((a,b)=>b.clientWidth-a.clientWidth);
            ft.innerHTML = '';
            ps.forEach(x=>ft.appendChild(x));
        },
        /**
         * 异步，显示自定义提示对话框并返回用户输入
         * @param {string} message - 提示消息
         * @param {string} placeholder - 占位符
         * @returns {Promise<string|null>} 用户输入，如果取消则返回 null
         */
        buildPrompt(message, placeholder="") {
            return new Promise(resolve => {
                const box = document.getElementById('customPrompt');
                const msgEl = box.querySelector('.promptMessage');
                const inp = box.querySelector('.promptInput');
                const ok = box.querySelector('.promptOk');
                const can = box.querySelector('.promptCancel');
                msgEl.innerHTML = message; inp.value=''; inp.placeholder=placeholder;
                box.style.display='flex'; inp.focus();
                const cleanup = res => {
                    box.style.display='none';
                    ok.removeEventListener('click', onOk);
                    can.removeEventListener('click', onCan);
                    resolve(res);
                };
                const onOk = () => cleanup(inp.value||null);
                const onCan = () => cleanup(null);
                ok.addEventListener('click', onOk);
                can.addEventListener('click', onCan);
                inp.addEventListener('keydown', e => {
                    if (e.key==='Enter') onOk();
                    if (e.key==='Escape') onCan();
                });
            });
        },
        /**
         * 显示自定义提示对话框并返回用户输入
         * @param {string} prompt - 提示消息
         * @param {string} placeholder - 占位符
         * @returns {Promise<string|null>} 用户输入，如果取消则返回 null
         */
        showPrompt: async function(prompt, placeholder) {
            return await this.buildPrompt(prompt, placeholder);
        },
        /**
         * 生成问题的唯一哈希值
         * @param {object} questionObj - 包含问题文本和答案的对象
         * @param {string} qType - 问题类型（如 "mc" 或 "typing"）
         * @returns {string} 生成的哈希值
         */
        generateQuestionHash: function (questionObj, qType) {
            const normalizedQuestion = questionObj.question.trim().toUpperCase();
            let answers;
            switch (qType) {
                case "mc":
                    answers = questionObj.answers;
                    break;
                case "typing":
                    answers = [];
                    break
                default:
                    throw new ReferenceError(`Unknown question type: ${questionObj.qType}`);
            }
            const sortedAnswers = answers
              .map(answer => answer.trim().toUpperCase())
              .sort();
            const imageId = questionObj.image?.id || "";
            const hashKey = `${normalizedQuestion}::${sortedAnswers.join("::")}::${imageId}`;
            return hashKey;
        },
        /**
         * 提取问题数据，包括文本、答案和图片 ID
         * @return {object} 包含问题文本、答案数组和图片 ID 的对象
         */
        extractQuestionData: function () {
            const questionEl = document.querySelector('[class*="_questionText_"] div');
            const question = questionEl ? questionEl.textContent.trim() : "";
          
            const answerEls = document.querySelectorAll('[class*="_answersHolder_"] [class*="_answerText_"] div');
            const answers = Array.from(answerEls)
              .map(el => el.textContent.trim())
              .sort();

            const imgEl = document.querySelector('[class*="_imageContainer_"] img');
            let imageId = "";
            if (imgEl?.src) {
              const match = imgEl.src.match(/\/([a-z0-9]+)\.(png|jpe?g|webp)/i);
              if (match) {
                imageId = match[1]; // 提取 ID
              }
            }
          
            return {
              question,
              answers,
              image: { id: imageId }
            };
        },
        /**
         * 获取浏览器指纹的 UUID
         * @returns {Promise<string>} 返回一个 Promise，解析为 UUID 字符串
         */
        fetchUUID: async function () {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            return result.visitorId; // UUID 替代品
        },
        /**
         * 验证许可证签名
         * @return {Promise<boolean>} 返回一个 Promise，解析为布尔值，表示验证是否成功
         */
        validateLicense: async function() {
            const uuid = await UtilsModule.fetchUUID();
            let license = await GM.getValue('license');
        
            if (!license) {
                const code = prompt("为防止滥用导致软件失效，使用前需验证卡密防止外传，请谅解。\n请输入卡密以获取授权");
                if (!code) {
                    alert("卡密未提供，无法验证");
                    return false;
                }
        
                // 发送卡密和UUID给服务端获取签名（假设为 /validate）
                const res = await fetch("https://your-server.com/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, uuid })
                });
        
                if (!res.ok) {
                    alert("服务器验证失败");
                    return false;
                }
        
                const data = await res.json();
                license = data.token; // license 是签名 token（JWT 或自定义）
                await GM.setValue("license", license);
            }
        
            // 本地验证签名（伪代码，需用具体算法实现）
            const valid = await UtilsModule.verifySignature(license, uuid);
            if (!valid) {
                alert("本地签名校验失败");
                return false;
            }
        
            alert("授权验证通过！请不要切换浏览器，否则校验将失效");
            return true;
        }
        
    };

    const UserStatus = {
        authorized: true,
        g: null,
        skin: null,
        roomId: null,
        qset: {
            id: null,
            details: new Map()
        },
        player: {
            requesting: false,
            data: null
        },
        enabled: new Map(),
        isEnabled: function (option) {
            return this.enabled.has(option.toLowerCase())
        },
        setEnabled: function (option, mode=null) { 
            if (!UserStatus.authorized) {
                log.error("Authorization Required.")
                return;
            }
            this.enabled.set(option.toLowerCase(), mode && mode.toLowerCase())
        },
        removeEnabled: function (option) {
            this.enabled.delete(option.toLowerCase())
        },
        hasMode: function (option, mode) {
            return this.enabled.get(option.toLowerCase()) === mode.toLowerCase();
        }
    }

    const Kernel = {
        wsInstance: null,
        init: function() {
            // 劫持 Websocket
            const OriginalWebSocket = window.WebSocket; // 保存原始 WebSocket

            function socketLog(...args) {
                if (UserStatus.isEnabled('socketvisual')) console.log(...args);
            }

            function logData(label, data, color = '#ffffff') {
                if (UserStatus.isEnabled('socketvisual')) {
                    console.log(`%c[EvilSocket] ${label}`, `color: ${color}; font-weight: bold;`, data);
                }
            }

            // 重写 WebSocket 构造器
            unsafeWindow.WebSocket = class extends OriginalWebSocket {
                constructor(url, protocols) {
                    socketLog("%c[EvilSocket] [+] Injection complete. Monitoring WebSocket.", "color: #bb00ff; font-weight: bold;");
                    socketLog(`%c[EvilSocket] [~] Initiating connection to ${url}`, "color: #cccccc;");
                    super(url, protocols);

                    this._url = url;
                    this._protocols = protocols;
                    this._createdAt = new Date();

                    Kernel.wsInstance = this;

                    this.addEventListener('open', (event) => {
                        socketLog('%c[EvilSocket] [⇄] Socket opened.', "color: #ffaa00;", event);
                        log.info('Detected a new WebSocket connection is established.<br>Everything is under control!', 2000)
                    });

                    this.addEventListener('message', async (event) => {
                        logData('[⇓] Incoming message.', event.data, '#00aaff'); // 亮蓝
                        await Kernel.handleIncomingData(event.data)
                    });

                    this.addEventListener('error', (event) => {
                        console.error('%c[EvilSocket] [!] Socket encountered an error.', "color: #ff3333;", event);
                    });

                    this.addEventListener('close', (event) => {
                        console.warn('%c[EvilSocket] [x] Socket connection terminated.', "color: #ff5555;", event);
                    });

                    const originalSend = this.send;
                    this.send = function (data) {
                        const checkedPacket = Kernel.handleOutgoingData(data);
                        if (!checkedPacket) {
                            console.warn('Blocked outgoing WebSocket message:', data);
                            return;
                        }
                        logData('[⇑] Outgoing message.', checkedPacket, '#00dd55'); // 亮绿
                        return originalSend.call(this, checkedPacket);
                    };

                    // 提供调试方法
                    this._debug = {
                        getInfo: () => ({
                            url: this._url,
                            readyState: this.readyState,
                            createdAt: this._createdAt,
                        }),
                        forceClose: () => {
                            socketLog(`%c[EvilSocket] [x] Forcing connection close: ${this._url}`, "color: red;");
                            this.close(4000, 'Debug close');
                        },
                        sendTest: (msg = 'Hello from EvilSocket!') => {
                            this.send(msg);
                        }
                    };

                    // const origAddEventListener = this.addEventListener.bind(this);
                    // this.addEventListener = (type, listener, ...rest) => {
                    //     if (type === 'message') {
                    //         console.log("Hooked addEventListener('message', ...)");
                    //         const wrapped = (event) => {
                    //             console.log("Received WebSocket message:", event.data);
                    //             listener.call(this, event);
                    //         };
                    //         return origAddEventListener(type, wrapped, ...rest);
                    //     }
                    //     return origAddEventListener(type, listener, ...rest);
                    // };

                    let _onmessage = null;
                    Object.defineProperty(this, 'onmessage', {
                        get: () => _onmessage,
                        set: (handler) => {
                            console.log("Hooked onmessage()");
                            _onmessage = (event) => {
                                // console.log("Received WebSocket message:", event.data);
                                handler.call(this, event);
                            };
                            super.onmessage = _onmessage;
                        },
                        configurable: true,
                        enumerable: true
                    });
                }
            };

            console.warn("%c[EvilSocket] ⚠️ WebSocket prototype overridded.", "color: #ff4444; font-weight: bold;");
            
            // 初始化 MutationObserver 监听浏览器元素，每次题目出现时执行回调 `elementHolderCallback`
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        this.elementHolderCallback(node);
                        // 也检查子节点（例如整个 section 或页面块被插入）
                        if (node.querySelectorAll) {
                            node.querySelectorAll('div').forEach(child => this.elementHolderCallback(child));
                        }
                    });
                });
            });
        
            // 开始观察 document.body 的子节点变化
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            // 劫持 SetInterval 用于取消倒计时
            const origInterval = unsafeWindow.setInterval;
            unsafeWindow.setInterval = function (...args) {
                const [callback, delay, ...rest] = args;
                if (UserStatus.isEnabled('nodelay') && delay === 1000) {
                    console.log("Intercepted countdown");
                    if (typeof callback === 'function') {
                        console.log(callback.toString());
                    }
                    return origInterval(callback, 0, ...rest);
                }
                return origInterval(...args);
            };
            unsafeWindow.setInterval.toString = () => origInterval.toString();
        },

        elementHolderCallback: function(node) {
            if (node.nodeType === 1 && ['div', 'form'].includes(node.tagName.toLowerCase())) {
                if (UserStatus.isEnabled('highlight') && node.classList && [...node.classList].some(cls => cls.includes('_answersHolder_'))) {
                    console.log('检测到包含 _answersHolder 的元素:', node);
                    const currentQuestionHash = UtilsModule.generateQuestionHash(UtilsModule.extractQuestionData(), "mc");
                    console.log('currentQuestionHash', currentQuestionHash)
                    const correctAnswers = UserStatus.qset.details.get(currentQuestionHash);
                    console.log('correctAnswers', correctAnswers)
                    
                    const answerEls = document.querySelectorAll('[class*="_answersHolder_"] [class*="_answerText_"] div');
                    for (const e of Array.from(answerEls)) {
                        if (correctAnswers.includes(e.textContent.trim().toUpperCase())) {
                            if (UserStatus.hasMode('highlight', 'Emoji')) e.textContent += "✅";
                        } else {
                            if (UserStatus.hasMode('highlight', 'Emoji')) {
                                e.textContent += "🚫";
                            } else if (UserStatus.hasMode('highlight', 'Hidden')) {
                                const wrapper = e.closest('[class*="_answerWrapper_"]');
                                const container = e.closest('[class*="_answerContainer_"]')
                                wrapper.style.border = '2px dashed gray';
                                wrapper.style.borderRadius = '8px';
                                container.style.opacity = '0.2';
                                container.style.pointerEvents = 'none';
                            }
                        }
                    }
                } else if (UserStatus.isEnabled('highlight') && [...node.classList].some(cls => cls.includes('_typingAnswerWrapper_'))) {
                    console.log('检测到包含 _typingAnswerWrapper 的元素:', node);
                    const currentQuestionHash = UtilsModule.generateQuestionHash(UtilsModule.extractQuestionData(), "typing");
                    console.log('currentQuestionHash', currentQuestionHash);
                    const correctAnswers = UserStatus.qset.details.get(currentQuestionHash);
                    console.log('correctAnswers', correctAnswers);

                    const inputElement = node.querySelector('[class*="_typingAnswerInput_"]');
                    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(inputElement, correctAnswers[0]);
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if ([...node.classList].some(cls => cls.includes('_playerEnergy_'))) {
                    console.log('开始监听 _playerEnergy 的 div:', node);
        
                    const energyObserver = new MutationObserver(mutations => {
                        mutations.forEach(mutation => {
                            console.log('检测到 _playerEnergy 内容变化:', mutation.target);
                            if (UserStatus.isEnabled('realestate') && UserStatus.g !== null && mutation.target.textContent !== UserStatus.g.toString()) {
                                mutation.target.textContent = UserStatus.g.toString();
                            }
                        });
                    });
        
                    energyObserver.observe(node, {
                        characterData: true,
                        subtree: true,
                        childList: true,
                    });
                }
            }
        },

        handleIncomingData: async function(packet) {
            try {
                // 尝试解析 JSON
                let data;
                try {
                    data = JSON.parse(packet);
                } catch (e) {
                    console.warn("Invalid packet: ", packet);
                    log.warn("Warning: encountered an invalid incoming packet. Ignored.")
                    return;
                }
                
                if (UserStatus.qset.id === null) {
                    console.log("Data not yet fetched, trying...")
                    const timestamp = data?.d?.b?.d?.s?.d;
                    const setId = data?.d?.b?.d?.set;
                    const roomId = data?.d?.b?.p;
                    if (timestamp && setId && roomId) {
                        log.success(`Log on at ${timestamp}. RoomID: ${roomId}`);
                        UserStatus.qset.id = setId;
                        UserStatus.roomId = roomId;
                        try {
                            const res = await fetch(`https://${WindowInfo.host}/api/questionsets/detailforplayregisterpage?id=${setId}`);
                            if (!res.ok) throw new Error("Request failed: " + res.status);
                            const data = await res.json();
                            const questions = data.questions;
                            for (const question of questions) {
                                const questionHash = UtilsModule.generateQuestionHash(question, question.qType)
                                switch (question.qType) {
                                    case "mc":
                                        UserStatus.qset.details.set(questionHash, question.correctAnswers);
                                        break;
                                    case "typing":
                                        UserStatus.qset.details.set(questionHash, question.answers);
                                        break;
                                }
                            }
                            console.log("QSet", UserStatus.qset.details)
                            log.success(`Answerset was successfully fetched.<br>Title: ${data.title}<br>SetID: ${data.id}`, 3000);
                        } catch (e) {
                            log.error("Error occured while fetching answer sets. See F12 for more info.");
                            console.error("Error occured while fetching answer sets.", e);
                        }
                    }
                }

                if (UserStatus.player.requesting) {
                    const players = data?.d?.b?.d
                    if (players) {
                        UserStatus.player.data = players;
                        UserStatus.player.requesting = false;
                        log.info("Users fetched successfully!");
                        console.log(players);
                    }
                }
                if (UserStatus.isEnabled('thiefbypass')) {
                    // {"t":"d","d":{"b":{"p":"2203986/c/dp/at","d":"dp2:Polar Bear:39"},"a":"d"}}
                    const stolen = data?.d?.b?.d
                    if (stolen) {
                        
                    }
                }
        
            } catch (err) {
                console.error("Error on handling incoming message: ", err);
                log.error("Error on handling incoming message. See F12 for more info.")
            }
        },

        handleOutgoingData: function (payload) {
            if (payload === '0') return payload; // 忽略心跳包
            try {
                // 尝试解析 JSON
                let data;
                try {
                    data = JSON.parse(payload);
                } catch (e) {
                    console.warn("Invalid packet: ", payload);
                    log.warn("Warning: encountered an invalid outgoing packet. Ignored.");
                    return payload;
                }
                const currentGold = WindowInfo.currency ? data?.d?.b?.d?.[WindowInfo.currency] : null;
                if (currentGold && UserStatus.isEnabled('realestate')) {
                    if (UserStatus.g === null) {
                        log.warn("You have not selected a value! Click on SetEstate to set a property.")
                    } else {
                        data.d.b.d[WindowInfo.currency] = UserStatus.g;
                        payload = JSON.stringify(data);
                    }
                }
            } catch (err) {
                console.error("Error on handling outgoing message: ", err);
                log.error("Error on handling outgoing message. See F12 for more info.");
            }
            return payload;
        }

    }
    /**
     * 示例函数，演示 prompt 的用法
     * @param {string} prompt - 询问用户的消息
     */
    window.askUser = async function(prompt) {
        const input = await UtilsModule.showPrompt(prompt);
        if (input !== null) console.log("用户输入：", input);
        else console.log("用户取消输入");
    };

    /**
     * 入口点：按顺序在所有模块上调用 init
     */
    function main() {
        if (!WindowInfo.isMainPage) Kernel.init();
        window.addEventListener('DOMContentLoaded', async () => {
            StyleModule.init();
            ToastModule.init();
            ConfigModule.init();
            UIModule.init();
            if (!await GM.getValue("shownDisclaimer", false)) {
                log.warn("Disclaimer: This script will modify data packets.<br>Using this tool may cause your account to be suspended or banned.<br>The creator is not responsible for the consequences of using this tool.<br>It is recommended that you use this tool with a temporary account.<br>The warning will only show ONCE.", 15000)
                await GM.setValue("shownDisclaimer", true);
            }
            log.success("Modules initialized successfully.", 3000);
            log.info(`HackMyBlooket v${GM.info.script.version}`, 5000);
        })
        // 注意：所有逻辑已在各自 init 中绑定，无需额外调用
    }

    // (async () => {
    //     console.log("Your Fingerprint:", await UtilsModule.fetchUUID())
    //     if (await UtilsModule.validateLicense()) {
    //         main();
    //     }
    // })();
    main();

})();
