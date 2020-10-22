const {parse, stringify} = require('scss-parser');
const createQueryWrapper = require('query-ast');


export class CssUtil {

  public static encapsulateClasses(styleFileContent: string, classesToEncapsulate): string {
    const astCss = parse(this.addMissingSemicolons(styleFileContent));
    const $ = createQueryWrapper(astCss);

    classesToEncapsulate.forEach(className => {
      const parentSelector = this.getSelectorByClassName($, className);
      if (parentSelector.nodes.length > 0 && !this.hasHostAndDeepSelectors(parentSelector)) {
        const selectorElements = parentSelector.nodes[0].node.value;
        selectorElements.unshift(this.createSelector('space', ' '));
        selectorElements.unshift(this.createSelector('pseudo_class', ':ng-deep'));
        selectorElements.unshift(this.createSelector('space', ' '));
        selectorElements.unshift(this.createSelector('pseudo_class', 'host'));
      }
    });

    return stringify(astCss);
  }

  private static getSelectorByClassName($, className: string) {
    return $((n) => n.node.value === className)
      .closest('selector');
  }

  private static hasHostAndDeepSelectors($): boolean {
    return $
      .has(e => e.node.value === 'host')
      .has(e => e.node.value === 'ng-deep').nodes.length > 0;
  }

  private static createSelector = (type: string, value: string) => ({type, value: [{type: 'identifier', value}]});

  private static addMissingSemicolons(cssContent: string): string {
    return cssContent.replace(/(^[^}]\s+[^/]\S+:.+)([^/{\r\n;,])$/gm, '$1$2;');
  }

}
