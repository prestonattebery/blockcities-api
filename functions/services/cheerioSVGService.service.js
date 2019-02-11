const _ = require('lodash');

class CheerioSVGService {

    process (svgXml, exteriorFill = {}, windowsFill = {}, concreteFill = {}) {
        const $ = require('cheerio').load(svgXml, {xmlMode: true});

        _.forEach(exteriorFill.left, (v, k) => {$(`.exterior-L-${k}`).attr('fill', v)});
        _.forEach(exteriorFill.right, (v, k) => $(`.exterior-R-${k}`).attr('fill', v));
        _.forEach(exteriorFill.top, (v, k) => $(`.top-${k}`).attr('fill', v));

        _.forEach(windowsFill.left, (v, k) => $(`.window-L-${k}`).attr('fill', v));
        _.forEach(windowsFill.right, (v, k) => $(`.window-R-${k}`).attr('fill', v));

        // FIXME if darkgrey exterior then dark concrete
        _.forEach(concreteFill.classic, (v, k) => $(`.concrete-${k}`).attr('fill', v));

        let anchorElement = $('[id^=anchor-01_]').first();
        let anchor = undefined;

        if (anchorElement && anchorElement.attr('id')) {
            anchor = anchorElement.attr('id').split('_')[1];
        }

        return {
            svg: $.xml(),
            anchor: anchor
        };
    }
}

module.exports = new CheerioSVGService();
