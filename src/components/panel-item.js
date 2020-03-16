// This one acts in the context of the panel in the Dev Tools
//
// Can use
// chrome.devtools.*
// chrome.extension.*

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

export default function PanelItem({operation, onClick = noop, selected: isSelected}) {
  const operationIconQuery =
    !match(operation.type, 'mutation') && 'fa-file-alt';
  const operationIconMutation =
    !operationIconQuery && 'fa-file-signature';

  return (
    <a
      className={`panel-block ${isSelected && 'is-active'}`}
      onClick={() => onClick(operation)}>
      <span className="panel-icon">
        <i
          className={`fas ${operationIconQuery} ${operationIconMutation}`}
          aria-hidden="true"
        />
      </span>
      {operation.name}
    </a>
  );
}
