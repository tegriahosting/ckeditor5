/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import React, { Component } from 'react';
import ConfigurationDialog from './configuration-dialog/configuration-dialog';
import Sample from './sample';

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
		console.log(this.state.configuration);
		// Configuration data needed to initialize the editor is available only after the configuration dialog
		// is submitted, hence the editor is initialized after ConfigurationDialog returns the configuration.
		if ( !this.state.configuration ) {
			return <ConfigurationDialog onSubmit={ configuration => this.setState( { configuration } ) } />;
		}

		return <Sample configuration={ this.state.configuration } />;
	}
}
