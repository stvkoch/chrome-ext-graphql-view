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


export default function Column({children, isSidebar, ...props}) {
  return (
    <div
      className={cl(
        'column',
        isSidebar && 'is-one-fifth',
        ...Object.keys(props),
      )}>
      {children}
    </div>
  );
}