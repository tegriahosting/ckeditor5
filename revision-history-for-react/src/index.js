/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

const root = createRoot( document.getElementById( 'root' ) );
root.render( <App /> );
