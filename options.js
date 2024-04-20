document.addEventListener('DOMContentLoaded', function() {
    const checkbox = document.getElementById('enablePopup');

    chrome.storage.sync.get('isPopupEnabled', function(data) {
        checkbox.checked = data.isPopupEnabled;
    });

    checkbox.addEventListener('change', function() {
        chrome.storage.sync.set({isPopupEnabled: this.checked});
    });
});
