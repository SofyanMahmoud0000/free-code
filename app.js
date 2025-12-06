require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});

require(['vs/editor/editor.main'], function() {
    // Define VS Dark Black theme
    monaco.editor.defineTheme('one-dark-black', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#000000',
        }
    });

    // File management
    var files = {};
    var currentFileId = null;
    var fileCounter = 0;
    var editor = null;
    var saveTimeout = null;
    var selectedFileIndex = 0;

    // Initialize editor
    editor = monaco.editor.create(document.getElementById('container'), {
        value: '',
        language: 'cpp',
        theme: 'one-dark-black',
        fontSize: 16,
        tabSize: 2,
        insertSpaces: true,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnType: true,
        formatOnPaste: true,
        renderLineHighlight: 'none',
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnEnter: 'off',
        tabCompletion: 'off',
        wordBasedSuggestions: false,
        parameterHints: { enabled: false },
        minimap: { enabled: false },
        scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
        }
    });

    // Load theme
    var savedTheme = localStorage.getItem('editorTheme') || 'one-dark-black';
    monaco.editor.setTheme(savedTheme);
    document.getElementById('theme-selector').value = savedTheme;

    // Load files from localStorage
    function loadFiles() {
        var savedFiles = localStorage.getItem('files');
        var savedCurrentId = localStorage.getItem('currentFileId');

        if (savedFiles) {
            files = JSON.parse(savedFiles);
            fileCounter = parseInt(localStorage.getItem('fileCounter')) || Object.keys(files).length;
        }

        // If no files, create a default one
        if (Object.keys(files).length === 0) {
            createNewFile();
        } else {
            currentFileId = savedCurrentId || Object.keys(files)[0];
            renderTabs();
            loadFile(currentFileId);
        }
    }

    // Save files to localStorage
    function saveFiles() {
        localStorage.setItem('files', JSON.stringify(files));
        localStorage.setItem('currentFileId', currentFileId);
        localStorage.setItem('fileCounter', fileCounter.toString());
    }

    // Save current file content
    function saveCurrentFile() {
        if (currentFileId && files[currentFileId]) {
            files[currentFileId].content = editor.getValue();
            files[currentFileId].language = editor.getModel().getLanguageId();
            saveFiles();
        }
    }

    // Auto-save
    editor.onDidChangeModelContent(function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveCurrentFile, 500);
    });

    // Create new file
    function createNewFile() {
        fileCounter++;
        var fileId = 'file-' + fileCounter;
        files[fileId] = {
            name: 'untitled-' + fileCounter + '.cpp',
            content: '',
            language: 'cpp'
        };
        currentFileId = fileId;
        renderTabs();
        loadFile(fileId);
        saveFiles();
    }

    // Switch to file
    function switchToFile(fileId) {
        if (fileId === currentFileId) return;
        saveCurrentFile();
        currentFileId = fileId;
        renderTabs();
        loadFile(fileId);
        saveFiles();
    }

    // Load file into editor
    function loadFile(fileId) {
        if (!files[fileId]) return;
        var file = files[fileId];
        editor.setValue(file.content);
        monaco.editor.setModelLanguage(editor.getModel(), file.language);
        document.getElementById('language-selector').value = file.language;
    }

    // Close file
    function closeFile(fileId) {
        if (Object.keys(files).length === 1) {
            alert('Cannot close the last file');
            return;
        }

        // Check if file has content and confirm deletion
        var file = files[fileId];
        if (file && file.content && file.content.trim().length > 0) {
            var confirmed = confirm('File "' + file.name + '" contains data. Are you sure you want to delete it?');
            if (!confirmed) {
                return;
            }
        }

        delete files[fileId];

        // Switch to another file
        if (currentFileId === fileId) {
            currentFileId = Object.keys(files)[0];
            loadFile(currentFileId);
        }

        renderTabs();
        saveFiles();
    }

    // Rename file
    function renameFile(fileId) {
        var file = files[fileId];
        var newName = prompt('Enter new name:', file.name);
        if (newName && newName.trim()) {
            file.name = newName.trim();
            renderTabs();
            saveFiles();
        }
    }

    // Render files in switcher
    function renderTabs() {
        var list = document.getElementById('file-switcher-list');
        list.innerHTML = '';

        // Update current file indicator
        if (currentFileId && files[currentFileId]) {
            document.getElementById('current-file-indicator').textContent = files[currentFileId].name;
        }

        // Add file items
        var fileIds = Object.keys(files);
        fileIds.forEach(function(fileId, index) {
            var file = files[fileId];
            var item = document.createElement('div');
            var classes = 'file-switcher-item';
            if (fileId === currentFileId) classes += ' active';
            if (index === selectedFileIndex) classes += ' selected';
            item.className = classes;

            var nameSpan = document.createElement('span');
            nameSpan.className = 'file-switcher-name';
            nameSpan.textContent = file.name;
            var clickTimer = null;
            nameSpan.addEventListener('click', function(e) {
                e.stopPropagation();
                clearTimeout(clickTimer);
                clickTimer = setTimeout(function() {
                    selectedFileIndex = index;
                    switchToFile(fileId);
                    renderTabs();
                }, 200);
            });
            nameSpan.addEventListener('dblclick', function(e) {
                e.preventDefault();
                e.stopPropagation();
                clearTimeout(clickTimer);
                renameFile(fileId);
            });

            var closeSpan = document.createElement('span');
            closeSpan.className = 'file-switcher-close';
            closeSpan.textContent = '×';
            closeSpan.addEventListener('click', function(e) {
                e.stopPropagation();
                closeFile(fileId);
            });

            item.appendChild(nameSpan);
            item.appendChild(closeSpan);
            list.appendChild(item);
        });
    }

    // Toggle file switcher
    function toggleFileSwitcher() {
        var switcher = document.getElementById('file-switcher');
        var hint = document.getElementById('keyboard-hint');
        var isOpening = !switcher.classList.contains('visible');

        switcher.classList.toggle('visible');

        // Hide/show hint based on switcher state
        if (isOpening) {
            hint.style.display = 'none';
            var fileIds = Object.keys(files);
            selectedFileIndex = fileIds.indexOf(currentFileId);
            if (selectedFileIndex === -1) selectedFileIndex = 0;
            renderTabs();

            // Focus the list to capture keyboard events
            setTimeout(function() {
                document.getElementById('file-switcher-list').focus();
            }, 0);
        } else {
            hint.style.display = 'block';
            // When closing, return focus to editor
            editor.focus();
        }
    }

    // New file button
    document.getElementById('file-switcher-new').addEventListener('click', function(e) {
        e.stopPropagation();
        createNewFile();
        // Trigger rename prompt for the new file
        setTimeout(function() {
            if (currentFileId) {
                renameFile(currentFileId);
            }
        }, 100);
    });

    // Current file indicator click
    document.getElementById('current-file-indicator').addEventListener('click', toggleFileSwitcher);

    // Close file switcher when clicking outside
    document.addEventListener('click', function(e) {
        var switcher = document.getElementById('file-switcher');
        var indicator = document.getElementById('current-file-indicator');

        if (switcher.classList.contains('visible') &&
            !switcher.contains(e.target) &&
            !indicator.contains(e.target)) {
            toggleFileSwitcher();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        var switcher = document.getElementById('file-switcher');
        var isSwitcherOpen = switcher.classList.contains('visible');

        // Ctrl+P: Toggle file switcher
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            toggleFileSwitcher();
            return;
        }

        // Arrow keys and Enter only work when switcher is open
        if (isSwitcherOpen) {
            var fileIds = Object.keys(files);

            // ArrowDown: Move selection down and preview
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedFileIndex = (selectedFileIndex + 1) % fileIds.length;
                var selectedFileId = fileIds[selectedFileIndex];
                if (selectedFileId) {
                    switchToFile(selectedFileId);
                }
                renderTabs();
                return;
            }

            // ArrowUp: Move selection up and preview
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedFileIndex = (selectedFileIndex - 1 + fileIds.length) % fileIds.length;
                var selectedFileId = fileIds[selectedFileIndex];
                if (selectedFileId) {
                    switchToFile(selectedFileId);
                }
                renderTabs();
                return;
            }

            // Enter: Confirm selection and close switcher
            if (e.key === 'Enter') {
                e.preventDefault();
                toggleFileSwitcher();
                return;
            }

            // N: Create new file
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                createNewFile();
                setTimeout(function() {
                    if (currentFileId) {
                        renameFile(currentFileId);
                    }
                }, 100);
                return;
            }

            // R: Rename selected file
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                var selectedFileId = fileIds[selectedFileIndex];
                if (selectedFileId) {
                    renameFile(selectedFileId);
                }
                return;
            }

            // D: Delete selected file
            if (e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                var selectedFileId = fileIds[selectedFileIndex];
                if (selectedFileId) {
                    closeFile(selectedFileId);
                    // Adjust selected index if needed
                    var newFileIds = Object.keys(files);
                    if (selectedFileIndex >= newFileIds.length) {
                        selectedFileIndex = newFileIds.length - 1;
                    }
                    if (selectedFileIndex < 0) selectedFileIndex = 0;
                }
                return;
            }

            // Escape: Close file switcher
            if (e.key === 'Escape') {
                toggleFileSwitcher();
                return;
            }
        }
    });

    // Language switcher
    document.getElementById('language-selector').addEventListener('change', function() {
        monaco.editor.setModelLanguage(editor.getModel(), this.value);
        if (currentFileId && files[currentFileId]) {
            files[currentFileId].language = this.value;
            saveFiles();
        }
    });

    // Theme switcher
    document.getElementById('theme-selector').addEventListener('change', function() {
        monaco.editor.setTheme(this.value);
        localStorage.setItem('editorTheme', this.value);
    });

    // Auto-resize
    window.addEventListener('resize', function() {
        editor.layout();
    });

    // Stopwatch
    var stopwatchInterval = null;
    var stopwatchSeconds = 0;
    var isStopwatchRunning = false;
    var stopwatchStartTime = null;

    function formatTime(totalSeconds) {
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;
        return (hours < 10 ? '0' + hours : hours) + ':' +
               (minutes < 10 ? '0' + minutes : minutes) + ':' +
               (seconds < 10 ? '0' + seconds : seconds);
    }

    function saveStopwatchState() {
        localStorage.setItem('stopwatchSeconds', stopwatchSeconds.toString());
        localStorage.setItem('isStopwatchRunning', isStopwatchRunning.toString());
        if (isStopwatchRunning) {
            localStorage.setItem('stopwatchStartTime', stopwatchStartTime.toString());
        } else {
            localStorage.removeItem('stopwatchStartTime');
        }
    }

    function loadStopwatchState() {
        var savedSeconds = localStorage.getItem('stopwatchSeconds');
        var savedRunning = localStorage.getItem('isStopwatchRunning');
        var savedStartTime = localStorage.getItem('stopwatchStartTime');

        if (savedSeconds) {
            stopwatchSeconds = parseInt(savedSeconds);
        }

        if (savedRunning === 'true' && savedStartTime) {
            // Calculate elapsed time since page was closed
            var startTime = parseInt(savedStartTime);
            var now = Date.now();
            var elapsedWhileClosed = Math.floor((now - startTime) / 1000);
            stopwatchSeconds += elapsedWhileClosed;

            // Restart the stopwatch
            stopwatchStartTime = now;
            stopwatchInterval = setInterval(updateStopwatch, 1000);
            document.getElementById('stopwatch').classList.add('running');
            isStopwatchRunning = true;
        }

        document.getElementById('stopwatch-time').textContent = formatTime(stopwatchSeconds);
    }

    function updateStopwatch() {
        stopwatchSeconds++;
        var timeStr = formatTime(stopwatchSeconds);
        document.getElementById('stopwatch-time').textContent = timeStr;
        saveStopwatchState();
    }

    function toggleStopwatch(e) {
        if (e) e.stopPropagation();
        var stopwatchEl = document.getElementById('stopwatch');

        if (isStopwatchRunning) {
            // Pause
            clearInterval(stopwatchInterval);
            stopwatchEl.classList.remove('running');
            isStopwatchRunning = false;
            stopwatchStartTime = null;
        } else {
            // Start
            stopwatchStartTime = Date.now();
            stopwatchInterval = setInterval(updateStopwatch, 1000);
            stopwatchEl.classList.add('running');
            isStopwatchRunning = true;
        }
        saveStopwatchState();
    }

    function resetStopwatch(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Stop if running
        if (isStopwatchRunning) {
            clearInterval(stopwatchInterval);
            document.getElementById('stopwatch').classList.remove('running');
            isStopwatchRunning = false;
        }

        // Reset to zero
        stopwatchSeconds = 0;
        stopwatchStartTime = null;
        document.getElementById('stopwatch-time').textContent = '00:00:00';
        saveStopwatchState();
    }

    // Stopwatch click handlers
    var stopwatchTimeEl = document.getElementById('stopwatch-time');
    var stopwatchResetEl = document.getElementById('stopwatch-reset');

    if (stopwatchTimeEl) {
        stopwatchTimeEl.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleStopwatch(e);
        });
    }

    if (stopwatchResetEl) {
        stopwatchResetEl.addEventListener('click', function(e) {
            e.stopPropagation();
            resetStopwatch(e);
        });
    }

    // Countdown Timer
    var countdownInterval = null;
    var countdownSeconds = 0;
    var isCountdownRunning = false;
    var countdownTargetTime = null;

    function saveCountdownState() {
        localStorage.setItem('countdownSeconds', countdownSeconds.toString());
        localStorage.setItem('isCountdownRunning', isCountdownRunning.toString());
        if (isCountdownRunning && countdownTargetTime) {
            localStorage.setItem('countdownTargetTime', countdownTargetTime.toString());
        } else {
            localStorage.removeItem('countdownTargetTime');
        }
    }

    function loadCountdownState() {
        var savedSeconds = localStorage.getItem('countdownSeconds');
        var savedRunning = localStorage.getItem('isCountdownRunning');
        var savedTargetTime = localStorage.getItem('countdownTargetTime');

        if (savedRunning === 'true' && savedTargetTime) {
            // Calculate remaining time
            var targetTime = parseInt(savedTargetTime);
            var now = Date.now();
            var remainingMs = targetTime - now;

            if (remainingMs > 0) {
                // Countdown still running
                countdownSeconds = Math.floor(remainingMs / 1000);
                countdownTargetTime = targetTime;
                countdownInterval = setInterval(updateCountdown, 1000);
                document.getElementById('countdown').classList.add('running');
                isCountdownRunning = true;
            } else {
                // Countdown finished while page was closed
                countdownSeconds = 0;
                isCountdownRunning = false;
                countdownTargetTime = null;
                localStorage.removeItem('countdownTargetTime');
                localStorage.removeItem('isCountdownRunning');
                // Show finished alert
                alert('Countdown finished!');
            }
        } else if (savedSeconds) {
            countdownSeconds = parseInt(savedSeconds);
        }

        document.getElementById('countdown-time').textContent = formatTime(countdownSeconds);
    }

    function updateCountdown() {
        if (countdownSeconds > 0) {
            countdownSeconds--;
            var timeStr = formatTime(countdownSeconds);
            document.getElementById('countdown-time').textContent = timeStr;
            saveCountdownState();
        } else {
            // Countdown finished
            clearInterval(countdownInterval);
            document.getElementById('countdown').classList.remove('running');
            isCountdownRunning = false;
            countdownTargetTime = null;
            alert('Countdown finished!');
            countdownSeconds = 0;
            document.getElementById('countdown-time').textContent = '00:00:00';
            saveCountdownState();
        }
    }

    function startCountdown(e) {
        if (e) e.stopPropagation();

        if (isCountdownRunning) {
            // Pause countdown
            clearInterval(countdownInterval);
            document.getElementById('countdown').classList.remove('running');
            isCountdownRunning = false;
            countdownTargetTime = null;
            saveCountdownState();
        } else {
            // Show modal if countdown is at 0
            if (countdownSeconds === 0) {
                document.getElementById('countdown-modal').style.display = 'flex';
                return;
            }

            // Start countdown
            countdownTargetTime = Date.now() + (countdownSeconds * 1000);
            countdownInterval = setInterval(updateCountdown, 1000);
            document.getElementById('countdown').classList.add('running');
            isCountdownRunning = true;
            saveCountdownState();
        }
    }

    // Modal button handlers
    document.getElementById('countdown-start-btn').addEventListener('click', function() {
        var hours = parseInt(document.getElementById('countdown-hours').value) || 0;
        var minutes = parseInt(document.getElementById('countdown-minutes').value) || 0;

        countdownSeconds = hours * 3600 + minutes * 60;

        if (countdownSeconds <= 0) {
            alert('Please enter a valid time');
            return;
        }

        // Hide modal
        document.getElementById('countdown-modal').style.display = 'none';

        // Update display and start countdown
        document.getElementById('countdown-time').textContent = formatTime(countdownSeconds);
        countdownTargetTime = Date.now() + (countdownSeconds * 1000);
        countdownInterval = setInterval(updateCountdown, 1000);
        document.getElementById('countdown').classList.add('running');
        isCountdownRunning = true;
        saveCountdownState();
    });

    document.getElementById('countdown-cancel-btn').addEventListener('click', function() {
        document.getElementById('countdown-modal').style.display = 'none';
    });

    // Close modal when clicking outside
    document.getElementById('countdown-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    function resetCountdown(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Stop if running
        if (isCountdownRunning) {
            clearInterval(countdownInterval);
            document.getElementById('countdown').classList.remove('running');
            isCountdownRunning = false;
        }

        // Reset to zero
        countdownSeconds = 0;
        countdownTargetTime = null;
        document.getElementById('countdown-time').textContent = '00:00:00';
        saveCountdownState();
    }

    // Countdown click handlers
    var countdownTimeEl = document.getElementById('countdown-time');
    var countdownResetEl = document.getElementById('countdown-reset');

    if (countdownTimeEl) {
        countdownTimeEl.addEventListener('click', function(e) {
            e.stopPropagation();
            startCountdown(e);
        });
    }

    if (countdownResetEl) {
        countdownResetEl.addEventListener('click', function(e) {
            e.stopPropagation();
            resetCountdown(e);
        });
    }

    // Initialize
    loadFiles();
    loadStopwatchState();
    loadCountdownState();
});
