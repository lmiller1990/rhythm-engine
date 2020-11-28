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
function judge(input, note) {
    return input.ms - note.ms;
}
function judgeInput(input, chart) {
    var note = nearestNote(input, chart);
    if (note) {
        return {
            timing: judge(input, note),
            noteId: note.id
        };
    }
}
function initGameState(chart) {
    return {
        notes: chart.notes.map(function (note) {
            return __assign$1(__assign$1({}, note), { canHit: true, remainingMs: note.ms });
        })
    };
}
function updateGameState(world) {
    var judgementResult = world.input && judgeInput(world.input, world.chart);
    return {
        notes: world.chart.notes.map(function (note) {
            var timing = judgementResult && judgementResult.noteId === note.id
                ? judgementResult.timing
                : undefined;
            return __assign$1(__assign$1({}, note), { remainingMs: note.ms - world.ms, canHit: !timing, hitTiming: timing });
        })
    };
}

var chart = {
    notes: [
        { id: '1', ms: 1000, code: 'KeyJ' },
        { id: '2', ms: 2000, code: 'KeyK' },
        { id: '3', ms: 3000, code: 'KeyJ' },
        { id: '4', ms: 4000, code: 'KeyK' },
        { id: '5', ms: 5000, code: 'KeyJ' },
        { id: '6', ms: 6000, code: 'KeyK' },
        { id: '7', ms: 7000, code: 'KeyJ' }
    ]
};
// function drawDebug(chart: Chart) {
//   const $chart = document.querySelector('#chart')!
//   for (const note of chart.notes) {
//     const $note = document.createElement('div')
//     $note.className = 'note__name'
//     $note.innerText = `${note.ms} (${note.code})`
//     const $el = document.createElement('div')
//     $el.className = 'note'
//     $el.setAttribute('data-noteid', note.id)
//     $el.append($note)
//     $chart.append($el)
//   }
// }
var initOffset = 0;
var end = false;
setTimeout(function () { return (end = true); }, 10000 + initOffset);
function updateDebug(world) {
    var $head = document.querySelector('#debug-head');
    $head.innerHTML = '';
    for (var _i = 0, _a = Object.keys(world.state.chart.notes[0]); _i < _a.length; _i++) {
        var k = _a[_i];
        var $th = document.createElement('th');
        $th.innerText = k;
        $head.appendChild($th);
    }
    var $body = document.querySelector('#debug-body');
    $body.innerHTML = '';
    for (var _b = 0, _c = world.state.chart.notes; _b < _c.length; _b++) {
        var note = _c[_b];
        var $tr = document.createElement('tr');
        for (var _d = 0, _e = Object.values(note); _d < _e.length; _d++) {
            var v = _e[_d];
            var $td = document.createElement('td');
            $td.innerText = v;
            $tr.append($td);
        }
        $body.append($tr);
    }
}
var input;
window.addEventListener('keydown', function (event) {
    if (event.code === 'KeyJ' || event.code === 'KeyK') {
        input = { ms: event.timeStamp - initOffset, code: event.code };
    }
});
function gameLoop(world) {
    // $elapsed.textContent = prettyTimeElapsed(world.state.ms)
    var newGameState = updateGameState({
        ms: world.state.ms,
        chart: world.state.chart,
        input: input
    });
    for (var _i = 0, _a = newGameState.notes; _i < _a.length; _i++) {
        var note = _a[_i];
        var yPos = world.notes[note.id].ms - world.state.ms;
        world.notes[note.id].$el.style.top = yPos / 10 + "px";
    }
    var newWorld = {
        state: {
            ms: performance.now() - initOffset,
            chart: newGameState
        },
        notes: world.notes
    };
    if (input) {
        updateDebug(newWorld);
        console.log(world.state.chart.notes, newGameState.notes);
    }
    input = undefined;
    if (end) {
        return;
    }
    requestAnimationFrame(function () { return gameLoop(newWorld); });
}
// drawDebug(chart)
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
setTimeout(function () {
    var world = {
        state: {
            ms: 0,
            chart: gameChart
        },
        notes: notes
    };
    updateDebug(world);
    requestAnimationFrame(function () { return gameLoop(world); });
}, initOffset);

export { gameLoop };
