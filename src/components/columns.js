import React from 'react';

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

export default function Columns({children}) {
  return <div className={cl('columns')}>{children}</div>;
}