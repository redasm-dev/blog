// Shiki theme from REDasm's dark palette (themes/dark.json in REDasm), "brand red" mapping:
// control flow and jumps in REDasm's stop red (echoing the brand), types in location blue
// (echoing links), directives in reg pink, calls and functions in call green.
// Used by astro.config.mjs (posts) and utils.js (excerpts).
const C = {
    background: "#202020",  // background (also the site's background-alt)
    foreground: "#f4f1d6",  // foreground
    comment: "#9a9a9a",     // REDasm's comment is #757575: lightened for reading on the web (5.8:1)
    function: "#96d952",
    type: "#4ce0c5",
    location: "#90caf9",
    number: "#ffb22e",
    reg: "#f8c7ff",
    string: "#d8b48a",
    stop: "#ff7575",
    call: "#96d952",
};

// later rules win over earlier ones for the same token, and more specific scopes win
// over less specific ones (e.g. "keyword.control.directive" over "keyword.control")
const rules = [
    [C.comment, ["comment", "punctuation.definition.comment"], "italic"],
    [C.string, ["string", "punctuation.definition.string"]],
    [C.reg, ["constant.character.escape", "constant.character.format.placeholder"]],
    [C.number, ["constant.numeric", "constant.language", "keyword.other.unit"]],
    [C.location, ["storage.type", "storage.modifier", "support.type", "entity.name.type", "entity.name.class"]],
    [C.function, ["entity.name.function", "support.function", "meta.function-call entity.name.function"]],
    [C.stop, ["keyword.control", "keyword.control.flow"]],
    [C.reg, ["keyword.control.directive", "punctuation.definition.directive", "meta.preprocessor", "entity.name.section", "entity.directive"]],
    [C.type, ["entity.name.function.preprocessor", "storage.type.asm"]],
    [C.foreground, ["keyword.operator", "punctuation", "variable", "meta.block"]],
    [C.foreground, ["variable.parameter"], "italic"],

    // assembly (asm grammar): mnemonics plain, control transfer colored, registers apart
    [C.foreground, ["keyword.operator.word.mnemonic"]],
    [C.stop, ["keyword.operator.word.mnemonic.general-purpose.control-transfer.jmp"]],
    [C.call, ["keyword.operator.word.mnemonic.general-purpose.control-transfer.other"]],
    [C.reg, ["constant.language.register"]],
    [C.function, ["entity.name.function.asm.x86_64"]],
];

export default {
    name: "redasm-dark",
    type: "dark",
    colors: {
        "editor.background": C.background,
        "editor.foreground": C.foreground,
    },
    tokenColors: rules.map(([foreground, scope, fontStyle]) => ({
        scope,
        settings: fontStyle ? { foreground, fontStyle } : { foreground },
    })),
};
