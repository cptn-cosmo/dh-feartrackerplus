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
            'custom': 'Custom FontAwesome Class'
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
            'fa-skull': 'Skull (Default)',
            'fa-ghost': 'Ghost',
            'fa-fire': 'Fire',
            'fa-heart-broken': 'Broken Heart',
            'fa-dizzy': 'Dizzy Face',
            'fa-book-dead': 'Book of Dead',
            'fa-spider': 'Spider',
            'fa-cloud-meatball': 'Cloud Meatball',
            'fa-biohazard': 'Biohazard',
            'fa-radiation': 'Radiation'
        },
        default: 'fa-skull',
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

    game.settings.register(MODULE_ID, 'colorTheme', {
        name: 'Color Theme',
        hint: 'Choose a color preset or Custom to set your own colors below.',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'custom': 'Custom',
            'hope-fear': 'Hope & Fear (Orange to Purple)',
            'blood-moon': 'Blood Moon (Red Gradient)',
            'ethereal': 'Ethereal (Cyan to Blue)',
            'toxic': 'Toxic (Green to Yellow)'
        },
        default: 'custom',
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
    const iconTypeSelect = html.find(`select[name="${MODULE_ID}.iconType"]`);
    const themeSelect = html.find(`select[name="${MODULE_ID}.colorTheme"]`);

    const updateVisibility = () => {
        const iconType = iconTypeSelect.val();
        const theme = themeSelect.val();

        // Icon Inputs
        const presetGroup = html.find(`select[name="${MODULE_ID}.presetIcon"]`).closest('.form-group');
        const customIconGroup = html.find(`input[name="${MODULE_ID}.customIcon"]`).closest('.form-group');

        if (iconType === 'preset') {
            presetGroup.show();
            customIconGroup.hide();
        } else {
            presetGroup.hide();
            customIconGroup.show();
        }

        // Color Inputs
        const fullColorGroup = html.find(`input[name="${MODULE_ID}.fullColor"]`).closest('.form-group');
        const emptyColorGroup = html.find(`input[name="${MODULE_ID}.emptyColor"]`).closest('.form-group');

        if (theme === 'custom') {
            fullColorGroup.show();
            emptyColorGroup.show();
        } else {
            fullColorGroup.hide();
            emptyColorGroup.hide();
        }
    };

    iconTypeSelect.on('change', updateVisibility);
    themeSelect.on('change', updateVisibility);
    updateVisibility();
});

/**
 * Handle Fear Tracker Rendering
 * We hook into the renderFearTracker or whatever the ApplicationV2 is called ideally.
 * But looking at the system code, it uses `FearTracker` class.
 * Since it's an ApplicationV2, `renderApplication` hook might work, or `renderFearTracker` if the system supports it.
 * The system code shows: export default class FearTracker extends HandlebarsApplicationMixin(ApplicationV2)
 * The template ID is systems/daggerheart/templates/ui/fearTracker.hbs
 * We can hook 'renderFearTracker'.
 */
Hooks.on('renderFearTracker', (app, html, data) => {
    injectFearCustomization(html);
});

// Also try to catch it if it's strictly ApplicationV2 and name might differ slightly in some contexts, but 'renderFearTracker' should work given the class name.
// Just in case the class name in the system is minified or different at runtime, we can check the element.

function injectFearCustomization(html) {
    // The HTML passed might be the raw jQuery object or HTMLElement
    const container = html instanceof HTMLElement ? html : html[0];
    const fearContainer = container.querySelector('#resource-fear');

    if (!fearContainer) return;

    // Get Settings
    const iconType = game.settings.get(MODULE_ID, 'iconType');
    const presetIcon = game.settings.get(MODULE_ID, 'presetIcon');
    const customIcon = game.settings.get(MODULE_ID, 'customIcon');
    const colorTheme = game.settings.get(MODULE_ID, 'colorTheme');
    let fullColor = game.settings.get(MODULE_ID, 'fullColor');
    let emptyColor = game.settings.get(MODULE_ID, 'emptyColor');

    // Apply Theme Colors
    if (colorTheme !== 'custom') {
        const themes = {
            'hope-fear': { full: 'linear-gradient(to right, #FFC107, #512DA8)', empty: '#2e1c4a' },
            'blood-moon': { full: 'linear-gradient(to top, #5c0000, #ff0000)', empty: '#2a0000' },
            'ethereal': { full: 'linear-gradient(to right, #00FFFF, #0000FF)', empty: '#002a33' },
            'toxic': { full: 'linear-gradient(to bottom, #00FF00, #FFFF00)', empty: '#003300' }
        };
        const theme = themes[colorTheme];
        if (theme) {
            fullColor = theme.full;
            emptyColor = theme.empty;
        }
    }

    // Apply Container Gradient if needed (for continuous gradient)
    // If it's a gradient, we apply it to the container to span across.
    const isGradient = fullColor.toLowerCase().includes('gradient');

    if (isGradient) {
        fearContainer.style.background = fullColor;
        fearContainer.style.webkitBackgroundClip = 'text';
        fearContainer.style.backgroundClip = 'text';
        fearContainer.style.webkitTextFillColor = 'transparent';
        fearContainer.style.color = 'transparent';
        fearContainer.classList.add('fear-tracker-plus-container-gradient');
    } else {
        fearContainer.style.background = 'none';
        fearContainer.style.webkitBackgroundClip = 'initial';
        fearContainer.style.backgroundClip = 'initial';
        fearContainer.style.webkitTextFillColor = 'initial';
        fearContainer.style.color = 'initial';
        fearContainer.classList.remove('fear-tracker-plus-container-gradient');
    }

    // Determine Icon Class
    let iconClass = 'fa-skull'; // fallback
    if (iconType === 'preset') {
        iconClass = presetIcon;
    } else {
        iconClass = customIcon;
    }

    const icons = fearContainer.querySelectorAll('i');

    icons.forEach(icon => {
        // 1. Replace Icon
        // Remove existing FA classes that define the icon. 
        // We know 'fas' and 'fa-skull' are likely there.
        // Safest is to remove 'fa-skull' and add our own.
        // If the user provided a full string like "fa-solid fa-dragon", we should handle that.

        // Remove the default system icon class specific to fear logic if we can identify it, 
        // but 'fa-skull' is hardcoded in the generic template.
        icon.classList.remove('fa-skull');

        // Add new classes
        // split by space to handle multiple classes in custom string
        const newClasses = iconClass.split(' ').filter(c => c.trim() !== '');
        icon.classList.add(...newClasses, 'fear-tracker-plus-custom');


        // 2. Handle Colors (Override System Hue Rotate)
        // System style: style="filter: hue-rotate(calc(({{this}}/{{../max}})*75deg))"
        // We must override this. resetting filter is enough.
        icon.style.filter = 'none';

        // Check state
        const isInactive = icon.classList.contains('inactive');

        if (isGradient) {
            if (isInactive) {
                // Inactive icons should NOT show the gradient.
                // We force them to emptyColor by resetting clip behavior via webkitTextFillColor
                icon.style.webkitTextFillColor = emptyColor;
                icon.style.color = emptyColor;
                icon.style.background = 'none';
            } else {
                // Active icons: Transparent to show parent background.
                icon.style.webkitTextFillColor = 'transparent';
                icon.style.color = 'transparent';
                icon.style.background = 'none';
            }
        } else {
            // Solid Colors
            icon.style.webkitTextFillColor = 'initial';
            icon.style.background = 'none';
            icon.style.color = isInactive ? emptyColor : fullColor;
        }
    });
}
