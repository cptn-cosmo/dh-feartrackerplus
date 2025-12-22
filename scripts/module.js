import { FearTrackerApp } from './fear-tracker-app.js';

const MODULE_ID = 'dh-feartrackerplus';

Hooks.once('init', () => {
    console.log(`${MODULE_ID} | Initializing Daggerheart Fear Tracker Plus`);

    const refreshFearTracker = () => {
        FearTrackerApp.instance?.render();
    };

    // Register Settings
    game.settings.register(MODULE_ID, 'iconType', {
        name: 'Icon Source',
        hint: 'Choose whether to use a preset icon or a custom FontAwesome class.',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'preset': 'Preset List',
            'custom': 'Custom FontAwesome Class',
            'custom-svg': 'Custom SVG File'
        },
        default: 'preset',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'presetIcon', {
        name: 'Preset Icon',
        hint: 'Select an icon from the list.',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'fas fa-skull': 'Skull (Default)',
            'fas fa-ghost': 'Ghost',
            'fas fa-fire': 'Fire',
            'fas fa-heart-broken': 'Broken Heart',
            'fas fa-dizzy': 'Dizzy Face',
            'fas fa-book-dead': 'Book of Dead',
            'fas fa-spider': 'Spider',
            'fas fa-cloud-meatball': 'Cloud Meatball',
            'fas fa-biohazard': 'Biohazard',
            'fas fa-radiation': 'Radiation',
            'systems/daggerheart/assets/icons/documents/actors/capybara.svg': 'Capybara (Foundryborne)'
        },
        default: 'fas fa-skull',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'customIcon', {
        name: 'Custom Icon Class',
        hint: 'Enter the full FontAwesome class string (e.g., "fa-solid fa-dragon").',
        scope: 'client',
        config: true,
        type: String,
        default: 'fa-solid fa-dragon',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'customSvgPath', {
        name: 'Custom SVG File',
        hint: 'Select a custom SVG file for the fear icon.',
        scope: 'client',
        config: true,
        type: String,
        default: '',
        filePicker: 'image',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'colorTheme', {
        name: 'Color Theme',
        hint: 'Choose a color preset or Custom to set your own colors below.',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'foundryborne': 'Foundryborne (Default)',
            'hope-fear': 'Hope & Fear (Orange to Purple)',
            'blood-moon': 'Blood Moon (Red Gradient)',
            'ethereal': 'Ethereal (Cyan to Blue)',
            'toxic': 'Toxic (Green to Yellow)',
            'custom': 'Custom'
        },
        default: 'foundryborne',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'fullColor', {
        name: 'Full Icon Color',
        hint: 'CSS color string or gradient (e.g., "linear-gradient(90deg, red, blue)"). Used if Theme is Custom.',
        scope: 'client',
        config: true,
        type: String,
        default: '#ff0000',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'iconShape', {
        name: 'Icon Shape',
        hint: 'Select the background shape for the icons.',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'circle': 'Circle',
            'rounded': 'Rounded Square',
            'square': 'Square'
        },
        default: 'circle',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'iconColor', {
        name: 'Icon Color',
        hint: 'Custom color for the icon glyphs (Hex or Gradient). Default is white.',
        scope: 'client',
        config: true,
        type: String,
        default: '#ffffff',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'iconSize', {
        name: 'Icon Size (px)',
        hint: 'Size of the fear tokens in pixels. (Default: 32)',
        scope: 'client',
        config: true,
        type: Number,
        range: { min: 20, max: 64, step: 2 },
        default: 32,
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'viewMode', {
        name: 'View Mode',
        hint: 'Choose between Icon view or Progress Bar view.',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'icons': 'Icons',
            'bar': 'Progress Bar'
        },
        default: 'icons',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'showFearNumber', {
        name: 'Show Fear Number',
        hint: 'Display the numerical value (e.g., 3 / 6) at the bottom.',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'showControlButtons', {
        name: 'Show Control Buttons',
        hint: 'Display the +/- buttons for manually adjusting fear.',
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'progressBarColor', {
        name: 'Progress Bar Color',
        hint: 'CSS color or gradient for the progress bar (if View Mode is Bar). Overrides themes if set.',
        scope: 'client',
        config: true,
        type: String,
        default: '#cf0000',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'maxFearAnimation', {
        name: 'Max Fear Animation',
        hint: 'Animate the fear tracker when it reaches maximum value.',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: refreshFearTracker
    });

    // --- Window State Settings (Hidden) ---
    game.settings.register(MODULE_ID, 'position', {
        scope: 'client',
        config: false,
        type: Object,
        default: { top: 100, left: 100 }
    });

    game.settings.register(MODULE_ID, 'width', {
        scope: 'client',
        config: false,
        type: Number,
        default: 300
    });

    game.settings.register(MODULE_ID, 'minimized', {
        scope: 'client',
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, 'locked', {
        scope: 'client',
        config: false,
        type: Boolean,
        default: false
    });
});

Hooks.once('ready', () => {
    FearTrackerApp.initialize();
});

// Watch for Fear changes (Settings update)
Hooks.on('updateSetting', (setting, updates, options, userId) => {
    if (setting.key === 'daggerheart.Fear' || setting.key === 'daggerheart.Homebrew') {
        FearTrackerApp.instance?.render();
    }
});

Hooks.on('renderFearTracker', (app, html, data) => {
    // Capture fear data from the system's render hook
    if (FearTrackerApp.instance) {
        // Data likely contains the fear values. 
        // check if Dice So Nice is rolling
        if (game.dice3d?.isRolling?.()) {
            Hooks.once('diceSoNiceRollComplete', () => {
                FearTrackerApp.instance.updateFearData(data);
            });
        } else {
            FearTrackerApp.instance.updateFearData(data);
        }

        // Store reference to system app to potentially call methods directly
        FearTrackerApp.systemApp = app;
    }

    // Legacy injection disabled details
    // injectFearCustomization(html);
});

/**
 * Handle Settings UI Visibility
 */
Hooks.on('renderSettingsConfig', (app, html, data) => {
    const $html = $(html);
    const iconTypeSelect = $html.find(`select[name="${MODULE_ID}.iconType"]`);
    const themeSelect = $html.find(`select[name="${MODULE_ID}.colorTheme"]`);

    if (!iconTypeSelect.length || !themeSelect.length) return;

    // Helper to find setting group
    const findGroup = (key) => {
        let group = $html.find(`.form-group[data-setting-id="${MODULE_ID}.${key}"]`);
        if (group.length) return group;
        const input = $html.find(`[name="${MODULE_ID}.${key}"]`);
        if (input.length) return input.closest('.form-group');
        return null;
    };

    const updateVisibility = () => {
        // Safe check for elements, they might not exist if settings window structure changes
        if (!iconTypeSelect.length) return;

        // Get Values
        const iconType = iconTypeSelect.val();
        const theme = themeSelect.val();
        const viewMode = game.settings.get(MODULE_ID, 'viewMode'); // We might need to look up the input if it's not saved yet, but settings config usually reads saved. 
        // Actually, for live toggle in settings config, we need to find the viewMode select input.
        const viewModeSelect = $html.find(`select[name="${MODULE_ID}.viewMode"]`);
        const currentViewMode = viewModeSelect.length ? viewModeSelect.val() : 'icons';

        // Groups
        const iconTypeGroup = findGroup('iconType');
        const presetGroup = findGroup('presetIcon');
        const customIconGroup = findGroup('customIcon');
        const customSvgGroup = findGroup('customSvgPath');
        const iconShapeGroup = findGroup('iconShape');
        const iconColorGroup = findGroup('iconColor');
        const fullColorGroup = findGroup('fullColor');
        const progressBarColorGroup = findGroup('progressBarColor');

        // Logic
        if (currentViewMode === 'bar') {
            // Hide Icon Settings
            if (iconTypeGroup) iconTypeGroup.hide();
            if (presetGroup) presetGroup.hide();
            if (customIconGroup) customIconGroup.hide();
            if (customSvgGroup) customSvgGroup.hide();
            if (iconShapeGroup) iconShapeGroup.hide();
            if (iconColorGroup) iconColorGroup.hide();
            if (fullColorGroup) fullColorGroup.hide();

            // Show Bar Settings
            if (progressBarColorGroup) progressBarColorGroup.show();

        } else {
            // ICONS MODE
            if (iconTypeGroup) iconTypeGroup.show();
            if (iconShapeGroup) iconShapeGroup.show();
            if (iconColorGroup) iconColorGroup.show();
            if (progressBarColorGroup) progressBarColorGroup.hide();

            // Icon Type Sub-settings
            if (presetGroup) presetGroup.hide();
            if (customIconGroup) customIconGroup.hide();
            if (customSvgGroup) customSvgGroup.hide();

            if (iconType === 'preset' && presetGroup) presetGroup.show();
            else if (iconType === 'custom' && customIconGroup) customIconGroup.show();
            else if (iconType === 'custom-svg' && customSvgGroup) customSvgGroup.show();

            // Full Color (Custom Theme)
            if (fullColorGroup) {
                if (theme === 'custom') fullColorGroup.show();
                else fullColorGroup.hide();
            }
        }
    };

    iconTypeSelect.on('change', updateVisibility);
    themeSelect.on('change', updateVisibility);

    // Listen to View Mode change
    const viewModeSelect = $html.find(`select[name="${MODULE_ID}.viewMode"]`);
    if (viewModeSelect.length) {
        viewModeSelect.on('change', updateVisibility);
    }

    updateVisibility();

    // Icon Preview Logic
    const customIconGroup = findGroup('customIcon');
    if (customIconGroup) {
        const input = customIconGroup.find(`input[name="${MODULE_ID}.customIcon"]`);
        if (input.length) {
            const previewSpan = $(`<span class="icon-preview" style="margin-left: 10px; font-size: 1.5em; width: 30px; text-align: center; display: inline-block;"></span>`);
            const icon = $(`<i></i>`);
            previewSpan.append(icon);
            input.after(previewSpan);
            const updatePreview = () => {
                const val = input.val();
                icon.attr('class', '');
                if (val) {
                    icon.addClass(val);
                }
            };
            input.on('input', updatePreview);
            updatePreview();
        }
    }
});

