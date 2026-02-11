/**
 * Mapping of frontend IDs to SAP HANA stored procedures
 * Each ID is mapped to its corresponding procedure file
 */

// Import all procedure handlers
import * as proc257 from '../procedures/id-257.js';
import * as proc261 from '../procedures/id-261.js';
import * as proc262 from '../procedures/id-262.js';
import * as proc263 from '../procedures/id-263.js';
import * as proc264 from '../procedures/id-264.js';
import * as proc265 from '../procedures/id-265.js';
import * as proc266 from '../procedures/id-266.js';
import * as proc267 from '../procedures/id-267.js';
import * as proc268 from '../procedures/id-268.js';
import * as proc269 from '../procedures/id-269.js';
import * as proc270 from '../procedures/id-270.js';
import * as proc271 from '../procedures/id-271.js';
import * as proc272 from '../procedures/id-272.js';
import * as proc277 from '../procedures/id-277.js';
import * as proc278 from '../procedures/id-278.js';
import * as proc279 from '../procedures/id-279.js';

export function getStoredProcedureMapping(id) {
  const mappings = {
    257: { procedureName: proc257.procedureName, buildParams: proc257.buildParams },
    261: { procedureName: proc261.procedureName, buildParams: proc261.buildParams },
    262: { procedureName: proc262.procedureName, buildParams: proc262.buildParams },
    263: { procedureName: proc263.procedureName, buildParams: proc263.buildParams },
    264: { procedureName: proc264.procedureName, buildParams: proc264.buildParams },
    265: { procedureName: proc265.procedureName, buildParams: proc265.buildParams },
    266: { procedureName: proc266.procedureName, buildParams: proc266.buildParams },
    267: { procedureName: proc267.procedureName, buildParams: proc267.buildParams },
    268: { procedureName: proc268.procedureName, buildParams: proc268.buildParams },
    269: { procedureName: proc269.procedureName, buildParams: proc269.buildParams },
    270: { procedureName: proc270.procedureName, buildParams: proc270.buildParams },
    271: { procedureName: proc271.procedureName, buildParams: proc271.buildParams },
    272: { procedureName: proc272.procedureName, buildParams: proc272.buildParams },
    277: { procedureName: proc277.procedureName, buildParams: proc277.buildParams },
    278: { procedureName: proc278.procedureName, buildParams: proc278.buildParams },
    279: { procedureName: proc279.procedureName, buildParams: proc279.buildParams }
  };

  return mappings[id] || null;
}

