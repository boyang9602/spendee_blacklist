// Function to get the username from the modal
function getUsernameFromModal(modal) {
    const header = modal.querySelector('.header div');
    return header ? header.innerText.trim() : '';
}

// Function to inject the blacklist button into the modal
function injectBlacklistButton(modal) {
    if (!modal.querySelector('#blacklistButton')) {
        const header = modal.querySelector('.header');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'ui button';
        buttonDiv.id = 'blacklistButton';
        buttonDiv.style.marginLeft = '10px'; // Space between username and button
        buttonDiv.style.backgroundColor = 'red';
        buttonDiv.style.color = 'white';

        // Add the button after the header content
        header.appendChild(buttonDiv);

        buttonDiv.addEventListener('click', () => {
            handleBlacklistButtonClick(buttonDiv);
        });
    }
}

// Function to handle button click
function handleBlacklistButtonClick(button) {
    const modal = button.closest('.user-modal');
    const username = getUsernameFromModal(modal);

    if (!username) return;

    // Retrieve the blacklist from chrome.storage
    chrome.storage.local.get({ blacklist: [] }, (result) => {
        let blacklist = result.blacklist;
        const isBlacklisted = blacklist.includes(username);

        if (isBlacklisted) {
            // Remove from blacklist
            blacklist = blacklist.filter(name => name !== username);
        } else {
            // Add to blacklist
            blacklist.push(username);
        }

        // Save the updated blacklist to chrome.storage
        chrome.storage.local.set({ blacklist: blacklist }, () => {
            updateButtonText(modal);
            const spots = document.querySelectorAll(".spot");
            labelUsers(spots);
        });
    });
}

// Function to update the button text based on the blacklist status
function updateButtonText(modal) {
    const button = modal.querySelector('#blacklistButton');
    if (button) {
        const username = getUsernameFromModal(modal);
        if (username) {
            chrome.storage.local.get({ blacklist: [] }, (result) => {
                const blacklist = result.blacklist;
                if (blacklist.includes(username)) {
                    button.innerText = 'Remove from Blacklist';
                } else {
                    button.innerText = 'Add to Blacklist';
                }
            });
        }
    }
}

function labelUsers(spots) {
    spots.forEach(spot => {
        const nameDiv = spot.querySelector(".name");
        if (nameDiv) {
            const username = nameDiv.innerText.trim();
            if (username) {
                chrome.storage.local.get({ blacklist: [] }, (result) => {
                    const blacklist = result.blacklist;
                    const parent = nameDiv.parentNode;
                    if (blacklist.includes(username)) {
                        nameDiv.style.color = "red";
                        parent.style.backgroundColor = "red";
                        parent.style.backgroundBlendMode = "multiply";
                    } else {
                        nameDiv.style.color = "";
                        parent.style.backgroundColor = "";
                    }
                });
            }
        }
    });
}

// Initialize script
function initialize() {
    // find the user modal to add a button
    const modals = document.querySelectorAll('.ui.large.modal.user-modal');
    if (modals) {
        const modal = modals[modals.length - 1];
        injectBlacklistButton(modal);
    
        // observe the name change
        const headerDiv = modal.querySelector('.header div');
        const modalNameObserver = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if(mutation.type === 'characterData') {
                    updateButtonText(modal);
                }
            }
        });
    
        modalNameObserver.observe(headerDiv, {
            subtree: true,
            characterData: true,
        });
    }

    // observe room changes
    const roomList = document.querySelector('.ui.grid.two.column');

    if (roomList) {
        const roomObserver = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                const target = mutation.target;
                if (target && target.nodeName === "DIV") {
                    if ((target.classList.contains("grid") 
                        && target.classList.contains("two") 
                        && target.classList.contains("column"))
                        || target.classList.contains("spot")) {
                        const spots = target.querySelectorAll(".spot");
                        labelUsers(spots);
                    }
                }
            }
        });
    
        const config = {
            childList: true,
            subtree: true,
        };
        
        roomObserver.observe(roomList, config);
    }
    const spots = document.querySelectorAll(".spot");
    labelUsers(spots);
}

window.onload = () => {
    initialize();
    // observe common-page
    const renderTarget = document.querySelector('#render-target');
    const renderTargetObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            const target = mutation.target;
            if (target && target.nodeName == "DIV" && (target.classList.contains("lobby-page") || target.classList.contains("room-page"))) {
                initialize();
            }
        }
    });

    const config = {
        childList: true,
        subtree: true,
    };
    
    renderTargetObserver.observe(renderTarget, config);
};
