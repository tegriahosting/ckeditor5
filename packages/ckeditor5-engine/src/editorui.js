/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import Controller from './ui/controller.js';
import utils from './utils.js';
import ObservableMixin from './observablemixin.js';

/**
 * Base class for the editor main view controllers.
 *
 * @memberOf core
 * @extends core.ui.Controller
 * @mixes core.ObservableMixin
 */

export default class EditorUI extends Controller {
	constructor( editor ) {
		super();

		/**
		 * @readonly
		 * @member {core.Editor} core.EditorUI.editor
		 */
		this.editor = editor;
	}
}

utils.mix( EditorUI, ObservableMixin );
