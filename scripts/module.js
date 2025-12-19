const MODULE_ID = 'dh-feartrackerplus';

Hooks.once('init', () => {
    console.log(`${MODULE_ID} | Initializing Daggerheart Fear Tracker Plus`);

    const refreshFearTracker = () => {
        if (ui.resources?.render) ui.resources.render({ force: true });
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

    game.settings.register(MODULE_ID, 'trackerScale', {
        name: 'Tracker Scale',
        hint: 'Resize the fear tracker (0.25x to 2.0x).',
        scope: 'client',
        config: true,
        type: Number,
        range: {
            min: 0.25,
            max: 2.0,
            step: 0.05
        },
        default: 1.0,
        onChange: refreshFearTracker
    });

    // Removed trackerLocked setting as requested

    game.settings.register(MODULE_ID, 'colorTheme', {
        name: 'Color Theme',
        hint: 'Choose a color preset or Custom to set your own colors below.',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'foundryborne': 'Foundryborne (Default)',
            'custom': 'Custom',
            'hope-fear': 'Hope & Fear (Orange to Purple)',
            'blood-moon': 'Blood Moon (Red Gradient)',
            'ethereal': 'Ethereal (Cyan to Blue)',
            'toxic': 'Toxic (Green to Yellow)'
        },
        default: 'foundryborne',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'fullColor', {
        name: 'Full Icon Color',
        hint: 'CSS color string or gradient (Used if Theme is Custom).',
        scope: 'client',
        config: true,
        type: String,
        default: '#ff0000',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'emptyColor', {
        name: 'Empty Icon Color',
        hint: 'CSS color string for inactive icons (Used if Theme is Custom).',
        scope: 'client',
        config: true,
        type: String,
        default: '#444444',
        onChange: refreshFearTracker
    });
});

/**
 * Handle Settings UI Visibility
 */
Hooks.on('renderSettingsConfig', (app, html, data) => {
    const $html = $(html);
    const iconTypeSelect = $html.find(`select[name="${MODULE_ID}.iconType"]`);
    const themeSelect = $html.find(`select[name="${MODULE_ID}.colorTheme"]`);

    const updateVisibility = () => {
        const iconType = iconTypeSelect.val();
        const theme = themeSelect.val();

        // Icon Inputs
        // Standard data-setting-id
        let presetGroup = $html.find(`.form-group[data-setting-id="${MODULE_ID}.presetIcon"]`);
        let customIconGroup = $html.find(`.form-group[data-setting-id="${MODULE_ID}.customIcon"]`);
        let customSvgGroup = $html.find(`.form-group[data-setting-id="${MODULE_ID}.customSvgPath"]`);

        // Fallback: Find input by name and traverse to form-group
        if (!presetGroup.length) presetGroup = $html.find(`select[name="${MODULE_ID}.presetIcon"]`).closest('.form-group');
        if (!customIconGroup.length) customIconGroup = $html.find(`input[name="${MODULE_ID}.customIcon"]`).closest('.form-group');

        // SVG Fallback: Ensure we find it separately because it might be wrapped differently
        if (!customSvgGroup.length) {
            const svgInput = $html.find(`input[name="${MODULE_ID}.customSvgPath"]`);
            // Traverse up to find the closest form-group
            customSvgGroup = svgInput.closest('.form-group');
        }

        // Reset
        presetGroup.hide();
        customIconGroup.hide();
        customSvgGroup.hide();

        if (iconType === 'preset') {
            presetGroup.show();
        } else if (iconType === 'custom') {
            customIconGroup.show();
        } else if (iconType === 'custom-svg') {
            customSvgGroup.show();
        }

        // Color Inputs
        let fullColorGroup = $html.find(`.form-group[data-setting-id="${MODULE_ID}.fullColor"]`);
        let emptyColorGroup = $html.find(`.form-group[data-setting-id="${MODULE_ID}.emptyColor"]`);
        let scaleGroup = $html.find(`.form-group[data-setting-id="${MODULE_ID}.trackerScale"]`);

        if (!fullColorGroup.length) fullColorGroup = $html.find(`input[name="${MODULE_ID}.fullColor"]`).closest('.form-group');
        if (!emptyColorGroup.length) emptyColorGroup = $html.find(`input[name="${MODULE_ID}.emptyColor"]`).closest('.form-group');
        if (!scaleGroup.length) scaleGroup = $html.find(`input[name="${MODULE_ID}.trackerScale"]`).closest('.form-group');

        if (theme === 'custom') {
            fullColorGroup.show();
            emptyColorGroup.show();
        } else {
            fullColorGroup.hide();
            emptyColorGroup.hide();
        }

        // Inject Scale Reset Button if not present
        if (scaleGroup.length && !scaleGroup.find('.scale-reset-btn').length) {
            const input = scaleGroup.find('input[type="range"]');
            const rangeValue = scaleGroup.find('.range-value');

            if (input.length) {
                const resetBtn = $(`<button type="button" class="scale-reset-btn" title="Reset to 1.0x" style="flex: 0 0 30px; margin-left: 5px;"><i class="fas fa-undo"></i></button>`);
                resetBtn.on('click', () => {
                    input.val(1.0).trigger('change');
                    if (rangeValue.length) rangeValue.text("1.0");
                });

                // Append after the range value display usually found in Foundry sliders
                if (rangeValue.length) {
                    rangeValue.after(resetBtn);
                } else {
                    input.after(resetBtn);
                }
            }
        }
    };

    iconTypeSelect.on('change', updateVisibility);
    themeSelect.on('change', updateVisibility);
    updateVisibility();
});

/**
 * Handle Fear Tracker Rendering
 */
Hooks.on('renderFearTracker', (app, html, data) => {
    injectFearCustomization(html);
});

// Helper to interpolate colors
function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) return color1;

    let result = "#";
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    for (let i = 0; i < 3; i++) {
        const val = Math.round(c1[i] + factor * (c2[i] - c1[i]));
        let hex = val.toString(16);
        if (hex.length < 2) hex = "0" + hex;
        result += hex;
    }
    return result;
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function injectFearCustomization(html) {
    const container = html instanceof HTMLElement ? html : html[0];
    const fearContainer = container.querySelector('#resource-fear');

    // Removed Window Lock Injection logic

    if (!fearContainer) return;

    // Get Settings
    const iconType = game.settings.get(MODULE_ID, 'iconType');
    const presetIcon = game.settings.get(MODULE_ID, 'presetIcon');
    const customIcon = game.settings.get(MODULE_ID, 'customIcon');
    const colorTheme = game.settings.get(MODULE_ID, 'colorTheme');
    let fullColor = game.settings.get(MODULE_ID, 'fullColor');
    let emptyColor = game.settings.get(MODULE_ID, 'emptyColor');

    // Theme Data for Interpolation
    let themeStart = null;
    let themeEnd = null;

    // New Foundryborne Gradient: #020026 -> #C701FC
    if (colorTheme !== 'custom') {
        const themes = {
            'foundryborne': { start: '#020026', end: '#C701FC', empty: '#1a002b' }, // Custom requested gradient
            'hope-fear': { start: '#FFC107', end: '#512DA8', empty: '#2e1c4a' },
            'blood-moon': { start: '#5c0000', end: '#ff0000', empty: '#2a0000' },
            'ethereal': { start: '#00FFFF', end: '#0000FF', empty: '#002a33' },
            'toxic': { start: '#00FF00', end: '#FFFF00', empty: '#003300' }
        };
        const theme = themes[colorTheme];
        if (theme) {
            themeStart = theme.start;
            themeEnd = theme.end;
            emptyColor = theme.empty;
            // Fallback fullColor for non-interpolation uses if any
            fullColor = theme.start;
        }
    }

    // Apply Scaling
    const scale = game.settings.get(MODULE_ID, 'trackerScale');
    if (scale !== 1.0) {
        fearContainer.style.zoom = scale;
    } else {
        fearContainer.style.zoom = 'normal';
    }

    // Determine Icon Class
    let iconClass = 'fas fa-skull';
    if (iconType === 'preset') {
        iconClass = presetIcon;
    } else if (iconType === 'custom') {
        iconClass = customIcon;
    } else if (iconType === 'custom-svg') {
        const svgPath = game.settings.get(MODULE_ID, 'customSvgPath');
        iconClass = svgPath || 'icons/svg/mystery-man.svg'; // Fallback
    }

    const isSVG = iconClass.includes('.svg') || iconType === 'custom-svg';
    const icons = fearContainer.querySelectorAll('i');
    const totalIcons = icons.length;

    icons.forEach((icon, index) => {
        // 1. Reset Icon State
        // Remove common FA prefixes just in case
        icon.classList.remove('fa-skull', 'fas', 'far', 'fal', 'fad', 'fab');

        // Remove old SVG img if present from previous renders
        const oldImg = icon.querySelector('img.fear-tracker-icon');
        if (oldImg) oldImg.remove();

        // 2. Handle Icon Content
        if (isSVG) {
            // It's an SVG (Capybara or other)
            // Create IMG element
            const img = document.createElement('img');
            img.src = iconClass;
            img.classList.add('fear-tracker-icon');
            img.style.width = '60%';
            img.style.height = '60%';

            // White for visibility on dark backgrounds
            img.style.filter = 'brightness(0) invert(1)';
            img.style.border = 'none';
            img.style.pointerEvents = 'none';

            icon.appendChild(img);
        } else {
            // It's a FontAwesome Class
            const newClasses = iconClass.split(' ').filter(c => c.trim() !== '');
            icon.classList.add(...newClasses, 'fear-tracker-plus-custom');
            icon.style.color = '#ffffff'; // Force white icons for all themes
        }

        // 3. Remove System Styling (Module Overrides)
        // We always override now, even for Foundryborne, to apply the custom gradient
        icon.style.filter = 'none';
        icon.style.opacity = '1';

        icon.style.webkitTextFillColor = 'initial';
        icon.style.backgroundClip = 'border-box';
        icon.style.webkitBackgroundClip = 'border-box';

        // 4. Handle Background Color
        const isInactive = icon.classList.contains('inactive');

        if (isInactive) {
            icon.style.background = emptyColor;
        } else {
            // Active
            if (themeStart && themeEnd && totalIcons > 1) {
                // Interpolate
                const factor = index / (totalIcons - 1);
                const color = interpolateColor(themeStart, themeEnd, factor);
                icon.style.background = color;
            } else {
                // Custom or Single Color
                icon.style.background = fullColor;
            }
        }
    });

    // Remove legacy container class if present
    fearContainer.classList.remove('fear-tracker-plus-container-gradient');
    fearContainer.style.background = 'none';
}
