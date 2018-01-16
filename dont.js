const defaultConfig = {
	customize: button => {
		// Style our button a bit differently.
		button.style.marginRight = '5px';
		button.value = `Don’t ${button.value}`;
	},
	hostnames: [],
	selectors: [
		'input[value^=post]',
		'input[value^=comment]',
	],
};

const config = {
	facebook: {
		customize: button => {
			// Style our button a bit differently.
			button.style.backgroundColor = '#396';
			button.style.marginRight = '5px';
			button.textContent = `Don’t ${button.textContent}`;
		},
		hostnames: [
			'facebook.com',
		],
		selectors: [
			'button[data-testid=react-composer-post-button]',
		],
	},
	twitter: {
		customize: button => {
			// Twitter seems to overwrite our "don't" button text if we just set it
			// once. So we'll listen for changes to the "disabled" attribute on the
			// button (see mutation observer below) and update it on-the-fly using
			// a saved reference to the original button text.
			const saveButtonTextReference = span => span.dataset.text = span.textContent;
			button.querySelectorAll('.button-text').forEach(saveButtonTextReference);

			// Style our button a bit differently.
			button.style.backgroundColor = '#396';
			button.style.marginRight = '7px';

			const updateButtonText = span => span.textContent = `Don’t ${span.dataset.text}`;
			const updateButtons = mutation => mutation.target.querySelectorAll('.button-text').forEach(updateButtonText);
			const observer = new MutationObserver(mutations => mutations.forEach(updateButtons));
			observer.observe(button, { attributes: true, attributeFilter: ['disabled', 'aria-disabled'] });
		},
		hostnames: [
			'twitter.com',
		],
		selectors: [
			'button.SendTweetsButton',
			'button.tweet-action',
		],
	},
};

// Don't post something
function dontPost(evt) {
	evt.preventDefault();
	evt.stopImmediatePropagation(); // I *strenuously* object!

	// Remove "Are you sure?" silliness.
	window.onunload = window.onbeforeunload = null;

	// Bug out.
	window.location = 'https://dontpost.org/🙊.html';
}

function cloneButton(button) {
	// Clone the button. We're purposefully not using cloneNode since we want
	// to use a different tag name without all the attributes / classnames of
	// this original button. 
	const newButton = button.cloneNode(true);

	// Add our click handler.
	newButton.onclick = dontPost;

	// Insert it right before the original button.
	button.parentNode.insertBefore(newButton, button);

	return newButton;
}

// Find current and future action buttons and add a "don't" version.
function setup(siteConfig) {
	const { customize, selectors } = siteConfig;
	const addButtons = node => node.querySelectorAll(selectors.join(',')).forEach(button => customize(cloneButton(button)));

	// Add buttons for actions already visible on the page.
	addButtons(document);

	// Watch for buttons that are added to the page after initial load AND for
	// changes to buttons we've created (it happens).
	const findButtons = mutations => {
		mutations
			.filter(mutation => mutation.addedNodes)
			.map(mutation => [...mutation.addedNodes])
			.forEach(nodes => nodes.filter(node => node.querySelector).forEach(addButtons));
	};

	const observer = new MutationObserver(findButtons);
	observer.observe(document, { childList: true, subtree: true });
}

// Determine if this site is one we know about and, if so, start our work.
function init(hostname) {
	const found = Object.keys(config).some(site => {
		const siteConfig = config[site];
		const hostRegex = new RegExp(`\.\(${siteConfig.hostnames.join('|')}\)$`);

		if (hostRegex.test(`.${hostname}`)) {
			setup(siteConfig);
			return true;
		}

		return false;
	});

	if (!found) {
		setup(defaultConfig);
	}
}

// Init.
init(window.location.hostname);
