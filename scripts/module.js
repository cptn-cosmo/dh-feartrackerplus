const MODULE_ID = 'dh-feartrackerplus';

Hooks.once('init', () => {
    console.log(`${MODULE_ID} | Initializing Daggerheart Fear Tracker Plus`);

    const refreshFearTracker = () => {
        if (ui.resources?.render) ui.resources.render();
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

    game.settings.register(MODULE_ID, 'fullColor', {
        name: 'Full Icon Color',
        hint: 'CSS color string or gradient (e.g., "#ff0000" or "linear-gradient(to top, red, yellow)").',
        scope: 'client',
        config: true,
        type: String,
        default: '#ff0000',
        onChange: refreshFearTracker
    });

    game.settings.register(MODULE_ID, 'emptyColor', {
        name: 'Empty Icon Color',
        hint: 'CSS color string for inactive icons.',
        scope: 'client',
        config: true,
        type: String,
        default: '#444444',
        onChange: refreshFearTracker
    });
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
    const fullColor = game.settings.get(MODULE_ID, 'fullColor');
    const emptyColor = game.settings.get(MODULE_ID, 'emptyColor');

    // Determine Icon Class
    let iconClass = 'fa-skull'; // fallback
    if (iconType === 'preset') {
        iconClass = presetIcon;
    } else {
        iconClass = customIcon;
    }

    // Find all icons
    // The system uses: <i class="fas fa-skull ...">
    // We target them. Note: the system might have added 'inactive' class.
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
        const targetColor = isInactive ? emptyColor : fullColor;

        // Apply Color
        const isGradient = targetColor.toLowerCase().includes('gradient');

        if (isGradient) {
            icon.classList.add('fear-tracker-plus-gradient');
            icon.style.background = targetColor;
            icon.style.color = 'transparent'; // Needed for background-clip: text
        } else {
            icon.classList.remove('fear-tracker-plus-gradient');
            icon.style.background = 'none';
            icon.style.color = targetColor;
        }
    });
}
