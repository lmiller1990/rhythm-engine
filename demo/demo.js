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
 * Creates a new chart.
 * Handles things like offsetting the notes.
 */
function createChart(args) {
    return {
        notes: args.notes.map(function (note) {
            return __assign$1(__assign$1({}, note), { ms: note.ms + args.offset });
        })
    };
}
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

var bpm = 175;
var randomKey = function () {
    var seed = Math.random();
    if (seed < 0.25) {
        return 'KeyD';
    }
    if (seed >= 0.25 && seed < 0.5) {
        return 'KeyF';
    }
    if (seed >= 0.5 && seed < 0.75) {
        return 'KeyJ';
    }
    if (seed >= 0.75) {
        return 'KeyK';
    }
    throw Error(seed + " is invalid");
};
var songOffset = 2000;
var chartOffset = 2150;
var chart = createChart({
    offset: chartOffset,
    notes: new Array(30).fill(0).map(function (_, idx) {
        var ms = Math.round((1000 / (bpm / 60)) * idx);
        return {
            id: (idx + 1).toString(),
            ms: ms,
            code: randomKey()
        };
    })
});
var end = false;
setTimeout(function () { return (end = true); }, 20000);
var first = true;
function updateDebug(world) {
    var $body = document.querySelector('#debug-body');
    $body.innerHTML = '';
    var hide = ['canHit', 'hitAt'];
    if (first) {
        for (var _i = 0, hide_1 = hide; _i < hide_1.length; _i++) {
            var attr = hide_1[_i];
            var $th = document.querySelector("[data-debugid=\"" + attr + "\"]");
            $th.remove();
        }
        first = false;
    }
    for (var _a = 0, _b = world.core.chart.notes; _a < _b.length; _a++) {
        var note = _b[_a];
        var $tr = document.createElement('tr');
        for (var _c = 0, _d = ['id', 'hitTiming', 'code', 'ms', 'canHit', 'hitAt']; _c < _d.length; _c++) {
            var attr = _d[_c];
            if (hide.includes(attr)) {
                continue;
            }
            var $td = document.createElement('td');
            // @ts-ignore
            $td.innerText = note[attr];
            $tr.append($td);
        }
        $body.append($tr);
    }
}
var input;
var playing = false;
var SPEED_MOD = 2;
function gameLoop(world) {
    var time = performance.now();
    if (!playing && time - world.core.offset >= songOffset) {
        audio.play();
        playing = true;
    }
    var newGameState = updateGameState({
        time: time,
        chart: world.core.chart,
        input: input
    });
    for (var _i = 0, _a = newGameState.notes; _i < _a.length; _i++) {
        var note = _a[_i];
        var yPos = world.shell.notes[note.id].ms - world.core.time;
        world.shell.notes[note.id].$el.style.top = yPos / SPEED_MOD + "px";
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
var _loop_1 = function (note) {
    var $note = document.createElement('div');
    $note.className = 'ui-note';
    $note.style.top = Math.round(note.ms / SPEED_MOD) + "px";
    $note.style.left = (function () {
        if (note.code === 'KeyD')
            return '0px';
        if (note.code === 'KeyF')
            return '25px';
        if (note.code === 'KeyJ')
            return '50px';
        if (note.code === 'KeyK')
            return '75px';
        return '';
    })();
    notes[note.id] = __assign(__assign({}, note), { $el: $note });
    $chart.appendChild($note);
};
for (var _i = 0, _a = gameChart.notes; _i < _a.length; _i++) {
    var note = _a[_i];
    _loop_1(note);
}
function initKeydownListener(offset) {
    window.addEventListener('keydown', function (event) {
        if (event.code === 'KeyJ' ||
            event.code === 'KeyK' ||
            event.code === 'KeyD' ||
            event.code === 'KeyF') {
            input = { ms: event.timeStamp - offset, code: event.code };
        }
    });
}
var audio = document.createElement('audio');
document.querySelector('#end').addEventListener('click', function () {
    end = true;
});
document.querySelector('#start').addEventListener('click', function () {
    audio.src = '/resources/uber-rave.mp3';
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
