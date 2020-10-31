import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {Migrator} from './migrator';

export function migrator(_options: any): Rule {

  return (tree: Tree, _context: SchematicContext) => {
    new Migrator(_context.logger).migrateProject();
    return tree;
  };

}
