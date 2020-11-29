/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign$1 = function() {
    __assign$1 = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign$1.apply(this, arguments);
};

/**
 * Finds the "nearest" note given an input and a chart for scoring.
 */
function nearestNote(input, chart) {
    var nearest = chart.notes.reduce(function (best, note) {
        if (input.code === note.code &&
            Math.abs(note.ms - input.ms) < Math.abs(best.ms - input.ms)) {
            return note;
        }
        return best;
    }, chart.notes[0]);
    return nearest && nearest.code === input.code ? nearest : undefined;
}
/**
 * Get the difference between the time the note should have been hit
 * and the actual time it was hit.
 * Useful for scoring systems.
 */
function judge(input, note) {
    return input.ms - note.ms;
}
/**
 * Given an input and a chart, see if there is a note nearby and judge
 * how accurately the player hit it.
 */
function judgeInput(input, chart) {
    var note = nearestNote(input, chart);
    if (note) {
        return {
            timing: judge(input, note),
            noteId: note.id
        };
    }
}
// Create a new "world", which represents the play-through of one chart.
function initGameState(chart) {
    return {
        notes: chart.notes.map(function (note) {
            return __assign$1(__assign$1({}, note), { canHit: true });
        })
    };
}
/**
 * Returns a new world, given an existing one and (optionally) an input.
 * The only way the world changes is via a user input.
 * Given X world and Y input, the new world will always be Z.
 * That is to say the world in the engine is deterministic - no side effects.
 *
 * If there is no user input, the new world will be identical to the previous one.
 */
function updateGameState(world) {
    var judgementResult = world.input && judgeInput(world.input, world.chart);
    return {
        notes: world.chart.notes.map(function (note) {
            if (!note.canHit || !judgementResult) {
                return note;
            }
            if (judgementResult.noteId === note.id) {
                return __assign$1(__assign$1({}, note), { hitAt: world.input.ms, canHit: false, hitTiming: judgementResult.timing });
            }
            return note;
        })
    };
}

var bpm = 120;
var delay = 2000;
var chart = {
    notes: new Array(50).fill(0).map(function (_, idx) {
        return {
            id: (idx + 1).toString(),
            ms: (1000 / (bpm / 60) * idx) + 230 + delay,
            code: 'KeyJ'
        };
    })
    //  [
    //   { id: '1', ms: 1000, code: 'KeyJ' },
    //   { id: '2', ms: 2000, code: 'KeyK' },
    //   { id: '3', ms: 3000, code: 'KeyJ' },
    //   { id: '4', ms: 4000, code: 'KeyK' },
    //   { id: '5', ms: 5000, code: 'KeyJ' },
    //   { id: '6', ms: 6000, code: 'KeyK' },
    //   { id: '7', ms: 7000, code: 'KeyJ' }
    // ]
};
var end = false;
setTimeout(function () { return (end = true); }, 30000);
function updateDebug(world) {
    var $body = document.querySelector('#debug-body');
    $body.innerHTML = '';
    for (var _i = 0, _a = world.core.chart.notes; _i < _a.length; _i++) {
        var note = _a[_i];
        var $tr = document.createElement('tr');
        for (var _b = 0, _c = ['id', 'ms', 'code', 'canHit', 'hitAt', 'hitTiming']; _b < _c.length; _b++) {
            var attr = _c[_b];
            var $td = document.createElement('td');
            // @ts-ignore
            $td.innerText = note[attr];
            $tr.append($td);
        }
        $body.append($tr);
    }
}
var input;
function gameLoop(world) {
    var newGameState = updateGameState({
        time: performance.now(),
        chart: world.core.chart,
        input: input
    });
    for (var _i = 0, _a = newGameState.notes; _i < _a.length; _i++) {
        var note = _a[_i];
        var yPos = world.shell.notes[note.id].ms - world.core.time;
        world.shell.notes[note.id].$el.style.top = yPos / 10 + "px";
    }
    var newWorld = {
        core: {
            offset: world.core.offset,
            time: performance.now() - world.core.offset,
            chart: newGameState
        },
        shell: {
            notes: world.shell.notes
        }
    };
    if (input) {
        updateDebug(newWorld);
        input = undefined;
    }
    if (end) {
        audio.pause();
        return;
    }
    requestAnimationFrame(function () { return gameLoop(newWorld); });
}
var gameChart = initGameState(chart);
var notes = {};
var $chart = document.querySelector('#chart-notes');
for (var _i = 0, _a = gameChart.notes; _i < _a.length; _i++) {
    var note = _a[_i];
    var $note = document.createElement('div');
    $note.className = 'ui-note';
    $note.style.top = Math.round(note.ms / 10) + "px";
    notes[note.id] = __assign(__assign({}, note), { $el: $note });
    $chart.appendChild($note);
}
function initKeydownListener(offset) {
    window.addEventListener('keydown', function (event) {
        if (event.code === 'KeyJ' || event.code === 'KeyK') {
            input = { ms: event.timeStamp - offset, code: event.code };
        }
    });
}
var audio = document.createElement('audio');
document.querySelector('#end').addEventListener('click', function () {
    end = true;
});
document.querySelector('#start').addEventListener('click', function () {
    // audio.src = 'http://localhost:8000/noxik-hotline.mp3'
    audio.src = 'http://localhost:8000/120.mp3';
    audio.play();
    var offset = performance.now();
    initKeydownListener(offset);
    var world = {
        core: {
            time: 0,
            chart: gameChart,
            offset: offset
        },
        shell: {
            notes: notes
        }
    };
    updateDebug(world);
    requestAnimationFrame(function () { return gameLoop(world); });
});

export { gameLoop };
