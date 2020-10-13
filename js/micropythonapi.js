/**
 * The MicroPython API and helper functions to enable ACE autocompletion.
 */
var microPythonApi = (function () {
    'use strict';

    var uPyBaseApi = {
        "microbit" : {
            "Image" : ["ALL_CLOCKS", "ANGRY", "ARROW_E", "ARROW_N", "ARROW_NE", "ARROW_NW", "ARROW_S", "ARROW_SE", "ARROW_SW", "ARROW_W", "ASLEEP", "BUTTERFLY", "CHESSBOARD", "CLOCK1", "CLOCK10", "CLOCK11", "CLOCK12", "CLOCK2", "CLOCK3", "CLOCK4", "CLOCK5", "CLOCK6", "CLOCK7", "CLOCK8", "CLOCK9", "CONFUSED", "COW", "DIAMOND", "DIAMOND_SMALL", "DUCK", "FABULOUS", "GHOST", "GIRAFFE", "HAPPY", "HEART", "HEART_SMALL", "HOUSE", "MEH", "MUSIC_CROTCHET", "MUSIC_QUAVER", "MUSIC_QUAVERS", "NO", "PACMAN", "PITCHFORK", "RABBIT", "ROLLERSKATE", "SAD", "SILLY", "SKULL", "SMILE", "SNAKE", "SQUARE", "SQUARE_SMALL", "STICKFIGURE", "SURPRISED", "SWORD", "TARGET", "TORTOISE", "TRIANGLE", "TRIANGLE_LEFT", "TSHIRT", "UMBRELLA", "XMAS", "YES"],
            "pin0" : ["is_touched", "read_analog", "read_digital", "set_analog_period", "set_analog_period_microseconds", "write_analog", "write_digital"],
            "pin1" : ["is_touched", "read_analog", "read_digital", "set_analog_period", "set_analog_period_microseconds", "write_analog", "write_digital"],
            "pin2" : ["is_touched", "read_analog", "read_digital", "set_analog_period", "set_analog_period_microseconds", "write_analog", "write_digital"],
            "pin3" : ["read_analog", "read_digital", "set_analog_period", "set_analog_period_microseconds", "write_analog", "write_digital"],
            "pin4" : ["read_analog", "read_digital", "set_analog_period", "set_analog_period_microseconds", "write_analog", "write_digital"],
            "pin5" : ["read_digital", "write_digital"],
            "pin6" : ["read_digital", "write_digital"],
            "pin7" : ["read_digital", "write_digital"],
            "pin8" : ["read_digital", "write_digital"],
            "pin9" : ["read_digital", "write_digital"],
            "pin10" : ["read_analog", "read_digital", "set_analog_period", "set_analog_period_microseconds", "write_analog", "write_digital"],
            "pin11" : ["read_digital", "write_digital"],
            "pin12" : ["read_digital", "write_digital"],
            "pin13" : ["read_digital", "write_digital"],
            "pin14" : ["read_digital", "write_digital"],
            "pin15" : ["read_digital", "write_digital"],
            "pin16" : ["read_digital", "write_digital"],
            "pin19" : ["read_digital", "write_digital"],
            "pin20" : ["read_digital", "write_digital"],
            "accelerometer" : ["current_gesture", "get_gestures", "get_values", "get_x", "get_y", "get_z", "was_gesture"],
            "button_a" : ["get_presses", "is_pressed", "was_pressed"],
            "button_b" : ["get_presses", "is_pressed", "was_pressed"],
            "compass" : ["calibrate", "clear_calibration", "get_field_strength", "get_x", "get_y", "get_z", "heading", "is_calibrated"],
            "display" : ["clear", "get_pixel", "is_on", "off", "on", "read_light_level", "scroll", "set_pixel", "show"],
            "i2c" : ["init", "read", "scan", "write"],
            "panic" : "",
            "reset" : "",
            "running_time" : "",
            "sleep" : "",
            "spi" : ["init", "read", "write", "write_readinto"],
            "temperature" : "",
            "uart" : ["any", "init", "read", "readall", "readline", "write"]
        },
        "audio" : ["play", "AudioFrame"],
        "machine" : ["disable_irq", "enable_irq", "freq", "reset", "time_pulse_us", "unique_id"],
        "micropython" : ["const", "heap_lock", "heap_unlock", "kbd_intr", "mem_info", "opt_level", "qstr_info", "stack_use"],
        "music" : ["BADDY", "BA_DING", "BIRTHDAY", "BLUES", "CHASE", "DADADADUM", "ENTERTAINER", "FUNERAL", "FUNK", "JUMP_DOWN", "JUMP_UP", "NYAN", "ODE", "POWER_DOWN", "POWER_UP", "PRELUDE", "PUNCHLINE", "PYTHON", "RINGTONE", "WAWAWAWAA", "WEDDING", "get_tempo", "pitch", "play", "reset", "set_temp", "stop"],
        "speech" : ["pronounce", "say", "sing", "translate"],
        "radio" : ["RATE_1MBIT", "RATE_250KBIT", "RATE_2MBIT", "config", "off", "on", "receive", "receive_bytes", "receive_bytes_into", "receive_full", "reset", "send", "send_bytes"],
        "os" : ["remove", "listdir", "size", "uname"],
        "time" : ["sleep", "sleep_ms", "sleep_us", "ticks_ms", "ticks_us", "ticks_add", "ticks_diff"],
        "utime" : ["sleep", "sleep_ms", "sleep_us", "ticks_ms", "ticks_us", "ticks_add", "ticks_diff"],
        "ucollections" : ["namedtuple", "OrderedDict"],
        "collections" : ["namedtuple", "OrderedDict"],
        "array" : ["array"],
        "math" : ["e", "pi", "sqrt", "pow", "exp", "log", "cos", "sin", "tan", "acos", "asin", "atan", "atan2", "ceil", "copysign", "fabs", "floor", "fmod", "frexp", "ldexp", "modf", "isfinite", "isinf", "isnan", "trunc", "radians", "degrees"],
        "random" : ["getrandbits", "seed", "randrange", "randint", "choice", "random", "uniform"],
        "ustruct" : ["calcsize", "pack", "pack_into", "unpack", "unpack_from"],
        "struct" : ["calcsize", "pack", "pack_into", "unpack", "unpack_from"],
        "sys" : ["version", "version_info", "implementation", "platform", "byteorder", "exit", "print_exception"],
        "gc" : ["collect", "disable", "enable", "isenabled", "mem_free", "mem_alloc", "threshold"],
        "neopixel" : {
            "NeoPixel" : ["clear", "show"]
        }
    };

    var extraModules = {
        "microbit": {
            "microphone": ["LOUD", "QUIET", "current_sound", "get_sounds", "is_sound", "sound_level", "was_sound"],
            "pin_logo": ["is_touched"],
            "pin_speaker": ["get_analog_period_microseconds", "get_mode", "get_pull", "read_digital", "set_analog_period", "set_analog_period_microseconds", "set_pull", "write_analog", "write_digital"]
        }
    };

    /**
     * Generates an expanded list of words for the ACE autocomplete to digest.
     *
     * @param {object} apiObj MicroPython modules in object form.
     * @returns {string[]} One dimensional array with all combinations of 
     */
    var flattenApi = function(apiObj) {
        var wordsHorizontal = [];
        Object.keys(apiObj).forEach(function(module) {
            wordsHorizontal.push(module);
            if (Array.isArray(apiObj[module])){
                apiObj[module].forEach(function(func) {
                    wordsHorizontal.push(module + '.' + func);
                });
            } else {
                Object.keys(apiObj[module]).forEach(function(sub) {
                    wordsHorizontal.push(module + '.' + sub);
                    if (Array.isArray(apiObj[module][sub])) {
                        apiObj[module][sub].forEach(function(func) {
                            wordsHorizontal.push(module + '.' + sub + '.' + func);
                            wordsHorizontal.push(sub + '.' + func);
                        });
                    }
                });
            }
        });
        return (wordsHorizontal);
    };

    /**
     * Generates the full API in a flat array needed for ACE autocompletion.
     * 
     * @return {string[]} Array with all the autocompletion combinations of
     *   available modules.
     */
    var getFullMicroPythonApi = function() {
        var finalObj = $.extend(true, {}, uPyBaseApi, extraModules);
        return flattenApi(finalObj);
    };

    /**
     * Generates the base API in a flat array needed for ACE autocompletion.
     * 
     * @return {string[]} Array with all the autocompletion combinations for
     *   the base MicroPython API.
     */
    var getBaseMicroPythonApi = function() {
        return flattenApi(uPyBaseApi);
    };

    /**
     * Based on the board ID it generates the appropriate MicroPython API in a
     * flat array needed for ACE autocompletion.
     * 
     * @return {string[]} Array with all the autocompletion combinations for
     *   the MicroPython version relevant to the board ID.
     */
    var getCompatibleMicroPythonApi = function(boardId) {
        if (boardId == '9903' || boardId == '9904') {
            return getFullMicroPythonApi();
        } else {
            return getBaseMicroPythonApi();
        }
    }

    /**
     * Detect Python imports in the provided Python code string.
     *
     * Current it does not support multiline imports:
     *   from microbit import (display,
     *       Image)
     * Or top level nested imports with an alias
     *   import microbit.display as d
     * 
     * Having the value "module-import" indicates that key has been imported,
     * as python modules cannot have the "-" character it shouldn't clash.
     * If it's not present that package has not been imported directly and
     * there should be nested packages/modules/variables imported instead.
     *
     * @param {string} PyCode Python code string to analyse.
     * @return {object} Object with the modules as keys and imports as values.
     */
    var detectImports = function(pyCode) {
        var match;
        var imports = {};

        var importRegex = /^(?:from[ \t]+(\S+)[ \t]+)?import[ \t]+(.*)[ ]*$/mg;
        while ((match = importRegex.exec(pyCode)) !== null) {
            // Avoid infinite loops with zero-width matches
            if (match.index === importRegex.lastIndex) importRegex.lastIndex++;

            // match[0] is the full line
            if (!match[1] && match[2]) {
                // import match[2]
                // Separate multiple imports in the same line
                match[2].split(',').forEach(function(singleImport) {
                    // Check nested packages with "." e.g. import microbit.display
                    var packages = singleImport.split('.');
                    packages.reduce(function (parentPackageObj, currentPackageName) {
                        if (!currentPackageName) return parentPackageObj;

                        // Ignore import renames with the "as" expression
                        currentPackageName = currentPackageName.split('as')[0].trim();
                        parentPackageObj[currentPackageName] = parentPackageObj[currentPackageName] || {};
                        // With the "from" keyword each nested package is globally available
                        parentPackageObj[currentPackageName]['module-import'] = null;
                        return parentPackageObj[currentPackageName];
                    }, imports);
                });
            } else if (match[1] && match[2]) {
                // from match[1] import match[2]
                // Check nested packages with "." e.g. from microbit.Image import HAPPY
                var packages = match[1].split('.');
                var finalNestedPackage = packages.reduce(function (parentPackageObj, currentPackageName) {
                    if (!currentPackageName) return parentPackageObj;

                    currentPackageName = currentPackageName.trim();
                    parentPackageObj[currentPackageName] = parentPackageObj[currentPackageName] || {};
                    return parentPackageObj[currentPackageName];
                }, imports);

                // Now, after "import" we can have multiple imports with comma separators
                match[2].split(',').forEach(function(singleImport) {
                    // Ignore import renames with the "as" expression
                    var importName = singleImport.split('as')[0].trim();
                    finalNestedPackage[importName] = finalNestedPackage[importName] || {};
                    finalNestedPackage[importName]['module-import'] = null;
                });
            }
        }
        return imports;
    };

    var isApiUsedCompatible = function(boardId, pyCode) {
        if (boardId == '9903' || boardId == '9904') {
            return true;
        } else if (boardId == '9900' || boardId == '9901') {
            var additionalModules = Object.keys(extraModules)
            var includesExtra = false;
            var imports = detectImports(pyCode);
            Object.keys(imports).forEach(function(topLevelModule) {
                if (additionalModules.indexOf(topLevelModule) > -1) {
                    includesExtra = true;
                }
            });
            return !includesExtra;
        } else {
            throw new Error('Could not recognise the Board ID ' + boardId);
        }
    };

    var publicApi = {
        'getFullApi': getFullMicroPythonApi,
        'getBaseApi': getBaseMicroPythonApi,
        'getCompatibleMicroPythonApi': getCompatibleMicroPythonApi,
        'isApiUsedCompatible': isApiUsedCompatible,
    };
    if (typeof jasmine !== 'undefined' || typeof jest !== 'undefined') {
        // Add these private functions when running unit tests
        publicApi['flattenApi'] = flattenApi;
        publicApi['detectImports'] = detectImports;
    }
    return publicApi;
})();

if (typeof module !== 'undefined' && module.exports) {
    global.microPythonApi = microPythonApi;
} else {
    window.microPythonApi = microPythonApi;
}
