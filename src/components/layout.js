import React from 'react';

import Columns from './columns';
import {
  match,
  subscribe,
  publish,
  unsubscribe,
  cancel,
  cl,
  toLw,
  noop
} from '../utils';

export default function Layout({children}) {
  return (
    <div className="max-height container is-fluid ">
      <Columns>{children}</Columns>
    </div>
  );
}
