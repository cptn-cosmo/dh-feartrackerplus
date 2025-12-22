const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FearTrackerApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static instance;

    constructor(options = {}) {
        super(options);
        this._dragData = {
            isDragging: false,
            startX: 0,
            startY: 0,
            startLeft: 0,
            startTop: 0
        };
    }

    static DEFAULT_OPTIONS = {
        id: "dh-feartrackerplus-app",
        tag: "div",
        classes: ["dh-feartrackerplus-window"],
        window: {
            frame: false,
            positioned: true,
            resizable: true
        },
        position: {
            width: 300,
            height: "auto",
        },
        actions: {
            increaseFear: FearTrackerApp.#onIncrease,
            decreaseFear: FearTrackerApp.#onDecrease,
            toggleViewMode: FearTrackerApp.#onToggleView,
            toggleLock: FearTrackerApp.#onToggleLock
        }
    };

    static PARTS = {
        content: {
            template: "modules/dh-feartrackerplus/templates/fear-tracker.hbs",
        },
    };

    static initialize() {
        if (this.instance) return;
        this.instance = new FearTrackerApp();
        const pos = game.settings.get("dh-feartrackerplus", "position") || { top: 100, left: 100 };
        const width = game.settings.get("dh-feartrackerplus", "width");
        if (width) pos.width = width;
        this.instance.render({ force: true, position: pos });
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Apply saved width
        const savedWidth = game.settings.get("dh-feartrackerplus", "width");
        if (savedWidth) {
            this.element.style.width = `${savedWidth}px`;
            if (savedWidth < 100) {
                this.element.classList.add('narrow');
            } else {
                this.element.classList.remove('narrow');
            }
        }

        // Apply Icon Size
        const iconSize = game.settings.get("dh-feartrackerplus", "iconSize") || 32;
        this.element.style.setProperty('--fear-token-size', `${iconSize}px`);

        // Sync locked class explicitly
        const isLocked = game.settings.get("dh-feartrackerplus", "locked");
        if (isLocked) this.element.classList.add('locked');
        else this.element.classList.remove('locked');

        this.#setupDragging();
        this.#setupResizing();

        // Setup conditional hover for locked mode
        this.element.addEventListener('mouseenter', (e) => {
            const isLocked = game.settings.get("dh-feartrackerplus", "locked");
            if (isLocked) {
                // Check if Ctrl is already held
                if (e.ctrlKey) {
                    this.element.classList.add('force-expand');
                }

                // Listen for Ctrl key changes while hovering
                this._hoverKeyHandler = (ke) => {
                    if (ke.key === 'Control') {
                        if (ke.type === 'keydown') this.element.classList.add('force-expand');
                        if (ke.type === 'keyup') this.element.classList.remove('force-expand');
                    }
                };
                window.addEventListener('keydown', this._hoverKeyHandler);
                window.addEventListener('keyup', this._hoverKeyHandler);
            }
        });

        this.element.addEventListener('mouseleave', () => {
            this.element.classList.remove('force-expand');
            if (this._hoverKeyHandler) {
                window.removeEventListener('keydown', this._hoverKeyHandler);
                window.removeEventListener('keyup', this._hoverKeyHandler);
                this._hoverKeyHandler = null;
            }
        });
        this.#setupTokenInteractions();
        this.#animateMaxFear();

        // Context Menu for Unlocking (Right-click)
        // Use namespaced class and provide empty options to avoid system error
        new foundry.applications.ux.ContextMenu(this.element, ".fear-tracker-window", [
            {
                name: "Unlock Position",
                icon: '<i class="fas fa-lock-open"></i>',
                condition: () => game.settings.get("dh-feartrackerplus", "locked"),
                callback: async () => {
                    await game.settings.set("dh-feartrackerplus", "locked", false);
                    this.render();
                }
            },
            {
                name: "Lock Position",
                icon: '<i class="fas fa-lock"></i>',
                condition: () => !game.settings.get("dh-feartrackerplus", "locked"),
                callback: async () => {
                    await game.settings.set("dh-feartrackerplus", "locked", true);
                    this.render();
                }
            }
        ], {});
    }

    updateFearData(data) {
        // Store context from system render
        this._systemData = data;
        this.render();
    }

    async _prepareContext(options) {
        const isGM = game.user.isGM;
        const isMinimized = game.settings.get("dh-feartrackerplus", "minimized");
        const isLocked = game.settings.get("dh-feartrackerplus", "locked");

        // Get Fear Data from System Settings
        // Use "daggerheart" scope and specific keys found in system config
        let currentFear = 0;
        let maxFear = 6;

        try {
            currentFear = game.settings.get("daggerheart", "ResourcesFear");
            const homebrew = game.settings.get("daggerheart", "Homebrew");
            if (homebrew?.maxFear) {
                maxFear = homebrew.maxFear;
            }
        } catch (e) {
            console.warn("FearTracker | Could not read system settings:", e);
        }

        // Settings
        const iconShape = game.settings.get("dh-feartrackerplus", "iconShape");
        const iconType = game.settings.get("dh-feartrackerplus", "iconType");
        const colorTheme = game.settings.get("dh-feartrackerplus", "colorTheme");
        const viewMode = game.settings.get("dh-feartrackerplus", "viewMode");
        const showFearNumber = game.settings.get("dh-feartrackerplus", "showFearNumber");
        const showControlButtons = game.settings.get("dh-feartrackerplus", "showControlButtons");
        const progressBarColor = game.settings.get("dh-feartrackerplus", "progressBarColor");

        const useBar = viewMode === 'bar';
        let barStyle = '';

        if (useBar) {
            // Calculate Percentage
            const pct = Math.min(100, Math.max(0, (currentFear / maxFear) * 100));

            // Determine Color
            let color = progressBarColor;

            // If theme is NOT custom, attempt to use theme colors.
            if (colorTheme !== 'custom') {
                const themes = {
                    'hope-fear': { start: '#FFC107', end: '#512DA8' },
                    'blood-moon': { start: '#5c0000', end: '#ff0000' },
                    'ethereal': { start: '#00FFFF', end: '#0000FF' },
                    'toxic': { start: '#00FF00', end: '#FFFF00' },
                    'foundryborne': { start: '#0a388c', end: '#791d7d' }
                };
                const t = themes[colorTheme];
                if (t) {
                    // Gradient bar for theme?
                    color = `linear-gradient(90deg, ${t.start}, ${t.end})`;
                }
            }

            barStyle = `width: ${pct}%; background: ${color};`;
        }

        // Build Tokens (only if not bar)
        const fearTokens = [];
        if (!useBar) {
            for (let i = 0; i < maxFear; i++) {
                fearTokens.push({
                    index: i,
                    active: i < currentFear,
                    icon: this.#getIconHtml(iconType, i),
                    style: this.#getTokenStyle(i, maxFear, colorTheme, i < currentFear)
                });
            }
        }

        return {
            isGM,
            isMinimized,
            isLocked,
            currentFear,
            maxFear,
            fearTokens,
            iconShape,
            showFearValue: !isMinimized && showFearNumber, // Respect setting
            showControlButtons,
            useBar,
            barStyle
        };
    }

    #getIconHtml(iconType, index) {
        let iconClass = 'fas fa-skull';
        const presetIcon = game.settings.get("dh-feartrackerplus", "presetIcon");
        const customIcon = game.settings.get("dh-feartrackerplus", "customIcon");

        if (iconType === 'preset') iconClass = presetIcon;
        else if (iconType === 'custom') iconClass = customIcon;
        else if (iconType === 'custom-svg') {
            const svgPath = game.settings.get("dh-feartrackerplus", "customSvgPath");
            return `<img src="${svgPath || 'icons/svg/mystery-man.svg'}" class="fear-icon-img" />`;
        }

        if (iconClass.includes('.svg')) {
            return `<img src="${iconClass}" class="fear-icon-img" />`;
        }

        const iconColor = game.settings.get("dh-feartrackerplus", "iconColor");
        let style = "";
        if (iconColor && iconColor !== '#ffffff') {
            if (iconColor.includes('gradient')) {
                style = `background: ${iconColor}; -webkit-background-clip: text; background-clip: text; color: transparent;`;
            } else {
                style = `color: ${iconColor};`;
            }
        }

        return `<i class="${iconClass}" style="${style}"></i>`;
    }

    #getTokenStyle(index, total, theme, isActive) {
        if (!isActive) return `background: #444;`;
        let color = '#cf0000';

        if (theme === 'custom') {
            const fullColor = game.settings.get("dh-feartrackerplus", "fullColor");
            if (fullColor.includes('gradient')) {
                const posPercent = total > 1 ? (index / (total - 1)) * 100 : 0;
                return `background: ${fullColor} no-repeat; background-size: ${total * 100}% 100%; background-position: ${posPercent}% 0%; background-origin: border-box;`;
            }
            color = fullColor;
        } else {
            const themes = {
                'foundryborne': { start: '#0a388c', end: '#791d7d' },
                'hope-fear': { start: '#FFC107', end: '#512DA8' },
                'blood-moon': { start: '#5c0000', end: '#ff0000' },
                'ethereal': { start: '#00FFFF', end: '#0000FF' },
                'toxic': { start: '#00FF00', end: '#FFFF00' }
            };
            const t = themes[theme];
            if (t) {
                const gradient = `linear-gradient(90deg, ${t.start}, ${t.end})`;
                // Prevent wrapping artifacts with no-repeat.
                // Handle single token case to avoid /0 NaN.
                const posPercent = total > 1 ? (index / (total - 1)) * 100 : 0;
                return `background: ${gradient} no-repeat; background-size: ${total * 100}% 100%; background-position: ${posPercent}% 0%; background-origin: border-box;`;
            }
        }

        return `background: ${color};`;
    }

    static async #onIncrease(event, target) {
        if (!game.user.isGM) return; // Only GM can modify fear via this method for now

        try {
            const currentFear = game.settings.get("daggerheart", "ResourcesFear");
            const homebrew = game.settings.get("daggerheart", "Homebrew");
            const maxFear = homebrew?.maxFear || 6;

            if (currentFear < maxFear) {
                await game.settings.set("daggerheart", "ResourcesFear", currentFear + 1);
            }
        } catch (e) {
            console.error("FearTracker | Error increasing fear:", e);
        }
    }

    static async #onDecrease(event, target) {
        if (!game.user.isGM) return;

        try {
            const currentFear = game.settings.get("daggerheart", "ResourcesFear");

            if (currentFear > 0) {
                await game.settings.set("daggerheart", "ResourcesFear", currentFear - 1);
            }
        } catch (e) {
            console.error("FearTracker | Error decreasing fear:", e);
        }
    }

    static async #onToggleView(event, target) {
        const current = game.settings.get("dh-feartrackerplus", "minimized");
        await game.settings.set("dh-feartrackerplus", "minimized", !current);
        FearTrackerApp.instance?.render();
    }

    static async #onToggleLock(event, target) {
        const current = game.settings.get("dh-feartrackerplus", "locked");
        await game.settings.set("dh-feartrackerplus", "locked", !current);
        // Re-render handled by setting hook usually, but let's ensure
        FearTrackerApp.instance?.render();
    }



    #setupTokenInteractions() {
        if (!game.user.isGM) return;
        const tokens = this.element.querySelectorAll('.fear-token');
        tokens.forEach(t => {
            t.addEventListener('click', this.#onTokenClick.bind(this));
            t.style.cursor = 'pointer'; // Ensure visual cue
        });
    }

    async #onTokenClick(e) {
        e.preventDefault();
        if (!game.user.isGM) return;

        const token = e.currentTarget;
        const index = parseInt(token.dataset.index);

        let currentActive = 0;
        let maxFear = 6;
        try {
            currentActive = game.settings.get("daggerheart", "ResourcesFear");
            const homebrew = game.settings.get("daggerheart", "Homebrew");
            if (homebrew?.maxFear) {
                maxFear = homebrew.maxFear;
            }
        } catch (e) {
            console.error("FearTracker | Error reading settings in click handler:", e);
            return;
        }

        let targetValue = index + 1;

        // Toggle off if clicking the first one while it is the only one active
        if (index === 0 && currentActive === 1) {
            targetValue = 0;
        }

        // Safety checks
        if (targetValue < 0) targetValue = 0;
        if (targetValue > maxFear) targetValue = maxFear;

        if (targetValue !== currentActive) {
            await game.settings.set("daggerheart", "ResourcesFear", targetValue);
        }
    }

    #animateMaxFear() {
        const animate = game.settings.get("dh-feartrackerplus", "maxFearAnimation");
        if (!animate) return;

        const fear = game.settings.get("daggerheart", "ResourcesFear");
        const homebrew = game.settings.get("daggerheart", "Homebrew");
        const maxFear = homebrew?.maxFear || 6;

        if (fear >= maxFear) {
            this.element.classList.add('max-fear');
            this.element.querySelectorAll('.fear-token i, .fear-token img').forEach(icon => {
                icon.classList.add('fear-pulse');
            });
        } else {
            this.element.classList.remove('max-fear');
        }
    }

    #setupDragging() {
        if (game.settings.get("dh-feartrackerplus", "locked")) return;
        const dragHandle = this.element.querySelector('.drag-handle');
        if (!dragHandle) return;
        dragHandle.addEventListener('mousedown', this.#onDragStart.bind(this));
    }

    #onDragStart(e) {
        if (e.button !== 0) return;
        this._dragData.isDragging = true;
        this._dragData.startX = e.clientX;
        this._dragData.startY = e.clientY;
        const rect = this.element.getBoundingClientRect();
        this._dragData.startLeft = rect.left;
        this._dragData.startTop = rect.top;
        this.element.style.cursor = 'grabbing';

        // Bind to window to catch movements outside the element
        this._dragHandler = this.#onDragging.bind(this);
        this._dragEndHandler = this.#onDragEnd.bind(this);
        window.addEventListener('mousemove', this._dragHandler);
        window.addEventListener('mouseup', this._dragEndHandler);
    }

    #onDragging(e) {
        if (!this._dragData.isDragging) return;
        const dx = e.clientX - this._dragData.startX;
        const dy = e.clientY - this._dragData.startY;
        this.element.style.left = `${this._dragData.startLeft + dx}px`;
        this.element.style.top = `${this._dragData.startTop + dy}px`;
    }

    #onDragEnd() {
        if (!this._dragData.isDragging) return;
        this._dragData.isDragging = false;
        this.element.style.cursor = '';

        if (this._dragHandler) window.removeEventListener('mousemove', this._dragHandler);
        if (this._dragEndHandler) window.removeEventListener('mouseup', this._dragEndHandler);

        const rect = this.element.getBoundingClientRect();
        const pos = { top: rect.top, left: rect.left };
        game.settings.set("dh-feartrackerplus", "position", pos);
        this.setPosition(pos);
    }

    #setupResizing() {
        if (game.settings.get("dh-feartrackerplus", "locked")) return;
        const resizeHandle = this.element.querySelector('.resize-handle');
        if (!resizeHandle) return;
        resizeHandle.addEventListener('mousedown', this.#onResizeStart.bind(this));
    }

    #onResizeStart(e) {
        if (e.button !== 0) return;
        e.stopPropagation(); // Prevent drag start

        let maxAllowedWidth = 10000; // Default high
        const tokens = this.element.querySelectorAll('.fear-token');
        if (tokens.length > 0) {
            // Calculate max width for single line of tokens
            const iconSize = game.settings.get("dh-feartrackerplus", "iconSize") || 32;
            const tokenWidth = iconSize;
            const tokenGap = 6;
            const count = tokens.length;
            const idealTokensWidth = (count * tokenWidth) + (Math.max(0, count - 1) * tokenGap);

            // Siblings (Buttons) in fear-visuals
            let siblingsWidth = 0;
            const visuals = this.element.querySelector('.fear-visuals');
            if (visuals) {
                // Count children that are NOT the tokens-container
                let otherCount = 0;
                Array.from(visuals.children).forEach(child => {
                    if (!child.classList.contains('tokens-container')) {
                        siblingsWidth += child.offsetWidth;
                        otherCount++;
                    }
                });

                // Add gaps between visuals children
                // Total items = otherCount + 1 (tokens container)
                const visualsGap = 8;
                const totalVisualsGaps = otherCount * visualsGap;

                // Window Padding (8px * 2) + Border (1px * 2)
                const chromeWidth = 18;

                maxAllowedWidth = idealTokensWidth + siblingsWidth + totalVisualsGaps + chromeWidth;
            }
        }

        this._resizeData = {
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: this.element.offsetWidth,
            startHeight: this.element.offsetHeight,
            maxAllowedWidth: Math.max(50, maxAllowedWidth) // Lower min constraint
        };

        this._resizeHandler = this.#onResizing.bind(this);
        this._resizeEndHandler = this.#onResizeEnd.bind(this);
        window.addEventListener('mousemove', this._resizeHandler);
        window.addEventListener('mouseup', this._resizeEndHandler);
    }

    #onResizing(e) {
        if (!this._resizeData?.isResizing) return;

        const currentDx = e.clientX - this._resizeData.startX;
        const potentialWidth = Math.max(50, this._resizeData.startWidth + currentDx); // Lower min constraint

        // Apply constraint
        const width = Math.min(potentialWidth, this._resizeData.maxAllowedWidth);

        this.element.style.width = `${width}px`;

        // Toggle narrow class
        if (width < 100) {
            this.element.classList.add('narrow');
        } else {
            this.element.classList.remove('narrow');
        }
    }

    #onResizeEnd() {
        if (!this._resizeData?.isResizing) return;
        this._resizeData.isResizing = false;

        if (this._resizeHandler) window.removeEventListener('mousemove', this._resizeHandler);
        if (this._resizeEndHandler) window.removeEventListener('mouseup', this._resizeEndHandler);

        // Save Width Setting
        // Use inline style width to capture the "logical" width, ignoring hover expansion
        let width = parseFloat(this.element.style.width);

        // Fallback if style.width is missing or invalid (shouldn't happen after resize)
        if (isNaN(width)) {
            width = this.element.getBoundingClientRect().width;
        }

        game.settings.set("dh-feartrackerplus", "width", width);
        this.setPosition({ width: width });
    }
}
