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



    // Removed trackerLocked setting as requested

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
        default: '#000000',
        onChange: refreshFearTracker
    });

    // --- New Settings for Icon Color/Shape ---
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

    game.settings.register(MODULE_ID, 'maxFearAnimation', {
        name: 'Max Fear Animation',
        hint: 'animate the fear tracker when it reaches maximum value.',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: refreshFearTracker
    });
});

/**
 * Handle Settings UI Visibility
 */
Hooks.on('renderSettingsConfig', (app, html, data) => {
    const $html = $(html);
    // Use a more robust selector for the select elements, in case implicit binding changes
    const iconTypeSelect = $html.find(`select[name="${MODULE_ID}.iconType"]`);
    const themeSelect = $html.find(`select[name="${MODULE_ID}.colorTheme"]`);

    // If we can't find the main selects, we can't do anything (likely custom settings window or other issue)
    if (!iconTypeSelect.length || !themeSelect.length) return;

    {
        // Helper to find setting group
        const findGroup = (key) => {
            // Try data-setting-id first (standard in V10/V11+)
            let group = $html.find(`.form-group[data-setting-id="${MODULE_ID}.${key}"]`);
            if (group.length) return group;

            // Fallback: Find input/select by name and go up to form-group
            const input = $html.find(`[name="${MODULE_ID}.${key}"]`);
            if (input.length) return input.closest('.form-group');

            return null;
        };

        const updateVisibility = () => {
            const iconType = iconTypeSelect.val();
            const theme = themeSelect.val();

            // Locate Groups
            const presetGroup = findGroup('presetIcon');
            const customIconGroup = findGroup('customIcon');
            const customSvgGroup = findGroup('customSvgPath');

            // Reset Visibility
            if (presetGroup) presetGroup.hide();
            if (customIconGroup) customIconGroup.hide();
            if (customSvgGroup) customSvgGroup.hide();

            // Apply Logic
            if (iconType === 'preset' && presetGroup) {
                presetGroup.show();
            } else if (iconType === 'custom' && customIconGroup) {
                customIconGroup.show();
            } else if (iconType === 'custom-svg' && customSvgGroup) {
                customSvgGroup.show();
            }

            // Color Inputs
            const fullColorGroup = findGroup('fullColor');

            if (fullColorGroup) {
                if (theme === 'custom') {
                    fullColorGroup.show();
                } else {
                    fullColorGroup.hide();
                }
            }

            // Tracker Scale Reset Button
            const scaleGroup = findGroup('trackerScale');
            if (scaleGroup && !scaleGroup.find('.scale-reset-btn').length) {
                const input = scaleGroup.find('input[type="range"]'); // Try range first
                const numberInput = scaleGroup.find(`input[name="${MODULE_ID}.trackerScale"]`); // Fallback/Number input
                const rangeValue = scaleGroup.find('.range-value');

                // We want to control the input that actually stores the value
                const targetInput = numberInput.length ? numberInput : input;

                if (targetInput.length) {
                    const resetBtn = $(`<button type="button" class="scale-reset-btn" title="Reset to 1.0x" style="flex: 0 0 30px; margin-left: 5px;"><i class="fas fa-undo"></i></button>`);

                    resetBtn.on('click', () => {
                        // Use Native DOM events for maximum compatibility with Foundry
                        // 1. Update Number Input (if exists)
                        if (numberInput.length) {
                            const nativeNum = numberInput[0];
                            nativeNum.value = 1.0;
                            nativeNum.dispatchEvent(new Event('change', { bubbles: true }));
                        }

                        // 2. Update Range Input
                        if (input.length) {
                            const nativeRange = input[0];
                            nativeRange.value = 1.0;
                            nativeRange.dispatchEvent(new Event('input', { bubbles: true }));
                            nativeRange.dispatchEvent(new Event('change', { bubbles: true }));
                        }

                        // 3. Fallback visual update
                        if (rangeValue.length) rangeValue.text("1.0");
                    });

                    // Append logic
                    const container = scaleGroup.find('.form-fields');
                    if (container.length) {
                        container.append(resetBtn);
                    } else if (rangeValue.length) {
                        rangeValue.after(resetBtn);
                    } else {
                        targetInput.after(resetBtn);
                    }
                }
            }


            // Icon Color Reset Button
            const iconColorGroup = findGroup('iconColor');
            if (iconColorGroup && !iconColorGroup.find('.icon-color-reset-btn').length) {
                const input = iconColorGroup.find(`input[name="${MODULE_ID}.iconColor"]`);

                if (input.length) {
                    const resetBtn = $(`<button type="button" class="icon-color-reset-btn" title="Reset to White" style="flex: 0 0 30px; margin-left: 5px;"><i class="fas fa-undo"></i></button>`);

                    resetBtn.on('click', () => {
                        input.val('#ffffff');
                        input.trigger('change');
                    });

                    input.after(resetBtn);
                }
            }
        };

        iconTypeSelect.on('change', updateVisibility);
        themeSelect.on('change', updateVisibility);
        updateVisibility();

        // Icon Preview Logic
        const customIconGroup = findGroup('customIcon');
        if (customIconGroup) {
            const input = customIconGroup.find(`input[name="${MODULE_ID}.customIcon"]`);
            if (input.length) {
                // Create Preview Element
                const previewSpan = $(`<span class="icon-preview" style="margin-left: 10px; font-size: 1.5em; width: 30px; text-align: center; display: inline-block;"></span>`);
                const icon = $(`<i></i>`);
                previewSpan.append(icon);

                // Append to container
                input.after(previewSpan);

                // Update Function
                const updatePreview = () => {
                    const val = input.val();
                    // Reset classes
                    icon.attr('class', '');
                    if (val) {
                        icon.addClass(val);
                    }
                };

                // Listeners
                input.on('input', updatePreview);

                // Initial update
                updatePreview();
            }
        }
    }
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
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);

    for (let i = 0; i < 3; i++) {
        const val = Math.round(c1[i] + factor * (c2[i] - c1[i]));
        let hex = val.toString(16);
        if (hex.length < 2) hex = "0" + hex;
        result += hex;
    }
    return result;
}


function parseColor(color) {
    if (!color) return [0, 0, 0];

    // Handle RGB/RGBA
    if (color.startsWith('rgb')) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
    }

    // Handle Hex
    if (color.startsWith('#')) {
        let hex = color.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    return [0, 0, 0];
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
    const iconShape = game.settings.get(MODULE_ID, 'iconShape');
    const iconColor = game.settings.get(MODULE_ID, 'iconColor');

    let fullColor = game.settings.get(MODULE_ID, 'fullColor');
    let emptyColor = '#444444'; // Default for custom

    // Theme Data for Interpolation
    let themeStart = null;
    let themeEnd = null;

    // Handle Themes
    if (colorTheme !== 'custom') { // Removed check for 'foundryborne' to treat it as a preset
        const themes = {
            'foundryborne': { start: null, end: null, empty: 'transparent' },
            'hope-fear': { start: '#FFC107', end: '#512DA8', empty: '#2e1c4a' },
            'blood-moon': { start: '#5c0000', end: '#ff0000', empty: '#2a0000' },
            'ethereal': { start: '#00FFFF', end: '#0000FF', empty: '#002a33' },
            'toxic': { start: '#00FF00', end: '#FFFF00', empty: '#003300' }
        };

        const theme = themes[colorTheme];
        if (theme) {
            // Standard Interpolated Preset
            themeStart = theme.start;
            themeEnd = theme.end;
            fullColor = theme.start;

            emptyColor = theme.empty;
        }



        emptyColor = theme.empty;
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
        icon.classList.remove('fa-skull', 'fas', 'far', 'fal', 'fad', 'fab', 'dh-fear-plus-bg-override', 'dh-fear-plus-icon-override');

        const isInactive = icon.classList.contains('inactive');

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

        }

        // 3. Remove System Styling (Module Overrides)
        // Skip this for Foundryborne to keep default system look (filters/brightness)
        // UPDATE: We now WANT to override Foundryborne to apply our custom gradient, BUT we want to keep its filters!
        if (colorTheme !== 'foundryborne') {
            icon.style.filter = 'none';
            icon.style.opacity = '1';
        }



        // CSS Variables to be applied
        let cssBg = 'transparent';
        let cssBgSize = 'cover';
        let cssBgPos = 'center';
        let cssIconColor = '#ffffff';
        let cssIconBgSize = 'cover';
        let cssIconBgPos = 'center';

        // 4. Handle Icon Color (Glyph)
        if (!isSVG) {
            if (iconColor && iconColor !== '#ffffff') {
                cssIconColor = iconColor;

                // Spanning Logic for Icon Gradient
                if (iconColor.includes('gradient') && totalIcons > 0) {
                    cssIconBgSize = `${totalIcons * 100}% 100%`;
                    let pos = 0;
                    if (totalIcons > 1) {
                        pos = (index / (totalIcons - 1)) * 100;
                    }
                    cssIconBgPos = `${pos}% 0%`;
                }
            } else {
                cssIconColor = '#ffffff';
            }
        }

        // 5. Handle Background Color (Shape)
        // Enable custom coloring for ALL themes now, but toggle classes selectively for Hybrid "Foundryborne"

        // Always apply icon override for gradients
        icon.classList.add('dh-fear-plus-icon-override');

        if (colorTheme !== 'foundryborne') {
            // Apply background override for all OTHER themes
            icon.classList.add('dh-fear-plus-bg-override');
        }
        if (isInactive) {
            cssBg = emptyColor;
            cssBgSize = 'cover';
            cssBgPos = 'center';
        } else {
            // Active
            if (themeStart && themeEnd && totalIcons > 1) {
                // Interpolate (Preset Themes)
                const factor = index / (totalIcons - 1);
                const color = interpolateColor(themeStart, themeEnd, factor);

                // Apply Theme Color to BACKGROUND only
                cssBg = color;
                cssBgSize = 'cover';
                cssBgPos = 'center';
            } else {
                // Custom Theme
                // Check if fullColor appears to be a gradient
                const isGradient = fullColor.includes('gradient');

                if (isGradient && totalIcons > 0) {
                    cssBg = fullColor;
                    cssBgSize = `${totalIcons * 100}% 100%`;

                    // Calculate position
                    let pos = 0;
                    if (totalIcons > 1) {
                        pos = (index / (totalIcons - 1)) * 100;
                    }
                    cssBgPos = `${pos}% 0%`;
                } else {
                    // Solid Color
                    cssBg = fullColor;
                    cssBgSize = 'cover';
                    cssBgPos = 'center';
                }
            }
        }
        // }

        // 6. Handle Shape
        let borderRadius = '50%';
        if (iconShape === 'rounded') borderRadius = '20%';
        else if (iconShape === 'square') borderRadius = '0%';

        // 7. Apply CSS Variables
        icon.style.setProperty('--dh-fear-bg', cssBg);
        icon.style.setProperty('--dh-fear-bg-size', cssBgSize);
        icon.style.setProperty('--dh-fear-bg-pos', cssBgPos);
        icon.style.setProperty('--dh-fear-icon-color', cssIconColor);
        icon.style.setProperty('--dh-fear-icon-bg-size', cssIconBgSize);
        icon.style.setProperty('--dh-fear-icon-bg-pos', cssIconBgPos);
        icon.style.setProperty('--dh-fear-border-radius', borderRadius);

        // Clean up direct styles that might interfere/confuse
        icon.style.background = '';
        icon.style.color = '';
        icon.style.webkitBackgroundClip = '';
        icon.style.backgroundClip = '';
        icon.style.webkitTextFillColor = '';
        icon.style.borderRadius = '';
    });

    // Remove legacy container class if present
    fearContainer.classList.remove('fear-tracker-plus-container-gradient');

    // Always clear container background to ensure our icon colors are visible and not obscured by system or previous styles
    fearContainer.style.background = 'none';

    // Max Fear Animation
    const animateMax = game.settings.get(MODULE_ID, 'maxFearAnimation');
    if (animateMax) {
        // Check if all available icons are active
        const activeIcons = Array.from(icons).filter(icon => !icon.classList.contains('inactive')).length;

        // If totalIcons > 0 and activeIcons === totalIcons, apply animation
        if (totalIcons > 0 && activeIcons === totalIcons) {
            // Prevent system "Blue" overrides
            fearContainer.classList.remove('complete', 'max', 'full');

            icons.forEach(icon => {
                icon.classList.add('fear-tracker-plus-animate');
                // Force filter reset to ensure our animation works and system color doesn't override
                icon.style.filter = 'none';
            });
        } else {
            icons.forEach(icon => {
                icon.classList.remove('fear-tracker-plus-animate');
                // Restore filter if we touched it (only relevant if not custom theme)
                if (colorTheme === 'foundryborne') {
                    icon.style.filter = '';
                }
            });
        }
    } else {
        icons.forEach(icon => icon.classList.remove('fear-tracker-plus-animate'));
    }
}

