/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import React, { Component } from 'react';
import ConfigurationDialog from './configuration-dialog/configuration-dialog';
import EditorComponent from './EditorComponent';
import { enableColab } from './editor/ckeditor.js';
export default class App extends Component {
	state = {
		configuration: {
			"tokenUrl": "https://92239.cke-cs.com/token/dev/ccXk0A5aIBBVjxR9ghn7Xq7gPNfRiEr5Eyab?user.id=e1&user.name=Tom Rowling&user.avatar=https://randomuser.me/api/portraits/men/30.jpg&role=writer",
			"ckboxTokenUrl": "",
			"webSocketUrl": "wss://92239.cke-cs.com/ws",
			"channelId": "8sv2ig1gtc"
		}
	};

	render() {
		if (!enableColab)
			return <EditorComponent/>;

		console.log(this.state.configuration);
		// Configuration data needed to initialize the editor is available only after the configuration dialog
		// is submitted, hence the editor is initialized after ConfigurationDialog returns the configuration.
		if ( !this.state.configuration ) {
			return <ConfigurationDialog onSubmit={ configuration => this.setState( { configuration } ) } />;
		}

		return <EditorComponent configuration={ this.state.configuration }/>;
	}
}
