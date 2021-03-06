const extensionNamespace = typeof browser !== 'undefined' ? browser : chrome;

extensionNamespace.webRequest.onBeforeRequest.addListener((details) => {
    const searchTerms = new URLSearchParams(new URL(details.url).search).get('q');
    // don't redirect iframes
    if (details.frameId !== 0) {
        return;
    }
    return {
        redirectUrl: `https://jisho.org/search/${encodeURIComponent(trim(searchTerms))}`
    }
}, {
    urls: [
        'https://google.co.jp/search*',
        'https://www.google.co.jp/search*',
    ]
}, ['blocking']);

function trim(phrase) {
    const remove = regex => {
        phrase = phrase.replace(regex, '');
    };
    phrase = phrase.trim();

    //dangling punctuation/symbols from the previous sentence
    remove(/^[。、！]/);
    //dangling commas
    remove(/[、]$/);

    //if they look up something in english don't count that as a word to review (they can look up the result if they really want it to show up)
    remove(/^[\w\d\s]*$/);


    //remove messy copying (extra punctuation for other sentences), and remove quotes when they're not necessary for the quote.
    //we don't want to remove quotes if it's something like "「うるさいだまれ」って言った" because it changes the meaning.
    [   ['「', '」'],
        ['『', '』'],
        ['【', '】'],
    ].forEach(([open, close]) => {
        const leadingOpen = new RegExp('^' + open),
            leadingClose = new RegExp('^' + close),
            trailingClose = new RegExp(close + '$'),
            trailingOpen = new RegExp(open + '$');

        //starts with an opening quote but doesn't have any closing quotes, assume only part of a quote was selected, no need to keep in quotes
        if (leadingOpen.test(phrase) && !phrase.includes(close)) {
            remove(leadingOpen);
        }
        //same with closing quote
        if (trailingClose.test(phrase) && !phrase.includes(open)) {
            remove(trailingClose);
        }

        //a full quote with quote marks was included and nothing outside it, just remove the quote, it's unnecessary
        if (leadingOpen.test(phrase) && trailingClose.test(phrase)) {
            remove(leadingOpen);
            remove(trailingClose);
        }

        //remove any quotes for quotes that weren't included in the phrase
        remove(trailingOpen);
        remove(leadingClose);
    });

    //some books like 転スラ use fancy quote characters that look like boxes to me everywhere, replace them!
    phrase = phrase.replace(/□/g, '"');

    return phrase;
}
