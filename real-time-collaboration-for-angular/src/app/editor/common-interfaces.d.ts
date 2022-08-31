/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

declare global {
	interface Window { CKBox: any }
}

export interface CloudServicesConfig {
	webSocketUrl: string;
	tokenUrl: string;
	ckboxTokenUrl: string;
}
